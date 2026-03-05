// ============================================================
// DEV.TO SCANNER
// Polls Dev.to public API for AI-related articles with products
// Free, no API key needed
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const DEVTO_API = "https://dev.to/api/articles";

// Search queries that surface AI product announcements
const QUERIES = [
  "ai agent",
  "llm tool",
  "machine learning launch",
  "open source ai",
  "gpt model",
  "langchain",
  "ai framework",
  "vector database",
];

export async function scanDevTo(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const discoveries = [];
  const seen = new Set();

  // Fetch from multiple queries in parallel
  const queryPromises = QUERIES.map(async (tag) => {
    if (!timer.hasTime()) return [];
    try {
      const url = `${DEVTO_API}?per_page=15&tag=${encodeURIComponent(tag.replace(/ /g, ""))}&state=fresh`;
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

  // Also grab top recent articles
  queryPromises.push(
    (async () => {
      if (!timer.hasTime()) return [];
      try {
        const res = await fetchWithRetry(`${DEVTO_API}?per_page=25&top=1`, {
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
    })()
  );

  const results = await Promise.allSettled(queryPromises);
  const allArticles = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const article of allArticles) {
    if (!timer.hasTime()) break;
    if (!article.title) continue;
    if (seen.has(article.id)) continue;
    seen.add(article.id);

    // Filter by date
    const pubDate = article.published_at || article.created_at;
    if (pubDate && new Date(pubDate) < cutoff) continue;

    // Classify
    const tags = (article.tag_list || []).join(" ");
    const text = `${article.title} ${article.description || ""} ${tags}`;
    const { score, matchedKeywords } = classifyAI(text, article.title);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(
      article.title,
      article.description || "",
      article.tag_list || []
    );

    // Look for GitHub URLs in the article (common for launches)
    const githubMatch = article.description?.match(
      /(https?:\/\/github\.com\/[^\s,.)]+)/i
    );

    discoveries.push({
      external_id: `devto:${article.id}`,
      source: "devto",
      name: article.title.slice(0, 200),
      description: (article.description || "").slice(0, 500),
      url: githubMatch?.[1] || article.url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: article.positive_reactions_count || 0,
      language: null,
      author: article.user?.name || article.user?.username || null,
      author_url: article.user?.username
        ? `https://dev.to/${article.user.username}`
        : null,
      topics: article.tag_list || [],
      license: null,
      source_created_at: pubDate || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:DevTo] ${allArticles.length} articles → ${discoveries.length} AI products`
  );

  return { discoveries, newLastScanAt };
}
