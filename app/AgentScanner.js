"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./auth/AuthModal";
import UserMenu from "./auth/UserMenu";
import AlertModal from "./auth/AlertModal";

// ============================================================
// DATA — Generated from the 155-product registry
// Pipeline data replaces placeholders once fetched
// ============================================================
import { REGISTRY, CATEGORIES } from "@/lib/pipeline/registry";
import { getFundingData, getKnownMetrics, getRevenueData } from "@/lib/pipeline/funding";

// Extract domain from URL for logo fetching
function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

// Generate a deterministic pseudo-random sparkline from product id
function genSpark(id) {
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

// Convert registry entries to display format with seed data
const PRODUCTS = REGISTRY.map(p => {
  const fund = getFundingData(p.id);
  const metrics = getKnownMetrics(p.id);
  const rev = getRevenueData(p.id);

  // Revenue: prefer sourced data, fall back to funding estimate
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
    // Fall back to funding-based estimate
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
});

const ALL_CATS = ["All", ...CATEGORIES];
const SORTS = [
  { key: "githubStars", label: "GitHub Stars" },
  { key: "name", label: "Name (A-Z)" },
  { key: "fundingTotal", label: "Funding" },
  { key: "sentiment", label: "Sentiment" },
  { key: "mrr", label: "Revenue" },
  { key: "mau", label: "Users" },
];

// ============================================================
// UTILS
// ============================================================
const fmt$ = (n) => {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
};
const fmtU = (n) => {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};
const fmtP = (n) => {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
};
const isV = (s) => s && s !== "self";
const vCount = (v) => Object.values(v).filter(isV).length;
const SRC = { stripe: "Stripe", posthog: "PostHog", analytics: "Analytics", cloudflare: "Cloudflare", github: "GitHub", discord: "Discord", betterstack: "BetterStack", linkedin: "LinkedIn", self: "Self-Reported", traffic_estimate: "Traffic Est.", funding_estimate: "Funding Est.", social_estimate: "Social Est.", high: "Verified", medium: "Reported", low: "Estimated" };

// Estimated MRR from available signals
function getCategoryARPU(category) {
  const HIGH = ["Customer Support AI", "Sales & GTM AI", "Legal AI", "Finance AI", "Healthcare AI"];
  const MID = ["Code & Dev Tools", "Data & Analytics", "Productivity & Workspace", "AI Safety & Alignment"];
  if (HIGH.includes(category)) return 50;
  if (MID.includes(category)) return 25;
  return 10;
}

function computeEstimatedMRR({ fundingTotal, trafficVisits, founded, category }) {
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

// ============================================================
// MICRO COMPONENTS
// ============================================================
function ProductLogo({ product, size = 32 }) {
  const domain = product.logoDomain;
  const fallback = product.name[0].toUpperCase();
  const [err, setErr] = useState(false);

  if (!domain || err) {
    return <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 700, color: "var(--t3)", fontFamily: "var(--m)" }}>{fallback}</div>;
  }

  return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`} width={size} height={size} style={{ borderRadius: size * 0.22, objectFit: "contain", background: "#fff", border: "1px solid var(--b1)" }} onError={() => setErr(true)} alt="" />;
}

function ConfidenceDot({ level }) {
  const colors = { high: "var(--up)", medium: "var(--y)", low: "var(--t4)" };
  return <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors[level] || "var(--t4)", display: "inline-block", marginRight: 3, boxShadow: level === "high" ? "0 0 4px rgba(22,163,74,.3)" : "none" }} />;
}

function Spark({ data, up, w = 110, h = 28 }) {
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * (h - 4) - 2}`).join(" ");
  const c = up !== false ? "var(--up)" : "var(--dn)";
  const gid = "s" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity=".10" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VBadge({ src, size = 9 }) {
  const v = isV(src);
  return (
    <span className="vb" style={{ fontSize: size, color: v ? "var(--g)" : "var(--t3)" }}>
      <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: v ? "var(--g)" : "var(--t4)", boxShadow: v ? "0 0 5px var(--gg)" : "none", display: "inline-block", marginRight: 3, verticalAlign: "middle" }} />
      {SRC[src] || src}
    </span>
  );
}

