"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

// ============================================================
// DATA LAYER
// ============================================================
const PRODUCTS = [
  {
    id: "cursor", name: "Cursor", ticker: "CURSOR", category: "Dev Tools", logo: "⌨️",
    description: "AI-first code editor built on VS Code",
    mrr: 4200000, mrrChange: 18.4, mrrPrev: [2100000,2400000,2700000,2950000,3200000,3550000,4200000],
    mau: 890000, mauChange: 12.1, dau: 320000,
    githubStars: 24500, starVelocity: 340, forks: 3200, contributors: 180,
    teamSize: 85, teamGrowth: 12,
    fundingTotal: 460000000, lastRound: "Series C", valuation: 2500000000, investors: ["a16z", "Thrive Capital"],
    uptime: 99.97, latencyP50: 120, errorRate: 0.03,
    sentimentScore: 92, nps: 78,
    verifications: { revenue: "stripe", usage: "posthog", community: "github", uptime: "betterstack", team: "self" },
    sparkline: [62,58,71,68,75,82,79,88,91,95,89,102,98,110,115,108,120,125,131,128,140,145,138,152],
    trending: true, hot: true, age: "2y 3m", website: "cursor.com", founded: "2022",
  },
  {
    id: "bolt", name: "Bolt.new", ticker: "BOLT", category: "Dev Tools", logo: "⚡",
    description: "Full-stack web apps from a prompt",
    mrr: 2800000, mrrChange: 34.2, mrrPrev: [400000,620000,880000,1200000,1600000,2100000,2800000],
    mau: 520000, mauChange: 28.5, dau: 145000,
    githubStars: 12800, starVelocity: 580, forks: 1800, contributors: 95,
    teamSize: 42, teamGrowth: 28,
    fundingTotal: 100000000, lastRound: "Series B", valuation: 750000000, investors: ["Spark Capital"],
    uptime: 99.82, latencyP50: 250, errorRate: 0.18,
    sentimentScore: 88, nps: 72,
    verifications: { revenue: "stripe", usage: "analytics", community: "github", uptime: "self", team: "self" },
    sparkline: [20,25,28,35,42,48,55,62,58,70,78,85,92,88,100,112,120,115,130,142,150,158,165,172],
    trending: true, hot: true, age: "1y 1m", website: "bolt.new", founded: "2024",
  },
  {
    id: "perplexity", name: "Perplexity", ticker: "PPLX", category: "Search", logo: "🔍",
    description: "AI-powered answer engine",
    mrr: 8500000, mrrChange: 8.7, mrrPrev: [4800000,5200000,5800000,6400000,7000000,7800000,8500000],
    mau: 3200000, mauChange: 5.2, dau: 980000,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: 120, teamGrowth: 8,
    fundingTotal: 500000000, lastRound: "Series C", valuation: 9000000000, investors: ["IVP", "NEA", "Bezos Expeditions"],
    uptime: 99.95, latencyP50: 180, errorRate: 0.05,
    sentimentScore: 85, nps: 68,
    verifications: { revenue: "stripe", usage: "cloudflare", community: "discord", uptime: "betterstack", team: "linkedin" },
    sparkline: [80,82,85,88,90,92,88,95,98,100,102,105,98,108,110,112,115,118,120,115,122,125,128,130],
    trending: false, hot: false, age: "2y 8m", website: "perplexity.ai", founded: "2022",
  },
  {
    id: "devin", name: "Devin", ticker: "DEVIN", category: "AI Agent", logo: "🤖",
    description: "Autonomous AI software engineer",
    mrr: 1200000, mrrChange: -4.2, mrrPrev: [1400000,1380000,1350000,1320000,1280000,1250000,1200000],
    mau: 45000, mauChange: -8.1, dau: 8500,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: 35, teamGrowth: -5,
    fundingTotal: 175000000, lastRound: "Series A", valuation: 500000000, investors: ["Founders Fund"],
    uptime: 98.5, latencyP50: 3200, errorRate: 1.5,
    sentimentScore: 52, nps: 22,
    verifications: { revenue: "self", usage: "self", community: "discord", uptime: "self", team: "self" },
    sparkline: [100,105,110,108,102,98,95,92,88,85,82,80,78,75,72,70,68,72,70,65,68,65,62,60],
    trending: false, hot: false, age: "1y 6m", website: "devin.ai", founded: "2023",
  },
  {
    id: "lovable", name: "Lovable", ticker: "LOVE", category: "Dev Tools", logo: "💜",
    description: "AI full-stack engineer for web apps",
    mrr: 1800000, mrrChange: 42.1, mrrPrev: [180000,320000,520000,780000,1050000,1400000,1800000],
    mau: 310000, mauChange: 38.7, dau: 88000,
    githubStars: 8200, starVelocity: 420, forks: 1100, contributors: 62,
    teamSize: 28, teamGrowth: 35,
    fundingTotal: 25000000, lastRound: "Series A", valuation: 200000000, investors: ["Spark Capital"],
    uptime: 99.88, latencyP50: 200, errorRate: 0.12,
    sentimentScore: 90, nps: 76,
    verifications: { revenue: "stripe", usage: "posthog", community: "github", uptime: "betterstack", team: "self" },
    sparkline: [10,12,15,18,22,28,35,42,50,58,68,75,82,90,95,102,110,118,125,135,142,155,165,178],
    trending: true, hot: true, age: "10m", website: "lovable.dev", founded: "2024",
  },
  {
    id: "windsurf", name: "Windsurf", ticker: "WIND", category: "Dev Tools", logo: "🏄",
    description: "AI-powered IDE by Codeium",
    mrr: 950000, mrrChange: 22.8, mrrPrev: [320000,420000,510000,600000,700000,820000,950000],
    mau: 180000, mauChange: 15.3, dau: 52000,
    githubStars: 5400, starVelocity: 210, forks: 680, contributors: 45,
    teamSize: 55, teamGrowth: 10,
    fundingTotal: 60000000, lastRound: "Series A", valuation: 300000000, investors: ["Greenoaks Capital"],
    uptime: 99.91, latencyP50: 140, errorRate: 0.09,
    sentimentScore: 78, nps: 58,
    verifications: { revenue: "self", usage: "analytics", community: "github", uptime: "betterstack", team: "linkedin" },
    sparkline: [30,32,35,38,42,45,48,52,55,58,62,60,65,68,72,75,78,82,85,80,88,92,95,98],
    trending: false, hot: false, age: "1y 2m", website: "windsurf.com", founded: "2023",
  },
  {
    id: "elevenlabs", name: "ElevenLabs", ticker: "11L", category: "Audio AI", logo: "🎙️",
    description: "AI voice synthesis and cloning platform",
    mrr: 6200000, mrrChange: 15.3, mrrPrev: [3200000,3600000,4100000,4600000,5200000,5700000,6200000],
    mau: 1800000, mauChange: 9.8, dau: 420000,
    githubStars: 3200, starVelocity: 85, forks: 420, contributors: 28,
    teamSize: 95, teamGrowth: 15,
    fundingTotal: 180000000, lastRound: "Series C", valuation: 3300000000, investors: ["a16z", "Nat Friedman"],
    uptime: 99.93, latencyP50: 300, errorRate: 0.07,
    sentimentScore: 87, nps: 70,
    verifications: { revenue: "stripe", usage: "cloudflare", community: "discord", uptime: "betterstack", team: "linkedin" },
    sparkline: [50,52,55,58,62,65,68,72,75,78,80,82,85,88,90,92,95,98,100,102,105,108,110,115],
    trending: false, hot: false, age: "2y 5m", website: "elevenlabs.io", founded: "2022",
  },
  {
    id: "replitAgent", name: "Replit Agent", ticker: "RPLIT", category: "AI Agent", logo: "🔄",
    description: "Build apps with AI assistance in Replit",
    mrr: 3100000, mrrChange: 6.2, mrrPrev: [2400000,2500000,2600000,2700000,2800000,2950000,3100000],
    mau: 420000, mauChange: 2.1, dau: 95000,
    githubStars: 1800, starVelocity: 45, forks: 320, contributors: 22,
    teamSize: 180, teamGrowth: 3,
    fundingTotal: 200000000, lastRound: "Series C", valuation: 1200000000, investors: ["a16z"],
    uptime: 99.75, latencyP50: 280, errorRate: 0.25,
    sentimentScore: 71, nps: 45,
    verifications: { revenue: "self", usage: "analytics", community: "github", uptime: "self", team: "linkedin" },
    sparkline: [70,72,74,75,76,78,75,77,79,80,78,80,82,81,83,82,84,83,85,84,86,85,87,88],
    trending: false, hot: false, age: "3y 1m", website: "replit.com", founded: "2016",
  },
  {
    id: "midjourney", name: "Midjourney", ticker: "MJ", category: "Image Gen", logo: "🎨",
    description: "AI image generation via Discord and web",
    mrr: 12000000, mrrChange: 2.1, mrrPrev: [10500000,10800000,11000000,11200000,11500000,11800000,12000000],
    mau: 5200000, mauChange: -1.3, dau: 1200000,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: 55, teamGrowth: 5,
    fundingTotal: 0, lastRound: "Bootstrapped", valuation: null, investors: [],
    uptime: 99.6, latencyP50: 8000, errorRate: 0.4,
    sentimentScore: 76, nps: 55,
    verifications: { revenue: "self", usage: "self", community: "discord", uptime: "self", team: "self" },
    sparkline: [120,122,125,128,130,128,125,122,120,118,122,125,128,125,122,120,118,120,122,124,120,122,118,120],
    trending: false, hot: false, age: "3y 2m", website: "midjourney.com", founded: "2021",
  },
  {
    id: "v0", name: "v0 by Vercel", ticker: "V0", category: "Dev Tools", logo: "▲",
    description: "AI-powered UI generation by Vercel",
    mrr: 800000, mrrChange: 55.3, mrrPrev: [60000,120000,210000,320000,450000,600000,800000],
    mau: 280000, mauChange: 44.2, dau: 72000,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: null, teamGrowth: null,
    fundingTotal: null, lastRound: "Vercel Product", valuation: null, investors: [],
    uptime: 99.92, latencyP50: 160, errorRate: 0.08,
    sentimentScore: 91, nps: 80,
    verifications: { revenue: "self", usage: "cloudflare", community: "github", uptime: "betterstack", team: "self" },
    sparkline: [5,8,12,18,25,32,40,48,55,65,72,80,88,95,105,112,120,130,138,148,155,165,175,185],
    trending: true, hot: true, age: "1y 4m", website: "v0.dev", founded: "2023",
  },
  {
    id: "claude-code", name: "Claude Code", ticker: "CLCD", category: "Dev Tools", logo: "🧠",
    description: "Anthropic's agentic coding tool in the terminal",
    mrr: null, mrrChange: null, mrrPrev: [],
    mau: 150000, mauChange: 62.5, dau: 48000,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: null, teamGrowth: null,
    fundingTotal: null, lastRound: "Anthropic Product", valuation: null, investors: [],
    uptime: 99.9, latencyP50: 200, errorRate: 0.1,
    sentimentScore: 94, nps: 85,
    verifications: { revenue: "self", usage: "self", community: "github", uptime: "self", team: "self" },
    sparkline: [8,12,18,28,35,45,58,68,78,85,92,98,105,115,125,132,140,148,155,162,170,178,185,195],
    trending: true, hot: true, age: "8m", website: "claude.ai", founded: "2024",
  },
  {
    id: "heygen", name: "HeyGen", ticker: "HGEN", category: "Video AI", logo: "🎬",
    description: "AI video generation and avatar platform",
    mrr: 5800000, mrrChange: 21.5, mrrPrev: [2800000,3200000,3700000,4200000,4700000,5200000,5800000],
    mau: 950000, mauChange: 18.2, dau: 180000,
    githubStars: null, starVelocity: null, forks: null, contributors: null,
    teamSize: 150, teamGrowth: 20,
    fundingTotal: 60000000, lastRound: "Series A", valuation: 500000000, investors: ["Benchmark"],
    uptime: 99.85, latencyP50: 5000, errorRate: 0.15,
    sentimentScore: 82, nps: 65,
    verifications: { revenue: "stripe", usage: "analytics", community: "discord", uptime: "betterstack", team: "linkedin" },
    sparkline: [35,40,45,50,55,60,62,68,72,75,80,85,88,92,95,100,105,108,112,118,122,128,132,138],
    trending: true, hot: false, age: "2y 10m", website: "heygen.com", founded: "2022",
  },
];

