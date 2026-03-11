"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { REGISTRY } from "@/lib/pipeline/registry";
import { CommitHeatmap } from "@/app/components/CommitHeatmap";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// TERMINAL PULSE — DexScreener-Style AI Tool Trading Terminal
// Green/red sentiment · Candlestick charts · Multi-timeframe
// Marquee ticker · Gainers/Losers · Transaction-style feed
// ============================================================

// ── Trend color system (green=up, red=down) ──
function trendColor(dir) {
  if (dir === "up") return {
    line: "#00C853", glow: "rgba(0,200,83,.15)", area: "rgba(0,200,83,.08)",
    dot: "#00C853", bg: "rgba(0,200,83,.06)", text: "#00C853",
  };
  return {
    line: "#FF1744", glow: "rgba(255,23,68,.15)", area: "rgba(255,23,68,.08)",
    dot: "#FF1744", bg: "rgba(255,23,68,.06)", text: "#FF1744",
  };
}

// ── SVG Icons ──
function ChevronUp({ size = 10, color = "#00C853" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M4 10L8 6L12 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronDown({ size = 10, color = "#FF1744" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M4 6L8 10L12 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  "github-releases": { bg: "rgba(45,212,191,.12)", fg: "#2DD4BF", label: "REL" },
  stackoverflow:     { bg: "rgba(244,128,36,.12)", fg: "#F48024", label: "SO" },
  "github-discussions": { bg: "rgba(130,80,223,.12)", fg: "#8250DF", label: "GD" },
  mastodon:          { bg: "rgba(99,100,255,.12)", fg: "#6364FF", label: "MT" },
};

const FEED_SOURCES = [
  { key: "ALL", label: "ALL" },
  { key: "hackernews", label: "HN" },
  { key: "producthunt", label: "PH" },
  { key: "github", label: "GH" },
  { key: "reddit", label: "RD" },
  { key: "npm", label: "NPM" },
  { key: "huggingface", label: "HF" },
  { key: "stackoverflow", label: "SO" },
  { key: "mastodon", label: "MT" },
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

function get1DChange(weeks) {
  if (!weeks || weeks.length < 1) return null;
  const last = weeks[weeks.length - 1];
  const days = last?.d || [];
  if (days.length < 2) return null;
  const today = days[days.length - 1] || 0;
  const yesterday = days[days.length - 2] || 0;
  if (yesterday === 0 && today === 0) return null;
  if (yesterday === 0) return { dir: "up", pct: 100 };
  const change = Math.round(((today - yesterday) / yesterday) * 100);
  return { dir: change >= 0 ? "up" : "down", pct: Math.abs(change) };
}

function get1WChange(weeks) {
  if (!weeks || weeks.length < 2) return null;
  const recent = weeks[weeks.length - 1]?.t || 0;
  const prev = weeks[weeks.length - 2]?.t || 0;
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

function getVolume7d(weeks) {
  if (!weeks || weeks.length < 1) return 0;
  const last = weeks[weeks.length - 1];
  return last?.t || 0;
}

// ── OHLC derivation from weekly commit data ──
function weekToOHLC(week) {
  const days = week?.d || [];
  if (days.length === 0) return { o: 0, h: 0, l: 0, c: 0, v: week?.t || 0 };
  const o = days[0] || 0;
  const c = days[days.length - 1] || 0;
  const h = Math.max(...days);
  const l = Math.min(...days.filter(d => d >= 0));
  return { o, h, l, c, v: week?.t || 0 };
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
  const ghExt = d.external_id?.match(/^(?:github|gh-momentum|gh-trending):(.+)/);
  if (ghExt) {
    const hit = idx.get(`repo:${ghExt[1].toLowerCase()}`);
    if (hit) return hit;
  }
  const ghUrl = d.url?.match(/github\.com\/([^/]+\/[^/]+)/);
  if (ghUrl) {
    const hit = idx.get(`repo:${ghUrl[1].toLowerCase().replace(/\.git$/, "")}`);
    if (hit) return hit;
  }
  const pkg = d.external_id?.match(/^(?:npm|pypi):(.+)/);
  if (pkg) {
    const name = pkg[1].toLowerCase();
    const hit = idx.get(`reponame:${name}`) || idx.get(`id:${name}`);
    if (hit) return hit;
  }
  if (d.name) {
    const hit = idx.get(`name:${d.name.toLowerCase().trim()}`);
    if (hit) return hit;
  }
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

// ── % change badge ──
function PctBadge({ change, size = 10 }) {
  if (!change) return <span style={{ fontSize: size, fontFamily: "var(--m)", color: "var(--t4)" }}>{"\u2013"}</span>;
  const c = trendColor(change.dir);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1, fontSize: size, fontWeight: 700, fontFamily: "var(--m)", color: c.text }}>
      {change.dir === "up" ? <ChevronUp size={size - 1} color={c.text} /> : <ChevronDown size={size - 1} color={c.text} />}
      {change.pct}%
    </span>
  );
}

// ────────────────────────────────────────────
// SpectrogramStrip — Green/Red live sparkline chart
// ────────────────────────────────────────────
function SpectrogramStrip({ days, width = 420, height = 28, trend }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const avg = days.reduce((s, v) => s + v, 0) / days.length;
  const n = days.length;
  const padX = 2, padT = 3, padB = 2;
  const chartH = height - padT - padB;
  const stepX = (width - padX * 2) / (n - 1 || 1);

  const dir = trend?.dir || (days[days.length - 1] >= days[0] ? "up" : "down");
  const tc = trendColor(dir);

  const pts = days.map((v, i) => ({
    x: padX + i * stepX,
    y: padT + chartH - (v / max) * chartH,
    v,
  }));

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
          <stop offset="0%" stopColor={tc.area.replace(/[\d.]+\)$/, ".22)")} />
          <stop offset="60%" stopColor={tc.area.replace(/[\d.]+\)$/, ".06)")} />
          <stop offset="100%" stopColor={tc.area.replace(/[\d.]+\)$/, ".0)")} />
        </linearGradient>
        <filter id={`gl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`lg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tc.glow.replace(/[\d.]+\)$/, ".6)")} />
          <stop offset="100%" stopColor={tc.glow.replace(/[\d.]+\)$/, "0)")} />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} rx={4} fill="rgba(255,255,255,.012)" />

      {avg > 0 && (() => {
        const avgY = padT + chartH - (avg / max) * chartH;
        return <line x1={padX} y1={avgY} x2={width - padX} y2={avgY} stroke="rgba(242,242,247,.05)" strokeWidth={0.5} strokeDasharray="2,3" />;
      })()}

      <path d={areaPath} fill={`url(#ag-${uid})`} />
      <path d={linePath} fill="none" stroke={tc.glow} strokeWidth={3} filter={`url(#gl-${uid})`} />
      <path d={linePath} fill="none" stroke={tc.line} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />

      {days[hiIdx] > avg && (
        <g>
          <circle cx={pts[hiIdx].x} cy={pts[hiIdx].y} r={2} fill="none" stroke={dir === "up" ? "rgba(0,200,83,.5)" : "rgba(255,23,68,.5)"} strokeWidth={0.6} />
          <circle cx={pts[hiIdx].x} cy={pts[hiIdx].y} r={0.8} fill={tc.line} opacity={0.9} />
        </g>
      )}

      {days[loIdx] < avg && loIdx !== hiIdx && days[loIdx] > 0 && (
        <circle cx={pts[loIdx].x} cy={pts[loIdx].y} r={0.8} fill="rgba(255,23,68,.5)" />
      )}

      <g>
        <circle cx={lastPt.x} cy={lastPt.y} r={5} fill={`url(#lg-${uid})`}>
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={lastPt.x} cy={lastPt.y} r={1.8} fill={tc.dot} />
        <line x1={padX} y1={lastPt.y} x2={lastPt.x - 4} y2={lastPt.y} stroke={tc.glow.replace(/[\d.]+\)$/, ".08)")} strokeWidth={0.5} strokeDasharray="1,2" />
      </g>
    </svg>
  );
}

