// ============================================================
// HUGGING FACE HUB SCANNER
// Polls HF API for new models and spaces
// ============================================================

import { classifyAI } from "./keywords";
import { categorize } from "./categorizer";

// Fetch more from HF API to apply quality filtering locally
const MODELS_URL = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=200";
const SPACES_URL = "https://huggingface.co/api/spaces?sort=createdAt&direction=-1&limit=200";

// ── Quality thresholds ──────────────────────────────────────
// Only surface models & spaces that show real traction or substance
const MIN_MODEL_LIKES = 1;          // At least 1 like (eliminates ~80% of spam)
const MIN_MODEL_DOWNLOADS = 10;     // OR at least 10 downloads
const MIN_SPACE_LIKES = 1;          // At least 1 like for spaces
const MIN_MEANINGFUL_TAGS = 2;      // Must have ≥2 tags (pipeline_tag + 1 more)
const MIN_DESC_TOKENS = 3;          // Non-trivial description (model name parts)

// Names that indicate personal experiments / noise
const NOISE_NAME_PATTERNS = [
  /^test/i, /^my[_-]?/i, /^untitled/i, /^demo[_-]?\d*/i,
  /^experiment/i, /^tmp/i, /^temp/i, /^scratch/i,
  /^copy[_-]of/i, /^fork[_-]of/i,
  /^asdf/i, /^aaa/i, /^xxx/i, /^zzz/i,
];

// Tags that are only regional/meta — not meaningful
const META_ONLY_TAGS = new Set([
  "region:us", "region:eu", "region:ap", "not-for-all-audiences",
  "license:apache-2.0", "license:mit", "license:cc-by-4.0",
  "license:cc-by-nc-4.0", "license:openrail",
]);

/**
 * Check if a HuggingFace item passes quality thresholds
 */
function passesQualityGate(item, isSpace = false) {
  const likes = item.likes || 0;
  const downloads = item.downloads || 0;
  const tags = item.tags || [];
  const name = (item.modelId || item.id || "").split("/").pop();

  // 1. Skip items with noise names
  for (const pattern of NOISE_NAME_PATTERNS) {
    if (pattern.test(name)) return false;
  }

  // 2. Engagement check — need at least SOME traction
  if (isSpace) {
    // Spaces: must have at least 1 like
    if (likes < MIN_SPACE_LIKES) return false;
  } else {
    // Models: must have likes OR downloads
    if (likes < MIN_MODEL_LIKES && downloads < MIN_MODEL_DOWNLOADS) return false;
  }

  // 3. Tag quality — filter out items that only have region/license meta tags
  const meaningfulTags = tags.filter((t) => !META_ONLY_TAGS.has(t));
  if (meaningfulTags.length < MIN_MEANINGFUL_TAGS) return false;

  // 4. Name must have enough substance (not just "Alice" or "Ypp")
  const nameTokens = name.replace(/[-_]/g, " ").split(/\s+/).filter(Boolean);
  if (nameTokens.length < MIN_DESC_TOKENS && likes < 5) return false;

  return true;
}

/**
 * Calculate confidence score based on actual engagement metrics
 * instead of a flat 0.7 start
 */
function calcHFConfidence(item, matchedKeywords, isSpace = false) {
  const likes = item.likes || 0;
  const downloads = item.downloads || 0;

  // Base: 0.4 (HF items are inherently AI, but must earn higher scores)
  let score = 0.4;

  // Engagement boosts
  if (likes >= 100) score += 0.25;
  else if (likes >= 10) score += 0.15;
  else if (likes >= 3) score += 0.08;
  else if (likes >= 1) score += 0.03;

  if (!isSpace) {
    if (downloads >= 10000) score += 0.15;
    else if (downloads >= 1000) score += 0.1;
    else if (downloads >= 100) score += 0.05;
    else if (downloads >= 10) score += 0.02;
  }

  // Keyword boosts
  score += matchedKeywords.length * 0.05;

  // Has a pipeline_tag = real model with a known task
  if (item.pipeline_tag) score += 0.05;

  return Math.min(score, 1.0);
}

