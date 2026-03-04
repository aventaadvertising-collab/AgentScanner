// ============================================================
// HACKER NEWS SCANNER
// Polls HN Firebase API for AI-related Show HN posts
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";

const SHOW_HN_URL = "https://hacker-news.firebaseio.com/v0/showstories.json";
const ITEM_URL = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const MAX_ITEMS = 30;

export async function scanHackerNews(lastItemId) {
  // 1. Fetch Show HN story IDs
  let storyIds;
  try {
    const res = await fetch(SHOW_HN_URL);
    if (!res.ok) {
      console.log(`[Scanner:HN] Show HN fetch ${res.status}`);
      return { discoveries: [], newLastItemId: lastItemId };
    }
    storyIds = await res.json();
  } catch (err) {
    console.log(`[Scanner:HN] Show HN fetch error: ${err.message}`);
    return { discoveries: [], newLastItemId: lastItemId };
  }

  if (!Array.isArray(storyIds) || storyIds.length === 0) {
    return { discoveries: [], newLastItemId: lastItemId };
  }

  // 2. Take newest items, filter by watermark
  const lastId = lastItemId ? parseInt(lastItemId, 10) : 0;
  const newIds = storyIds
    .slice(0, MAX_ITEMS)
    .filter((id) => id > lastId);

  if (newIds.length === 0) {
    return { discoveries: [], newLastItemId: lastItemId };
  }

  const newLastItemId = String(Math.max(...newIds));

  // 3. Fetch each story item
  const discoveries = [];
  const fetches = newIds.map(async (id) => {
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

    // Classify on title + URL
    const text = `${story.title} ${story.url || ""}`;
    const { score, matchedKeywords } = classifyAI(text);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(story.title, story.url || "", []);

    discoveries.push({
      external_id: `hn:${story.id}`,
      source: "hackernews",
      name: story.title.replace(/^Show HN:\s*/i, "").slice(0, 200),
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
      topics: [],
      license: null,
      source_created_at: story.time
        ? new Date(story.time * 1000).toISOString()
        : null,
    });
  }

  console.log(
    `[Scanner:HN] ${newIds.length} new stories → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastItemId };
}
