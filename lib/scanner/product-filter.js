// ============================================================
// PRODUCT / AGENT FILTER
// Ensures only real products, tools, agents, models, and
// libraries pass through — NOT blog posts, articles, or discussions
// ============================================================

// Sources that are inherently product registries
const PRODUCT_SOURCES = new Set([
  "github",
  "github-trending",
  "github-releases",
  "github-momentum",
  "pypi",
  "npm",
  "huggingface",
  "producthunt",
]);

// URL patterns that indicate a real product (code, package, model)
const PRODUCT_URL_PATTERNS = [
  /github\.com\/[\w-]+\/[\w.-]+/i,
  /gitlab\.com\/[\w-]+\/[\w.-]+/i,
  /pypi\.org\/project\//i,
  /npmjs\.com\/package\//i,
  /huggingface\.co\/([\w-]+\/[\w.-]+|spaces\/)/i,
  /crates\.io\/crates\//i,
  /rubygems\.org\/gems\//i,
  /packagist\.org\/packages\//i,
  /pkg\.go\.dev\//i,
  /nuget\.org\/packages\//i,
  /anaconda\.org\//i,
  /docker\.com\//i,
  /hub\.docker\.com\//i,
];

// Content patterns that indicate NOT a product (articles, discussions)
const CONTENT_REJECT_PATTERNS = [
  // Discussion / opinion
  /^(what do you think|help me|advice needed|eli5|cmv|ama\b)/i,
  /^(unpopular opinion|hot take|controversial|rant)\b/i,
  /\b(what are your thoughts|anyone else|recommend me)\b/i,

  // Blog / article / tutorial
  /^(how to |how i |why i |why you should|introduction to|getting started)/i,
  /^(my experience|i built|i tried|i created|i made|i spent)\b/i,
  /^(a guide to|the ultimate guide|beginner'?s guide|complete guide)/i,
  /\b(tutorial|walkthrough|step.by.step|hands.on)\b/i,

  // Roundups / lists / news
  /\b(weekly|monthly|daily|roundup|newsletter|digest|recap)\b/i,
  /^(top \d+|best \d+|\d+ best)\b/i,
  /\b(awesome list|curated list|collection of)\b/i,

  // Comparisons / reviews
  /\bvs\.?\b/i,
  /^(comparing|comparison|review of|benchmark)\b/i,
  /^(the state of|state of the art|survey of)\b/i,

  // Jobs / hiring
  /\b(hiring|job opening|we'?re looking|join our team)\b/i,

  // Memes / low quality
  /\b(meme|shitpost|joke|funny)\b/i,

  // Articles / analysis / commentary
  /^(understanding|exploring|a deep dive|deep dive into)\b/i,
  /^(the future of|what's new in|what happened|looking at)\b/i,
  /^(lessons learned|takeaways from|thoughts on|reflections on)\b/i,
  /\b(explained|demystified|in \d+ minutes|cheat ?sheet)\b/i,
  /\b(case study|white paper|research paper|blog post)\b/i,

  // Questions / help requests
  /^(how (do|can|does|should)|is there|can (someone|anyone|you))\b/i,
  /^(does anyone|has anyone|what is the best|which)\b/i,
  /\?([\s]*$)/i, // ends with a question mark
];

// Product boost keywords (increase confidence when present)
const PRODUCT_BOOST_KEYWORDS = [
  "install", "npm install", "pip install", "cargo add",
  "sdk", "api", "library", "framework", "package", "module",
  "cli", "plugin", "extension", "middleware",
  "release", "v1", "v2", "v3", "beta", "alpha", "stable",
  "launch", "introducing", "announcing", "open source",
  "self-hosted", "saas", "platform", "dashboard", "playground",
  "model", "weights", "checkpoint", "fine-tuned", "pre-trained",
  "inference", "serving", "deployment",
  "agent", "bot", "automation", "workflow",
];

/**
 * Determines if a discovery is an actual product/tool/agent
 * Returns { isProduct: boolean, reason: string, confidenceBoost: number }
 */
export function validateProduct(discovery) {
  const { source, url, name, description } = discovery;
  const title = name || "";
  const desc = description || "";
  const fullText = `${title} ${desc}`.toLowerCase();

  // 1. Product registry sources — always products
  if (PRODUCT_SOURCES.has(source)) {
    // Even product sources can have noise — check name patterns
    for (const pattern of CONTENT_REJECT_PATTERNS) {
      if (pattern.test(title)) {
        return { isProduct: false, reason: `content_pattern:${pattern.source}`, confidenceBoost: 0 };
      }
    }

    // Calculate product boost
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "product_source", confidenceBoost: boost };
  }

  // 2. Content sources — must link to a product URL
  if (["devto", "lobsters"].includes(source)) {
    if (!url || isContentUrl(url, source)) {
      return { isProduct: false, reason: "content_source_no_product_url", confidenceBoost: 0 };
    }
    // URL points to a product — check if title is content-like
    for (const pattern of CONTENT_REJECT_PATTERNS) {
      if (pattern.test(title)) {
        return { isProduct: false, reason: `content_title:${pattern.source}`, confidenceBoost: 0 };
      }
    }
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "content_source_with_product_url", confidenceBoost: boost };
  }

  // 3. Reddit — must link to external product, not self-post or blog
  if (source === "reddit") {
    if (!url || url.includes("reddit.com")) {
      return { isProduct: false, reason: "reddit_self_post", confidenceBoost: 0 };
    }
    // Reject blog/article domains
    if (isBlogUrl(url)) {
      return { isProduct: false, reason: "reddit_blog_url", confidenceBoost: 0 };
    }
    for (const pattern of CONTENT_REJECT_PATTERNS) {
      if (pattern.test(title)) {
        return { isProduct: false, reason: "reddit_content_post", confidenceBoost: 0 };
      }
    }
    // Check for product URL pattern
    const hasProductUrl = PRODUCT_URL_PATTERNS.some((p) => p.test(url));
    if (!hasProductUrl) {
      // External URL but not a known product registry — require product signal
      const hasProductSignal = PRODUCT_BOOST_KEYWORDS.some((kw) => fullText.includes(kw));
      if (!hasProductSignal) {
        return { isProduct: false, reason: "reddit_no_product_signal", confidenceBoost: 0 };
      }
    }
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "reddit_product_link", confidenceBoost: boost };
  }

  // 4. HackerNews — must have external URL, reject blogs/articles
  if (source === "hackernews") {
    if (!url || url.includes("ycombinator.com") || url.includes("news.ycombinator")) {
      return { isProduct: false, reason: "hn_self_post", confidenceBoost: 0 };
    }
    // Reject blog/article domains
    if (isBlogUrl(url)) {
      return { isProduct: false, reason: "hn_blog_url", confidenceBoost: 0 };
    }
    for (const pattern of CONTENT_REJECT_PATTERNS) {
      if (pattern.test(title)) {
        return { isProduct: false, reason: "hn_content_post", confidenceBoost: 0 };
      }
    }
    // Prefer items that link to known product URLs
    const hasProductUrl = PRODUCT_URL_PATTERNS.some((p) => p.test(url));
    if (!hasProductUrl) {
      // Unknown external URL — only allow if title has strong product signals
      const hasProductSignal = PRODUCT_BOOST_KEYWORDS.some((kw) => fullText.includes(kw));
      if (!hasProductSignal) {
        return { isProduct: false, reason: "hn_no_product_signal", confidenceBoost: 0 };
      }
    }
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "hn_product_link", confidenceBoost: boost };
  }

  // 5. arXiv — only if has GitHub link (code release)
  if (source === "arxiv") {
    if (!url || !url.includes("github.com")) {
      return { isProduct: false, reason: "arxiv_no_code", confidenceBoost: 0 };
    }
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "arxiv_with_code", confidenceBoost: boost };
  }

  // 6. StackOverflow — questions are adoption signals, NOT products
  if (source === "stackoverflow") {
    return { isProduct: false, reason: "stackoverflow_question", confidenceBoost: 0 };
  }

  // 7. GitHub Discussions — discussions are NOT products
  if (source === "github-discussions") {
    return { isProduct: false, reason: "github_discussion", confidenceBoost: 0 };
  }

  // 8. Mastodon — social posts, only allow if linking to a product URL
  if (source === "mastodon") {
    if (!url) {
      return { isProduct: false, reason: "mastodon_no_url", confidenceBoost: 0 };
    }
    const hasProductUrl = PRODUCT_URL_PATTERNS.some((p) => p.test(url));
    if (!hasProductUrl) {
      return { isProduct: false, reason: "mastodon_no_product_url", confidenceBoost: 0 };
    }
    for (const pattern of CONTENT_REJECT_PATTERNS) {
      if (pattern.test(title)) {
        return { isProduct: false, reason: `mastodon_content:${pattern.source}`, confidenceBoost: 0 };
      }
    }
    const boost = calcProductBoost(fullText, discovery);
    return { isProduct: true, reason: "mastodon_product_link", confidenceBoost: boost };
  }

  // Default: require a product URL pattern — reject everything else
  if (!url || !PRODUCT_URL_PATTERNS.some((p) => p.test(url))) {
    return { isProduct: false, reason: "unknown_source_no_product_url", confidenceBoost: 0 };
  }
  const boost = calcProductBoost(fullText, discovery);
  return { isProduct: true, reason: "default_with_product_url", confidenceBoost: boost };
}

