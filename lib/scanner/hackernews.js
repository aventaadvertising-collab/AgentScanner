// ============================================================
// HACKER NEWS SCANNER v2
// Polls HN Firebase API for AI-related posts
// Scans: Show HN, Top Stories, and New Stories
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { createDeadline } from "./utils";

const SHOW_HN_URL = "https://hacker-news.firebaseio.com/v0/showstories.json";
const TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const NEW_URL = "https://hacker-news.firebaseio.com/v0/newstories.json";
const ITEM_URL = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const MAX_ITEMS_PER_LIST = 30;

export async function scanHackerNews(lastItemId) {
  const timer = createDeadline(12000); // 12s budget

  // 1. Fetch all three story lists in parallel
  const [showRes, topRes, newRes] = await Promise.allSettled([
    fetch(SHOW_HN_URL).then((r) => (r.ok ? r.json() : [])),
    fetch(TOP_URL).then((r) => (r.ok ? r.json() : [])),
    fetch(NEW_URL).then((r) => (r.ok ? r.json() : [])),
  ]);

  const showIds = showRes.status === "fulfilled" ? showRes.value : [];
  const topIds = topRes.status === "fulfilled" ? topRes.value : [];
  const newIds = newRes.status === "fulfilled" ? newRes.value : [];

  // 2. Merge and dedupe story IDs, take newest first
  const seen = new Set();
  const allIds = [];

  // Show HN gets priority (most likely to be products)
  for (const id of showIds.slice(0, MAX_ITEMS_PER_LIST)) {
    if (!seen.has(id)) { seen.add(id); allIds.push(id); }
  }
  // Top stories (high visibility AI products)
  for (const id of topIds.slice(0, 20)) {
    if (!seen.has(id)) { seen.add(id); allIds.push(id); }
  }
  // New stories (catch fresh launches)
  for (const id of newIds.slice(0, 20)) {
    if (!seen.has(id)) { seen.add(id); allIds.push(id); }
  }

  // 3. Filter by watermark
  const lastId = lastItemId ? parseInt(lastItemId, 10) : 0;
  const candidateIds = allIds.filter((id) => id > lastId);

  if (candidateIds.length === 0) {
    return { discoveries: [], newLastItemId: lastItemId };
  }

  const newLastItemId = String(Math.max(...candidateIds));

  // 4. Fetch stories in parallel
  const discoveries = [];
  const fetches = candidateIds.map(async (id) => {
    if (!timer.hasTime()) return null;
    try {
      const res = await fetch(ITEM_URL(id));
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  });

  const stories = (await Promise.allSettled(fetches))
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  for (const story of stories) {
    if (!story.title) continue;

    // Classify
    const text = `${story.title} ${story.url || ""}`;
    const { score, matchedKeywords } = classifyAI(text);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(story.title, story.url || "", []);

    discoveries.push({
      external_id: `hn:${story.id}`,
      source: "hackernews",
      name: story.title.replace(/^Show HN:\s*/i, "").replace(/^Ask HN:\s*/i, "").slice(0, 200),
      description: story.title.slice(0, 500),
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: story.score || 0,
      language: null,
      author: story.by || null,
      author_url: story.by
        ? `https://news.ycombinator.com/user?id=${story.by}`
        : null,
      topics: story.title.startsWith("Show HN") ? ["show-hn"] : [],
      license: null,
      source_created_at: story.time
        ? new Date(story.time * 1000).toISOString()
        : null,
    });
  }

  console.log(
    `[Scanner:HN] ${candidateIds.length} stories (${showIds.length} show + ${topIds.length} top + ${newIds.length} new) → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastItemId };
}