export async function scanHuggingFace(lastScanAt) {
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(Date.now() - 10 * 60 * 1000);
  const headers = { "User-Agent": "AgentScreener-Scanner/1.0" };

  // Fetch models and spaces in parallel (200 each, filter locally)
  const [modelsRes, spacesRes] = await Promise.allSettled([
    fetch(MODELS_URL, { headers }).then((r) => (r.ok ? r.json() : [])),
    fetch(SPACES_URL, { headers }).then((r) => (r.ok ? r.json() : [])),
  ]);

  const models = modelsRes.status === "fulfilled" ? modelsRes.value : [];
  const spaces = spacesRes.status === "fulfilled" ? spacesRes.value : [];

  const discoveries = [];
  let skippedModels = 0;
  let skippedSpaces = 0;

  // Process models
  for (const model of models) {
    const createdAt = model.createdAt || model.lastModified;
    if (createdAt && new Date(createdAt) <= cutoff) continue;

    // ── Quality gate ──
    if (!passesQualityGate(model, false)) {
      skippedModels++;
      continue;
    }

    const name = model.modelId || model.id;
    const tags = model.tags || [];
    const desc = tags.join(", ");

    const { matchedKeywords } = classifyAI(`${name} ${desc}`);
    const score = calcHFConfidence(model, matchedKeywords, false);

    const category = categorize(
      name,
      desc,
      tags,
      model.pipeline_tag || null
    );

    discoveries.push({
      external_id: `hf:model:${name}`,
      source: "huggingface",
      name: name.includes("/") ? name.split("/").pop() : name,
      description: model.pipeline_tag
        ? `${model.pipeline_tag} model. Tags: ${tags.slice(0, 5).join(", ")}`
        : `Tags: ${tags.slice(0, 8).join(", ")}`,
      url: `https://huggingface.co/${name}`,
      category: category || "Model Hubs & Tooling",
      ai_keywords: matchedKeywords.length > 0 ? matchedKeywords : ["huggingface-model"],
      ai_confidence: score,
      stars: model.likes || 0,
      forks: 0,
      downloads: model.downloads || 0,
      upvotes: 0,
      language: null,
      author: name.includes("/") ? name.split("/")[0] : null,
      author_url: name.includes("/")
        ? `https://huggingface.co/${name.split("/")[0]}`
        : null,
      topics: tags.slice(0, 10),
      license: tags.find((t) => t.startsWith("license:"))?.replace("license:", "") || null,
      source_created_at: createdAt || null,
    });
  }

  // Process spaces
  for (const space of spaces) {
    const createdAt = space.createdAt || space.lastModified;
    if (createdAt && new Date(createdAt) <= cutoff) continue;

    // ── Quality gate ──
    if (!passesQualityGate(space, true)) {
      skippedSpaces++;
      continue;
    }

    const name = space.id;
    const tags = space.tags || [];
    const sdk = space.sdk || "";
    const desc = `${sdk} space. ${tags.join(", ")}`;

    const { matchedKeywords } = classifyAI(`${name} ${desc}`);
    const score = calcHFConfidence(space, matchedKeywords, true);

    const category = categorize(name, desc, tags);

    discoveries.push({
      external_id: `hf:space:${name}`,
      source: "huggingface",
      name: name.includes("/") ? name.split("/").pop() : name,
      description: `HF Space (${sdk}). ${tags.slice(0, 5).join(", ")}`.slice(0, 500),
      url: `https://huggingface.co/spaces/${name}`,
      category: category || "Model Hubs & Tooling",
      ai_keywords: matchedKeywords.length > 0 ? matchedKeywords : ["huggingface-space"],
      ai_confidence: score,
      stars: space.likes || 0,
      forks: 0,
      downloads: 0,
      upvotes: 0,
      language: sdk || null,
      author: name.includes("/") ? name.split("/")[0] : null,
      author_url: name.includes("/")
        ? `https://huggingface.co/${name.split("/")[0]}`
        : null,
      topics: tags.slice(0, 10),
      license: tags.find((t) => t.startsWith("license:"))?.replace("license:", "") || null,
      source_created_at: createdAt || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:HF] ${models.length} models (${skippedModels} skipped) + ${spaces.length} spaces (${skippedSpaces} skipped) → ${discoveries.length} quality items`
  );

  return { discoveries, newLastScanAt };
}
