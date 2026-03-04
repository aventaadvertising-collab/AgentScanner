// ============================================================
// AUTO-CATEGORIZER
// Maps discovered projects into AgentScreener's 28 CATEGORIES
// ============================================================

import { CATEGORIES } from "@/lib/pipeline/registry";

const CATEGORY_SIGNALS = {
  "Code & Dev Tools": [
    "ide", "code editor", "code generation", "code completion", "coding assistant",
    "developer tool", "dev tool", "vscode", "neovim", "cli tool", "sdk",
    "programming", "debugger", "linter", "code review", "devops",
  ],
  "AI Agents": [
    "autonomous agent", "ai agent", "task agent", "web agent",
    "browser agent", "computer use", "self-operating", "personal assistant",
    "ai assistant", "digital worker",
  ],
  "Agent Frameworks": [
    "agent framework", "orchestration", "multi-agent", "langchain", "llamaindex",
    "crewai", "autogen", "agent builder", "tool use", "function calling",
    "agent protocol", "agent sdk", "agentic framework",
  ],
  "Search & Research": [
    "search engine", "research tool", "retrieval", "rag", "retrieval augmented",
    "semantic search", "knowledge graph", "question answering", "web search",
    "research assistant",
  ],
  "Image Generation": [
    "text-to-image", "image generation", "stable diffusion", "midjourney",
    "dall-e", "image synthesis", "controlnet", "lora", "img2img",
    "inpainting", "outpainting",
  ],
  "Video Generation": [
    "text-to-video", "video generation", "video synthesis", "video editing",
    "video ai", "animation ai", "motion generation",
  ],
  "Audio & Voice": [
    "text-to-speech", "speech-to-text", "voice synthesis", "tts", "stt",
    "audio", "transcription", "voice clone", "speech recognition",
    "audio processing", "whisper",
  ],
  "Music Generation": [
    "music generation", "music ai", "audio generation", "song generation",
    "melody", "midi", "music composition",
  ],
  "Writing & Content": [
    "writing assistant", "content generation", "copywriting", "blog writer",
    "article", "text generation", "summarization", "paraphrase",
    "grammar", "editing tool",
  ],
  "Productivity & Workspace": [
    "productivity", "workspace", "notes", "calendar", "meeting",
    "task management", "workflow", "project management", "collaboration",
    "document", "notion", "obsidian",
  ],
  "Foundation Models": [
    "foundation model", "base model", "pretrained model", "pre-trained",
    "llm provider", "api provider", "chat model", "language model",
    "large language model",
  ],
  "Inference & Serving": [
    "inference", "model serving", "deployment", "gpu", "optimization",
    "quantization", "vllm", "tgi", "triton", "onnx", "tensorrt",
    "model runtime", "inference engine",
  ],
  "Model Hubs & Tooling": [
    "model hub", "model registry", "model management", "experiment tracking",
    "mlops", "training", "fine-tuning", "dataset", "annotation",
    "labeling", "benchmark",
  ],
  "Crypto-AI": [
    "blockchain", "crypto", "web3", "token", "defi", "nft",
    "decentralized ai", "on-chain", "smart contract",
  ],
  "Design & Creative": [
    "design tool", "creative tool", "graphic design", "ui design",
    "logo generator", "brand", "illustration", "art generation",
  ],
  "Customer Support AI": [
    "customer support", "helpdesk", "ticketing", "customer service",
    "support bot", "help bot", "live chat", "knowledge base",
  ],
  "Sales & GTM AI": [
    "sales", "gtm", "go-to-market", "crm", "lead generation",
    "outreach", "prospecting", "sales assistant", "revenue",
  ],
  "Data & Analytics": [
    "data analytics", "data science", "data pipeline", "etl",
    "business intelligence", "dashboard", "visualization",
    "data processing", "data engineering",
  ],
  "Open Source Models": [
    "open source model", "open weight", "llama", "mistral", "qwen",
    "gemma", "phi", "falcon", "mpt", "open model",
  ],
  "AI Safety & Alignment": [
    "ai safety", "alignment", "red teaming", "guardrails",
    "content moderation", "bias detection", "fairness",
    "responsible ai", "explainability", "interpretability",
  ],
  "Robotics & Embodied AI": [
    "robotics", "robot", "embodied", "manipulation", "locomotion",
    "sim-to-real", "reinforcement learning", "control",
  ],
  "Healthcare AI": [
    "healthcare", "medical", "clinical", "diagnosis", "drug discovery",
    "biotech", "genomics", "radiology", "pathology",
  ],
  "Legal AI": [
    "legal", "law", "contract", "compliance", "regulatory",
    "patent", "litigation",
  ],
  "Finance AI": [
    "finance", "fintech", "trading", "risk", "fraud detection",
    "insurance", "banking", "investment",
  ],
  "Education AI": [
    "education", "edtech", "tutoring", "learning", "course",
    "quiz", "study", "teaching",
  ],
  "Browser & Computer Use": [
    "browser use", "browser automation", "web scraping", "web agent",
    "computer use", "desktop automation", "rpa", "screen",
  ],
  "Voice Agents & Telephony": [
    "voice agent", "telephony", "phone", "call center", "ivr",
    "voice bot", "conversational", "dial",
  ],
  "3D & Spatial AI": [
    "3d generation", "3d model", "nerf", "gaussian splatting",
    "point cloud", "spatial", "3d reconstruction", "mesh",
  ],
};

// HuggingFace pipeline_tag → category mapping
const HF_PIPELINE_MAP = {
  "text-generation": "Foundation Models",
  "text2text-generation": "Foundation Models",
  "text-to-image": "Image Generation",
  "image-to-image": "Image Generation",
  "text-to-video": "Video Generation",
  "text-to-speech": "Audio & Voice",
  "automatic-speech-recognition": "Audio & Voice",
  "audio-classification": "Audio & Voice",
  "text-to-audio": "Music Generation",
  "text-classification": "Data & Analytics",
  "token-classification": "Data & Analytics",
  "question-answering": "Search & Research",
  "summarization": "Writing & Content",
  "translation": "Writing & Content",
  "conversational": "AI Agents",
  "image-classification": "Data & Analytics",
  "object-detection": "Data & Analytics",
  "image-segmentation": "Data & Analytics",
  "reinforcement-learning": "Robotics & Embodied AI",
};

export function categorize(name, description, topics, pipelineTag) {
  // Direct HF pipeline_tag mapping
  if (pipelineTag && HF_PIPELINE_MAP[pipelineTag]) {
    return HF_PIPELINE_MAP[pipelineTag];
  }

  const text = [name, description, ...(topics || [])].join(" ").toLowerCase();

  let bestCategory = null;
  let bestScore = 0;

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (text.includes(signal)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Require at least 1 signal match
  return bestScore >= 1 ? bestCategory : null;
}
