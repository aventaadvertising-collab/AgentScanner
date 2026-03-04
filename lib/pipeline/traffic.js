// ============================================================
// WEB TRAFFIC PIPELINE
// Estimates traffic from publicly available signals
// Sources: Cloudflare Radar (free), SimilarWeb (limited free)
// Fallback: Tranco list ranking as proxy
// ============================================================

const TRANCO_API = "https://tranco-list.eu/api/ranks/domain";

// Fetch domain rank from Tranco list (free, no auth)
// Lower rank = more traffic. Top 1M sites tracked.
export async function fetchTrancoRank(domain) {
  try {
    const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const res = await fetch(`${TRANCO_API}/${clean}`, {
      headers: { "User-Agent": "AgentScreener/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Tranco returns ranks array with different list versions
    if (data.ranks && data.ranks.length > 0) {
      return {
        domain: clean,
        rank: data.ranks[0].rank,
        list_date: data.ranks[0].date,
        fetched_at: new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.error(`Tranco rank error for ${domain}:`, err);
    return null;
  }
}

// Rough traffic estimate from Tranco rank
// Based on empirical data: rank 1 ≈ 10B visits/mo, rank 1M ≈ 1K visits/mo
// Uses log scale approximation
export function estimateTrafficFromRank(rank) {
  if (!rank || rank <= 0) return null;
  // Log-linear model: log10(traffic) ≈ 10 - (rank / 100000) * 1.5
  // Simplified: top 100 sites ~1B/mo, top 10K ~10M/mo, top 100K ~500K/mo
  const logTraffic = 10.5 - Math.log10(rank) * 1.75;
  const monthlyVisits = Math.round(Math.pow(10, Math.max(logTraffic, 2)));
  return {
    estimated_monthly_visits: monthlyVisits,
    confidence: rank < 10000 ? "high" : rank < 100000 ? "medium" : "low",
    method: "tranco_rank_extrapolation",
  };
}

// Fetch builtwith/wappalyzer-style tech detection (basic)
// Check common headers for CDN, hosting, analytics signals
export async function detectTechStack(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "AgentScreener/1.0" },
    });

    const headers = Object.fromEntries(res.headers.entries());
    const tech = [];

    // Detect CDN
    if (headers["server"]?.includes("cloudflare")) tech.push("Cloudflare");
    if (headers["x-vercel-id"]) tech.push("Vercel");
    if (headers["x-amz-cf-id"]) tech.push("AWS CloudFront");
    if (headers["x-served-by"]?.includes("fastly")) tech.push("Fastly");

    // Detect framework hints
    if (headers["x-powered-by"]?.includes("Next.js")) tech.push("Next.js");
    if (headers["x-powered-by"]?.includes("Express")) tech.push("Express");

    return {
      url,
      tech_stack: tech,
      server: headers["server"] || null,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    return { url, tech_stack: [], error: err.message };
  }
}
