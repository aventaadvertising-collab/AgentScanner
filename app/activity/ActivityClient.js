"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { REGISTRY } from "@/lib/pipeline/registry";
import { CompactHeatmap } from "@/app/components/CommitHeatmap";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// ACTIVITY PAGE — Development Pulse Dashboard
// Left: Breakout feed (momentum discoveries, real-time)
// Right: Product grid with recent daily activity bars
// ============================================================

// ── helpers ──

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
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

function getLast14Days(weeks) {
  if (!weeks || weeks.length < 2) return null;
  const last2 = weeks.slice(-2);
  const days = [];
  for (const wk of last2) {
    for (let d = 0; d < 7; d++) days.push(wk.d?.[d] || 0);
  }
  return days.slice(-14);
}

// ────────────────────────────────────────────
// Daily Activity Bars — last 14 days
// ────────────────────────────────────────────
function DailyBars({ days, w = 260, h = 48 }) {
  if (!days || !days.length) return null;
  const max = Math.max(...days, 1);
  const barW = Math.floor((w - 2) / days.length) - 1;
  const gap = 1;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {days.map((count, i) => {
        const barH = Math.max((count / max) * (h - 4), count > 0 ? 2 : 0);
        const x = 1 + i * (barW + gap);
        const y = h - 2 - barH;
        const isRecent = i >= days.length - 3;
        const opacity = count === 0 ? 0.08 : isRecent ? 0.85 : 0.45;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(barH, 1)}
            rx={1.5}
            fill={count === 0 ? "rgba(255,255,255,.06)" : `rgba(45,212,191,${opacity})`}
          />
        );
      })}
      <line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke="rgba(255,255,255,.04)" strokeWidth={1} />
    </svg>
  );
}

