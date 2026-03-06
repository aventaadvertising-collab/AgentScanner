"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

function formatName(rawName) {
  if (!rawName) return "";
  let clean = rawName.replace(/^@[\w.-]+\//, "");
  clean = clean.replace(/[-_]+/g, " ");
  return clean.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function fmtN(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function LandingPage() {
  const auth = useAuth();
  const user = auth?.user;

  const [liveProducts, setLiveProducts] = useState([]);
  const [liveStats, setLiveStats] = useState({ today: 0, this_hour: 0 });

  if (user) {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  // Fetch live data for hero feed + ticker
  useEffect(() => {
    const fetchLive = () => {
      fetch("/api/scanner?limit=20&fresh=1")
        .then(r => r.json())
        .then(d => {
          if (d?.discoveries) setLiveProducts(d.discoveries);
          if (d?.stats) setLiveStats(d.stats);
        })
        .catch(() => {});
    };
    fetchLive();
    const i = setInterval(fetchLive, 30_000);
    return () => clearInterval(i);
  }, []);

  // Self-healing: trigger scanner from landing page
  useEffect(() => {
    const triggerScan = () => fetch("/api/scanner?trigger=1").catch(() => {});
    triggerScan();
    const i = setInterval(triggerScan, 60_000);
    return () => clearInterval(i);
  }, []);

  const heroProducts = liveProducts.slice(0, 6);
  const tickerProducts = liveProducts.slice(0, 20);

  const SOURCES = [
    { name: "GitHub", icon: "◆" },
    { name: "GitHub Trending", icon: "▲" },
    { name: "PyPI", icon: "◈" },
    { name: "npm", icon: "⬡" },
    { name: "HuggingFace", icon: "◉" },
    { name: "Hacker News", icon: "⊞" },
    { name: "Reddit", icon: "◎" },
    { name: "Product Hunt", icon: "◐" },
    { name: "arXiv", icon: "⊛" },
    { name: "Dev.to", icon: "⟐" },
    { name: "Lobsters", icon: "⊿" },
  ];

  const CATEGORIES = ["Code & Dev Tools", "AI Agents", "Agent Frameworks", "Foundation Models", "Video Generation", "Image Generation", "Search & Research", "Audio & Voice", "Inference & Serving", "Browser Use", "Data & Analytics", "Security AI"];

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fi-scale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes feed-in { from { opacity: 0; transform: translateX(12px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes glow-soft { 0%,100% { box-shadow: 0 0 15px rgba(45,212,191,.02) } 50% { box-shadow: 0 0 25px rgba(45,212,191,.04) } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .cta-btn { transition: all .2s cubic-bezier(.4,0,.2,1); }
        .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(45,212,191,.1), 0 8px 24px rgba(0,0,0,.3); }
        .ghost-btn { transition: all .2s; }
        .ghost-btn:hover { background: rgba(255,255,255,.04) !important; border-color: rgba(255,255,255,.12) !important; }
        .bento-card { background: var(--s1); border: 1px solid var(--b1); border-radius: 14px; padding: 28px 26px; position: relative; overflow: hidden; transition: all .25s; }
        .bento-card:hover { border-color: var(--b2); box-shadow: 0 2px 16px rgba(0,0,0,.15); }
        .bento-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent); }
        @media (max-width: 768px) {
          .hero-split { flex-direction: column !important; padding: 40px 16px 32px !important; gap: 28px !important; }
          .hero-left { max-width: 100% !important; }
          .hero-left h1 { font-size: 32px !important; }
          .hero-left p { font-size: 14px !important; }
          .hero-right { max-width: 100% !important; width: 100% !important; }
          .bento-grid { grid-template-columns: 1fr !important; }
          .bento-wide { grid-column: span 1 !important; }
          .nav-links { display: none !important; }
          .bento-section { padding: 12px 16px 48px !important; }
          .ticker-section { padding: 0 0 28px !important; }
          .landing-footer { padding: 16px !important; flex-direction: column !important; gap: 8px !important; text-align: center !important; }
          .hero-stats { gap: 20px !important; }
          .hero-ctas { flex-direction: column !important; }
          .hero-ctas a { width: 100% !important; text-align: center !important; justify-content: center !important; }
          .mini-terminal { display: none !important; }
          .landing-nav { padding: 0 16px !important; }
        }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "40%", width: "45vw", height: "45vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.02) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", top: "50%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,.015) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ─── NAV ─── */}
      <nav className="landing-nav" style={{ padding: "0 48px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.75)", backdropFilter: "blur(24px) saturate(180%)" }}>
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
          agent<span style={{ color: "var(--g)" }}>screener</span>
        </span>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/dashboard" className="link-hover" style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>Screener</a>
          <a href="/activity" className="link-hover" style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>Activity</a>
          <div style={{ width: 1, height: 20, background: "var(--b2)", margin: "0 4px" }} />
          <a href="/screener" className="cta-btn" style={{ padding: "8px 20px", borderRadius: 6, background: "#2DD4BF", color: "#0A0B10", fontSize: 13, fontWeight: 800, textDecoration: "none", letterSpacing: ".01em", fontFamily: "var(--m)" }}>Open Screener</a>
        </div>
      </nav>

      {/* ─── HERO: SPLIT LAYOUT ─── */}
      <section className="hero-split" style={{ padding: "80px 48px 60px", display: "flex", gap: 48, alignItems: "flex-start", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>

        {/* Left side — headline + CTA */}
        <div className="hero-left" style={{ flex: "1 1 45%", maxWidth: 500, animation: "fi .6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", marginBottom: 28 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>LIVE · {liveStats.today || 0} PRODUCTS TODAY</span>
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 900, fontFamily: "var(--f)", lineHeight: 1.05, letterSpacing: "-.04em", marginBottom: 20 }}>
            The intelligence layer for{" "}
            <span style={{ color: "var(--g)" }}>AI products</span>
          </h1>

          <p style={{ fontSize: 16, color: "var(--t2)", lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
            11 sources scanning every minute. Every AI startup, agent, model, and tool — discovered and tracked in real-time.
          </p>

          <div className="hero-ctas" style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <a href="/screener" className="cta-btn" style={{ padding: "14px 36px", borderRadius: 8, background: "#2DD4BF", color: "#0A0B10", fontSize: 15, fontWeight: 800, textDecoration: "none", letterSpacing: ".01em", boxShadow: "0 4px 16px rgba(0,0,0,.3)", fontFamily: "var(--m)" }}>
              Open Screener
            </a>
            <a href="/dashboard" className="ghost-btn" style={{ padding: "14px 28px", borderRadius: 8, border: "1px solid var(--b2)", background: "transparent", color: "var(--t1)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Dashboard
            </a>
          </div>

          {/* Quick stats */}
          <div className="hero-stats" style={{ display: "flex", gap: 32 }}>
            {[
              { label: "Today", value: liveStats.today || "—" },
              { label: "This hour", value: liveStats.this_hour || "—" },
              { label: "Sources", value: "11" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em" }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", fontFamily: "var(--m)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — LIVE FEED PREVIEW */}
        <div className="hero-right" style={{ flex: "1 1 55%", maxWidth: 580, animation: "fi .6s ease .15s both" }}>
          <div style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 14, overflow: "hidden", animation: "glow-soft 6s ease-in-out infinite" }}>
            {/* Feed header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".08em" }}>LIVE FEED</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>{heroProducts.length > 0 ? "updating in real-time" : "connecting..."}</span>
            </div>

            {/* Feed items */}
            <div style={{ padding: "4px 0" }}>
              {heroProducts.length > 0 ? heroProducts.map((item, i) => {
                return (
                  <a key={item.id || i} href="/screener" style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 14, textDecoration: "none", color: "inherit", transition: "background .15s", animation: `feed-in .4s ease ${i * 0.08}s both` }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {/* Name + category */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatName(item.name)}</div>
                      <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", marginTop: 1 }}>{item.category || item.source}</div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      {item.stars > 0 && <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>★{fmtN(item.stars)}</span>}
                      <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>▲{item.upvotes || 0}</span>
                      <span style={{ fontSize: 10, color: "var(--t3)" }}>{item.discovered_at ? timeAgo(item.discovered_at) : ""}</span>
                    </div>
                  </a>
                );
              }) : (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 20px", gap: 14, animation: `fi .3s ease ${i * 0.1}s both` }}>
                    <div style={{ width: 32, height: 16, borderRadius: 3, background: "rgba(255,255,255,.04)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: `${60 + Math.random() * 30}%`, height: 12, borderRadius: 3, background: "rgba(255,255,255,.04)", marginBottom: 4 }} />
                      <div style={{ width: "40%", height: 8, borderRadius: 3, background: "rgba(255,255,255,.03)" }} />
                    </div>
                    <div style={{ width: 40, height: 12, borderRadius: 3, background: "rgba(255,255,255,.03)" }} />
                  </div>
                ))
              )}
            </div>

            {/* Feed footer */}
            <a href="/screener" style={{ display: "block", padding: "12px 20px", borderTop: "1px solid var(--b1)", textAlign: "center", textDecoration: "none", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)", letterSpacing: ".04em", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              VIEW ALL {liveStats.today || ""} PRODUCTS →
            </a>
          </div>
        </div>
      </section>

      {/* ─── TICKER / MARQUEE ─── */}
      {tickerProducts.length > 0 && (
        <section className="ticker-section" style={{ padding: "0 0 48px", overflow: "hidden", position: "relative", zIndex: 10 }}>
          <div style={{ borderTop: "1px solid var(--b1)", borderBottom: "1px solid var(--b1)", padding: "14px 0", background: "rgba(18,20,28,.5)" }}>
            <div style={{ display: "flex", animation: "marquee 40s linear infinite", width: "max-content" }}>
              {[...tickerProducts, ...tickerProducts].map((item, i) => (
                <a key={i} href="/screener" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px", margin: "0 4px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", textDecoration: "none", whiteSpace: "nowrap", transition: "all .15s", flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.04)"; e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)" }}>{formatName(item.name)}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── BENTO GRID ─── */}
      <section className="bento-section" style={{ padding: "20px 48px 80px", position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto" }}>
        <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

          {/* Card 1: Sources — tall */}
          <div className="bento-card" style={{ animation: "fi-scale .4s ease .1s both" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g)", marginBottom: 16, fontFamily: "var(--m)" }}>INTELLIGENCE SOURCES</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 6 }}>11 sources</div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 20, lineHeight: 1.5 }}>Scanning every minute, 24/7</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SOURCES.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
                  <span style={{ fontSize: 12, color: "var(--g)", opacity: 0.6 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)", flex: 1 }}>{s.name}</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(45,212,191,.5)", animation: `lp 3s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Live Stats */}
          <div className="bento-card" style={{ animation: "fi-scale .4s ease .2s both", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#A78BFA", marginBottom: 16, fontFamily: "var(--m)" }}>LIVE STATS</div>
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "var(--m)", letterSpacing: "-.04em", lineHeight: 1, marginBottom: 4, color: "var(--t1)" }}>{liveStats.today || "—"}</div>
              <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>products discovered today</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>This hour</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)" }}>{liveStats.this_hour || "—"}</span>
              </div>
              <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,.04)" }}>
                <div style={{ width: `${Math.min((liveStats.this_hour / Math.max(liveStats.today || 1, 1)) * 100, 100)}%`, height: "100%", background: "#A78BFA", borderRadius: 1, transition: "width .5s ease", minWidth: "3%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>Scans/day</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)" }}>15K+</span>
              </div>
            </div>
          </div>

          {/* Card 3: Categories */}
          <div className="bento-card" style={{ animation: "fi-scale .4s ease .3s both" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#38BDF8", marginBottom: 16, fontFamily: "var(--m)" }}>COVERAGE</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 6 }}>28 categories</div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 18, lineHeight: 1.5 }}>Auto-classified by AI keyword matching</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map((c, i) => (
                <span key={i} style={{ padding: "5px 12px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", fontSize: 10, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Card 4: CTA — spans full bottom row */}
          <div className="bento-card bento-wide" style={{ gridColumn: "span 3", animation: "fi-scale .4s ease .4s both", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--g)", marginBottom: 16, fontFamily: "var(--m)" }}>BUILT FOR BUILDERS</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 10, lineHeight: 1.2 }}>
                Track the AI economy<br />before everyone else
              </div>
              <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.65, marginBottom: 24, maxWidth: 400 }}>
                VCs, founders, and developers use AgentScreener to discover AI products as they launch. Free, real-time, no signup required.
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <a href="/screener" className="cta-btn" style={{ padding: "12px 32px", borderRadius: 8, background: "#2DD4BF", color: "#0A0B10", fontSize: 14, fontWeight: 800, textDecoration: "none", fontFamily: "var(--m)" }}>
                  Open Screener →
                </a>
                <a href="/dashboard" className="ghost-btn" style={{ padding: "12px 28px", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "var(--t2)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  View Dashboard
                </a>
              </div>
            </div>
            {/* Mini terminal preview */}
            <div className="mini-terminal" style={{ width: 200, flexShrink: 0, background: "rgba(0,0,0,.3)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,.06)", fontFamily: "var(--m)" }}>
              <div style={{ fontSize: 9, color: "var(--t3)", marginBottom: 8, letterSpacing: ".06em" }}>$ agentscreener</div>
              {["scanning...", "github ✓", "pypi ✓", "npm ✓", "huggingface ✓", `${liveStats.today || "847"} products`].map((line, i) => (
                <div key={i} style={{ fontSize: 10, color: i === 5 ? "#2DD4BF" : "var(--t3)", marginBottom: 2, opacity: 0.7 + (i * 0.06) }}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer" style={{ padding: "20px 48px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>agentscreener v1.0</span>
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--t3)" }} />
          <span style={{ fontSize: 10, color: "var(--t3)" }}>11 intelligence sources</span>
        </div>
        <span style={{ fontSize: 10, color: "var(--t3)", fontStyle: "italic" }}>Real-time AI ecosystem intelligence</span>
      </footer>
    </div>
  );
}
