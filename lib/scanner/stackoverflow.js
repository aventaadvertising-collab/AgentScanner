// ============================================================
// STACK OVERFLOW SCANNER
// Polls StackOverflow API for AI tool questions — adoption signal
// Free public API — no auth required (300 req/day without key)
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const SO_API = "https://api.stackexchange.com/2.3";

// Tags that surface AI tool questions
const SO_TAGS = [
  "langchain",
  "openai-api",
  "huggingface-transformers",
  "pytorch",
  "tensorflow",
  "stable-diffusion",
  "chatgpt-api",
  "llm",
  "vector-database",
  "pinecone",
  "chromadb",
  "ollama",
  "llamaindex",
  "autogpt",
  "anthropic",
];

export async function scanStackOverflow(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt
    ? Math.floor(new Date(lastScanAt).getTime() / 1000)
    : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const discoveries = [];
  const seen = new Set();

  // Batch tags into groups of 5 (SO supports semicolon-separated tags)
  const tagGroups = [];
  for (let i = 0; i < SO_TAGS.length; i += 5) {
    tagGroups.push(SO_TAGS.slice(i, i + 5).join(";"));
  }

  const fetchPromises = tagGroups.map(async (tags) => {
    if (!timer.hasTime()) return [];
    try {
      const url = `${SO_API}/questions?order=desc&sort=creation&tagged=${encodeURIComponent(tags)}&site=stackoverflow&filter=default&pagesize=20&fromdate=${cutoff}`;
      const res = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "AgentScreener-Scanner/1.0",
          Accept: "application/json",
        },
        timeout: 6000,
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  });

  // Also search for recent AI tool questions
  fetchPromises.push(
    (async () => {
      if (!timer.hasTime()) return [];
      try {
        const url = `${SO_API}/search?order=desc&sort=creation&intitle=ai%20agent&site=stackoverflow&filter=default&pagesize=15&fromdate=${cutoff}`;
        const res = await fetchWithRetry(url, {
          headers: { "User-Agent": "AgentScreener-Scanner/1.0", Accept: "application/json" },
          timeout: 6000,
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.items || [];
      } catch {
        return [];
      }
    })()
  );

  const results = await Promise.allSettled(fetchPromises);
  const allQuestions = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const q of allQuestions) {
    if (!timer.hasTime()) break;
    if (!q.title) continue;
    if (seen.has(q.question_id)) continue;
    seen.add(q.question_id);

    // Classify
    const tags = (q.tags || []).join(" ");
    const text = `${q.title} ${tags}`;
    const { score, matchedKeywords } = classifyAI(text, q.title);

    // SO tag boost — if it has a known AI tag, lower threshold
    const hasAITag = (q.tags || []).some((t) => SO_TAGS.includes(t));
    const threshold = hasAITag ? 0.15 : AI_THRESHOLD;
    if (score < threshold) continue;

    const category = categorize(q.title, "", q.tags || []);

    discoveries.push({
      external_id: `stackoverflow:${q.question_id}`,
      source: "stackoverflow",
      name: q.title.slice(0, 200),
      description: q.title.slice(0, 500),
      url: q.link || `https://stackoverflow.com/q/${q.question_id}`,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: Math.min(hasAITag ? score + 0.1 : score, 1),
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: q.score || 0,
      language: null,
      author: q.owner?.display_name || null,
      author_url: q.owner?.link || null,
      topics: q.tags || [],
      license: null,
      source_created_at: q.creation_date
        ? new Date(q.creation_date * 1000).toISOString()
        : null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:StackOverflow] ${allQuestions.length} questions → ${discoveries.length} AI-related`
  );

  return { discoveries, newLastScanAt };
}
