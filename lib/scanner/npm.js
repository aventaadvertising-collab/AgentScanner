// ============================================================
// NPM REGISTRY SCANNER
// Polls npm search API for new AI-related packages
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SEARCH_QUERIES = [
  "ai agent",
  "llm",
  "langchain",
  "openai",
  "machine learning",
  "vector database",
  "embedding",
  "ai sdk",
  "agent framework",
  "rag retrieval",
  "text-to-speech ai",
  "chatbot ai",
  "ai tool",
  "anthropic",
  "computer vision",
];

export async function scanNpm(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const discoveries = [];
  const seen = new Set();

  // Search multiple AI-related queries in parallel
  // Run all queries (in batches of 6 for rate limit safety)
  const searchPromises = SEARCH_QUERIES.slice(0, 8).map(async (query) => {
    if (!timer.hasTime()) return [];
    try {
      const res = await fetchWithRetry(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20&quality=0.0&popularity=0.5&maintenance=0.0`,
        { headers: { "User-Agent": "AgentScreener-Scanner/1.0" } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.objects || [];
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(searchPromises);
  const allPackages = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const obj of allPackages) {
    if (!timer.hasTime()) break;
    const pkg = obj.package;
    if (!pkg?.name || seen.has(pkg.name)) continue;
    seen.add(pkg.name);

    // Filter by date
    const pkgDate = pkg.date ? new Date(pkg.date) : null;
    if (pkgDate && pkgDate < cutoff) continue;

    // Classify
    const text = [
      pkg.name,
      pkg.description || "",
      ...(pkg.keywords || []),
    ].join(" ");
    const { score, matchedKeywords } = classifyAI(text, pkg.name);
    if (score < AI_THRESHOLD) continue;

    const category = categorize(pkg.name, pkg.description, pkg.keywords || []);

    // Extract repo URL
    let repoUrl = null;
    let authorUrl = null;
    if (pkg.links?.repository) {
      repoUrl = pkg.links.repository;
    }
    if (pkg.publisher?.username) {
      authorUrl = `https://www.npmjs.com/~${pkg.publisher.username}`;
    }

    discoveries.push({
      external_id: `npm:${pkg.name}`,
      source: "npm",
      name: pkg.name,
      description: (pkg.description || "").slice(0, 500),
      url: pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: score,
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: 0,
      language: "JavaScript",
      author: pkg.publisher?.username || pkg.author?.name || null,
      author_url: authorUrl,
      topics: pkg.keywords || [],
      license: null,
      source_created_at: pkg.date || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:npm] ${allPackages.length} searched → ${discoveries.length} AI packages`
  );

  return { discoveries, newLastScanAt };
}