const ALL_CATEGORIES = ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];

const SORT_OPTIONS = [
  { key: "mrrChange", label: "MRR Growth %", desc: true },
  { key: "mrr", label: "Revenue", desc: true },
  { key: "mau", label: "Monthly Users", desc: true },
  { key: "mauChange", label: "User Growth %", desc: true },
  { key: "sentimentScore", label: "Sentiment", desc: true },
  { key: "fundingTotal", label: "Funding", desc: true },
  { key: "valuation", label: "Valuation", desc: true },
];

const TIME_FILTERS = ["24h", "7d", "30d", "90d"];

// ============================================================
// UTILITIES
// ============================================================
function fmt(n, prefix = "$") {
  if (n === null || n === undefined) return "—";
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(0)}K`;
  return `${prefix}${n}`;
}
function fmtUsers(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
}
function fmtPct(n) {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const VERIFIED_SOURCES = {
  stripe: "Stripe", posthog: "PostHog", analytics: "Analytics",
  cloudflare: "Cloudflare", github: "GitHub", discord: "Discord",
  betterstack: "BetterStack", linkedin: "LinkedIn", self: "Self-Reported",
};

function isVerified(source) { return source && source !== "self"; }

function getVerifiedCount(v) {
  return Object.values(v).filter(s => isVerified(s)).length;
}

function getCompositeScore(p) {
  let score = 0;
  if (p.mrrChange > 0) score += p.mrrChange * 2;
  if (p.mauChange > 0) score += p.mauChange * 1.5;
  if (p.sentimentScore) score += p.sentimentScore * 0.5;
  score += getVerifiedCount(p.verifications) * 8;
  return Math.round(score);
}

// ============================================================
// COMPONENTS
// ============================================================

function Sparkline({ data, positive, width = 120, height = 32 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const color = positive !== false ? "var(--accent)" : "var(--red)";
  const id = `sg-${Math.random().toString(36).substr(2, 6)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={parseFloat(points.split(" ").pop().split(",")[1])} r="2" fill={color} />
    </svg>
  );
}

