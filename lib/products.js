// ============================================================
// SHARED PRODUCT DATA BUILDER
// Constructs enriched product objects from the registry
// Used by both dashboard and standalone product pages
// ============================================================

import { REGISTRY } from "@/lib/pipeline/registry";
import { getFundingData, getKnownMetrics, getRevenueData } from "@/lib/pipeline/funding";

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

export function genSpark(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const pts = [];
  let v = 40 + (seed % 60);
  for (let i = 0; i < 24; i++) {
    const d = ((seed * (i + 1) * 7) % 21) - 8;
    v = Math.max(5, Math.min(200, v + d));
    pts.push(Math.round(v));
  }
  return pts;
}

export function getCategoryARPU(category) {
  const HIGH = ["Customer Support AI", "Sales & GTM AI", "Legal AI", "Finance AI", "Healthcare AI"];
  const MID = ["Code & Dev Tools", "Data & Analytics", "Productivity & Workspace", "AI Safety & Alignment"];
  if (HIGH.includes(category)) return 50;
  if (MID.includes(category)) return 25;
  return 10;
}

export function computeEstimatedMRR({ fundingTotal, trafficVisits, founded, category }) {
  if (trafficVisits && trafficVisits > 10000) {
    const arpu = getCategoryARPU(category);
    return Math.round(trafficVisits * 0.01 * arpu);
  }
  if (fundingTotal && fundingTotal > 0 && founded) {
    const yearsOld = Math.max(1, 2026 - parseInt(founded));
    const est = fundingTotal * 0.04 * Math.min(yearsOld, 4) / 4;
    return Math.round(est / 12);
  }
  return null;
}

function buildProduct(p) {
  const fund = getFundingData(p.id);
  const metrics = getKnownMetrics(p.id);
  const rev = getRevenueData(p.id);

  let seedMRR = null;
  let revenueConfidence = null;
  let revenueReasoning = null;
  let revenueSources = null;
  let revenueSourceNames = null;

  if (rev) {
    seedMRR = rev.mrr;
    revenueConfidence = rev.confidence;
    revenueReasoning = rev.reasoning;
    revenueSources = rev.sources;
    revenueSourceNames = rev.sourceNames;
  } else {
    seedMRR = computeEstimatedMRR({
      fundingTotal: fund?.total,
      trafficVisits: null,
      founded: p.yr,
      category: p.cat,
    });
    if (seedMRR) {
      revenueConfidence = "low";
      revenueReasoning = `Estimated from ${fund?.total ? "$" + (fund.total / 1e6).toFixed(0) + "M funding" : "category benchmarks"}, ${p.yr ? (2026 - parseInt(p.yr)) + " years old" : "unknown age"}`;
      revenueSourceNames = "Estimated";
    }
  }

  const seedMAU = metrics?.mau ?? null;

  return {
    id: p.id,
    name: p.name,
    ticker: p.tk ? p.tk.symbol : null,
    category: p.cat,
    logoDomain: p.w ? getDomain(p.w) : null,
    description: (p.tags || []).join(" · ") || p.cat,
    mrr: seedMRR, mrrChange: null,
    mrrHist: [],
    revenueConfidence,
    revenueReasoning,
    revenueSources,
    revenueSourceNames,
    mau: seedMAU, mauChange: null, dau: null,
    githubStars: null, starVelocity: null,
    teamSize: null, teamGrowth: null,
    fundingTotal: fund?.total ?? null,
    lastRound: fund?.last_round ?? null,
    valuation: fund?.valuation ?? null,
    investors: fund?.investors ?? [],
    uptime: null, latencyMs: null, errorRate: null,
    sentiment: null, nps: null,
    verifications: {
      revenue: rev ? rev.confidence : seedMRR ? "funding_estimate" : "self",
      usage: metrics?.mau ? "traffic_estimate" : "self",
      community: p.g ? "github" : p.d ? "discord" : "self",
      uptime: "self",
      team: fund ? "crunchbase" : p.cb ? "crunchbase" : "self",
    },
    spark: genSpark(p.id),
    hot: false,
    age: p.yr ? `${2026 - parseInt(p.yr)}y` : null,
    founded: p.yr || null,
    added: p.added || null,
    website: p.w || null,
    twitter: p.x ? `https://x.com/${p.x}` : null,
    contactEmail: p.em || null,
    contactName: p.cn || null,
    github: p.g || null,
    discord: p.d || null,
    crunchbase: p.cb || null,
    linkedin: p.li || null,
    tags: p.tags || [],
    token: p.tk || null,
    hq: p.hq || null,
  };
}

// Pre-built PRODUCTS array (module-level cache)
let _products = null;

export function getProducts() {
  if (!_products) {
    _products = REGISTRY.map(buildProduct);
  }
  return _products;
}

export function getProductById(id) {
  return getProducts().find(p => p.id === id) || null;
}

export function getNewlyAddedProducts(products, daysAgo = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  return products
    .filter(p => p.added && new Date(p.added) >= cutoff)
    .sort((a, b) => new Date(b.added) - new Date(a.added));
}

export function isNewlyAdded(product, daysAgo = 30) {
  if (!product.added) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  return new Date(product.added) >= cutoff;
}
