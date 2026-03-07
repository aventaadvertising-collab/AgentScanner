"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { REGISTRY } from "@/lib/pipeline/registry";
import { CommitHeatmap } from "@/app/components/CommitHeatmap";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// TERMINAL PULSE — Multi-Signal Live Activity Monitor
// Spectrogram matrix + composite pulse scoring + cross-source
// event stream + category-level intelligence
// ============================================================

// ── Color scale (teal, 5 levels) ──
const LEVELS = [
  "rgba(255,255,255,.03)",
  "rgba(45,212,191,.15)",
  "rgba(45,212,191,.35)",
  "rgba(45,212,191,.55)",
  "rgba(45,212,191,.85)",
];

function getLevel(count, max) {
  if (!count) return 0;
  if (max <= 0) return 1;
  const pct = count / max;
  if (pct > 0.75) return 4;
  if (pct > 0.5) return 3;
  if (pct > 0.25) return 2;
  return 1;
}

// ── Source colors for cross-source badges ──
const SOURCE_META = {
  hackernews:        { bg: "rgba(255,102,0,.12)",  fg: "#FF6600", label: "HN" },
  producthunt:       { bg: "rgba(218,85,47,.12)",  fg: "#DA552F", label: "PH" },
  reddit:            { bg: "rgba(255,69,0,.12)",   fg: "#FF4500", label: "RD" },
  github:            { bg: "rgba(45,212,191,.10)", fg: "#2DD4BF", label: "GH" },
  "github-trending": { bg: "rgba(45,212,191,.10)", fg: "#2DD4BF", label: "GT" },
  "github-momentum": { bg: "rgba(45,212,191,.15)", fg: "#2DD4BF", label: "GM" },
  npm:               { bg: "rgba(203,56,55,.12)",  fg: "#CB3837", label: "NPM" },
  pypi:              { bg: "rgba(53,114,165,.12)", fg: "#3572A5", label: "PY" },
  huggingface:       { bg: "rgba(255,213,0,.12)",  fg: "#FFD500", label: "HF" },
  arxiv:             { bg: "rgba(178,34,34,.12)",  fg: "#B22222", label: "AX" },
  devto:             { bg: "rgba(59,73,223,.12)",  fg: "#3B49DF", label: "DV" },
  lobsters:          { bg: "rgba(156,0,0,.12)",    fg: "#9C0000", label: "LB" },
};

const FEED_SOURCES = [
  { key: "ALL", label: "ALL" },
  { key: "hackernews", label: "HN" },
  { key: "producthunt", label: "PH" },
  { key: "github", label: "GH" },
  { key: "reddit", label: "RD" },
  { key: "npm", label: "NPM" },
  { key: "huggingface", label: "HF" },
];

// ── Helpers ──

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return "now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function recentTotal(weeks, n = 4) {
  if (!weeks || weeks.length < n) return 0;
  return weeks.slice(-n).reduce((s, w) => s + w.t, 0);
}

function getTrend(weeks) {
  if (!weeks || weeks.length < 8) return null;
  const recent = weeks.slice(-4).reduce((s, w) => s + w.t, 0);
  const prev = weeks.slice(-8, -4).reduce((s, w) => s + w.t, 0);
  if (prev === 0 && recent === 0) return null;
  if (prev === 0) return { dir: "up", pct: 100 };
  const change = Math.round(((recent - prev) / prev) * 100);
  return { dir: change >= 0 ? "up" : "down", pct: Math.abs(change) };
}

function getMomentumScore(weeks) {
  if (!weeks || weeks.length < 8) return 0;
  const recent = weeks.slice(-4).reduce((s, w) => s + w.t, 0);
  const prev = weeks.slice(-8, -4).reduce((s, w) => s + w.t, 0);
  if (prev === 0) return recent > 0 ? 999 : 0;
  return recent / prev;
}

function getLast21Days(weeks) {
  if (!weeks || weeks.length < 3) return null;
  const last3 = weeks.slice(-3);
  const days = [];
  for (const wk of last3) {
    for (let d = 0; d < 7; d++) days.push(wk.d?.[d] || 0);
  }
  return days.slice(-21);
}

// ── Signal matching: map scanner discoveries to registry products ──

function buildSignalIndex(products) {
  const map = new Map();
  for (const p of products) {
    if (p.repo) {
      map.set(`repo:${p.repo.toLowerCase()}`, p.id);
      const repoName = p.repo.split("/")[1]?.toLowerCase();
      if (repoName) map.set(`reponame:${repoName}`, p.id);
    }
    map.set(`name:${p.name.toLowerCase()}`, p.id);
    map.set(`id:${p.id}`, p.id);
  }
  // Add website domains
  for (const entry of REGISTRY) {
    if (entry.w) {
      try {
        const host = new URL(entry.w).hostname.replace(/^www\./, "");
        map.set(`domain:${host}`, entry.id);
      } catch { /* skip invalid */ }
    }
  }
  return map;
}

function matchDiscovery(d, idx) {
  // Try GitHub repo from external_id
  const ghExt = d.external_id?.match(/^(?:github|gh-momentum|gh-trending):(.+)/);
  if (ghExt) {
    const hit = idx.get(`repo:${ghExt[1].toLowerCase()}`);
    if (hit) return hit;
  }
  // Try GitHub repo from URL
  const ghUrl = d.url?.match(/github\.com\/([^/]+\/[^/]+)/);
  if (ghUrl) {
    const hit = idx.get(`repo:${ghUrl[1].toLowerCase().replace(/\.git$/, "")}`);
    if (hit) return hit;
  }
  // Try npm/pypi package name
  const pkg = d.external_id?.match(/^(?:npm|pypi):(.+)/);
  if (pkg) {
    const name = pkg[1].toLowerCase();
    const hit = idx.get(`reponame:${name}`) || idx.get(`id:${name}`);
    if (hit) return hit;
  }
  // Try name match
  if (d.name) {
    const hit = idx.get(`name:${d.name.toLowerCase().trim()}`);
    if (hit) return hit;
  }
  // Try URL domain
  if (d.url) {
    try {
      const host = new URL(d.url).hostname.replace(/^www\./, "");
      const hit = idx.get(`domain:${host}`);
      if (hit) return hit;
    } catch { /* skip */ }
  }
  return null;
}