function MRRChart({ data, width = 260, height = 80 }) {
  if (!data || data.length === 0) return <div style={{ color: "var(--muted)", fontSize: 12 }}>No revenue data</div>;
  const max = Math.max(...data);
  const barW = (width - (data.length - 1) * 4) / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((v, i) => {
        const barH = max > 0 ? (v / max) * (height - 8) : 0;
        const x = i * (barW + 4);
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} rx={3}
              fill={isLast ? "var(--accent)" : "rgba(255,255,255,0.06)"}
              opacity={isLast ? 1 : 0.8}
            />
            <text x={x + barW / 2} y={height - barH - 6} textAnchor="middle"
              style={{ fontSize: 8, fill: isLast ? "var(--accent)" : "var(--muted)", fontFamily: "var(--mono)" }}>
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Badge({ verified, source, size = "sm" }) {
  const s = size === "sm" ? { dot: 4, font: 9, gap: 3 } : { dot: 5, font: 10, gap: 4 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      fontSize: s.font, fontWeight: 600, letterSpacing: "0.05em",
      color: verified ? "var(--accent)" : "var(--muted)",
      textTransform: "uppercase",
    }}>
      <span style={{
        width: s.dot, height: s.dot, borderRadius: "50%", flexShrink: 0,
        background: verified ? "var(--accent)" : "rgba(255,255,255,0.15)",
        boxShadow: verified ? "0 0 6px var(--accent-glow)" : "none",
      }} />
      {VERIFIED_SOURCES[source] || source}
    </span>
  );
}

