// ============================================================
// AI KEYWORD CLASSIFIER
// Weighted scoring system to determine if a project is AI-related
// Returns { score: 0.0-1.0, matchedKeywords: string[] }
// ============================================================

const CORE = [
  "large language model", "llm", "machine learning", "deep learning",
  "neural network", "transformer", "diffusion model", "gpt", "generative ai",
  "foundation model", "language model", "text generation",
];

const APPLICATION = [
  "ai agent", "autonomous agent", "multi-agent", "agentic",
  "text-to-image", "text-to-video", "text-to-speech", "speech-to-text",
  "image generation", "video generation", "voice synthesis", "voice clone",
  "code generation", "code completion", "coding assistant",
  "chatbot", "chat bot", "conversational ai",
  "rag", "retrieval augmented", "retrieval-augmented",
  "embedding", "vector database", "vector store", "semantic search",
  "fine-tuning", "fine-tune", "finetuning", "finetune",
  "prompt engineering", "prompt template",
  "text-to-3d", "image-to-3d", "3d generation",
  "ai safety", "alignment", "red teaming",
];

const TOOLING = [
  "langchain", "llamaindex", "llama-index", "crewai", "autogen",
  "huggingface", "hugging face", "transformers",
  "pytorch", "tensorflow", "jax", "keras",
  "openai", "anthropic", "claude", "gemini", "mistral",
  "ollama", "vllm", "llama.cpp", "llama-cpp", "gguf", "ggml",
  "lora", "qlora", "peft", "adapter",
  "model serving", "inference server", "inference engine",
  "tokenizer", "attention mechanism",
  "stable diffusion", "controlnet", "comfyui",
  "whisper", "bark", "tortoise-tts",
];

const WEAK = [
  "ai", "ml", "nlp", "cv", "computer vision",
  "natural language processing", "natural language",
  "copilot", "assistant", "automate", "automation",
  "generative", "gen-ai", "genai",
  "intelligent", "smart", "predict",
];

const NEGATIVE = [
  "artificial insemination", "adobe illustrator", "appalachian trail",
  "amnesty international", "american idol", "air india",
  "allen iverson", "analog input", "application interface",
];

// Weights and caps per category
const WEIGHTS = [
  { keywords: CORE, weight: 0.4, cap: 2 },
  { keywords: APPLICATION, weight: 0.25, cap: 3 },
  { keywords: TOOLING, weight: 0.2, cap: 3 },
  { keywords: WEAK, weight: 0.1, cap: 2 },
];

export function classifyAI(text) {
  if (!text) return { score: 0, matchedKeywords: [] };

  const normalized = text.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ");

  // Check negative keywords first
  for (const neg of NEGATIVE) {
    if (normalized.includes(neg)) return { score: 0, matchedKeywords: [] };
  }

  let score = 0;
  const matchedKeywords = [];

  for (const { keywords, weight, cap } of WEIGHTS) {
    let hits = 0;
    for (const kw of keywords) {
      if (hits >= cap) break;
      if (normalized.includes(kw)) {
        hits++;
        matchedKeywords.push(kw);
      }
    }
    score += hits * weight;
  }

  return {
    score: Math.min(score, 1),
    matchedKeywords,
  };
}

// Minimum threshold for inclusion
export const AI_THRESHOLD = 0.3;
