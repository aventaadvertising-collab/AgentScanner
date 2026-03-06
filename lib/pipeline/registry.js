// ============================================================
// AGENTSCREENER — MASTER PRODUCT REGISTRY
// The most comprehensive index of the AI product ecosystem
// 120+ products mapped to every scrapeable identifier
// ============================================================

export const CATEGORIES = [
  "Code & Dev Tools",
  "AI Agents",
  "Agent Frameworks",
  "Search & Research",
  "Image Generation",
  "Video Generation",
  "Audio & Voice",
  "Music Generation",
  "Writing & Content",
  "Productivity & Workspace",
  "Foundation Models",
  "Inference & Serving",
  "Model Hubs & Tooling",
  "Crypto-AI",
  "Design & Creative",
  "Customer Support AI",
  "Sales & GTM AI",
  "Data & Analytics",
  "Open Source Models",
  "AI Safety & Alignment",
  "Robotics & Embodied AI",
  "Healthcare AI",
  "Legal AI",
  "Finance AI",
  "Education AI",
  "Browser & Computer Use",
  "Voice Agents & Telephony",
  "3D & Spatial AI",
];

// Shorthand: g=github, w=website, x=twitter, d=discord, c=careers,
// cb=crunchbase, li=linkedin, em=contactEmail, cn=contactName
// tk=token (crypto), as=appStore, ps=playStore
// tags for search/filter

