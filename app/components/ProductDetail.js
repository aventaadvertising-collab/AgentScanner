"use client";
import { useState } from "react";
import { fmt$, fmtU, fmtP, isV, vCount, SRC } from "@/lib/format";
import { CommitHeatmapLoader } from "@/app/components/CommitHeatmap";

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

export function ProductLogo({ product, size = 32 }) {
  const domain = product.logoDomain;
  const fallback = product.name[0].toUpperCase();
  const [err, setErr] = useState(false);

  if (!domain || err) {
    return <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 700, color: "var(--t3)", fontFamily: "var(--m)" }}>{fallback}</div>;
  }

  return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`} width={size} height={size} style={{ borderRadius: size * 0.22, objectFit: "contain", background: "#fff", border: "1px solid var(--b1)" }} onError={() => setErr(true)} alt="" />;
}

export function ConfidenceDot({ level }) {
  const colors = { high: "var(--up)", medium: "var(--y)", low: "var(--t4)" };
  return <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors[level] || "var(--t4)", display: "inline-block", marginRight: 3, boxShadow: level === "high" ? "0 0 4px rgba(22,163,74,.3)" : "none" }} />;
}

export function Spark({ data, up, w = 110, h = 28 }) {
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * (h - 4) - 2}`).join(" ");
  const c = up !== false ? "var(--up)" : "var(--dn)";
  const gid = "s" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity=".10" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VBadge({ src, size = 9 }) {
  const v = isV(src);
  return (
    <span className="vb" style={{ fontSize: size, color: v ? "var(--g)" : "var(--t3)" }}>
      <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: v ? "var(--g)" : "var(--t4)", boxShadow: v ? "0 0 5px var(--gg)" : "none", display: "inline-block", marginRight: 3, verticalAlign: "middle" }} />
      {SRC[src] || src}
    </span>
  );
}

export function VMeter({ v }) {
  const entries = Object.entries(v);
  const pct = Math.round((vCount(v) / entries.length) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 1.5 }}>
        {entries.map(([k, s]) => (
          <div key={k} style={{ width: 10, height: 3.5, borderRadius: 1, background: isV(s) ? "var(--g)" : "var(--t4)", boxShadow: isV(s) ? "0 0 3px var(--gg)" : "none" }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)" }}>{pct}%</span>
    </div>
  );
}

export function NewBadge() {
  return <span style={{ fontSize: 7, padding: "2px 6px", borderRadius: 3, background: "rgba(45,212,191,.04)", color: "var(--g)", fontWeight: 800, letterSpacing: ".06em", border: "1px solid rgba(255,255,255,.08)" }}>NEW</span>;
}

function ExtLink({ href, children, style: s = {} }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--g)", textDecoration: "none", fontSize: 12, fontWeight: 500, transition: "opacity .15s", ...s }} onMouseEnter={e => e.currentTarget.style.opacity = ".7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{children}</a>;
}

