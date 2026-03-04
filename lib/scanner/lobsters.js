// ============================================================
// LOBSTERS SCANNER
// Polls Lobsters (lobste.rs) for AI/ML submissions
// Free public JSON API — no auth required
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const LOBSTERS_URL = "https://lobste.rs";

export async function scanLobsters(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt
    ? new Date(lastScanAt).getTime() / 1000
    : 0;
  const discoveries = [];
  const seen = new Set();

  // Fetch newest and AI-tagged stories
  const endpoints = [
    `${LOBSTERS_URL}/newest.json`,
    `${LOBSTERS_URL}/t/ai.json`,
    `${LOBSTERS_URL}/t/ml.json`,
  ];

  const fetchPromises = endpoints.map(async (url) => {
    if (!timer.hasTime()) return [];
    try {
      const res = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "AgentScreener-Scanner/1.0",
          Accept: "application/json",
        },
        timeout: 6000,
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const allStories = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const story of allStories) {
    if (!timer.hasTime()) break;
    if (!story.title) continue;
    if (seen.has(story.short_id)) continue;
    seen.add(story.short_id);

    // Filter by date
    const createdAt = story.created_at
      ? new Date(story.created_at).getTime() / 1000
      : 0;
    if (createdAt && createdAt < cutoff) continue;

    // Only consider stories with external URLs (not just discussions)
    const storyUrl =
      story.url && !story.url.includes("lobste.rs") ? story.url : null;

    // Classify
    const tags = (story.tags || []).join(" ");
    const text = `${story.title} ${story.description || ""} ${tags} ${storyUrl || ""}`;
    const { score, matchedKeywords } = classifyAI(text, story.title);

    // AI/ML tag boost
    const isAITagged = (story.tags || []).some((t) =>
      /^(ai|ml|machinelearning|llm|nlp|deeplearning)$/i.test(t)
    );
    const threshold = isAITagged ? 0.15 : AI_THRESHOLD;
    if (score < threshold) continue;

    const category = categorize(story.title, story.description || "", story.tags || []);

    discoveries.push({
      external_id: `lobsters:${story.short_id}`,
      source: "lobsters",
      name: story.title.slice(0, 200),
      description: (story.description || story.title).slice(0, 500),
      url: storyUrl || story.comments_url || `${LOBSTERS_URL}/s/${story.short_id}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: Math.min(isAITagged ? score + 0.1 : score, 1),
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: story.score || 0,
      language: null,
      author: story.submitter_user?.username || null,
      author_url: story.submitter_user?.username
        ? `${LOBSTERS_URL}/u/${story.submitter_user.username}`
        : null,
      topics: story.tags || [],
      license: null,
      source_created_at: story.created_at || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:Lobsters] ${allStories.length} stories → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastScanAt };
}
