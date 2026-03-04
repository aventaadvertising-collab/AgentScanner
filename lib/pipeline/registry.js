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
  { id: "cursor", name: "Cursor", cat: "Code & Dev Tools", g: { o: "getcursor", r: "cursor" }, w: "https://cursor.com", x: "cursor_ai", c: "https://cursor.com/careers", cb: "anysphere", li: "anysphere", em: "hello@cursor.com", cn: "Anysphere", yr: "2022", hq: "SF", tags: ["ide","ai-coding","vscode-fork"] },
  { id: "bolt", name: "Bolt.new", cat: "Code & Dev Tools", g: { o: "stackblitz", r: "bolt.new" }, w: "https://bolt.new", x: "stackblitz", c: "https://stackblitz.com/careers", cb: "stackblitz", li: "stackblitz", em: "team@stackblitz.com", cn: "StackBlitz", yr: "2024", hq: "SF", tags: ["prompt-to-app","webcontainers","full-stack"] },
  { id: "lovable", name: "Lovable", cat: "Code & Dev Tools", g: { o: "lovable-dev", r: "lovable" }, w: "https://lovable.dev", x: "lovable_dev", d: "lovable", c: "https://lovable.dev/careers", cb: "lovable", li: "lovable-dev", em: "hello@lovable.dev", cn: "Lovable", yr: "2024", hq: "Stockholm", tags: ["prompt-to-app","ai-engineer"] },
  { id: "windsurf", name: "Windsurf", cat: "Code & Dev Tools", w: "https://windsurf.com", x: "windsurf_ai", c: "https://codeium.com/careers", cb: "codeium", li: "codeium", em: "hello@codeium.com", cn: "Codeium", yr: "2023", hq: "Mountain View", tags: ["ide","ai-coding","cascade"] },
  { id: "v0", name: "v0 by Vercel", cat: "Code & Dev Tools", w: "https://v0.dev", x: "v0", c: "https://vercel.com/careers", cb: "vercel", li: "vercel", em: "sales@vercel.com", cn: "Vercel", yr: "2023", hq: "SF", tags: ["ui-gen","react","shadcn","frontend"] },
  { id: "claude-code", name: "Claude Code", cat: "Code & Dev Tools", w: "https://claude.ai", x: "AnthropicAI", c: "https://anthropic.com/careers", cb: "anthropic", li: "anthropic", em: "sales@anthropic.com", cn: "Anthropic", yr: "2024", hq: "SF", tags: ["terminal","agentic-coding","cli"] },
  { id: "copilot", name: "GitHub Copilot", cat: "Code & Dev Tools", g: { o: "github", r: "copilot-docs" }, w: "https://github.com/features/copilot", x: "GitHubCopilot", c: "https://github.com/about/careers", cb: "github", li: "github", em: "copilot@github.com", cn: "GitHub", yr: "2021", hq: "SF", tags: ["code-completion","agent","workspace"] },
  { id: "replit", name: "Replit", cat: "Code & Dev Tools", g: { o: "replit", r: "replit" }, w: "https://replit.com", x: "Replit", d: "replit", c: "https://replit.com/careers", cb: "replit", li: "replit", em: "partnerships@replit.com", cn: "Replit", yr: "2016", hq: "SF", as: "replit", ps: "com.replit.app", tags: ["cloud-ide","agent","deployment"] },
  { id: "cody", name: "Cody (Sourcegraph)", cat: "Code & Dev Tools", g: { o: "sourcegraph", r: "cody" }, w: "https://sourcegraph.com/cody", x: "sourcegraph", d: "sourcegraph", c: "https://sourcegraph.com/careers", cb: "sourcegraph", li: "sourcegraph", em: "hi@sourcegraph.com", cn: "Sourcegraph", yr: "2023", hq: "SF", tags: ["code-ai","code-search","context"] },
  { id: "tabnine", name: "Tabnine", cat: "Code & Dev Tools", g: { o: "codota", r: "tabnine-vscode" }, w: "https://tabnine.com", x: "tabnine", c: "https://tabnine.com/careers", cb: "tabnine", li: "tabnine", em: "info@tabnine.com", cn: "Tabnine", yr: "2018", hq: "Tel Aviv", tags: ["code-completion","privacy","on-prem"] },
  { id: "aider", name: "Aider", cat: "Code & Dev Tools", g: { o: "Aider-AI", r: "aider" }, w: "https://aider.chat", x: "paulaborrgauthier", tags: ["cli","pair-programming","open-source","terminal"] },
  { id: "continue", name: "Continue", cat: "Code & Dev Tools", g: { o: "continuedev", r: "continue" }, w: "https://continue.dev", x: "continueabordev", d: "continue", cb: "continue-dev", tags: ["open-source","ide","autopilot","customizable"] },
  { id: "sweep", name: "Sweep AI", cat: "Code & Dev Tools", g: { o: "sweepai", r: "sweep" }, w: "https://sweep.dev", x: "sweepaborai", tags: ["github-bot","pull-requests","junior-dev"] },
  { id: "codegen", name: "Codegen", cat: "Code & Dev Tools", g: { o: "codegen-sh", r: "codegen-sdk" }, w: "https://codegen.sh", x: "codegenaborsh", tags: ["programmatic-codemod","sdk","refactoring"] },
  { id: "poolside", name: "Poolside", cat: "Code & Dev Tools", w: "https://poolside.ai", x: "PoolsideaborAI", c: "https://poolside.ai/careers", cb: "poolside-ai", tags: ["code-gen","reinforcement-learning","foundation-model"] },
  { id: "magic-ai", name: "Magic", cat: "Code & Dev Tools", w: "https://magic.dev", x: "magicabordev", c: "https://magic.dev/careers", cb: "magic-dev", tags: ["long-context","code-gen","ltm"] },
  { id: "augment", name: "Augment Code", cat: "Code & Dev Tools", w: "https://augmentcode.com", x: "AugmentaborCode", c: "https://augmentcode.com/careers", cb: "augment-code", tags: ["enterprise","context","ai-coding"] },

  // ================================================================
  // AI AGENTS (autonomous & semi-autonomous)
  // ================================================================
  { id: "devin", name: "Devin", cat: "AI Agents", w: "https://devin.ai", x: "cognition_labs", c: "https://cognition.ai/careers", cb: "cognition-ai", li: "cognition-ai", em: "info@cognition.ai", cn: "Cognition Labs", yr: "2023", hq: "SF", tags: ["autonomous-engineer","coding-agent"] },
  { id: "openai-operator", name: "Operator (OpenAI)", cat: "AI Agents", w: "https://operator.chatgpt.com", x: "OpenAI", tags: ["browser-agent","task-completion","consumer"] },
  { id: "manus", name: "Manus", cat: "AI Agents", w: "https://manus.im", x: "maboranusIM", tags: ["general-purpose","computer-use","research-agent"] },
  { id: "multion", name: "MultiOn", cat: "AI Agents", g: { o: "MULTI-ON", r: "multion-python" }, w: "https://multion.ai", x: "AskMultiOn", cb: "multion", tags: ["web-agent","browser","personal-ai"] },
  { id: "adept", name: "Adept", cat: "AI Agents", w: "https://adept.ai", x: "AdeptaborAILabs", c: "https://adept.ai/careers", cb: "adept-ai-labs", tags: ["act-1","computer-use","enterprise"] },
  { id: "lindy", name: "Lindy.ai", cat: "AI Agents", w: "https://lindy.ai", x: "lindaboryai", c: "https://lindy.ai/careers", cb: "lindy-ai", tags: ["no-code-agents","workflows","automation"] },
  { id: "relevance", name: "Relevance AI", cat: "AI Agents", w: "https://relevanceai.com", x: "RelevanceAI_", c: "https://relevanceai.com/careers", cb: "relevance-ai", tags: ["agent-builder","no-code","workforce"] },
  { id: "hyperwrite", name: "HyperWrite / Otherside", cat: "AI Agents", g: { o: "OthersideAI", r: "self-operating-computer" }, w: "https://hyperwrite.ai", x: "OthersaborideAI", cb: "hyperwrite", tags: ["writing-agent","browser-agent","personal-ai"] },
  { id: "induced", name: "Induced AI", cat: "AI Agents", w: "https://induced.ai", x: "inducedaborai", cb: "induced-ai", tags: ["browser-agent","rpa","automation"] },
  { id: "twin", name: "Twin", cat: "AI Agents", w: "https://twin.so", x: "twinaborso", tags: ["browser-agent","task-automation","api"] },
  { id: "skyvern", name: "Skyvern", cat: "AI Agents", g: { o: "Skyvern-AI", r: "skyvern" }, w: "https://skyvern.com", x: "skyvernaborai", tags: ["browser-automation","rpa","open-source"] },

  // ================================================================
  // AGENT FRAMEWORKS
  // ================================================================
  { id: "langchain", name: "LangChain", cat: "Agent Frameworks", g: { o: "langchain-ai", r: "langchain" }, w: "https://langchain.com", x: "LangChainAI", d: "langchain", c: "https://langchain.com/careers", cb: "langchain", yr: "2022", hq: "SF", tags: ["framework","chains","agents","langgraph"] },
  { id: "llamaindex", name: "LlamaIndex", cat: "Agent Frameworks", g: { o: "run-llama", r: "llama_index" }, w: "https://llamaindex.ai", x: "llama_index", d: "llamaindex", c: "https://llamaindex.ai/careers", cb: "llamaindex", yr: "2022", hq: "SF", tags: ["rag","data-framework","agents"] },
  { id: "crewai", name: "CrewAI", cat: "Agent Frameworks", g: { o: "crewAIInc", r: "crewAI" }, w: "https://crewai.com", x: "crewAIInc", d: "crewai", cb: "crewai", yr: "2023", hq: "SF", tags: ["multi-agent","orchestration","roles"] },
  { id: "autogen", name: "AutoGen (Microsoft)", cat: "Agent Frameworks", g: { o: "microsoft", r: "autogen" }, w: "https://microsoft.github.io/autogen/", x: "pyaborautogen", d: "autogen", tags: ["multi-agent","conversation","microsoft","open-source"] },
  { id: "autogpt", name: "AutoGPT", cat: "Agent Frameworks", g: { o: "Significant-Gravitas", r: "AutoGPT" }, w: "https://agpt.co", x: "Auto_GPT", d: "autogpt", yr: "2023", tags: ["autonomous","task-decomposition","open-source"] },
  { id: "elizaos", name: "ElizaOS", cat: "Agent Frameworks", g: { o: "elizaOS", r: "eliza" }, w: "https://elizaos.ai", x: "elizaOS", d: "elizaos", yr: "2024", tags: ["crypto-ai","agent-framework","autonomous-trading","plugins"] },
  { id: "e2b", name: "E2B", cat: "Agent Frameworks", g: { o: "e2b-dev", r: "E2B" }, w: "https://e2b.dev", x: "e2b_dev", d: "e2b", cb: "e2b", yr: "2023", hq: "SF", tags: ["sandboxes","code-execution","agent-infra"] },
  { id: "phidata", name: "Phidata", cat: "Agent Frameworks", g: { o: "phidatahq", r: "phidata" }, w: "https://phidata.com", x: "phiabordata", d: "phidata", tags: ["agent-framework","tools","memory","knowledge"] },
  { id: "smolagents", name: "smolagents (HF)", cat: "Agent Frameworks", g: { o: "huggingface", r: "smolagents" }, w: "https://huggingface.co/docs/smolagents", x: "huggingface", tags: ["lightweight","huggingface","code-agents","open-source"] },
  { id: "composio", name: "Composio", cat: "Agent Frameworks", g: { o: "ComposioHQ", r: "composio" }, w: "https://composio.dev", x: "composaboriodev", d: "composio", tags: ["tool-integration","agent-tooling","250+-tools"] },
  { id: "browser-use", name: "Browser Use", cat: "Agent Frameworks", g: { o: "browser-use", r: "browser-use" }, w: "https://browser-use.com", x: "BrowseraborUse", tags: ["browser-automation","langchain","open-source","vision"] },
  { id: "semantic-kernel", name: "Semantic Kernel", cat: "Agent Frameworks", g: { o: "microsoft", r: "semantic-kernel" }, w: "https://learn.microsoft.com/en-us/semantic-kernel/", x: "msaborftdev", tags: ["microsoft","enterprise","dotnet","python","planner"] },
  { id: "dspy", name: "DSPy", cat: "Agent Frameworks", g: { o: "stanfordnlp", r: "dspy" }, w: "https://dspy-docs.vercel.app", x: "lateinabort", tags: ["programming-not-prompting","compiler","stanford","optimization"] },
  { id: "haystack", name: "Haystack (deepset)", cat: "Agent Frameworks", g: { o: "deepset-ai", r: "haystack" }, w: "https://haystack.deepset.ai", x: "Haystack_AI", d: "haystack", cb: "deepset", tags: ["rag","pipelines","search","open-source"] },
  { id: "mastra", name: "Mastra", cat: "Agent Frameworks", g: { o: "mastra-ai", r: "mastra" }, w: "https://mastra.ai", x: "mastraaborai", d: "mastra", tags: ["typescript","agent-framework","workflows","tools"] },

  // ================================================================
  // SEARCH & RESEARCH
  // ================================================================
  { id: "perplexity", name: "Perplexity", cat: "Search & Research", w: "https://perplexity.ai", x: "perplexity_ai", d: "perplexity", c: "https://perplexity.ai/careers", cb: "perplexity-ai", li: "perplexity-ai", em: "hello@perplexity.ai", cn: "Perplexity", yr: "2022", hq: "SF", as: "perplexity-ask-anything", ps: "ai.perplexity.app.android", tags: ["answer-engine","search","citations","pro-search"] },
  { id: "you", name: "You.com", cat: "Search & Research", w: "https://you.com", x: "YouSearchEngine", c: "https://you.com/careers", cb: "you-com", yr: "2020", hq: "SF", tags: ["search","ai-modes","research"] },
  { id: "exa", name: "Exa", cat: "Search & Research", g: { o: "exa-labs", r: "exa-py" }, w: "https://exa.ai", x: "ExaAILabs", c: "https://exa.ai/careers", cb: "exa-ai", yr: "2022", hq: "SF", tags: ["semantic-search","api","neural-search"] },
  { id: "elicit", name: "Elicit", cat: "Search & Research", w: "https://elicit.com", x: "elaboricit", c: "https://elicit.com/careers", cb: "elicit", yr: "2021", hq: "SF", tags: ["research-assistant","papers","systematic-review"] },
  { id: "consensus", name: "Consensus", cat: "Search & Research", w: "https://consensus.app", x: "ConsensusAI", cb: "consensus-app", yr: "2021", hq: "NYC", tags: ["academic-search","evidence-based","science"] },
  { id: "tavily", name: "Tavily", cat: "Search & Research", g: { o: "tavily-ai", r: "tavily-python" }, w: "https://tavily.com", x: "tavilyaborai", tags: ["search-api","agents","real-time","optimized-for-llm"] },
  { id: "scite", name: "scite.ai", cat: "Search & Research", w: "https://scite.ai", x: "scaborite_", cb: "scite", tags: ["smart-citations","academic","research"] },

  // ================================================================
  // IMAGE GENERATION
  // ================================================================
  { id: "midjourney", name: "Midjourney", cat: "Image Generation", w: "https://midjourney.com", x: "midjourney", d: "midjourney", cb: "midjourney", li: "midjourney-inc", em: "support@midjourney.com", cn: "Midjourney", yr: "2021", hq: "SF", tags: ["image-gen","discord","art"] },
  { id: "flux", name: "FLUX (BFL)", cat: "Image Generation", g: { o: "black-forest-labs", r: "flux" }, w: "https://blackforestlabs.ai", x: "bfl_ml", cb: "black-forest-labs", yr: "2024", hq: "Freiburg", tags: ["image-gen","open-source","diffusion"] },
  { id: "ideogram", name: "Ideogram", cat: "Image Generation", w: "https://ideogram.ai", x: "ideogramAI", d: "ideogram", cb: "ideogram", yr: "2023", hq: "Toronto", tags: ["image-gen","text-rendering","typography"] },
  { id: "stability", name: "Stability AI", cat: "Image Generation", g: { o: "Stability-AI", r: "stablediffusion" }, w: "https://stability.ai", x: "StabilityAI", d: "stablediffusion", c: "https://stability.ai/careers", cb: "stability-ai", yr: "2020", hq: "London", tags: ["stable-diffusion","open-source","sd3"] },
  { id: "leonardo", name: "Leonardo.ai", cat: "Image Generation", w: "https://leonardo.ai", x: "LeonardoAi_", d: "leonardo-ai", c: "https://leonardo.ai/careers", cb: "leonardo-ai", yr: "2022", hq: "Sydney", as: "leonardo-ai-image-generator", ps: "ai.leonardo.android", tags: ["image-gen","game-assets","creative"] },
  { id: "recraft", name: "Recraft", cat: "Image Generation", w: "https://recraft.ai", x: "recaborraftai", cb: "recraft", tags: ["vector","brand-consistent","design-ai","image-gen"] },
  { id: "krea", name: "Krea AI", cat: "Image Generation", w: "https://krea.ai", x: "kreaboraai", d: "krea", tags: ["real-time","image-gen","enhance","upscale"] },

  // ================================================================
  // VIDEO GENERATION
  // ================================================================
  { id: "heygen", name: "HeyGen", cat: "Video Generation", w: "https://heygen.com", x: "HeyGen_Official", c: "https://heygen.com/careers", cb: "heygen", li: "heygen", em: "partnerships@heygen.com", cn: "HeyGen", yr: "2022", hq: "LA", tags: ["avatars","dubbing","localization"] },
  { id: "runway", name: "Runway", cat: "Video Generation", w: "https://runwayml.com", x: "runwayml", d: "runway", c: "https://runwayml.com/careers", cb: "runwayml", yr: "2018", hq: "NYC", tags: ["gen-3","video-gen","creative-tools"] },
  { id: "pika", name: "Pika", cat: "Video Generation", w: "https://pika.art", x: "pika_labs", d: "pika", c: "https://pika.art/careers", cb: "pika-labs", yr: "2023", hq: "Palo Alto", tags: ["text-to-video","editing","effects"] },
  { id: "kling", name: "Kling AI", cat: "Video Generation", w: "https://klingai.com", x: "AIKling", cn: "Kuaishou", yr: "2024", hq: "Beijing", tags: ["text-to-video","long-form","chinese-ai"] },
  { id: "synthesia", name: "Synthesia", cat: "Video Generation", w: "https://synthesia.io", x: "synthesiaIO", c: "https://synthesia.io/careers", cb: "synthesia", yr: "2017", hq: "London", tags: ["ai-avatars","enterprise-video","training"] },
  { id: "luma", name: "Luma AI (Dream Machine)", cat: "Video Generation", w: "https://lumalabs.ai", x: "LumaLabsAI", d: "luma", cb: "luma-ai", yr: "2021", hq: "SF", tags: ["video-gen","3d","dream-machine","ray"] },
  { id: "minimax-hailuo", name: "Hailuo AI (MiniMax)", cat: "Video Generation", w: "https://hailuoai.video", x: "AaborIMinimax", yr: "2023", hq: "Beijing", tags: ["text-to-video","chinese-ai","fast"] },
  { id: "veo", name: "Veo (Google)", cat: "Video Generation", w: "https://deepmind.google/technologies/veo/", x: "GoogleDeepMind", yr: "2024", hq: "London", tags: ["google","video-gen","high-fidelity"] },
  { id: "sora", name: "Sora (OpenAI)", cat: "Video Generation", w: "https://openai.com/sora", x: "OpenAI", yr: "2024", hq: "SF", tags: ["text-to-video","world-model","physics"] },

  // ================================================================
  // AUDIO & VOICE
  // ================================================================
  { id: "elevenlabs", name: "ElevenLabs", cat: "Audio & Voice", g: { o: "elevenlabs", r: "elevenlabs-python" }, w: "https://elevenlabs.io", x: "elevenlabsio", d: "elevenlabs", c: "https://elevenlabs.io/careers", cb: "elevenlabs", li: "elevenlabsio", em: "hello@elevenlabs.io", cn: "ElevenLabs", yr: "2022", hq: "NYC", as: "elevenlabs-reader", ps: "io.elevenlabs.android", tags: ["tts","voice-cloning","dubbing"] },
  { id: "assemblyai", name: "AssemblyAI", cat: "Audio & Voice", g: { o: "AssemblyAI", r: "assemblyai-python-sdk" }, w: "https://assemblyai.com", x: "AssemblyAI", d: "assemblyai", c: "https://assemblyai.com/careers", cb: "assemblyai", yr: "2017", hq: "SF", tags: ["stt","transcription","audio-intelligence"] },
  { id: "deepgram", name: "Deepgram", cat: "Audio & Voice", g: { o: "deepgram", r: "deepgram-python-sdk" }, w: "https://deepgram.com", x: "DeepgramAI", d: "deepgram", c: "https://deepgram.com/careers", cb: "deepgram", yr: "2015", hq: "Ann Arbor", tags: ["stt","tts","voice-api","aura"] },
  { id: "cartesia", name: "Cartesia", cat: "Audio & Voice", g: { o: "cartesia-ai", r: "cartesia-python" }, w: "https://cartesia.ai", x: "cartesaboriaai", cb: "cartesia", tags: ["tts","real-time","sonic","state-space"] },
  { id: "play-ht", name: "PlayHT", cat: "Audio & Voice", w: "https://play.ht", x: "PlayHTaborAI", cb: "playht", tags: ["tts","voice-cloning","api","agents"] },

  // ================================================================
  // MUSIC GENERATION
  // ================================================================
  { id: "suno", name: "Suno", cat: "Music Generation", w: "https://suno.com", x: "sunomusic", d: "suno", c: "https://suno.com/careers", cb: "suno-ai", yr: "2022", hq: "Cambridge", as: "suno-make-music", tags: ["music-gen","text-to-music","vocals"] },
  { id: "udio", name: "Udio", cat: "Music Generation", w: "https://udio.com", x: "udiomusic", d: "udio", yr: "2023", hq: "NYC", tags: ["music-gen","text-to-music","high-quality"] },

  // ================================================================
  // WRITING & CONTENT
  // ================================================================
  { id: "jasper", name: "Jasper", cat: "Writing & Content", w: "https://jasper.ai", x: "jasper_ai", c: "https://jasper.ai/careers", cb: "jasper-ai", yr: "2021", hq: "Austin", tags: ["marketing","copywriting","enterprise"] },
  { id: "copy-ai", name: "Copy.ai", cat: "Writing & Content", w: "https://copy.ai", x: "copy_ai", c: "https://copy.ai/careers", cb: "copy-ai", yr: "2020", hq: "Memphis", tags: ["copywriting","workflows","gtm"] },
  { id: "writer", name: "Writer", cat: "Writing & Content", w: "https://writer.com", x: "Get_Writer", c: "https://writer.com/careers", cb: "writer", yr: "2020", hq: "SF", tags: ["enterprise","content-platform","palmyra"] },
  { id: "grammarly", name: "Grammarly", cat: "Writing & Content", w: "https://grammarly.com", x: "Grammarly", c: "https://grammarly.com/careers", cb: "grammarly", yr: "2009", hq: "SF", as: "grammarly-keyboard", ps: "com.grammarly.android.keyboard", tags: ["grammar","writing-assistant","tone","enterprise"] },

  // ================================================================
  // PRODUCTIVITY & WORKSPACE
  // ================================================================
  { id: "notion-ai", name: "Notion AI", cat: "Productivity & Workspace", w: "https://notion.so", x: "NotionHQ", c: "https://notion.so/careers", cb: "notion", yr: "2023", hq: "SF", as: "notion-notes-docs-tasks", ps: "notion.id", tags: ["workspace","docs","ai-writing"] },
  { id: "otter", name: "Otter.ai", cat: "Productivity & Workspace", w: "https://otter.ai", x: "otter_ai", c: "https://otter.ai/careers", cb: "otter-ai", yr: "2016", hq: "Mountain View", as: "otter-voice-meeting-notes", ps: "com.aisense.otter", tags: ["meeting-notes","transcription"] },
  { id: "granola", name: "Granola", cat: "Productivity & Workspace", w: "https://granola.ai", x: "granola_ai", cb: "granola-ai", yr: "2023", hq: "London", tags: ["meeting-notes","ai-notepad","macos"] },
  { id: "mem", name: "Mem", cat: "Productivity & Workspace", w: "https://mem.ai", x: "memdaborotai", c: "https://mem.ai/careers", cb: "mem", yr: "2020", hq: "SF", tags: ["notes","knowledge-management","self-organizing"] },
  { id: "tldraw", name: "tldraw", cat: "Productivity & Workspace", g: { o: "tldraw", r: "tldraw" }, w: "https://tldraw.com", x: "tldraw", tags: ["whiteboard","canvas","make-real","open-source"] },

  // ================================================================
  // FOUNDATION MODELS
  // ================================================================
  { id: "openai", name: "OpenAI", cat: "Foundation Models", g: { o: "openai", r: "openai-python" }, w: "https://openai.com", x: "OpenAI", d: "openai", c: "https://openai.com/careers", cb: "openai", li: "openai", yr: "2015", hq: "SF", as: "chatgpt", ps: "com.openai.chatgpt", tags: ["gpt","chatgpt","o1","dall-e","api"] },
  { id: "anthropic", name: "Anthropic", cat: "Foundation Models", g: { o: "anthropics", r: "anthropic-sdk-python" }, w: "https://anthropic.com", x: "AnthropicAI", c: "https://anthropic.com/careers", cb: "anthropic", li: "anthropic", yr: "2021", hq: "SF", as: "claude", ps: "com.anthropic.claude", tags: ["claude","safety","constitutional-ai"] },
  { id: "deepmind", name: "Google DeepMind", cat: "Foundation Models", g: { o: "google-deepmind", r: "gemma" }, w: "https://deepmind.google", x: "GoogleDeepMind", c: "https://deepmind.google/careers", cb: "deepmind", yr: "2010", hq: "London", tags: ["gemini","gemma","alphafold","research"] },
  { id: "meta-ai", name: "Meta AI (Llama)", cat: "Foundation Models", g: { o: "meta-llama", r: "llama" }, w: "https://ai.meta.com", x: "AIatMeta", yr: "2023", hq: "Menlo Park", tags: ["llama","open-source","research"] },
  { id: "mistral", name: "Mistral AI", cat: "Foundation Models", g: { o: "mistralai", r: "mistral-inference" }, w: "https://mistral.ai", x: "MistralAI", d: "mistral", c: "https://mistral.ai/careers", cb: "mistral-ai", yr: "2023", hq: "Paris", as: "le-chat-by-mistral-ai", tags: ["open-models","mixtral","european-ai"] },
  { id: "cohere", name: "Cohere", cat: "Foundation Models", g: { o: "cohere-ai", r: "cohere-python" }, w: "https://cohere.com", x: "cohere", d: "cohere", c: "https://cohere.com/careers", cb: "cohere", yr: "2019", hq: "Toronto", tags: ["enterprise","embeddings","command","rag"] },
  { id: "xai", name: "xAI", cat: "Foundation Models", g: { o: "xai-org", r: "grok-1" }, w: "https://x.ai", x: "xai", c: "https://x.ai/careers", cb: "xai", yr: "2023", hq: "SF", tags: ["grok","twitter-data","colossus"] },
  { id: "ai21", name: "AI21 Labs", cat: "Foundation Models", g: { o: "AI21Labs", r: "ai21-python" }, w: "https://ai21.com", x: "AI21Labs", c: "https://ai21.com/careers", cb: "ai21-labs", yr: "2017", hq: "Tel Aviv", tags: ["jamba","enterprise","hybrid-architecture"] },
  { id: "deepseek", name: "DeepSeek", cat: "Foundation Models", g: { o: "deepseek-ai", r: "DeepSeek-V3" }, w: "https://deepseek.com", x: "deepseek_ai", yr: "2023", hq: "Hangzhou", tags: ["open-source","r1","chinese-ai","reasoning","low-cost"] },
  { id: "qwen", name: "Qwen (Alibaba)", cat: "Foundation Models", g: { o: "QwenLM", r: "Qwen" }, w: "https://qwenlm.github.io", x: "Qwen_LM", yr: "2023", hq: "Hangzhou", tags: ["open-source","chinese-ai","multimodal"] },
  { id: "zhipu", name: "Zhipu AI (GLM)", cat: "Foundation Models", g: { o: "THUDM", r: "GLM-4" }, w: "https://zhipuai.cn", x: "thukeg", yr: "2019", hq: "Beijing", tags: ["glm","chinese-ai","tsinghua"] },

  // ================================================================
  // INFERENCE & SERVING
  // ================================================================
  { id: "groq", name: "Groq", cat: "Inference & Serving", w: "https://groq.com", x: "GroqInc", d: "groq", c: "https://groq.com/careers", cb: "groq", yr: "2016", hq: "Mountain View", tags: ["lpu","hardware","fast-inference"] },
  { id: "together", name: "Together AI", cat: "Inference & Serving", g: { o: "togethercomputer", r: "together-python" }, w: "https://together.ai", x: "TogetherCompute", d: "together", c: "https://together.ai/careers", cb: "together-ai", yr: "2022", hq: "SF", tags: ["inference","fine-tuning","open-source","gpu-cloud"] },
  { id: "replicate", name: "Replicate", cat: "Inference & Serving", g: { o: "replicate", r: "replicate-python" }, w: "https://replicate.com", x: "replicate", d: "replicate", cb: "replicate", yr: "2019", hq: "SF", tags: ["model-hosting","api","open-source-models"] },
  { id: "fireworks", name: "Fireworks AI", cat: "Inference & Serving", w: "https://fireworks.ai", x: "fireworksai_hq", d: "fireworks-ai", c: "https://fireworks.ai/careers", cb: "fireworks-ai", yr: "2022", hq: "Redwood City", tags: ["inference","compound-ai","fast"] },
  { id: "modal", name: "Modal", cat: "Inference & Serving", g: { o: "modal-labs", r: "modal-client" }, w: "https://modal.com", x: "modal_labs", c: "https://modal.com/careers", cb: "modal-labs", yr: "2021", hq: "SF", tags: ["serverless-gpu","containers","python"] },
  { id: "baseten", name: "Baseten", cat: "Inference & Serving", g: { o: "basetenlabs", r: "truss" }, w: "https://baseten.co", x: "basetenco", c: "https://baseten.co/careers", cb: "baseten", yr: "2019", hq: "SF", tags: ["model-serving","truss","gpu-infra"] },
  { id: "anyscale", name: "Anyscale", cat: "Inference & Serving", g: { o: "ray-project", r: "ray" }, w: "https://anyscale.com", x: "anaboryscalecompute", c: "https://anyscale.com/careers", cb: "anyscale", yr: "2019", hq: "SF", tags: ["ray","distributed-compute","training","serving"] },
  { id: "cerebras", name: "Cerebras", cat: "Inference & Serving", w: "https://cerebras.ai", x: "CerebrasAI", c: "https://cerebras.ai/careers", cb: "cerebras-systems", yr: "2016", hq: "Sunnyvale", tags: ["wafer-scale","hardware","fast-inference"] },
  { id: "sambanova", name: "SambaNova", cat: "Inference & Serving", w: "https://sambanova.ai", x: "SambaNaborovaAI", c: "https://sambanova.ai/careers", cb: "sambanova-systems", yr: "2017", hq: "Palo Alto", tags: ["enterprise","hardware","rdu"] },

  // ================================================================
  // MODEL HUBS & TOOLING
  // ================================================================
  { id: "huggingface", name: "Hugging Face", cat: "Model Hubs & Tooling", g: { o: "huggingface", r: "transformers" }, w: "https://huggingface.co", x: "huggingface", d: "huggingface", c: "https://huggingface.co/jobs", cb: "hugging-face", yr: "2016", hq: "NYC", tags: ["model-hub","transformers","community","open-source"] },
  { id: "weights-biases", name: "Weights & Biases", cat: "Model Hubs & Tooling", g: { o: "wandb", r: "wandb" }, w: "https://wandb.ai", x: "wanabordb_ai", c: "https://wandb.ai/careers", cb: "weights-and-biases", yr: "2017", hq: "SF", tags: ["experiment-tracking","mlops","evaluation"] },
  { id: "roboflow", name: "Roboflow", cat: "Model Hubs & Tooling", g: { o: "roboflow", r: "supervision" }, w: "https://roboflow.com", x: "roboflow", d: "roboflow", c: "https://roboflow.com/careers", cb: "roboflow", yr: "2019", hq: "Des Moines", tags: ["computer-vision","annotation","deployment"] },
  { id: "unsloth", name: "Unsloth", cat: "Model Hubs & Tooling", g: { o: "unslothai", r: "unsloth" }, w: "https://unsloth.ai", x: "unaborsclothai", d: "unsloth", tags: ["fine-tuning","2x-faster","open-source","qlora"] },

  // ================================================================
  // OPEN SOURCE MODELS & LOCAL
  // ================================================================
  { id: "ollama", name: "Ollama", cat: "Open Source Models", g: { o: "ollama", r: "ollama" }, w: "https://ollama.com", x: "ollama", d: "ollama", yr: "2023", hq: "SF", tags: ["local-llm","model-runner","macos","docker"] },
  { id: "lmstudio", name: "LM Studio", cat: "Open Source Models", w: "https://lmstudio.ai", x: "LMStudioAI", d: "lmstudio", yr: "2023", tags: ["local-llm","gui","gguf","desktop"] },
  { id: "vllm", name: "vLLM", cat: "Open Source Models", g: { o: "vllm-project", r: "vllm" }, w: "https://vllm.ai", x: "vllm_project", d: "vllm", yr: "2023", hq: "Berkeley", tags: ["inference-engine","paged-attention","open-source"] },
  { id: "llamacpp", name: "llama.cpp", cat: "Open Source Models", g: { o: "ggerganov", r: "llama.cpp" }, yr: "2023", tags: ["inference","c++","quantization","gguf","local"] },
  { id: "openrouter", name: "OpenRouter", cat: "Open Source Models", w: "https://openrouter.ai", x: "OpenRouteaborr", d: "openrouter", tags: ["model-aggregator","api","routing","unified-api"] },

  // ================================================================
  // CRYPTO-AI
  // ================================================================
  { id: "bittensor", name: "Bittensor", cat: "Crypto-AI", g: { o: "opentensor", r: "bittensor" }, w: "https://bittensor.com", x: "opentensor", d: "bittensor", yr: "2021", tags: ["decentralized-ai","subnets"], tk: { symbol: "TAO", chain: "native" } },
  { id: "render", name: "Render Network", cat: "Crypto-AI", w: "https://rendernetwork.com", x: "rendernetwork", d: "render-network", yr: "2017", hq: "LA", tags: ["gpu-network","rendering","decentralized-compute"], tk: { symbol: "RENDER", chain: "solana" } },
  { id: "virtuals", name: "Virtuals Protocol", cat: "Crypto-AI", w: "https://virtuals.io", x: "virtuals_io", d: "virtuals", yr: "2024", hq: "Singapore", tags: ["tokenized-agents","base","agent-launchpad"], tk: { symbol: "VIRTUAL", chain: "base" } },
  { id: "ai16z", name: "ai16z / ELIZA", cat: "Crypto-AI", g: { o: "elizaOS", r: "eliza" }, w: "https://ai16z.ai", x: "ai16zdao", d: "ai16z", yr: "2024", tags: ["dao","agent-fund","eliza-framework"], tk: { symbol: "AI16Z", chain: "solana" } },
  { id: "griffain", name: "Griffain", cat: "Crypto-AI", w: "https://griffain.com", x: "griffaindotcom", d: "griffain", yr: "2024", tags: ["solana-agent","autonomous-trading"], tk: { symbol: "GRIFFAIN", chain: "solana" } },
  { id: "fetch-ai", name: "Fetch.ai", cat: "Crypto-AI", g: { o: "fetchai", r: "uAgents" }, w: "https://fetch.ai", x: "Fetch_ai", d: "fetch-ai", c: "https://fetch.ai/careers", cb: "fetch-ai", yr: "2017", hq: "Cambridge", tags: ["autonomous-agents","uagents","asi-alliance"], tk: { symbol: "FET", chain: "ethereum" } },
  { id: "ocean", name: "Ocean Protocol", cat: "Crypto-AI", g: { o: "oceanprotocol", r: "ocean.py" }, w: "https://oceanprotocol.com", x: "oceanprotocol", d: "ocean", yr: "2017", hq: "Singapore", tags: ["data-marketplace","compute-to-data","asi-alliance"], tk: { symbol: "OCEAN", chain: "ethereum" } },
  { id: "singularitynet", name: "SingularityNET", cat: "Crypto-AI", g: { o: "singnet", r: "snet-daemon" }, w: "https://singularitynet.io", x: "SingularityNET", d: "singularitynet", yr: "2017", tags: ["ai-marketplace","decentralized","asi-alliance"], tk: { symbol: "AGIX", chain: "ethereum" } },
  { id: "akash", name: "Akash Network", cat: "Crypto-AI", g: { o: "akash-network", r: "node" }, w: "https://akash.network", x: "akaborashnet_", d: "akash-network", yr: "2018", tags: ["decentralized-compute","gpu-marketplace","cosmos"], tk: { symbol: "AKT", chain: "cosmos" } },
  { id: "morpheus", name: "Morpheus", cat: "Crypto-AI", g: { o: "MorpheusAIs", r: "Morpheus" }, w: "https://mor.org", x: "MorpheusAIs", d: "morpheus-ai", yr: "2024", tags: ["smart-agents","decentralized","compute-marketplace"], tk: { symbol: "MOR", chain: "ethereum" } },
  { id: "ionet", name: "io.net", cat: "Crypto-AI", w: "https://io.net", x: "ionet", d: "ionet", yr: "2023", hq: "NYC", tags: ["gpu-network","decentralized-compute","solana"], tk: { symbol: "IO", chain: "solana" } },
  { id: "ritual", name: "Ritual", cat: "Crypto-AI", g: { o: "ritual-net", r: "infernet-sdk" }, w: "https://ritual.net", x: "ritualabornet", d: "ritual", cb: "ritual-net", yr: "2023", hq: "SF", tags: ["on-chain-ai","infernet","coprocessor"], tk: { symbol: "RITUAL", chain: "ethereum" } },

  // ================================================================
  // VOICE AGENTS & TELEPHONY
  // ================================================================
  { id: "vapi", name: "Vapi", cat: "Voice Agents & Telephony", g: { o: "VapiAI", r: "server-sdk-python" }, w: "https://vapi.ai", x: "Vapi_AI", d: "vapi", cb: "vapi", tags: ["voice-agents","telephony","api","real-time"] },
  { id: "retell", name: "Retell AI", cat: "Voice Agents & Telephony", w: "https://retellai.com", x: "retellaborai", cb: "retell-ai", tags: ["voice-agents","phone-calls","conversational"] },
  { id: "bland", name: "Bland AI", cat: "Voice Agents & Telephony", w: "https://bland.ai", x: "usebland", cb: "bland-ai", tags: ["phone-agents","enterprise","api"] },
  { id: "voiceflow", name: "Voiceflow", cat: "Voice Agents & Telephony", w: "https://voiceflow.com", x: "VoiceflowHQ", d: "voiceflow", c: "https://voiceflow.com/careers", cb: "voiceflow", tags: ["conversation-design","chatbot-builder","no-code"] },

  // ================================================================
  // BROWSER & COMPUTER USE
  // ================================================================
  { id: "anthropic-computer-use", name: "Claude Computer Use", cat: "Browser & Computer Use", w: "https://anthropic.com", x: "AnthropicAI", tags: ["computer-use","desktop-agent","anthropic"] },
  { id: "browserbase", name: "Browserbase", cat: "Browser & Computer Use", g: { o: "browserbase", r: "stagehand" }, w: "https://browserbase.com", x: "browserbase", cb: "browserbase", tags: ["headless-browser","agent-infra","stagehand"] },

  // ================================================================
  // CUSTOMER SUPPORT AI
  // ================================================================
  { id: "intercom-fin", name: "Intercom Fin", cat: "Customer Support AI", w: "https://intercom.com/fin", x: "intercom", c: "https://intercom.com/careers", cb: "intercom", yr: "2023", hq: "SF", tags: ["support-agent","chatbot","resolution"] },
  { id: "sierra", name: "Sierra", cat: "Customer Support AI", w: "https://sierra.ai", x: "SierraHQ", c: "https://sierra.ai/careers", cb: "sierra-ai", yr: "2023", hq: "SF", tags: ["conversational-ai","customer-experience","enterprise"] },
  { id: "decagon", name: "Decagon", cat: "Customer Support AI", w: "https://decagon.ai", x: "decaboragonai", cb: "decagon-ai", yr: "2023", hq: "SF", tags: ["enterprise-support","generative-agents"] },
  { id: "forethought", name: "Forethought", cat: "Customer Support AI", w: "https://forethought.ai", x: "foraborethoughtai", c: "https://forethought.ai/careers", cb: "forethought", yr: "2017", hq: "SF", tags: ["helpdesk","ticket-routing","automate"] },

  // ================================================================
  // SALES & GTM AI
  // ================================================================
  { id: "clay", name: "Clay", cat: "Sales & GTM AI", w: "https://clay.com", x: "clay", c: "https://clay.com/careers", cb: "clay-run", yr: "2017", hq: "NYC", tags: ["data-enrichment","outbound","go-to-market"] },
  { id: "11x", name: "11x.ai", cat: "Sales & GTM AI", w: "https://11x.ai", x: "11xaborai", c: "https://11x.ai/careers", cb: "11x-ai", yr: "2023", hq: "SF", tags: ["ai-sdr","alice","outbound","digital-workers"] },
  { id: "artisan", name: "Artisan AI", cat: "Sales & GTM AI", w: "https://artisan.co", x: "Artisan_AI_", cb: "artisan-ai", yr: "2023", hq: "SF", tags: ["ai-employees","ava","outbound","bdr"] },
  { id: "regie", name: "Regie.ai", cat: "Sales & GTM AI", w: "https://regie.ai", x: "regaborieai", c: "https://regie.ai/careers", cb: "regieai", yr: "2020", hq: "SF", tags: ["sales-engagement","content-gen","prospecting"] },

  // ================================================================
  // DATA & ANALYTICS
  // ================================================================
  { id: "hex", name: "Hex", cat: "Data & Analytics", w: "https://hex.tech", x: "hex_tech", c: "https://hex.tech/careers", cb: "hex-technologies", yr: "2019", hq: "SF", tags: ["notebooks","sql","ai-analytics"] },
  { id: "julius", name: "Julius AI", cat: "Data & Analytics", w: "https://julius.ai", x: "julius_ai", yr: "2023", hq: "SF", tags: ["chat-with-data","visualization","analysis"] },

  // ================================================================
  // DESIGN & CREATIVE
  // ================================================================
  { id: "canva-ai", name: "Canva (Magic Studio)", cat: "Design & Creative", w: "https://canva.com", x: "canva", c: "https://canva.com/careers", cb: "canva", yr: "2024", hq: "Sydney", as: "canva-design-photo-video", ps: "com.canva.editor", tags: ["design","magic-studio","presentations"] },
  { id: "figma-ai", name: "Figma AI", cat: "Design & Creative", w: "https://figma.com", x: "figma", d: "figma", c: "https://figma.com/careers", cb: "figma", yr: "2024", hq: "SF", tags: ["ui-design","prototyping","ai-gen"] },
  { id: "recraft", name: "Recraft", cat: "Design & Creative", w: "https://recraft.ai", x: "recraftai", cb: "recraft", tags: ["vector","brand-consistent","design-ai"] },

  // ================================================================
  // LEGAL AI
  // ================================================================
  { id: "harvey", name: "Harvey AI", cat: "Legal AI", w: "https://harvey.ai", x: "harveyaborai", c: "https://harvey.ai/careers", cb: "harvey-ai", yr: "2022", hq: "SF", tags: ["legal","contract-analysis","enterprise"] },
  { id: "casetext", name: "CoCounsel (Thomson Reuters)", cat: "Legal AI", w: "https://casetext.com", x: "casetext", cb: "casetext", yr: "2013", hq: "SF", tags: ["legal-research","ai-assistant","acquired"] },

  // ================================================================
  // HEALTHCARE AI
  // ================================================================
  { id: "hippocratic", name: "Hippocratic AI", cat: "Healthcare AI", w: "https://hippocratic.ai", x: "HippocraboraticAI", cb: "hippocratic-ai", yr: "2023", hq: "Palo Alto", tags: ["healthcare","safety-focused","nursing"] },

  // ================================================================
  // FINANCE AI
  // ================================================================
  { id: "bloomberg-gpt", name: "BloombergGPT", cat: "Finance AI", w: "https://bloomberg.com", x: "Bloomberg", yr: "2023", hq: "NYC", tags: ["finance","nlp","bloomberg-terminal"] },

  // ================================================================
  // EDUCATION AI
  // ================================================================
  { id: "khanmigo", name: "Khanmigo", cat: "Education AI", w: "https://khanacademy.org/khan-labs", x: "kaborhanacademy", yr: "2023", hq: "Mountain View", tags: ["education","tutor","math","khan-academy"] },

  // ================================================================
  // ROBOTICS & EMBODIED AI
  // ================================================================
  { id: "figure", name: "Figure AI", cat: "Robotics & Embodied AI", w: "https://figure.ai", x: "Figure_robot", c: "https://figure.ai/careers", cb: "figure-ai", yr: "2022", hq: "Sunnyvale", tags: ["humanoid","robotics","general-purpose"] },
  { id: "1x", name: "1X Technologies", cat: "Robotics & Embodied AI", w: "https://1x.tech", x: "1aborXTech", c: "https://1x.tech/careers", cb: "1x-technologies", yr: "2014", hq: "Moss, Norway", tags: ["humanoid","androids","NEO"] },
  { id: "physical-intelligence", name: "Physical Intelligence (π)", cat: "Robotics & Embodied AI", w: "https://physicalintelligence.company", x: "phy_int", c: "https://physicalintelligence.company/careers", cb: "physical-intelligence", yr: "2024", hq: "SF", tags: ["foundation-model","robotics","manipulation"] },

  // ================================================================
  // 3D & SPATIAL AI
  // ================================================================
  { id: "meshy", name: "Meshy", cat: "3D & Spatial AI", w: "https://meshy.ai", x: "meshaboryai", d: "meshy", cb: "meshy", tags: ["text-to-3d","3d-gen","game-assets"] },
  { id: "tripo", name: "Tripo AI", cat: "3D & Spatial AI", w: "https://tripo3d.ai", x: "tripoaborai", tags: ["3d-gen","image-to-3d","modeling"] },
  { id: "world-labs", name: "World Labs", cat: "3D & Spatial AI", w: "https://worldlabs.ai", x: "WorldLabsAI", cb: "world-labs", yr: "2024", hq: "SF", tags: ["spatial-intelligence","3d-generation","fei-fei-li"] },

  // ================================================================
  // AI SAFETY & ALIGNMENT
  // ================================================================
  { id: "arc", name: "ARC (Alignment Research)", cat: "AI Safety & Alignment", g: { o: "ARC-AGI", r: "ARC-AGI" }, w: "https://alignment.org", x: "ARCevals", c: "https://alignment.org/careers", yr: "2021", hq: "Berkeley", tags: ["safety","evals","alignment"] },
  { id: "metr", name: "METR", cat: "AI Safety & Alignment", w: "https://metr.org", x: "metaborr_org", yr: "2023", hq: "Berkeley", tags: ["evals","autonomy","risk-assessment"] },
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
