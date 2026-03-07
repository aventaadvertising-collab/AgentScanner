"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { REGISTRY } from "@/lib/pipeline/registry";
import { CommitHeatmap, CompactHeatmap } from "@/app/components/CommitHeatmap";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// TERMINAL PULSE — Live Development Activity Monitor
// Bloomberg-terminal-style spectrogram matrix with momentum sort
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

function getDayLabel(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ────────────────────────────────────────────
// Spectrogram Strip — 21-day thermal visualization
// ────────────────────────────────────────────
function SpectrogramStrip({ days, width = 420, height = 18, showToday = true }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const n = days.length;
  const cellW = Math.max(Math.floor((width - 2) / n) - 1, 2);
  const gap = 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 3 }}>
      {days.map((count, i) => {
        const x = 1 + i * (cellW + gap);
        const level = getLevel(count, max);
        const isToday = showToday && i === n - 1;
        return (
          <rect
            key={i}
            x={x}
            y={1}
            width={cellW}
            height={height - 2}
            rx={2}
            fill={LEVELS[level]}
            stroke={isToday ? "rgba(45,212,191,.5)" : "none"}
            strokeWidth={isToday ? 1 : 0}
          >
            {isToday && (
              <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
            )}
          </rect>
        );
      })}
    </svg>
  );
}

// Mini version for live feed
function MicroStrip({ days, width = 120, height = 10 }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const last10 = days.slice(-10);
  const cellW = Math.max(Math.floor((width - 2) / last10.length) - 1, 2);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", borderRadius: 2 }}>
      {last10.map((count, i) => (
        <rect
          key={i}
          x={1 + i * (cellW + 1)}
          y={1}
          width={cellW}
          height={height - 2}
          rx={1}
          fill={LEVELS[getLevel(count, max)]}
        />
      ))}
    </svg>
  );
}

// ────────────────────────────────────────────
// Shimmer Strip — loading placeholder
// ────────────────────────────────────────────
function ShimmerStrip({ width = 420, height = 18 }) {
  return (
    <div style={{ width, height, borderRadius: 3, background: "rgba(255,255,255,.02)", overflow: "hidden", position: "relative" }}>
      <div style={{ width: "30%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(45,212,191,.06), transparent)", position: "absolute", animation: "scan 2s ease-in-out infinite" }} />
    </div>
  );
}

