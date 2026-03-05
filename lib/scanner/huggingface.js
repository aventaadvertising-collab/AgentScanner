// ============================================================
// HUGGING FACE HUB SCANNER
// Polls HF API for new models and spaces
// ============================================================

import { classifyAI } from "./keywords";
import { categorize } from "./categorizer";

const MODELS_URL = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=100";
const SPACES_URL = "https://huggingface.co/api/spaces?sort=createdAt&direction=-1&limit=100";

export async function scanHuggingFace(lastScanAt) {
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(Date.now() - 10 * 60 * 1000);
  const headers = { "User-Agent": "AgentScreener-Scanner/1.0" };

  // Fetch models and spaces in parallel
  const [modelsRes, spacesRes] = await Promise.allSettled([
    fetch(MODELS_URL, { headers }).then((r) => (r.ok ? r.json() : [])),
    fetch(SPACES_URL, { headers }).then((r) => (r.ok ? r.json() : [])),
  ]);

  const models = modelsRes.status === "fulfilled" ? modelsRes.value : [];
  const spaces = spacesRes.status === "fulfilled" ? spacesRes.value : [];

  const discoveries = [];

  // Process models
  for (const model of models) {
    const createdAt = model.createdAt || model.lastModified;
    if (createdAt && new Date(createdAt) <= cutoff) continue;

    const name = model.modelId || model.id;
    const tags = model.tags || [];
    const desc = tags.join(", ");

    // All HF items are inherently AI — start at 0.7
    const { matchedKeywords } = classifyAI(`${name} ${desc}`);
    const score = Math.min(0.7 + matchedKeywords.length * 0.1, 1.0);

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

    const name = space.id;
    const tags = space.tags || [];
    const sdk = space.sdk || "";
    const desc = `${sdk} space. ${tags.join(", ")}`;

    const { matchedKeywords } = classifyAI(`${name} ${desc}`);
    const score = Math.min(0.7 + matchedKeywords.length * 0.1, 1.0);

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
    `[Scanner:HF] ${models.length} models + ${spaces.length} spaces → ${discoveries.length} new items`
  );

  return { discoveries, newLastScanAt };
}
