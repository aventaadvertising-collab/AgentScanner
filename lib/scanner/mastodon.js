// ============================================================
// MASTODON / FEDIVERSE SCANNER
// Scans AI-focused Mastodon instances for tool announcements
// Free public API — no auth required for public timelines
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

// Mastodon instances with significant AI/tech communities
const INSTANCES = [
  { host: "mastodon.social", tag: "ai" },
  { host: "mastodon.social", tag: "machinelearning" },
  { host: "mastodon.social", tag: "llm" },
  { host: "mastodon.social", tag: "opensource" },
  { host: "fosstodon.org", tag: "ai" },
  { host: "fosstodon.org", tag: "machinelearning" },
  { host: "techhub.social", tag: "ai" },
  { host: "sigmoid.social", tag: "machinelearning" },
];

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scanMastodon(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt
    ? new Date(lastScanAt)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const discoveries = [];
  const seen = new Set();

  const fetchPromises = INSTANCES.map(async ({ host, tag }) => {
    if (!timer.hasTime()) return [];
    try {
      const url = `https://${host}/api/v1/timelines/tag/${tag}?limit=20`;
      const res = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "AgentScreener-Scanner/1.0",
          Accept: "application/json",
        },
        timeout: 5000,
      });
      if (!res.ok) return [];
      const statuses = await res.json();
      return (statuses || []).map((s) => ({ ...s, _host: host, _tag: tag }));
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const allStatuses = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const status of allStatuses) {
    if (!timer.hasTime()) break;
    if (!status.content) continue;
    if (seen.has(status.id)) continue;
    seen.add(status.id);

    // Filter by date
    const createdAt = status.created_at;
    if (createdAt && new Date(createdAt) < cutoff) continue;

    // Skip replies and boosts
    if (status.in_reply_to_id || status.reblog) continue;

    const plainText = stripHtml(status.content);
    if (plainText.length < 20) continue;

    // Extract URLs from the post
    const urlMatch = plainText.match(/(https?:\/\/[^\s,)]+)/);
    const hasUrl = !!urlMatch;

    // Extract GitHub URLs specifically
    const githubMatch = plainText.match(
      /(https?:\/\/github\.com\/[^\s,.)]+)/i
    );

    // Build tags from hashtags
    const hashtags = (status.tags || []).map((t) => t.name);

    // Classify
    const text = `${plainText} ${hashtags.join(" ")}`;
    const { score, matchedKeywords } = classifyAI(text, plainText.slice(0, 100));

    // Posts with GitHub links or from AI instances get a boost
    const hasGithub = !!githubMatch;
    const boosted = hasGithub ? score + 0.15 : score;
    if (boosted < AI_THRESHOLD) continue;

    // Create a readable title from the post
    const title = plainText.split(/[.!?\n]/)[0]?.trim().slice(0, 200) || plainText.slice(0, 200);

    const category = categorize(title, plainText, hashtags);

    discoveries.push({
      external_id: `mastodon:${status.id}`,
      source: "mastodon",
      name: title,
      description: plainText.slice(0, 500),
      url: githubMatch?.[1] || urlMatch?.[1] || status.url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: Math.min(boosted, 1),
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: (status.favourites_count || 0) + (status.reblogs_count || 0),
      language: status.language || null,
      author: status.account?.display_name || status.account?.username || null,
      author_url: status.account?.url || null,
      topics: hashtags.slice(0, 10),
      license: null,
      source_created_at: createdAt || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:Mastodon] ${allStatuses.length} statuses → ${discoveries.length} AI posts`
  );

  return { discoveries, newLastScanAt };
}