function MicroStrip({ days, width = 60, height = 16, trend }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const last10 = days.slice(-10);
  const n = last10.length;
  const pad = 2;
  const chartH = height - pad * 2;
  const stepX = (width - pad * 2) / (n - 1 || 1);

  const dir = trend?.dir || (last10[last10.length - 1] >= last10[0] ? "up" : "down");
  const tc = trendColor(dir);

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
        <linearGradient id={`mic-${dir}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tc.area.replace(/[\d.]+\)$/, ".15)")} />
          <stop offset="100%" stopColor={tc.area.replace(/[\d.]+\)$/, "0)")} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#mic-${dir})`} />
      <path d={linePath} fill="none" stroke={tc.line} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
      <circle cx={lastPt.x} cy={lastPt.y} r={1.2} fill={tc.dot} />
    </svg>
  );
}

// ────────────────────────────────────────────
// Candlestick Chart — 12-week OHLC from commit data
// ────────────────────────────────────────────
function CandlestickChart({ weeks, width = 560, height = 180 }) {
  if (!weeks || weeks.length < 4) return null;
  const n = Math.min(weeks.length, 16);
  const recent = weeks.slice(-n);
  const ohlcs = recent.map(weekToOHLC);

  const allVals = ohlcs.flatMap(c => [c.h, c.l]).filter(v => v > 0);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;
  const maxVol = Math.max(...ohlcs.map(c => c.v), 1);

  const pad = { t: 8, b: 20, l: 28, r: 8 };
  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;
  const candleW = chartW / n;
  const bodyW = Math.max(candleW * 0.55, 3);

  const yScale = (v) => pad.t + chartH - ((v - minVal) / range) * chartH;

  const uid = useMemo(() => "ck" + Math.random().toString(36).slice(2, 6), []);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 6, background: "rgba(255,255,255,.012)" }}>
      <defs>
        <filter id={`cg-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(pct => {
        const y = pad.t + chartH * (1 - pct);
        const val = Math.round(minVal + range * pct);
        return (
          <g key={pct}>
            <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="rgba(255,255,255,.03)" strokeWidth={0.5} />
            <text x={pad.l - 4} y={y + 3} fill="var(--t4)" fontSize="6" fontFamily="var(--m)" textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Volume bars (background) */}
      {ohlcs.map((c, i) => {
        const x = pad.l + i * candleW + candleW / 2;
        const barH = Math.max((c.v / maxVol) * chartH * 0.2, 1);
        const isGreen = c.c >= c.o;
        return (
          <rect key={`v${i}`} x={x - bodyW / 2} y={pad.t + chartH - barH} width={bodyW} height={barH}
            fill={isGreen ? "rgba(0,200,83,.06)" : "rgba(255,23,68,.06)"} rx={1} />
        );
      })}

      {/* Candles */}
      {ohlcs.map((c, i) => {
        const x = pad.l + i * candleW + candleW / 2;
        const isGreen = c.c >= c.o;
        const color = isGreen ? "#00C853" : "#FF1744";
        const top = yScale(Math.max(c.o, c.c));
        const bot = yScale(Math.min(c.o, c.c));
        const bodyH = Math.max(bot - top, 1);
        const wickTop = yScale(c.h);
        const wickBot = yScale(c.l);

        return (
          <g key={`c${i}`}>
            {/* Wick */}
            <line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={color} strokeWidth={0.8} opacity={0.6} />
            {/* Body */}
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={1}
              fill={isGreen ? color : "transparent"} stroke={color} strokeWidth={0.8}
              opacity={0.85} filter={i === n - 1 ? `url(#cg-${uid})` : undefined} />
          </g>
        );
      })}

      {/* Week labels */}
      {recent.map((w, i) => {
        if (i % 4 !== 0 && i !== n - 1) return null;
        const x = pad.l + i * candleW + candleW / 2;
        const d = new Date(w.w * 1000);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        return <text key={`l${i}`} x={x} y={height - 4} fill="var(--t4)" fontSize="6" fontFamily="var(--m)" textAnchor="middle">{label}</text>;
      })}
    </svg>
  );
}

