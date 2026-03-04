"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

const fmtU = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

// Animated counter
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

  // If already logged in, go straight to dashboard
  if (user) {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  return (
    <div style={{ "--bg": "#0A0B0F", "--s1": "#12131A", "--s2": "rgba(255,255,255,.03)", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.1)", "--t1": "#F0F0F5", "--t2": "rgba(240,240,245,.6)", "--t3": "rgba(240,240,245,.35)", "--g": "#2563EB", "--gg": "rgba(37,99,235,.25)", "--gd": "rgba(37,99,235,.08)", "--m": "'JetBrains Mono', 'SF Mono', monospace", "--f": "'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)", overflow: "hidden" }}>

      <style>{`
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes glow { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
        @keyframes grid-move { from { transform: translateY(0) } to { transform: translateY(40px) } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(37,99,235,.3); }
      `}</style>

      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, opacity: .03, backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "40px 40px", animation: "grid-move 8s linear infinite", pointerEvents: "none" }} />

      {/* Radial glow */}
      <div style={{ position: "fixed", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "120vw", height: "70vh", background: "radial-gradient(ellipse, rgba(37,99,235,.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Nav */}
      <nav style={{ padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#FFF", fontFamily: "var(--m)" }}>AS</span>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)", animation: "sl 3s ease-in-out infinite" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.01em" }}>
            AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>Dashboard</a>
          <a href="/scanner" style={{ fontSize: 13, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>Scanner</a>
          <a href="/dashboard" style={{ padding: "8px 20px", borderRadius: 8, background: "var(--g)", color: "#FFF", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: ".01em" }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 48px 60px", textAlign: "center", position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "var(--gd)", border: "1px solid rgba(37,99,235,.2)", marginBottom: 28, fontSize: 12, fontWeight: 600, color: "var(--g)", animation: "fi .6s ease both" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--g)", animation: "glow 2s ease-in-out infinite" }} />
          Tracking the entire AI ecosystem — live
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 800, fontFamily: "var(--m)", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 24, animation: "fi .6s ease .1s both" }}>
          The intelligence layer<br />for <span style={{ color: "var(--g)", textShadow: "0 0 40px rgba(37,99,235,.3)" }}>AI products</span>
        </h1>

        <p style={{ fontSize: 18, color: "var(--t2)", lineHeight: 1.6, maxWidth: 580, margin: "0 auto 40px", animation: "fi .6s ease .2s both" }}>
          Real-time metrics, funding data, GitHub activity, and traction signals on every AI startup, agent, and tool getting traction. The terminal VCs and builders actually use.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", animation: "fi .6s ease .3s both" }}>
          <a href="/dashboard" style={{ padding: "14px 36px", borderRadius: 10, background: "var(--g)", color: "#FFF", fontSize: 15, fontWeight: 700, textDecoration: "none", letterSpacing: ".01em", boxShadow: "0 0 30px rgba(37,99,235,.3), 0 4px 20px rgba(0,0,0,.3)", transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(37,99,235,.4), 0 8px 30px rgba(0,0,0,.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(37,99,235,.3), 0 4px 20px rgba(0,0,0,.3)"; }}
          >
            Explore Dashboard
          </a>
          <a href="/dashboard" style={{ padding: "14px 36px", borderRadius: 10, border: "1px solid var(--b2)", background: "transparent", color: "var(--t1)", fontSize: 15, fontWeight: 600, textDecoration: "none", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--b2)"; }}
          >
            Submit Your Product
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "40px 48px 60px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, animation: "fi .6s ease .4s both" }}>
          {[
            { label: "Products Tracked", value: 181, suffix: "+" },
            { label: "Categories", value: 28 },
            { label: "Open Source Repos", value: 85 },
            { label: "Data Sources", value: 6 },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em" }}>
                <Counter end={s.value} suffix={s.suffix || ""} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ padding: "40px 48px 80px", position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: "📊", title: "Real-Time Metrics", desc: "GitHub stars, commit velocity, funding rounds, team growth, uptime — all tracked automatically across 155+ products." },
            { icon: "🔍", title: "Deep Intelligence", desc: "Every AI startup mapped with funding history, investor lists, job postings, traffic estimates, and social signals." },
            { icon: "🔔", title: "Smart Alerts", desc: "Set custom alerts on any metric — star velocity spikes, funding announcements, team growth signals. Never miss a move." },
            { icon: "✅", title: "Verified Sources", desc: "See exactly where data comes from. GitHub API, Stripe, PostHog, public filings — not self-reported vanity metrics." },
            { icon: "⚡", title: "6 Data Pipelines", desc: "GitHub, uptime, traffic, funding, job postings, and social metrics — running on automated schedules." },
            { icon: "🎯", title: "Built for VCs", desc: "Watchlists, comparison tools, and the density of information investors need to make decisions fast." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "28px 24px", borderRadius: 14, background: "var(--s1)", border: "1px solid var(--b1)", animation: `fi .5s ease ${.5 + i * .08}s both`, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,.2)"; e.currentTarget.style.background = "rgba(37,99,235,.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--b1)"; e.currentTarget.style.background = "var(--s1)"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--m)", marginBottom: 8, letterSpacing: "-.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories preview */}
      <section style={{ padding: "40px 48px 80px", position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--m)", textAlign: "center", marginBottom: 12, letterSpacing: "-.02em" }}>
          Every corner of <span style={{ color: "var(--g)" }}>AI</span>, indexed
        </h2>
        <p style={{ fontSize: 14, color: "var(--t2)", textAlign: "center", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
          From code agents to foundation models, crypto-AI to robotics — if it's building with AI, we're tracking it.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {["Code & Dev Tools", "AI Agents", "Agent Frameworks", "Foundation Models", "Video Generation", "Image Generation", "Crypto-AI", "Search & Research", "Audio & Voice", "Inference & Serving", "Voice Agents", "Browser Use", "Sales AI", "Healthcare AI", "Robotics", "3D & Spatial AI"].map((c, i) => (
            <span key={i} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--s1)", border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, color: "var(--t2)", animation: `fi .4s ease ${.8 + i * .03}s both` }}>{c}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 48px 80px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 40px", borderRadius: 20, background: "var(--s1)", border: "1px solid var(--b1)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1, background: "linear-gradient(90deg, transparent, var(--g), transparent)" }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--m)", marginBottom: 12, letterSpacing: "-.02em" }}>
            Start tracking the AI economy
          </h2>
          <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6, marginBottom: 28 }}>
            Free to use. No credit card required. Join VCs, founders, and builders who track the AI landscape with AgentScreener.
          </p>
          <a href="/dashboard" style={{ display: "inline-block", padding: "14px 40px", borderRadius: 10, background: "var(--g)", color: "#FFF", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 30px rgba(37,99,235,.3)", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Open Dashboard
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
        <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--m)" }}>AGENTSCREENER v0.1</span>
        <span style={{ fontSize: 11, color: "var(--t3)" }}>agentscreener.io</span>
      </footer>
    </div>
  );
}
