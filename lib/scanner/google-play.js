// ============================================================
// GOOGLE PLAY STORE SCANNER
// Searches Google Play for AI-related apps
// Uses public search endpoint (no API key needed)
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SEARCH_QUERIES = [
  "ai assistant",
  "ai chatbot",
  "ai image generator",
  "llm chat",
  "ai voice assistant",
  "ai writing",
  "ai code assistant",
  "ai agent",
];

const PLAY_SEARCH_URL = "https://play.google.com/store/search";

export async function scanGooglePlay(lastScanAt) {
  const timer = createDeadline(10000);
  const discoveries = [];
  const seen = new Set();

  // Rotate through queries (2 per scan to stay lightweight)
  const startIdx = Math.floor(Date.now() / 60000) % SEARCH_QUERIES.length;
  const queries = [
    SEARCH_QUERIES[startIdx],
    SEARCH_QUERIES[(startIdx + 1) % SEARCH_QUERIES.length],
  ];

  for (const query of queries) {
    if (!timer.hasTime()) break;

    try {
      // Google Play search returns HTML — we parse the structured data from it
      const res = await fetchWithRetry(
        `${PLAY_SEARCH_URL}?q=${encodeURIComponent(query)}&c=apps&hl=en&gl=us`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AgentScreener/1.0)",
            Accept: "text/html",
          },
          timeout: 6000,
        }
      );

      if (!res.ok) continue;
      const html = await res.text();

      // Extract app data from the page
      const apps = parsePlayStoreResults(html);

      for (const app of apps) {
        if (!timer.hasTime()) break;
        if (seen.has(app.id)) continue;
        seen.add(app.id);

        // Classify
        const text = `${app.name} ${app.developer} ${app.description || ""}`;
        const { score, matchedKeywords } = classifyAI(text, app.name);
        if (score < AI_THRESHOLD) continue;

        const category = categorize(app.name, app.description || "", []);

        discoveries.push({
          external_id: `gplay:${app.id}`,
          source: "google-play",
          name: app.name.slice(0, 200),
          description: (app.description || app.name).slice(0, 500),
          url: `https://play.google.com/store/apps/details?id=${app.id}`,
          category,
          ai_keywords: matchedKeywords,
          ai_confidence: score,
          stars: Math.round((app.rating || 0) * 20), // 5-star → 100 scale
          forks: 0,
          downloads: parseInstalls(app.installs),
          upvotes: 0,
          language: null,
          author: app.developer || null,
          author_url: app.developerUrl || null,
          topics: ["android", "mobile-app"],
          license: null,
          source_created_at: null, // Play Store doesn't expose creation date in search
        });
      }
    } catch (e) {
      console.log(`[Scanner:GooglePlay] Error for "${query}": ${e.message}`);
    }
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:GooglePlay] ${queries.length} queries → ${discoveries.length} AI apps`
  );

  return { discoveries, newLastScanAt };
}

/**
 * Parse Google Play Store search results from HTML
 * Extracts app name, developer, ID, rating, installs from page content
 */
function parsePlayStoreResults(html) {
  const apps = [];

  // Google Play search results contain structured data in script tags
  // Look for app cards pattern in the HTML
  const appPattern = /\/store\/apps\/details\?id=([a-zA-Z0-9_.]+)/g;
  const ids = new Set();
  let match;

  while ((match = appPattern.exec(html)) !== null) {
    ids.add(match[1]);
  }

  // Extract names and developer info from surrounding context
  // Play Store HTML has structured sections per app card
  for (const id of ids) {
    if (apps.length >= 20) break;

    // Try to find app name near the ID reference
    const idIdx = html.indexOf(id);
    if (idIdx === -1) continue;

    // Look at surrounding 2000 chars for name/developer context
    const ctx = html.substring(Math.max(0, idIdx - 1000), idIdx + 1000);

    // Extract name: typically in an aria-label or title attribute
    const nameMatch =
      ctx.match(/aria-label="([^"]{2,80})"/) ||
      ctx.match(/title="([^"]{2,80})"/) ||
      ctx.match(/>([A-Z][^<]{1,60})<\/span>/);

    // Extract developer name
    const devMatch = ctx.match(/by\s+([^<"]{2,40})/) ||
      ctx.match(/class="[^"]*developer[^"]*"[^>]*>([^<]+)/i);

    // Extract rating
    const ratingMatch = ctx.match(/(\d\.\d)\s*star/i) ||
      ctx.match(/rating[^>]*>(\d\.\d)/);

    // Extract installs
    const installMatch = ctx.match(/([\d,.]+[KMB+]*)\s*(?:downloads|installs)/i) ||
      ctx.match(/([\d,.]+\+?)\s*installs/i);

    apps.push({
      id,
      name: nameMatch?.[1] || id.split(".").pop() || id,
      developer: devMatch?.[1]?.trim() || null,
      developerUrl: null,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
      installs: installMatch?.[1] || null,
      description: null,
    });
  }

  return apps;
}

function parseInstalls(str) {
  if (!str) return 0;
  const clean = str.replace(/[+,]/g, "").trim();
  if (clean.endsWith("B")) return parseFloat(clean) * 1e9;
  if (clean.endsWith("M")) return parseFloat(clean) * 1e6;
  if (clean.endsWith("K")) return parseFloat(clean) * 1e3;
  return parseInt(clean, 10) || 0;
}
