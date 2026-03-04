"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/pipeline/registry";

// ─── Time ago ───
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Format number ───
function fmtN(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function ScreenerClient() {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState({ today: 0, this_hour: 0 });
  const [catFilter, setCatFilter] = useState("All");
  const [q, setQ] = useState("");
  const [, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);

  // ─── Fetch feed (shared between polling + manual refresh) ───
  const fetchFeed = useCallback(() => {
    return fetch("/api/scanner?limit=150")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.discoveries) {
          setDiscoveries(d.discoveries);
          setStats(d.stats);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setTimeout(() => setRefreshing(false), 400));
  }, [fetchFeed]);

  // ─── Polling ───
  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30_000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // ─── Supabase Realtime ───
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("scanner-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scanner_discoveries" },
        (payload) => {
          setDiscoveries((prev) => [payload.new, ...prev].slice(0, 200));
          setStats((prev) => ({
            today: prev.today + 1,
            this_hour: prev.this_hour + 1,
          }));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [supabase]);

  // ─── Tick for relative timestamps ───
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // ─── Category counts ───
  const catCounts = useMemo(() => {
    const counts = {};
    for (const d of discoveries) {
      if (d.category) counts[d.category] = (counts[d.category] || 0) + 1;
    }
    return counts;
  }, [discoveries]);

  // Top categories for filter (sorted by count)
  const topCats = useMemo(() => {
    return Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat);
  }, [catCounts]);

  // ─── Filtered feed ───
  const filtered = useMemo(() => {
    let items = discoveries;
    if (catFilter !== "All") {
      items = items.filter((d) => d.category === catFilter);
    }
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter(
        (d) =>
          d.name?.toLowerCase().includes(lq) ||
          d.description?.toLowerCase().includes(lq) ||
          d.category?.toLowerCase().includes(lq) ||
          d.author?.toLowerCase().includes(lq)
      );
    }
    return items;
  }, [discoveries, catFilter, q]);

  return (
    <div
      style={{
        "--bg": "#0A0B0F",
        "--s1": "#12131A",
        "--s2": "rgba(255,255,255,.03)",
        "--b1": "rgba(255,255,255,.06)",
        "--b2": "rgba(255,255,255,.1)",
        "--t1": "#F0F0F5",
        "--t2": "rgba(240,240,245,.6)",
        "--t3": "rgba(240,240,245,.35)",
        "--t4": "rgba(240,240,245,.12)",
        "--g": "#2563EB",
        "--gg": "rgba(37,99,235,.25)",
        "--gd": "rgba(37,99,235,.08)",
        "--m": "'JetBrains Mono', 'SF Mono', monospace",
        "--f": "'Helvetica Neue', Helvetica, Arial, sans-serif",
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--t1)",
        fontFamily: "var(--f)",
      }}
    >
      <style suppressHydrationWarning>{`
        @keyframes fi { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lp { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes grid-move { from { transform: translateY(0) } to { transform: translateY(40px) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .refresh-btn { transition: all .12s; cursor: pointer; }
        .refresh-btn:hover { background: rgba(255,255,255,.06) !important; border-color: var(--b2) !important; color: var(--t1) !important; }
        .link-sm { transition: color .12s; text-decoration: none; }
        .link-sm:hover { color: #2563EB !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(37,99,235,.3); }
        .feed-item { transition: background .15s; cursor: default; }
        .feed-item:hover { background: rgba(255,255,255,.02) !important; }
        .cat-btn { transition: all .12s; cursor: pointer; border: 1px solid var(--b1); background: transparent; color: var(--t2); }
        .cat-btn:hover { background: rgba(255,255,255,.04); border-color: var(--b2); }
        .cat-btn.active { background: var(--gd); border-color: var(--gg); color: var(--g); }
      `}</style>

      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.02,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "grid-move 8s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "fixed",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120vw",
          height: "60vh",
          background: "radial-gradient(ellipse, rgba(37,99,235,.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── HEADER ─── */}
      <header
        style={{
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--b1)",
          background: "rgba(10,11,15,.92)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              color: "var(--t1)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#FFF",
                  fontFamily: "var(--m)",
                }}
              >
                AS
              </span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)",
                  animation: "sl 3s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "var(--m)",
                letterSpacing: "-.01em",
              }}
            >
              AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
            </span>
          </a>
          <div
            style={{ width: 1, height: 18, background: "var(--b2)", margin: "0 4px" }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--m)",
              color: "var(--g)",
              letterSpacing: ".02em",
            }}
          >
            SCREENER
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 600,
              color: "#16A34A",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#16A34A",
                animation: "lp 2s ease-in-out infinite",
                boxShadow: "0 0 6px rgba(22,163,74,.4)",
              }}
            />
            SCREENING
          </div>
          <div style={{ width: 1, height: 18, background: "var(--b2)" }} />
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--b1)",
              background: "transparent",
              color: "var(--t2)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "var(--f)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <span style={{ display: "inline-block", animation: refreshing ? "spin .6s linear infinite" : "none" }}>↻</span>
            Refresh
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--b2)",
              background: "transparent",
              color: "var(--t2)",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* ─── STATS BAR ─── */}
      <div
        style={{
          padding: "10px 24px",
          display: "flex",
          gap: 24,
          borderBottom: "1px solid var(--b1)",
          background: "rgba(255,255,255,.01)",
        }}
      >
        {[
          ["Detected Today", stats.today],
          ["This Hour", stats.this_hour],
          ["In Feed", filtered.length],
          ["Categories", Object.keys(catCounts).length],
        ].map(([label, value], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "var(--t3)",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--m)",
                color: "var(--t1)",
              }}
            >
              {value}
            </span>
          </div>
        ))}

        {/* Scan progress indicator */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: 80,
            height: 3,
            borderRadius: 2,
            background: "var(--b1)",
            overflow: "hidden",
            alignSelf: "center",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              borderRadius: 2,
              background: "var(--g)",
              animation: "scan 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div
        style={{
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "1px solid var(--b1)",
          background: "rgba(255,255,255,.005)",
          overflowX: "auto",
        }}
      >
        <button
          className={`cat-btn${catFilter === "All" ? " active" : ""}`}
          onClick={() => setCatFilter("All")}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--f)",
            whiteSpace: "nowrap",
          }}
        >
          All
        </button>
        {topCats.map((cat) => (
          <button
            key={cat}
            className={`cat-btn${catFilter === cat ? " active" : ""}`}
            onClick={() => setCatFilter(catFilter === cat ? "All" : cat)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "var(--f)",
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "var(--t3)",
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            style={{
              width: 180,
              padding: "6px 10px 6px 27px",
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid var(--b1)",
              background: "rgba(255,255,255,.03)",
              color: "var(--t1)",
              outline: "none",
              fontFamily: "var(--f)",
            }}
          />
        </div>
      </div>

      {/* ─── FEED ─── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "100px 0",
              textAlign: "center",
              animation: "fi .4s ease both",
            }}
          >
            <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  background: "var(--gd)",
                  border: "1px solid rgba(37,99,235,.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  margin: "0 auto",
                }}
              >
                ⌕
              </div>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--m)",
                color: "var(--t1)",
                marginBottom: 8,
                letterSpacing: "-.01em",
              }}
            >
              Screening the AI ecosystem
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--t2)",
                lineHeight: 1.7,
                maxWidth: 420,
                margin: "0 auto 28px",
              }}
            >
              AgentScreener's intelligence engine continuously monitors the internet
              for new AI products, agents, models, and tools. Discoveries appear
              here in real-time as they're detected.
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--s1)",
                border: "1px solid var(--b1)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--t3)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16A34A",
                  animation: "lp 2s ease-in-out infinite",
                }}
              />
              Intelligence engine active — awaiting first screening cycle
            </div>
          </div>
        ) : (
          filtered.map((d, i) => (
            <FeedItem key={d.id || d.external_id} item={d} index={i} />
          ))
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          padding: "24px 48px",
          borderTop: "1px solid var(--b1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <span
          style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}
        >
          AGENTSCREENER SCREENER v0.1
        </span>
        <span style={{ fontSize: 11, color: "var(--t3)" }}>
          Powered by AgentScreener Intelligence
        </span>
      </footer>
    </div>
  );
}

// ─── Source link label ───
function sourceLabel(url) {
  if (!url) return null;
  if (url.includes("github.com")) return "Repo";
  if (url.includes("pypi.org")) return "Package";
  if (url.includes("npmjs.com") || url.includes("npmjs.org")) return "Package";
  if (url.includes("huggingface.co/spaces")) return "Space";
  if (url.includes("huggingface.co")) return "Model";
  if (url.includes("ycombinator.com") || url.includes("news.ycombinator")) return "Discussion";
  if (url.includes("reddit.com")) return "Thread";
  if (url.includes("producthunt.com")) return "Launch";
  if (url.includes("arxiv.org")) return "Paper";
  return "View";
}

// ─── Feed Item ───
function FeedItem({ item, index }) {
  const confidence = Math.round((item.ai_confidence || 0) * 100);

  // Confidence-based accent color
  const accentColor =
    confidence >= 80 ? "#16A34A" : confidence >= 60 ? "#2563EB" : confidence >= 40 ? "#D97706" : "var(--t3)";

  return (
    <div
      className="feed-item"
      style={{
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,.04)",
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        gap: "0 14px",
        alignItems: "start",
        animation: `fi .35s ease ${Math.min(index * 0.03, 0.5)}s both`,
      }}
    >
      {/* Age + confidence indicator */}
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--m)",
            color: "var(--t2)",
            marginBottom: 4,
          }}
        >
          {item.discovered_at ? timeAgo(item.discovered_at) : "—"}
        </div>
        {/* Confidence bar */}
        <div
          style={{
            width: 28,
            height: 3,
            borderRadius: 2,
            background: "var(--b1)",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${confidence}%`,
              height: "100%",
              borderRadius: 2,
              background: accentColor,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Name + author */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--m)",
              color: "var(--t1)",
              textDecoration: "none",
              letterSpacing: "-.01em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t1)")}
          >
            {item.name}
          </a>
          {item.author && (
            item.author_url ? (
              <a
                href={item.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sm"
                style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}
              >
                {item.author}
              </a>
            ) : (
              <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>
                {item.author}
              </span>
            )
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div
            style={{
              fontSize: 12,
              color: "var(--t2)",
              lineHeight: 1.5,
              marginBottom: 6,
              maxWidth: 640,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.description}
          </div>
        )}

        {/* Tags row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {/* Category */}
          {item.category && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--gd)",
                border: "1px solid rgba(37,99,235,.15)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--g)",
              }}
            >
              {item.category}
            </span>
          )}

          {/* Language */}
          {item.language && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(255,255,255,.04)",
                border: "1px solid var(--b1)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--t2)",
              }}
            >
              {item.language}
            </span>
          )}

          {/* Stars */}
          {item.stars > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--t3)",
                fontFamily: "var(--m)",
              }}
            >
              ★ {fmtN(item.stars)}
            </span>
          )}

          {/* Downloads */}
          {item.downloads > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--t3)",
                fontFamily: "var(--m)",
              }}
            >
              ↓ {fmtN(item.downloads)}
            </span>
          )}

          {/* Upvotes */}
          {item.upvotes > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--t3)",
                fontFamily: "var(--m)",
              }}
            >
              ▲ {item.upvotes}
            </span>
          )}

          {/* Source links */}
          {(item.url || item.author_url) && (
            <>
              <span style={{ color: "var(--b2)", fontSize: 10 }}>·</span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-sm"
                  style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)" }}
                >
                  ↗ {sourceLabel(item.url)}
                </a>
              )}
              {item.author_url && (
                <a
                  href={item.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-sm"
                  style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)" }}
                >
                  ◉ Profile
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* External link */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: "1px solid var(--b1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "var(--t3)",
          textDecoration: "none",
          marginTop: 2,
          transition: "all .12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--b2)";
          e.currentTarget.style.color = "var(--t1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--b1)";
          e.currentTarget.style.color = "var(--t3)";
        }}
      >
        ↗
      </a>
    </div>
  );
}
