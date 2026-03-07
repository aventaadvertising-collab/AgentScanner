// ============================================================
// GITHUB RELEASES SCANNER
// Tracks new releases/versions from AI repos via GitHub API
// Uses existing GITHUB_TOKEN — no additional auth required
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

// AI-focused search queries to find repos with fresh releases
const SEARCH_QUERIES = [
  "topic:machine-learning",
  "topic:artificial-intelligence",
  "topic:llm",
  "topic:deep-learning",
  "topic:ai-agents",
  "topic:langchain",
  "topic:transformer",
  "topic:generative-ai",
];

export async function scanGitHubReleases(lastScanAt, token) {
  const timer = createDeadline(10000);
  const cutoff = lastScanAt
    ? new Date(lastScanAt)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const discoveries = [];
  const seen = new Set();

  if (!token) {
    console.log("[Scanner:GitHubReleases] No GITHUB_TOKEN — skipping");
    return { discoveries, newLastScanAt: new Date().toISOString() };
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener-Scanner/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Strategy: Search for repos with recent releases using GitHub Search API
  // Then fetch the latest release for each
  const queryPromises = SEARCH_QUERIES.slice(0, 4).map(async (topic) => {
    if (!timer.hasTime()) return [];
    try {
      const q = `${topic} pushed:>${cutoff.toISOString().slice(0, 10)} stars:>50`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&per_page=10`;
      const res = await fetchWithRetry(url, { headers, timeout: 6000 });
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  });

  const repoResults = await Promise.allSettled(queryPromises);
  const repos = repoResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Fetch latest release for each unique repo
  const uniqueRepos = [];
  for (const repo of repos) {
    if (seen.has(repo.full_name)) continue;
    seen.add(repo.full_name);
    uniqueRepos.push(repo);
  }

  const releasePromises = uniqueRepos.slice(0, 20).map(async (repo) => {
    if (!timer.hasTime()) return null;
    try {
      const url = `https://api.github.com/repos/${repo.full_name}/releases?per_page=1`;
      const res = await fetchWithRetry(url, { headers, timeout: 4000 });
      if (!res.ok) return null;
      const releases = await res.json();
      if (!releases.length) return null;

      const release = releases[0];
      const publishedAt = release.published_at || release.created_at;
      if (!publishedAt || new Date(publishedAt) < cutoff) return null;

      return { repo, release, publishedAt };
    } catch {
      return null;
    }
  });

  const releaseResults = await Promise.allSettled(releasePromises);

  for (const r of releaseResults) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const { repo, release, publishedAt } = r.value;

    // Classify as AI-related
    const desc = repo.description || "";
    const topics = (repo.topics || []).join(" ");
    const text = `${repo.full_name} ${desc} ${topics} ${release.name || ""} ${release.body || ""}`;
    const { score, matchedKeywords } = classifyAI(text, repo.full_name);
    if (score < AI_THRESHOLD * 0.8) continue; // slightly lower threshold since repo is already topic-filtered

    const category = categorize(repo.full_name, desc, repo.topics || []);
    const versionTag = release.tag_name || "";

    discoveries.push({
      external_id: `gh-release:${repo.full_name}:${versionTag}`,
      source: "github-releases",
      name: `${repo.name} ${versionTag}`.trim().slice(0, 200),
      description: (release.body || desc || "").slice(0, 500),
      url: release.html_url || `https://github.com/${repo.full_name}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: Math.min(score + 0.1, 1),
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      downloads: 0,
      upvotes: 0,
      language: repo.language || null,
      author: repo.owner?.login || null,
      author_url: repo.owner?.html_url || null,
      topics: repo.topics || [],
      license: repo.license?.spdx_id || null,
      source_created_at: publishedAt,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:GitHubReleases] ${uniqueRepos.length} repos checked → ${discoveries.length} new releases`
  );

  return { discoveries, newLastScanAt };
}
