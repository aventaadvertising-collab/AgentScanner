"use client";

import { useState, useEffect, useMemo } from "react";
import { REGISTRY, CATEGORIES } from "@/lib/pipeline/registry";
import { CommitHeatmap } from "@/app/components/CommitHeatmap";

// ============================================================
// ACTIVITY PAGE — Development Pulse Dashboard
// Shows commit activity heatmaps for all tracked AI products
// ============================================================

function getTrend(weeks) {
  if (!weeks || weeks.length < 8) return null;
  const recent = weeks.slice(-4).reduce((s, w) => s + w.t, 0);
  const prev = weeks.slice(-8, -4).reduce((s, w) => s + w.t, 0);
  if (prev === 0 && recent === 0) return null;
  if (prev === 0) return { dir: "up", pct: 100 };
  const change = Math.round(((recent - prev) / prev) * 100);
  return { dir: change >= 0 ? "up" : "down", pct: Math.abs(change) };
}

function recentCommits(weeks) {
  if (!weeks) return 0;
  return weeks.slice(-4).reduce((s, w) => s + w.t, 0);
}

function totalCommits(weeks) {
  if (!weeks) return 0;
  return weeks.reduce((s, w) => s + w.t, 0);
}

export default function ActivityClient() {
  const [activityData, setActivityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);

  // Fetch all commit activity data
  const fetchActivity = () => {
    fetch("/api/data?source=github_activity")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data) {
          const map = {};
          for (const row of d.data) {
            if (row.data?.weeks) {
              map[row.product_id] = { weeks: row.data.weeks, fetched_at: row.fetched_at };
            }
          }
          setActivityData(map);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60_000);
    return () => clearInterval(interval);
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

  // Build product list with activity data
  const products = useMemo(() => {
    return REGISTRY
      .filter((p) => p.g) // Only products with GitHub repos
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.cat,
        repo: `${p.g.o}/${p.g.r}`,
        weeks: activityData[p.id]?.weeks || null,
        fetchedAt: activityData[p.id]?.fetched_at || null,
        recent: recentCommits(activityData[p.id]?.weeks),
        total: totalCommits(activityData[p.id]?.weeks),
        trend: getTrend(activityData[p.id]?.weeks),
      }))
      .sort((a, b) => b.recent - a.recent);
  }, [activityData]);

  // Categories with data
  const catCounts = useMemo(() => {
    const c = {};
    for (const p of products) if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [products]);

  const topCats = useMemo(() =>
    Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([cat]) => cat),
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

  const withData = filtered.filter((p) => p.weeks);
  const withoutData = filtered.filter((p) => !p.weeks);

  // Stats
  const totalProducts = products.filter((p) => p.weeks).length;
  const totalCommitsAll = products.reduce((s, p) => s + p.total, 0);
  const avgPerProduct = totalProducts > 0 ? Math.round(totalCommitsAll / totalProducts) : 0;

  void tick;

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--t4": "rgba(242,242,247,.2)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--up": "#16A34A", "--dn": "#DC2626", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .activity-card { border: 1px solid var(--b1); border-radius: 12px; background: var(--s1); padding: 20px; transition: all .2s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden; }
        .activity-card:hover { border-color: var(--b2); box-shadow: 0 4px 24px rgba(0,0,0,.2); }
        .activity-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent); }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        @media (max-width: 768px) {
          .activity-header { padding: 0 12px !important; }
          .activity-stats { grid-template-columns: repeat(2, 1fr) !important; padding: 12px !important; }
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".04em" }}>LIVE</span>
            <div style={{ width: 30, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
              <div style={{ width: "30%", height: "100%", background: "rgba(45,212,191,.4)", animation: "scan-line 2s ease-in-out infinite" }} />
            </div>
          </div>
          <a href="/dashboard" className="link-hover" style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", padding: "5px 12px", borderRadius: 4, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", padding: "5px 12px", borderRadius: 4, border: "1px solid var(--b1)", textDecoration: "none", fontFamily: "var(--m)" }}>Screener</a>
        </div>
      </header>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ─── STATS BAR ─── */}
        <div className="activity-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "16px 32px" }}>
          {[
            { label: "Products Tracked", value: totalProducts, sub: "with GitHub data" },
            { label: "Total Commits", value: totalCommitsAll.toLocaleString(), sub: "52 weeks" },
            { label: "Avg Per Product", value: avgPerProduct.toLocaleString(), sub: "commits / year" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 10, padding: "14px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent)" }} />
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", fontFamily: "var(--m)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── TOOLBAR ─── */}
        <div className="activity-toolbar" style={{ padding: "0 32px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Category pills */}
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
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              style={{ width: 200, padding: "7px 12px 7px 30px", borderRadius: 6, border: "1px solid var(--b1)", background: "rgba(255,255,255,.03)", color: "var(--t1)", fontSize: 12, fontFamily: "var(--m)", outline: "none" }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
          </div>
        </div>

        {/* ─── GRID ─── */}
        {loading ? (
          <div style={{ padding: "80px 32px", textAlign: "center" }}>
            <div style={{ width: 120, height: 4, borderRadius: 2, background: "rgba(255,255,255,.04)", overflow: "hidden", margin: "0 auto 16px", position: "relative" }}>
              <div style={{ width: "30%", height: "100%", borderRadius: 2, background: "rgba(45,212,191,.3)", position: "absolute", animation: "scan 1.5s ease-in-out infinite" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--m)" }}>Loading activity data...</div>
          </div>
        ) : (
          <div className="activity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, padding: "0 32px 40px" }}>
            {withData.map((p, i) => (
              <div key={p.id} className="activity-card" style={{ animation: `fi .4s ease ${Math.min(i * 0.03, 0.5)}s both` }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{p.name}</span>
                      {p.trend && (
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: p.trend.dir === "up" ? "var(--up)" : "var(--dn)", padding: "1px 6px", borderRadius: 3, background: p.trend.dir === "up" ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)" }}>
                          {p.trend.dir === "up" ? "↑" : "↓"} {p.trend.pct}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t3)", marginTop: 2 }}>{p.repo}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", color: "var(--t3)", whiteSpace: "nowrap" }}>{p.category}</span>
                </div>
                {/* Heatmap */}
                <CommitHeatmap weeks={p.weeks} fetchedAt={p.fetchedAt} />
              </div>
            ))}

            {/* Products without data yet */}
            {withoutData.map((p) => (
              <div key={p.id} className="activity-card" style={{ opacity: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{p.name}</span>
                    <div style={{ fontSize: 10, fontFamily: "var(--m)", color: "var(--t3)", marginTop: 2 }}>{p.repo}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--m)", padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid var(--b1)", color: "var(--t3)", whiteSpace: "nowrap" }}>{p.category}</span>
                </div>
                <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)" }}>
                  <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>Awaiting pipeline data</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── FOOTER ─── */}
        <footer className="activity-footer" style={{ padding: "20px 32px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} · {withData.length} with commit data
          </span>
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>
            Pipeline refreshes every 6 hours · Polling every 60s
          </span>
        </footer>
      </div>
    </div>
  );
}