function SentimentBar({ score }) {
  if (!score) return <span style={{ color: "var(--muted)" }}>—</span>;
  const color = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--yellow)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 2, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", color }}>{score}</span>
    </div>
  );
}

function VerificationMeter({ verifications }) {
  const total = Object.keys(verifications).length;
  const verified = getVerifiedCount(verifications);
  const pct = Math.round((verified / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {Object.entries(verifications).map(([k, v]) => (
          <div key={k} style={{
            width: 12, height: 4, borderRadius: 1,
            background: isVerified(v) ? "var(--accent)" : "rgba(255,255,255,0.08)",
            boxShadow: isVerified(v) ? "0 0 4px var(--accent-glow)" : "none",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>{pct}%</span>
    </div>
  );
}

// ============================================================
// DETAIL PANEL
// ============================================================
function DetailPanel({ product: p, onClose }) {
  if (!p) return null;
  const [activeTab, setActiveTab] = useState("overview");

  const metricsGrid = [
    { label: "MRR", value: fmt(p.mrr), change: p.mrrChange, src: p.verifications.revenue },
    { label: "MAU", value: fmtUsers(p.mau), change: p.mauChange, src: p.verifications.usage },
    { label: "DAU", value: fmtUsers(p.dau), change: null, src: p.verifications.usage },
    { label: "GitHub Stars", value: p.githubStars ? fmtUsers(p.githubStars) : "—", change: null, src: p.verifications.community },
    { label: "Star Velocity", value: p.starVelocity ? `+${p.starVelocity}/wk` : "—", change: null, src: p.verifications.community },
    { label: "Uptime 30d", value: p.uptime ? `${p.uptime}%` : "—", change: null, src: p.verifications.uptime },
    { label: "P50 Latency", value: p.latencyP50 ? `${p.latencyP50}ms` : "—", change: null, src: p.verifications.uptime },
    { label: "Error Rate", value: p.errorRate !== null ? `${p.errorRate}%` : "—", change: null, src: p.verifications.uptime },
    { label: "Team Size", value: p.teamSize || "—", change: p.teamGrowth, src: p.verifications.team },
    { label: "NPS", value: p.nps || "—", change: null, src: "analytics" },
    { label: "Sentiment", value: p.sentimentScore || "—", change: null, src: "analytics" },
    { label: "Age", value: p.age, change: null, src: "self" },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      animation: "fadeIn 0.15s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", border: "1px solid var(--border-light)",
        borderRadius: 16, width: "92%", maxWidth: 720, maxHeight: "88vh", overflow: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.05)",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
            }}>{p.logo}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "var(--mono)", margin: 0 }}>{p.name}</h2>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>${p.ticker}</span>
                {p.hot && <span style={{
                  fontSize: 9, padding: "2px 7px", borderRadius: 4,
                  background: "rgba(255,71,87,0.1)", color: "var(--red)",
                  fontWeight: 700, letterSpacing: "0.08em",
                }}>HOT</span>}
              </div>
              <p style={{ fontSize: 12, color: "var(--dim)", margin: 0 }}>{p.description}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "var(--dim)", fontWeight: 600, letterSpacing: "0.04em" }}>{p.category}</span>
                {p.lastRound && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(0,229,155,0.06)", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.04em" }}>{p.lastRound}</span>}
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "var(--dim)", fontWeight: 600 }}>Est. {p.founded}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            color: "var(--muted)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px" }}>
          {/* Verification Overview */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 10, marginBottom: 20,
            background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Data Sources</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(p.verifications).map(([k, v]) => (
                  <Badge key={k} verified={isVerified(v)} source={v} size="md" />
                ))}
              </div>
            </div>
            <VerificationMeter verifications={p.verifications} />
          </div>

          {/* Revenue Chart */}
          {p.mrrPrev && p.mrrPrev.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                Revenue Trend (7 Months)
              </div>
              <div style={{
                padding: "20px", borderRadius: 12,
                background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
              }}>
                <MRRChart data={p.mrrPrev} />
              </div>
            </div>
          )}

          {/* Traction Sparkline */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
              Traction Index (30d)
            </div>
            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
            }}>
              <Sparkline data={p.sparkline} positive={p.mrrChange === null || p.mrrChange >= 0} width={620} height={48} />
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {metricsGrid.map((m, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{m.value}</span>
                  {m.change !== null && m.change !== undefined && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                      color: m.change >= 0 ? "var(--accent)" : "var(--red)",
                    }}>{fmtPct(m.change)}</span>
                  )}
                </div>
                <Badge verified={isVerified(m.src)} source={m.src} />
              </div>
            ))}
          </div>

          {/* Funding Block */}
          {(p.valuation || p.fundingTotal > 0) && (
            <div style={{
              marginTop: 12, padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Valuation</div>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{p.valuation ? fmt(p.valuation) : "—"}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Total Funding</div>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{p.fundingTotal ? fmt(p.fundingTotal) : "—"}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Investors</div>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{p.investors && p.investors.length > 0 ? p.investors.join(", ") : "—"}</span>
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
function ApplicationModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", ticker: "", website: "", category: "Dev Tools", description: "",
    logo: "", founded: "", teamSize: "", lastRound: "", fundingTotal: "",
    contactName: "", contactEmail: "", contactRole: "",
    connectStripe: false, connectAnalytics: false, connectGithub: false,
    connectDiscord: false, connectUptime: false,
    mrr: "", mau: "", githubStars: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const CATEGORIES_LIST = ["Dev Tools", "AI Agent", "Search", "Audio AI", "Image Gen", "Video AI", "Productivity", "Data/Analytics", "Infrastructure", "Other"];

  const InputField = ({ label, field, placeholder, type = "text", half = false }) => (
    <div style={{ flex: half ? "1 1 48%" : "1 1 100%" }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={form[field]} onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
          color: "var(--text)", fontSize: 13, fontFamily: "var(--sans)", outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "rgba(0,223,162,0.3)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );

  const ConnectOption = ({ label, icon, field, source }) => (
    <div
      onClick={() => update(field, !form[field])}
      style={{
        padding: "14px 16px", borderRadius: 10, cursor: "pointer",
        background: form[field] ? "var(--accent-dim)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${form[field] ? "rgba(0,223,162,0.25)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>Connect via OAuth • Read-only</div>
        </div>
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 5,
        border: `2px solid ${form[field] ? "var(--accent)" : "rgba(255,255,255,0.12)"}`,
        background: form[field] ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {form[field] && <span style={{ color: "#06080C", fontSize: 12, fontWeight: 800 }}>✓</span>}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        animation: "fadeIn 0.15s ease",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "var(--surface)", border: "1px solid var(--border-light)",
          borderRadius: 16, width: "90%", maxWidth: 480, padding: "48px 36px", textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)", marginBottom: 8 }}>Application Submitted</h2>
          <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.6, marginBottom: 24 }}>
            We'll review {form.name || "your product"} and get back to you within 48 hours. Products with verified data sources are fast-tracked for approval.
          </p>
          <button onClick={onClose} style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "#06080C", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "var(--sans)",
          }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      animation: "fadeIn 0.15s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", border: "1px solid var(--border-light)",
        borderRadius: 16, width: "92%", maxWidth: 580, maxHeight: "88vh", overflow: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "22px 28px 18px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)", margin: 0 }}>Submit Product</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            color: "var(--muted)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 2, background: "var(--border)" }}>
          <div style={{
            height: "100%", width: `${(step / 3) * 100}%`,
            background: "var(--accent)", transition: "width 0.3s ease",
            boxShadow: "0 0 8px var(--accent-glow)",
          }} />
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {/* STEP 1: Product Info */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>Product Information</div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <InputField label="Product Name" field="name" placeholder="e.g. Cursor" half />
                <InputField label="Ticker" field="ticker" placeholder="e.g. CRSR" half />
              </div>

              <InputField label="Website" field="website" placeholder="https://your-product.com" />

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => update("category", e.target.value)} style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  color: "var(--text)", fontSize: 13, fontFamily: "var(--sans)", outline: "none", cursor: "pointer",
                }}>
                  {CATEGORIES_LIST.map(c => <option key={c} value={c} style={{ background: "#0B0E14" }}>{c}</option>)}
                </select>
              </div>

              <InputField label="Short Description" field="description" placeholder="What does your product do? (one line)" />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <InputField label="Year Founded" field="founded" placeholder="2024" half />
                <InputField label="Team Size" field="teamSize" placeholder="e.g. 12" type="number" half />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <InputField label="Last Funding Round" field="lastRound" placeholder="e.g. Series A, Seed, Bootstrapped" half />
                <InputField label="Total Funding ($)" field="fundingTotal" placeholder="e.g. 5000000" type="number" half />
              </div>
            </div>
          )}

          {/* STEP 2: Connect Data Sources */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>Verify Your Data</div>
                <p style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 16 }}>
                  Connect your data sources to get verified badges on AgentScanner. Verified products rank higher and build more trust. All connections are read-only.
                </p>
              </div>

              <ConnectOption label="Stripe" icon="💳" field="connectStripe" source="stripe" />
              <ConnectOption label="PostHog / Google Analytics" icon="📊" field="connectAnalytics" source="analytics" />
              <ConnectOption label="GitHub" icon="🐙" field="connectGithub" source="github" />
              <ConnectOption label="Discord" icon="💬" field="connectDiscord" source="discord" />
              <ConnectOption label="BetterStack / UptimeRobot" icon="🟢" field="connectUptime" source="uptime" />

              <div style={{
                padding: "12px 16px", borderRadius: 8,
                background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
                fontSize: 11, color: "var(--dim)", lineHeight: 1.5,
              }}>
                💡 Don't have these yet? No problem — you can connect them later from your dashboard. Self-reported metrics are still accepted but shown with a different badge.
              </div>

              {/* Self-reported fallback */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Or Self-Report (unverified)</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <InputField label="Monthly Revenue ($)" field="mrr" placeholder="e.g. 50000" type="number" half />
                  <InputField label="Monthly Active Users" field="mau" placeholder="e.g. 10000" type="number" half />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Contact Info */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>Contact Information</div>
                <p style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginBottom: 8 }}>
                  We'll use this to verify your identity and send your listing approval.
                </p>
              </div>

              <InputField label="Your Name" field="contactName" placeholder="Full name" />
              <InputField label="Email" field="contactEmail" placeholder="you@company.com" type="email" />
              <InputField label="Role" field="contactRole" placeholder="e.g. Founder, CTO, Head of Growth" />

              {/* Review Summary */}
              <div style={{
                padding: "16px 18px", borderRadius: 10,
                background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Application Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>Product</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{form.name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>Category</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{form.category}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>Verified Sources</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                      {[form.connectStripe && "Stripe", form.connectAnalytics && "Analytics", form.connectGithub && "GitHub", form.connectDiscord && "Discord", form.connectUptime && "Uptime"].filter(Boolean).join(", ") || "None yet"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>Self-Reported</span>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>
                      {[form.mrr && `$${Number(form.mrr).toLocaleString()} MRR`, form.mau && `${Number(form.mau).toLocaleString()} MAU`].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} style={{
                padding: "10px 20px", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--dim)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--sans)",
              }}>Back</button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} style={{
                padding: "10px 28px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "#06080C", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--sans)",
                opacity: step === 1 && !form.name ? 0.4 : 1,
              }}>Continue</button>
            ) : (
              <button onClick={() => setSubmitted(true)} style={{
                padding: "10px 28px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "#06080C", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--sans)",
                opacity: !form.contactEmail ? 0.4 : 1,
              }}>Submit Application</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentScanner() {
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("mrrChange");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [timeFilter, setTimeFilter] = useState("30d");
  const [watchlist, setWatchlist] = useState(new Set());
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [showApply, setShowApply] = useState(false);

  const toggleWatchlist = useCallback((e, id) => {
    e.stopPropagation();
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    return PRODUCTS
      .filter(p => !showWatchlist || watchlist.has(p.id))
      .filter(p => category === "All" || p.category === category)
      .filter(p => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.ticker.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const av = a[sortBy] ?? -Infinity;
        const bv = b[sortBy] ?? -Infinity;
        return bv - av;
      });
  }, [category, sortBy, search, showWatchlist, watchlist]);

  const topMovers = useMemo(() => {
    return [...PRODUCTS].sort((a, b) => (b.mrrChange || 0) - (a.mrrChange || 0)).slice(0, 5);
  }, []);

  const stats = useMemo(() => {
    const totalMRR = PRODUCTS.reduce((s, p) => s + (p.mrr || 0), 0);
    const totalUsers = PRODUCTS.reduce((s, p) => s + (p.mau || 0), 0);
    const avgSentiment = Math.round(PRODUCTS.reduce((s, p) => s + (p.sentimentScore || 0), 0) / PRODUCTS.length);
    const verifiedCount = PRODUCTS.filter(p => getVerifiedCount(p.verifications) >= 3).length;
    return { totalMRR, totalUsers, avgSentiment, verifiedCount, total: PRODUCTS.length };
  }, []);

  return (
    <div style={{
      "--bg": "#06080C", "--surface": "#0B0E14", "--surface-hover": "#0F1219",
      "--border": "rgba(255,255,255,0.04)", "--border-light": "rgba(255,255,255,0.07)",
      "--text": "#E8E8EC", "--dim": "rgba(255,255,255,0.45)", "--muted": "rgba(255,255,255,0.25)",
      "--accent": "#00DFA2", "--accent-glow": "rgba(0,223,162,0.3)", "--accent-dim": "rgba(0,223,162,0.08)",
      "--red": "#FF4D5A", "--yellow": "#F0C030",
      "--mono": "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      "--sans": "'Helvetica Neue', Helvetica, Arial, sans-serif",
      minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes livePulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
        @keyframes scanLine { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        input::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #0B0E14; color: #E8E8EC; }
        button { font-family: inherit; }
      `}</style>

      {/* ====== HEADER ====== */}
      <header style={{
        padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0,
        background: "rgba(6,8,12,0.88)", backdropFilter: "blur(24px)", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Logo */}
          <div style={{
            width: 30, height: 30, borderRadius: 7, position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, #00DFA2 0%, #00B4CC 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#06080C", fontFamily: "var(--mono)", lineHeight: 1 }}>AS</span>
            <div style={{
              position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "scanLine 3s ease-in-out infinite",
            }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--mono)", letterSpacing: "-0.02em", color: "var(--text)" }}>
                AGENT<span style={{ color: "var(--accent)" }}>SCANNER</span>
              </span>
            </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
              animation: "livePulse 2s ease-in-out infinite",
              boxShadow: "0 0 8px var(--accent-glow)",
            }} />
            LIVE
          </div>

          <div style={{ width: 1, height: 20, background: "var(--border-light)" }} />

          <button onClick={() => setShowApply(true)} style={{
            padding: "7px 16px", borderRadius: 7, border: "1px solid rgba(0,223,162,0.25)",
            background: "var(--accent-dim)", color: "var(--accent)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sans)",
            transition: "all 0.15s", letterSpacing: "0.01em",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,223,162,0.15)"; e.currentTarget.style.borderColor = "rgba(0,223,162,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.borderColor = "rgba(0,223,162,0.25)"; }}
          >+ Submit Product</button>

          <div style={{ width: 1, height: 20, background: "var(--border-light)" }} />

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)", pointerEvents: "none" }}>⌕</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                borderRadius: 7, padding: "7px 12px 7px 30px", color: "var(--text)", fontSize: 12,
                outline: "none", width: 200, fontFamily: "var(--sans)", transition: "all 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(0,223,162,0.25)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
            />
          </div>
        </div>
      </header>

      {/* ====== MARKET STATS BAR ====== */}
      <div style={{
        padding: "12px 28px", display: "flex", gap: 28, borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.008)",
      }}>
        {[
          { label: "Products Tracked", value: stats.total },
          { label: "Combined MRR", value: fmt(stats.totalMRR) },
          { label: "Total Users", value: fmtUsers(stats.totalUsers) },
          { label: "Avg Sentiment", value: stats.avgSentiment },
          { label: "Verified", value: `${stats.verifiedCount}/${stats.total}` },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 28px" }}>
        {/* ====== TOP MOVERS ====== */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
            🔥 Top Movers
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {topMovers.map((p, i) => (
              <div key={p.id} onClick={() => setSelectedProduct(p)} style={{
                flex: "0 0 auto", minWidth: 195, padding: "14px 18px", borderRadius: 12,
                background: "var(--surface)", border: "1px solid var(--border)",
                cursor: "pointer", transition: "all 0.15s",
                animation: `slideUp 0.3s ease ${i * 0.04}s both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{p.logo}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>${p.ticker}</div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, fontFamily: "var(--mono)",
                    color: (p.mrrChange || 0) >= 0 ? "var(--accent)" : "var(--red)",
                  }}>
                    {fmtPct(p.mrrChange)}
                  </div>
                </div>
                <Sparkline data={p.sparkline} positive={(p.mrrChange || 0) >= 0} width={160} height={28} />
              </div>
            ))}
          </div>
        </div>

        {/* ====== CONTROLS ROW ====== */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12, flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {ALL_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: "5px 12px", borderRadius: 6,
                border: "1px solid",
                borderColor: category === c ? "rgba(0,223,162,0.25)" : "var(--border)",
                background: category === c ? "var(--accent-dim)" : "transparent",
                color: category === c ? "var(--accent)" : "var(--muted)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                fontFamily: "var(--sans)",
              }}>{c}</button>
            ))}

            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 6px" }} />

            <button onClick={() => setShowWatchlist(!showWatchlist)} style={{
              padding: "5px 12px", borderRadius: 6,
              border: "1px solid",
              borderColor: showWatchlist ? "rgba(240,192,48,0.25)" : "var(--border)",
              background: showWatchlist ? "rgba(240,192,48,0.06)" : "transparent",
              color: showWatchlist ? "var(--yellow)" : "var(--muted)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
            }}>★ Watchlist{watchlist.size > 0 ? ` (${watchlist.size})` : ""}</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Time filter */}
            <div style={{ display: "flex", gap: 2 }}>
              {TIME_FILTERS.map(t => (
                <button key={t} onClick={() => setTimeFilter(t)} style={{
                  padding: "4px 8px", borderRadius: 4, border: "none",
                  background: timeFilter === t ? "rgba(255,255,255,0.06)" : "transparent",
                  color: timeFilter === t ? "var(--text)" : "var(--muted)",
                  fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "var(--mono)",
                }}>{t}</button>
              ))}
            </div>

            <div style={{ width: 1, height: 16, background: "var(--border)" }} />

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11,
              fontFamily: "var(--sans)", outline: "none", cursor: "pointer",
            }}>
              {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            {/* View toggle */}
            <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: 2 }}>
              {["table", "grid"].map(v => (
                <button key={v} onClick={() => setViewMode(v)} style={{
                  padding: "4px 8px", borderRadius: 4, border: "none",
                  background: viewMode === v ? "rgba(255,255,255,0.08)" : "transparent",
                  color: viewMode === v ? "var(--text)" : "var(--muted)",
                  fontSize: 11, cursor: "pointer",
                }}>{v === "table" ? "☰" : "⊞"}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ====== TABLE VIEW ====== */}
        {viewMode === "table" && (
          <>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "36px 2.2fr 1fr 1fr 0.9fr 0.8fr 0.7fr 120px 36px",
              padding: "8px 14px", marginBottom: 2,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              <span>#</span>
              <span>Product</span>
              <span style={{ textAlign: "right" }}>MRR</span>
              <span style={{ textAlign: "right" }}>Users</span>
              <span style={{ textAlign: "right" }}>Funding</span>
              <span style={{ textAlign: "right" }}>Sentiment</span>
              <span style={{ textAlign: "center" }}>Verified</span>
              <span style={{ textAlign: "right" }}>30d</span>
              <span></span>
            </div>

            {/* Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filtered.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 2.2fr 1fr 1fr 0.9fr 0.8fr 0.7fr 120px 36px",
                    padding: "12px 14px", borderRadius: 8,
                    background: idx % 2 === 0 ? "rgba(255,255,255,0.008)" : "transparent",
                    border: "1px solid transparent",
                    cursor: "pointer", alignItems: "center",
                    transition: "all 0.12s",
                    animation: `slideUp 0.25s ease ${idx * 0.02}s both`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "var(--surface-hover)";
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = idx % 2 === 0 ? "rgba(255,255,255,0.008)" : "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", fontWeight: 700 }}>{idx + 1}</span>

                  {/* Product */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
                      border: "1px solid var(--border)",
                    }}>{p.logo}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.name}</span>
                        {p.hot && <span style={{
                          fontSize: 8, padding: "1px 5px", borderRadius: 3,
                          background: "rgba(255,77,90,0.1)", color: "var(--red)",
                          fontWeight: 800, letterSpacing: "0.08em",
                        }}>HOT</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>${p.ticker}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>•</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{p.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* MRR */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{fmt(p.mrr)}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                      color: p.mrrChange === null ? "var(--muted)" : p.mrrChange >= 0 ? "var(--accent)" : "var(--red)",
                    }}>{p.mrrChange !== null ? fmtPct(p.mrrChange) : "—"}</div>
                  </div>

                  {/* Users */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{fmtUsers(p.mau)}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                      color: p.mauChange >= 0 ? "var(--accent)" : "var(--red)",
                    }}>{fmtPct(p.mauChange)}</div>
                  </div>

                  {/* Funding */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--dim)" }}>
                      {p.fundingTotal ? fmt(p.fundingTotal) : p.lastRound || "—"}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted)" }}>{p.lastRound}</div>
                  </div>

                  {/* Sentiment */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <SentimentBar score={p.sentimentScore} />
                  </div>

                  {/* Verified */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <VerificationMeter verifications={p.verifications} />
                  </div>

                  {/* Sparkline */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Sparkline data={p.sparkline} positive={p.mrrChange === null || p.mrrChange >= 0} width={100} height={28} />
                  </div>

                  {/* Watchlist */}
                  <button onClick={(e) => toggleWatchlist(e, p.id)} style={{
                    background: "none", border: "none", cursor: "pointer", fontSize: 14,
                    color: watchlist.has(p.id) ? "var(--yellow)" : "var(--muted)",
                    transition: "all 0.15s", padding: 0,
                    filter: watchlist.has(p.id) ? "drop-shadow(0 0 4px rgba(240,192,48,0.4))" : "none",
                  }}>
                    {watchlist.has(p.id) ? "★" : "☆"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ====== GRID VIEW ====== */}
        {viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {filtered.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                style={{
                  padding: "18px 20px", borderRadius: 12,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  cursor: "pointer", transition: "all 0.15s",
                  animation: `slideUp 0.25s ease ${idx * 0.03}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                      border: "1px solid var(--border)",
                    }}>{p.logo}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.name}</span>
                        {p.hot && <span style={{
                          fontSize: 8, padding: "1px 5px", borderRadius: 3,
                          background: "rgba(255,77,90,0.1)", color: "var(--red)",
                          fontWeight: 800, letterSpacing: "0.08em",
                        }}>HOT</span>}
                      </div>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>${p.ticker} • {p.category}</span>
                    </div>
                  </div>
                  <button onClick={(e) => toggleWatchlist(e, p.id)} style={{
                    background: "none", border: "none", cursor: "pointer", fontSize: 14,
                    color: watchlist.has(p.id) ? "var(--yellow)" : "var(--muted)", padding: 0,
                  }}>
                    {watchlist.has(p.id) ? "★" : "☆"}
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <Sparkline data={p.sparkline} positive={p.mrrChange === null || p.mrrChange >= 0} width={240} height={36} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>MRR</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{fmt(p.mrr)}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                        color: p.mrrChange === null ? "var(--muted)" : p.mrrChange >= 0 ? "var(--accent)" : "var(--red)",
                      }}>{p.mrrChange !== null ? fmtPct(p.mrrChange) : ""}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>Users</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{fmtUsers(p.mau)}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                        color: p.mauChange >= 0 ? "var(--accent)" : "var(--red)",
                      }}>{fmtPct(p.mauChange)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SentimentBar score={p.sentimentScore} />
                  <VerificationMeter verifications={p.verifications} />
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{
            padding: 80, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⊘</div>
            <div style={{ fontSize: 14, color: "var(--dim)", marginBottom: 4 }}>No products found</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Try adjusting your filters or search query</div>
          </div>
        )}

        {/* ====== FOOTER ====== */}
        <div style={{
          marginTop: 32, padding: "18px 0", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {filtered.length} of {PRODUCTS.length} products
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 4px var(--accent-glow)" }} />
                Verified Source
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                Self-Reported
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>AGENTSCANNER</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.1)", fontFamily: "var(--mono)" }}>v0.1.0</span>
          </div>
        </div>
      </div>

      {/* ====== DETAIL MODAL ====== */}
      {selectedProduct && <DetailPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      {/* ====== APPLICATION MODAL ====== */}
      {showApply && <ApplicationModal onClose={() => setShowApply(false)} />}
    </div>
  );
}