export const REGISTRY = [

  // ================================================================
  // CODE & DEV TOOLS
  // ================================================================
  { id: "cursor", name: "Cursor", cat: "Code & Dev Tools", g: { o: "getcursor", r: "cursor" }, w: "https://cursor.com", x: "cursor_ai", c: "https://cursor.com/careers", cb: "anysphere", li: "anysphere", em: "hello@cursor.com", cn: "Anysphere", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["ide","ai-coding","vscode-fork"] },
  { id: "bolt", name: "Bolt.new", cat: "Code & Dev Tools", g: { o: "stackblitz", r: "bolt.new" }, w: "https://bolt.new", x: "stackblitz", c: "https://stackblitz.com/careers", cb: "stackblitz", li: "stackblitz", em: "team@stackblitz.com", cn: "StackBlitz", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["prompt-to-app","webcontainers","full-stack"] },
  { id: "lovable", name: "Lovable", cat: "Code & Dev Tools", g: { o: "lovable-dev", r: "lovable" }, w: "https://lovable.dev", x: "lovable_dev", d: "lovable", c: "https://lovable.dev/careers", cb: "lovable", li: "lovable-dev", em: "hello@lovable.dev", cn: "Lovable", yr: "2024", hq: "Stockholm", added: "2025-01-15", tags: ["prompt-to-app","ai-engineer"] },
  { id: "windsurf", name: "Windsurf", cat: "Code & Dev Tools", w: "https://windsurf.com", x: "windsurf_ai", c: "https://codeium.com/careers", cb: "codeium", li: "codeium", em: "hello@codeium.com", cn: "Codeium", yr: "2023", hq: "Mountain View", added: "2025-01-15", tags: ["ide","ai-coding","cascade"] },
  { id: "v0", name: "v0 by Vercel", cat: "Code & Dev Tools", w: "https://v0.dev", x: "v0", c: "https://vercel.com/careers", cb: "vercel", li: "vercel", em: "sales@vercel.com", cn: "Vercel", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["ui-gen","react","shadcn","frontend"] },
  { id: "claude-code", name: "Claude Code", cat: "Code & Dev Tools", w: "https://claude.ai", x: "AnthropicAI", c: "https://anthropic.com/careers", cb: "anthropic", li: "anthropic", em: "sales@anthropic.com", cn: "Anthropic", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["terminal","agentic-coding","cli"] },
  { id: "copilot", name: "GitHub Copilot", cat: "Code & Dev Tools", g: { o: "github", r: "copilot-docs" }, w: "https://github.com/features/copilot", x: "GitHubCopilot", c: "https://github.com/about/careers", cb: "github", li: "github", em: "copilot@github.com", cn: "GitHub", yr: "2021", hq: "SF", added: "2025-01-15", tags: ["code-completion","agent","workspace"] },
  { id: "replit", name: "Replit", cat: "Code & Dev Tools", g: { o: "replit", r: "replit" }, w: "https://replit.com", x: "Replit", d: "replit", c: "https://replit.com/careers", cb: "replit", li: "replit", em: "partnerships@replit.com", cn: "Replit", yr: "2016", hq: "SF", as: "replit", ps: "com.replit.app", added: "2025-01-15", tags: ["cloud-ide","agent","deployment"] },
  { id: "cody", name: "Cody (Sourcegraph)", cat: "Code & Dev Tools", g: { o: "sourcegraph", r: "cody" }, w: "https://sourcegraph.com/cody", x: "sourcegraph", d: "sourcegraph", c: "https://sourcegraph.com/careers", cb: "sourcegraph", li: "sourcegraph", em: "hi@sourcegraph.com", cn: "Sourcegraph", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["code-ai","code-search","context"] },
  { id: "tabnine", name: "Tabnine", cat: "Code & Dev Tools", g: { o: "codota", r: "tabnine-vscode" }, w: "https://tabnine.com", x: "tabnine", c: "https://tabnine.com/careers", cb: "tabnine", li: "tabnine", em: "info@tabnine.com", cn: "Tabnine", yr: "2018", hq: "Tel Aviv", added: "2025-01-15", tags: ["code-completion","privacy","on-prem"] },
  { id: "aider", name: "Aider", cat: "Code & Dev Tools", g: { o: "Aider-AI", r: "aider" }, w: "https://aider.chat", x: "paulaborrgauthier", added: "2025-01-15", tags: ["cli","pair-programming","open-source","terminal"] },
  { id: "continue", name: "Continue", cat: "Code & Dev Tools", g: { o: "continuedev", r: "continue" }, w: "https://continue.dev", x: "continueabordev", d: "continue", cb: "continue-dev", added: "2025-01-15", tags: ["open-source","ide","autopilot","customizable"] },
  { id: "sweep", name: "Sweep AI", cat: "Code & Dev Tools", g: { o: "sweepai", r: "sweep" }, w: "https://sweep.dev", x: "sweepaborai", added: "2025-01-15", tags: ["github-bot","pull-requests","junior-dev"] },
  { id: "codegen", name: "Codegen", cat: "Code & Dev Tools", g: { o: "codegen-sh", r: "codegen-sdk" }, w: "https://codegen.sh", x: "codegenaborsh", added: "2025-01-15", tags: ["programmatic-codemod","sdk","refactoring"] },
  { id: "poolside", name: "Poolside", cat: "Code & Dev Tools", w: "https://poolside.ai", x: "PoolsideaborAI", c: "https://poolside.ai/careers", cb: "poolside-ai", added: "2025-01-15", tags: ["code-gen","reinforcement-learning","foundation-model"] },
  { id: "magic-ai", name: "Magic", cat: "Code & Dev Tools", w: "https://magic.dev", x: "magicabordev", c: "https://magic.dev/careers", cb: "magic-dev", added: "2025-01-15", tags: ["long-context","code-gen","ltm"] },
  { id: "augment", name: "Augment Code", cat: "Code & Dev Tools", w: "https://augmentcode.com", x: "AugmentaborCode", c: "https://augmentcode.com/careers", cb: "augment-code", added: "2025-01-15", tags: ["enterprise","context","ai-coding"] },

  // ================================================================
  // AI AGENTS (autonomous & semi-autonomous)
  // ================================================================
  { id: "devin", name: "Devin", cat: "AI Agents", w: "https://devin.ai", x: "cognition_labs", c: "https://cognition.ai/careers", cb: "cognition-ai", li: "cognition-ai", em: "info@cognition.ai", cn: "Cognition Labs", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["autonomous-engineer","coding-agent"] },
  { id: "openai-operator", name: "Operator (OpenAI)", cat: "AI Agents", w: "https://operator.chatgpt.com", x: "OpenAI", added: "2025-01-15", tags: ["browser-agent","task-completion","consumer"] },
  { id: "manus", name: "Manus", cat: "AI Agents", w: "https://manus.im", x: "maboranusIM", added: "2025-01-15", tags: ["general-purpose","computer-use","research-agent"] },
  { id: "multion", name: "MultiOn", cat: "AI Agents", g: { o: "MULTI-ON", r: "multion-python" }, w: "https://multion.ai", x: "AskMultiOn", cb: "multion", added: "2025-01-15", tags: ["web-agent","browser","personal-ai"] },
  { id: "adept", name: "Adept", cat: "AI Agents", w: "https://adept.ai", x: "AdeptaborAILabs", c: "https://adept.ai/careers", cb: "adept-ai-labs", added: "2025-01-15", tags: ["act-1","computer-use","enterprise"] },
  { id: "lindy", name: "Lindy.ai", cat: "AI Agents", w: "https://lindy.ai", x: "lindaboryai", c: "https://lindy.ai/careers", cb: "lindy-ai", added: "2025-01-15", tags: ["no-code-agents","workflows","automation"] },
  { id: "relevance", name: "Relevance AI", cat: "AI Agents", w: "https://relevanceai.com", x: "RelevanceAI_", c: "https://relevanceai.com/careers", cb: "relevance-ai", added: "2025-01-15", tags: ["agent-builder","no-code","workforce"] },
  { id: "hyperwrite", name: "HyperWrite / Otherside", cat: "AI Agents", g: { o: "OthersideAI", r: "self-operating-computer" }, w: "https://hyperwrite.ai", x: "OthersaborideAI", cb: "hyperwrite", added: "2025-01-15", tags: ["writing-agent","browser-agent","personal-ai"] },
  { id: "induced", name: "Induced AI", cat: "AI Agents", w: "https://induced.ai", x: "inducedaborai", cb: "induced-ai", added: "2025-01-15", tags: ["browser-agent","rpa","automation"] },
  { id: "twin", name: "Twin", cat: "AI Agents", w: "https://twin.so", x: "twinaborso", added: "2025-01-15", tags: ["browser-agent","task-automation","api"] },
  { id: "skyvern", name: "Skyvern", cat: "AI Agents", g: { o: "Skyvern-AI", r: "skyvern" }, w: "https://skyvern.com", x: "skyvernaborai", added: "2025-01-15", tags: ["browser-automation","rpa","open-source"] },

  // ================================================================
  // AGENT FRAMEWORKS
  // ================================================================
  { id: "langchain", name: "LangChain", cat: "Agent Frameworks", g: { o: "langchain-ai", r: "langchain" }, w: "https://langchain.com", x: "LangChainAI", d: "langchain", c: "https://langchain.com/careers", cb: "langchain", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["framework","chains","agents","langgraph"] },
  { id: "llamaindex", name: "LlamaIndex", cat: "Agent Frameworks", g: { o: "run-llama", r: "llama_index" }, w: "https://llamaindex.ai", x: "llama_index", d: "llamaindex", c: "https://llamaindex.ai/careers", cb: "llamaindex", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["rag","data-framework","agents"] },
  { id: "crewai", name: "CrewAI", cat: "Agent Frameworks", g: { o: "crewAIInc", r: "crewAI" }, w: "https://crewai.com", x: "crewAIInc", d: "crewai", cb: "crewai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["multi-agent","orchestration","roles"] },
  { id: "autogen", name: "AutoGen (Microsoft)", cat: "Agent Frameworks", g: { o: "microsoft", r: "autogen" }, w: "https://microsoft.github.io/autogen/", x: "pyaborautogen", d: "autogen", added: "2025-01-15", tags: ["multi-agent","conversation","microsoft","open-source"] },
  { id: "autogpt", name: "AutoGPT", cat: "Agent Frameworks", g: { o: "Significant-Gravitas", r: "AutoGPT" }, w: "https://agpt.co", x: "Auto_GPT", d: "autogpt", yr: "2023", added: "2025-01-15", tags: ["autonomous","task-decomposition","open-source"] },
  { id: "elizaos", name: "ElizaOS", cat: "Agent Frameworks", g: { o: "elizaOS", r: "eliza" }, w: "https://elizaos.ai", x: "elizaOS", d: "elizaos", yr: "2024", added: "2025-01-15", tags: ["crypto-ai","agent-framework","autonomous-trading","plugins"] },
  { id: "e2b", name: "E2B", cat: "Agent Frameworks", g: { o: "e2b-dev", r: "E2B" }, w: "https://e2b.dev", x: "e2b_dev", d: "e2b", cb: "e2b", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["sandboxes","code-execution","agent-infra"] },
  { id: "phidata", name: "Phidata", cat: "Agent Frameworks", g: { o: "phidatahq", r: "phidata" }, w: "https://phidata.com", x: "phiabordata", d: "phidata", added: "2025-01-15", tags: ["agent-framework","tools","memory","knowledge"] },
  { id: "smolagents", name: "smolagents (HF)", cat: "Agent Frameworks", g: { o: "huggingface", r: "smolagents" }, w: "https://huggingface.co/docs/smolagents", x: "huggingface", added: "2025-01-15", tags: ["lightweight","huggingface","code-agents","open-source"] },
  { id: "composio", name: "Composio", cat: "Agent Frameworks", g: { o: "ComposioHQ", r: "composio" }, w: "https://composio.dev", x: "composaboriodev", d: "composio", added: "2025-01-15", tags: ["tool-integration","agent-tooling","250+-tools"] },
  { id: "browser-use", name: "Browser Use", cat: "Agent Frameworks", g: { o: "browser-use", r: "browser-use" }, w: "https://browser-use.com", x: "BrowseraborUse", added: "2025-01-15", tags: ["browser-automation","langchain","open-source","vision"] },
  { id: "semantic-kernel", name: "Semantic Kernel", cat: "Agent Frameworks", g: { o: "microsoft", r: "semantic-kernel" }, w: "https://learn.microsoft.com/en-us/semantic-kernel/", x: "msaborftdev", added: "2025-01-15", tags: ["microsoft","enterprise","dotnet","python","planner"] },
  { id: "dspy", name: "DSPy", cat: "Agent Frameworks", g: { o: "stanfordnlp", r: "dspy" }, w: "https://dspy-docs.vercel.app", x: "lateinabort", added: "2025-01-15", tags: ["programming-not-prompting","compiler","stanford","optimization"] },
  { id: "haystack", name: "Haystack (deepset)", cat: "Agent Frameworks", g: { o: "deepset-ai", r: "haystack" }, w: "https://haystack.deepset.ai", x: "Haystack_AI", d: "haystack", cb: "deepset", added: "2025-01-15", tags: ["rag","pipelines","search","open-source"] },
  { id: "mastra", name: "Mastra", cat: "Agent Frameworks", g: { o: "mastra-ai", r: "mastra" }, w: "https://mastra.ai", x: "mastraaborai", d: "mastra", added: "2025-01-15", tags: ["typescript","agent-framework","workflows","tools"] },

  // ================================================================
  // SEARCH & RESEARCH
  // ================================================================
  { id: "perplexity", name: "Perplexity", cat: "Search & Research", w: "https://perplexity.ai", x: "perplexity_ai", d: "perplexity", c: "https://perplexity.ai/careers", cb: "perplexity-ai", li: "perplexity-ai", em: "hello@perplexity.ai", cn: "Perplexity", yr: "2022", hq: "SF", as: "perplexity-ask-anything", ps: "ai.perplexity.app.android", added: "2025-01-15", tags: ["answer-engine","search","citations","pro-search"] },
  { id: "you", name: "You.com", cat: "Search & Research", w: "https://you.com", x: "YouSearchEngine", c: "https://you.com/careers", cb: "you-com", yr: "2020", hq: "SF", added: "2025-01-15", tags: ["search","ai-modes","research"] },
  { id: "exa", name: "Exa", cat: "Search & Research", g: { o: "exa-labs", r: "exa-py" }, w: "https://exa.ai", x: "ExaAILabs", c: "https://exa.ai/careers", cb: "exa-ai", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["semantic-search","api","neural-search"] },
  { id: "elicit", name: "Elicit", cat: "Search & Research", w: "https://elicit.com", x: "elaboricit", c: "https://elicit.com/careers", cb: "elicit", yr: "2021", hq: "SF", added: "2025-01-15", tags: ["research-assistant","papers","systematic-review"] },
  { id: "consensus", name: "Consensus", cat: "Search & Research", w: "https://consensus.app", x: "ConsensusAI", cb: "consensus-app", yr: "2021", hq: "NYC", added: "2025-01-15", tags: ["academic-search","evidence-based","science"] },
  { id: "tavily", name: "Tavily", cat: "Search & Research", g: { o: "tavily-ai", r: "tavily-python" }, w: "https://tavily.com", x: "tavilyaborai", added: "2025-01-15", tags: ["search-api","agents","real-time","optimized-for-llm"] },
  { id: "scite", name: "scite.ai", cat: "Search & Research", w: "https://scite.ai", x: "scaborite_", cb: "scite", added: "2025-01-15", tags: ["smart-citations","academic","research"] },

  // ================================================================
  // IMAGE GENERATION
  // ================================================================
  { id: "midjourney", name: "Midjourney", cat: "Image Generation", w: "https://midjourney.com", x: "midjourney", d: "midjourney", cb: "midjourney", li: "midjourney-inc", em: "support@midjourney.com", cn: "Midjourney", yr: "2021", hq: "SF", added: "2025-01-15", tags: ["image-gen","discord","art"] },
  { id: "flux", name: "FLUX (BFL)", cat: "Image Generation", g: { o: "black-forest-labs", r: "flux" }, w: "https://blackforestlabs.ai", x: "bfl_ml", cb: "black-forest-labs", yr: "2024", hq: "Freiburg", added: "2025-01-15", tags: ["image-gen","open-source","diffusion"] },
  { id: "ideogram", name: "Ideogram", cat: "Image Generation", w: "https://ideogram.ai", x: "ideogramAI", d: "ideogram", cb: "ideogram", yr: "2023", hq: "Toronto", added: "2025-01-15", tags: ["image-gen","text-rendering","typography"] },
  { id: "stability", name: "Stability AI", cat: "Image Generation", g: { o: "Stability-AI", r: "stablediffusion" }, w: "https://stability.ai", x: "StabilityAI", d: "stablediffusion", c: "https://stability.ai/careers", cb: "stability-ai", yr: "2020", hq: "London", added: "2025-01-15", tags: ["stable-diffusion","open-source","sd3"] },
  { id: "leonardo", name: "Leonardo.ai", cat: "Image Generation", w: "https://leonardo.ai", x: "LeonardoAi_", d: "leonardo-ai", c: "https://leonardo.ai/careers", cb: "leonardo-ai", yr: "2022", hq: "Sydney", as: "leonardo-ai-image-generator", ps: "ai.leonardo.android", added: "2025-01-15", tags: ["image-gen","game-assets","creative"] },
  { id: "recraft", name: "Recraft", cat: "Image Generation", w: "https://recraft.ai", x: "recaborraftai", cb: "recraft", added: "2025-01-15", tags: ["vector","brand-consistent","design-ai","image-gen"] },
  { id: "krea", name: "Krea AI", cat: "Image Generation", w: "https://krea.ai", x: "kreaboraai", d: "krea", added: "2025-01-15", tags: ["real-time","image-gen","enhance","upscale"] },

  // ================================================================
  // VIDEO GENERATION
  // ================================================================
  { id: "heygen", name: "HeyGen", cat: "Video Generation", w: "https://heygen.com", x: "HeyGen_Official", c: "https://heygen.com/careers", cb: "heygen", li: "heygen", em: "partnerships@heygen.com", cn: "HeyGen", yr: "2022", hq: "LA", added: "2025-01-15", tags: ["avatars","dubbing","localization"] },
  { id: "runway", name: "Runway", cat: "Video Generation", w: "https://runwayml.com", x: "runwayml", d: "runway", c: "https://runwayml.com/careers", cb: "runwayml", yr: "2018", hq: "NYC", added: "2025-01-15", tags: ["gen-3","video-gen","creative-tools"] },
  { id: "pika", name: "Pika", cat: "Video Generation", w: "https://pika.art", x: "pika_labs", d: "pika", c: "https://pika.art/careers", cb: "pika-labs", yr: "2023", hq: "Palo Alto", added: "2025-01-15", tags: ["text-to-video","editing","effects"] },
  { id: "kling", name: "Kling AI", cat: "Video Generation", w: "https://klingai.com", x: "AIKling", cn: "Kuaishou", yr: "2024", hq: "Beijing", added: "2025-01-15", tags: ["text-to-video","long-form","chinese-ai"] },
  { id: "synthesia", name: "Synthesia", cat: "Video Generation", w: "https://synthesia.io", x: "synthesiaIO", c: "https://synthesia.io/careers", cb: "synthesia", yr: "2017", hq: "London", added: "2025-01-15", tags: ["ai-avatars","enterprise-video","training"] },
  { id: "luma", name: "Luma AI (Dream Machine)", cat: "Video Generation", w: "https://lumalabs.ai", x: "LumaLabsAI", d: "luma", cb: "luma-ai", yr: "2021", hq: "SF", added: "2025-01-15", tags: ["video-gen","3d","dream-machine","ray"] },
  { id: "minimax-hailuo", name: "Hailuo AI (MiniMax)", cat: "Video Generation", w: "https://hailuoai.video", x: "AaborIMinimax", yr: "2023", hq: "Beijing", added: "2025-01-15", tags: ["text-to-video","chinese-ai","fast"] },
  { id: "veo", name: "Veo (Google)", cat: "Video Generation", w: "https://deepmind.google/technologies/veo/", x: "GoogleDeepMind", yr: "2024", hq: "London", added: "2025-01-15", tags: ["google","video-gen","high-fidelity"] },
  { id: "sora", name: "Sora (OpenAI)", cat: "Video Generation", w: "https://openai.com/sora", x: "OpenAI", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["text-to-video","world-model","physics"] },

  // ================================================================
  // AUDIO & VOICE
  // ================================================================
  { id: "elevenlabs", name: "ElevenLabs", cat: "Audio & Voice", g: { o: "elevenlabs", r: "elevenlabs-python" }, w: "https://elevenlabs.io", x: "elevenlabsio", d: "elevenlabs", c: "https://elevenlabs.io/careers", cb: "elevenlabs", li: "elevenlabsio", em: "hello@elevenlabs.io", cn: "ElevenLabs", yr: "2022", hq: "NYC", as: "elevenlabs-reader", ps: "io.elevenlabs.android", added: "2025-01-15", tags: ["tts","voice-cloning","dubbing"] },
  { id: "assemblyai", name: "AssemblyAI", cat: "Audio & Voice", g: { o: "AssemblyAI", r: "assemblyai-python-sdk" }, w: "https://assemblyai.com", x: "AssemblyAI", d: "assemblyai", c: "https://assemblyai.com/careers", cb: "assemblyai", yr: "2017", hq: "SF", added: "2025-01-15", tags: ["stt","transcription","audio-intelligence"] },
  { id: "deepgram", name: "Deepgram", cat: "Audio & Voice", g: { o: "deepgram", r: "deepgram-python-sdk" }, w: "https://deepgram.com", x: "DeepgramAI", d: "deepgram", c: "https://deepgram.com/careers", cb: "deepgram", yr: "2015", hq: "Ann Arbor", added: "2025-01-15", tags: ["stt","tts","voice-api","aura"] },
  { id: "cartesia", name: "Cartesia", cat: "Audio & Voice", g: { o: "cartesia-ai", r: "cartesia-python" }, w: "https://cartesia.ai", x: "cartesaboriaai", cb: "cartesia", added: "2025-01-15", tags: ["tts","real-time","sonic","state-space"] },
  { id: "play-ht", name: "PlayHT", cat: "Audio & Voice", w: "https://play.ht", x: "PlayHTaborAI", cb: "playht", added: "2025-01-15", tags: ["tts","voice-cloning","api","agents"] },

  // ================================================================
  // MUSIC GENERATION
  // ================================================================
  { id: "suno", name: "Suno", cat: "Music Generation", w: "https://suno.com", x: "sunomusic", d: "suno", c: "https://suno.com/careers", cb: "suno-ai", yr: "2022", hq: "Cambridge", as: "suno-make-music", added: "2025-01-15", tags: ["music-gen","text-to-music","vocals"] },
  { id: "udio", name: "Udio", cat: "Music Generation", w: "https://udio.com", x: "udiomusic", d: "udio", yr: "2023", hq: "NYC", added: "2025-01-15", tags: ["music-gen","text-to-music","high-quality"] },

  // ================================================================
  // WRITING & CONTENT
  // ================================================================
  { id: "jasper", name: "Jasper", cat: "Writing & Content", w: "https://jasper.ai", x: "jasper_ai", c: "https://jasper.ai/careers", cb: "jasper-ai", yr: "2021", hq: "Austin", added: "2025-01-15", tags: ["marketing","copywriting","enterprise"] },
  { id: "copy-ai", name: "Copy.ai", cat: "Writing & Content", w: "https://copy.ai", x: "copy_ai", c: "https://copy.ai/careers", cb: "copy-ai", yr: "2020", hq: "Memphis", added: "2025-01-15", tags: ["copywriting","workflows","gtm"] },
  { id: "writer", name: "Writer", cat: "Writing & Content", w: "https://writer.com", x: "Get_Writer", c: "https://writer.com/careers", cb: "writer", yr: "2020", hq: "SF", added: "2025-01-15", tags: ["enterprise","content-platform","palmyra"] },
  { id: "grammarly", name: "Grammarly", cat: "Writing & Content", w: "https://grammarly.com", x: "Grammarly", c: "https://grammarly.com/careers", cb: "grammarly", yr: "2009", hq: "SF", as: "grammarly-keyboard", ps: "com.grammarly.android.keyboard", added: "2025-01-15", tags: ["grammar","writing-assistant","tone","enterprise"] },

  // ================================================================
  // PRODUCTIVITY & WORKSPACE
  // ================================================================
  { id: "notion-ai", name: "Notion AI", cat: "Productivity & Workspace", w: "https://notion.so", x: "NotionHQ", c: "https://notion.so/careers", cb: "notion", yr: "2023", hq: "SF", as: "notion-notes-docs-tasks", ps: "notion.id", added: "2025-01-15", tags: ["workspace","docs","ai-writing"] },
  { id: "otter", name: "Otter.ai", cat: "Productivity & Workspace", w: "https://otter.ai", x: "otter_ai", c: "https://otter.ai/careers", cb: "otter-ai", yr: "2016", hq: "Mountain View", as: "otter-voice-meeting-notes", ps: "com.aisense.otter", added: "2025-01-15", tags: ["meeting-notes","transcription"] },
  { id: "granola", name: "Granola", cat: "Productivity & Workspace", w: "https://granola.ai", x: "granola_ai", cb: "granola-ai", yr: "2023", hq: "London", added: "2025-01-15", tags: ["meeting-notes","ai-notepad","macos"] },
  { id: "mem", name: "Mem", cat: "Productivity & Workspace", w: "https://mem.ai", x: "memdaborotai", c: "https://mem.ai/careers", cb: "mem", yr: "2020", hq: "SF", added: "2025-01-15", tags: ["notes","knowledge-management","self-organizing"] },
  { id: "tldraw", name: "tldraw", cat: "Productivity & Workspace", g: { o: "tldraw", r: "tldraw" }, w: "https://tldraw.com", x: "tldraw", added: "2025-01-15", tags: ["whiteboard","canvas","make-real","open-source"] },

  // ================================================================
  // FOUNDATION MODELS
  // ================================================================
  { id: "openai", name: "OpenAI", cat: "Foundation Models", g: { o: "openai", r: "openai-python" }, w: "https://openai.com", x: "OpenAI", d: "openai", c: "https://openai.com/careers", cb: "openai", li: "openai", yr: "2015", hq: "SF", as: "chatgpt", ps: "com.openai.chatgpt", added: "2025-01-15", tags: ["gpt","chatgpt","o1","dall-e","api"] },
  { id: "anthropic", name: "Anthropic", cat: "Foundation Models", g: { o: "anthropics", r: "anthropic-sdk-python" }, w: "https://anthropic.com", x: "AnthropicAI", c: "https://anthropic.com/careers", cb: "anthropic", li: "anthropic", yr: "2021", hq: "SF", as: "claude", ps: "com.anthropic.claude", added: "2025-01-15", tags: ["claude","safety","constitutional-ai"] },
  { id: "deepmind", name: "Google DeepMind", cat: "Foundation Models", g: { o: "google-deepmind", r: "gemma" }, w: "https://deepmind.google", x: "GoogleDeepMind", c: "https://deepmind.google/careers", cb: "deepmind", yr: "2010", hq: "London", added: "2025-01-15", tags: ["gemini","gemma","alphafold","research"] },
  { id: "meta-ai", name: "Meta AI (Llama)", cat: "Foundation Models", g: { o: "meta-llama", r: "llama" }, w: "https://ai.meta.com", x: "AIatMeta", yr: "2023", hq: "Menlo Park", added: "2025-01-15", tags: ["llama","open-source","research"] },
  { id: "mistral", name: "Mistral AI", cat: "Foundation Models", g: { o: "mistralai", r: "mistral-inference" }, w: "https://mistral.ai", x: "MistralAI", d: "mistral", c: "https://mistral.ai/careers", cb: "mistral-ai", yr: "2023", hq: "Paris", as: "le-chat-by-mistral-ai", added: "2025-01-15", tags: ["open-models","mixtral","european-ai"] },
  { id: "cohere", name: "Cohere", cat: "Foundation Models", g: { o: "cohere-ai", r: "cohere-python" }, w: "https://cohere.com", x: "cohere", d: "cohere", c: "https://cohere.com/careers", cb: "cohere", yr: "2019", hq: "Toronto", added: "2025-01-15", tags: ["enterprise","embeddings","command","rag"] },
  { id: "xai", name: "xAI", cat: "Foundation Models", g: { o: "xai-org", r: "grok-1" }, w: "https://x.ai", x: "xai", c: "https://x.ai/careers", cb: "xai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["grok","twitter-data","colossus"] },
  { id: "ai21", name: "AI21 Labs", cat: "Foundation Models", g: { o: "AI21Labs", r: "ai21-python" }, w: "https://ai21.com", x: "AI21Labs", c: "https://ai21.com/careers", cb: "ai21-labs", yr: "2017", hq: "Tel Aviv", added: "2025-01-15", tags: ["jamba","enterprise","hybrid-architecture"] },
  { id: "deepseek", name: "DeepSeek", cat: "Foundation Models", g: { o: "deepseek-ai", r: "DeepSeek-V3" }, w: "https://deepseek.com", x: "deepseek_ai", yr: "2023", hq: "Hangzhou", added: "2025-01-15", tags: ["open-source","r1","chinese-ai","reasoning","low-cost"] },
  { id: "qwen", name: "Qwen (Alibaba)", cat: "Foundation Models", g: { o: "QwenLM", r: "Qwen" }, w: "https://qwenlm.github.io", x: "Qwen_LM", yr: "2023", hq: "Hangzhou", added: "2025-01-15", tags: ["open-source","chinese-ai","multimodal"] },
  { id: "zhipu", name: "Zhipu AI (GLM)", cat: "Foundation Models", g: { o: "THUDM", r: "GLM-4" }, w: "https://zhipuai.cn", x: "thukeg", yr: "2019", hq: "Beijing", added: "2025-01-15", tags: ["glm","chinese-ai","tsinghua"] },

  // ================================================================
  // INFERENCE & SERVING
  // ================================================================
  { id: "groq", name: "Groq", cat: "Inference & Serving", w: "https://groq.com", x: "GroqInc", d: "groq", c: "https://groq.com/careers", cb: "groq", yr: "2016", hq: "Mountain View", added: "2025-01-15", tags: ["lpu","hardware","fast-inference"] },
  { id: "together", name: "Together AI", cat: "Inference & Serving", g: { o: "togethercomputer", r: "together-python" }, w: "https://together.ai", x: "TogetherCompute", d: "together", c: "https://together.ai/careers", cb: "together-ai", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["inference","fine-tuning","open-source","gpu-cloud"] },
  { id: "replicate", name: "Replicate", cat: "Inference & Serving", g: { o: "replicate", r: "replicate-python" }, w: "https://replicate.com", x: "replicate", d: "replicate", cb: "replicate", yr: "2019", hq: "SF", added: "2025-01-15", tags: ["model-hosting","api","open-source-models"] },
  { id: "fireworks", name: "Fireworks AI", cat: "Inference & Serving", w: "https://fireworks.ai", x: "fireworksai_hq", d: "fireworks-ai", c: "https://fireworks.ai/careers", cb: "fireworks-ai", yr: "2022", hq: "Redwood City", added: "2025-01-15", tags: ["inference","compound-ai","fast"] },
  { id: "modal", name: "Modal", cat: "Inference & Serving", g: { o: "modal-labs", r: "modal-client" }, w: "https://modal.com", x: "modal_labs", c: "https://modal.com/careers", cb: "modal-labs", yr: "2021", hq: "SF", added: "2025-01-15", tags: ["serverless-gpu","containers","python"] },
  { id: "baseten", name: "Baseten", cat: "Inference & Serving", g: { o: "basetenlabs", r: "truss" }, w: "https://baseten.co", x: "basetenco", c: "https://baseten.co/careers", cb: "baseten", yr: "2019", hq: "SF", added: "2025-01-15", tags: ["model-serving","truss","gpu-infra"] },
  { id: "anyscale", name: "Anyscale", cat: "Inference & Serving", g: { o: "ray-project", r: "ray" }, w: "https://anyscale.com", x: "anaboryscalecompute", c: "https://anyscale.com/careers", cb: "anyscale", yr: "2019", hq: "SF", added: "2025-01-15", tags: ["ray","distributed-compute","training","serving"] },
  { id: "cerebras", name: "Cerebras", cat: "Inference & Serving", w: "https://cerebras.ai", x: "CerebrasAI", c: "https://cerebras.ai/careers", cb: "cerebras-systems", yr: "2016", hq: "Sunnyvale", added: "2025-01-15", tags: ["wafer-scale","hardware","fast-inference"] },
  { id: "sambanova", name: "SambaNova", cat: "Inference & Serving", w: "https://sambanova.ai", x: "SambaNaborovaAI", c: "https://sambanova.ai/careers", cb: "sambanova-systems", yr: "2017", hq: "Palo Alto", added: "2025-01-15", tags: ["enterprise","hardware","rdu"] },

  // ================================================================
  // MODEL HUBS & TOOLING
  // ================================================================
  { id: "huggingface", name: "Hugging Face", cat: "Model Hubs & Tooling", g: { o: "huggingface", r: "transformers" }, w: "https://huggingface.co", x: "huggingface", d: "huggingface", c: "https://huggingface.co/jobs", cb: "hugging-face", yr: "2016", hq: "NYC", added: "2025-01-15", tags: ["model-hub","transformers","community","open-source"] },
  { id: "weights-biases", name: "Weights & Biases", cat: "Model Hubs & Tooling", g: { o: "wandb", r: "wandb" }, w: "https://wandb.ai", x: "wanabordb_ai", c: "https://wandb.ai/careers", cb: "weights-and-biases", yr: "2017", hq: "SF", added: "2025-01-15", tags: ["experiment-tracking","mlops","evaluation"] },
  { id: "roboflow", name: "Roboflow", cat: "Model Hubs & Tooling", g: { o: "roboflow", r: "supervision" }, w: "https://roboflow.com", x: "roboflow", d: "roboflow", c: "https://roboflow.com/careers", cb: "roboflow", yr: "2019", hq: "Des Moines", added: "2025-01-15", tags: ["computer-vision","annotation","deployment"] },
  { id: "unsloth", name: "Unsloth", cat: "Model Hubs & Tooling", g: { o: "unslothai", r: "unsloth" }, w: "https://unsloth.ai", x: "unaborsclothai", d: "unsloth", added: "2025-01-15", tags: ["fine-tuning","2x-faster","open-source","qlora"] },

  // ================================================================
  // OPEN SOURCE MODELS & LOCAL
  // ================================================================
  { id: "ollama", name: "Ollama", cat: "Open Source Models", g: { o: "ollama", r: "ollama" }, w: "https://ollama.com", x: "ollama", d: "ollama", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["local-llm","model-runner","macos","docker"] },
  { id: "lmstudio", name: "LM Studio", cat: "Open Source Models", w: "https://lmstudio.ai", x: "LMStudioAI", d: "lmstudio", yr: "2023", added: "2025-01-15", tags: ["local-llm","gui","gguf","desktop"] },
  { id: "vllm", name: "vLLM", cat: "Open Source Models", g: { o: "vllm-project", r: "vllm" }, w: "https://vllm.ai", x: "vllm_project", d: "vllm", yr: "2023", hq: "Berkeley", added: "2025-01-15", tags: ["inference-engine","paged-attention","open-source"] },
  { id: "llamacpp", name: "llama.cpp", cat: "Open Source Models", g: { o: "ggerganov", r: "llama.cpp" }, yr: "2023", added: "2025-01-15", tags: ["inference","c++","quantization","gguf","local"] },
  { id: "openrouter", name: "OpenRouter", cat: "Open Source Models", w: "https://openrouter.ai", x: "OpenRouteaborr", d: "openrouter", added: "2025-01-15", tags: ["model-aggregator","api","routing","unified-api"] },

  // ================================================================
  // CRYPTO-AI
  // ================================================================
  { id: "bittensor", name: "Bittensor", cat: "Crypto-AI", g: { o: "opentensor", r: "bittensor" }, w: "https://bittensor.com", x: "opentensor", d: "bittensor", yr: "2021", added: "2025-01-15", tags: ["decentralized-ai","subnets"], tk: { symbol: "TAO", chain: "native" } },
  { id: "render", name: "Render Network", cat: "Crypto-AI", w: "https://rendernetwork.com", x: "rendernetwork", d: "render-network", yr: "2017", hq: "LA", added: "2025-01-15", tags: ["gpu-network","rendering","decentralized-compute"], tk: { symbol: "RENDER", chain: "solana" } },
  { id: "virtuals", name: "Virtuals Protocol", cat: "Crypto-AI", w: "https://virtuals.io", x: "virtuals_io", d: "virtuals", yr: "2024", hq: "Singapore", added: "2025-01-15", tags: ["tokenized-agents","base","agent-launchpad"], tk: { symbol: "VIRTUAL", chain: "base" } },
  { id: "ai16z", name: "ai16z / ELIZA", cat: "Crypto-AI", g: { o: "elizaOS", r: "eliza" }, w: "https://ai16z.ai", x: "ai16zdao", d: "ai16z", yr: "2024", added: "2025-01-15", tags: ["dao","agent-fund","eliza-framework"], tk: { symbol: "AI16Z", chain: "solana" } },
  { id: "griffain", name: "Griffain", cat: "Crypto-AI", w: "https://griffain.com", x: "griffaindotcom", d: "griffain", yr: "2024", added: "2025-01-15", tags: ["solana-agent","autonomous-trading"], tk: { symbol: "GRIFFAIN", chain: "solana" } },
  { id: "fetch-ai", name: "Fetch.ai", cat: "Crypto-AI", g: { o: "fetchai", r: "uAgents" }, w: "https://fetch.ai", x: "Fetch_ai", d: "fetch-ai", c: "https://fetch.ai/careers", cb: "fetch-ai", yr: "2017", hq: "Cambridge", added: "2025-01-15", tags: ["autonomous-agents","uagents","asi-alliance"], tk: { symbol: "FET", chain: "ethereum" } },
  { id: "ocean", name: "Ocean Protocol", cat: "Crypto-AI", g: { o: "oceanprotocol", r: "ocean.py" }, w: "https://oceanprotocol.com", x: "oceanprotocol", d: "ocean", yr: "2017", hq: "Singapore", added: "2025-01-15", tags: ["data-marketplace","compute-to-data","asi-alliance"], tk: { symbol: "OCEAN", chain: "ethereum" } },
  { id: "singularitynet", name: "SingularityNET", cat: "Crypto-AI", g: { o: "singnet", r: "snet-daemon" }, w: "https://singularitynet.io", x: "SingularityNET", d: "singularitynet", yr: "2017", added: "2025-01-15", tags: ["ai-marketplace","decentralized","asi-alliance"], tk: { symbol: "AGIX", chain: "ethereum" } },
  { id: "akash", name: "Akash Network", cat: "Crypto-AI", g: { o: "akash-network", r: "node" }, w: "https://akash.network", x: "akaborashnet_", d: "akash-network", yr: "2018", added: "2025-01-15", tags: ["decentralized-compute","gpu-marketplace","cosmos"], tk: { symbol: "AKT", chain: "cosmos" } },
  { id: "morpheus", name: "Morpheus", cat: "Crypto-AI", g: { o: "MorpheusAIs", r: "Morpheus" }, w: "https://mor.org", x: "MorpheusAIs", d: "morpheus-ai", yr: "2024", added: "2025-01-15", tags: ["smart-agents","decentralized","compute-marketplace"], tk: { symbol: "MOR", chain: "ethereum" } },
  { id: "ionet", name: "io.net", cat: "Crypto-AI", w: "https://io.net", x: "ionet", d: "ionet", yr: "2023", hq: "NYC", added: "2025-01-15", tags: ["gpu-network","decentralized-compute","solana"], tk: { symbol: "IO", chain: "solana" } },
  { id: "ritual", name: "Ritual", cat: "Crypto-AI", g: { o: "ritual-net", r: "infernet-sdk" }, w: "https://ritual.net", x: "ritualabornet", d: "ritual", cb: "ritual-net", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["on-chain-ai","infernet","coprocessor"], tk: { symbol: "RITUAL", chain: "ethereum" } },

  // Crypto-AI — Major L1s & Infrastructure (added Mar 2026)
  { id: "near", name: "Near Protocol", cat: "Crypto-AI", g: { o: "near", r: "nearcore" }, w: "https://near.org", x: "NEARProtocol", d: "nearprotocol", yr: "2020", hq: "SF", added: "2026-03-06", tags: ["l1","near-ai","agents","sharding"], tk: { symbol: "NEAR", chain: "native" } },
  { id: "solana", name: "Solana", cat: "Crypto-AI", g: { o: "solana-labs", r: "solana" }, w: "https://solana.com", x: "solana", d: "solana", yr: "2020", hq: "SF", added: "2026-03-06", tags: ["l1","high-throughput","ai-agents","depin"], tk: { symbol: "SOL", chain: "native" } },
  { id: "ethereum", name: "Ethereum", cat: "Crypto-AI", g: { o: "ethereum", r: "go-ethereum" }, w: "https://ethereum.org", x: "ethereum", d: "ethereum", yr: "2015", hq: "Decentralized", added: "2026-03-06", tags: ["l1","smart-contracts","defi","core-infra"], tk: { symbol: "ETH", chain: "native" } },
  { id: "chainlink", name: "Chainlink", cat: "Crypto-AI", g: { o: "smartcontractkit", r: "chainlink" }, w: "https://chain.link", x: "chainlink", d: "chainlink-official", yr: "2017", hq: "Grand Cayman", added: "2026-03-06", tags: ["oracles","ai-feeds","cross-chain","infra"], tk: { symbol: "LINK", chain: "ethereum" } },
  { id: "worldcoin", name: "Worldcoin", cat: "Crypto-AI", g: { o: "worldcoin", r: "world-id-contracts" }, w: "https://worldcoin.org", x: "worldcoin", d: "worldcoin", yr: "2023", hq: "SF", added: "2026-03-06", tags: ["proof-of-personhood","identity","sam-altman","biometrics"], tk: { symbol: "WLD", chain: "ethereum" } },
  { id: "gensyn", name: "Gensyn", cat: "Crypto-AI", g: { o: "gensyn-ai", r: "rl-swarm" }, w: "https://gensyn.ai", x: "gensynai", yr: "2022", hq: "London", added: "2026-03-06", tags: ["decentralized-training","ml","yc","compute-protocol"] },
  { id: "olas", name: "Autonolas / Olas", cat: "Crypto-AI", g: { o: "valory-xyz", r: "open-autonomy" }, w: "https://olas.network", x: "auabortonolas", d: "autonolas", yr: "2021", added: "2026-03-06", tags: ["autonomous-agents","on-chain","agent-economy","services"], tk: { symbol: "OLAS", chain: "ethereum" } },
  { id: "grass", name: "Grass", cat: "Crypto-AI", g: { o: "wynd-network", r: "grass-node" }, w: "https://getgrass.io", x: "getgrass_io", d: "getgrass", yr: "2023", added: "2026-03-06", tags: ["decentralized-data","ai-training","bandwidth","depin"], tk: { symbol: "GRASS", chain: "solana" } },
  { id: "arweave", name: "Arweave / AO", cat: "Crypto-AI", g: { o: "ArweaveTeam", r: "arweave" }, w: "https://arweave.org", x: "ArweaveEco", d: "arweave", yr: "2018", added: "2026-03-06", tags: ["permanent-storage","ao-compute","decentralized","ai-workloads"], tk: { symbol: "AR", chain: "native" } },
  { id: "phala", name: "Phala Network", cat: "Crypto-AI", g: { o: "Phala-Network", r: "phala-blockchain" }, w: "https://phala.network", x: "PhalaNetwork", d: "phala-network", yr: "2019", added: "2026-03-06", tags: ["tee","confidential-compute","ai-contracts","privacy"], tk: { symbol: "PHA", chain: "ethereum" } },
  { id: "nosana", name: "Nosana", cat: "Crypto-AI", g: { o: "nosana-ci", r: "nosana-node" }, w: "https://nosana.io", x: "nosaborana", d: "nosana", yr: "2021", added: "2026-03-06", tags: ["gpu-compute","solana","ai-inference","decentralized"], tk: { symbol: "NOS", chain: "solana" } },
  { id: "ezkl", name: "EZKL", cat: "Crypto-AI", g: { o: "zkonduit", r: "ezkl" }, w: "https://ezkl.xyz", x: "ezkl_xyz", yr: "2023", hq: "NYC", added: "2026-03-06", tags: ["zk-proofs","verifiable-ai","on-chain-ml","zkml"] },

  // ================================================================
  // VOICE AGENTS & TELEPHONY
  // ================================================================
  { id: "vapi", name: "Vapi", cat: "Voice Agents & Telephony", g: { o: "VapiAI", r: "server-sdk-python" }, w: "https://vapi.ai", x: "Vapi_AI", d: "vapi", cb: "vapi", added: "2025-01-15", tags: ["voice-agents","telephony","api","real-time"] },
  { id: "retell", name: "Retell AI", cat: "Voice Agents & Telephony", w: "https://retellai.com", x: "retellaborai", cb: "retell-ai", added: "2025-01-15", tags: ["voice-agents","phone-calls","conversational"] },
  { id: "bland", name: "Bland AI", cat: "Voice Agents & Telephony", w: "https://bland.ai", x: "usebland", cb: "bland-ai", added: "2025-01-15", tags: ["phone-agents","enterprise","api"] },
  { id: "voiceflow", name: "Voiceflow", cat: "Voice Agents & Telephony", w: "https://voiceflow.com", x: "VoiceflowHQ", d: "voiceflow", c: "https://voiceflow.com/careers", cb: "voiceflow", added: "2025-01-15", tags: ["conversation-design","chatbot-builder","no-code"] },

  // ================================================================
  // BROWSER & COMPUTER USE
  // ================================================================
  { id: "anthropic-computer-use", name: "Claude Computer Use", cat: "Browser & Computer Use", w: "https://anthropic.com", x: "AnthropicAI", added: "2025-01-15", tags: ["computer-use","desktop-agent","anthropic"] },
  { id: "browserbase", name: "Browserbase", cat: "Browser & Computer Use", g: { o: "browserbase", r: "stagehand" }, w: "https://browserbase.com", x: "browserbase", cb: "browserbase", added: "2025-01-15", tags: ["headless-browser","agent-infra","stagehand"] },

  // ================================================================
  // CUSTOMER SUPPORT AI
  // ================================================================
  { id: "intercom-fin", name: "Intercom Fin", cat: "Customer Support AI", w: "https://intercom.com/fin", x: "intercom", c: "https://intercom.com/careers", cb: "intercom", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["support-agent","chatbot","resolution"] },
  { id: "sierra", name: "Sierra", cat: "Customer Support AI", w: "https://sierra.ai", x: "SierraHQ", c: "https://sierra.ai/careers", cb: "sierra-ai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["conversational-ai","customer-experience","enterprise"] },
  { id: "decagon", name: "Decagon", cat: "Customer Support AI", w: "https://decagon.ai", x: "decaboragonai", cb: "decagon-ai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["enterprise-support","generative-agents"] },
  { id: "forethought", name: "Forethought", cat: "Customer Support AI", w: "https://forethought.ai", x: "foraborethoughtai", c: "https://forethought.ai/careers", cb: "forethought", yr: "2017", hq: "SF", added: "2025-01-15", tags: ["helpdesk","ticket-routing","automate"] },

  // ================================================================
  // SALES & GTM AI
  // ================================================================
  { id: "clay", name: "Clay", cat: "Sales & GTM AI", w: "https://clay.com", x: "clay", c: "https://clay.com/careers", cb: "clay-run", yr: "2017", hq: "NYC", added: "2025-01-15", tags: ["data-enrichment","outbound","go-to-market"] },
  { id: "11x", name: "11x.ai", cat: "Sales & GTM AI", w: "https://11x.ai", x: "11xaborai", c: "https://11x.ai/careers", cb: "11x-ai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["ai-sdr","alice","outbound","digital-workers"] },
  { id: "artisan", name: "Artisan AI", cat: "Sales & GTM AI", w: "https://artisan.co", x: "Artisan_AI_", cb: "artisan-ai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["ai-employees","ava","outbound","bdr"] },
  { id: "regie", name: "Regie.ai", cat: "Sales & GTM AI", w: "https://regie.ai", x: "regaborieai", c: "https://regie.ai/careers", cb: "regieai", yr: "2020", hq: "SF", added: "2025-01-15", tags: ["sales-engagement","content-gen","prospecting"] },

  // ================================================================
  // DATA & ANALYTICS
  // ================================================================
  { id: "hex", name: "Hex", cat: "Data & Analytics", w: "https://hex.tech", x: "hex_tech", c: "https://hex.tech/careers", cb: "hex-technologies", yr: "2019", hq: "SF", added: "2025-01-15", tags: ["notebooks","sql","ai-analytics"] },
  { id: "julius", name: "Julius AI", cat: "Data & Analytics", w: "https://julius.ai", x: "julius_ai", yr: "2023", hq: "SF", added: "2025-01-15", tags: ["chat-with-data","visualization","analysis"] },

  // ================================================================
  // DESIGN & CREATIVE
  // ================================================================
  { id: "canva-ai", name: "Canva (Magic Studio)", cat: "Design & Creative", w: "https://canva.com", x: "canva", c: "https://canva.com/careers", cb: "canva", yr: "2024", hq: "Sydney", as: "canva-design-photo-video", ps: "com.canva.editor", added: "2025-01-15", tags: ["design","magic-studio","presentations"] },
  { id: "figma-ai", name: "Figma AI", cat: "Design & Creative", w: "https://figma.com", x: "figma", d: "figma", c: "https://figma.com/careers", cb: "figma", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["ui-design","prototyping","ai-gen"] },
  { id: "recraft", name: "Recraft", cat: "Design & Creative", w: "https://recraft.ai", x: "recraftai", cb: "recraft", added: "2025-01-15", tags: ["vector","brand-consistent","design-ai"] },

  // ================================================================
  // LEGAL AI
  // ================================================================
  { id: "harvey", name: "Harvey AI", cat: "Legal AI", w: "https://harvey.ai", x: "harveyaborai", c: "https://harvey.ai/careers", cb: "harvey-ai", yr: "2022", hq: "SF", added: "2025-01-15", tags: ["legal","contract-analysis","enterprise"] },
  { id: "casetext", name: "CoCounsel (Thomson Reuters)", cat: "Legal AI", w: "https://casetext.com", x: "casetext", cb: "casetext", yr: "2013", hq: "SF", added: "2025-01-15", tags: ["legal-research","ai-assistant","acquired"] },

  // ================================================================
  // HEALTHCARE AI
  // ================================================================
  { id: "hippocratic", name: "Hippocratic AI", cat: "Healthcare AI", w: "https://hippocratic.ai", x: "HippocraboraticAI", cb: "hippocratic-ai", yr: "2023", hq: "Palo Alto", added: "2025-01-15", tags: ["healthcare","safety-focused","nursing"] },

  // ================================================================
  // FINANCE AI
  // ================================================================
  { id: "bloomberg-gpt", name: "BloombergGPT", cat: "Finance AI", w: "https://bloomberg.com", x: "Bloomberg", yr: "2023", hq: "NYC", added: "2025-01-15", tags: ["finance","nlp","bloomberg-terminal"] },

  // ================================================================
  // EDUCATION AI
  // ================================================================
  { id: "khanmigo", name: "Khanmigo", cat: "Education AI", w: "https://khanacademy.org/khan-labs", x: "kaborhanacademy", yr: "2023", hq: "Mountain View", added: "2025-01-15", tags: ["education","tutor","math","khan-academy"] },

  // ================================================================
  // ROBOTICS & EMBODIED AI
  // ================================================================
  { id: "figure", name: "Figure AI", cat: "Robotics & Embodied AI", w: "https://figure.ai", x: "Figure_robot", c: "https://figure.ai/careers", cb: "figure-ai", yr: "2022", hq: "Sunnyvale", added: "2025-01-15", tags: ["humanoid","robotics","general-purpose"] },
  { id: "1x", name: "1X Technologies", cat: "Robotics & Embodied AI", w: "https://1x.tech", x: "1aborXTech", c: "https://1x.tech/careers", cb: "1x-technologies", yr: "2014", hq: "Moss, Norway", added: "2025-01-15", tags: ["humanoid","androids","NEO"] },
  { id: "physical-intelligence", name: "Physical Intelligence (π)", cat: "Robotics & Embodied AI", w: "https://physicalintelligence.company", x: "phy_int", c: "https://physicalintelligence.company/careers", cb: "physical-intelligence", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["foundation-model","robotics","manipulation"] },

  // ================================================================
  // 3D & SPATIAL AI
  // ================================================================
  { id: "meshy", name: "Meshy", cat: "3D & Spatial AI", w: "https://meshy.ai", x: "meshaboryai", d: "meshy", cb: "meshy", added: "2025-01-15", tags: ["text-to-3d","3d-gen","game-assets"] },
  { id: "tripo", name: "Tripo AI", cat: "3D & Spatial AI", w: "https://tripo3d.ai", x: "tripoaborai", added: "2025-01-15", tags: ["3d-gen","image-to-3d","modeling"] },
  { id: "world-labs", name: "World Labs", cat: "3D & Spatial AI", w: "https://worldlabs.ai", x: "WorldLabsAI", cb: "world-labs", yr: "2024", hq: "SF", added: "2025-01-15", tags: ["spatial-intelligence","3d-generation","fei-fei-li"] },

  // ================================================================
  // AI SAFETY & ALIGNMENT
  // ================================================================
  { id: "arc", name: "ARC (Alignment Research)", cat: "AI Safety & Alignment", g: { o: "ARC-AGI", r: "ARC-AGI" }, w: "https://alignment.org", x: "ARCevals", c: "https://alignment.org/careers", yr: "2021", hq: "Berkeley", added: "2025-01-15", tags: ["safety","evals","alignment"] },
  { id: "metr", name: "METR", cat: "AI Safety & Alignment", w: "https://metr.org", x: "metaborr_org", yr: "2023", hq: "Berkeley", added: "2025-01-15", tags: ["evals","autonomy","risk-assessment"] },

  // ================================================================
  // NEWLY ADDED — Feb/Mar 2026
  // ================================================================

  // Agent Frameworks (new)
  { id: "pydantic-ai", name: "Pydantic AI", cat: "Agent Frameworks", g: { o: "pydantic", r: "pydantic-ai" }, w: "https://ai.pydantic.dev", x: "paborydantic", yr: "2024", hq: "Remote", added: "2026-02-01", tags: ["agent-framework","type-safe","pydantic","python"] },
  { id: "agno", name: "Agno", cat: "Agent Frameworks", g: { o: "agno-agi", r: "agno" }, w: "https://agno.com", x: "agnoaboragi", yr: "2024", added: "2026-02-03", tags: ["lightweight","agent-framework","multimodal","fast"] },
  { id: "instructor", name: "Instructor", cat: "Agent Frameworks", g: { o: "instructor-ai", r: "instructor" }, w: "https://python.useinstructor.com", x: "jxnlaborco", yr: "2023", added: "2026-02-05", tags: ["structured-output","pydantic","extraction","validation"] },
  { id: "letta", name: "Letta (MemGPT)", cat: "Agent Frameworks", g: { o: "letta-ai", r: "letta" }, w: "https://letta.com", x: "lettaaborai", d: "letta", yr: "2023", hq: "Berkeley", added: "2026-02-07", tags: ["long-term-memory","stateful","agents","memgpt"] },
  { id: "camel-ai", name: "CAMEL-AI", cat: "Agent Frameworks", g: { o: "camel-ai", r: "camel" }, w: "https://camel-ai.org", x: "CamelAIOrg", yr: "2023", added: "2026-02-09", tags: ["multi-agent","role-playing","communicative","research"] },
  { id: "julep", name: "Julep", cat: "Agent Frameworks", g: { o: "julep-ai", r: "julep" }, w: "https://julep.ai", x: "julepaborai", yr: "2024", hq: "SF", added: "2026-02-11", tags: ["stateful-agents","workflows","sessions","persistent"] },
  { id: "agentops", name: "AgentOps", cat: "Agent Frameworks", g: { o: "AgentOps-AI", r: "agentops" }, w: "https://agentops.ai", x: "agentopsaborai", yr: "2024", hq: "SF", added: "2026-02-13", tags: ["observability","monitoring","agent-analytics","debugging"] },
  { id: "mem0-ai", name: "Mem0", cat: "Agent Frameworks", g: { o: "mem0ai", r: "mem0" }, w: "https://mem0.ai", x: "mem0aborai", yr: "2024", hq: "SF", added: "2026-02-15", tags: ["memory-layer","personalization","long-term-memory","agents"] },

  // Code & Dev Tools (new)
  { id: "cline", name: "Cline", cat: "Code & Dev Tools", g: { o: "cline", r: "cline" }, w: "https://cline.bot", x: "caborline_bot", yr: "2024", added: "2026-02-17", tags: ["vscode","autonomous-coding","agent","open-source"] },
  { id: "roo-code", name: "Roo Code", cat: "Code & Dev Tools", g: { o: "RooVetGit", r: "Roo-Code" }, w: "https://roocode.com", x: "rooaborcode", yr: "2025", added: "2026-02-19", tags: ["ai-coding","agent","vscode","fork"] },
  { id: "void-editor", name: "Void", cat: "Code & Dev Tools", g: { o: "voideditor", r: "void" }, w: "https://voideditor.com", x: "voideditor", yr: "2024", added: "2026-02-21", tags: ["open-source","cursor-alternative","ide","local-first"] },
  { id: "zed-ai", name: "Zed", cat: "Code & Dev Tools", g: { o: "zed-industries", r: "zed" }, w: "https://zed.dev", x: "zaboreddotdev", yr: "2021", hq: "SF", added: "2026-02-23", tags: ["fast-editor","rust","collaboration","ai-assistant"] },

  // AI Agents (new)
  { id: "wordware", name: "Wordware", cat: "AI Agents", w: "https://wordware.ai", x: "wordwareaborai", yr: "2024", hq: "SF", added: "2026-02-25", tags: ["natural-language","agent-builder","ide","no-code"] },
  { id: "dust-ai", name: "Dust", cat: "AI Agents", g: { o: "dust-tt", r: "dust" }, w: "https://dust.tt", x: "dustabortt", yr: "2023", hq: "Paris", added: "2026-02-27", tags: ["enterprise-agents","data-connectors","workflows","assistants"] },

  // Data & Analytics (new)
  { id: "marimo", name: "Marimo", cat: "Data & Analytics", g: { o: "marimo-team", r: "marimo" }, w: "https://marimo.io", x: "maraborimo_io", yr: "2023", hq: "SF", added: "2026-03-01", tags: ["reactive-notebook","python","git-friendly","reproducible"] },
  { id: "rill-data", name: "Rill Data", cat: "Data & Analytics", g: { o: "rilldata", r: "rill" }, w: "https://rilldata.com", x: "rillabordata", yr: "2022", hq: "SF", cb: "rill-data", added: "2026-03-01", tags: ["operational-bi","dashboards","fast","duckdb"] },

  // AI Safety & Alignment (new)
  { id: "patronus", name: "Patronus AI", cat: "AI Safety & Alignment", w: "https://patronus.ai", x: "PatronusAI", yr: "2023", hq: "SF", cb: "patronus-ai", added: "2026-03-02", tags: ["llm-evaluation","safety-testing","hallucination-detection"] },
  { id: "guardrails-ai", name: "Guardrails AI", cat: "AI Safety & Alignment", g: { o: "guardrails-ai", r: "guardrails" }, w: "https://guardrailsai.com", x: "guardrailaborsai", yr: "2023", hq: "SF", added: "2026-03-02", tags: ["output-validation","safety","structured-generation","open-source"] },

  // Inference & Serving (new)
  { id: "lepton-ai", name: "Lepton AI", cat: "Inference & Serving", g: { o: "leptonai", r: "leptonai" }, w: "https://lepton.ai", x: "leptonaborai", yr: "2023", hq: "Redwood City", cb: "lepton-ai", added: "2026-03-03", tags: ["inference","pythonic","serverless","fast-deploy"] },
  { id: "cerebrium", name: "Cerebrium", cat: "Inference & Serving", w: "https://cerebrium.ai", x: "cerebriumaborai", yr: "2022", hq: "Cape Town", cb: "cerebrium", added: "2026-03-03", tags: ["serverless-gpu","inference","ml-deployment","global"] },

  // 3D & Spatial AI (new)
  { id: "trellis-3d", name: "Trellis", cat: "3D & Spatial AI", g: { o: "microsoft", r: "TRELLIS" }, w: "https://trellis3d.github.io", yr: "2024", added: "2026-03-04", tags: ["3d-generation","image-to-3d","microsoft","open-source"] },

  // Productivity & Workspace (new)
  { id: "glean", name: "Glean", cat: "Productivity & Workspace", w: "https://glean.com", x: "glaborean", c: "https://glean.com/careers", cb: "glean", yr: "2019", hq: "Palo Alto", added: "2026-03-04", tags: ["enterprise-search","ai-assistant","knowledge","work-ai"] },

  // Agent Frameworks (new cont.)
  { id: "langflow", name: "Langflow", cat: "Agent Frameworks", g: { o: "langflow-ai", r: "langflow" }, w: "https://langflow.org", x: "langflaborow_ai", yr: "2023", added: "2026-02-08", tags: ["visual-framework","low-code","drag-drop","agents"] },
  { id: "dify", name: "Dify", cat: "Agent Frameworks", g: { o: "langgenius", r: "dify" }, w: "https://dify.ai", x: "daborify_ai", yr: "2023", hq: "SF", added: "2026-02-12", tags: ["llm-app-platform","rag","agents","open-source"] },

  // Open Source Models (new)
  { id: "open-webui", name: "Open WebUI", cat: "Open Source Models", g: { o: "open-webui", r: "open-webui" }, w: "https://openwebui.com", x: "OpenaborWebUI", yr: "2024", added: "2026-02-20", tags: ["local-llm","chat-interface","self-hosted","extensible"] },
  { id: "jan-ai", name: "Jan", cat: "Open Source Models", g: { o: "janhq", r: "jan" }, w: "https://jan.ai", x: "janaborhq", yr: "2023", hq: "SF", added: "2026-02-22", tags: ["local-ai","offline","desktop","open-source","privacy"] },
];

// ================================================================
// STATS
// ================================================================
export const REGISTRY_STATS = {
  total: REGISTRY.length,
  withGithub: REGISTRY.filter(p => p.g).length,
  withTwitter: REGISTRY.filter(p => p.x).length,
  withCareers: REGISTRY.filter(p => p.c).length,
  withDiscord: REGISTRY.filter(p => p.d).length,
  withCrunchbase: REGISTRY.filter(p => p.cb).length,
  withToken: REGISTRY.filter(p => p.tk).length,
  categories: CATEGORIES.length,
};
