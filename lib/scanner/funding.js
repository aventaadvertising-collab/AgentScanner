// ============================================================
// FUNDING SIGNAL SCANNER
// Detects AI startup funding announcements from public sources
// Sources: TechCrunch RSS, Crunchbase news RSS, keyword scanning
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

// RSS feeds that often announce AI funding
const FUNDING_FEEDS = [
  // TechCrunch funding tag
  "https://techcrunch.com/category/fundraise/feed/",
  // VentureBeat AI
  "https://feeds.feedburner.com/venturebeat/SZYF",
];

// Funding-related keywords
const FUNDING_PATTERNS = [
  /(?:raised?|secures?|closes?|announces?)\s+\$[\d,.]+\s*[MBmb]/i,
  /(?:series\s+[A-F]|seed\s+round|pre-seed|angel\s+round)/i,
  /(?:funding\s+round|venture\s+(?:capital|funding)|valuation)/i,
  /\$[\d,.]+\s*(?:million|billion)/i,
];

// Extract funding amount from text
function extractFundingAmount(text) {
  const match = text.match(/\$([\d,.]+)\s*(million|billion|[MBmb])/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ""));
  const unit = match[2].toLowerCase();
  if (unit === "billion" || unit === "b") return num * 1e9;
  if (unit === "million" || unit === "m") return num * 1e6;
  return num;
}

export async function scanFunding(lastScanAt) {
  const timer = createDeadline(8000);
  const discoveries = [];
  const seen = new Set();

  for (const feedUrl of FUNDING_FEEDS) {
    if (!timer.hasTime()) break;

    try {
      const res = await fetchWithRetry(feedUrl, {
        headers: {
          "User-Agent": "AgentScreener-Scanner/1.0",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        timeout: 5000,
      });

      if (!res.ok) continue;
      const xml = await res.text();

      // Simple RSS parser (no dependency needed)
      const items = parseRSSItems(xml);

      for (const item of items) {
        if (!timer.hasTime()) break;

        // Must be funding-related
        const isFunding = FUNDING_PATTERNS.some((p) => p.test(item.title + " " + item.description));
        if (!isFunding) continue;

        // Must be AI-related
        const text = `${item.title} ${item.description}`;
        const { score, matchedKeywords } = classifyAI(text);
        if (score < AI_THRESHOLD * 0.7) continue; // Lower threshold for funding news

        const key = item.link || item.title;
        if (seen.has(key)) continue;
        seen.add(key);

        // Extract company name from title
        const companyName = extractCompanyName(item.title);
        if (!companyName) continue;

        const fundingAmount = extractFundingAmount(text);
        const category = categorize(companyName, item.description || "", []);

        discoveries.push({
          external_id: `funding:${hashStr(key)}`,
          source: "funding",
          name: companyName.slice(0, 200),
          description: `${item.title}`.slice(0, 500),
          url: item.link || null,
          category,
          ai_keywords: [...matchedKeywords, "funding"],
          ai_confidence: Math.min(score + 0.1, 1), // Boost for being funding
          stars: 0,
          forks: 0,
          downloads: fundingAmount ? Math.round(fundingAmount / 1000) : 0, // Store amount as thousands
          upvotes: 0,
          language: null,
          author: null,
          author_url: null,
          topics: ["funding", "startup", ...(fundingAmount ? [`$${formatAmount(fundingAmount)}`] : [])],
          license: null,
          source_created_at: item.pubDate || null,
        });
      }
    } catch (e) {
      console.log(`[Scanner:Funding] Error for ${feedUrl}: ${e.message}`);
    }
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:Funding] ${FUNDING_FEEDS.length} feeds → ${discoveries.length} funding announcements`
  );

  return { discoveries, newLastScanAt };
}

/**
 * Simple RSS/Atom XML parser (no external dependency)
 */
function parseRSSItems(xml) {
  const items = [];
  // Match <item> or <entry> blocks
  const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    if (items.length >= 30) break;
    const block = match[1];

    const title = extractTag(block, "title");
    const link =
      extractTag(block, "link") ||
      extractAttr(block, "link", "href");
    const description =
      extractTag(block, "description") ||
      extractTag(block, "summary") ||
      extractTag(block, "content");
    const pubDate =
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "updated");

    if (title) {
      items.push({
        title: cleanHtml(title),
        link: cleanHtml(link || ""),
        description: cleanHtml(description || "").slice(0, 500),
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
      });
    }
  }

  return items;
}

function extractTag(xml, tag) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i")
  );
  return match?.[1] || null;
}

function extractAttr(xml, tag, attr) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i")
  );
  return match?.[1] || null;
}

function cleanHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCompanyName(title) {
  // Common patterns: "CompanyName Raises $XM..."
  const patterns = [
    /^([A-Z][\w.]+(?:\s+[\w.]+){0,2})\s+(?:raises?|secures?|closes?|announces?|lands?|nabs?|gets?)/i,
    /^([A-Z][\w.]+(?:\s+[\w.]+){0,2}),?\s+(?:an?\s+)?(?:ai|ml|machine learning)/i,
    /^(?:ai\s+(?:startup|company)\s+)?([A-Z][\w.]+(?:\s+[\w.]+){0,2})\s+(?:has\s+)?raised?/i,
  ];

  for (const p of patterns) {
    const m = title.match(p);
    if (m?.[1]?.length >= 2 && m[1].length <= 50) return m[1].trim();
  }

  return null;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function formatAmount(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}
