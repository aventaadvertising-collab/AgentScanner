"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

const fmtU = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

function Counter({ end, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const dur = 1200;
    const step = end / (dur / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [end]);
  return <>{prefix}{typeof end === "number" && end >= 1000 ? fmtU(val) : val}{suffix}</>;
}

export default function LandingPage() {
  const auth = useAuth();
  const user = auth?.user;

  if (user) {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  return (
    <div style={{ "--bg": "#0C0D12", "--s1": "#13151D", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.08)", "--b2": "rgba(255,255,255,.12)", "--b3": "rgba(255,255,255,.18)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.65)", "--t3": "rgba(242,242,247,.38)", "--g": "#3B82F6", "--gg": "rgba(59,130,246,.2)", "--gd": "rgba(59,130,246,.08)", "--em": "#10B981", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fi-scale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(59,130,246,.08) } 50% { box-shadow: 0 0 40px rgba(59,130,246,.15) } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes text-glow { 0%,100% { text-shadow: 0 0 30px rgba(59,130,246,.2) } 50% { text-shadow: 0 0 60px rgba(59,130,246,.35) } }
        @keyframes orbit { from { transform: rotate(0deg) translateX(160px) rotate(0deg) } to { transform: rotate(360deg) translateX(160px) rotate(-360deg) } }
        @keyframes orbit-reverse { from { transform: rotate(0deg) translateX(120px) rotate(0deg) } to { transform: rotate(-360deg) translateX(120px) rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(59,130,246,.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
        .card-hover { transition: all .25s cubic-bezier(.4,0,.2,1); border: 1px solid var(--b1); }
        .card-hover:hover { border-color: var(--b2); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04); }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .cta-btn { transition: all .2s cubic-bezier(.4,0,.2,1); }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(59,130,246,.35), 0 12px 40px rgba(0,0,0,.4); }
        .ghost-btn { transition: all .2s; }
        .ghost-btn:hover { background: rgba(255,255,255,.05) !important; border-color: rgba(255,255,255,.15) !important; }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "30%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,.05) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "5%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.03) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "0%", left: "10%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.02) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.012, backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ─── NAV ─── */}
      <nav style={{ padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, borderBottom: "1px solid var(--b1)", background: "rgba(12,13,18,.75)", backdropFilter: "blur(24px) saturate(180%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #3B82F6, #2563EB, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", animation: "glow-pulse 4s ease-in-out infinite" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#FFF", fontFamily: "var(--m)", letterSpacing: ".02em" }}>AS</span>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent)", animation: "sl 4s ease-in-out infinite" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
            AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/dashboard" className="link-hover" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>Dashboard</a>
          <a href="/screener" className="link-hover" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>Screener</a>
          <div style={{ width: 1, height: 20, background: "var(--b2)", margin: "0 4px" }} />
          <a href="/dashboard" style={{ padding: "8px 20px", borderRadius: 8, background: "var(--g)", color: "#FFF", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: ".01em" }}>Get Started</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: "120px 48px 80px", textAlign: "center", position: "relative", zIndex: 10, maxWidth: 950, margin: "0 auto" }}>
        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 20, background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.15)", marginBottom: 32, animation: "fi .5s ease both" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "lp 2s ease-in-out infinite", boxShadow: "0 0 8px rgba(16,185,129,.5)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", fontFamily: "var(--m)", letterSpacing: ".04em" }}>11 SOURCES SCANNING EVERY MINUTE</span>
        </div>

        <h1 style={{ fontSize: 64, fontWeight: 900, fontFamily: "var(--f)", lineHeight: 1.05, letterSpacing: "-.04em", marginBottom: 24, animation: "fi .6s ease .1s both" }}>
          The intelligence layer<br />for <span style={{ color: "var(--g)", animation: "text-glow 4s ease-in-out infinite" }}>AI products</span>
        </h1>

        <p style={{ fontSize: 18, color: "var(--t2)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 44px", animation: "fi .6s ease .2s both", fontWeight: 400 }}>
          Real-time metrics, GitHub activity, and traction signals on every AI startup, agent, and tool. The terminal VCs and builders actually use.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", animation: "fi .6s ease .3s both" }}>
          <a href="/screener" className="cta-btn" style={{ padding: "14px 40px", borderRadius: 12, background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#FFF", fontSize: 15, fontWeight: 700, textDecoration: "none", letterSpacing: ".01em", boxShadow: "0 0 30px rgba(59,130,246,.25), 0 4px 20px rgba(0,0,0,.3)" }}>
            Open Screener
          </a>
          <a href="/dashboard" className="ghost-btn" style={{ padding: "14px 40px", borderRadius: 12, border: "1px solid var(--b2)", background: "transparent", color: "var(--t1)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            Explore Dashboard
          </a>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section style={{ padding: "0 48px 80px", position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, animation: "fi .5s ease .4s both" }}>
          {[
            { label: "Products Tracked", value: 181, suffix: "+", color: "#3B82F6" },
            { label: "Categories", value: 28, color: "#8B5CF6" },
            { label: "Intelligence Sources", value: 11, color: "#10B981" },
            { label: "Scans Per Day", value: 15840, suffix: "+", color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden", textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em", lineHeight: 1, marginBottom: 6 }}>
                <Counter end={s.value} suffix={s.suffix || ""} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)" }}>{s.label}</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--b1)", overflow: "hidden", borderRadius: "0 0 12px 12px" }}>
                <div style={{ width: "30%", height: "100%", background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, animation: "scan-line 3s ease-in-out infinite", animationDelay: `${i * 0.4}s` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURE GRID ─── */}
      <section style={{ padding: "40px 48px 80px", position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fi .5s ease .5s both" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--g)", marginBottom: 12, fontFamily: "var(--m)" }}>CAPABILITIES</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.15 }}>
            Everything you need to<br /><span style={{ color: "var(--g)" }}>track the AI economy</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { icon: "⊛", title: "11 Data Sources", desc: "GitHub, PyPI, HuggingFace, HN, npm, Reddit, Product Hunt, arXiv, GitHub Trending, Dev.to, Lobsters — all scanning every minute.", color: "#3B82F6" },
            { icon: "◈", title: "Real-Time Screener", desc: "Live feed of new AI products as they launch. Grade-based confidence scoring, category filters, feed and grid views.", color: "#10B981" },
            { icon: "⟁", title: "Deep Intelligence", desc: "Every AI startup mapped with GitHub stars, downloads, upvotes, author profiles, and source-specific metadata.", color: "#8B5CF6" },
            { icon: "⊿", title: "Product Dashboard", desc: "155+ products tracked with metrics, funding data, team growth, revenue estimates, and competitive positioning.", color: "#F59E0B" },
            { icon: "◉", title: "Auto-Classification", desc: "AI keyword classifier with weighted scoring. Automatically categorizes products across 28 categories with confidence grades.", color: "#EC4899" },
            { icon: "⟐", title: "Built for Speed", desc: "Batch upserts, parallel fetches, time-budget guards. Every scan completes within Vercel's 10s limit.", color: "#06B6D4" },
          ].map((f, i) => (
            <div key={i} className="card-hover" style={{ padding: "28px 26px", borderRadius: 16, background: "var(--s1)", animation: `fi-scale .4s ease ${.6 + i * .06}s both`, cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}10`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 20, color: f.color }}>{f.icon}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: "-.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOURCES BANNER ─── */}
      <section style={{ padding: "60px 48px", position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 20, padding: "48px 40px", position: "relative", overflow: "hidden", animation: "fi .5s ease .7s both" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(59,130,246,.2), rgba(139,92,246,.15), transparent)" }} />
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#10B981", marginBottom: 10, fontFamily: "var(--m)" }}>SCANNING 24/7</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>
              Every corner of <span style={{ color: "var(--g)" }}>AI</span>, indexed
            </h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {[
              { name: "GitHub Events", icon: "◆" },
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
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid var(--b1)", animation: `fi .3s ease ${.8 + i * .04}s both` }}>
                <span style={{ fontSize: 14, color: "var(--g)", opacity: 0.7 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>{s.name}</span>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "lp 2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>Every source fires every 60 seconds · 15,840+ scans per day</span>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section style={{ padding: "60px 48px 80px", position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", animation: "fi .5s ease .8s both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#8B5CF6", marginBottom: 10, fontFamily: "var(--m)" }}>COVERAGE</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>
            28 categories and counting
          </h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {["Code & Dev Tools", "AI Agents", "Agent Frameworks", "Foundation Models", "Video Generation", "Image Generation", "Crypto-AI", "Search & Research", "Audio & Voice", "Inference & Serving", "Voice Agents", "Browser Use", "Sales AI", "Healthcare AI", "Robotics", "3D & Spatial AI", "Data & Analytics", "Security AI", "Education AI", "Legal AI"].map((c, i) => (
            <span key={i} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--s1)", border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, color: "var(--t2)", transition: "all .15s", cursor: "default" }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "40px 48px 100px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 48px", borderRadius: 24, background: "var(--s1)", border: "1px solid var(--b1)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1, background: "linear-gradient(90deg, transparent, var(--g), transparent)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top center, rgba(59,130,246,.04) 0%, transparent 60%)", pointerEvents: "none" }} />

          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 14, letterSpacing: "-.03em", position: "relative" }}>
            Start tracking the AI economy
          </h2>
          <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.7, marginBottom: 32, position: "relative" }}>
            Free to use. No credit card required. Join VCs, founders, and builders who track the AI landscape with AgentScreener.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", position: "relative" }}>
            <a href="/screener" className="cta-btn" style={{ padding: "14px 36px", borderRadius: 12, background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#FFF", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 30px rgba(59,130,246,.25)" }}>
              Open Screener
            </a>
            <a href="/dashboard" className="ghost-btn" style={{ padding: "14px 36px", borderRadius: 12, border: "1px solid var(--b2)", background: "transparent", color: "var(--t1)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              View Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "20px 48px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
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
