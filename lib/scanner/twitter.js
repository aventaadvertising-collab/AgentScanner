// ============================================================
// X/TWITTER SCANNER
// Polls Twitter API v2 recent search for AI product announcements
// Extracts linked products from tweets
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { createDeadline } from "./utils";

const API_BASE = "https://api.twitter.com/2";

// Search queries — rotate through them (1 per scan to stay within rate limits)
const SEARCH_QUERIES = [
  '"open source" (ai OR llm OR agent OR model) -is:retweet has:links -is:reply',
  '"just released" OR "just launched" (ai OR ml OR llm) -is:retweet has:links -is:reply',
  '"introducing" (ai agent OR llm OR framework OR sdk) -is:retweet has:links -is:reply',
  '"now available" (ai OR machine learning OR model) -is:retweet has:links -is:reply',
  '(#opensource OR #buildinpublic) (ai OR llm OR agent) -is:retweet has:links -is:reply',
  '"check out" (ai tool OR ai agent OR llm OR model) -is:retweet has:links -is:reply',
];

export async function scanTwitter(lastTweetId) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    console.log("[Scanner:Twitter] X_BEARER_TOKEN not set — skipping");
    return { discoveries: [], newLastTweetId: lastTweetId };
  }

  const timer = createDeadline(8000);

  // Rotate queries based on current minute
  const queryIdx = Math.floor(Date.now() / 60000) % SEARCH_QUERIES.length;
  const query = SEARCH_QUERIES[queryIdx];

  const params = new URLSearchParams({
    query,
    max_results: "25",
    "tweet.fields": "created_at,public_metrics,entities,author_id",
    "user.fields": "username,name",
    expansions: "author_id",
  });

  if (lastTweetId) {
    params.set("since_id", lastTweetId);
  }

  let data;
  try {
    const res = await fetch(`${API_BASE}/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 429) {
      console.log("[Scanner:Twitter] Rate limited — backing off");
      return { discoveries: [], newLastTweetId: lastTweetId };
    }
    if (!res.ok) {
      console.log(`[Scanner:Twitter] API error: ${res.status}`);
      return { discoveries: [], newLastTweetId: lastTweetId };
    }
    data = await res.json();
  } catch (e) {
    console.log(`[Scanner:Twitter] Fetch error: ${e.message}`);
    return { discoveries: [], newLastTweetId: lastTweetId };
  }

  const tweets = data?.data || [];
  const users = new Map(
    (data?.includes?.users || []).map((u) => [u.id, u])
  );

  if (tweets.length === 0) {
    return { discoveries: [], newLastTweetId: lastTweetId };
  }

  const newLastTweetId = tweets[0]?.id || lastTweetId;
  const discoveries = [];

  for (const tweet of tweets) {
    if (!timer.hasTime()) break;

    // Extract URLs from tweet entities
    const urls = (tweet.entities?.urls || [])
      .map((u) => u.expanded_url || u.url)
      .filter(Boolean)
      // Skip Twitter/X internal links
      .filter((u) => !u.includes("twitter.com") && !u.includes("x.com") && !u.includes("t.co"));

    if (urls.length === 0) continue;

    const productUrl = urls[0]; // Take the first external link
    const text = tweet.text || "";
    const user = users.get(tweet.author_id);
    const metrics = tweet.public_metrics || {};

    // Need minimum engagement to reduce noise
    const engagement = (metrics.like_count || 0) + (metrics.retweet_count || 0) * 2;
    if (engagement < 3) continue;

    // Classify the tweet text + URL
    const classifyText = `${text} ${productUrl}`;
    const { score, matchedKeywords } = classifyAI(classifyText);
    if (score < AI_THRESHOLD) continue;

    // Extract a clean name from the tweet
    const name = extractProductName(text, productUrl);
    if (!name) continue;

    const category = categorize(name, text, []);

    discoveries.push({
      external_id: `twitter:${tweet.id}`,
      source: "twitter",
      name: name.slice(0, 200),
      description: cleanTweetText(text).slice(0, 500),
      url: productUrl,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: engagement,
      language: null,
      author: user?.username || null,
      author_url: user?.username ? `https://x.com/${user.username}` : null,
      topics: [],
      license: null,
      source_created_at: tweet.created_at || null,
    });
  }

  console.log(
    `[Scanner:Twitter] ${tweets.length} tweets (query ${queryIdx}) → ${discoveries.length} AI products`
  );

  return { discoveries, newLastTweetId };
}

/**
 * Extract a product name from tweet text
 * Tries to find the product name before common patterns like "is now", "just released", etc.
 */
function extractProductName(text, url) {
  // Try to get name from URL first
  const urlName = extractNameFromUrl(url);

  // Clean up tweet text for name extraction
  const clean = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .trim();

  // Try common patterns
  const patterns = [
    /^(?:introducing|announcing|launching|check out|meet)\s+([A-Z][\w.+-]+(?:\s+[\w.+-]+){0,3})/i,
    /^([A-Z][\w.+-]+(?:\s+[\w.+-]+){0,2})\s+(?:is now|just|has been|v\d)/i,
    /^([A-Z][\w.+-]+)\s*[-—:]/,
  ];

  for (const p of patterns) {
    const m = clean.match(p);
    if (m?.[1]?.length >= 2 && m[1].length <= 60) return m[1].trim();
  }

  // Fall back to URL-derived name
  return urlName;
}

function extractNameFromUrl(url) {
  try {
    const u = new URL(url);
    // GitHub: owner/repo
    const ghMatch = u.pathname.match(/^\/([^/]+\/[^/]+)/);
    if (u.hostname === "github.com" && ghMatch) return ghMatch[1];
    // npm
    if (u.hostname === "www.npmjs.com") {
      const m = u.pathname.match(/\/package\/(.+)/);
      if (m) return m[1];
    }
    // PyPI
    if (u.hostname === "pypi.org") {
      const m = u.pathname.match(/\/project\/([^/]+)/);
      if (m) return m[1];
    }
    // HuggingFace
    if (u.hostname === "huggingface.co") {
      const m = u.pathname.match(/^\/([^/]+\/[^/]+)/);
      if (m) return m[1];
    }
    // Generic: use hostname without TLD
    return u.hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return null;
  }
}

function cleanTweetText(text) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
