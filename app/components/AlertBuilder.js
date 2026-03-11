"use client";

import { useState } from "react";

const MATCH_TYPES = [
  { value: "keyword", label: "Keyword", desc: "Match by name or description" },
  { value: "category", label: "Category", desc: "Match by category" },
  { value: "source", label: "Source", desc: "Match by discovery source" },
];

const METRICS = [
  { value: "stars", label: "Stars" },
  { value: "downloads", label: "Downloads" },
  { value: "forks", label: "Forks" },
  { value: "upvotes", label: "Upvotes" },
  { value: "stars_velocity", label: "Stars velocity" },
  { value: "downloads_velocity", label: "Downloads velocity" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
];

const TIME_WINDOWS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

const SOURCES = [
  "github", "pypi", "npm", "huggingface", "hackernews", "reddit",
  "producthunt", "arxiv", "devto", "lobsters", "twitter",
  "google-play", "chrome-webstore", "appstore", "funding",
];

const CATEGORIES = [
  "AI Agents", "LLM Tools", "Computer Vision", "NLP", "MLOps",
  "Code Assistant", "Image Generation", "Voice AI", "AI Infrastructure",
  "Data Pipeline", "Robotics", "AI Safety", "Multimodal", "Search",
];

export default function AlertBuilder({ onClose, onSave, editAlert }) {
  const [name, setName] = useState(editAlert?.name || "");
  const [matchType, setMatchType] = useState(editAlert?.match_type || "keyword");
  const [matchValue, setMatchValue] = useState(editAlert?.match_value || "");
  const [metric, setMetric] = useState(editAlert?.metric || "stars");
  const [operator, setOperator] = useState(editAlert?.operator || "gt");
  const [threshold, setThreshold] = useState(editAlert?.threshold ?? 100);
  const [timeWindow, setTimeWindow] = useState(editAlert?.time_window || "24h");
  const [notifyInApp, setNotifyInApp] = useState(editAlert?.notify_in_app !== false);
  const [notifyEmail, setNotifyEmail] = useState(editAlert?.notify_email === true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!matchValue.trim()) { setError("Match value is required"); return; }
    if (threshold === "" || isNaN(threshold)) { setError("Threshold must be a number"); return; }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: editAlert?.id,
        name: name.trim(),
        match_type: matchType,
        match_value: matchValue.trim(),
        metric,
        operator,
        threshold: Number(threshold),
        time_window: timeWindow,
        notify_in_app: notifyInApp,
        notify_email: notifyEmail,
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save alert");
    }
    setSaving(false);
  };

  const selectStyle = {
    width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 6,
    border: "1px solid rgba(255,255,255,.08)", background: "#0A0B10",
    color: "#F2F2F7", outline: "none", fontFamily: "var(--m)",
    appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 6,
    border: "1px solid rgba(255,255,255,.08)", background: "#0A0B10",
    color: "#F2F2F7", outline: "none", fontFamily: "var(--m)",
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
    color: "rgba(242,242,247,.38)", marginBottom: 6, display: "block", fontFamily: "var(--m)",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", zIndex: 300, animation: "fade-in .15s ease" }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 480, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
        background: "#12141C", borderRadius: 12, border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,.6)", zIndex: 301,
        animation: "fi .2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#F2F2F7", margin: 0, fontFamily: "var(--m)" }}>
              {editAlert ? "Edit Alert" : "Create Alert"}
            </h3>
            <div style={{ fontSize: 11, color: "rgba(242,242,247,.38)", marginTop: 2 }}>
              Get notified when discoveries match your criteria
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(242,242,247,.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            x
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Alert Name */}
          <div>
            <label style={labelStyle}>Alert Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot AI Agents" style={inputStyle} />
          </div>

          {/* Match Type + Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Match Type</label>
              <select value={matchType} onChange={(e) => { setMatchType(e.target.value); setMatchValue(""); }} style={selectStyle}>
                {MATCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Match Value</label>
              {matchType === "category" ? (
                <select value={matchValue} onChange={(e) => setMatchValue(e.target.value)} style={selectStyle}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : matchType === "source" ? (
                <select value={matchValue} onChange={(e) => setMatchValue(e.target.value)} style={selectStyle}>
                  <option value="">Select source...</option>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input value={matchValue} onChange={(e) => setMatchValue(e.target.value)} placeholder="e.g. agent, llm, gpt" style={inputStyle} />
              )}
            </div>
          </div>

          {/* Condition row: metric + operator + threshold */}
          <div>
            <label style={labelStyle}>Trigger When</label>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              <select value={metric} onChange={(e) => setMetric(e.target.value)} style={selectStyle}>
                {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={operator} onChange={(e) => setOperator(e.target.value)} style={selectStyle}>
                {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Time Window */}
          <div>
            <label style={labelStyle}>Time Window</label>
            <div style={{ display: "flex", gap: 6 }}>
              {TIME_WINDOWS.map((tw) => (
                <button key={tw.value} onClick={() => setTimeWindow(tw.value)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,.08)",
                  background: timeWindow === tw.value ? "rgba(45,212,191,.08)" : "transparent",
                  color: timeWindow === tw.value ? "#2DD4BF" : "rgba(242,242,247,.5)",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", cursor: "pointer",
                  transition: "all .15s",
                  borderColor: timeWindow === tw.value ? "rgba(45,212,191,.2)" : undefined,
                }}>
                  {tw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification channels */}
          <div>
            <label style={labelStyle}>Notifications</label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(242,242,247,.65)" }}>
                <input type="checkbox" checked={notifyInApp} onChange={(e) => setNotifyInApp(e.target.checked)} style={{ accentColor: "#2DD4BF" }} />
                In-app
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(242,242,247,.65)" }}>
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} style={{ accentColor: "#2DD4BF" }} />
                Email
              </label>
            </div>
          </div>

          {/* Preview summary */}
          <div style={{ padding: "12px 14px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", fontSize: 12, color: "rgba(242,242,247,.5)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: "rgba(242,242,247,.65)" }}>Preview: </span>
            Alert when {matchType === "keyword" ? `"${matchValue || "..."}"` : matchValue || "..."} {matchType}s have{" "}
            <span style={{ color: "#2DD4BF", fontFamily: "var(--m)" }}>{METRICS.find((m) => m.value === metric)?.label}</span>{" "}
            {OPERATORS.find((o) => o.value === operator)?.label} {threshold} in the last {TIME_WINDOWS.find((tw) => tw.value === timeWindow)?.label}.
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 6, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", fontSize: 12, color: "#EF4444" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "rgba(242,242,247,.65)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--m)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 24px", borderRadius: 6, border: "none",
            background: "#2DD4BF", color: "#0A0B10", fontSize: 13,
            fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "var(--m)", letterSpacing: ".02em",
            opacity: saving ? 0.6 : 1, transition: "opacity .15s",
          }}>
            {saving ? "Saving..." : editAlert ? "Update Alert" : "Create Alert"}
          </button>
        </div>
      </div>
    </>
  );
}