function BarChart({ data, w = 300, h = 72 }) {
  if (!data || !data.length) return <div style={{ color: "var(--t3)", fontSize: 11 }}>No revenue history</div>;
  const max = Math.max(...data);
  const bw = (w - (data.length - 1) * 5) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = max > 0 ? (v / max) * (h - 14) : 0;
        const x = i * (bw + 5);
        const last = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={bw} height={bh} rx={2.5} fill={last ? "var(--g)" : "rgba(255,255,255,.05)"} />
            <text x={x + bw / 2} y={h - bh - 5} textAnchor="middle" style={{ fontSize: 7.5, fill: last ? "var(--g)" : "var(--t3)", fontFamily: "var(--m)" }}>{fmt$(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SHARED CSS VARIABLES & STYLES
// ============================================================
export const THEME_VARS = {
  "--bg": "#F4F5F7", "--s1": "#FFFFFF", "--s2": "rgba(0,0,0,.02)",
  "--sh": "rgba(0,0,0,.04)", "--b1": "rgba(0,0,0,.06)", "--b2": "rgba(0,0,0,.1)",
  "--t1": "#0F1218", "--t2": "rgba(15,18,24,.6)", "--t3": "rgba(15,18,24,.35)",
  "--t4": "rgba(15,18,24,.12)", "--g": "#2563EB", "--gg": "rgba(37,99,235,.25)",
  "--gd": "rgba(37,99,235,.06)", "--r": "#DC2626", "--y": "#D97706",
  "--up": "#16A34A", "--dn": "#DC2626",
  "--m": "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
  "--f": "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .label-xs { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t3); }
  .chip { font-size: 9px; padding: 2px 7px; border-radius: 3px; background: rgba(0,0,0,.03); color: var(--t2); font-weight: 600; letter-spacing: .03em; border: 1px solid var(--b1); }
  .chip-g { background: var(--gd); color: var(--g); border-color: rgba(37,99,235,.15); }
  .card-inner { padding: 14px 16px; border-radius: 8px; background: var(--s2); border: 1px solid var(--b1); }
  .vb { font-weight: 600; letter-spacing: .04em; text-transform: uppercase; display: inline-flex; align-items: center; white-space: nowrap; }
  .btn-close { background: rgba(0,0,0,.03); border: 1px solid var(--b1); color: var(--t3); width: 30px; height: 30px; border-radius: 7px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
  .btn-close:hover { background: rgba(0,0,0,.06); }
`;

// ============================================================
// PRODUCT DETAIL — shared between modal and standalone page
// ============================================================
export default function ProductDetail({ product: p, isModal = true, onClose, onAlert }) {
  const [copied, setCopied] = useState(false);

  if (!p) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${p.id}` : `/product/${p.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const grid = [
    { l: p.revenueConfidence === "low" ? "Est. Revenue" : "Revenue", v: fmt$(p.mrr), c: p.mrrChange, s: p.verifications.revenue },
    { l: "MAU", v: fmtU(p.mau), c: p.mauChange, s: p.verifications.usage },
    { l: "DAU", v: fmtU(p.dau), c: null, s: p.verifications.usage },
    { l: "GitHub Stars", v: p.githubStars ? fmtU(p.githubStars) : "—", c: null, s: p.verifications.community },
    { l: "Star Velocity", v: p.starVelocity ? `+${p.starVelocity}/wk` : "—", c: null, s: p.verifications.community },
    { l: "Uptime 30d", v: p.uptime ? `${p.uptime}%` : "—", c: null, s: p.verifications.uptime },
    { l: "P50 Latency", v: p.latencyMs ? `${p.latencyMs}ms` : "—", c: null, s: p.verifications.uptime },
    { l: "Error Rate", v: p.errorRate != null ? `${p.errorRate}%` : "—", c: null, s: p.verifications.uptime },
    { l: "Team Size", v: p.teamSize || "—", c: p.teamGrowth, s: p.verifications.team },
    { l: "NPS", v: p.nps || "—", c: null, s: "analytics" },
    { l: "Sentiment", v: p.sentiment || "—", c: null, s: "analytics" },
    { l: "Age", v: p.age, c: null, s: "self" },
  ];

  const content = (
    <div style={{ background: "var(--s1)", border: isModal ? "1px solid var(--b2)" : "none", borderRadius: 14, width: "100%", maxWidth: 700, maxHeight: isModal ? "90vh" : "none", overflow: "auto", boxShadow: isModal ? "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)" : "none" }}>
      {/* Header */}
      <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <ProductLogo product={p} size={48} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--m)", margin: 0, letterSpacing: "-.01em" }}>{p.name}</h2>
              {p.ticker && <span style={{ fontSize: 11, color: "var(--y)", fontFamily: "var(--m)", fontWeight: 700 }}>${p.ticker}</span>}
              {p.hot && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "rgba(255,68,80,.08)", color: "var(--r)", fontWeight: 700, letterSpacing: ".06em" }}>HOT</span>}
            </div>
            <p style={{ fontSize: 12, color: "var(--t2)", margin: 0, lineHeight: 1.4, maxWidth: 400 }}>{p.description}</p>
            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
              <span className="chip">{p.category}</span>
              {p.founded && <span className="chip">Est. {p.founded}</span>}
              {p.hq && <span className="chip">{p.hq}</span>}
              {(p.tags || []).slice(0, 4).map((t, i) => <span key={i} className="chip chip-g">{t}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={copyLink} style={{ padding: "6px 12px", borderRadius: 6, background: copied ? "rgba(22,163,74,.08)" : "var(--s2)", border: `1px solid ${copied ? "rgba(22,163,74,.2)" : "var(--b1)"}`, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "var(--f)", color: copied ? "var(--up)" : "var(--t2)", transition: "all .15s" }}>
            {copied ? "Copied!" : "Share"}
          </button>
          {isModal && onClose && <button onClick={onClose} className="btn-close">✕</button>}
        </div>
      </div>

      <div style={{ padding: "20px 26px 26px" }}>
        {/* Links */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {p.website && <ExtLink href={p.website} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11 }}>↗</span> Website
          </ExtLink>}
          {p.twitter && <ExtLink href={p.twitter} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
            𝕏 Profile
          </ExtLink>}
          {p.github && <ExtLink href={`https://github.com/${p.github.o}/${p.github.r}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
            GitHub
          </ExtLink>}
          {p.discord && <ExtLink href={`https://discord.gg/${p.discord}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
            Discord
          </ExtLink>}
          {p.crunchbase && <ExtLink href={`https://crunchbase.com/organization/${p.crunchbase}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
            Crunchbase
          </ExtLink>}
          {p.linkedin && <ExtLink href={`https://linkedin.com/company/${p.linkedin}`} style={{ padding: "5px 12px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--t2)" }}>
            LinkedIn
          </ExtLink>}
          {p.token && <span style={{ padding: "5px 12px", borderRadius: 6, background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.15)", fontSize: 10, fontWeight: 700, color: "var(--y)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            ${p.token.symbol} • {p.token.chain}
          </span>}
          {isModal && onAlert && (
            <button onClick={(e) => { e.stopPropagation(); onAlert(e, p); }} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--f)", color: "var(--t2)", display: "inline-flex", alignItems: "center", gap: 5, transition: "all .12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,.05)"; e.currentTarget.style.color = "var(--g)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--s2)"; e.currentTarget.style.color = "var(--t2)"; }}
            >
              Set Alert
            </button>
          )}
          {!isModal && <a href="/dashboard" style={{ padding: "5px 12px", borderRadius: 6, background: "var(--gd)", border: "1px solid rgba(37,99,235,.15)", fontSize: 10, fontWeight: 700, color: "var(--g)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            ← Dashboard
          </a>}
          {p.contactEmail && (
            <a href={`mailto:${p.contactEmail}`} style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 7, background: "var(--g)", color: "#FFFFFF", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: ".01em" }}>
              Contact {p.contactName || "Team"}
            </a>
          )}
        </div>

        {/* Verification Sources */}
        <div style={{ padding: "12px 16px", borderRadius: 9, marginBottom: 18, background: "var(--s2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="label-xs">Data Sources</span>
            {Object.entries(p.verifications).map(([k, s]) => <VBadge key={k} src={s} size={10} />)}
          </div>
          <VMeter v={p.verifications} />
        </div>

        {/* Revenue Intelligence */}
        {p.revenueReasoning && (
          <div className="card-inner" style={{ marginBottom: 18, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span className="label-xs">Revenue Intelligence</span>
              {p.revenueConfidence && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: p.revenueConfidence === "high" ? "rgba(22,163,74,.08)" : p.revenueConfidence === "medium" ? "rgba(217,119,6,.08)" : "rgba(0,0,0,.04)", color: p.revenueConfidence === "high" ? "var(--up)" : p.revenueConfidence === "medium" ? "var(--y)" : "var(--t3)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>{p.revenueConfidence} confidence</span>}
            </div>
            <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, margin: "0 0 8px" }}>{p.revenueReasoning}</p>
            {p.revenueSources && p.revenueSources.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {p.revenueSources.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: 4, background: "rgba(0,0,0,.02)" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t1)" }}>{s.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{fmt$(s.value)}/yr</span>
                      <span style={{ fontSize: 9, color: "var(--t3)" }}>{s.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Revenue Chart */}
        {p.mrrHist && p.mrrHist.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Revenue (7mo)</span>
            <div className="card-inner"><BarChart data={p.mrrHist} /></div>
          </div>
        )}

        {/* Traction */}
        <div style={{ marginBottom: 18 }}>
          <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Traction Index (30d)</span>
          <div className="card-inner"><Spark data={p.spark} up={p.mrrChange == null || p.mrrChange >= 0} w={600} h={44} /></div>
        </div>

        {/* Commit Activity Heatmap */}
        {p.github && (
          <div style={{ marginBottom: 18 }}>
            <span className="label-xs" style={{ marginBottom: 10, display: "block" }}>Commit Activity (52 weeks)</span>
            <div className="card-inner">
              <CommitHeatmapLoader productId={p.id} commitActivity={p.commitActivity} />
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
          {grid.map((m, i) => (
            <div key={i} className="card-inner" style={{ padding: "12px 14px" }}>
              <div className="label-xs" style={{ marginBottom: 5 }}>{m.l}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{m.v}</span>
                {m.c != null && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", color: m.c >= 0 ? "var(--up)" : "var(--dn)" }}>{fmtP(m.c)}</span>}
              </div>
              <VBadge src={m.s} />
            </div>
          ))}
        </div>

        {/* Funding */}
        {(p.valuation || p.fundingTotal > 0) && (
          <div className="card-inner" style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
            <div>
              <div className="label-xs" style={{ marginBottom: 3 }}>Valuation</div>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{p.valuation ? fmt$(p.valuation) : "—"}</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="label-xs" style={{ marginBottom: 3 }}>Total Raised</div>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{p.fundingTotal ? fmt$(p.fundingTotal) : "—"}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="label-xs" style={{ marginBottom: 3 }}>Investors</div>
              <span style={{ fontSize: 11, color: "var(--t2)" }}>{p.investors?.length ? p.investors.join(", ") : "—"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fi .15s ease" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "94%", maxWidth: 700 }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
