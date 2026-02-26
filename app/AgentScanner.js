"use client";
import { useState, useMemo, useCallback } from "react";

// ============================================================
// DATA
// ============================================================
const PRODUCTS = [
  {
    id: "cursor", name: "Cursor", ticker: "CURSOR", category: "Dev Tools", logo: "⌨️",
    description: "AI-first code editor built on VS Code with deep codebase understanding",
    mrr: 4200000, mrrChange: 18.4,
    mrrHist: [2100000, 2400000, 2700000, 2950000, 3200000, 3550000, 4200000],
    mau: 890000, mauChange: 12.1, dau: 320000,
    githubStars: 24500, starVelocity: 340,
    teamSize: 85, teamGrowth: 12,
    fundingTotal: 460000000, lastRound: "Series C", valuation: 2500000000,
    investors: ["a16z", "Thrive Capital"],
    uptime: 99.97, latencyMs: 120, errorRate: 0.03,
    sentiment: 92, nps: 78,
    verifications: { revenue: "stripe", usage: "posthog", community: "github", uptime: "betterstack", team: "linkedin" },
    spark: [62, 58, 71, 68, 75, 82, 79, 88, 91, 95, 89, 102, 98, 110, 115, 108, 120, 125, 131, 128, 140, 145, 138, 152],
    hot: true, age: "2y 3m", founded: "2022",
    website: "https://cursor.com",
    twitter: "https://x.com/cursor_ai",
    contactEmail: "hello@cursor.com",
    contactName: "Anysphere Team",
  },
  {
    id: "bolt", name: "Bolt.new", ticker: "BOLT", category: "Dev Tools", logo: "⚡",
    description: "Full-stack web apps from a single prompt, powered by StackBlitz",
    mrr: 2800000, mrrChange: 34.2,
    mrrHist: [400000, 620000, 880000, 1200000, 1600000, 2100000, 2800000],
    mau: 520000, mauChange: 28.5, dau: 145000,
    githubStars: 12800, starVelocity: 580,
    teamSize: 42, teamGrowth: 28,
    fundingTotal: 100000000, lastRound: "Series B", valuation: 750000000,
    investors: ["Spark Capital"],
    uptime: 99.82, latencyMs: 250, errorRate: 0.18,
    sentiment: 88, nps: 72,
    verifications: { revenue: "stripe", usage: "analytics", community: "github", uptime: "self", team: "self" },
    spark: [20, 25, 28, 35, 42, 48, 55, 62, 58, 70, 78, 85, 92, 88, 100, 112, 120, 115, 130, 142, 150, 158, 165, 172],
    hot: true, age: "1y 1m", founded: "2024",
    website: "https://bolt.new",
    twitter: "https://x.com/stackblitz",
    contactEmail: "team@stackblitz.com",
    contactName: "StackBlitz Team",
  },
  {
    id: "perplexity", name: "Perplexity", ticker: "PPLX", category: "Search", logo: "🔍",
    description: "AI-powered answer engine replacing traditional search",
    mrr: 8500000, mrrChange: 8.7,
    mrrHist: [4800000, 5200000, 5800000, 6400000, 7000000, 7800000, 8500000],
    mau: 3200000, mauChange: 5.2, dau: 980000,
    githubStars: null, starVelocity: null,
    teamSize: 120, teamGrowth: 8,
    fundingTotal: 500000000, lastRound: "Series C", valuation: 9000000000,
    investors: ["IVP", "NEA", "Bezos Expeditions"],
    uptime: 99.95, latencyMs: 180, errorRate: 0.05,
    sentiment: 85, nps: 68,
    verifications: { revenue: "stripe", usage: "cloudflare", community: "discord", uptime: "betterstack", team: "linkedin" },
    spark: [80, 82, 85, 88, 90, 92, 88, 95, 98, 100, 102, 105, 98, 108, 110, 112, 115, 118, 120, 115, 122, 125, 128, 130],
    hot: false, age: "2y 8m", founded: "2022",
    website: "https://perplexity.ai",
    twitter: "https://x.com/peraborplexity_ai",
    contactEmail: "hello@perplexity.ai",
    contactName: "Perplexity Team",
  },
  {
    id: "devin", name: "Devin", ticker: "DEVIN", category: "AI Agent", logo: "🤖",
    description: "Autonomous AI software engineer by Cognition Labs",
    mrr: 1200000, mrrChange: -4.2,
    mrrHist: [1400000, 1380000, 1350000, 1320000, 1280000, 1250000, 1200000],
    mau: 45000, mauChange: -8.1, dau: 8500,
    githubStars: null, starVelocity: null,
    teamSize: 35, teamGrowth: -5,
    fundingTotal: 175000000, lastRound: "Series A", valuation: 500000000,
    investors: ["Founders Fund"],
    uptime: 98.5, latencyMs: 3200, errorRate: 1.5,
    sentiment: 52, nps: 22,
    verifications: { revenue: "self", usage: "self", community: "discord", uptime: "self", team: "self" },
    spark: [100, 105, 110, 108, 102, 98, 95, 92, 88, 85, 82, 80, 78, 75, 72, 70, 68, 72, 70, 65, 68, 65, 62, 60],
    hot: false, age: "1y 6m", founded: "2023",
    website: "https://devin.ai",
    twitter: "https://x.com/cognaborition_ai",
    contactEmail: "info@cognition.ai",
    contactName: "Cognition Labs",
  },
  {
    id: "lovable", name: "Lovable", ticker: "LOVE", category: "Dev Tools", logo: "💜",
    description: "AI full-stack engineer — describe what you want, get a working app",
    mrr: 1800000, mrrChange: 42.1,
    mrrHist: [180000, 320000, 520000, 780000, 1050000, 1400000, 1800000],
    mau: 310000, mauChange: 38.7, dau: 88000,
    githubStars: 8200, starVelocity: 420,
    teamSize: 28, teamGrowth: 35,
    fundingTotal: 25000000, lastRound: "Series A", valuation: 200000000,
    investors: ["Spark Capital"],
    uptime: 99.88, latencyMs: 200, errorRate: 0.12,
    sentiment: 90, nps: 76,
    verifications: { revenue: "stripe", usage: "posthog", community: "github", uptime: "betterstack", team: "self" },
    spark: [10, 12, 15, 18, 22, 28, 35, 42, 50, 58, 68, 75, 82, 90, 95, 102, 110, 118, 125, 135, 142, 155, 165, 178],
    hot: true, age: "10m", founded: "2024",
    website: "https://lovable.dev",
    twitter: "https://x.com/lovaborable_dev",
    contactEmail: "hello@lovable.dev",
    contactName: "Lovable Team",
  },
  {
    id: "windsurf", name: "Windsurf", ticker: "WIND", category: "Dev Tools", logo: "🏄",
    description: "AI-powered IDE by Codeium with deep context awareness",
    mrr: 950000, mrrChange: 22.8,
    mrrHist: [320000, 420000, 510000, 600000, 700000, 820000, 950000],
    mau: 180000, mauChange: 15.3, dau: 52000,
    githubStars: 5400, starVelocity: 210,
    teamSize: 55, teamGrowth: 10,
    fundingTotal: 60000000, lastRound: "Series A", valuation: 300000000,
    investors: ["Greenoaks Capital"],
    uptime: 99.91, latencyMs: 140, errorRate: 0.09,
    sentiment: 78, nps: 58,
    verifications: { revenue: "self", usage: "analytics", community: "github", uptime: "betterstack", team: "linkedin" },
    spark: [30, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 60, 65, 68, 72, 75, 78, 82, 85, 80, 88, 92, 95, 98],
    hot: false, age: "1y 2m", founded: "2023",
    website: "https://windsurf.com",
    twitter: "https://x.com/codeaborium",
    contactEmail: "hello@codeium.com",
    contactName: "Codeium Team",
  },
  {
    id: "elevenlabs", name: "ElevenLabs", ticker: "11L", category: "Audio AI", logo: "🎙️",
    description: "AI voice synthesis, cloning, and dubbing platform",
    mrr: 6200000, mrrChange: 15.3,
    mrrHist: [3200000, 3600000, 4100000, 4600000, 5200000, 5700000, 6200000],
    mau: 1800000, mauChange: 9.8, dau: 420000,
    githubStars: 3200, starVelocity: 85,
    teamSize: 95, teamGrowth: 15,
    fundingTotal: 180000000, lastRound: "Series C", valuation: 3300000000,
    investors: ["a16z", "Nat Friedman"],
    uptime: 99.93, latencyMs: 300, errorRate: 0.07,
    sentiment: 87, nps: 70,
    verifications: { revenue: "stripe", usage: "cloudflare", community: "discord", uptime: "betterstack", team: "linkedin" },
    spark: [50, 52, 55, 58, 62, 65, 68, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95, 98, 100, 102, 105, 108, 110, 115],
    hot: false, age: "2y 5m", founded: "2022",
    website: "https://elevenlabs.io",
    twitter: "https://x.com/elevaborenlabs",
    contactEmail: "hello@elevenlabs.io",
    contactName: "ElevenLabs Team",
  },
  {
    id: "replitAgent", name: "Replit Agent", ticker: "RPLIT", category: "AI Agent", logo: "🔄",
    description: "Build complete apps with AI assistance inside Replit",
    mrr: 3100000, mrrChange: 6.2,
    mrrHist: [2400000, 2500000, 2600000, 2700000, 2800000, 2950000, 3100000],
    mau: 420000, mauChange: 2.1, dau: 95000,
    githubStars: 1800, starVelocity: 45,
    teamSize: 180, teamGrowth: 3,
    fundingTotal: 200000000, lastRound: "Series C", valuation: 1200000000,
    investors: ["a16z"],
    uptime: 99.75, latencyMs: 280, errorRate: 0.25,
    sentiment: 71, nps: 45,
    verifications: { revenue: "self", usage: "analytics", community: "github", uptime: "self", team: "linkedin" },
    spark: [70, 72, 74, 75, 76, 78, 75, 77, 79, 80, 78, 80, 82, 81, 83, 82, 84, 83, 85, 84, 86, 85, 87, 88],
    hot: false, age: "3y 1m", founded: "2016",
    website: "https://replit.com",
    twitter: "https://x.com/reaborplit",
    contactEmail: "partnerships@replit.com",
    contactName: "Replit Team",
  },
  {
    id: "midjourney", name: "Midjourney", ticker: "MJ", category: "Image Gen", logo: "🎨",
    description: "AI image generation via Discord and web interface",
    mrr: 12000000, mrrChange: 2.1,
    mrrHist: [10500000, 10800000, 11000000, 11200000, 11500000, 11800000, 12000000],
    mau: 5200000, mauChange: -1.3, dau: 1200000,
    githubStars: null, starVelocity: null,
    teamSize: 55, teamGrowth: 5,
    fundingTotal: 0, lastRound: "Bootstrapped", valuation: null,
    investors: [],
    uptime: 99.6, latencyMs: 8000, errorRate: 0.4,
    sentiment: 76, nps: 55,
    verifications: { revenue: "self", usage: "self", community: "discord", uptime: "self", team: "self" },
    spark: [120, 122, 125, 128, 130, 128, 125, 122, 120, 118, 122, 125, 128, 125, 122, 120, 118, 120, 122, 124, 120, 122, 118, 120],
    hot: false, age: "3y 2m", founded: "2021",
    website: "https://midjourney.com",
    twitter: "https://x.com/midaborjourney",
    contactEmail: "support@midjourney.com",
    contactName: "Midjourney Team",
  },
  {
    id: "v0", name: "v0 by Vercel", ticker: "V0", category: "Dev Tools", logo: "▲",
    description: "AI-powered UI generation and code scaffolding by Vercel",
    mrr: 800000, mrrChange: 55.3,
    mrrHist: [60000, 120000, 210000, 320000, 450000, 600000, 800000],
    mau: 280000, mauChange: 44.2, dau: 72000,
    githubStars: null, starVelocity: null,
    teamSize: null, teamGrowth: null,
    fundingTotal: null, lastRound: "Vercel Product", valuation: null,
    investors: [],
    uptime: 99.92, latencyMs: 160, errorRate: 0.08,
    sentiment: 91, nps: 80,
    verifications: { revenue: "self", usage: "cloudflare", community: "github", uptime: "betterstack", team: "self" },
    spark: [5, 8, 12, 18, 25, 32, 40, 48, 55, 65, 72, 80, 88, 95, 105, 112, 120, 130, 138, 148, 155, 165, 175, 185],
    hot: true, age: "1y 4m", founded: "2023",
    website: "https://v0.dev",
    twitter: "https://x.com/v0",
    contactEmail: "sales@vercel.com",
    contactName: "Vercel Team",
  },
  {
    id: "heygen", name: "HeyGen", ticker: "HGEN", category: "Video AI", logo: "🎬",
    description: "AI video generation, avatars, and localization platform",
    mrr: 5800000, mrrChange: 21.5,
    mrrHist: [2800000, 3200000, 3700000, 4200000, 4700000, 5200000, 5800000],
    mau: 950000, mauChange: 18.2, dau: 180000,
    githubStars: null, starVelocity: null,
    teamSize: 150, teamGrowth: 20,
    fundingTotal: 60000000, lastRound: "Series A", valuation: 500000000,
    investors: ["Benchmark"],
    uptime: 99.85, latencyMs: 5000, errorRate: 0.15,
    sentiment: 82, nps: 65,
    verifications: { revenue: "stripe", usage: "analytics", community: "discord", uptime: "betterstack", team: "linkedin" },
    spark: [35, 40, 45, 50, 55, 60, 62, 68, 72, 75, 80, 85, 88, 92, 95, 100, 105, 108, 112, 118, 122, 128, 132, 138],
    hot: true, age: "2y 10m", founded: "2022",
    website: "https://heygen.com",
    twitter: "https://x.com/HeyGen_Official",
    contactEmail: "partnerships@heygen.com",
    contactName: "HeyGen Team",
  },
  {
    id: "claude-code", name: "Claude Code", ticker: "CLCD", category: "Dev Tools", logo: "🧠",
    description: "Anthropic's agentic coding CLI for terminal-native developers",
    mrr: null, mrrChange: null,
    mrrHist: [],
    mau: 150000, mauChange: 62.5, dau: 48000,
    githubStars: null, starVelocity: null,
    teamSize: null, teamGrowth: null,
    fundingTotal: null, lastRound: "Anthropic Product", valuation: null,
    investors: [],
    uptime: 99.9, latencyMs: 200, errorRate: 0.1,
    sentiment: 94, nps: 85,
    verifications: { revenue: "self", usage: "self", community: "github", uptime: "self", team: "self" },
    spark: [8, 12, 18, 28, 35, 45, 58, 68, 78, 85, 92, 98, 105, 115, 125, 132, 140, 148, 155, 162, 170, 178, 185, 195],
    hot: true, age: "8m", founded: "2024",
    website: "https://claude.ai",
    twitter: "https://x.com/AnthropicAI",
    contactEmail: "sales@anthropic.com",
    contactName: "Anthropic",
  },
];

