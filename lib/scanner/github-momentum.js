// ============================================================
// GITHUB MOMENTUM SCANNER
// Discovers AI repos with accelerating commit activity
// Uses GitHub Search API + Stats API to find development surges
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { createDeadline } from "./utils";

const GITHUB_API = "https://api.github.com";

// 8 search queries — rotate 2 per run to stay under 30 search/min limit
const SEARCH_QUERIES = [
  "ai agent stars:>10 language:python",
  "llm framework stars:>5",
  "machine learning stars:>20 language:typescript",
  "transformer OR diffusion stars:>15",
  "langchain OR llamaindex OR autogen stars:>3",
  "embedding OR vector-database stars:>10",
  "chatbot OR copilot language:python stars:>8",
  "reinforcement-learning OR rlhf stars:>5",
];

function getQueriesForRun() {
  const minute = new Date().getMinutes();
  const offset = (minute % 4) * 2;
  return SEARCH_QUERIES.slice(offset, offset + 2);
}

async function ghSearchRepos(query, token) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const fullQuery = `${query} pushed:>${sevenDaysAgo}`;
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(fullQuery)}&sort=updated&per_page=15`;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchCommitActivity(owner, repo, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    let res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/stats/commit_activity`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    // GitHub returns 202 when computing stats for the first time
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/stats/commit_activity`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
    }
    if (!res.ok) return null;
    const raw = await res.json();
    if (!Array.isArray(raw)) return null;
    return raw.map((w) => ({ w: w.week, t: w.total, d: w.days }));
  } catch {
    return null;
  }
}

function calculateMomentum(weeks) {
  if (!weeks || weeks.length < 8) return 0;
  const recent4 = weeks.slice(-4).reduce((s, w) => s + w.t, 0);
  const prev4 = weeks.slice(-8, -4).reduce((s, w) => s + w.t, 0);
  return recent4 / Math.max(prev4, 1);
}

export async function scanGitHubMomentum(lastScanAt, supabase, token) {
  const timer = createDeadline(15000);
  const discoveries = [];
  const seen = new Set();
  const queries = getQueriesForRun();

  // Search for repos with recent pushes
  const searchPromises = queries.map((q) => ghSearchRepos(q, token));
  const searchResults = await Promise.allSettled(searchPromises);
  const allRepos = searchResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Deduplicate and take top 10 by stars
  const unique = [];
  for (const repo of allRepos) {
    if (!timer.hasTime()) break;
    if (seen.has(repo.full_name)) continue;
    seen.add(repo.full_name);
    unique.push(repo);
  }
  unique.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  const top = unique.slice(0, 10);

  // Fetch commit activity for top repos and calculate momentum
  const activityPromises = top.map(async (repo) => {
    if (!timer.hasTime()) return null;
    const [owner, name] = repo.full_name.split("/");
    const weeks = await fetchCommitActivity(owner, name, token);
    const momentum = calculateMomentum(weeks);
    return { repo, weeks, momentum };
  });

  const activities = (await Promise.allSettled(activityPromises))
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  // Cache commit activity in Supabase for instant heatmap loading
  if (supabase) {
    const cacheUpserts = activities
      .filter((a) => a.weeks)
      .map((a) => ({
        repo_path: a.repo.full_name,
        data: { weeks: a.weeks },
        fetched_at: new Date().toISOString(),
      }));
    if (cacheUpserts.length > 0) {
      await supabase
        .from("commit_activity_cache")
        .upsert(cacheUpserts, { onConflict: "repo_path" })
        .catch(() => {});
    }
  }

  // Build discoveries — only include repos with meaningful momentum
  for (const { repo, weeks, momentum } of activities) {
    const text = `${repo.name} ${repo.description || ""} ${repo.language || ""} ${(repo.topics || []).join(" ")}`;
    const { score, matchedKeywords } = classifyAI(text, repo.name);
    if (score < AI_THRESHOLD) continue;

    // Boost confidence by momentum
    const momentumBoost = momentum > 3 ? 0.2 : momentum > 1.5 ? 0.1 : 0;
    const confidence = Math.min(score + momentumBoost, 1);

    const recent4 = weeks
      ? weeks.slice(-4).reduce((s, w) => s + w.t, 0)
      : 0;
    const category = categorize(repo.name, repo.description || "", repo.topics || []);

    discoveries.push({
      external_id: `gh-momentum:${repo.full_name}`,
      source: "github-momentum",
      name: repo.name,
      description: (repo.description || "").slice(0, 500),
      url: repo.html_url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: confidence,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      downloads: 0,
      upvotes: recent4, // Recent 4-week commit count as "traction" signal
      language: repo.language,
      author: repo.owner?.login || "",
      author_url: repo.owner?.html_url || "",
      topics: [
        "momentum",
        ...(momentum > 2 ? ["surging"] : []),
        ...(repo.topics || []).slice(0, 5),
      ],
      license: repo.license?.spdx_id || null,
      source_created_at: repo.created_at,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:GH-Momentum] ${allRepos.length} searched → ${top.length} analyzed → ${discoveries.length} momentum AI projects`
  );

  return { discoveries, newLastScanAt };
}
