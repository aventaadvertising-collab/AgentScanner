// ============================================================
// SHARED FORMATTING UTILITIES
// Used by both dashboard (AgentScanner.js) and product pages
// ============================================================

export const fmt$ = (n) => {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
};

export const fmtU = (n) => {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export const fmtP = (n) => {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
};

export const isV = (s) => s && s !== "self";
export const vCount = (v) => Object.values(v).filter(isV).length;

export const SRC = {
  stripe: "Stripe", posthog: "PostHog", analytics: "Analytics",
  cloudflare: "Cloudflare", github: "GitHub", discord: "Discord",
  betterstack: "BetterStack", linkedin: "LinkedIn", self: "Self-Reported",
  traffic_estimate: "Traffic Est.", funding_estimate: "Funding Est.",
  social_estimate: "Social Est.", high: "Verified", medium: "Reported",
  low: "Estimated",
};