// ────────────────────────────────────────────
// Product Card — receives data from parent
// ────────────────────────────────────────────
function ProductCard({ product, data, index }) {
  const weeks = data?.weeks || null;
  const fetchedAt = data?.fetched_at || null;
  const status = data?.status || "pending"; // pending | loading | loaded | error
  const errorMsg = data?.error || null;

  const days14 = useMemo(() => getLast14Days(weeks), [weeks]);
  const recent4wk = useMemo(() => recentTotal(weeks, 4), [weeks]);
  const trend = useMemo(() => getTrend(weeks), [weeks]);
  const todayCommits = days14 ? days14[days14.length - 1] : 0;

  return (
    <div className="activity-card" style={{ animation: `fi .4s ease ${Math.min(index * 0.03, 0.5)}s both` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{product.name}</span>
            {trend && (
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: trend.dir === "up" ? "var(--up)" : "var(--dn)", padding: "1px 6px", borderRadius: 3, background: trend.dir === "up" ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)" }}>
                {trend.dir === "up" ? "\u2191" : "\u2193"} {trend.pct}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t4)", marginTop: 2 }}>{product.repo}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", color: "var(--t4)", whiteSpace: "nowrap" }}>{product.category}</span>
      </div>

      {/* Activity visualization */}
      {status === "pending" || status === "loading" ? (
        <div style={{ height: 48, borderRadius: 6, background: "rgba(255,255,255,.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "50%", height: 3, borderRadius: 2, background: "rgba(255,255,255,.04)", overflow: "hidden", position: "relative" }}>
            <div style={{ width: "30%", height: "100%", borderRadius: 2, background: "rgba(45,212,191,.3)", position: "absolute", animation: "scan 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      ) : days14 ? (
        <DailyBars days={days14} w={280} h={48} />
      ) : status === "error" ? (
        <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "rgba(220,38,38,.04)", border: "1px solid rgba(220,38,38,.1)" }}>
          <span style={{ fontSize: 10, color: "var(--dn)", fontFamily: "var(--m)" }}>{errorMsg || "fetch failed"}</span>
        </div>
      ) : (
        <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "rgba(255,255,255,.02)" }}>
          <span style={{ fontSize: 10, color: "var(--t4)", fontFamily: "var(--m)" }}>No data yet</span>
        </div>
      )}

      {/* Stats row */}
      {weeks && (
        <div style={{ display: "flex", gap: 14, marginTop: 8, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Today</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", color: todayCommits > 0 ? "var(--g)" : "var(--t3)" }}>{todayCommits}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>4 wk</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{recent4wk}</span>
          </div>
          {fetchedAt && (
            <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", marginLeft: "auto" }}>{timeAgo(fetchedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Breakout Card — momentum discovery
// ────────────────────────────────────────────
function BreakoutCard({ item, index }) {
  const [heatWeeks, setHeatWeeks] = useState(null);
  const surging = item.topics?.includes("surging");
  const repoPath = item.url?.match(/github\.com\/([^/]+\/[^/]+)/)?.[1] || null;
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;

  useEffect(() => {
    if (!repoPath) return;
    fetch(`/api/commit-activity?repo=${encodeURIComponent(repoPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.weeks) setHeatWeeks(d.weeks); })
      .catch(() => {});
  }, [repoPath]);

  const days14 = useMemo(() => getLast14Days(heatWeeks), [heatWeeks]);

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="breakout-card"
      style={{
        display: "block", textDecoration: "none", color: "inherit",
        padding: "12px 14px", borderRadius: 10, background: "var(--s1)",
        border: "1px solid var(--b1)",
        borderLeft: surging ? "2px solid var(--g)" : "1px solid var(--b1)",
        animation: `fi .35s ease ${Math.min(index * 0.05, 0.4)}s both${isNew ? ", bk-glow 2s ease-in-out infinite" : ""}`,
        transition: "all .2s", position: "relative", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: surging ? "linear-gradient(90deg, transparent, rgba(45,212,191,.15), transparent)" : "linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          {isNew && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite", flexShrink: 0 }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
          {surging && <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", padding: "1px 5px", borderRadius: 3, background: "rgba(45,212,191,.12)", color: "var(--g)", letterSpacing: ".04em", flexShrink: 0 }}>SURGING</span>}
        </div>
        <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", flexShrink: 0, marginLeft: 6 }}>
          {item.discovered_at ? timeAgo(item.discovered_at) : ""}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{item.author || repoPath}</span>
        {item.stars > 0 && <span style={{ color: "var(--t4)" }}>&#9733; {item.stars >= 1000 ? `${(item.stars / 1000).toFixed(1)}k` : item.stars}</span>}
      </div>
      {days14 ? (
        <div style={{ marginBottom: 8, opacity: 0.9 }}><DailyBars days={days14} w={280} h={32} /></div>
      ) : heatWeeks ? (
        <div style={{ marginBottom: 8, opacity: 0.9 }}><CompactHeatmap weeks={heatWeeks} w={280} h={32} /></div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {item.upvotes > 0 && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", color: "var(--up)" }}>{item.upvotes} /4wk</span>}
        {item.language && <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)", padding: "1px 5px", borderRadius: 3, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)" }}>{item.language}</span>}
        {item.category && <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t4)", padding: "1px 5px", borderRadius: 3, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)" }}>{item.category}</span>}
      </div>
    </a>
  );
}

// ────────────────────────────────────────────
// Fetch queue — processes repos 5 at a time
// ────────────────────────────────────────────
function useFetchQueue(repos) {
  const [dataMap, setDataMap] = useState({});
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const queueRef = useRef([]);
  const activeRef = useRef(0);
  const startedRef = useRef(false);
  const CONCURRENCY = 5;

  const processNext = useCallback(() => {
    while (activeRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const { repo, id } = queueRef.current.shift();
      activeRef.current++;

      // Mark as loading
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
// Main Activity Page
// ────────────────────────────────────────────
export default function ActivityClient() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  // Breakout feed
  const [breakouts, setBreakouts] = useState([]);
  const [breakoutsLoading, setBreakoutsLoading] = useState(true);

  // Build product list
  const products = useMemo(() => {
    return REGISTRY
      .filter((p) => p.g)
      .map((p) => ({ id: p.id, name: p.name, category: p.cat, repo: `${p.g.o}/${p.g.r}` }));
  }, []);

  // Centralized fetch queue — 5 concurrent requests
  const { dataMap, progress } = useFetchQueue(products);

  // ─── FETCH BREAKOUTS ───
  useEffect(() => {
    fetch("/api/scanner?source=github-momentum&limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.discoveries) {
          setBreakouts(d.discoveries.sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at)));
        }
        setBreakoutsLoading(false);
      })
      .catch(() => setBreakoutsLoading(false));
  }, []);

  // ─── SUPABASE REAL-TIME FOR BREAKOUTS ───
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("activity-breakouts")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "scanner_discoveries",
        filter: "source=eq.github-momentum",
      }, (payload) => {
        setBreakouts((prev) => {
          const id = payload.new.id || payload.new.external_id;
          if (prev.some((d) => (d.id || d.external_id) === id)) return prev;
          return [payload.new, ...prev].slice(0, 100);
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Tick for relative time
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Background scan trigger
  useEffect(() => {
    const trigger = () => { fetch("/api/scanner?trigger=1").catch(() => {}); };
    trigger();
    const i = setInterval(trigger, 60_000);
    return () => clearInterval(i);
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

  // Filter
  const filtered = useMemo(() => {
    let items = products;
    if (cat !== "All") items = items.filter((p) => p.category === cat);
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lq) || p.repo.toLowerCase().includes(lq) || p.category?.toLowerCase().includes(lq));
    }
    return items;
  }, [products, cat, q]);

  const surgingCount = breakouts.filter((b) => b.topics?.includes("surging")).length;
  const pctDone = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  void tick;

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--t4": "rgba(242,242,247,.2)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--up": "#16A34A", "--dn": "#DC2626", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes bk-glow { 0%,100% { box-shadow: 0 0 0 rgba(45,212,191,0) } 50% { box-shadow: 0 0 12px rgba(45,212,191,.12) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .activity-card { border: 1px solid var(--b1); border-radius: 10px; background: var(--s1); padding: 16px; transition: all .2s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden; }
        .activity-card:hover { border-color: var(--b2); box-shadow: 0 4px 24px rgba(0,0,0,.2); }
        .activity-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent); }
        .breakout-card:hover { border-color: var(--b2) !important; background: var(--s2) !important; }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        @media (max-width: 1024px) {
          .activity-layout { flex-direction: column !important; }
          .breakout-sidebar { width: 100% !important; position: relative !important; top: auto !important; border-right: none !important; border-bottom: 1px solid var(--b1) !important; height: auto !important; }
          .breakout-feed { flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; padding-bottom: 8px !important; gap: 10px !important; max-height: none !important; }
          .breakout-feed > a { min-width: 280px !important; flex-shrink: 0 !important; }
        }
        @media (max-width: 768px) {
          .activity-header { padding: 0 12px !important; }
          .activity-toolbar { padding: 0 12px 12px !important; flex-direction: column !important; }
          .activity-pills { max-width: 100% !important; overflow-x: auto !important; }
          .activity-grid { grid-template-columns: 1fr !important; padding: 0 12px 40px !important; }
          .activity-footer { padding: 16px 12px !important; flex-direction: column !important; gap: 6px !important; text-align: center !important; }
        }
      `}</style>

      {/* Ambient Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.02) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.01) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ─── HEADER ─── */}
      <header className="activity-header" style={{ padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.88)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div style={{ height: 20, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t2)", letterSpacing: ".06em", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>ACTIVITY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Fetch progress indicator */}
          {progress.total > 0 && progress.done < progress.total && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ width: 40, height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 2, background: "var(--g)", transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 9, fontFamily: "var(--m)", color: "var(--t3)" }}>{progress.done}/{progress.total}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".04em" }}>LIVE</span>
          </div>
          <a href="/dashboard" className="link-hover" style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", padding: "5px 12px", borderRadius: 4, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", padding: "5px 12px", borderRadius: 4, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Screener</a>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="activity-layout" style={{ display: "flex", position: "relative", zIndex: 1, minHeight: "calc(100vh - 56px)" }}>

        {/* ─── LEFT: BREAKOUT FEED ─── */}
        <aside className="breakout-sidebar" style={{ width: 340, flexShrink: 0, borderRight: "1px solid var(--b1)", background: "rgba(10,11,16,.5)", position: "sticky", top: 56, height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--g)", animation: "lp 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", letterSpacing: ".08em", color: "var(--t2)" }}>BREAKOUTS</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t3)" }}>{breakouts.length} detected</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Surging</span>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--m)", color: "var(--g)" }}>{surgingCount}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t4)", fontFamily: "var(--m)" }}>Momentum</span>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)" }}>{breakouts.length}</span>
              </div>
            </div>
          </div>
          <div className="breakout-feed" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {breakoutsLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ width: 80, height: 3, borderRadius: 2, background: "rgba(255,255,255,.04)", overflow: "hidden", margin: "0 auto 12px", position: "relative" }}>
                  <div style={{ width: "30%", height: "100%", borderRadius: 2, background: "rgba(45,212,191,.3)", position: "absolute", animation: "scan 1.5s ease-in-out infinite" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--t4)", fontFamily: "var(--m)" }}>Scanning for breakouts...</div>
              </div>
            ) : breakouts.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>&#9672;</div>
                <div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)", lineHeight: 1.5 }}>
                  No momentum breakouts yet.<br />Scanner runs every minute.
                </div>
              </div>
            ) : breakouts.map((item, i) => (
              <BreakoutCard key={item.id || item.external_id || i} item={item} index={i} />
            ))}
          </div>
        </aside>

        {/* ─── RIGHT: PRODUCT GRID ─── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div className="activity-toolbar" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="activity-pills" style={{ display: "flex", gap: 6, flex: 1, overflow: "hidden", flexWrap: "wrap" }}>
              <button className={`pill${cat === "All" ? " on" : ""}`} onClick={() => setCat("All")} style={{ padding: "5px 14px", borderRadius: 6, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 11, fontWeight: 600, fontFamily: "var(--m)" }}>
                All ({products.length})
              </button>
              {topCats.map((c) => (
                <button key={c} className={`pill${cat === c ? " on" : ""}`} onClick={() => setCat(c)} style={{ padding: "5px 14px", borderRadius: 6, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 11, fontWeight: 600, fontFamily: "var(--m)", whiteSpace: "nowrap" }}>
                  {c} ({catCounts[c]})
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..."
                style={{ width: 180, padding: "7px 12px 7px 30px", borderRadius: 6, border: "1px solid var(--b1)", background: "rgba(255,255,255,.03)", color: "var(--t1)", fontSize: 12, fontFamily: "var(--m)", outline: "none" }} />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--t3)", pointerEvents: "none" }}>&#8981;</span>
            </div>
          </div>

          {/* Progress bar when loading */}
          {progress.total > 0 && progress.done < progress.total && (
            <div style={{ padding: "0 24px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "var(--s1)", border: "1px solid var(--b1)" }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                  <div style={{ width: `${pctDone}%`, height: "100%", borderRadius: 2, background: "var(--g)", transition: "width .3s ease" }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t3)", whiteSpace: "nowrap" }}>
                  Fetching {progress.done}/{progress.total}
                  {progress.errors > 0 && <span style={{ color: "var(--dn)" }}> · {progress.errors} errors</span>}
                </span>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="activity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 24px 40px" }}>
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} data={dataMap[p.id]} index={i} />
            ))}
          </div>

          {/* Footer */}
          <footer className="activity-footer" style={{ padding: "20px 24px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} · {progress.done - progress.errors} loaded
              {progress.errors > 0 && <span style={{ color: "var(--dn)" }}> · {progress.errors} failed</span>}
            </span>
            <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>
              14-day view · 5 concurrent fetches · cached 24h
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
