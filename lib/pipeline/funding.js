// ============================================================
// FUNDING & KNOWN METRICS
// Funding: Crunchbase, press releases, public filings
// Metrics: Public announcements, SimilarWeb estimates, app stores
// ============================================================

const KNOWN_FUNDING = {
  // CODE & DEV TOOLS
  cursor: { total: 460_000_000, last_round: "Series C", valuation: 2_500_000_000, investors: ["a16z", "Thrive Capital"] },
  bolt: { total: 100_000_000, last_round: "Series B", valuation: 750_000_000, investors: ["Spark Capital"] },
  lovable: { total: 25_000_000, last_round: "Series A", valuation: 200_000_000, investors: ["Spark Capital"] },
  windsurf: { total: 150_000_000, last_round: "Series B", valuation: 1_250_000_000, investors: ["Greenoaks Capital", "General Catalyst"] },
  v0: { total: null, last_round: "Vercel Product", valuation: null, investors: [] },
  "claude-code": { total: null, last_round: "Anthropic Product", valuation: null, investors: [] },
  copilot: { total: null, last_round: "GitHub/Microsoft Product", valuation: null, investors: [] },
  replit: { total: 222_000_000, last_round: "Series C", valuation: 1_160_000_000, investors: ["a16z", "Khosla Ventures"] },
  cody: { total: 225_000_000, last_round: "Series D", valuation: 2_625_000_000, investors: ["a16z", "Sequoia", "Redpoint"] },
  tabnine: { total: 55_000_000, last_round: "Series B", valuation: 300_000_000, investors: ["Telus Ventures", "Khosla Ventures"] },
  poolside: { total: 500_000_000, last_round: "Series B", valuation: 3_000_000_000, investors: ["Bain Capital Ventures", "DST Global"] },
  "magic-ai": { total: 465_000_000, last_round: "Series B", valuation: 1_500_000_000, investors: ["Eric Schmidt", "Atlassian Ventures"] },
  augment: { total: 252_000_000, last_round: "Series B", valuation: 977_000_000, investors: ["Index Ventures", "Sutter Hill"] },

  // AI AGENTS
  devin: { total: 175_000_000, last_round: "Series A", valuation: 2_000_000_000, investors: ["Founders Fund", "Khosla Ventures"] },
  adept: { total: 415_000_000, last_round: "Series B", valuation: 1_000_000_000, investors: ["General Catalyst", "Spark Capital"] },
  lindy: { total: 33_000_000, last_round: "Series A", valuation: 150_000_000, investors: ["Menlo Ventures", "Abstract Ventures"] },
  relevance: { total: 18_000_000, last_round: "Series A", valuation: 100_000_000, investors: ["Insight Partners"] },
  multion: { total: 29_000_000, last_round: "Series A", valuation: 150_000_000, investors: ["Spark Capital"] },

  // AGENT FRAMEWORKS
  langchain: { total: 45_000_000, last_round: "Series A", valuation: 200_000_000, investors: ["Sequoia"] },
  llamaindex: { total: 19_000_000, last_round: "Series A", valuation: 100_000_000, investors: ["Greylock"] },

  // SEARCH & RESEARCH
  perplexity: { total: 500_000_000, last_round: "Series C", valuation: 9_000_000_000, investors: ["IVP", "NEA", "Bezos Expeditions"] },
  exa: { total: 22_000_000, last_round: "Series A", valuation: 100_000_000, investors: ["Lightspeed Venture Partners"] },

  // IMAGE GENERATION
  midjourney: { total: 0, last_round: "Bootstrapped", valuation: 10_000_000_000, investors: [] },
  stability: { total: 250_000_000, last_round: "Series B", valuation: 1_000_000_000, investors: ["Coatue", "Lightspeed"] },
  ideogram: { total: 130_000_000, last_round: "Series B", valuation: 600_000_000, investors: ["a16z", "Index Ventures"] },

  // VIDEO GENERATION
  runway: { total: 237_000_000, last_round: "Series D", valuation: 4_000_000_000, investors: ["Google", "Nvidia", "Salesforce Ventures"] },
  pika: { total: 135_000_000, last_round: "Series B", valuation: 800_000_000, investors: ["Lightspeed", "Spark Capital"] },
  sora: { total: null, last_round: "OpenAI Product", valuation: null, investors: [] },
  kling: { total: null, last_round: "Kuaishou Product", valuation: null, investors: [] },
  luma: { total: 84_000_000, last_round: "Series B", valuation: 400_000_000, investors: ["a16z", "GV"] },
  hailuoai: { total: 230_000_000, last_round: "Series A", valuation: 1_000_000_000, investors: ["Tencent", "Hillhouse Capital"] },
  heygen: { total: 60_000_000, last_round: "Series A", valuation: 500_000_000, investors: ["Benchmark"] },

  // AUDIO & VOICE
  elevenlabs: { total: 180_000_000, last_round: "Series C", valuation: 3_300_000_000, investors: ["a16z", "Nat Friedman", "Sequoia"] },
  assemblyai: { total: 115_000_000, last_round: "Series C", valuation: 600_000_000, investors: ["Insight Partners"] },
  deepgram: { total: 85_000_000, last_round: "Series B", valuation: 400_000_000, investors: ["Madrona", "Tiger Global"] },
  cartesia: { total: 27_000_000, last_round: "Series A", valuation: 150_000_000, investors: ["Index Ventures", "Lightspeed"] },

  // MUSIC
  suno: { total: 125_000_000, last_round: "Series B", valuation: 500_000_000, investors: ["Lightspeed", "Nat Friedman"] },
  udio: { total: 10_000_000, last_round: "Seed", valuation: 50_000_000, investors: ["a16z"] },

  // WRITING & CONTENT
  jasper: { total: 293_000_000, last_round: "Series C", valuation: 1_500_000_000, investors: ["Insight Partners", "IVP"] },
  copyai: { total: 14_000_000, last_round: "Series A", valuation: 70_000_000, investors: ["Wing VC"] },
  writer: { total: 200_000_000, last_round: "Series C", valuation: 1_900_000_000, investors: ["Iconiq Growth", "Radical Ventures"] },

  // PRODUCTIVITY
  notion: { total: 343_000_000, last_round: "Series C", valuation: 10_000_000_000, investors: ["Sequoia", "Coatue"] },
  granola: { total: 20_000_000, last_round: "Series A", valuation: 100_000_000, investors: ["Lightspeed"] },

  // FOUNDATION MODELS
  openai: { total: 11_300_000_000, last_round: "Series E", valuation: 157_000_000_000, investors: ["Microsoft", "Thrive Capital", "Khosla Ventures"] },
  anthropic: { total: 7_300_000_000, last_round: "Series D", valuation: 60_000_000_000, investors: ["Google", "Spark Capital", "Menlo Ventures"] },
  deepmind: { total: null, last_round: "Google Subsidiary", valuation: null, investors: [] },
  mistral: { total: 1_100_000_000, last_round: "Series B", valuation: 6_200_000_000, investors: ["General Catalyst", "a16z", "Lightspeed"] },
  cohere: { total: 970_000_000, last_round: "Series D", valuation: 5_500_000_000, investors: ["Inovia Capital", "Nvidia"] },
  xai: { total: 12_000_000_000, last_round: "Series C", valuation: 50_000_000_000, investors: ["a16z", "Sequoia", "Valor Equity Partners"] },
  deepseek: { total: null, last_round: "Self-funded", valuation: null, investors: [] },
  meta_llama: { total: null, last_round: "Meta Product", valuation: null, investors: [] },
  qwen: { total: null, last_round: "Alibaba Product", valuation: null, investors: [] },

  // INFERENCE & SERVING
  groq: { total: 640_000_000, last_round: "Series D", valuation: 2_800_000_000, investors: ["BlackRock", "Samsung"] },
  together: { total: 225_000_000, last_round: "Series A", valuation: 1_250_000_000, investors: ["Salesforce Ventures", "Kleiner Perkins"] },
  fireworks: { total: 52_000_000, last_round: "Series A", valuation: 250_000_000, investors: ["Benchmark", "Sequoia"] },
  modal: { total: 64_000_000, last_round: "Series B", valuation: 300_000_000, investors: ["Redpoint", "a16z"] },
  cerebras: { total: 720_000_000, last_round: "Series F", valuation: 4_250_000_000, investors: ["G42", "Eclipse Ventures"] },
  sambanova: { total: 1_100_000_000, last_round: "Series D", valuation: 5_100_000_000, investors: ["SoftBank", "BlackRock", "Intel Capital"] },
  anyscale: { total: 260_000_000, last_round: "Series C", valuation: 1_000_000_000, investors: ["a16z", "Addition"] },
  replicate: { total: 58_000_000, last_round: "Series B", valuation: 350_000_000, investors: ["a16z", "Y Combinator"] },
  baseten: { total: 58_000_000, last_round: "Series B", valuation: 280_000_000, investors: ["IVP", "Spark Capital"] },

  // MODEL HUBS
  huggingface: { total: 395_000_000, last_round: "Series D", valuation: 4_500_000_000, investors: ["Google", "Salesforce", "Nvidia"] },

  // CRYPTO-AI
  bittensor: { total: null, last_round: "Token Launch", valuation: null, investors: [] },
  virtuals: { total: null, last_round: "Token Launch", valuation: null, investors: [] },
  ai16z: { total: null, last_round: "Token/DAO", valuation: null, investors: [] },
  fetchai: { total: 30_000_000, last_round: "Series A", valuation: null, investors: ["DWF Labs"] },
  akash: { total: 5_000_000, last_round: "Seed", valuation: null, investors: [] },
  ritual: { total: 25_000_000, last_round: "Series A", valuation: 250_000_000, investors: ["Archetype", "Polychain Capital"] },

  // VOICE AGENTS
  vapi: { total: 20_000_000, last_round: "Series A", valuation: 120_000_000, investors: ["Todd & Rahul's Angel Fund"] },
  retell: { total: 5_000_000, last_round: "Seed", valuation: 25_000_000, investors: ["Y Combinator"] },

  // BROWSER & COMPUTER USE
  browserbase: { total: 7_000_000, last_round: "Seed", valuation: 50_000_000, investors: ["Kleiner Perkins"] },

  // CUSTOMER SUPPORT
  intercom_fin: { total: null, last_round: "Intercom Product", valuation: null, investors: [] },
  sierra: { total: 175_000_000, last_round: "Series B", valuation: 4_500_000_000, investors: ["Sequoia", "Benchmark"] },
  forethought: { total: 92_000_000, last_round: "Series C", valuation: 350_000_000, investors: ["New Enterprise Associates"] },

  // SALES & GTM
  "11x": { total: 50_000_000, last_round: "Series B", valuation: 350_000_000, investors: ["Benchmark", "a16z"] },
  clay: { total: 46_000_000, last_round: "Series B", valuation: 500_000_000, investors: ["Meritech Capital"] },
  apollo_ai: { total: 244_000_000, last_round: "Series D", valuation: 1_600_000_000, investors: ["Bain Capital Ventures", "Sequoia"] },

  // DATA & ANALYTICS
  "scale-ai": { total: 600_000_000, last_round: "Series F", valuation: 13_800_000_000, investors: ["Accel", "Tiger Global"] },
  databricks: { total: 4_000_000_000, last_round: "Series I", valuation: 43_000_000_000, investors: ["a16z", "T. Rowe Price"] },
  snorkel: { total: 135_000_000, last_round: "Series C", valuation: 1_000_000_000, investors: ["Lightspeed", "Greylock"] },

  // DESIGN & CREATIVE
  canva_magic: { total: null, last_round: "Canva Product", valuation: null, investors: [] },

  // LEGAL
  harvey: { total: 206_000_000, last_round: "Series C", valuation: 1_500_000_000, investors: ["Google Ventures", "Sequoia"] },
  "casetext-cocounsel": { total: null, last_round: "Acquired by Thomson Reuters", valuation: 650_000_000, investors: [] },

  // ROBOTICS
  figure: { total: 754_000_000, last_round: "Series B", valuation: 2_600_000_000, investors: ["Microsoft", "Nvidia", "Jeff Bezos"] },
  "1x": { total: 125_000_000, last_round: "Series B", valuation: 600_000_000, investors: ["EQT Ventures", "Tiger Global"] },
  "physical-intelligence": { total: 400_000_000, last_round: "Series A", valuation: 2_000_000_000, investors: ["Bezos Expeditions", "Thrive Capital"] },

  // HEALTHCARE
  "med-palm": { total: null, last_round: "Google Product", valuation: null, investors: [] },

  // 3D & SPATIAL
  "world-labs": { total: 230_000_000, last_round: "Series A", valuation: 1_000_000_000, investors: ["a16z", "Radical Ventures"] },
};