function VMeter({ v }) {
  const entries = Object.entries(v);
  const pct = Math.round((vCount(v) / entries.length) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 1.5 }}>
        {entries.map(([k, s]) => (
          <div key={k} style={{ width: 10, height: 3.5, borderRadius: 1, background: isV(s) ? "var(--g)" : "var(--t4)", boxShadow: isV(s) ? "0 0 3px var(--gg)" : "none" }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>{pct}%</span>
    </div>
  );
}

function SentiBar({ s }) {
  if (!s) return <span style={{ color: "var(--t3)" }}>—</span>;
  const c = s >= 80 ? "var(--up)" : s >= 60 ? "var(--y)" : "var(--dn)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 40, height: 3, borderRadius: 2, background: "var(--t4)", overflow: "hidden" }}>
        <div style={{ width: `${s}%`, height: "100%", background: c, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--m)", color: c }}>{s}</span>
    </div>
  );
}

function ExtLink({ href, children, style: s = {} }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--g)", textDecoration: "none", fontSize: 12, fontWeight: 500, transition: "opacity .15s", ...s }} onMouseEnter={e => e.currentTarget.style.opacity = ".7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{children}</a>;
}

// ============================================================
// BAR CHART
// ============================================================
function BarChart({ data, w = 300, h = 72 }) {
  if (!data || !data.length) return <div style={{ color: "var(--t3)", fontSize: 11 }}>No revenue history</div>;
  const max = Math.max(...data);
  const bw = (w - (data.length - 1) * 5) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = max > 0 ? (v / max) * (h - 14) : 0;
        const x = i * (bw + 5);
        const last = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={bw} height={bh} rx={2.5} fill={last ? "var(--g)" : "rgba(255,255,255,.05)"} />
            <text x={x + bw / 2} y={h - bh - 5} textAnchor="middle" style={{ fontSize: 7.5, fill: last ? "var(--g)" : "var(--t3)", fontFamily: "var(--m)" }}>{fmt$(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// DETAIL PANEL
// ============================================================
function DetailPanel({ p, onClose, onAlert }) {
  if (!p) return null;

  const grid = [
    { l: p.revenueConfidence === "low" ? "Est. Revenue" : "Revenue", v: fmt$(p.mrr), c: p.mrrChange, s: p.verifications.revenue },
    { l: "MAU", v: fmtU(p.mau), c: p.mauChange, s: p.verifications.usage },
    { l: "DAU", v: fmtU(p.dau), c: null, s: p.verifications.usage },
    { l: "GitHub Stars", v: p.githubStars ? fmtU(p.githubStars) : "—", c: null, s: p.verifications.community },
    { l: "Star Velocity", v: p.starVelocity ? `+${p.starVelocity}/wk` : "—", c: null, s: p.verifications.community },
    { l: "Uptime 30d", v: p.uptime ? `${p.uptime}%` : "—", c: null, s: p.verifications.uptime },
    { l: "P50 Latency", v: p.latencyMs ? `${p.latencyMs}ms` : "—", c: null, s: p.verifications.uptime },
    { l: "Error Rate", v: p.errorRate != null ? `${p.errorRate}%` : "—", c: null, s: p.verifications.uptime },
    { l: "Team Size", v: p.teamSize || "—", c: p.teamGrowth, s: p.verifications.team },
    { l: "NPS", v: p.nps || "—", c: null, s: "analytics" },
    { l: "Sentiment", v: p.sentiment || "—", c: null, s: "analytics" },
    { l: "Age", v: p.age, c: null, s: "self" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fi .15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "94%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", boxShadow: "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)" }}>

        {/* Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <ProductLogo product={p} size={48} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--m)", margin: 0, letterSpacing: "-.01em" }}>{p.name}</h2>
                {p.ticker && <span style={{ fontSize: 11, color: "var(--y)", fontFamily: "var(--m)", fontWeight: 700 }}>${p.ticker}</span>}
                {p.hot && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 700, letterSpacing: ".06em" }}>HOT</span>}
              </div>
              <p style={{ fontSize: 12, color: "var(--t2)", margin: 0, lineHeight: 1.4, maxWidth: 400 }}>{p.description}</p>
              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                <span className="chip">{p.category}</span>
                {p.founded && <span className="chip">Est. {p.founded}</span>}
                {p.hq && <span className="chip">{p.hq}</span>}
                {(p.tags || []).slice(0, 4).map((t, i) => <span key={i} className="chip chip-g">{t}</span>)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div style={{ padding: "20px 26px 26px" }}>

          {/* Links + Contact + Alert Row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {p.website && <ExtLink href={p.website} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>↗</span> Website
            </ExtLink>}
            {p.twitter && <ExtLink href={p.twitter} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
              𝕏 Profile
            </ExtLink>}
            {p.github && <ExtLink href={`https://github.com/${p.github.o}/${p.github.r}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
              GitHub
            </ExtLink>}
            {p.discord && <ExtLink href={`https://discord.gg/${p.discord}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
              Discord
            </ExtLink>}
            {p.crunchbase && <ExtLink href={`https://crunchbase.com/organization/${p.crunchbase}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
              Crunchbase
            </ExtLink>}
            {p.linkedin && <ExtLink href={`https://linkedin.com/company/${p.linkedin}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
              LinkedIn
            </ExtLink>}
            {p.token && <span style={{ padding: "5px 12px", borderRadius: 6, background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.15)", fontSize: 10, fontWeight: 700, color: "var(--y)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              ${p.token.symbol} • {p.token.chain}
            </span>}
            <button onClick={(e) => { e.stopPropagation(); if (onAlert) onAlert(e, p); }} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--f)", color: "var(--t2)", display: "inline-flex", alignItems: "center", gap: 5, transition: "all .12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,.05)"; e.currentTarget.style.color = "var(--g)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--s2)"; e.currentTarget.style.color = "var(--t2)"; }}
            >
              🔔 Set Alert
            </button>
            {p.contactEmail && (
              <a href={`mailto:${p.contactEmail}`} style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 7, background: "var(--g)", color: "#FFFFFF", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: ".01em" }}>
                ✉ Contact {p.contactName || "Team"}
              </a>
            )}
          </div>

          {/* Verification Sources */}
          <div style={{ padding: "12px 16px", borderRadius: 9, marginBottom: 18, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="label-xs">Data Sources</span>
              {Object.entries(p.verifications).map(([k, s]) => <VBadge key={k} src={s} size={10} />)}
            </div>
            <VMeter v={p.verifications} />
          </div>

          {/* Revenue Sources & Reasoning */}
          {p.revenueReasoning && (
            <div className="card-inner" style={{ marginBottom: 18, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span className="label-xs">Revenue Intelligence</span>
                {p.revenueConfidence && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: p.revenueConfidence === "high" ? "rgba(22,163,74,.08)" : p.revenueConfidence === "medium" ? "rgba(217,119,6,.08)" : "rgba(0,0,0,.04)", color: p.revenueConfidence === "high" ? "var(--up)" : p.revenueConfidence === "medium" ? "var(--y)" : "var(--t3)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>{p.revenueConfidence} confidence</span>}
              </div>
              <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, margin: "0 0 8px" }}>{p.revenueReasoning}</p>
              {p.revenueSources && p.revenueSources.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.revenueSources.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: 4, background: "rgba(0,0,0,.02)" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t1)" }}>{s.name}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{fmt$(s.value)}/yr</span>
                        <span style={{ fontSize: 9, color: "var(--t3)" }}>{s.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Revenue Chart */}
          {p.mrrHist && p.mrrHist.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Revenue (7mo)</span>
              <div className="card-inner"><BarChart data={p.mrrHist} /></div>
            </div>
          )}

          {/* Traction */}
          <div style={{ marginBottom: 18 }}>
            <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Traction Index (30d)</span>
            <div className="card-inner"><Spark data={p.spark} up={p.mrrChange == null || p.mrrChange >= 0} w={600} h={44} /></div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
            {grid.map((m, i) => (
              <div key={i} className="card-inner" style={{ padding: "12px 14px" }}>
                <div className="label-xs" style={{ marginBottom: 5 }}>{m.l}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{m.v}</span>
                  {m.c != null && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", color: m.c >= 0 ? "var(--up)" : "var(--dn)" }}>{fmtP(m.c)}</span>}
                </div>
                <VBadge src={m.s} />
              </div>
            ))}
          </div>

          {/* Funding */}
          {(p.valuation || p.fundingTotal > 0) && (
            <div className="card-inner" style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 3 }}>Valuation</div>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{p.valuation ? fmt$(p.valuation) : "—"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="label-xs" style={{ marginBottom: 3 }}>Total Raised</div>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{p.fundingTotal ? fmt$(p.fundingTotal) : "—"}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label-xs" style={{ marginBottom: 3 }}>Investors</div>
                <span style={{ fontSize: 11, color: "var(--t2)" }}>{p.investors?.length ? p.investors.join(", ") : "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APPLICATION MODAL
// ============================================================
function ApplyModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name: "", ticker: "", website: "", category: "Dev Tools", description: "", founded: "", teamSize: "", lastRound: "", fundingTotal: "", contactName: "", contactEmail: "", contactRole: "", connectStripe: false, connectAnalytics: false, connectGithub: false, connectDiscord: false, connectUptime: false, mrr: "", mau: "" });
  const [done, setDone] = useState(false);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));

  const CATS = CATEGORIES;

  const Inp = ({ label, field, ph, type = "text", half }) => (
    <div style={{ flex: half ? "1 1 48%" : "1 1 100%" }}>
      <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>{label}</label>
      <input type={type} value={f[field]} onChange={e => u(field, e.target.value)} placeholder={ph} className="input" />
    </div>
  );

  const Toggle = ({ label, icon, field }) => (
    <div onClick={() => u(field, !f[field])} style={{ padding: "12px 14px", borderRadius: 8, cursor: "pointer", background: f[field] ? "var(--gd)" : "var(--s2)", border: `1px solid ${f[field] ? "rgba(37,99,235,.25)" : "var(--b1)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .12s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>{label}</div>
          <div style={{ fontSize: 9, color: "var(--t3)" }}>OAuth • Read-only access</div>
        </div>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${f[field] ? "var(--g)" : "var(--t4)"}`, background: f[field] ? "var(--g)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--bg)", fontWeight: 800 }}>{f[field] ? "✓" : ""}</div>
    </div>
  );

  if (done) return (
    <div onClick={onClose} className="modal-bg">
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "88%", maxWidth: 440, padding: "44px 32px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--gd)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, color: "var(--g)" }}>✓</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: "0 0 6px" }}>Submitted</h2>
        <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, marginBottom: 20 }}>We'll review {f.name || "your product"} within 48 hours. Verified products are fast-tracked.</p>
        <button onClick={onClose} className="btn-primary">Done</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} className="modal-bg">
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "92%", maxWidth: 540, maxHeight: "88vh", overflow: "auto", boxShadow: "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: 0 }}>Submit Product</h2>
            <p style={{ fontSize: 10, color: "var(--t3)", margin: "2px 0 0" }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <div style={{ height: 2, background: "var(--b1)" }}>
          <div style={{ height: "100%", width: `${(step / 3) * 100}%`, background: "var(--g)", transition: "width .3s", boxShadow: "0 0 8px var(--gg)" }} />
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span className="label-xs" style={{ color: "var(--g)" }}>Product Information</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Inp label="Product Name" field="name" ph="e.g. Cursor" half />
                <Inp label="Ticker" field="ticker" ph="e.g. CRSR" half />
              </div>
              <Inp label="Website" field="website" ph="https://your-product.com" />
              <div>
                <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>Category</label>
                <select value={f.category} onChange={e => u("category", e.target.value)} className="input" style={{ cursor: "pointer" }}>
                  {CATS.map(c => <option key={c} value={c} style={{ background: "var(--s1)" }}>{c}</option>)}
                </select>
              </div>
              <Inp label="Description" field="description" ph="One-line description" />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Inp label="Year Founded" field="founded" ph="2024" half />
                <Inp label="Team Size" field="teamSize" ph="12" type="number" half />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Inp label="Last Round" field="lastRound" ph="Seed, Series A…" half />
                <Inp label="Total Funding ($)" field="fundingTotal" ph="5000000" type="number" half />
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="label-xs" style={{ color: "var(--g)" }}>Verify Data Sources</span>
              <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, margin: "0 0 6px" }}>Verified products rank higher and earn trust. All connections are read-only.</p>
              <Toggle label="Stripe" icon="💳" field="connectStripe" />
              <Toggle label="PostHog / Google Analytics" icon="📊" field="connectAnalytics" />
              <Toggle label="GitHub" icon="🐙" field="connectGithub" />
              <Toggle label="Discord" icon="💬" field="connectDiscord" />
              <Toggle label="BetterStack / UptimeRobot" icon="🟢" field="connectUptime" />
              <div style={{ padding: "10px 14px", borderRadius: 7, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, color: "var(--t2)", lineHeight: 1.5 }}>
                You can connect sources later from your dashboard. Self-reported metrics are still accepted.
              </div>
              <span className="label-xs" style={{ marginTop: 4 }}>Or Self-Report</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Inp label="Monthly Revenue ($)" field="mrr" ph="50000" type="number" half />
                <Inp label="Monthly Active Users" field="mau" ph="10000" type="number" half />
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span className="label-xs" style={{ color: "var(--g)" }}>Contact & Review</span>
              <Inp label="Your Name" field="contactName" ph="Full name" />
              <Inp label="Email" field="contactEmail" ph="you@company.com" type="email" />
              <Inp label="Role" field="contactRole" ph="Founder, CTO, Head of Growth" />
              <div className="card-inner" style={{ padding: "14px 16px" }}>
                <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Summary</span>
                {[
                  ["Product", f.name || "—"],
                  ["Category", f.category],
                  ["Verified", [f.connectStripe && "Stripe", f.connectAnalytics && "Analytics", f.connectGithub && "GitHub", f.connectDiscord && "Discord", f.connectUptime && "Uptime"].filter(Boolean).join(", ") || "None"],
                  ["Self-Reported", [f.mrr && `$${Number(f.mrr).toLocaleString()} MRR`, f.mau && `${Number(f.mau).toLocaleString()} MAU`].filter(Boolean).join(", ") || "—"],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? "1px solid var(--b1)" : "none" }}>
                    <span style={{ fontSize: 11, color: "var(--t2)" }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: k === "Verified" ? "var(--g)" : "var(--t1)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            {step > 1 ? <button onClick={() => setStep(step - 1)} className="btn-ghost">Back</button> : <div />}
            {step < 3 ? <button onClick={() => setStep(step + 1)} className="btn-primary" style={{ opacity: step === 1 && !f.name ? .4 : 1 }}>Continue</button>
              : <button onClick={() => setDone(true)} className="btn-primary" style={{ opacity: !f.contactEmail ? .4 : 1 }}>Submit Application</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function AgentScreener() {
  const auth = useAuth();
  const user = auth?.user;
  const supabase = auth?.supabase;
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("name");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [apply, setApply] = useState(false);
  const [wl, setWl] = useState(new Set());
  const [wlFilter, setWlFilter] = useState(false);
  const [view, setView] = useState("table");
  const [authModal, setAuthModal] = useState(null); // "signin" | "signup" | null
  const [alertProduct, setAlertProduct] = useState(null);
  const [pipelineData, setPipelineData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [, tick] = useState(0);

  // Poll pipeline data every 60s
  useEffect(() => {
    const fetchData = () => {
      fetch("/api/data")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.products) { setPipelineData(d.products); setLastUpdate(new Date()); } })
        .catch(() => {});
    };
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Supabase Realtime subscription for instant updates
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("pipeline-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pipeline_data" }, (payload) => {
        const row = payload.new;
        if (!row?.product_id || !row?.source) return;
        setPipelineData(prev => ({
          ...prev,
          [row.product_id]: {
            ...(prev[row.product_id] || {}),
            [row.source]: { ...row.data, _fetched: row.fetched_at },
          },
        }));
        setLastUpdate(new Date());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Tick every 10s for "Xs ago" display
  useEffect(() => {
    const t = setInterval(() => tick(c => c + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Load watchlist from Supabase when user logs in
  useEffect(() => {
    if (!user || !supabase) return;
    supabase.from("watchlist").select("product_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setWl(new Set(data.map(d => d.product_id)));
    });
  }, [user, supabase]);

  const toggleWl = useCallback(async (e, id) => {
    e.stopPropagation();
    if (!user) { setAuthModal("signin"); return; }
    setWl(prev => {
      const next = new Set(prev);
      const adding = !next.has(id);
      adding ? next.add(id) : next.delete(id);
      // Persist to Supabase
      if (supabase) {
        if (adding) {
          supabase.from("watchlist").insert({ user_id: user.id, product_id: id });
        } else {
          supabase.from("watchlist").delete().eq("user_id", user.id).eq("product_id", id);
        }
      }
      return next;
    });
  }, [user, supabase]);

  const openAlert = useCallback((e, product) => {
    e.stopPropagation();
    if (!user) { setAuthModal("signin"); return; }
    setAlertProduct(product);
  }, [user]);

  // Enrich products with pipeline data (overlays on top of seed data)
  const enriched = useMemo(() => {
    return PRODUCTS.map(p => {
      const pd = pipelineData[p.id];
      if (!pd) return p;
      const gh = pd.github;
      const fund = pd.funding;
      const traffic = pd.traffic;
      const social = pd.social;
      const uptime = pd.uptime;
      const jobs = pd.jobs;
      const trafficVisits = traffic?.estimate?.estimated_monthly_visits ?? null;
      const fundTotal = fund?.total ?? p.fundingTotal;

      // Pipeline MRR: only override if no sourced revenue data exists
      let mrr = p.mrr;
      let revConf = p.revenueConfidence;
      let revSrcNames = p.revenueSourceNames;
      if (!p.revenueSources && trafficVisits) {
        mrr = computeEstimatedMRR({ fundingTotal: fundTotal, trafficVisits, founded: p.founded, category: p.category });
        revConf = "low";
        revSrcNames = "Traffic Est.";
      }

      const estMAU = trafficVisits ?? social?.followers ?? p.mau;

      return {
        ...p,
        githubStars: gh?.stars ?? p.githubStars,
        starVelocity: gh?.star_velocity_per_week ?? p.starVelocity,
        fundingTotal: fundTotal,
        lastRound: fund?.last_round ?? p.lastRound,
        valuation: fund?.valuation ?? p.valuation,
        investors: fund?.investors ?? p.investors,
        uptime: uptime?.uptime_pct ?? p.uptime,
        latencyMs: uptime?.latency_ms ?? p.latencyMs,
        estimatedTraffic: trafficVisits,
        trafficRank: traffic?.rank?.rank ?? null,
        xFollowers: social?.followers ?? null,
        teamSize: jobs?.total_openings ? `${jobs.total_openings} open roles` : p.teamSize,
        mrr,
        mau: estMAU,
        revenueConfidence: revConf,
        revenueSourceNames: revSrcNames,
        verifications: {
          ...p.verifications,
          community: gh ? "github" : p.verifications.community,
          uptime: uptime ? "betterstack" : p.verifications.uptime,
          team: fund ? "crunchbase" : p.verifications.team,
          revenue: revConf || p.verifications.revenue,
          usage: trafficVisits ? "traffic_estimate" : social?.followers ? "social_estimate" : p.verifications.usage,
        },
      };
    });
  }, [pipelineData]);

  const filtered = useMemo(() => {
    return enriched
      .filter(p => !wlFilter || wl.has(p.id))
      .filter(p => cat === "All" || p.category === cat)
      .filter(p => { const s = q.toLowerCase(); return !s || p.name.toLowerCase().includes(s) || (p.ticker && p.ticker.toLowerCase().includes(s)) || p.category.toLowerCase().includes(s); })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        return (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity);
      });
  }, [enriched, cat, sort, q, wlFilter, wl]);

  // Top movers: products with most GitHub stars (or newest if no pipeline data)
  const movers = useMemo(() => {
    const withStars = enriched.filter(p => p.githubStars > 0);
    if (withStars.length >= 6) {
      return [...withStars].sort((a, b) => (b.starVelocity || 0) - (a.starVelocity || 0)).slice(0, 6);
    }
    return [...enriched].filter(p => p.founded).sort((a, b) => (parseInt(b.founded) || 0) - (parseInt(a.founded) || 0)).slice(0, 6);
  }, [enriched]);

  const hasPipelineData = Object.keys(pipelineData).length > 0;

  const agg = useMemo(() => ({
    n: enriched.length,
    gh: enriched.filter(p => p.github).length,
    cats: ALL_CATS.length - 1,
    tokens: enriched.filter(p => p.token).length,
    withSite: enriched.filter(p => p.website).length,
    totalStars: enriched.reduce((s, p) => s + (p.githubStars || 0), 0),
    funded: enriched.filter(p => p.fundingTotal > 0).length,
  }), [enriched]);

  return (
    <div id="app" style={{ "--bg": "#F4F5F7", "--s1": "#FFFFFF", "--s2": "rgba(0,0,0,.02)", "--sh": "rgba(0,0,0,.04)", "--b1": "rgba(0,0,0,.06)", "--b2": "rgba(0,0,0,.1)", "--t1": "#0F1218", "--t2": "rgba(15,18,24,.6)", "--t3": "rgba(15,18,24,.35)", "--t4": "rgba(15,18,24,.12)", "--g": "#2563EB", "--gg": "rgba(37,99,235,.25)", "--gd": "rgba(37,99,235,.06)", "--r": "#DC2626", "--y": "#D97706", "--up": "#16A34A", "--dn": "#DC2626", "--m": "'JetBrains Mono', 'SF Mono', 'Consolas', monospace", "--f": "'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0 } to { opacity: 1 } }
        @keyframes su { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.1); border-radius: 2px; }
        input::placeholder { color: rgba(15,18,24,.25); }
        select option { background: #FFFFFF; }
        .label-xs { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); }
        .chip { font-size: 9px; padding: 2px 7px; border-radius: 3px; background: rgba(0,0,0,.03); color: var(--t2); font-weight: 600; letter-spacing: .03em; border: 1px solid var(--b1); }
        .chip-g { background: var(--gd); color: var(--g); border-color: rgba(37,99,235,.15); }
        .card-inner { padding: 14px 16px; border-radius: 8px; background: var(--s2); border: 1px solid var(--b1); }
        .input { width: 100%; padding: 9px 11px; border-radius: 7px; background: rgba(0,0,0,.025); border: 1px solid var(--b1); color: var(--t1); font-size: 12px; font-family: var(--f); outline: none; transition: border-color .15s; }
        .input:focus { border-color: rgba(37,99,235,.4); }
        .btn-primary { padding: 9px 24px; border-radius: 7px; border: none; background: var(--g); color: var(--bg); font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--f); letter-spacing: .01em; }
        .btn-primary:hover { opacity: .88; }
        .btn-ghost { padding: 9px 18px; border-radius: 7px; border: 1px solid var(--b1); background: transparent; color: var(--t2); font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--f); }
        .btn-close { background: rgba(0,0,0,.03); border: 1px solid var(--b1); color: var(--t3); width: 30px; height: 30px; border-radius: 7px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
        .btn-close:hover { background: rgba(0,0,0,.06); }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.3); backdrop-filter: blur(16px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fi .15s ease; }
        .cat-btn { padding: 5px 11px; border-radius: 5px; border: 1px solid var(--b1); background: transparent; color: var(--t3); font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--f); transition: all .1s; }
        .cat-btn.on { border-color: rgba(37,99,235,.25); background: var(--gd); color: var(--g); }
        .row { display: grid; grid-template-columns: 32px 2fr .85fr .85fr .75fr .7fr .55fr 90px 28px; padding: 11px 14px; border-radius: 7px; cursor: pointer; align-items: center; transition: all .1s; border: 1px solid transparent; }
        .row:hover { background: var(--sh); border-color: var(--b2); }
        .row-h { display: grid; grid-template-columns: 32px 2fr .85fr .85fr .75fr .7fr .55fr 90px 28px; padding: 7px 14px; }
        .vb { font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; white-space: nowrap; }
        .mover { flex: 0 0 auto; min-width: 185px; padding: 13px 16px; border-radius: 10px; background: var(--s1); border: 1px solid var(--b1); cursor: pointer; transition: all .12s; }
        .mover:hover { background: var(--sh); border-color: var(--b2); }
        .wl-star { background: none; border: none; cursor: pointer; font-size: 13px; padding: 0; transition: all .12s; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", position: "sticky", top: 0, background: "rgba(244,245,247,.92)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--m)" }}>AS</span>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)", animation: "sl 3s ease-in-out infinite" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.01em" }}>
            AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: "var(--g)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite", boxShadow: "0 0 6px var(--gg)" }} />LIVE
            {lastUpdate && <span style={{ fontSize: 9, color: "var(--t3)", fontWeight: 500 }}>{Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>}
          </div>
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          <button onClick={() => setApply(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(37,99,235,.25)", background: "var(--gd)", color: "var(--g)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)" }}>+ Submit Product</button>
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          {user ? (
            <UserMenu />
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setAuthModal("signin")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--b1)", background: "transparent", color: "var(--t1)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--f)", transition: "all .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--s2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >Sign In</button>
              <button onClick={() => setAuthModal("signup")} className="btn-primary" style={{ padding: "6px 14px", fontSize: 11 }}>Sign Up</button>
            </div>
          )}
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="input" style={{ width: 180, paddingLeft: 27, fontSize: 11, padding: "6px 10px 6px 27px" }} />
          </div>
        </div>
      </header>

      {/* STATS BAR */}
      <div style={{ padding: "10px 24px", display: "flex", gap: 24, borderBottom: "1px solid var(--b1)", background: "rgba(0,0,0,.008)" }}>
        {[["Products", agg.n], ["Categories", agg.cats], ["Open Source", agg.gh], ...(hasPipelineData ? [["Total Stars", fmtU(agg.totalStars)], ["Funded", agg.funded]] : [["Crypto-AI", agg.tokens], ["With Site", agg.withSite]])].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)" }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "18px 24px" }}>

        {/* TOP MOVERS */}
        <div style={{ marginBottom: 20 }}>
          <span className="label-xs" style={{ marginBottom: 8, display: "block" }}>{hasPipelineData ? "Trending (Star Velocity)" : "Newest Products"}</span>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {movers.map((p, i) => (
              <div key={p.id} className="mover" onClick={() => setSel(p)} style={{ animation: `su .25s ease ${i * .04}s both` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ProductLogo product={p} size={24} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                      {p.ticker ? <div style={{ fontSize: 9, color: "var(--y)", fontFamily: "var(--m)", fontWeight: 700 }}>${p.ticker}</div> : <div style={{ fontSize: 9, color: "var(--t4)" }}>{p.category}</div>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--g)" }}>{p.githubStars ? fmtU(p.githubStars) + " ★" : p.founded || "—"}</span>
                </div>
                <Spark data={p.spark} up={(p.mrrChange || 0) >= 0} w={155} h={24} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "var(--t3)" }}>
                  <span>{p.mrr ? <><ConfidenceDot level={p.revenueConfidence} />{fmt$(p.mrr)} /mo</> : "—"}</span>
                  <span>{p.mau ? fmtU(p.mau) + " MAU" : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "center", overflowX: "auto", flexShrink: 1, maxWidth: "70%", paddingBottom: 2 }}>
            {ALL_CATS.map(c => <button key={c} className={`cat-btn${cat === c ? " on" : ""}`} onClick={() => setCat(c)} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{c}</button>)}
            <div style={{ width: 1, height: 18, background: "var(--b1)", margin: "0 4px" }} />
            <button className={`cat-btn${wlFilter ? " on" : ""}`} onClick={() => setWlFilter(!wlFilter)} style={wlFilter ? { borderColor: "rgba(217,119,6,.25)", background: "rgba(217,119,6,.06)", color: "var(--y)" } : {}}>
              ★ Watchlist{wl.size > 0 ? ` (${wl.size})` : ""}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width: "auto", fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 1, background: "rgba(0,0,0,.03)", borderRadius: 5, padding: 2 }}>
              {["table", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "3px 7px", borderRadius: 3, border: "none", background: view === v ? "rgba(0,0,0,.07)" : "transparent", color: view === v ? "var(--t1)" : "var(--t3)", fontSize: 10, cursor: "pointer" }}>{v === "table" ? "☰" : "⊞"}</button>)}
            </div>
          </div>
        </div>

        {/* TABLE */}
        {view === "table" && <>
          <div className="row-h" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t3)" }}>
            <span>#</span><span>Product</span><span style={{ textAlign: "right" }}>Revenue /mo</span><span style={{ textAlign: "right" }}>MAU</span><span style={{ textAlign: "right" }}>GitHub</span><span style={{ textAlign: "right" }}>Links</span><span style={{ textAlign: "center" }}>Sources</span><span style={{ textAlign: "right" }}>30d</span><span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map((p, i) => (
              <div key={p.id} className="row" onClick={() => setSel(p)} style={{ animation: `su .2s ease ${i * .02}s both`, background: i % 2 === 0 ? "rgba(0,0,0,.01)" : "transparent" }}>
                <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", fontWeight: 700 }}>{i + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <ProductLogo product={p} size={32} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{p.name}</span>
                      {p.ticker && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(217,119,6,.06)", color: "var(--y)", fontWeight: 700, fontFamily: "var(--m)" }}>${p.ticker}</span>}
                      {p.hot && <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 2, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 800, letterSpacing: ".06em" }}>HOT</span>}
                    </div>
                    <span style={{ fontSize: 9, color: "var(--t4)" }}>{p.category}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                    {p.revenueConfidence && <ConfidenceDot level={p.revenueConfidence} />}
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: p.mrr ? "var(--t1)" : "var(--t3)" }}>{fmt$(p.mrr)}</span>
                  </div>
                  <div style={{ fontSize: 9, color: p.revenueConfidence === "high" ? "var(--up)" : p.revenueConfidence === "medium" ? "var(--y)" : "var(--t4)" }}>{p.revenueSourceNames || ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: p.mau ? "var(--t1)" : "var(--t3)" }}>{fmtU(p.mau)}</div>
                  <div style={{ fontSize: 9, color: p.mau ? "var(--up)" : "var(--t4)" }}>{p.mau ? (SRC[p.verifications.usage] || "est.") : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)" }}>{p.githubStars ? fmtU(p.githubStars) + " ★" : p.github ? "✓" : "—"}</div>
                  <div style={{ fontSize: 9, color: p.github ? "var(--up)" : "var(--t4)" }}>{p.starVelocity ? `+${p.starVelocity}/wk` : p.github ? `${p.github.o}/${p.github.r}`.slice(0, 18) : "closed"}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                  {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "var(--g)", textDecoration: "none", padding: "2px 5px", borderRadius: 3, background: "var(--gd)" }}>↗</a>}
                  {p.twitter && <a href={p.twitter} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "var(--t2)", textDecoration: "none", padding: "2px 5px", borderRadius: 3, background: "var(--s2)" }}>𝕏</a>}
                  {p.token && <span style={{ fontSize: 8, padding: "2px 5px", borderRadius: 3, background: "rgba(217,119,6,.06)", color: "var(--y)", fontWeight: 700 }}>${p.token.symbol}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}><VMeter v={p.verifications} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}><Spark data={p.spark} up={true} w={90} h={24} /></div>
                <button className="wl-star" onClick={e => toggleWl(e, p.id)} style={{ color: wl.has(p.id) ? "var(--y)" : "var(--t3)", filter: wl.has(p.id) ? "drop-shadow(0 0 3px rgba(217,119,6,.3))" : "none" }}>{wl.has(p.id) ? "★" : "☆"}</button>
              </div>
            ))}
          </div>
        </>}

        {/* GRID */}
        {view === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 8 }}>
            {filtered.map((p, i) => (
              <div key={p.id} onClick={() => setSel(p)} style={{ padding: "16px 18px", borderRadius: 10, background: "var(--s1)", border: "1px solid var(--b1)", cursor: "pointer", transition: "all .12s", animation: `su .2s ease ${i * .025}s both` }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--sh)"; e.currentTarget.style.borderColor = "var(--b2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--s1)"; e.currentTarget.style.borderColor = "var(--b1)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <ProductLogo product={p} size={34} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                        {p.ticker && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(217,119,6,.06)", color: "var(--y)", fontWeight: 700, fontFamily: "var(--m)" }}>${p.ticker}</span>}
                        {p.hot && <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 2, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 800 }}>HOT</span>}
                      </div>
                      <span style={{ fontSize: 9, color: "var(--t3)" }}>{p.category}</span>
                    </div>
                  </div>
                  <button className="wl-star" onClick={e => toggleWl(e, p.id)} style={{ color: wl.has(p.id) ? "var(--y)" : "var(--t3)" }}>{wl.has(p.id) ? "★" : "☆"}</button>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 12, padding: "10px 12px", borderRadius: 7, background: "var(--s2)", border: "1px solid var(--b1)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                      {p.revenueConfidence && <ConfidenceDot level={p.revenueConfidence} />}
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)" }}>{p.revenueConfidence === "low" ? "Est. Rev" : "Revenue"}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", color: p.mrr ? "var(--t1)" : "var(--t3)" }}>{fmt$(p.mrr)}</div>
                    {p.revenueSourceNames && <div style={{ fontSize: 7, color: p.revenueConfidence === "high" ? "var(--up)" : "var(--t4)", marginTop: 2 }}>{p.revenueSourceNames}</div>}
                  </div>
                  <div style={{ width: 1, background: "var(--b1)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>MAU</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", color: p.mau ? "var(--t1)" : "var(--t3)" }}>{fmtU(p.mau)}</div>
                  </div>
                  <div style={{ width: 1, background: "var(--b1)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 3 }}>Funding</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", color: p.fundingTotal ? "var(--t1)" : "var(--t3)" }}>{fmt$(p.fundingTotal)}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}><Spark data={p.spark} up={true} w={230} h={28} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: "var(--g)", textDecoration: "none", padding: "2px 6px", borderRadius: 3, background: "var(--gd)" }}>↗ Site</a>}
                    {p.github && <span style={{ fontSize: 9, color: "var(--up)", padding: "2px 6px", borderRadius: 3, background: "rgba(22,163,74,.06)" }}>GitHub</span>}
                    {p.token && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "rgba(217,119,6,.06)", color: "var(--y)", fontWeight: 700 }}>${p.token.symbol}</span>}
                  </div>
                  <VMeter v={p.verifications} />
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: 70, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: .3 }}>⊘</div>
            <div style={{ fontSize: 13, color: "var(--t2)" }}>No products found</div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 28, padding: "16px 0", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 10, color: "var(--t3)" }}>{filtered.length} of {PRODUCTS.length} products</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9, color: "var(--t3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--g)", boxShadow: "0 0 3px var(--gg)" }} />Verified</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--t4)" }} />Self-Reported</span>
            </div>
          </div>
          <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)" }}>AGENTSCREENER v0.1</span>
        </div>
      </div>

      {sel && <DetailPanel p={enriched.find(e => e.id === sel.id) || sel} onClose={() => setSel(null)} onAlert={openAlert} />}
      {apply && <ApplyModal onClose={() => setApply(false)} />}
      {authModal && <AuthModal onClose={() => setAuthModal(null)} initialMode={authModal} />}
      {alertProduct && <AlertModal product={alertProduct} onClose={() => setAlertProduct(null)} />}
    </div>
  );
}
