// ============================================================
// iOS APP STORE SCANNER
// Searches Apple App Store for AI-related apps via iTunes Search API
// Free public API, no auth required
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SEARCH_QUERIES = [
  "ai assistant",
  "ai chatbot",
  "ai image generator",
  "llm chat",
  "ai voice",
  "ai writing tool",
  "ai photo editor",
  "ai agent",
];

// iTunes Search API — free, no auth, 20 calls/min
const ITUNES_SEARCH = "https://itunes.apple.com/search";

export async function scanAppStore(lastScanAt) {
  const timer = createDeadline(8000);
  const discoveries = [];
  const seen = new Set();

  // 2 queries per scan, rotate through list
  const startIdx = Math.floor(Date.now() / 60000) % SEARCH_QUERIES.length;
  const queries = [
    SEARCH_QUERIES[startIdx],
    SEARCH_QUERIES[(startIdx + 1) % SEARCH_QUERIES.length],
  ];

  for (const query of queries) {
    if (!timer.hasTime()) break;

    try {
      const params = new URLSearchParams({
        term: query,
        media: "software",
        entity: "software",
        limit: "25",
        country: "us",
      });

      const res = await fetchWithRetry(
        `${ITUNES_SEARCH}?${params}`,
        {
          headers: { "User-Agent": "AgentScreener-Scanner/1.0" },
          timeout: 6000,
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const results = data?.results || [];

      for (const app of results) {
        if (!timer.hasTime()) break;

        const appId = String(app.trackId);
        if (seen.has(appId)) continue;
        seen.add(appId);

        // Build text for classification
        const text = [
          app.trackName,
          app.description || "",
          ...(app.genres || []),
        ].join(" ");

        const { score, matchedKeywords } = classifyAI(text, app.trackName);
        if (score < AI_THRESHOLD) continue;

        const category = categorize(
          app.trackName,
          app.description || "",
          app.genres || []
        );

        discoveries.push({
          external_id: `appstore:${appId}`,
          source: "appstore",
          name: app.trackName?.slice(0, 200) || "Unknown",
          description: (app.description || "").slice(0, 500),
          url:
            app.trackViewUrl ||
            `https://apps.apple.com/app/id${appId}`,
          category,
          ai_keywords: matchedKeywords,
          ai_confidence: score,
          stars: app.averageUserRating
            ? Math.round(app.averageUserRating * 20)
            : 0, // 5-star → 100 scale
          forks: 0,
          downloads: app.userRatingCount || 0, // Rating count as proxy
          upvotes: 0,
          language: null,
          author: app.artistName || null,
          author_url: app.artistViewUrl || null,
          topics: [...(app.genres || []).map((g) => g.toLowerCase()), "ios", "mobile-app"],
          license: app.price === 0 ? "free" : "paid",
          source_created_at: app.releaseDate || null,
        });
      }
    } catch (e) {
      console.log(`[Scanner:AppStore] Error for "${query}": ${e.message}`);
    }
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:AppStore] ${queries.length} queries → ${discoveries.length} AI apps`
  );

  return { discoveries, newLastScanAt };
}
