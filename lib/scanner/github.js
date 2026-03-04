// ============================================================
// GITHUB EVENTS SCANNER v2
// Polls GitHub Events API for new AI-related repositories
// Uses parallel fetches + time budget + retry logic
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const EVENTS_URL = "https://api.github.com/events?per_page=100";

export async function scanGitHub(ghToken, lastEventId) {
  const timer = createDeadline(8000);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener-Scanner/1.0",
  };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

  // 1. Fetch public events
  let events = [];
  try {
    const res = await fetchWithRetry(EVENTS_URL, { headers });
    if (!res.ok) {
      console.log(`[Scanner:GitHub] Events API ${res.status}`);
      return { discoveries: [], newLastEventId: lastEventId };
    }
    events = await res.json();
  } catch (err) {
    console.log(`[Scanner:GitHub] Events fetch error: ${err.message}`);
    return { discoveries: [], newLastEventId: lastEventId };
  }

  // 2. Filter CreateEvent for new repositories
  const createEvents = events.filter(
    (e) => e.type === "CreateEvent" && e.payload?.ref_type === "repository"
  );

  // 3. Stop at watermark
  let newLastEventId = lastEventId;
  const candidates = [];
  for (const event of createEvents) {
    if (event.id === lastEventId) break;
    if (!newLastEventId || event.id > newLastEventId) newLastEventId = event.id;
    candidates.push(event);
  }

  if (candidates.length === 0) {
    return { discoveries: [], newLastEventId: newLastEventId || lastEventId };
  }

  // 4. Quick pre-filter on repo name
  const preFiltered = candidates.filter((e) => {
    const name = e.repo?.name?.toLowerCase() || "";
    const { score } = classifyAI(name, name.split("/").pop());
    return score >= 0.1;
  });

  // 5. Fetch full repo details in parallel with time budget
  const toFetch = preFiltered.slice(0, 15);
  const detailPromises = toFetch.map(async (event) => {
    if (!timer.hasTime()) return null;
    const repoName = event.repo?.name;
    if (!repoName) return null;

    try {
      const res = await fetchWithRetry(
        `https://api.github.com/repos/${repoName}`,
        { headers }
      );
      if (!res.ok) return null;
      const repo = await res.json();

      const text = [repo.name || "", repo.description || "", ...(repo.topics || [])].join(" ");
      const { score, matchedKeywords } = classifyAI(text, repo.name);
      if (score < AI_THRESHOLD) return null;

      const category = categorize(repo.name, repo.description, repo.topics);

      return {
        external_id: `github:${repoName}`,
        source: "github",
        name: repo.name,
        description: (repo.description || "").slice(0, 500),
        url: repo.html_url,
        category,
        ai_keywords: matchedKeywords,
        ai_confidence: score,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        downloads: 0,
        upvotes: 0,
        language: repo.language,
        author: repo.owner?.login,
        author_url: repo.owner?.html_url,
        topics: repo.topics || [],
        license: repo.license?.spdx_id || null,
        source_created_at: repo.created_at,
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(detailPromises);
  const discoveries = results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  console.log(
    `[Scanner:GitHub] ${candidates.length} new repos → ${preFiltered.length} pre-filtered → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastEventId };
}