// ────────────────────────────────────────────
// Weekly Pulse Chart — green/red live area chart
// ────────────────────────────────────────────
function WeeklyPulseChart({ weeks, width = 560, height = 72, trend }) {
  if (!weeks || weeks.length < 4) return null;
  const n = Math.min(weeks.length, 52);
  const recent = weeks.slice(-n);
  const maxT = Math.max(...recent.map(w => w.t), 1);
  const pad = 4;
  const labelH = 10;
  const chartH = height - pad * 2 - labelH;
  const stepX = (width - pad * 2 - 20) / (n - 1 || 1);
  const ox = pad + 20;

  const dir = trend?.dir || "up";
  const tc = trendColor(dir);
  const weekTotals = recent.map(w => w.t);

  const pts = weekTotals.map((t, i) => ({
    x: ox + i * stepX,
    y: pad + chartH - (t / maxT) * chartH,
    v: t,
  }));

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

  const barW = Math.max(stepX * 0.4, 1.5);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 6, background: "rgba(255,255,255,.012)" }}>
      <defs>
        <linearGradient id={`wag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tc.area.replace(/[\d.]+\)$/, ".16)")} />
          <stop offset="50%" stopColor={tc.area.replace(/[\d.]+\)$/, ".04)")} />
          <stop offset="100%" stopColor={tc.area.replace(/[\d.]+\)$/, "0)")} />
        </linearGradient>
        <filter id={`wgl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`wlg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tc.glow.replace(/[\d.]+\)$/, ".7)")} />
          <stop offset="100%" stopColor={tc.glow.replace(/[\d.]+\)$/, "0)")} />
        </radialGradient>
      </defs>

      {[0.25, 0.5, 0.75].map(pct => {
        const y = pad + chartH - pct * chartH;
        return <line key={pct} x1={ox} y1={y} x2={width - pad} y2={y} stroke="rgba(255,255,255,.03)" strokeWidth={0.5} />;
      })}

      <text x={pad} y={pad + 6} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">{maxT}</text>
      <text x={pad} y={pad + chartH * 0.5 + 2} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">{Math.round(maxT / 2)}</text>
      <text x={pad} y={pad + chartH} fill="var(--t4)" fontSize="6" fontFamily="var(--m)">0</text>

      {weekTotals.map((t, i) => {
        const barH = Math.max((t / maxT) * chartH, 0.5);
        const x = ox + i * stepX - barW / 2;
        const y = pad + chartH - barH;
        const alpha = t > 0 ? 0.04 + (t / maxT) * 0.08 : 0.01;
        return <rect key={i} x={x} y={y} width={barW} height={barH} rx={0.5} fill={tc.area.replace(/[\d.]+\)$/, `${alpha})`)} />;
      })}

      <path d={areaPath} fill={`url(#wag-${uid})`} />
      <path d={maLinePath} fill="none" stroke="rgba(242,242,247,.12)" strokeWidth={0.8} strokeDasharray="3,2" strokeLinecap="round" />
      <path d={linePath} fill="none" stroke={tc.glow} strokeWidth={4} filter={`url(#wgl-${uid})`} />
      <path d={linePath} fill="none" stroke={tc.line} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />

      <circle cx={lastPt.x} cy={lastPt.y} r={6} fill={`url(#wlg-${uid})`}>
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.25;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={lastPt.x} cy={lastPt.y} r={2.2} fill={tc.dot} />

      <line x1={ox} y1={lastPt.y} x2={lastPt.x - 5} y2={lastPt.y} stroke={tc.glow.replace(/[\d.]+\)$/, ".06)")} strokeWidth={0.5} strokeDasharray="1,2" />
      <rect x={lastPt.x + 4} y={lastPt.y - 5} width={20} height={10} rx={2} fill={tc.bg} />
      <text x={lastPt.x + 6} y={lastPt.y + 2} fill={tc.text} fontSize="6" fontWeight="700" fontFamily="var(--m)">{weekTotals[n - 1]}</text>

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
// Product Row — DexScreener-style row
// ────────────────────────────────────────────
function ProductRow({ product, data, rank, expanded, onToggle, signals, pulseData }) {
  const weeks = data?.weeks || null;
  const status = data?.status || "pending";
  const errorMsg = data?.error || null;

  const days21 = useMemo(() => getLast21Days(weeks), [weeks]);
  const momentum = useMemo(() => getMomentumScore(weeks), [weeks]);
  const trend = useMemo(() => getTrend(weeks), [weeks]);
  const change1d = useMemo(() => get1DChange(weeks), [weeks]);
  const change1w = useMemo(() => get1WChange(weeks), [weeks]);
  const total4wk = useMemo(() => recentTotal(weeks, 4), [weeks]);
  const vol7d = useMemo(() => getVolume7d(weeks), [weeks]);

  const pulse = pulseData?.pulse || 0;
  const sigCount = pulseData?.active || 0;
  const isSurging = pulse > 0.5 || momentum > 2;
  const isHot = pulse > 0.3 || momentum > 1.5;

  const trendDir = trend?.dir || "up";

  return (
    <div>
      <div className="pulse-row" onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 0,
          padding: "5px 12px 5px 0",
          borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,.03)",
          cursor: "pointer", transition: "background .15s", position: "relative",
          borderLeft: isSurging ? `2px solid ${trendColor(trendDir).line}55` : isHot ? `2px solid ${trendColor(trendDir).line}33` : "2px solid transparent",
        }}>
        {/* Rank */}
        <span style={{ width: 28, textAlign: "right", fontSize: 10, fontFamily: "var(--m)", color: rank <= 3 && status === "loaded" ? "var(--t1)" : "var(--t4)", fontWeight: rank <= 3 && status === "loaded" ? 700 : 400, flexShrink: 0, paddingRight: 8 }}>
          {status === "loaded" ? rank : "\u00B7\u00B7"}
        </span>

        {/* Name + Category + Signal dots */}
        <div className="row-name" style={{ width: 140, flexShrink: 0, minWidth: 0, paddingRight: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--h)" }}>
            {product.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.category}
            </span>
            <SignalDots signals={signals} />
          </div>
        </div>

        {/* Mini chart */}
        <div className="row-mini-chart" style={{ width: 64, flexShrink: 0, paddingRight: 6 }}>
          {status === "loaded" && days21 ? (
            <MicroStrip days={days21} width={58} height={20} trend={trend} />
          ) : status === "loading" || status === "pending" ? (
            <div style={{ width: 58, height: 20, borderRadius: 2, background: "rgba(255,255,255,.02)" }} />
          ) : null}
        </div>

        {/* Spectrogram (main chart, hidden on smaller screens) */}
        <div className="row-spectrogram" style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          {status === "pending" || status === "loading" ? (
            <ShimmerStrip width={280} height={28} />
          ) : status === "error" ? (
            <div style={{ height: 28, borderRadius: 4, background: "rgba(255,23,68,.04)", display: "flex", alignItems: "center", paddingLeft: 8 }}>
              <span style={{ fontSize: 9, color: "rgba(255,23,68,.5)", fontFamily: "var(--m)" }}>{errorMsg || "failed"}</span>
            </div>
          ) : days21 ? (
            <SpectrogramStrip days={days21} width={280} height={28} trend={trend} />
          ) : (
            <div style={{ height: 28, borderRadius: 4, background: "rgba(255,255,255,.02)" }} />
          )}
        </div>

        {/* Pulse */}
        <div style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
          {status === "loaded" && pulse > 0 ? (
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--m)",
              padding: "1px 4px", borderRadius: 3,
              color: pulse > 0.5 ? "#00C853" : pulse > 0.2 ? "var(--t1)" : "var(--t3)",
              background: pulse > 0.5 ? "rgba(0,200,83,.06)" : pulse > 0.2 ? "rgba(255,255,255,.03)" : "transparent",
            }}>
              {pulse.toFixed(2)}
            </span>
          ) : (
            <span style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t4)" }}>{status === "loaded" ? "0" : "\u2013"}</span>
          )}
        </div>

        {/* 1D% */}
        <div className="row-pct" style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
          {status === "loaded" ? <PctBadge change={change1d} size={9} /> : <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>{"\u2013"}</span>}
        </div>

        {/* 1W% */}
        <div className="row-pct" style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
          {status === "loaded" ? <PctBadge change={change1w} size={9} /> : <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>{"\u2013"}</span>}
        </div>

        {/* 4W% (trend) */}
        <div className="row-pct" style={{ width: 48, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
          {status === "loaded" ? <PctBadge change={trend} size={9} /> : <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>{"\u2013"}</span>}
        </div>

        {/* VOL */}
        <div className="row-vol" style={{ width: 40, flexShrink: 0, textAlign: "right", paddingRight: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", color: vol7d > 0 ? "var(--t2)" : "var(--t4)" }}>
            {status === "loaded" ? (vol7d >= 1000 ? `${(vol7d / 1000).toFixed(1)}k` : vol7d) : "\u2013"}
          </span>
        </div>

        {/* SIGS */}
        <div style={{ width: 32, flexShrink: 0, textAlign: "right" }}>
          {status === "loaded" && sigCount > 0 ? (
            <span style={{
              fontSize: 8, fontWeight: 700, fontFamily: "var(--m)",
              padding: "1px 4px", borderRadius: 8,
              background: sigCount >= 3 ? "rgba(0,200,83,.08)" : "rgba(255,255,255,.04)",
              color: sigCount >= 3 ? "#00C853" : "var(--t3)",
            }}>
              {sigCount}
            </span>
          ) : null}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && weeks && (
        <div style={{ padding: "12px 16px 16px 36px", background: "var(--s1)", borderBottom: "1px solid var(--b1)", borderLeft: `2px solid ${trendColor(trendDir).line}44`, animation: "fi .25s ease" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Repo</span>
              <a href={`https://github.com/${product.repo}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: "var(--m)", color: "#2DD4BF", textDecoration: "none" }}>{product.repo}</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Pulse</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: pulse > 0.3 ? "#00C853" : "var(--t1)" }}>{pulse.toFixed(2)} ({sigCount}s)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>1D / 1W / 4W</span>
              <div style={{ display: "flex", gap: 8 }}>
                <PctBadge change={change1d} size={10} />
                <PctBadge change={change1w} size={10} />
                <PctBadge change={trend} size={10} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Vol (7d)</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{vol7d}</span>
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

          {/* Candlestick chart */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)", display: "block", marginBottom: 4 }}>CANDLESTICK (WEEKLY OHLC)</span>
            <CandlestickChart weeks={weeks} width={560} height={160} />
          </div>

          {/* Weekly pulse chart */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)", display: "block", marginBottom: 4 }}>WEEKLY ACTIVITY</span>
            <WeeklyPulseChart weeks={weeks} width={560} height={72} trend={trend} />
          </div>

          <CommitHeatmap weeks={weeks} fetchedAt={data?.fetched_at} />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Marquee Ticker Tape — scrolling top movers
// ────────────────────────────────────────────
function MarqueeTicker({ movers }) {
  if (!movers || movers.length === 0) return null;
  const items = [...movers, ...movers]; // duplicate for seamless loop
  return (
    <div style={{ borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.6)", overflow: "hidden", height: 28 }}>
      <div className="marquee-track" style={{ display: "flex", alignItems: "center", height: "100%", whiteSpace: "nowrap" }}>
        {items.map((m, i) => {
          const tc = trendColor(m.trend?.dir || "up");
          return (
            <span key={`${m.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0 12px", fontSize: 10, fontFamily: "var(--m)", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--t1)", fontFamily: "var(--h)" }}>{m.name}</span>
              <span style={{ color: tc.text, fontWeight: 700 }}>
                {m.trend?.dir === "up" ? "+" : "-"}{m.trend?.pct || 0}%
              </span>
              <span style={{ color: "var(--t4)", fontSize: 7, margin: "0 4px" }}>{"\u00B7"}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Category Pulse Strip — compact sector chips
// ────────────────────────────────────────────
function CategoryPulseStrip({ categories, activeCat, onSelect }) {
  if (!categories || categories.length === 0) return null;
  const maxP = Math.max(...categories.map((c) => c.totalPulse), 0.01);
  return (
    <div style={{ borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.4)", padding: "4px 16px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }} className="movers-ribbon">
        <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".08em", marginRight: 8, whiteSpace: "nowrap", flexShrink: 0 }}>SECTORS</span>
        {categories.map((c, i) => {
          const barW = Math.max((c.totalPulse / maxP) * 24, 3);
          const isActive = activeCat === c.name;
          return (
            <div key={c.name} onClick={() => onSelect(isActive ? "All" : c.name)} style={{
              display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 3,
              background: isActive ? "rgba(0,200,83,.06)" : "rgba(255,255,255,.02)",
              border: isActive ? "1px solid rgba(0,200,83,.15)" : "1px solid rgba(255,255,255,.03)",
              whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", transition: "all .15s",
              animation: `fi .3s ease ${i * 0.03}s both`,
            }}>
              <div style={{ width: 24, height: 3, borderRadius: 1, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                <div style={{ width: barW, height: "100%", borderRadius: 1, background: "#00C853", opacity: 0.4 + (c.totalPulse / maxP) * 0.6 }} />
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color: isActive ? "#00C853" : "var(--t2)", fontFamily: "var(--h)" }}>{c.name}</span>
              <span style={{ fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)" }}>{c.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Gainers & Losers Panel
// ────────────────────────────────────────────
function GainersLosersPanel({ enriched }) {
  const loaded = enriched.filter(p => p.status === "loaded" && p.trend);
  if (loaded.length < 4) return null;

  const byTrend = [...loaded].sort((a, b) => {
    const aVal = (a.trend.dir === "up" ? 1 : -1) * a.trend.pct;
    const bVal = (b.trend.dir === "up" ? 1 : -1) * b.trend.pct;
    return bVal - aVal;
  });

  const gainers = byTrend.filter(p => p.trend.dir === "up").slice(0, 5);
  const losers = byTrend.filter(p => p.trend.dir === "down").slice(0, 5).reverse();

  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.3)" }}>
      {/* Gainers */}
      <div style={{ flex: 1, padding: "6px 12px", borderRight: "1px solid var(--b1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <ChevronUp size={8} color="#00C853" />
          <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "var(--m)", color: "#00C853", letterSpacing: ".08em" }}>GAINERS</span>
        </div>
        {gainers.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", animation: `fi .2s ease ${i * 0.04}s both` }}>
            <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", width: 12 }}>{i + 1}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--t1)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--h)" }}>{p.name}</span>
            {p.days21 && <MicroStrip days={p.days21} width={36} height={10} trend={p.trend} />}
            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: "#00C853" }}>+{p.trend.pct}%</span>
          </div>
        ))}
      </div>
      {/* Losers */}
      <div style={{ flex: 1, padding: "6px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <ChevronDown size={8} color="#FF1744" />
          <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "var(--m)", color: "#FF1744", letterSpacing: ".08em" }}>LOSERS</span>
        </div>
        {losers.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", animation: `fi .2s ease ${i * 0.04}s both` }}>
            <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", width: 12 }}>{i + 1}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--t1)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--h)" }}>{p.name}</span>
            {p.days21 && <MicroStrip days={p.days21} width={36} height={10} trend={p.trend} />}
            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: "#FF1744" }}>-{p.trend.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Event Feed Card — transaction-style sidebar entry
// ────────────────────────────────────────────
function EventFeedCard({ event, index }) {
  const isNew = event.discovered_at && (Date.now() - new Date(event.discovered_at).getTime()) < 600_000;
  const traction = event.upvotes > 0 ? `${event.upvotes}` : event.stars > 0 ? `${event.stars >= 1000 ? (event.stars / 1000).toFixed(1) + "k" : event.stars}\u2605` : event.downloads > 0 ? `${event.downloads}` : null;

  // Positive = release, high upvotes. Neutral otherwise.
  const isPositive = (event.source === "github-releases") || (event.upvotes > 10) || (event.stars > 50);
  const borderColor = isNew ? (isPositive ? "#00C853" : "#FF1744") : "var(--b1)";

  return (
    <div style={{
      padding: "4px 6px", borderRadius: 3, background: "rgba(255,255,255,.015)",
      borderLeft: `2px solid ${borderColor}`,
      animation: `fi .2s ease ${Math.min(index * 0.02, 0.15)}s both`, transition: "all .15s",
    }} className="feed-card">
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <SourceBadge source={event.source} />
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "var(--h)" }}>{event.name}</span>
        {traction && <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: isPositive ? "#00C853" : "var(--t2)", flexShrink: 0 }}>{traction}</span>}
        <span style={{ fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", flexShrink: 0 }}>
          {event.discovered_at ? timeAgo(event.discovered_at) : ""}
        </span>
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
        const signals = {};
        for (const d of data.discoveries) {
          const pid = matchDiscovery(d, signalIndex);
          if (!pid) continue;
          if (!signals[pid]) signals[pid] = { hn: [], ph: [], reddit: [], github: [], npm: [], pypi: [], hf: [] };
          const bucket = { hackernews: "hn", producthunt: "ph", reddit: "reddit", github: "github", "github-trending": "github", "github-momentum": "github", npm: "npm", pypi: "pypi", huggingface: "hf" }[d.source];
          if (bucket && signals[pid][bucket]) signals[pid][bucket].push(d);
        }
        setScannerSignals(signals);
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

  // Top movers for marquee
  const topMovers = useMemo(() => {
    return enrichedProducts
      .filter((p) => p.status === "loaded" && p.trend && p.total4wk > 0)
      .sort((a, b) => (b.trend?.pct || 0) - (a.trend?.pct || 0))
      .slice(0, 20);
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
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--t4": "rgba(242,242,247,.2)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--up": "#00C853", "--dn": "#FF1744", "--m": "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", "--h": "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800');
        @keyframes fi { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }
        @keyframes marquee {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(0,200,83,.12); }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .pulse-row:hover { background: rgba(255,255,255,.02) !important; }
        .feed-card:hover { background: rgba(255,255,255,.03) !important; }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: rgba(0,200,83,.06) !important; border-color: rgba(0,200,83,.15) !important; color: #00C853 !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .movers-ribbon::-webkit-scrollbar { display: none; }
        .movers-ribbon { -ms-overflow-style: none; scrollbar-width: none; }
        .marquee-track { animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @media (max-width: 1024px) {
          .pulse-layout { flex-direction: column !important; }
          .pulse-sidebar { width: 100% !important; position: relative !important; top: auto !important; border-left: none !important; border-bottom: 1px solid var(--b1) !important; height: auto !important; max-height: 200px !important; }
          .pulse-sidebar .feed-list { flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; }
          .pulse-sidebar .feed-list > div { min-width: 200px !important; flex-shrink: 0 !important; }
          .cat-pulse-strip { display: none !important; }
          .gl-panel { display: none !important; }
        }
        @media (max-width: 768px) {
          .pulse-header { padding: 0 8px !important; }
          .pulse-toolbar { padding: 6px 8px !important; flex-direction: column !important; gap: 6px !important; }
          .pulse-matrix { padding: 0 !important; }
          .pulse-row { padding: 4px 4px 4px 0 !important; }
          .row-name { width: 90px !important; }
          .row-spectrogram { display: none !important; }
          .row-mini-chart { display: none !important; }
          .row-pct { display: none !important; }
          .row-vol { display: none !important; }
          .movers-ribbon { padding: 0 8px !important; }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header className="pulse-header" style={{ padding: "0 20px", height: 42, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.94)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--h)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div style={{ height: 12, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: "#00C853", letterSpacing: ".1em" }}>PULSE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {progress.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ width: 24, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 1, background: progress.done < progress.total ? "#00C853" : "rgba(255,255,255,.12)", transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)" }}>{progress.done}/{progress.total}</span>
            </div>
          )}
          {signalCount > 0 && (
            <span style={{ fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", padding: "2px 5px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
              {signalCount} sig
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00C853", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 7, fontWeight: 600, color: "var(--t4)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>LIVE</span>
          </div>
          <a href="/dashboard" className="link-hover" style={{ fontSize: 8, fontWeight: 600, color: "var(--t4)", padding: "2px 6px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ fontSize: 8, fontWeight: 600, color: "var(--t4)", padding: "2px 6px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Screener</a>
        </div>
      </header>

      {/* ─── MARQUEE TICKER ─── */}
      <MarqueeTicker movers={topMovers} />

      {/* ─── CATEGORY SECTORS ─── */}
      <div className="cat-pulse-strip">
        <CategoryPulseStrip categories={categoryPulse} activeCat={cat} onSelect={setCat} />
      </div>

      {/* ─── GAINERS & LOSERS ─── */}
      <div className="gl-panel">
        <GainersLosersPanel enriched={enrichedProducts} />
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="pulse-layout" style={{ display: "flex", position: "relative", zIndex: 1, minHeight: "calc(100vh - 140px)" }}>

        {/* ─── LEFT: MATRIX ─── */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Toolbar */}
          <div className="pulse-toolbar" style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, borderBottom: "1px solid var(--b1)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 3, flex: 1, flexWrap: "wrap" }}>
              <button className={`pill${cat === "All" ? " on" : ""}`} onClick={() => setCat("All")} style={{ padding: "2px 7px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 8, fontWeight: 600, fontFamily: "var(--m)" }}>
                All ({products.length})
              </button>
              {topCats.map((c) => (
                <button key={c} className={`pill${cat === c ? " on" : ""}`} onClick={() => setCat(c)} style={{ padding: "2px 7px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 8, fontWeight: 600, fontFamily: "var(--m)", whiteSpace: "nowrap" }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter..."
                style={{ width: 120, padding: "3px 7px 3px 20px", borderRadius: 3, border: "1px solid var(--b1)", background: "rgba(255,255,255,.02)", color: "var(--t1)", fontSize: 9, fontFamily: "var(--m)", outline: "none" }} />
              <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: "var(--t4)", pointerEvents: "none" }}>&#8981;</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", padding: "4px 12px 3px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 28, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 8 }}>#</span>
            <span className="row-name" style={{ width: 140, fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>NAME</span>
            <span className="row-mini-chart" style={{ width: 64, fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>CHART</span>
            <span className="row-spectrogram" style={{ flex: 1, fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 8 }}>21-DAY</span>
            <span style={{ width: 44, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>PULSE</span>
            <span className="row-pct" style={{ width: 44, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>1D</span>
            <span className="row-pct" style={{ width: 44, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>1W</span>
            <span className="row-pct" style={{ width: 48, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>4W</span>
            <span className="row-vol" style={{ width: 40, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 6 }}>VOL</span>
            <span style={{ width: 32, textAlign: "right", fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em" }}>SIG</span>
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
          <div style={{ padding: "5px 12px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 7, color: "var(--t4)", fontFamily: "var(--m)" }}>
              {sorted.length} products {"\u00B7"} {loadedCount} loaded {"\u00B7"} {signalCount} signals
              {progress.errors > 0 && <span style={{ color: "var(--dn)" }}> {"\u00B7"} {progress.errors} err</span>}
            </span>
            <span style={{ fontSize: 7, color: "var(--t4)", fontFamily: "var(--m)" }}>Terminal Pulse v3</span>
          </div>
        </main>

        {/* ─── RIGHT: ACTIVITY FEED ─── */}
        <aside className="pulse-sidebar" style={{ width: 240, flexShrink: 0, borderLeft: "1px solid var(--b1)", background: "rgba(10,11,16,.5)", position: "sticky", top: 42, height: "calc(100vh - 140px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "6px 8px 5px", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00C853", animation: "lp 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 7, fontWeight: 700, fontFamily: "var(--m)", letterSpacing: ".1em", color: "var(--t3)" }}>ACTIVITY FEED</span>
              </div>
              <span style={{ fontSize: 7, fontFamily: "var(--m)", color: "var(--t4)" }}>{filteredFeed.length}</span>
            </div>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {FEED_SOURCES.map((s) => (
                <button key={s.key} className={`pill${feedSource === s.key ? " on" : ""}`}
                  onClick={() => setFeedSource(s.key)}
                  style={{ padding: "1px 4px", borderRadius: 2, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t4)", fontSize: 7, fontWeight: 600, fontFamily: "var(--m)" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="feed-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "3px 5px", display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredFeed.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "var(--t4)", fontFamily: "var(--m)", lineHeight: 1.6 }}>
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
