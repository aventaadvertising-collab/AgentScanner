// ============================================================
// CHROME WEB STORE SCANNER
// Searches Chrome Web Store for AI-related extensions
// Uses public search endpoint (no API key needed)
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SEARCH_QUERIES = [
  "ai assistant",
  "ai agent",
  "chatgpt",
  "copilot ai",
  "ai writing",
  "ai code",
  "llm",
  "ai summarizer",
];

const CWS_SEARCH_URL = "https://chromewebstore.google.com/search";

export async function scanChromeWebStore(lastScanAt) {
  const timer = createDeadline(8000);
  const discoveries = [];
  const seen = new Set();

  // 1 query per scan to stay lightweight
  const queryIdx = Math.floor(Date.now() / 60000) % SEARCH_QUERIES.length;
  const query = SEARCH_QUERIES[queryIdx];

  try {
    const res = await fetchWithRetry(
      `${CWS_SEARCH_URL}/${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AgentScreener/1.0)",
          Accept: "text/html",
        },
        timeout: 6000,
      }
    );

    if (!res.ok) {
      console.log(`[Scanner:CWS] HTTP ${res.status} for "${query}"`);
      return { discoveries: [], newLastScanAt: new Date().toISOString() };
    }

    const html = await res.text();
    const extensions = parseCWSResults(html);

    for (const ext of extensions) {
      if (!timer.hasTime()) break;
      if (seen.has(ext.id)) continue;
      seen.add(ext.id);

      // Classify
      const text = `${ext.name} ${ext.description || ""} browser extension chrome`;
      const { score, matchedKeywords } = classifyAI(text, ext.name);
      if (score < AI_THRESHOLD) continue;

      const category = categorize(ext.name, ext.description || "", [
        "browser-extension",
        "chrome",
      ]);

      discoveries.push({
        external_id: `cws:${ext.id}`,
        source: "chrome-webstore",
        name: ext.name.slice(0, 200),
        description: (ext.description || ext.name).slice(0, 500),
        url: `https://chromewebstore.google.com/detail/${ext.id}`,
        category,
        ai_keywords: matchedKeywords,
        ai_confidence: score,
        stars: ext.rating ? Math.round(ext.rating * 20) : 0, // 5-star → 100 scale
        forks: 0,
        downloads: ext.users || 0,
        upvotes: 0,
        language: "JavaScript",
        author: ext.author || null,
        author_url: null,
        topics: ["chrome-extension", "browser"],
        license: null,
        source_created_at: null,
      });
    }
  } catch (e) {
    console.log(`[Scanner:CWS] Error: ${e.message}`);
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:CWS] query "${query}" → ${discoveries.length} AI extensions`
  );

  return { discoveries, newLastScanAt };
}

/**
 * Parse Chrome Web Store search results HTML
 */
function parseCWSResults(html) {
  const extensions = [];

  // CWS extension IDs are 32-char alphanumeric strings
  const idPattern = /\/detail\/[^/]*\/([a-z]{32})/g;
  const ids = new Set();
  let match;

  while ((match = idPattern.exec(html)) !== null) {
    ids.add(match[1]);
  }

  for (const id of ids) {
    if (extensions.length >= 20) break;

    const idIdx = html.indexOf(id);
    if (idIdx === -1) continue;

    // Context window around the ID
    const ctx = html.substring(Math.max(0, idIdx - 800), idIdx + 800);

    // Extract extension name
    const nameMatch =
      ctx.match(/aria-label="([^"]{2,100})"/) ||
      ctx.match(/title="([^"]{2,100})"/) ||
      ctx.match(/>([A-Z][^<]{1,80})<\//);

    // Extract user count
    const usersMatch =
      ctx.match(/([\d,.]+[KMB]?)\+?\s*users/i) ||
      ctx.match(/([\d,.]+)\s*weekly/i);

    // Extract rating
    const ratingMatch = ctx.match(/(\d\.\d)\s*(?:stars?|rating)/i) ||
      ctx.match(/aria-label="[^"]*(\d\.\d)[^"]*star/i);

    // Extract author/developer
    const authorMatch =
      ctx.match(/(?:offered by|by)\s*:?\s*([^<"]{2,40})/i) ||
      ctx.match(/developer[^>]*>([^<]+)/i);

    // Extract short description
    const descMatch = ctx.match(/<div[^>]*>([^<]{10,200})<\/div>/);

    extensions.push({
      id,
      name: nameMatch?.[1]?.trim() || id,
      description: descMatch?.[1]?.trim() || null,
      users: parseUserCount(usersMatch?.[1]),
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
      author: authorMatch?.[1]?.trim() || null,
    });
  }

  return extensions;
}

function parseUserCount(str) {
  if (!str) return 0;
  const clean = str.replace(/[,+]/g, "").trim();
  if (clean.endsWith("B")) return parseFloat(clean) * 1e9;
  if (clean.endsWith("M")) return parseFloat(clean) * 1e6;
  if (clean.endsWith("K")) return parseFloat(clean) * 1e3;
  return parseInt(clean, 10) || 0;
}
