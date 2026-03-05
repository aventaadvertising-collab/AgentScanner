// ============================================================
// AI KEYWORD CLASSIFIER v3
// Weighted scoring system to determine if a project is AI-related
// Returns { score: 0.0-1.0, matchedKeywords: string[] }
// ============================================================

const CORE = [
  "large language model", "llm", "machine learning", "deep learning",
  "neural network", "transformer", "diffusion model", "gpt", "generative ai",
  "foundation model", "language model", "text generation",
  "reinforcement learning", "computer vision model", "multimodal",
  "agentic framework", "model inference", "ai platform",
  "vision language model", "vlm", "mixture of experts", "moe",
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
  "object detection", "image segmentation", "image classification",
  "text summarization", "question answering", "named entity",
  "sentiment analysis", "text classification",
  "ai workflow", "ai pipeline", "ai orchestration",
  "browser automation", "web scraping ai", "ai workflow builder",
  "no-code ai", "ai api", "ai gateway", "ai proxy",
  "model router", "model gateway", "ai cache",
  "ai coding", "code interpreter", "ai terminal",
  "document ai", "ocr ai", "pdf ai",
];

const TOOLING = [
  "langchain", "llamaindex", "llama-index", "crewai", "autogen",
  "huggingface", "hugging face", "transformers",
  "pytorch", "tensorflow", "jax", "keras",
  "openai", "anthropic", "claude", "gemini", "mistral", "groq",
  "ollama", "vllm", "llama.cpp", "llama-cpp", "gguf", "ggml",
  "lora", "qlora", "peft", "adapter",
  "model serving", "inference server", "inference engine",
  "tokenizer", "attention mechanism",
  "stable diffusion", "controlnet", "comfyui",
  "whisper", "bark", "tortoise-tts",
  "triton inference", "tensorrt", "onnx runtime",
  "mlflow", "wandb", "weights and biases",
  "chromadb", "pinecone", "weaviate", "qdrant", "milvus",
  "dspy", "instructor", "outlines", "guidance",
  "vercel ai", "ai sdk",
  // Modern AI agent/tool frameworks
  "smolagents", "pydantic-ai", "pydantic ai", "mastra",
  "browser-use", "browser use", "ag2", "phidata", "mem0",
  "e2b", "composio", "trigger.dev", "inngest",
  "litellm", "portkey", "helicone", "braintrust",
  "langfuse", "lunary", "langsmith",
  "haystack", "semantic-kernel", "semantic kernel",
  "superagent", "fixie", "dust",
  "unstructured", "docling", "marker",
  "cursor", "continue", "aider", "copilot",
  "deepseek", "qwen", "llama", "phi",
  "flux", "midjourney", "suno", "udio",
];

const WEAK = [
  "ai", "ml", "nlp", "cv", "computer vision",
  "natural language processing", "natural language",
  "copilot", "assistant", "automate", "automation",
  "generative", "gen-ai", "genai",
  "intelligent", "smart", "predict",
  "neural", "model", "inference",
];

const NEGATIVE = [
  // Common false positives
  "artificial insemination", "adobe illustrator", "appalachian trail",
  "amnesty international", "american idol", "air india",
  "allen iverson", "analog input", "application interface",
  // Non-product / noise
  "audio interface", "auto insurance", "allergy immunology",
  "airline", "airport", "aircraft", "air conditioning", "air quality",
  "aim trainer", "aimbot", "aim assist",
  "airdrop", "airbnb",
  // Educational / not products
  "awesome list", "curated list",
  "course material", "lecture notes", "homework", "assignment",
  "interview prep", "cheat sheet", "study guide",
  "tutorial collection", "learning resource",
];

// Name patterns that indicate non-products (tutorials, demos, etc.)
const NAME_PENALTIES = [
  /^(test|demo|example|tutorial|learn|course|homework|practice)/i,
  /^my[-_]?(first|test|demo|project)/i,
  /(assignment|exercise|bootcamp|udemy|coursera|kaggle[-_]?comp)/i,
  /^(awesome|list[-_]of|collection[-_]of)/i,
  /[-_](tutorial|example|demo|sample|template)$/i,
];

// Weights and caps per category
const WEIGHTS = [
  { keywords: CORE, weight: 0.4, cap: 2 },
  { keywords: APPLICATION, weight: 0.25, cap: 3 },
  { keywords: TOOLING, weight: 0.2, cap: 3 },
  { keywords: WEAK, weight: 0.1, cap: 2, isWeak: true },
];

export function classifyAI(text, name = "") {
  if (!text) return { score: 0, matchedKeywords: [] };

  const normalized = text.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ");

  // Check negative keywords first
  for (const neg of NEGATIVE) {
    if (normalized.includes(neg)) return { score: 0, matchedKeywords: [] };
  }

  let score = 0;
  const matchedKeywords = [];
  let hasStrongSignal = false;

  for (const { keywords, weight, cap, isWeak } of WEIGHTS) {
    let hits = 0;
    for (const kw of keywords) {
      if (hits >= cap) break;
      if (normalized.includes(kw)) {
        hits++;
        matchedKeywords.push(kw);
        if (!isWeak) hasStrongSignal = true;
      }
    }
    score += hits * weight;
  }

  // Require at least one non-WEAK match to pass threshold
  if (!hasStrongSignal && score > 0) {
    score = Math.min(score, 0.15);
  }

  // Apply name penalty for tutorials/demos/etc
  if (name) {
    for (const pattern of NAME_PENALTIES) {
      if (pattern.test(name)) {
        score *= 0.4;
        break;
      }
    }
  }

  return {
    score: Math.min(score, 1),
    matchedKeywords,
  };
}

// Minimum threshold for inclusion
export const AI_THRESHOLD = 0.3;
