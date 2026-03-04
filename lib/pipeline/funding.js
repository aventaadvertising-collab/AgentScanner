// ============================================================
// FUNDING PIPELINE
// Scrapes/aggregates funding data from public sources
// Primary: Crunchbase Basic API (free tier)
// Fallback: Static dataset updated manually + news scraping
// ============================================================

// Known funding data - manually maintained + auto-updated
// This serves as the baseline, supplemented by API lookups
const KNOWN_FUNDING = {
  cursor: {
    total: 460_000_000, last_round: "Series C", valuation: 2_500_000_000,
    investors: ["a16z", "Thrive Capital"], last_updated: "2025-01",
  },
  bolt: {
    total: 100_000_000, last_round: "Series B", valuation: 750_000_000,
    investors: ["Spark Capital"], last_updated: "2025-01",
  },
  perplexity: {
    total: 500_000_000, last_round: "Series C", valuation: 9_000_000_000,
    investors: ["IVP", "NEA", "Bezos Expeditions"], last_updated: "2025-01",
  },
  devin: {
    total: 175_000_000, last_round: "Series A", valuation: 500_000_000,
    investors: ["Founders Fund"], last_updated: "2024-12",
  },
  lovable: {
    total: 25_000_000, last_round: "Series A", valuation: 200_000_000,
    investors: ["Spark Capital"], last_updated: "2025-01",
  },
  windsurf: {
    total: 60_000_000, last_round: "Series A", valuation: 300_000_000,
    investors: ["Greenoaks Capital"], last_updated: "2024-12",
  },
  elevenlabs: {
    total: 180_000_000, last_round: "Series C", valuation: 3_300_000_000,
    investors: ["a16z", "Nat Friedman"], last_updated: "2025-01",
  },
  replitAgent: {
    total: 200_000_000, last_round: "Series C", valuation: 1_200_000_000,
    investors: ["a16z"], last_updated: "2024-06",
  },
  midjourney: {
    total: 0, last_round: "Bootstrapped", valuation: null,
    investors: [], last_updated: "2024-12",
  },
  v0: {
    total: null, last_round: "Vercel Product", valuation: null,
    investors: [], last_updated: "2024-12",
  },
  heygen: {
    total: 60_000_000, last_round: "Series A", valuation: 500_000_000,
    investors: ["Benchmark"], last_updated: "2024-12",
  },
  "claude-code": {
    total: null, last_round: "Anthropic Product", valuation: null,
    investors: [], last_updated: "2024-12",
  },
};

export function getFundingData(productId) {
  return KNOWN_FUNDING[productId] || null;
}

export function getAllFundingData() {
  return KNOWN_FUNDING;
}

// Search for recent funding news via web (to be called periodically)
// This would use a news API or web scraping in production
export async function searchFundingNews(companyName) {
  // Placeholder: In production, use:
  // - NewsAPI.org (free tier: 100 req/day)
  // - Google News RSS feed scraping
  // - TechCrunch RSS for AI/startup funding
  return {
    company: companyName,
    recent_articles: [],
    note: "News search not yet configured. Add NEWS_API_KEY to enable.",
    checked_at: new Date().toISOString(),
  };
}