// ────────────────────────────────────────────
// Product Row — single line in the matrix
// ────────────────────────────────────────────
function ProductRow({ product, data, rank, expanded, onToggle }) {
  const weeks = data?.weeks || null;
  const status = data?.status || "pending";
  const errorMsg = data?.error || null;

  const days21 = useMemo(() => getLast21Days(weeks), [weeks]);
  const momentum = useMemo(() => getMomentumScore(weeks), [weeks]);
  const trend = useMemo(() => getTrend(weeks), [weeks]);
  const total4wk = useMemo(() => recentTotal(weeks, 4), [weeks]);
  const todayCommits = days21 ? days21[days21.length - 1] : 0;

  const isHot = momentum > 1.5;
  const isSurging = momentum > 2;

  return (
    <div style={{ marginBottom: expanded ? 0 : 0 }}>
      <div
        className="pulse-row"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "6px 16px 6px 0",
          borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,.03)",
          cursor: "pointer",
          transition: "background .15s",
          position: "relative",
          borderLeft: isSurging ? "2px solid rgba(45,212,191,.5)" : isHot ? "2px solid rgba(45,212,191,.2)" : "2px solid transparent",
        }}
      >
        {/* Rank */}
        <span style={{ width: 36, textAlign: "right", fontSize: 10, fontFamily: "var(--m)", color: rank <= 3 && status === "loaded" ? "var(--g)" : "var(--t4)", fontWeight: rank <= 3 && status === "loaded" ? 700 : 400, flexShrink: 0, paddingRight: 12 }}>
          {status === "loaded" ? rank : "\u00B7\u00B7"}
        </span>

        {/* Name + Category */}
        <div style={{ width: 160, flexShrink: 0, minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-.01em" }}>
            {product.name}
          </div>
          <div style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.category}
          </div>
        </div>

        {/* Spectrogram */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          {status === "pending" || status === "loading" ? (
            <ShimmerStrip width={400} height={18} />
          ) : status === "error" ? (
            <div style={{ height: 18, borderRadius: 3, background: "rgba(220,38,38,.04)", display: "flex", alignItems: "center", paddingLeft: 8 }}>
              <span style={{ fontSize: 9, color: "rgba(220,38,38,.5)", fontFamily: "var(--m)" }}>{errorMsg || "failed"}</span>
            </div>
          ) : days21 ? (
            <SpectrogramStrip days={days21} width={400} height={18} />
          ) : (
            <div style={{ height: 18, borderRadius: 3, background: "rgba(255,255,255,.02)" }} />
          )}
        </div>

        {/* Today */}
        <div style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: todayCommits > 0 ? "var(--g)" : "var(--t4)" }}>
            {status === "loaded" ? todayCommits : "\u2013"}
          </span>
        </div>

        {/* 4wk total */}
        <div style={{ width: 52, flexShrink: 0, textAlign: "right", paddingRight: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--m)", color: total4wk > 0 ? "var(--t1)" : "var(--t4)" }}>
            {status === "loaded" ? total4wk : "\u2013"}
          </span>
        </div>

        {/* Trend */}
        <div style={{ width: 60, flexShrink: 0, textAlign: "right" }}>
          {trend ? (
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--m)",
              color: trend.dir === "up" ? "var(--up)" : "var(--dn)",
              padding: "1px 6px", borderRadius: 3,
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
        <div style={{
          padding: "12px 16px 16px 48px",
          background: "var(--s1)",
          borderBottom: "1px solid var(--b1)",
          borderLeft: "2px solid rgba(45,212,191,.3)",
          animation: "fi .25s ease",
        }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Repo</span>
              <a href={`https://github.com/${product.repo}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: "var(--m)", color: "var(--g)", textDecoration: "none" }}>
                {product.repo}
              </a>
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
            {data?.fetched_at && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Cached</span>
                <span style={{ fontSize: 11, fontFamily: "var(--m)", color: "var(--t3)" }}>{timeAgo(data.fetched_at)}</span>
              </div>
            )}
          </div>
          <CommitHeatmap weeks={weeks} fetchedAt={data?.fetched_at} />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Top Movers Ribbon — horizontal ticker
// ────────────────────────────────────────────
function TopMoversRibbon({ movers }) {
  if (!movers || movers.length === 0) return null;

  return (
    <div style={{
      borderBottom: "1px solid var(--b1)",
      background: "rgba(10,11,16,.6)",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "0 16px",
        height: 36,
        overflowX: "auto",
        overflowY: "hidden",
      }}
      className="movers-ribbon"
      >
        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t3)", letterSpacing: ".08em", marginRight: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
          TOP MOVERS
        </span>
        {movers.map((m, i) => (
          <div key={m.id} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px",
            borderRight: "1px solid rgba(255,255,255,.04)",
            whiteSpace: "nowrap", flexShrink: 0,
            animation: `fi .3s ease ${i * 0.05}s both`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t1)", letterSpacing: "-.01em" }}>{m.name}</span>
            {m.days21 && <MicroStrip days={m.days21} width={60} height={8} />}
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--m)",
              color: m.trend?.dir === "up" ? "var(--up)" : m.trend?.dir === "down" ? "var(--dn)" : "var(--t3)",
            }}>
              {m.trend ? `${m.trend.dir === "up" ? "\u2191" : "\u2193"}${m.trend.pct}%` : "\u2013"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Live Feed Card — sidebar entry
// ────────────────────────────────────────────
function LiveFeedCard({ item, index }) {
  return (
    <div style={{
      padding: "8px 10px",
      borderRadius: 6,
      background: "var(--s1)",
      border: "1px solid var(--b1)",
      borderLeft: item.surging ? "2px solid var(--g)" : "1px solid var(--b1)",
      animation: `fi .3s ease ${Math.min(index * 0.04, 0.3)}s both`,
      transition: "all .15s",
    }}
    className="feed-card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }}>
          {item.isNew && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite", flexShrink: 0 }} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
        </div>
        <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)", flexShrink: 0, marginLeft: 4 }}>
          {item.fetchedAt ? timeAgo(item.fetchedAt) : ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {item.days21 && <MicroStrip days={item.days21} width={100} height={8} />}
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: item.surging ? "var(--g)" : "var(--t2)" }}>
          {item.momentum === 999 ? "NEW" : `${item.momentum.toFixed(1)}x`}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t3)" }}>{item.total4wk}/4wk</span>
        <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>{item.category}</span>
        {item.surging && (
          <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", padding: "1px 4px", borderRadius: 2, background: "rgba(45,212,191,.1)", color: "var(--g)", letterSpacing: ".04em" }}>
            SURGE
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Fetch Queue — processes repos N at a time
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
            setDataMap((prev) => ({
              ...prev,
              [id]: { weeks: d.weeks, fetched_at: d.fetched_at, status: "loaded", source: d.source },
            }));
          } else {
            setDataMap((prev) => ({
              ...prev,
              [id]: { status: "error", error: d?.error || "no_weeks" },
            }));
            setProgress((p) => ({ ...p, errors: p.errors + 1 }));
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        })
        .catch((err) => {
          setDataMap((prev) => ({ ...prev, [id]: { status: "error", error: err.message } }));
          setProgress((p) => ({ ...p, done: p.done + 1, errors: p.errors + 1 }));
        })
        .finally(() => {
          activeRef.current--;
          processNext();
        });
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

  // Breakout feed
  const [breakouts, setBreakouts] = useState([]);

  // Build product list
  const products = useMemo(() => {
    return REGISTRY
      .filter((p) => p.g)
      .map((p) => ({ id: p.id, name: p.name, category: p.cat, repo: `${p.g.o}/${p.g.r}` }));
  }, []);

  // Fetch queue — 8 concurrent
  const { dataMap, progress } = useFetchQueue(products);

  // Supabase real-time for breakouts
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("pulse-breakouts")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "scanner_discoveries",
        filter: "source=eq.github-momentum",
      }, (payload) => {
        setBreakouts((prev) => {
          const id = payload.new.id || payload.new.external_id;
          if (prev.some((d) => (d.id || d.external_id) === id)) return prev;
          return [payload.new, ...prev].slice(0, 50);
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Fetch breakouts
  useEffect(() => {
    fetch("/api/scanner?source=github-momentum&limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.discoveries) setBreakouts(d.discoveries); })
      .catch(() => {});
  }, []);

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

  // Compute enriched product list with momentum, sorted
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const d = dataMap[p.id];
      const weeks = d?.weeks || null;
      return {
        ...p,
        data: d,
        momentum: getMomentumScore(weeks),
        trend: getTrend(weeks),
        days21: getLast21Days(weeks),
        total4wk: recentTotal(weeks, 4),
        status: d?.status || "pending",
      };
    });
  }, [products, dataMap]);

  // Sort by momentum (loaded items first, then by momentum desc)
  const sorted = useMemo(() => {
    let items = [...enrichedProducts];
    if (cat !== "All") items = items.filter((p) => p.category === cat);
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lq) || p.repo.toLowerCase().includes(lq) || p.category?.toLowerCase().includes(lq));
    }
    items.sort((a, b) => {
      // Loaded items first
      if (a.status === "loaded" && b.status !== "loaded") return -1;
      if (a.status !== "loaded" && b.status === "loaded") return 1;
      // Then by momentum desc
      return b.momentum - a.momentum;
    });
    return items;
  }, [enrichedProducts, cat, q]);

  // Top movers — top 12 by trend percentage (loaded only)
  const topMovers = useMemo(() => {
    return enrichedProducts
      .filter((p) => p.status === "loaded" && p.trend && p.total4wk > 0)
      .sort((a, b) => (b.trend?.pct || 0) - (a.trend?.pct || 0))
      .slice(0, 12);
  }, [enrichedProducts]);

  // Live feed — products with high momentum
  const feedItems = useMemo(() => {
    const hot = enrichedProducts
      .filter((p) => p.status === "loaded" && p.momentum > 1.3 && p.total4wk > 0)
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 30)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        days21: p.days21,
        momentum: p.momentum,
        total4wk: p.total4wk,
        surging: p.momentum > 2,
        isNew: false,
        fetchedAt: p.data?.fetched_at,
      }));

    // Also include scanner discoveries
    const scannerItems = breakouts.map((b) => ({
      id: `bk-${b.id || b.external_id}`,
      name: b.name,
      category: b.category || "Discovery",
      days21: null,
      momentum: b.momentum || 0,
      total4wk: b.upvotes || 0,
      surging: b.topics?.includes("surging"),
      isNew: b.discovered_at && (Date.now() - new Date(b.discovered_at).getTime()) < 600_000,
      fetchedAt: b.discovered_at,
    }));

    // Merge, dedupe, sort
    const all = [...scannerItems, ...hot];
    const seen = new Set();
    return all.filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    }).slice(0, 40);
  }, [enrichedProducts, breakouts]);

  const pctDone = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const loadedCount = enrichedProducts.filter((p) => p.status === "loaded").length;
  const surgingCount = feedItems.filter((f) => f.surging).length;

  void tick;

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--t4": "rgba(242,242,247,.2)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--up": "#16A34A", "--dn": "#DC2626", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 0 rgba(45,212,191,0) } 50% { box-shadow: 0 0 8px rgba(45,212,191,.1) } }
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
          .pulse-sidebar { width: 100% !important; position: relative !important; top: auto !important; border-left: none !important; border-bottom: 1px solid var(--b1) !important; height: auto !important; max-height: 240px !important; }
          .pulse-sidebar .feed-list { flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; }
          .pulse-sidebar .feed-list > div { min-width: 200px !important; flex-shrink: 0 !important; }
        }
        @media (max-width: 768px) {
          .pulse-header { padding: 0 12px !important; }
          .pulse-toolbar { padding: 8px 12px !important; flex-direction: column !important; gap: 8px !important; }
          .pulse-matrix { padding: 0 !important; }
          .pulse-row { padding: 6px 8px 6px 0 !important; }
          .row-name { width: 100px !important; }
          .row-spectrogram { display: none !important; }
          .movers-ribbon { padding: 0 12px !important; }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header className="pulse-header" style={{ padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.92)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div style={{ height: 16, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: "var(--g)", letterSpacing: ".1em" }}>PULSE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Progress */}
          {progress.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ width: 32, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 1, background: progress.done < progress.total ? "var(--g)" : "rgba(255,255,255,.12)", transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>
                {progress.done}/{progress.total}
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 3, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--t4)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>LIVE</span>
          </div>
          <a href="/dashboard" className="link-hover" style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", padding: "4px 10px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", padding: "4px 10px", borderRadius: 3, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Screener</a>
        </div>
      </header>

      {/* ─── TOP MOVERS RIBBON ─── */}
      <TopMoversRibbon movers={topMovers} />

      {/* ─── MAIN LAYOUT ─── */}
      <div className="pulse-layout" style={{ display: "flex", position: "relative", zIndex: 1, minHeight: "calc(100vh - 84px)" }}>

        {/* ─── LEFT: SPECTROGRAM MATRIX ─── */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Toolbar */}
          <div className="pulse-toolbar" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--b1)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
              <button className={`pill${cat === "All" ? " on" : ""}`} onClick={() => setCat("All")} style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 10, fontWeight: 600, fontFamily: "var(--m)" }}>
                All ({products.length})
              </button>
              {topCats.map((c) => (
                <button key={c} className={`pill${cat === c ? " on" : ""}`} onClick={() => setCat(c)} style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", color: "var(--t3)", fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", whiteSpace: "nowrap" }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter..."
                style={{ width: 140, padding: "5px 10px 5px 24px", borderRadius: 4, border: "1px solid var(--b1)", background: "rgba(255,255,255,.02)", color: "var(--t1)", fontSize: 11, fontFamily: "var(--m)", outline: "none" }} />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--t4)", pointerEvents: "none" }}>&#8981;</span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", padding: "6px 16px 4px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <span style={{ width: 36, textAlign: "right", fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 12 }}>#</span>
            <span className="row-name" style={{ width: 160, fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 12 }}>PRODUCT</span>
            <span className="row-spectrogram" style={{ flex: 1, fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 12 }}>21-DAY SPECTROGRAM</span>
            <span style={{ width: 44, textAlign: "right", fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 12 }}>TODAY</span>
            <span style={{ width: 52, textAlign: "right", fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em", paddingRight: 12 }}>4WK</span>
            <span style={{ width: 60, textAlign: "right", fontSize: 8, fontFamily: "var(--m)", color: "var(--t4)", letterSpacing: ".06em" }}>TREND</span>
          </div>

          {/* Matrix rows */}
          <div className="pulse-matrix" style={{ flex: 1, overflowY: "auto" }}>
            {sorted.map((p, i) => (
              <ProductRow
                key={p.id}
                product={p}
                data={dataMap[p.id]}
                rank={i + 1}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)" }}>
              {sorted.length} products · {loadedCount} loaded
              {progress.errors > 0 && <span style={{ color: "var(--dn)" }}> · {progress.errors} err</span>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 8, color: "var(--t4)", fontFamily: "var(--m)" }}>Less</span>
              {LEVELS.map((c, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 1, background: c, display: "inline-block" }} />
              ))}
              <span style={{ fontSize: 8, color: "var(--t4)", fontFamily: "var(--m)" }}>More</span>
            </div>
          </div>
        </main>

        {/* ─── RIGHT: LIVE FEED SIDEBAR ─── */}
        <aside className="pulse-sidebar" style={{ width: 260, flexShrink: 0, borderLeft: "1px solid var(--b1)", background: "rgba(10,11,16,.5)", position: "sticky", top: 48, height: "calc(100vh - 84px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "var(--m)", letterSpacing: ".1em", color: "var(--t3)" }}>LIVE FEED</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {surgingCount > 0 && (
                  <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--g)", fontWeight: 700 }}>{surgingCount} surging</span>
                )}
                <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)" }}>{feedItems.length}</span>
              </div>
            </div>
          </div>
          <div className="feed-list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
            {feedItems.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--t4)", fontFamily: "var(--m)", lineHeight: 1.6 }}>
                  {progress.done < progress.total ? "Scanning..." : "No momentum signals yet"}
                </div>
              </div>
            ) : feedItems.map((item, i) => (
              <LiveFeedCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
