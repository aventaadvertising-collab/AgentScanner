// ============================================================
// PYPI RSS SCANNER
// Polls PyPI RSS feed for new AI-related Python packages
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";

const RSS_URL = "https://pypi.org/rss/packages.xml";
const MAX_DETAIL_FETCHES = 10;

// Simple regex-based RSS parser (no dependency needed)
function parseRSSItems(xml) {
  const items = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/g);
  if (!matches) return items;

  for (const block of matches) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const desc = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    items.push({ title, link, description: desc, pubDate });
  }
  return items;
}

export async function scanPyPI(lastScanAt) {
  // 1. Fetch RSS
  let xml;
  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "AgentScreener-Scanner/1.0" },
    });
    if (!res.ok) {
      console.log(`[Scanner:PyPI] RSS fetch ${res.status}`);
      return { discoveries: [], newLastScanAt: lastScanAt };
    }
    xml = await res.text();
  } catch (err) {
    console.log(`[Scanner:PyPI] RSS fetch error: ${err.message}`);
    return { discoveries: [], newLastScanAt: lastScanAt };
  }

  // 2. Parse items
  const items = parseRSSItems(xml);
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(0);
  const newItems = items.filter((item) => {
    if (!item.pubDate) return true;
    return new Date(item.pubDate) > cutoff;
  });

  // 3. Classify
  const candidates = [];
  for (const item of newItems) {
    const text = `${item.title} ${item.description}`;
    const { score, matchedKeywords } = classifyAI(text);
    if (score >= AI_THRESHOLD) {
      candidates.push({ ...item, score, matchedKeywords });
    }
  }

  // 4. Fetch package details for candidates
  const discoveries = [];
  const toFetch = candidates.slice(0, MAX_DETAIL_FETCHES);

  for (const candidate of toFetch) {
    const pkgName = candidate.title.split(" ")[0]; // "package-name 0.1.0" → "package-name"
    try {
      const res = await fetch(`https://pypi.org/pypi/${pkgName}/json`, {
        headers: { "User-Agent": "AgentScreener-Scanner/1.0" },
      });
      if (!res.ok) continue;
      const pkg = await res.json();
      const info = pkg.info || {};

      // Re-classify with full description
      const fullText = `${info.name} ${info.summary} ${info.description || ""}`;
      const { score, matchedKeywords } = classifyAI(fullText);
      if (score < AI_THRESHOLD) continue;

      const category = categorize(
        info.name,
        info.summary || info.description,
        info.keywords ? info.keywords.split(",").map((k) => k.trim()) : []
      );

      discoveries.push({
        external_id: `pypi:${info.name}`,
        source: "pypi",
        name: info.name,
        description: (info.summary || "").slice(0, 500),
        url: info.project_url || info.package_url || candidate.link,
        category,
        ai_keywords: matchedKeywords,
        ai_confidence: score,
        stars: 0,
        forks: 0,
        downloads: 0,
        upvotes: 0,
        language: "Python",
        author: info.author || info.maintainer || null,
        author_url: info.author_email
          ? `mailto:${info.author_email}`
          : info.home_page || null,
        topics: info.classifiers
          ? info.classifiers.filter((c) => c.includes("Topic")).slice(0, 10)
          : [],
        license: info.license?.slice(0, 100) || null,
        source_created_at: candidate.pubDate
          ? new Date(candidate.pubDate).toISOString()
          : null,
      });
    } catch {
      continue;
    }
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:PyPI] ${newItems.length} new packages → ${candidates.length} classified → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastScanAt };
}