// ── Composite pulse score ──

function computePulseScore(commitMomentum, signals) {
  const commitScore = Math.min((commitMomentum === 999 ? 5 : commitMomentum) / 5, 1);
  const hnUp = (signals?.hn || []).reduce((s, d) => s + (d.upvotes || 0), 0);
  const hnScore = Math.min(hnUp / 100, 1);
  const phUp = (signals?.ph || []).reduce((s, d) => s + (d.upvotes || 0), 0);
  const phScore = Math.min(phUp / 200, 1);
  const rdCount = (signals?.reddit || []).length;
  const rdScore = Math.min(rdCount / 5, 1);
  const ghStars = (signals?.github || []).reduce((s, d) => s + (d.stars || 0), 0);
  const ghScore = Math.min(ghStars / 500, 1);
  const dl = [...(signals?.npm || []), ...(signals?.pypi || [])].reduce((s, d) => s + (d.downloads || 0), 0);
  const dlScore = Math.min(dl / 10000, 1);

  const raw = commitScore * 0.35 + hnScore * 0.20 + phScore * 0.15 + rdScore * 0.10 + ghScore * 0.10 + dlScore * 0.10;
  const active = [commitMomentum > 0, hnUp > 0, phUp > 0, rdCount > 0, ghStars > 0, dl > 0].filter(Boolean).length;
  const breadth = 1 + (active - 1) * 0.1;

  return {
    pulse: Math.min(raw * breadth, 1),
    active,
    hn: hnUp, ph: phUp, rd: rdCount, gh: ghStars, dl,
  };
}

// ────────────────────────────────────────────
// Source Badge
// ────────────────────────────────────────────
function SourceBadge({ source }) {
  const s = SOURCE_META[source] || { bg: "rgba(255,255,255,.06)", fg: "var(--t3)", label: (source || "?").slice(0, 2).toUpperCase() };
  return (
    <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "var(--m)", padding: "1px 4px", borderRadius: 2, background: s.bg, color: s.fg, letterSpacing: ".04em", flexShrink: 0, lineHeight: 1.4 }}>
      {s.label}
    </span>
  );
}

// ── Signal dots for product rows ──
function SignalDots({ signals }) {
  if (!signals) return null;
  const dots = [];
  if (signals.hn?.length) dots.push({ c: "#FF6600", t: `HN ${signals.hn.reduce((s, d) => s + (d.upvotes || 0), 0)} pts` });
  if (signals.ph?.length) dots.push({ c: "#DA552F", t: `PH ${signals.ph.reduce((s, d) => s + (d.upvotes || 0), 0)} votes` });
  if (signals.reddit?.length) dots.push({ c: "#FF4500", t: `${signals.reddit.length} Reddit` });
  if (signals.github?.length) dots.push({ c: "#2DD4BF", t: `GH ${signals.github.reduce((s, d) => s + (d.stars || 0), 0)} stars` });
  if (signals.npm?.length || signals.pypi?.length) dots.push({ c: "#CB3837", t: "pkg" });
  if (dots.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
      {dots.map((d, i) => (
        <span key={i} title={d.t} style={{ width: 3, height: 3, borderRadius: "50%", background: d.c, opacity: 0.8 }} />
      ))}
    </div>
  );
}

