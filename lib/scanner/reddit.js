// ============================================================
// REDDIT SCANNER
// Polls AI subreddits for new product announcements
// Uses public .json endpoints (no auth required)
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SUBREDDITS = [
  "LocalLLaMA",
  "MachineLearning",
  "artificial",
  "StableDiffusion",
  "singularity",
];

export async function scanReddit(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt ? new Date(lastScanAt).getTime() / 1000 : 0;
  const discoveries = [];
  const seen = new Set();

  // Fetch from multiple subreddits in parallel
  const subPromises = SUBREDDITS.map(async (sub) => {
    if (!timer.hasTime()) return [];
    try {
      const res = await fetchWithRetry(
        `https://www.reddit.com/r/${sub}/new.json?limit=15`,
        {
          headers: {
            "User-Agent": "AgentScreener-Scanner/1.0 (AI product tracker)",
          },
          timeout: 6000,
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.data?.children || []).map((c) => ({
        ...c.data,
        _subreddit: sub,
      }));
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(subPromises);
  const allPosts = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const post of allPosts) {
    if (!timer.hasTime()) break;

    // Skip old posts
    if (post.created_utc && post.created_utc < cutoff) continue;

    // Skip self-posts with no URL (just discussions)
    const postUrl = post.url && !post.url.includes("reddit.com") ? post.url : null;

    // Unique by reddit ID
    if (seen.has(post.id)) continue;
    seen.add(post.id);

    // Classify on title + selftext
    const text = `${post.title || ""} ${post.selftext?.slice(0, 500) || ""} ${postUrl || ""}`;
    const { score, matchedKeywords } = classifyAI(text, post.title);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(post.title, post.selftext || "", []);

    // Clean title — remove common prefixes
    let name = (post.title || "")
      .replace(/^\[D\]\s*/i, "")
      .replace(/^\[P\]\s*/i, "")
      .replace(/^\[R\]\s*/i, "")
      .replace(/^\[N\]\s*/i, "")
      .slice(0, 200);

    discoveries.push({
      external_id: `reddit:${post._subreddit}:${post.id}`,
      source: "reddit",
      name,
      description: (post.selftext || post.title || "").slice(0, 500),
      url: postUrl || `https://www.reddit.com${post.permalink}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: post.score || 0,
      language: null,
      author: post.author || null,
      author_url: post.author
        ? `https://www.reddit.com/user/${post.author}`
        : null,
      topics: [post._subreddit],
      license: null,
      source_created_at: post.created_utc
        ? new Date(post.created_utc * 1000).toISOString()
        : null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:Reddit] ${allPosts.length} posts from ${SUBREDDITS.length} subs → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastScanAt };
}
