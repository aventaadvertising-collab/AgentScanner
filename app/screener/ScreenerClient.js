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
  if (c >= 90) return { label: "S", color: "#2DD4BF", bg: "rgba(45,212,191,.1)", border: "rgba(45,212,191,.2)" };
  if (c >= 75) return { label: "A", color: "#A78BFA", bg: "rgba(167,139,250,.1)", border: "rgba(167,139,250,.2)" };
  if (c >= 60) return { label: "B", color: "#38BDF8", bg: "rgba(56,189,248,.1)", border: "rgba(56,189,248,.2)" };
  if (c >= 40) return { label: "C", color: "#FBBF24", bg: "rgba(251,191,36,.1)", border: "rgba(251,191,36,.2)" };
  return { label: "D", color: "rgba(240,240,245,.3)", bg: "rgba(255,255,255,.03)", border: "rgba(255,255,255,.06)" };
}

function formatName(rawName) {
  if (!rawName) return "";
  let clean = rawName.replace(/^@[\w.-]+\//, "");
  clean = clean.replace(/[-_]+/g, " ");
  return clean.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function formatSubtitle(item) {
  const parts = [];
  if (item.category) parts.push(item.category);
  const sl = sourceLabel(item.url);
  if (sl) parts.push(sl);
  return parts.join(" · ") || item.source || "";
}

function extractRepoPath(item) {
  if (!item.url) return null;
  const m = item.url.match(/github\.com\/([^/]+\/[^/]+)/);
  return m ? m[1] : null;
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [newCount, setNewCount] = useState(0);

  // ── Upvote + Saved state ──
  const [voterId, setVoterId] = useState(null);
  const [userVotes, setUserVotes] = useState(new Set());
  const [showSaved, setShowSaved] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);

  const fetchFeed = useCallback(() => {
    return fetch("/api/scanner?limit=300&fresh=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.discoveries) {
          setDiscoveries((prev) => {
            const byId = new Map(prev.map((item) => [item.id || item.external_id, item]));
            for (const item of d.discoveries) byId.set(item.id || item.external_id, item);
            return [...byId.values()]
              .sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at))
              .slice(0, 300);
          });
          setStats(d.stats);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setTimeout(() => setRefreshing(false), 500));
  }, [fetchFeed]);

  useEffect(() => { fetchFeed(); const i = setInterval(fetchFeed, 15_000); return () => clearInterval(i); }, [fetchFeed]);

  // ── Self-healing: trigger scans from client to keep data fresh ──
  useEffect(() => {
    const triggerScan = () => {
      fetch("/api/scanner?trigger=1").catch(() => {});
    };
    triggerScan();
    const i = setInterval(triggerScan, 60_000);
    return () => clearInterval(i);
  }, []);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel("scanner-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scanner_discoveries" },
        (p) => {
          setDiscoveries((prev) => {
            const id = p.new.id || p.new.external_id;
            if (prev.some((d) => (d.id || d.external_id) === id)) return prev;
            return [p.new, ...prev].slice(0, 300);
          });
          setStats((prev) => ({ today: prev.today + 1, this_hour: prev.this_hour + 1 }));
          setNewCount((prev) => prev + 1);
        })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") console.log("[Screener] Realtime connected");
        if (status === "CHANNEL_ERROR") console.warn("[Screener] Realtime channel error");
      });
    return () => supabase.removeChannel(ch);
  }, [supabase]);

  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 10_000); return () => clearInterval(id); }, []);

  // ── Escape to close detail panel ──
  useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e) => { if (e.key === "Escape") setSelectedItem(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedItem]);

  // ── Lock body scroll when panel is open ──
  useEffect(() => {
    document.body.style.overflow = selectedItem ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedItem]);

  // ── Voter fingerprint init ──
  useEffect(() => {
    let id = localStorage.getItem("as_voter_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("as_voter_id", id);
    }
    setVoterId(id);
    fetch(`/api/vote?voter_id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.votes) setUserVotes(new Set(d.votes)); })
      .catch(() => {});
  }, []);

  // ── Vote handler (optimistic) ──
  const handleVote = useCallback(async (e, discoveryId) => {
    e.stopPropagation();
    if (!voterId) return;
    const wasVoted = userVotes.has(discoveryId);
    setUserVotes((prev) => {
      const n = new Set(prev);
      wasVoted ? n.delete(discoveryId) : n.add(discoveryId);
      return n;
    });
    setDiscoveries((prev) =>
      prev.map((d) => d.id === discoveryId ? { ...d, upvotes: (d.upvotes || 0) + (wasVoted ? -1 : 1) } : d)
    );
    try {
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discovery_id: discoveryId, voter_id: voterId }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setUserVotes((prev) => {
        const n = new Set(prev);
        wasVoted ? n.add(discoveryId) : n.delete(discoveryId);
        return n;
      });
      setDiscoveries((prev) =>
        prev.map((d) => d.id === discoveryId ? { ...d, upvotes: (d.upvotes || 0) + (wasVoted ? 1 : -1) } : d)
      );
    }
  }, [voterId, userVotes]);

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
    if (showSaved) items = items.filter((d) => userVotes.has(d.id));
    if (catFilter !== "All") items = items.filter((d) => d.category === catFilter);
    if (q) { const lq = q.toLowerCase(); items = items.filter((d) => d.name?.toLowerCase().includes(lq) || d.description?.toLowerCase().includes(lq) || d.category?.toLowerCase().includes(lq) || d.author?.toLowerCase().includes(lq)); }
    return items;
  }, [discoveries, catFilter, q, showSaved, userVotes]);

  const sourceCount = useMemo(() => {
    const s = new Set();
    for (const d of discoveries) if (d.source) s.add(d.source);
    return s.size;
  }, [discoveries]);

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--em": "#2DD4BF", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fi-scale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 15px rgba(45,212,191,.03) } 50% { box-shadow: 0 0 25px rgba(45,212,191,.06) } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes ring-rotate { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-in-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes new-glow { 0%,100% { box-shadow: inset 3px 0 12px -4px rgba(45,212,191,.04) } 50% { box-shadow: inset 3px 0 12px -4px rgba(45,212,191,.1) } }
        @keyframes vote-pop { 0% { transform: scale(1) } 50% { transform: scale(1.3) } 100% { transform: scale(1) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .card { transition: all .2s cubic-bezier(.4,0,.2,1); border: 1px solid var(--b1); border-left: 2px solid transparent; cursor: pointer; position: relative; }
        .card:hover { border-left-color: rgba(45,212,191,.4); background: rgba(255,255,255,.015) !important; box-shadow: 0 2px 16px rgba(0,0,0,.15); }
        .card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent); opacity: 0; transition: opacity .25s; pointer-events: none; }
        .card:hover::after { opacity: 1; }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .ghost-btn { transition: all .15s; cursor: pointer; border: 1px solid var(--b1); background: transparent; }
        .ghost-btn:hover { background: rgba(255,255,255,.04); border-color: var(--b2); }
        .stat-card { background: var(--s1); border: 1px solid var(--b1); border-radius: 10px; padding: 14px 18px; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent); }
        .detail-panel::-webkit-scrollbar { width: 4px; }
        .detail-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
        .vote-btn { transition: all .15s; cursor: pointer; border: none; background: transparent; }
        .vote-btn:hover { background: rgba(255,255,255,.04) !important; }
        .vote-btn:active .vote-arrow { animation: vote-pop .2s ease; }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.02) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,.015) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "40%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.01) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ─── HEADER ─── */}
      <header style={{ padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.88)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div style={{ height: 20, width: 1, background: "var(--b2)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t2)", letterSpacing: ".06em", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>SCREENER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Scanning indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".04em" }}>LIVE</span>
            <div style={{ width: 30, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
              <div style={{ width: "30%", height: "100%", background: "rgba(45,212,191,.4)", animation: "scan-line 2s ease-in-out infinite" }} />
            </div>
          </div>
          <button className="ghost-btn" onClick={handleRefresh} disabled={refreshing} style={{ padding: "6px 14px", borderRadius: 6, color: "var(--t2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", display: "flex", alignItems: "center", gap: 6, opacity: refreshing ? 0.5 : 1 }}>
            <span style={{ display: "inline-block", fontSize: 14, animation: refreshing ? "spin .5s linear infinite" : "none" }}>⟳</span>
            Refresh
          </button>
          <a href="/dashboard" className="link-hover" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 12, fontWeight: 600 }}>Dashboard</a>
        </div>
      </header>

      {/* ─── HERO STATS ─── */}
      <div style={{ padding: "20px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Detected Today", value: stats.today, icon: "◈", color: "#2DD4BF" },
            { label: "This Hour", value: stats.this_hour, icon: "⏱", color: "#A78BFA" },
            { label: "In Feed", value: filtered.length, icon: "◉", color: "#38BDF8" },
            { label: "Sources Active", value: sourceCount || 11, icon: "⊛", color: "#FBBF24" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ animation: `fi .4s ease ${i * 0.06}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 6, fontFamily: "var(--m)" }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em", lineHeight: 1 }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 18, color: s.color, opacity: 0.5 }}>{s.icon}</span>
              </div>
              <div style={{ marginTop: 10, height: 2, borderRadius: 1, background: "rgba(255,255,255,.04)" }}>
                <div style={{ width: `${Math.min((s.value / Math.max(stats.today || 1, 1)) * 100, 100)}%`, height: "100%", background: s.color, borderRadius: 1, transition: "width .5s ease", minWidth: s.value > 0 ? "4%" : "0%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div style={{ padding: "0 32px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", maxWidth: "65%", paddingBottom: 2 }}>
          <button className={`pill${showSaved ? " on" : ""}`} onClick={() => { setShowSaved(!showSaved); if (!showSaved) setCatFilter("All"); }} style={{ padding: "6px 14px", borderRadius: 4, border: showSaved ? "1px solid rgba(255,255,255,.12)" : "1px solid var(--b1)", background: showSaved ? "rgba(45,212,191,.04)" : "transparent", fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: showSaved ? "var(--g)" : "var(--t2)", whiteSpace: "nowrap" }}>
            ★ Saved
            {userVotes.size > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: "var(--m)" }}>{userVotes.size}</span>}
          </button>
          <button className={`pill${catFilter === "All" && !showSaved ? " on" : ""}`} onClick={() => { setCatFilter("All"); setShowSaved(false); }} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>All</button>
          {topCats.map((cat) => (
            <button key={cat} className={`pill${catFilter === cat ? " on" : ""}`} onClick={() => setCatFilter(catFilter === cat ? "All" : cat)} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>
              {cat}
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: "var(--m)" }}>{catCounts[cat]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." style={{ width: 220, padding: "8px 12px 8px 32px", fontSize: 12, borderRadius: 6, border: "1px solid var(--b1)", background: "var(--s1)", color: "var(--t1)", outline: "none", fontFamily: "var(--m)", transition: "border-color .15s" }} onFocus={(e) => e.target.style.borderColor = "var(--b2)"} onBlur={(e) => e.target.style.borderColor = "var(--b1)"} />
          </div>
          <div style={{ display: "flex", borderRadius: 4, border: "1px solid var(--b1)", overflow: "hidden" }}>
            {["feed", "grid"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", border: "none", background: view === v ? "rgba(255,255,255,.06)" : "transparent", color: view === v ? "var(--t1)" : "var(--t3)", fontSize: 12, cursor: "pointer", transition: "all .12s", fontFamily: "var(--m)" }}>{v === "feed" ? "☰" : "⊞"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── NEW PRODUCTS BANNER ─── */}
      {newCount > 0 && (
        <div style={{ position: "sticky", top: 56, zIndex: 50, margin: "0 32px 12px", padding: "10px 20px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)", animation: "fi .3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", fontFamily: "var(--m)" }}>
              {newCount} new product{newCount > 1 ? "s" : ""} discovered
            </span>
          </div>
          <button onClick={() => { setNewCount(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "5px 14px", borderRadius: 4, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "var(--t1)", fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", cursor: "pointer", letterSpacing: ".04em" }}>
            SHOW ↑
          </button>
        </div>
      )}

      {/* ─── FEED / GRID ─── */}
      <div style={{ padding: "0 32px 60px", position: "relative", zIndex: 1 }}>
        {filtered.length === 0 && showSaved ? (
          <div style={{ padding: "80px 0", textAlign: "center", animation: "fi .5s ease both" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>★</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 8, fontFamily: "var(--m)" }}>No saved products yet</div>
            <div style={{ fontSize: 13, color: "var(--t2)", maxWidth: 380, margin: "0 auto" }}>Upvote products to save them here. Your saved items persist across sessions.</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : view === "feed" ? (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {filtered.map((d, i) => <FeedCard key={d.id || d.external_id} item={d} index={i} onSelect={setSelectedItem} voted={userVotes.has(d.id)} onVote={handleVote} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {filtered.map((d, i) => <GridCard key={d.id || d.external_id} item={d} index={i} onSelect={setSelectedItem} voted={userVotes.has(d.id)} onVote={handleVote} />)}
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

      {/* ─── DETAIL PANEL ─── */}
      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} voted={userVotes.has(selectedItem.id)} onVote={handleVote} />}
    </div>
  );
}

// ─── Upvote Button ───
function UpvoteButton({ item, voted, onVote, size = "sm" }) {
  const isLg = size === "lg";
  return (
    <button
      className="vote-btn"
      onClick={(e) => onVote(e, item.id)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        padding: isLg ? "8px 14px" : "4px 8px", borderRadius: 4,
        border: `1px solid ${voted ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.06)"}`,
        background: voted ? "rgba(45,212,191,.04)" : "transparent",
        minWidth: isLg ? 48 : 36,
      }}
    >
      <span className="vote-arrow" style={{
        fontSize: isLg ? 16 : 12, lineHeight: 1,
        color: voted ? "#2DD4BF" : "var(--t3)",
        transition: "color .15s",
      }}>
        {voted ? "▲" : "△"}
      </span>
      <span style={{
        fontSize: isLg ? 12 : 10, fontWeight: 700, fontFamily: "var(--m)",
        color: voted ? "#2DD4BF" : "var(--t3)",
        transition: "color .15s",
      }}>
        {item.upvotes || 0}
      </span>
    </button>
  );
}

// ─── Feed Card (list view) ───
function FeedCard({ item, index, onSelect, voted, onVote }) {
  const confidence = Math.round((item.ai_confidence || 0) * 100);
  const grade = confidenceGrade(confidence);
  const age = item.discovered_at ? timeAgo(item.discovered_at) : "—";
  const isVeryNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 120_000;
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;
  const repoPath = extractRepoPath(item);

  return (
    <div className="card" onClick={() => onSelect?.(item)} style={{
      padding: "16px 20px", borderRadius: 6, background: "var(--s1)", marginBottom: 8,
      animation: `fi .35s ease ${Math.min(index * 0.04, 0.6)}s both`,
      borderLeftColor: isVeryNew ? "#2DD4BF" : undefined,
      ...(isVeryNew ? { animation: `fi .35s ease ${Math.min(index * 0.04, 0.6)}s both, new-glow 2s ease-in-out infinite` } : {}),
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Confidence bar */}
        <div style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0, paddingTop: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--m)", color: grade.color }}>{grade.label}</span>
          <div style={{ width: "100%", height: 3, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
            <div style={{ width: `${confidence}%`, height: "100%", background: grade.color, borderRadius: 1, transition: "width .3s ease" }} />
          </div>
          <span style={{ fontSize: 8, fontFamily: "var(--m)", color: "var(--t3)" }}>{confidence}%</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{formatName(item.name)}</span>
            {isNew && <span style={{ fontSize: 8, fontWeight: 800, fontFamily: "var(--m)", color: "#2DD4BF", letterSpacing: ".06em" }}>NEW</span>}
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{formatSubtitle(item)}</span>
            {repoPath && <span style={{ fontFamily: "var(--m)", fontSize: 10, opacity: 0.6 }}>{repoPath}</span>}
            {item.author && (
              item.author_url
                ? <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</a>
                : <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</span>
            )}
          </div>

          {/* Description — 2-line clamp */}
          {item.description && (
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
          )}

          {/* Metadata row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {item.category && (
              <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>
            )}
            {item.language && (
              <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.language}</span>
            )}
            {item.stars > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>★ {fmtN(item.stars)}</span>}
            {item.downloads > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>↓ {fmtN(item.downloads)}</span>}
            <span style={{ fontSize: 11, color: "var(--t3)" }}>·</span>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 500, color: "var(--t3)" }}>{sourceLabel(item.url)} ↗</a>}
          </div>
        </div>

        {/* Right column: upvote + time */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <UpvoteButton item={item} voted={voted} onVote={onVote} />
          <div style={{ fontSize: 11, fontWeight: 600, color: isNew ? "#2DD4BF" : "var(--t3)", fontFamily: "var(--m)" }}>{age}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ───
function GridCard({ item, index, onSelect, voted, onVote }) {
  const confidence = Math.round((item.ai_confidence || 0) * 100);
  const grade = confidenceGrade(confidence);
  const isVeryNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 120_000;
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;

  return (
    <div className="card" onClick={() => onSelect?.(item)} style={{
      padding: "18px 20px", borderRadius: 8, background: "var(--s1)",
      animation: `fi-scale .3s ease ${Math.min(index * 0.04, 0.5)}s both`,
      borderLeftColor: isVeryNew ? "#2DD4BF" : undefined,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: grade.bg, border: `1px solid ${grade.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", color: grade.color }}>{grade.label}</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{formatName(item.name)}</span>
              {isNew && <span style={{ fontSize: 8, fontWeight: 800, fontFamily: "var(--m)", color: "#2DD4BF", letterSpacing: ".06em" }}>NEW</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1, fontFamily: "var(--m)" }}>{formatSubtitle(item)}</div>
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
        {[
          item.stars > 0 && { label: "Stars", value: fmtN(item.stars) },
          item.downloads > 0 && { label: "Downloads", value: fmtN(item.downloads) },
          item.language && { label: "Language", value: item.language },
        ].filter(Boolean).slice(0, 3).map((m, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 2, fontFamily: "var(--m)" }}>{m.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{m.value}</div>
          </div>
        ))}
        {![item.stars, item.downloads].some(v => v > 0) && !item.language && (
          <div style={{ flex: 1, fontSize: 10, color: "var(--t3)", fontStyle: "italic", fontFamily: "var(--m)" }}>Newly detected</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {item.category && <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>}
          <UpvoteButton item={item} voted={voted} onVote={onVote} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,.06)" }}>{sourceLabel(item.url)} ↗</a>}
          {item.author_url && <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,.06)" }}>Profile</a>}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel (slide-out from right) ───
function DetailPanel({ item, onClose, voted, onVote }) {
  if (!item) return null;

  const confidence = Math.round((item.ai_confidence || 0) * 100);
  const grade = confidenceGrade(confidence);
  const repoPath = extractRepoPath(item);
  const sl = sourceLabel(item.url);

  const metrics = [
    { label: "Stars", value: fmtN(item.stars), show: item.stars > 0 },
    { label: "Forks", value: fmtN(item.forks), show: item.forks > 0 },
    { label: "Downloads", value: fmtN(item.downloads), show: item.downloads > 0 },
    { label: "Language", value: item.language, show: !!item.language },
    { label: "License", value: item.license, show: !!item.license },
  ].filter((m) => m.show);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", zIndex: 200, animation: "fade-in .2s ease" }} />

      {/* Panel */}
      <div className="detail-panel" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "90vw", background: "#12141C", borderLeft: "1px solid rgba(255,255,255,.06)", zIndex: 201, overflowY: "auto", animation: "slide-in-right .25s cubic-bezier(.4,0,.2,1)", boxShadow: "-20px 0 60px rgba(0,0,0,.4)" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F2F2F7", margin: 0, letterSpacing: "-.02em", lineHeight: 1.3 }}>
              {formatName(item.name)}
            </h2>
            <div style={{ fontSize: 12, color: "rgba(242,242,247,.38)", marginTop: 4, fontFamily: "var(--m)" }}>
              {formatSubtitle(item)}
            </div>
            {repoPath && (
              <div style={{ fontSize: 11, fontFamily: "var(--m)", color: "rgba(242,242,247,.38)", marginTop: 2, opacity: 0.7 }}>
                {repoPath}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(242,242,247,.65)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
            ✕
          </button>
        </div>

        {/* Badges + Confidence */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          {sl && <span style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 600, color: "rgba(242,242,247,.65)", fontFamily: "var(--m)" }}>{sl}</span>}
          {item.category && <span style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--m)", color: grade.color }}>{grade.label}</span>
              <div style={{ width: 36, height: 3, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${confidence}%`, height: "100%", background: grade.color, borderRadius: 1 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: grade.color, fontFamily: "var(--m)" }}>{confidence}%</div>
              <div style={{ fontSize: 9, color: "rgba(242,242,247,.38)", letterSpacing: ".04em", fontFamily: "var(--m)" }}>CONFIDENCE</div>
            </div>
          </div>
        </div>

        {/* Author */}
        {item.author && (
          <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--m)" }}>
              {item.author[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7" }}>{item.author}</div>
              <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", fontFamily: "var(--m)" }}>Author</div>
            </div>
            {item.author_url && (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "rgba(242,242,247,.38)", textDecoration: "none", padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,.08)", transition: "all .15s", fontFamily: "var(--m)" }}>
                Profile ↗
              </a>
            )}
          </div>
        )}

        {/* Description */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>Description</div>
          <div style={{ fontSize: 13, color: "rgba(242,242,247,.65)", lineHeight: 1.65 }}>
            {item.description || "No description available."}
          </div>
        </div>

        {/* Metrics grid */}
        {metrics.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 10, fontFamily: "var(--m)" }}>Metrics</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--m)", color: "#F2F2F7" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {item.topics?.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>Topics</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.topics.map((t, i) => (
                <span key={i} style={{ padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 500, color: "rgba(242,242,247,.65)", fontFamily: "var(--m)" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Keywords */}
        {item.ai_keywords?.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>AI Classification</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.ai_keywords.map((kw, i) => (
                <span key={i} style={{ padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>Discovered</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7", fontFamily: "var(--m)" }}>{item.discovered_at ? timeAgo(item.discovered_at) : "—"}</div>
            {item.discovered_at && <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", marginTop: 1, fontFamily: "var(--m)" }}>{new Date(item.discovered_at).toLocaleDateString()}</div>}
          </div>
          {item.source_created_at && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>Created</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7", fontFamily: "var(--m)" }}>{timeAgo(item.source_created_at)}</div>
              <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", marginTop: 1, fontFamily: "var(--m)" }}>{new Date(item.source_created_at).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ padding: "20px 24px", display: "flex", gap: 10, alignItems: "center" }}>
          <UpvoteButton item={item} voted={voted} onVote={onVote} size="lg" />
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 0", borderRadius: 6, background: "#2DD4BF", color: "#0A0B10", fontSize: 13, fontWeight: 800, textDecoration: "none", textAlign: "center", display: "block", transition: "opacity .15s", fontFamily: "var(--m)", letterSpacing: ".02em" }}>
            Open Product →
          </a>
          {item.author_url && (
            <a href={item.author_url} target="_blank" rel="noopener noreferrer" style={{ padding: "12px 20px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(242,242,247,.65)", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center", transition: "all .15s" }}>
              View Author
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Empty State ───
function EmptyState() {
  return (
    <div style={{ padding: "100px 0", textAlign: "center", animation: "fi .5s ease both" }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: 32, width: 100, height: 100 }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,.04), rgba(167,139,250,.02))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 32, filter: "saturate(0) brightness(1.2)", animation: "float 3s ease-in-out infinite" }}>⌕</span>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)", animation: "ring-rotate 8s linear infinite" }}>
          <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF" }} />
        </div>
        <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1px dashed rgba(167,139,250,.1)", animation: "ring-rotate 12s linear infinite reverse" }} />
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", marginBottom: 10, letterSpacing: "-.02em" }}>
        Screening the AI ecosystem
      </div>
      <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 32px" }}>
        Our intelligence engine monitors 11 sources across the internet for new AI products, agents, models, and tools. Discoveries appear here in real-time.
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 6, background: "var(--s1)", border: "1px solid var(--b1)" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>Intelligence engine active — awaiting first screening cycle</span>
      </div>
    </div>
  );
}