const ALL_CATS = ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
const SORTS = [
  { key: "mrrChange", label: "MRR Growth" },
  { key: "mrr", label: "Revenue" },
  { key: "mau", label: "Users" },
  { key: "mauChange", label: "User Growth" },
  { key: "sentiment", label: "Sentiment" },
  { key: "fundingTotal", label: "Funding" },
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
const SRC = { stripe: "Stripe", posthog: "PostHog", analytics: "Analytics", cloudflare: "Cloudflare", github: "GitHub", discord: "Discord", betterstack: "BetterStack", linkedin: "LinkedIn", self: "Self-Reported" };

// ============================================================
// MICRO COMPONENTS
// ============================================================
function Spark({ data, up, w = 110, h = 28 }) {
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * (h - 4) - 2}`).join(" ");
  const c = up !== false ? "var(--g)" : "var(--r)";
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
  const c = s >= 80 ? "var(--g)" : s >= 60 ? "var(--y)" : "var(--r)";
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
function DetailPanel({ p, onClose }) {
  if (!p) return null;

  const grid = [
    { l: "MRR", v: fmt$(p.mrr), c: p.mrrChange, s: p.verifications.revenue },
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fi .15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "94%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", boxShadow: "0 40px 100px rgba(0,0,0,.55)" }}>

        {/* Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{p.logo}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--m)", margin: 0, letterSpacing: "-.01em" }}>{p.name}</h2>
                <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>${p.ticker}</span>
                {p.hot && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 700, letterSpacing: ".06em" }}>HOT</span>}
              </div>
              <p style={{ fontSize: 12, color: "var(--t2)", margin: 0, lineHeight: 1.4, maxWidth: 400 }}>{p.description}</p>
              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                <span className="chip">{p.category}</span>
                {p.lastRound && <span className="chip chip-g">{p.lastRound}</span>}
                <span className="chip">Est. {p.founded}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div style={{ padding: "20px 26px 26px" }}>

          {/* Links + Contact Row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {p.website && <ExtLink href={p.website} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>↗</span> Website
            </ExtLink>}
            {p.twitter && <ExtLink href={p.twitter} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, color: "var(--t2)" }}>
              𝕏 Profile
            </ExtLink>}
            {p.contactEmail && (
              <a href={`mailto:${p.contactEmail}`} style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 7, background: "var(--g)", color: "var(--bg)", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: ".01em" }}>
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
                  {m.c != null && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", color: m.c >= 0 ? "var(--g)" : "var(--r)" }}>{fmtP(m.c)}</span>}
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

  const CATS = ["Dev Tools", "AI Agent", "Search", "Audio AI", "Image Gen", "Video AI", "Productivity", "Data/Analytics", "Infrastructure", "Other"];

  const Inp = ({ label, field, ph, type = "text", half }) => (
    <div style={{ flex: half ? "1 1 48%" : "1 1 100%" }}>
      <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>{label}</label>
      <input type={type} value={f[field]} onChange={e => u(field, e.target.value)} placeholder={ph} className="input" />
    </div>
  );

  const Toggle = ({ label, icon, field }) => (
    <div onClick={() => u(field, !f[field])} style={{ padding: "12px 14px", borderRadius: 8, cursor: "pointer", background: f[field] ? "var(--gd)" : "var(--s2)", border: `1px solid ${f[field] ? "rgba(0,210,150,.22)" : "var(--b1)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .12s" }}>
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
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "88%", maxWidth: 440, padding: "44px 32px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
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
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "92%", maxWidth: 540, maxHeight: "88vh", overflow: "auto", boxShadow: "0 40px 100px rgba(0,0,0,.5)" }}>
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
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("mrrChange");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [apply, setApply] = useState(false);
  const [wl, setWl] = useState(new Set());
  const [wlFilter, setWlFilter] = useState(false);
  const [view, setView] = useState("table");

  const toggleWl = useCallback((e, id) => { e.stopPropagation(); setWl(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, []);

  const filtered = useMemo(() => {
    return PRODUCTS
      .filter(p => !wlFilter || wl.has(p.id))
      .filter(p => cat === "All" || p.category === cat)
      .filter(p => { const s = q.toLowerCase(); return !s || p.name.toLowerCase().includes(s) || p.ticker.toLowerCase().includes(s) || p.category.toLowerCase().includes(s); })
      .sort((a, b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity));
  }, [cat, sort, q, wlFilter, wl]);

  const movers = useMemo(() => [...PRODUCTS].sort((a, b) => (b.mrrChange || 0) - (a.mrrChange || 0)).slice(0, 5), []);

  const agg = useMemo(() => ({
    mrr: PRODUCTS.reduce((s, p) => s + (p.mrr || 0), 0),
    users: PRODUCTS.reduce((s, p) => s + (p.mau || 0), 0),
    senti: Math.round(PRODUCTS.reduce((s, p) => s + (p.sentiment || 0), 0) / PRODUCTS.length),
    veri: PRODUCTS.filter(p => vCount(p.verifications) >= 3).length,
    n: PRODUCTS.length,
  }), []);

  return (
    <div id="app" style={{ "--bg": "#05070B", "--s1": "#0A0D13", "--s2": "rgba(255,255,255,.02)", "--sh": "rgba(255,255,255,.035)", "--b1": "rgba(255,255,255,.04)", "--b2": "rgba(255,255,255,.07)", "--t1": "#EAEAEE", "--t2": "rgba(255,255,255,.5)", "--t3": "rgba(255,255,255,.25)", "--t4": "rgba(255,255,255,.1)", "--g": "#00D49A", "--gg": "rgba(0,212,154,.28)", "--gd": "rgba(0,212,154,.07)", "--r": "#FF4450", "--y": "#E8B830", "--m": "'JetBrains Mono', 'SF Mono', 'Consolas', monospace", "--f": "'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0 } to { opacity: 1 } }
        @keyframes su { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 2px; }
        input::placeholder { color: rgba(255,255,255,.18); }
        select option { background: #0A0D13; }
        .label-xs { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); }
        .chip { font-size: 9px; padding: 2px 7px; border-radius: 3px; background: rgba(255,255,255,.03); color: var(--t2); font-weight: 600; letter-spacing: .03em; border: 1px solid var(--b1); }
        .chip-g { background: var(--gd); color: var(--g); border-color: rgba(0,212,154,.15); }
        .card-inner { padding: 14px 16px; border-radius: 8px; background: var(--s2); border: 1px solid var(--b1); }
        .input { width: 100%; padding: 9px 11px; border-radius: 7px; background: rgba(255,255,255,.025); border: 1px solid var(--b1); color: var(--t1); font-size: 12px; font-family: var(--f); outline: none; transition: border-color .15s; }
        .input:focus { border-color: rgba(0,212,154,.28); }
        .btn-primary { padding: 9px 24px; border-radius: 7px; border: none; background: var(--g); color: var(--bg); font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--f); letter-spacing: .01em; }
        .btn-primary:hover { opacity: .88; }
        .btn-ghost { padding: 9px 18px; border-radius: 7px; border: 1px solid var(--b1); background: transparent; color: var(--t2); font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--f); }
        .btn-close { background: rgba(255,255,255,.03); border: 1px solid var(--b1); color: var(--t3); width: 30px; height: 30px; border-radius: 7px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
        .btn-close:hover { background: rgba(255,255,255,.06); }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(16px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fi .15s ease; }
        .cat-btn { padding: 5px 11px; border-radius: 5px; border: 1px solid var(--b1); background: transparent; color: var(--t3); font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--f); transition: all .1s; }
        .cat-btn.on { border-color: rgba(0,212,154,.22); background: var(--gd); color: var(--g); }
        .row { display: grid; grid-template-columns: 32px 2.2fr .9fr .9fr .8fr .7fr .65fr 100px 30px; padding: 11px 14px; border-radius: 7px; cursor: pointer; align-items: center; transition: all .1s; border: 1px solid transparent; }
        .row:hover { background: var(--sh); border-color: var(--b2); }
        .row-h { display: grid; grid-template-columns: 32px 2.2fr .9fr .9fr .8fr .7fr .65fr 100px 30px; padding: 7px 14px; }
        .vb { font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; white-space: nowrap; }
        .mover { flex: 0 0 auto; min-width: 185px; padding: 13px 16px; border-radius: 10px; background: var(--s1); border: 1px solid var(--b1); cursor: pointer; transition: all .12s; }
        .mover:hover { background: var(--sh); border-color: var(--b2); }
        .wl-star { background: none; border: none; cursor: pointer; font-size: 13px; padding: 0; transition: all .12s; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", position: "sticky", top: 0, background: "rgba(5,7,11,.9)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #00D49A, #00A0B8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--bg)", fontFamily: "var(--m)" }}>AS</span>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)", animation: "sl 3s ease-in-out infinite" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.01em" }}>
            AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, color: "var(--g)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite", boxShadow: "0 0 6px var(--gg)" }} />LIVE
          </div>
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          <button onClick={() => setApply(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(0,212,154,.22)", background: "var(--gd)", color: "var(--g)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)" }}>+ Submit Product</button>
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="input" style={{ width: 180, paddingLeft: 27, fontSize: 11, padding: "6px 10px 6px 27px" }} />
          </div>
        </div>
      </header>

      {/* STATS BAR */}
      <div style={{ padding: "10px 24px", display: "flex", gap: 24, borderBottom: "1px solid var(--b1)", background: "rgba(255,255,255,.005)" }}>
        {[["Tracked", agg.n], ["Combined MRR", fmt$(agg.mrr)], ["Total Users", fmtU(agg.users)], ["Avg Sentiment", agg.senti], ["Verified", `${agg.veri}/${agg.n}`]].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)" }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "18px 24px" }}>

        {/* TOP MOVERS */}
        <div style={{ marginBottom: 20 }}>
          <span className="label-xs" style={{ marginBottom: 8, display: "block" }}>Top Movers</span>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {movers.map((p, i) => (
              <div key={p.id} className="mover" onClick={() => setSel(p)} style={{ animation: `su .25s ease ${i * .04}s both` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{p.logo}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 9, color: "var(--t3)", fontFamily: "var(--m)" }}>${p.ticker}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--m)", color: (p.mrrChange || 0) >= 0 ? "var(--g)" : "var(--r)" }}>{fmtP(p.mrrChange)}</span>
                </div>
                <Spark data={p.spark} up={(p.mrrChange || 0) >= 0} w={155} h={24} />
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {ALL_CATS.map(c => <button key={c} className={`cat-btn${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
            <div style={{ width: 1, height: 18, background: "var(--b1)", margin: "0 4px" }} />
            <button className={`cat-btn${wlFilter ? " on" : ""}`} onClick={() => setWlFilter(!wlFilter)} style={wlFilter ? { borderColor: "rgba(232,184,48,.22)", background: "rgba(232,184,48,.06)", color: "var(--y)" } : {}}>
              ★ Watchlist{wl.size > 0 ? ` (${wl.size})` : ""}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width: "auto", fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 1, background: "rgba(255,255,255,.025)", borderRadius: 5, padding: 2 }}>
              {["table", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "3px 7px", borderRadius: 3, border: "none", background: view === v ? "rgba(255,255,255,.07)" : "transparent", color: view === v ? "var(--t1)" : "var(--t3)", fontSize: 10, cursor: "pointer" }}>{v === "table" ? "☰" : "⊞"}</button>)}
            </div>
          </div>
        </div>

        {/* TABLE */}
        {view === "table" && <>
          <div className="row-h" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--t3)" }}>
            <span>#</span><span>Product</span><span style={{ textAlign: "right" }}>MRR</span><span style={{ textAlign: "right" }}>Users</span><span style={{ textAlign: "right" }}>Funding</span><span style={{ textAlign: "right" }}>Sentiment</span><span style={{ textAlign: "center" }}>Verified</span><span style={{ textAlign: "right" }}>30d</span><span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map((p, i) => (
              <div key={p.id} className="row" onClick={() => setSel(p)} style={{ animation: `su .2s ease ${i * .02}s both`, background: i % 2 === 0 ? "rgba(255,255,255,.006)" : "transparent" }}>
                <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", fontWeight: 700 }}>{i + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.logo}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{p.name}</span>
                      {p.hot && <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 2, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 800, letterSpacing: ".06em" }}>HOT</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                      <span style={{ fontSize: 9.5, color: "var(--t3)", fontFamily: "var(--m)" }}>${p.ticker}</span>
                      <span style={{ fontSize: 8, color: "var(--t4)" }}>•</span>
                      <span style={{ fontSize: 9, color: "var(--t4)" }}>{p.category}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)" }}>{fmt$(p.mrr)}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, fontFamily: "var(--m)", color: p.mrrChange == null ? "var(--t3)" : p.mrrChange >= 0 ? "var(--g)" : "var(--r)" }}>{p.mrrChange != null ? fmtP(p.mrrChange) : "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)" }}>{fmtU(p.mau)}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, fontFamily: "var(--m)", color: p.mauChange >= 0 ? "var(--g)" : "var(--r)" }}>{fmtP(p.mauChange)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)" }}>{p.fundingTotal ? fmt$(p.fundingTotal) : p.lastRound || "—"}</div>
                  <div style={{ fontSize: 8.5, color: "var(--t3)" }}>{p.lastRound}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}><SentiBar s={p.sentiment} /></div>
                <div style={{ display: "flex", justifyContent: "center" }}><VMeter v={p.verifications} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}><Spark data={p.spark} up={p.mrrChange == null || p.mrrChange >= 0} w={90} h={24} /></div>
                <button className="wl-star" onClick={e => toggleWl(e, p.id)} style={{ color: wl.has(p.id) ? "var(--y)" : "var(--t3)", filter: wl.has(p.id) ? "drop-shadow(0 0 3px rgba(232,184,48,.35))" : "none" }}>{wl.has(p.id) ? "★" : "☆"}</button>
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
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{p.logo}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                        {p.hot && <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 2, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 800 }}>HOT</span>}
                      </div>
                      <span style={{ fontSize: 9, color: "var(--t3)", fontFamily: "var(--m)" }}>${p.ticker} • {p.category}</span>
                    </div>
                  </div>
                  <button className="wl-star" onClick={e => toggleWl(e, p.id)} style={{ color: wl.has(p.id) ? "var(--y)" : "var(--t3)" }}>{wl.has(p.id) ? "★" : "☆"}</button>
                </div>
                <div style={{ marginBottom: 12 }}><Spark data={p.spark} up={p.mrrChange == null || p.mrrChange >= 0} w={230} h={32} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div className="label-xs" style={{ marginBottom: 2 }}>MRR</div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--m)" }}>{fmt$(p.mrr)}</span>
                    {p.mrrChange != null && <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", color: p.mrrChange >= 0 ? "var(--g)" : "var(--r)", marginLeft: 4 }}>{fmtP(p.mrrChange)}</span>}
                  </div>
                  <div>
                    <div className="label-xs" style={{ marginBottom: 2 }}>Users</div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--m)" }}>{fmtU(p.mau)}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", color: p.mauChange >= 0 ? "var(--g)" : "var(--r)", marginLeft: 4 }}>{fmtP(p.mauChange)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SentiBar s={p.sentiment} />
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

      {sel && <DetailPanel p={sel} onClose={() => setSel(null)} />}
      {apply && <ApplyModal onClose={() => setApply(false)} />}
    </div>
  );
}