// ── Smooth cubic spline helper (monotone) ──
function splinePath(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const tension = 0.35;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// ────────────────────────────────────────────
// SpectrogramStrip — Smooth live sparkline chart
// Cubic-spline area chart with glow, live dot, hi/lo markers
// ────────────────────────────────────────────
function SpectrogramStrip({ days, width = 420, height = 28, showToday = true }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const avg = days.reduce((s, v) => s + v, 0) / days.length;
  const n = days.length;
  const padX = 2, padT = 3, padB = 2;
  const chartH = height - padT - padB;
  const stepX = (width - padX * 2) / (n - 1 || 1);

  // Build point array
  const pts = days.map((v, i) => ({
    x: padX + i * stepX,
    y: padT + chartH - (v / max) * chartH,
    v,
  }));

  // Find hi/lo indices
  let hiIdx = 0, loIdx = 0;
  for (let i = 1; i < n; i++) {
    if (days[i] > days[hiIdx]) hiIdx = i;
    if (days[i] < days[loIdx] && days[i] >= 0) loIdx = i;
  }

  const linePath = splinePath(pts);
  const areaPath = `${linePath}L${pts[n - 1].x},${padT + chartH}L${pts[0].x},${padT + chartH}Z`;
  const lastPt = pts[n - 1];
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 4 }}>
      <defs>
        <linearGradient id={`ag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,.22)" />
          <stop offset="60%" stopColor="rgba(45,212,191,.06)" />
          <stop offset="100%" stopColor="rgba(45,212,191,.0)" />
        </linearGradient>
        <filter id={`gl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`lg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(45,212,191,.6)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={width} height={height} rx={4} fill="rgba(255,255,255,.012)" />

      {/* Average line */}
      {avg > 0 && (() => {
        const avgY = padT + chartH - (avg / max) * chartH;
        return <line x1={padX} y1={avgY} x2={width - padX} y2={avgY} stroke="rgba(242,242,247,.05)" strokeWidth={0.5} strokeDasharray="2,3" />;
      })()}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#ag-${uid})`} />

      {/* Glow line */}
      <path d={linePath} fill="none" stroke="rgba(45,212,191,.15)" strokeWidth={3} filter={`url(#gl-${uid})`} />

      {/* Main line */}
      <path d={linePath} fill="none" stroke="rgba(45,212,191,.7)" strokeWidth={1.2} strokeLinecap="round" />

      {/* Hi marker */}
      {days[hiIdx] > avg && (
        <g>
          <circle cx={pts[hiIdx].x} cy={pts[hiIdx].y} r={2} fill="none" stroke="rgba(45,212,191,.5)" strokeWidth={0.6} />
          <circle cx={pts[hiIdx].x} cy={pts[hiIdx].y} r={0.8} fill="rgba(45,212,191,.9)" />
        </g>
      )}

      {/* Lo marker */}
      {days[loIdx] < avg && loIdx !== hiIdx && days[loIdx] > 0 && (
        <circle cx={pts[loIdx].x} cy={pts[loIdx].y} r={0.8} fill="rgba(220,38,38,.5)" />
      )}

      {/* Live dot at end */}
      {showToday && (
        <g>
          <circle cx={lastPt.x} cy={lastPt.y} r={5} fill={`url(#lg-${uid})`}>
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastPt.x} cy={lastPt.y} r={1.8} fill="#2DD4BF" />
          {/* Horizontal scan line from live dot */}
          <line x1={padX} y1={lastPt.y} x2={lastPt.x - 4} y2={lastPt.y} stroke="rgba(45,212,191,.08)" strokeWidth={0.5} strokeDasharray="1,2" />
        </g>
      )}
    </svg>
  );
}

function MicroStrip({ days, width = 120, height = 14 }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const last10 = days.slice(-10);
  const n = last10.length;
  const pad = 2;
  const chartH = height - pad * 2;
  const stepX = (width - pad * 2) / (n - 1 || 1);

  const pts = last10.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + chartH - (v / max) * chartH,
  }));

  const linePath = splinePath(pts);
  const areaPath = `${linePath}L${pts[n - 1].x},${pad + chartH}L${pts[0].x},${pad + chartH}Z`;
  const lastPt = pts[n - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 2 }}>
      <defs>
        <linearGradient id="micro-ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,.15)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#micro-ag)" />
      <path d={linePath} fill="none" stroke="rgba(45,212,191,.6)" strokeWidth={1} strokeLinecap="round" />
      <circle cx={lastPt.x} cy={lastPt.y} r={1.2} fill="#2DD4BF" />
    </svg>
  );
}

// ────────────────────────────────────────────
// Weekly Pulse Chart — expanded row live area chart
// 52-week smooth line with volume bars, MA, glow
// ────────────────────────────────────────────
function WeeklyPulseChart({ weeks, width = 600, height = 80 }) {
  if (!weeks || weeks.length < 4) return null;
  const n = Math.min(weeks.length, 52);
  const recent = weeks.slice(-n);
  const maxT = Math.max(...recent.map(w => w.t), 1);
  const pad = 4;
  const labelH = 10;
  const chartH = height - pad * 2 - labelH;
  const stepX = (width - pad * 2 - 20) / (n - 1 || 1); // 20px left for y-labels
  const ox = pad + 20; // origin x after labels

  const weekTotals = recent.map(w => w.t);

  // Data points for the main line
  const pts = weekTotals.map((t, i) => ({
    x: ox + i * stepX,
    y: pad + chartH - (t / maxT) * chartH,
    v: t,
  }));

  // 4-week moving average
  const maPts = weekTotals.map((_, i) => {
    const start = Math.max(0, i - 3);
    const slice = weekTotals.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
    return { x: ox + i * stepX, y: pad + chartH - (avg / maxT) * chartH };
  });

  const linePath = splinePath(pts);
  const areaPath = `${linePath}L${pts[n - 1].x},${pad + chartH}L${pts[0].x},${pad + chartH}Z`;
  const maLinePath = splinePath(maPts);
  const lastPt = pts[n - 1];
  const uid = useMemo(() => "wk" + Math.random().toString(36).slice(2, 8), []);

  // Volume bars (thin, behind the line)
  const barW = Math.max(stepX * 0.4, 1.5);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 6, background: "rgba(255,255,255,.012)" }}>
      <defs>
        <linearGradient id={`wag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,.16)" />
          <stop offset="50%" stopColor="rgba(45,212,191,.04)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </linearGradient>
        <filter id={`wgl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`wlg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(45,212,191,.7)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </radialGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(pct => {
        const y = pad + chartH - pct * chartH;
        return <line key={pct} x1={ox} y1={y} x2={width - pad} y2={y} stroke="rgba(255,255,255,.03)" strokeWidth={0.5} />;
      })}

      {/* Y-axis labels */}
      <text x={pad} y={pad + 6} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">{maxT}</text>
      <text x={pad} y={pad + chartH * 0.5 + 2} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">{Math.round(maxT / 2)}</text>
      <text x={pad} y={pad + chartH} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">0</text>

      {/* Volume bars behind */}
      {weekTotals.map((t, i) => {
        const barH = Math.max((t / maxT) * chartH, 0.5);
        const x = ox + i * stepX - barW / 2;
        const y = pad + chartH - barH;
        const alpha = t > 0 ? 0.04 + (t / maxT) * 0.08 : 0.01;
        return <rect key={i} x={x} y={y} width={barW} height={barH} rx={0.5} fill={`rgba(45,212,191,${alpha})`} />;
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#wag-${uid})`} />

      {/* MA line (dimmer, dashed) */}
      <path d={maLinePath} fill="none" stroke="rgba(242,242,247,.12)" strokeWidth={0.8} strokeDasharray="3,2" strokeLinecap="round" />

      {/* Glow line */}
      <path d={linePath} fill="none" stroke="rgba(45,212,191,.12)" strokeWidth={4} filter={`url(#wgl-${uid})`} />

      {/* Main line */}
      <path d={linePath} fill="none" stroke="rgba(45,212,191,.75)" strokeWidth={1.4} strokeLinecap="round" />

      {/* Live dot */}
      <circle cx={lastPt.x} cy={lastPt.y} r={6} fill={`url(#wlg-${uid})`}>
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.25;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={lastPt.x} cy={lastPt.y} r={2.2} fill="#2DD4BF" />

      {/* Horizontal price line from live dot */}
      <line x1={ox} y1={lastPt.y} x2={lastPt.x - 5} y2={lastPt.y} stroke="rgba(45,212,191,.06)" strokeWidth={0.5} strokeDasharray="1,2" />
      {/* Value label at live dot */}
      <rect x={lastPt.x + 4} y={lastPt.y - 5} width={20} height={10} rx={2} fill="rgba(45,212,191,.12)" />
      <text x={lastPt.x + 6} y={lastPt.y + 2} fill="#2DD4BF" fontSize="6" fontWeight="700" fontFamily="var(--m)">{weekTotals[n - 1]}</text>

      {/* Month labels at bottom */}
      {(() => {
        const labels = [];
        let lastMonth = -1;
        for (let i = 0; i < n; i++) {
          const d = new Date(recent[i].w * 1000);
          const m = d.getMonth();
          if (m !== lastMonth) {
            labels.push({ x: ox + i * stepX, label: ["J","F","M","A","M","J","J","A","S","O","N","D"][m] });
            lastMonth = m;
          }
        }
        return labels.map((l, i) => (
          <text key={i} x={l.x} y={height - 1} fill="var(--t4)" fontSize="5.5" fontFamily="var(--m)">{l.label}</text>
        ));
      })()}
    </svg>
  );
}

