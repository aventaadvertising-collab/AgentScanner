"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

// ─── Helpers ───
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtN(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function sourceLabel(url) {
  if (!url) return null;
  if (url.includes("github.com")) return "Repository";
  if (url.includes("pypi.org")) return "Package";
  if (url.includes("npmjs.com") || url.includes("npmjs.org")) return "Package";
  if (url.includes("huggingface.co/spaces")) return "Space";
  if (url.includes("huggingface.co")) return "Model";
  if (url.includes("ycombinator.com") || url.includes("news.ycombinator")) return "Discussion";
  if (url.includes("reddit.com")) return "Thread";
  if (url.includes("producthunt.com")) return "Launch";
  if (url.includes("arxiv.org")) return "Paper";
  if (url.includes("dev.to")) return "Article";
  if (url.includes("lobste.rs")) return "Link";
  return "Source";
}

function confidenceGrade(c) {
  if (c >= 90) return { label: "S", color: "#10B981", bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.2)" };
  if (c >= 75) return { label: "A", color: "#2563EB", bg: "rgba(37,99,235,.1)", border: "rgba(37,99,235,.2)" };
  if (c >= 60) return { label: "B", color: "#8B5CF6", bg: "rgba(139,92,246,.1)", border: "rgba(139,92,246,.2)" };
  if (c >= 40) return { label: "C", color: "#F59E0B", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)" };
  return { label: "D", color: "rgba(240,240,245,.3)", bg: "rgba(255,255,255,.03)", border: "rgba(255,255,255,.06)" };
}

// ─── Main Component ───
export default function ScreenerClient() {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState({ today: 0, this_hour: 0 });
  const [catFilter, setCatFilter] = useState("All");
  const [q, setQ] = useState("");
  const [, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("feed"); // feed | grid

  const supabase = useMemo(() => getSupabase(), []);

  const fetchFeed = useCallback(() => {
    return fetch("/api/scanner?limit=150")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.discoveries) { setDiscoveries(d.discoveries); setStats(d.stats); } })
      .catch(() => {});
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setTimeout(() => setRefreshing(false), 500));
  }, [fetchFeed]);

  useEffect(() => { fetchFeed(); const i = setInterval(fetchFeed, 30_000); return () => clearInterval(i); }, [fetchFeed]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel("scanner-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scanner_discoveries" },
        (p) => { setDiscoveries((prev) => [p.new, ...prev].slice(0, 200)); setStats((prev) => ({ today: prev.today + 1, this_hour: prev.this_hour + 1 })); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [supabase]);

  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 10_000); return () => clearInterval(id); }, []);

  const catCounts = useMemo(() => {
    const c = {};
    for (const d of discoveries) if (d.category) c[d.category] = (c[d.category] || 0) + 1;
    return c;
  }, [discoveries]);

  const topCats = useMemo(() =>
    Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat]) => cat),
  [catCounts]);

  const filtered = useMemo(() => {
    let items = discoveries;
    if (catFilter !== "All") items = items.filter((d) => d.category === catFilter);
    if (q) { const lq = q.toLowerCase(); items = items.filter((d) => d.name?.toLowerCase().includes(lq) || d.description?.toLowerCase().includes(lq) || d.category?.toLowerCase().includes(lq) || d.author?.toLowerCase().includes(lq)); }
    return items;
  }, [discoveries, catFilter, q]);

  const sourceCount = useMemo(() => {
    const s = new Set();
    for (const d of discoveries) if (d.source) s.add(d.source);
    return s.size;
  }, [discoveries]);

  return (
    <div style={{ "--bg": "#0C0D12", "--s1": "#13151D", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.08)", "--b2": "rgba(255,255,255,.12)", "--b3": "rgba(255,255,255,.18)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.65)", "--t3": "rgba(242,242,247,.38)", "--g": "#3B82F6", "--gg": "rgba(59,130,246,.2)", "--gd": "rgba(59,130,246,.08)", "--em": "#10B981", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fi-scale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(59,130,246,.08) } 50% { box-shadow: 0 0 40px rgba(59,130,246,.15) } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes ring-rotate { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(59,130,246,.3); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.15); }
        .card { transition: all .2s cubic-bezier(.4,0,.2,1); border: 1px solid var(--b1); cursor: default; }
        .card:hover { border-color: var(--b2); transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.04); }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .ghost-btn { transition: all .15s; cursor: pointer; border: 1px solid var(--b1); background: transparent; }
        .ghost-btn:hover { background: rgba(255,255,255,.04); border-color: var(--b2); }
        .stat-card { background: var(--s1); border: 1px solid var(--b1); border-radius: 10px; padding: 14px 18px; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent); }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Gradient orbs */}
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.03) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "40%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.02) 0%, transparent 70%)", filter: "blur(60px)" }} />
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ─── HEADER ─── */}
      <header style={{ padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(12,13,18,.88)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--t1)" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #3B82F6, #2563EB, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", animation: "glow-pulse 4s ease-in-out infinite" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FFF", fontFamily: "var(--m)", letterSpacing: ".02em" }}>AS</span>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent)", animation: "sl 4s ease-in-out infinite" }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
            </span>
          </a>
          <div style={{ height: 20, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--g)", letterSpacing: ".06em", padding: "3px 10px", borderRadius: 6, background: "var(--gd)", border: "1px solid rgba(59,130,246,.15)" }}>SCREENER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.15)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "lp 2s ease-in-out infinite", boxShadow: "0 0 8px rgba(16,185,129,.5)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", fontFamily: "var(--m)", letterSpacing: ".04em" }}>LIVE</span>
          </div>
          <button className="ghost-btn" onClick={handleRefresh} disabled={refreshing} style={{ padding: "6px 14px", borderRadius: 8, color: "var(--t2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--f)", display: "flex", alignItems: "center", gap: 6, opacity: refreshing ? 0.5 : 1 }}>
            <span style={{ display: "inline-block", fontSize: 14, animation: refreshing ? "spin .5s linear infinite" : "none" }}>⟳</span>
            Refresh
          </button>
          <a href="/dashboard" className="link-hover" style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 12, fontWeight: 600 }}>Dashboard</a>
        </div>
      </header>

      {/* ─── HERO STATS ─── */}
      <div style={{ padding: "20px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Detected Today", value: stats.today, icon: "◈", color: "#3B82F6" },
            { label: "This Hour", value: stats.this_hour, icon: "⏱", color: "#10B981" },
            { label: "In Feed", value: filtered.length, icon: "◉", color: "#8B5CF6" },
            { label: "Sources Active", value: sourceCount || 11, icon: "⊛", color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ animation: `fi .4s ease ${i * 0.06}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em", lineHeight: 1 }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 18, color: s.color, opacity: 0.5 }}>{s.icon}</span>
              </div>
              {/* Animated scan line */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--b1)", overflow: "hidden", borderRadius: "0 0 10px 10px" }}>
                <div style={{ width: "30%", height: "100%", background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, animation: "scan-line 3s ease-in-out infinite", animationDelay: `${i * 0.5}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div style={{ padding: "0 32px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 1 }}>
        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", maxWidth: "65%", paddingBottom: 2 }}>
          <button className={`pill${catFilter === "All" ? " on" : ""}`} onClick={() => setCatFilter("All")} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--f)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>All</button>
          {topCats.map((cat) => (
            <button key={cat} className={`pill${catFilter === cat ? " on" : ""}`} onClick={() => setCatFilter(catFilter === cat ? "All" : cat)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--f)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>
              {cat}
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5 }}>{catCounts[cat]}</span>
            </button>
          ))}
        </div>

        {/* Right: search + view toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." style={{ width: 220, padding: "8px 12px 8px 32px", fontSize: 12, borderRadius: 10, border: "1px solid var(--b1)", background: "var(--s1)", color: "var(--t1)", outline: "none", fontFamily: "var(--f)", transition: "border-color .15s" }} onFocus={(e) => e.target.style.borderColor = "var(--b2)"} onBlur={(e) => e.target.style.borderColor = "var(--b1)"} />
          </div>
          <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--b1)", overflow: "hidden" }}>
            {["feed", "grid"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", border: "none", background: view === v ? "rgba(255,255,255,.06)" : "transparent", color: view === v ? "var(--t1)" : "var(--t3)", fontSize: 12, cursor: "pointer", transition: "all .12s" }}>{v === "feed" ? "☰" : "⊞"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEED / GRID ─── */}
      <div style={{ padding: "0 32px 60px", position: "relative", zIndex: 1 }}>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "feed" ? (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {filtered.map((d, i) => <FeedCard key={d.id || d.external_id} item={d} index={i} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {filtered.map((d, i) => <GridCard key={d.id || d.external_id} item={d} index={i} />)}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "20px 32px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>AGENTSCREENER v1.0</span>
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--t3)" }} />
          <span style={{ fontSize: 10, color: "var(--t3)" }}>11 intelligence sources</span>
        </div>
        <span style={{ fontSize: 10, color: "var(--t3)", fontStyle: "italic" }}>Real-time AI ecosystem intelligence</span>
      </footer>
    </div>
  );
}

// ─── Feed Card (list view) ───
function FeedCard({ item, index }) {
  const confidence = Math.round((item.ai_confidence || 0) * 100);
  const grade = confidenceGrade(confidence);
  const age = item.discovered_at ? timeAgo(item.discovered_at) : "—";
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000; // < 10 min

  return (
    <div className="card" style={{ padding: "16px 20px", borderRadius: 12, background: "var(--s1)", marginBottom: 8, animation: `fi .35s ease ${Math.min(index * 0.04, 0.6)}s both` }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Confidence badge */}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: grade.bg, border: `1px solid ${grade.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--m)", color: grade.color }}>{grade.label}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{item.name}</a>
            {isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", color: "#10B981", letterSpacing: ".04em", animation: "lp 3s ease-in-out infinite" }}>NEW</span>}
            {item.author && (
              item.author_url
                ? <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</a>
                : <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{item.description}</div>
          )}

          {/* Metadata row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {item.category && (
              <span style={{ padding: "3px 10px", borderRadius: 6, background: "var(--gd)", border: "1px solid rgba(59,130,246,.12)", fontSize: 11, fontWeight: 600, color: "var(--g)" }}>{item.category}</span>
            )}
            {item.language && (
              <span style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", fontSize: 11, fontWeight: 600, color: "var(--t2)" }}>{item.language}</span>
            )}
            {item.stars > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>★ {fmtN(item.stars)}</span>}
            {item.downloads > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>↓ {fmtN(item.downloads)}</span>}
            {item.upvotes > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>▲ {item.upvotes}</span>}
            <span style={{ fontSize: 11, color: "var(--t3)" }}>·</span>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 11, fontWeight: 500, color: "var(--t3)" }}>{sourceLabel(item.url)} ↗</a>}
          </div>
        </div>

        {/* Right: time */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isNew ? "#10B981" : "var(--t3)", fontFamily: "var(--m)" }}>{age}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ───
function GridCard({ item, index }) {
  const confidence = Math.round((item.ai_confidence || 0) * 100);
  const grade = confidenceGrade(confidence);
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;

  return (
    <div className="card" style={{ padding: "18px 20px", borderRadius: 14, background: "var(--s1)", animation: `fi-scale .3s ease ${Math.min(index * 0.04, 0.5)}s both` }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: grade.bg, border: `1px solid ${grade.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", color: grade.color }}>{grade.label}</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{item.name}</a>
              {isNew && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: "rgba(16,185,129,.1)", color: "#10B981" }}>NEW</span>}
            </div>
            {item.author && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{item.author}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>{item.discovered_at ? timeAgo(item.discovered_at) : "—"}</div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.55, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
      )}

      {/* Metrics bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)" }}>
        {[
          item.stars > 0 && { label: "Stars", value: fmtN(item.stars) },
          item.downloads > 0 && { label: "Downloads", value: fmtN(item.downloads) },
          item.upvotes > 0 && { label: "Upvotes", value: String(item.upvotes) },
          item.language && { label: "Language", value: item.language },
        ].filter(Boolean).slice(0, 3).map((m, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{m.value}</div>
          </div>
        ))}
        {![item.stars, item.downloads, item.upvotes].some(v => v > 0) && !item.language && (
          <div style={{ flex: 1, fontSize: 10, color: "var(--t3)", fontStyle: "italic" }}>Newly detected</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {item.category && <span style={{ padding: "3px 10px", borderRadius: 6, background: "var(--gd)", border: "1px solid rgba(59,130,246,.12)", fontSize: 10, fontWeight: 600, color: "var(--g)" }}>{item.category}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--b1)" }}>{sourceLabel(item.url)} ↗</a>}
          {item.author_url && <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--b1)" }}>Profile</a>}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───
function EmptyState() {
  return (
    <div style={{ padding: "100px 0", textAlign: "center", animation: "fi .5s ease both" }}>
      {/* Animated orbital ring */}
      <div style={{ position: "relative", display: "inline-block", marginBottom: 32, width: 100, height: 100 }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "linear-gradient(135deg, rgba(59,130,246,.1), rgba(139,92,246,.05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 32, filter: "saturate(0) brightness(1.2)", animation: "float 3s ease-in-out infinite" }}>⌕</span>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(59,130,246,.15)", animation: "ring-rotate 8s linear infinite" }}>
          <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", boxShadow: "0 0 10px rgba(59,130,246,.5)" }} />
        </div>
        <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1px dashed rgba(139,92,246,.1)", animation: "ring-rotate 12s linear infinite reverse" }} />
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", marginBottom: 10, letterSpacing: "-.02em" }}>
        Screening the AI ecosystem
      </div>
      <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 32px" }}>
        Our intelligence engine monitors 11 sources across the internet for new AI products, agents, models, and tools. Discoveries appear here in real-time.
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 12, background: "var(--s1)", border: "1px solid var(--b1)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", animation: "lp 2s ease-in-out infinite", boxShadow: "0 0 8px rgba(16,185,129,.4)" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>Intelligence engine active — awaiting first screening cycle</span>
      </div>
    </div>
  );
}
