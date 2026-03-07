// ============================================================
// GITHUB DISCUSSIONS SCANNER
// Finds AI-related discussions in popular repos via GitHub Search API
// Uses existing GITHUB_TOKEN — shows community engagement signal
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

// Search queries for AI discussions
const DISCUSSION_QUERIES = [
  "ai agent",
  "llm integration",
  "machine learning model",
  "transformer architecture",
  "vector embedding",
  "RAG retrieval",
  "fine tuning",
  "prompt engineering",
];

export async function scanGitHubDiscussions(lastScanAt, token) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt
    ? new Date(lastScanAt)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const discoveries = [];
  const seen = new Set();

  if (!token) {
    console.log("[Scanner:GitHubDiscussions] No GITHUB_TOKEN — skipping");
    return { discoveries, newLastScanAt: new Date().toISOString() };
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener-Scanner/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Use GitHub Search API for issues/discussions mentioning AI topics
  // (GitHub doesn't have a direct Discussion Search REST API,
  //  so we search issues + pull requests as community engagement proxy)
  const queryPromises = DISCUSSION_QUERIES.slice(0, 4).map(async (query) => {
    if (!timer.hasTime()) return [];
    try {
      const since = cutoff.toISOString().slice(0, 10);
      const q = `"${query}" is:open created:>${since} comments:>2`;
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=10`;
      const res = await fetchWithRetry(url, { headers, timeout: 6000 });
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(queryPromises);
  const allIssues = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const issue of allIssues) {
    if (!timer.hasTime()) break;
    if (!issue.title) continue;
    if (seen.has(issue.id)) continue;
    seen.add(issue.id);

    // Extract repo name from URL
    const repoMatch = issue.html_url?.match(/github\.com\/([^/]+\/[^/]+)\//);
    const repoName = repoMatch ? repoMatch[1] : null;

    // Filter by date
    const createdAt = issue.created_at;
    if (createdAt && new Date(createdAt) < cutoff) continue;

    // Classify
    const labels = (issue.labels || []).map((l) => l.name).join(" ");
    const text = `${issue.title} ${issue.body?.slice(0, 200) || ""} ${labels} ${repoName || ""}`;
    const { score, matchedKeywords } = classifyAI(text, issue.title);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(
      issue.title,
      issue.body?.slice(0, 200) || "",
      (issue.labels || []).map((l) => l.name)
    );

    // Is it a PR or issue? Both are valuable signals
    const isPR = !!issue.pull_request;
    const typeLabel = isPR ? "PR" : "Discussion";

    discoveries.push({
      external_id: `gh-discuss:${issue.id}`,
      source: "github-discussions",
      name: `${repoName || ""}: ${issue.title}`.trim().slice(0, 200),
      description: (issue.body || issue.title || "").slice(0, 500),
      url: issue.html_url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: issue.comments || 0, // comments as engagement proxy
      language: null,
      author: issue.user?.login || null,
      author_url: issue.user?.html_url || null,
      topics: [typeLabel, ...(issue.labels || []).map((l) => l.name)].slice(0, 10),
      license: null,
      source_created_at: createdAt || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:GitHubDiscussions] ${allIssues.length} issues → ${discoveries.length} AI discussions`
  );

  return { discoveries, newLastScanAt };
}