// Known user/traffic metrics from public announcements and estimates
const KNOWN_METRICS = {
  // Foundation models & major products
  openai: { mau: 200_000_000, mrr: 366_000_000 },
  anthropic: { mau: 30_000_000, mrr: 100_000_000 },
  perplexity: { mau: 15_000_000, mrr: 8_300_000 },
  midjourney: { mau: 16_000_000, mrr: 160_000_000 },
  "claude-code": { mau: 5_000_000 },
  copilot: { mau: 15_000_000, mrr: 100_000_000 },
  mistral: { mau: 5_000_000, mrr: 35_000_000 },
  deepseek: { mau: 20_000_000 },
  xai: { mau: 10_000_000, mrr: 25_000_000 },
  cohere: { mau: 1_000_000, mrr: 22_000_000 },

  // Code & Dev Tools
  cursor: { mau: 4_000_000, mrr: 40_000_000 },
  replit: { mau: 30_000_000, mrr: 10_000_000 },
  bolt: { mau: 2_000_000, mrr: 5_000_000 },
  lovable: { mau: 500_000, mrr: 2_000_000 },
  windsurf: { mau: 1_500_000, mrr: 3_000_000 },
  v0: { mau: 3_000_000 },
  tabnine: { mau: 1_000_000, mrr: 2_000_000 },
  cody: { mau: 500_000, mrr: 1_000_000 },

  // Image Generation
  stability: { mau: 10_000_000, mrr: 5_000_000 },
  ideogram: { mau: 3_000_000, mrr: 2_000_000 },

  // Video
  runway: { mau: 5_000_000, mrr: 12_000_000 },
  pika: { mau: 2_000_000, mrr: 3_000_000 },
  heygen: { mau: 1_000_000, mrr: 4_000_000 },
  luma: { mau: 1_500_000, mrr: 2_000_000 },
  hailuoai: { mau: 5_000_000 },
  kling: { mau: 3_000_000 },

  // Audio
  elevenlabs: { mau: 3_000_000, mrr: 10_000_000 },
  assemblyai: { mau: 200_000, mrr: 2_000_000 },
  deepgram: { mau: 100_000, mrr: 1_500_000 },
  suno: { mau: 12_000_000, mrr: 8_000_000 },
  udio: { mau: 2_000_000 },

  // Writing
  jasper: { mau: 1_000_000, mrr: 8_000_000 },
  writer: { mau: 500_000, mrr: 5_000_000 },
  notion: { mau: 35_000_000, mrr: 50_000_000 },

  // Search
  exa: { mau: 200_000 },

  // Inference
  groq: { mau: 2_000_000, mrr: 3_000_000 },
  together: { mau: 500_000, mrr: 4_000_000 },
  huggingface: { mau: 10_000_000, mrr: 7_000_000 },
  replicate: { mau: 1_000_000, mrr: 2_000_000 },

  // Agents
  devin: { mau: 100_000, mrr: 2_000_000 },
  lindy: { mau: 50_000 },

  // Sales & GTM
  clay: { mau: 200_000, mrr: 4_000_000 },
  apollo_ai: { mau: 3_000_000, mrr: 10_000_000 },

  // Data
  "scale-ai": { mau: 100_000, mrr: 60_000_000 },
  databricks: { mau: 10_000, mrr: 150_000_000 },

  // Legal
  harvey: { mau: 50_000, mrr: 5_000_000 },

  // Customer Support
  sierra: { mau: 200_000, mrr: 5_000_000 },

  // Voice Agents
  vapi: { mau: 50_000, mrr: 800_000 },

  // Agent Frameworks (GitHub-heavy, low direct revenue)
  langchain: { mau: 500_000 },
  llamaindex: { mau: 200_000 },
};

export function getFundingData(productId) {
  return KNOWN_FUNDING[productId] || null;
}

export function getAllFundingData() {
  return KNOWN_FUNDING;
}

export function getKnownMetrics(productId) {
  return KNOWN_METRICS[productId] || null;
}

export function getAllKnownMetrics() {
  return KNOWN_METRICS;
}

export async function searchFundingNews(companyName) {
  return {
    company: companyName,
    recent_articles: [],
    note: "News search not yet configured. Add NEWS_API_KEY to enable.",
    checked_at: new Date().toISOString(),
  };
}