function ShimmerStrip({ width = 420, height = 28 }) {
  return (
    <div style={{ width, height, borderRadius: 4, background: "rgba(255,255,255,.012)", overflow: "hidden", position: "relative" }}>
      <div style={{ width: "30%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(45,212,191,.06), transparent)", position: "absolute", animation: "scan 2s ease-in-out infinite" }} />
    </div>
  );
}

// ────────────────────────────────────────────
// Product Row — single line in the matrix
// ────────────────────────────────────────────
function ProductRow({ product, data, rank, expanded, onToggle, signals, pulseData }) {
  const weeks = data?.weeks || null;
  const status = data?.status || "pending";
  const errorMsg = data?.error || null;

  const days21 = useMemo(() => getLast21Days(weeks), [weeks]);
  const momentum = useMemo(() => getMomentumScore(weeks), [weeks]);
  const trend = useMemo(() => getTrend(weeks), [weeks]);
  const total4wk = useMemo(() => recentTotal(weeks, 4), [weeks]);
  const todayCommits = days21 ? days21[days21.length - 1] : 0;

  const pulse = pulseData?.pulse || 0;
  const isHot = pulse > 0.3 || momentum > 1.5;
  const isSurging = pulse > 0.5 || momentum > 2;

  return (
    <div>
      <div className="pulse-row" onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 0,
          padding: "6px 16px 6px 0",
          borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,.03)",
          cursor: "pointer", transition: "background .15s", position: "relative",
          borderLeft: isSurging ? "2px solid rgba(45,212,191,.5)" : isHot ? "2px solid rgba(45,212,191,.2)" : "2px solid transparent",
        }}>
        {/* Rank */}
        <span style={{ width: 32, textAlign: "right", fontSize: 10, fontFamily: "var(--m)", color: rank <= 3 && status === "loaded" ? "var(--g)" : "var(--t4)", fontWeight: rank <= 3 && status === "loaded" ? 700 : 400, flexShrink: 0, paddingRight: 10 }}>
          {status === "loaded" ? rank : "\u00B7\u00B7"}
        </span>

        {/* Name + Category + Signal dots */}
        <div className="row-name" style={{ width: 160, flexShrink: 0, minWidth: 0, paddingRight: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-.01em" }}>
            {product.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.category}
            </span>
            <SignalDots signals={signals} />
          </div>
        </div>

        {/* Spectrogram */}
        <div className="row-spectrogram" style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
          {status === "pending" || status === "loading" ? (
            <ShimmerStrip width={380} height={28} />
          ) : status === "error" ? (
            <div style={{ height: 28, borderRadius: 4, background: "rgba(220,38,38,.04)", display: "flex", alignItems: "center", paddingLeft: 8 }}>
              <span style={{ fontSize: 9, color: "rgba(220,38,38,.5)", fontFamily: "var(--m)" }}>{errorMsg || "failed"}</span>
            </div>
          ) : days21 ? (
            <SpectrogramStrip days={days21} width={380} height={28} />
          ) : (
            <div style={{ height: 28, borderRadius: 4, background: "rgba(255,255,255,.02)" }} />
          )}
        </div>

        {/* Pulse */}
        <div style={{ width: 48, flexShrink: 0, textAlign: "right", paddingRight: 10 }}>
          {status === "loaded" && pulse > 0 ? (
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--m)",
              padding: "1px 5px", borderRadius: 3,
              color: pulse > 0.5 ? "var(--g)" : pulse > 0.2 ? "var(--t1)" : "var(--t3)",
              background: `rgba(45,212,191,${Math.min(pulse * 0.15, 0.12)})`,
            }}>
              {pulse.toFixed(2)}
            </span>
          ) : (
            <span style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t4)" }}>{status === "loaded" ? "0" : "\u2013"}</span>
          )}
        </div>

        {/* Today */}
        <div style={{ width: 40, flexShrink: 0, textAlign: "right", paddingRight: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: todayCommits > 0 ? "var(--g)" : "var(--t4)" }}>
            {status === "loaded" ? todayCommits : "\u2013"}
          </span>
        </div>

        {/* 4wk total */}
        <div style={{ width: 48, flexShrink: 0, textAlign: "right", paddingRight: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--m)", color: total4wk > 0 ? "var(--t1)" : "var(--t4)" }}>
            {status === "loaded" ? total4wk : "\u2013"}
          </span>
        </div>

        {/* Trend */}
        <div style={{ width: 56, flexShrink: 0, textAlign: "right" }}>
          {trend ? (
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--m)",
              color: trend.dir === "up" ? "var(--up)" : "var(--dn)",
              padding: "1px 5px", borderRadius: 3,
              background: trend.dir === "up" ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)",
            }}>
              {trend.dir === "up" ? "\u2191" : "\u2193"}{trend.pct}%
            </span>
          ) : status === "loaded" ? (
            <span style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t4)" }}>\u2013</span>
          ) : null}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && weeks && (
        <div style={{ padding: "12px 16px 16px 42px", background: "var(--s1)", borderBottom: "1px solid var(--b1)", borderLeft: "2px solid rgba(45,212,191,.3)", animation: "fi .25s ease" }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Repo</span>
              <a href={`https://github.com/${product.repo}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: "var(--m)", color: "var(--g)", textDecoration: "none" }}>{product.repo}</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Pulse</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: pulse > 0.3 ? "var(--g)" : "var(--t1)" }}>{pulse.toFixed(2)} ({pulseData?.active || 0}s)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Momentum</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: momentum > 1.5 ? "var(--g)" : "var(--t1)" }}>
                {momentum === 999 ? "NEW" : momentum > 0 ? `${momentum.toFixed(1)}x` : "\u2013"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Today</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: todayCommits > 0 ? "var(--g)" : "var(--t3)" }}>{todayCommits}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>4wk</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{total4wk}</span>
            </div>
          </div>

          {/* Signal breakdown */}
          {signals && pulseData && pulseData.active > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "6px 0", borderTop: "1px solid var(--b1)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)", lineHeight: "20px" }}>SIGNALS</span>
              {pulseData.hn > 0 && <span style={{ fontSize: 9, fontFamily: "var(--m)", padding: "2px 6px", borderRadius: 3, background: "rgba(255,102,0,.08)", color: "#FF6600" }}>HN {pulseData.hn}pts</span>}
              {pulseData.ph > 0 && <span style={{ fontSize: 9, fontFamily: "var(--m)", padding: "2px 6px", borderRadius: 3, background: "rgba(218,85,47,.08)", color: "#DA552F" }}>PH {pulseData.ph}v</span>}
              {pulseData.rd > 0 && <span style={{ fontSize: 9, fontFamily: "var(--m)", padding: "2px 6px", borderRadius: 3, background: "rgba(255,69,0,.08)", color: "#FF4500" }}>Reddit {pulseData.rd}</span>}
              {pulseData.gh > 0 && <span style={{ fontSize: 9, fontFamily: "var(--m)", padding: "2px 6px", borderRadius: 3, background: "rgba(45,212,191,.08)", color: "#2DD4BF" }}>GH {pulseData.gh} stars</span>}
              {pulseData.dl > 0 && <span style={{ fontSize: 9, fontFamily: "var(--m)", padding: "2px 6px", borderRadius: 3, background: "rgba(203,56,55,.08)", color: "#CB3837" }}>{pulseData.dl} dl</span>}
            </div>
          )}

          {/* Weekly pulse chart — 52-week asset-style view */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)", display: "block", marginBottom: 4 }}>WEEKLY ACTIVITY</span>
            <WeeklyPulseChart weeks={weeks} width={560} height={72} />
          </div>

          <CommitHeatmap weeks={weeks} fetchedAt={data?.fetched_at} />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Top Movers Ribbon
// ────────────────────────────────────────────
function TopMoversRibbon({ movers }) {
  if (!movers || movers.length === 0) return null;
  return (
    <div style={{ borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.6)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 16px", height: 34, overflowX: "auto", overflowY: "hidden" }} className="movers-ribbon">
        <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".08em", marginRight: 10, whiteSpace: "nowrap", flexShrink: 0 }}>TOP MOVERS</span>
        {movers.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRight: "1px solid rgba(255,255,255,.04)", whiteSpace: "nowrap", flexShrink: 0, animation: `fi .3s ease ${i * 0.04}s both` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t1)", letterSpacing: "-.01em" }}>{m.name}</span>
            {m.days21 && <MicroStrip days={m.days21} width={50} height={7} />}
            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: m.trend?.dir === "up" ? "var(--up)" : m.trend?.dir === "down" ? "var(--dn)" : "var(--t3)" }}>
              {m.trend ? `${m.trend.dir === "up" ? "\u2191" : "\u2193"}${m.trend.pct}%` : "\u2013"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Category Pulse Strip
// ────────────────────────────────────────────
function CategoryPulseStrip({ categories, activeCat, onSelect }) {
  if (!categories || categories.length === 0) return null;
  const maxP = Math.max(...categories.map((c) => c.totalPulse), 0.01);
  return (
    <div style={{ borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.4)", padding: "5px 16px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }} className="movers-ribbon">
        <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".08em", marginRight: 10, whiteSpace: "nowrap", flexShrink: 0 }}>SECTORS</span>
        {categories.map((c, i) => {
          const barW = Math.max((c.totalPulse / maxP) * 28, 3);
          const isActive = activeCat === c.name;
          return (
            <div key={c.name} onClick={() => onSelect(isActive ? "All" : c.name)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 3,
              background: isActive ? "rgba(45,212,191,.06)" : "rgba(255,255,255,.02)",
              border: isActive ? "1px solid rgba(45,212,191,.15)" : "1px solid rgba(255,255,255,.03)",
              whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", transition: "all .15s",
              animation: `fi .3s ease ${i * 0.03}s both`,
            }}>
              <div style={{ width: 28, height: 3, borderRadius: 1, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                <div style={{ width: barW, height: "100%", borderRadius: 1, background: "var(--g)", opacity: 0.5 + (c.totalPulse / maxP) * 0.5 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? "var(--g)" : "var(--t2)" }}>{c.name}</span>
              <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)" }}>{c.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Event Feed Card — cross-source sidebar entry
// ────────────────────────────────────────────
function EventFeedCard({ event, index }) {
  const isNew = event.discovered_at && (Date.now() - new Date(event.discovered_at).getTime()) < 600_000;
  const traction = event.upvotes > 0 ? `${event.upvotes}pts` : event.stars > 0 ? `${event.stars >= 1000 ? (event.stars / 1000).toFixed(1) + "k" : event.stars}\u2605` : event.downloads > 0 ? `${event.downloads}dl` : null;

  return (
    <div style={{
      padding: "5px 8px", borderRadius: 4, background: "var(--s1)",
      border: "1px solid var(--b1)", borderLeft: isNew ? "2px solid var(--g)" : "1px solid var(--b1)",
      animation: `fi .25s ease ${Math.min(index * 0.03, 0.2)}s both`, transition: "all .15s",
    }} className="feed-card">
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <SourceBadge source={event.source} />
        {isNew && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite" }} />}
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{event.name}</span>
        <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", flexShrink: 0 }}>
          {event.discovered_at ? timeAgo(event.discovered_at) : ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {traction && <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)" }}>{traction}</span>}
        {event.category && <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)" }}>{event.category}</span>}
        {event.language && <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)" }}>{event.language}</span>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Fetch Queue — 8 concurrent
// ────────────────────────────────────────────
function useFetchQueue(repos) {
  const [dataMap, setDataMap] = useState({});
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const queueRef = useRef([]);
  const activeRef = useRef(0);
  const startedRef = useRef(false);
  const CONCURRENCY = 8;

  const processNext = useCallback(() => {
    while (activeRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const { repo, id } = queueRef.current.shift();
      activeRef.current++;
      setDataMap((prev) => ({ ...prev, [id]: { ...prev[id], status: "loading" } }));
      fetch(`/api/commit-activity?repo=${encodeURIComponent(repo)}`)
        .then((r) => r.json().catch(() => ({ weeks: null, error: `http_${r.status}` })))
        .then((d) => {
          if (d?.weeks) {
            setDataMap((prev) => ({ ...prev, [id]: { weeks: d.weeks, fetched_at: d.fetched_at, status: "loaded", source: d.source } }));
          } else {
            setDataMap((prev) => ({ ...prev, [id]: { status: "error", error: d?.error || "no_weeks" } }));
            setProgress((p) => ({ ...p, errors: p.errors + 1 }));
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        })
        .catch((err) => {
          setDataMap((prev) => ({ ...prev, [id]: { status: "error", error: err.message } }));
          setProgress((p) => ({ ...p, done: p.done + 1, errors: p.errors + 1 }));
        })
        .finally(() => { activeRef.current--; processNext(); });
    }
  }, []);

  useEffect(() => {
    if (startedRef.current || !repos || repos.length === 0) return;
    startedRef.current = true;
    queueRef.current = repos.map((p) => ({ repo: p.repo, id: p.id }));
    setProgress({ done: 0, total: repos.length, errors: 0 });
    setDataMap(Object.fromEntries(repos.map((p) => [p.id, { status: "pending" }])));
    processNext();
  }, [repos, processNext]);

  return { dataMap, progress };
}

// ────────────────────────────────────────────
// Main: Terminal Pulse
// ────────────────────────────────────────────
export default function ActivityClient() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [tick, setTick] = useState(0);
  const [feedSource, setFeedSource] = useState("ALL");

  // Scanner signals + event feed
  const [scannerSignals, setScannerSignals] = useState({});
  const [eventFeed, setEventFeed] = useState([]);

  // Build product list
  const products = useMemo(() => {
    return REGISTRY.filter((p) => p.g).map((p) => ({ id: p.id, name: p.name, category: p.cat, repo: `${p.g.o}/${p.g.r}` }));
  }, []);

  // Signal index for matching discoveries to products
  const signalIndex = useMemo(() => buildSignalIndex(products), [products]);

  // Fetch queue — 8 concurrent
  const { dataMap, progress } = useFetchQueue(products);

  // ── Fetch ALL scanner discoveries (multi-source) ──
  useEffect(() => {
    fetch("/api/scanner?limit=300&fresh=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.discoveries) return;
        // Group by matched product for composite scoring
        const signals = {};
        for (const d of data.discoveries) {
          const pid = matchDiscovery(d, signalIndex);
          if (!pid) continue;
          if (!signals[pid]) signals[pid] = { hn: [], ph: [], reddit: [], github: [], npm: [], pypi: [], hf: [] };
          const bucket = { hackernews: "hn", producthunt: "ph", reddit: "reddit", github: "github", "github-trending": "github", "github-momentum": "github", npm: "npm", pypi: "pypi", huggingface: "hf" }[d.source];
          if (bucket && signals[pid][bucket]) signals[pid][bucket].push(d);
        }
        setScannerSignals(signals);
        // Use same data for event feed (sorted by discovered_at)
        const sorted = [...data.discoveries].sort((a, b) => new Date(b.discovered_at || 0) - new Date(a.discovered_at || 0));
        setEventFeed(sorted.slice(0, 100));
      })
      .catch(() => {});
  }, [signalIndex]);

  // ── Supabase real-time: ALL scanner discovery inserts ──
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("pulse-all-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scanner_discoveries" }, (payload) => {
        setEventFeed((prev) => {
          const id = payload.new.id || payload.new.external_id;
          if (prev.some((d) => (d.id || d.external_id) === id)) return prev;
          return [payload.new, ...prev].slice(0, 100);
        });
        // Also update scanner signals if it matches a product
        const pid = matchDiscovery(payload.new, signalIndex);
        if (pid) {
          setScannerSignals((prev) => {
            const bucket = { hackernews: "hn", producthunt: "ph", reddit: "reddit", github: "github", "github-trending": "github", "github-momentum": "github", npm: "npm", pypi: "pypi", huggingface: "hf" }[payload.new.source];
            if (!bucket) return prev;
            const existing = prev[pid] || { hn: [], ph: [], reddit: [], github: [], npm: [], pypi: [], hf: [] };
            return { ...prev, [pid]: { ...existing, [bucket]: [payload.new, ...existing[bucket]] } };
          });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [signalIndex]);

  // Background scanner trigger
  useEffect(() => {
    const trigger = () => { fetch("/api/scanner?trigger=1").catch(() => {}); };
    trigger();
    const i = setInterval(trigger, 60_000);
    return () => clearInterval(i);
  }, []);

  // Tick for relative time
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Categories
  const catCounts = useMemo(() => {
    const c = {};
    for (const p of products) if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [products]);
  const topCats = useMemo(() =>
    Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c),
  [catCounts]);

  // ── Enriched products with pulse scoring ──
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const d = dataMap[p.id];
      const weeks = d?.weeks || null;
      const momentum = getMomentumScore(weeks);
      const signals = scannerSignals[p.id] || null;
      const pulseData = computePulseScore(momentum, signals);
      return {
        ...p, data: d, momentum, trend: getTrend(weeks), days21: getLast21Days(weeks),
        total4wk: recentTotal(weeks, 4), status: d?.status || "pending",
        signals, pulseData,
      };
    });
  }, [products, dataMap, scannerSignals]);

  // ── Sort by pulse (loaded first, then pulse desc) ──
  const sorted = useMemo(() => {
    let items = [...enrichedProducts];
    if (cat !== "All") items = items.filter((p) => p.category === cat);
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lq) || p.repo.toLowerCase().includes(lq) || p.category?.toLowerCase().includes(lq));
    }
    items.sort((a, b) => {
      if (a.status === "loaded" && b.status !== "loaded") return -1;
      if (a.status !== "loaded" && b.status === "loaded") return 1;
      return (b.pulseData?.pulse || 0) - (a.pulseData?.pulse || 0);
    });
    return items;
  }, [enrichedProducts, cat, q]);

  // Top movers
  const topMovers = useMemo(() => {
    return enrichedProducts
      .filter((p) => p.status === "loaded" && p.trend && p.total4wk > 0)
      .sort((a, b) => (b.trend?.pct || 0) - (a.trend?.pct || 0))
      .slice(0, 12);
  }, [enrichedProducts]);

  // ── Category pulse aggregation ──
  const categoryPulse = useMemo(() => {
    const cm = {};
    for (const p of enrichedProducts) {
      if (!p.category || p.status !== "loaded") continue;
      if (!cm[p.category]) cm[p.category] = { totalPulse: 0, count: 0 };
      cm[p.category].totalPulse += p.pulseData?.pulse || 0;
      cm[p.category].count++;
    }
    return Object.entries(cm)
      .map(([name, d]) => ({ name, totalPulse: d.totalPulse, count: d.count }))
      .sort((a, b) => b.totalPulse - a.totalPulse)
      .slice(0, 12);
  }, [enrichedProducts]);

  // ── Filtered event feed ──
  const filteredFeed = useMemo(() => {
    let items = eventFeed;
    if (feedSource !== "ALL") {
      // Allow matching source variants (e.g. "github" matches "github-trending", "github-momentum")
      items = items.filter((e) => e.source === feedSource || e.source?.startsWith(feedSource));
    }
    const seen = new Set();
    return items.filter((e) => {
      const key = e.name?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 60);
  }, [eventFeed, feedSource]);

  const pctDone = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const loadedCount = enrichedProducts.filter((p) => p.status === "loaded").length;
  const signalCount = Object.keys(scannerSignals).length;

  void tick;

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--t4": "rgba(242,242,247,.2)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--up": "#16A34A", "--dn": "#DC2626", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .pulse-row:hover { background: rgba(255,255,255,.02) !important; }
        .feed-card:hover { border-color: var(--b2) !important; background: var(--s2) !important; }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .movers-ribbon::-webkit-scrollbar { display: none; }
        .movers-ribbon { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 1024px) {
          .pulse-layout { flex-direction: column !important; }
          .pulse-sidebar { width: 100% !important; position: relative !important; top: auto !important; border-left: none !important; border-bottom: 1px solid var(--b1) !important; height: auto !important; max-height: 220px !important; }
          .pulse-sidebar .feed-list { flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; }
          .pulse-sidebar .feed-list > div { min-width: 200px !important; flex-shrink: 0 !important; }
          .cat-pulse-strip { display: none !important; }
        }
        @media (max-width: 768px) {
          .pulse-header { padding: 0 12px !important; }
          .pulse-toolbar { padding: 6px 12px !important; flex-direction: column !important; gap: 6px !important; }
          .pulse-matrix { padding: 0 !important; }
          .pulse-row { padding: 5px 6px 5px 0 !important; }
          .row-name { width: 100px !important; }
          .row-spectrogram { display: none !important; }
          .movers-ribbon { padding: 0 12px !important; }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header className="pulse-header" style={{ padding: "0 24px", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.92)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div style={{ height: 14, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: "var(--g)", letterSpacing: ".1em" }}>PULSE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {progress.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ width: 28, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 1, background: progress.done < progress.total ? "var(--g)" : "rgba(255,255,255,.12)", transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)" }}>{progress.done}/{progress.total}</span>
            </div>
          )}
          {signalCount > 0 && (
            <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", padding: "2px 6px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
              {signalCount} signals
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 8, fontWeight: 600, color: "var(--t4)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>LIVE</span>
          </div>
          <a href="/dashboard" className="link-hover" style={{ fontSize: 9, fontWeight: 600, color: "var(--t4)", padding: "3px 8px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ fontSize: 9, fontWeight: 600, color: "var(--t4)", padding: "3px 8px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Screener</a>
        </div>
      </header>

      {/* ─── TOP MOVERS ─── */}
      <TopMoversRibbon movers={topMovers} />

      {/* ─── CATEGORY PULSE ─── */}
      <div className="cat-pulse-strip">
        <CategoryPulseStrip categories={categoryPulse} activeCat={cat} onSelect={setCat} />
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="pulse-layout" style={{ display: "flex", position: "relative", zIndex: 1, minHeight: "calc(100vh - 110px)" }}>

        {/* ─── LEFT: SPECTROGRAM MATRIX ─── */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Toolbar */}
          <div className="pulse-toolbar" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--b1)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 3, flex: 1, flexWrap: "wrap" }}>
              <button className={`pill${cat === "All" ? " on" : ""}`} onClick={() => setCat("All")} style={{ padding: "2px 8px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 9, fontWeight: 600, fontFamily: "var(--m)" }}>
                All ({products.length})
              </button>
              {topCats.map((c) => (
                <button key={c} className={`pill${cat === c ? " on" : ""}`} onClick={() => setCat(c)} style={{ padding: "2px 8px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", whiteSpace: "nowrap" }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter..."
                style={{ width: 130, padding: "4px 8px 4px 22px", borderRadius: 3, border: "1px solid var(--b1)", background: "rgba(255,255,255,.02)", color: "var(--t1)", fontSize: 10, fontFamily: "var(--m)", outline: "none" }} />
              <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "var(--t4)", pointerEvents: "none" }}>&#8981;</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", padding: "5px 16px 3px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 32, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>#</span>
            <span className="row-name" style={{ width: 160, fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>PRODUCT</span>
            <span className="row-spectrogram" style={{ flex: 1, fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>21-DAY ACTIVITY</span>
            <span style={{ width: 48, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>PULSE</span>
            <span style={{ width: 40, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>TODAY</span>
            <span style={{ width: 48, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 10 }}>4WK</span>
            <span style={{ width: 56, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em" }}>TREND</span>
          </div>

          {/* Matrix rows */}
          <div className="pulse-matrix" style={{ flex: 1, overflowY: "auto" }}>
            {sorted.map((p, i) => (
              <ProductRow
                key={p.id} product={p} data={dataMap[p.id]} rank={i + 1}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                signals={p.signals} pulseData={p.pulseData}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "6px 16px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 8, color: "var(--t4)", fontFamily: "var(--m)" }}>
              {sorted.length} products · {loadedCount} loaded · {signalCount} with signals
              {progress.errors > 0 && <span style={{ color: "var(--dn)" }}> · {progress.errors} err</span>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 7, color: "var(--t4)", fontFamily: "var(--m)" }}>Less</span>
              {LEVELS.map((c, i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: 1, background: c, display: "inline-block" }} />
              ))}
              <span style={{ fontSize: 7, color: "var(--t4)", fontFamily: "var(--m)" }}>More</span>
            </div>
          </div>
        </main>

        {/* ─── RIGHT: CROSS-SOURCE EVENT STREAM ─── */}
        <aside className="pulse-sidebar" style={{ width: 250, flexShrink: 0, borderLeft: "1px solid var(--b1)", background: "rgba(10,11,16,.5)", position: "sticky", top: 44, height: "calc(100vh - 110px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", letterSpacing: ".1em", color: "var(--t3)" }}>EVENTS</span>
              </div>
              <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)" }}>{filteredFeed.length}</span>
            </div>
            {/* Source filter pills */}
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {FEED_SOURCES.map((s) => (
                <button key={s.key} className={`pill${feedSource === s.key ? " on" : ""}`}
                  onClick={() => setFeedSource(s.key)}
                  style={{ padding: "1px 5px", borderRadius: 2, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t4)", fontSize: 7, fontWeight: 600, fontFamily: "var(--m)" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="feed-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
            {filteredFeed.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", lineHeight: 1.6 }}>
                  {progress.done < progress.total ? "Scanning..." : "No events yet"}
                </div>
              </div>
            ) : filteredFeed.map((event, i) => (
              <EventFeedCard key={event.id || event.external_id || i} event={event} index={i} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
