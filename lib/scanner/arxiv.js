// ============================================================
// ARXIV SCANNER
// Polls arXiv API for new AI/ML papers that may indicate products
// Focuses on cs.AI, cs.CL, cs.LG, cs.CV categories
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const ARXIV_API = "http://export.arxiv.org/api/query";
const CATEGORIES = "cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG+OR+cat:cs.CV";
const MAX_RESULTS = 30;

// Parse Atom XML entries with regex (no dependency)
function parseAtomEntries(xml) {
  const entries = [];
  const blocks = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
  if (!blocks) return entries;

  for (const block of blocks) {
    const id = block.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || "";
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, " ") || "";
    const summary = block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim().replace(/\s+/g, " ") || "";
    const published = block.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || "";

    // Get all author names
    const authorMatches = block.match(/<author>\s*<name>([\s\S]*?)<\/name>/g);
    const authors = authorMatches
      ? authorMatches.map((a) => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean)
      : [];

    // Extract links — look for PDF and HTML
    const links = [];
    const linkMatches = block.match(/<link[^>]*\/>/g) || [];
    for (const l of linkMatches) {
      const href = l.match(/href="([^"]*)"/)?.[1];
      const type = l.match(/type="([^"]*)"/)?.[1] || "";
      if (href) links.push({ href, type });
    }

    // Look for GitHub URLs in summary
    const githubMatch = summary.match(/(https?:\/\/github\.com\/[^\s,.)]+)/i);

    entries.push({
      id,
      title,
      summary: summary.slice(0, 1000),
      published,
      authors,
      links,
      githubUrl: githubMatch?.[1] || null,
    });
  }
  return entries;
}

export async function scanArxiv(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(Date.now() - 48 * 60 * 60 * 1000);

  let xml;
  try {
    const url = `${ARXIV_API}?search_query=${CATEGORIES}&sortBy=submittedDate&sortOrder=descending&max_results=${MAX_RESULTS}`;
    const res = await fetchWithRetry(url, {
      headers: { "User-Agent": "AgentScreener-Scanner/1.0" },
      timeout: 8000,
    });
    if (!res.ok) {
      console.log(`[Scanner:arXiv] API ${res.status}`);
      return { discoveries: [], newLastScanAt: lastScanAt };
    }
    xml = await res.text();
  } catch (err) {
    console.log(`[Scanner:arXiv] Fetch error: ${err.message}`);
    return { discoveries: [], newLastScanAt: lastScanAt };
  }

  const entries = parseAtomEntries(xml);
  const discoveries = [];

  for (const entry of entries) {
    if (!timer.hasTime()) break;
    if (!entry.title) continue;

    // Filter by date
    if (entry.published && new Date(entry.published) < cutoff) continue;

    // Classify — papers are inherently AI since we filter categories,
    // but still classify to get keywords and filter noise
    const text = `${entry.title} ${entry.summary}`;
    const { score, matchedKeywords } = classifyAI(text, entry.title);

    // Lower threshold since arXiv papers in these categories are inherently AI
    if (score < 0.2) continue;

    // Boost confidence for having GitHub links (indicates code/product)
    const hasCode = !!entry.githubUrl;
    const confidence = Math.min(hasCode ? score + 0.2 : score, 1);

    const category = categorize(entry.title, entry.summary, []);

    // Extract arxiv ID from URL
    const arxivId = entry.id.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");

    discoveries.push({
      external_id: `arxiv:${arxivId}`,
      source: "arxiv",
      name: entry.title.slice(0, 200),
      description: entry.summary.slice(0, 500),
      url: entry.githubUrl || `https://arxiv.org/abs/${arxivId}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: confidence,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: 0,
      language: null,
      author: entry.authors.slice(0, 3).join(", ") || null,
      author_url: `https://arxiv.org/search/?query=${encodeURIComponent(entry.authors[0] || "")}&searchtype=author`,
      topics: ["arXiv", ...(hasCode ? ["has-code"] : [])],
      license: null,
      source_created_at: entry.published || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:arXiv] ${entries.length} papers → ${discoveries.length} AI discoveries`
  );

  return { discoveries, newLastScanAt };
}