// Blog/article domains — NOT products
const BLOG_DOMAINS = [
  "medium.com", "substack.com", "dev.to", "hashnode.dev",
  "towardsdatascience.com", "towards.ai", "analyticsvidhya.com",
  "freecodecamp.org", "hackernoon.com", "thenewstack.io",
  "infoq.com", "zdnet.com", "techcrunch.com", "theverge.com",
  "arstechnica.com", "wired.com", "venturebeat.com", "reuters.com",
  "bbc.com", "nytimes.com", "theguardian.com", "bloomberg.com",
  "cnbc.com", "forbes.com", "businessinsider.com",
  "youtube.com", "youtu.be", "twitter.com", "x.com",
  "reddit.com", "news.ycombinator.com", "lobste.rs",
  "arxiv.org", "wikipedia.org", "stackoverflow.com",
  "docs.google.com", "notion.so", "blog.", "wordpress.com",
];

/**
 * Check if a URL points to a blog/article/news site
 */
function isBlogUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return BLOG_DOMAINS.some((d) => u.includes(d));
}

/**
 * Check if a URL points back to the content source itself (not a product)
 */
function isContentUrl(url, source) {
  if (!url) return true;
  const u = url.toLowerCase();

  // DevTo article URL
  if (source === "devto" && u.includes("dev.to/")) return true;
  // Lobsters story URL
  if (source === "lobsters" && u.includes("lobste.rs/")) return true;

  // Check if it matches any known product URL pattern
  return !PRODUCT_URL_PATTERNS.some((p) => p.test(url));
}

/**
 * Calculate confidence boost based on product signals
 */
function calcProductBoost(text, discovery) {
  let boost = 0;
  let hits = 0;

  for (const kw of PRODUCT_BOOST_KEYWORDS) {
    if (text.includes(kw)) {
      hits++;
      if (hits >= 3) break; // Cap boost
    }
  }
  boost += hits * 0.03;

  // Stars/downloads/upvotes boost
  if (discovery.stars > 100) boost += 0.1;
  else if (discovery.stars > 10) boost += 0.05;

  if (discovery.downloads > 1000) boost += 0.1;
  else if (discovery.downloads > 100) boost += 0.05;

  if (discovery.upvotes > 50) boost += 0.05;

  return Math.min(boost, 0.2); // Cap total boost at 0.2
}
