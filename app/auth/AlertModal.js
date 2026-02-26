"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const METRICS = [
  { key: "mrr", label: "MRR", prefix: "$" },
  { key: "mau", label: "Monthly Users", prefix: "" },
  { key: "mrrChange", label: "MRR Growth %", prefix: "", suffix: "%" },
  { key: "sentiment", label: "Sentiment Score", prefix: "" },
  { key: "uptime", label: "Uptime", prefix: "", suffix: "%" },
];

const CONDITIONS = [
  { key: "above", label: "Goes above" },
  { key: "below", label: "Drops below" },
  { key: "changes", label: "Changes by" },
];

export default function AlertModal({ product, onClose }) {
  const { user, supabase } = useAuth();
  const [metric, setMetric] = useState("mrr");
  const [condition, setCondition] = useState("above");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user || !value) return;
    setSaving(true);
    try {
      await supabase.from("alerts").insert({
        user_id: user.id,
        product_id: product.id,
        metric,
        condition,
        threshold: parseFloat(value),
        active: true,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (saved) {
    return (
      <div onClick={onClose} className="modal-bg">
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "88%", maxWidth: 380, padding: "36px 28px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,.12)" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: "0 0 6px" }}>Alert Set</h3>
          <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 18 }}>
            You'll be notified when {product.name}'s {METRICS.find(m => m.key === metric)?.label} {CONDITIONS.find(c => c.key === condition)?.label.toLowerCase()} {value}.
          </p>
          <button onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} className="modal-bg">
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "90%", maxWidth: 400, boxShadow: "0 40px 100px rgba(0,0,0,.12)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: 0 }}>Set Alert</h3>
            <p style={{ fontSize: 11, color: "var(--t3)", margin: "2px 0 0" }}>{product.logo} {product.name}</p>
          </div>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>When</label>
            <select value={metric} onChange={e => setMetric(e.target.value)} className="input" style={{ cursor: "pointer" }}>
              {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>Condition</label>
            <div style={{ display: "flex", gap: 6 }}>
              {CONDITIONS.map(c => (
                <button key={c.key} onClick={() => setCondition(c.key)}
                  className={`cat-btn${condition === c.key ? " on" : ""}`}
                  style={{ flex: 1, textAlign: "center", padding: "8px 6px", fontSize: 10 }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-xs" style={{ display: "block", marginBottom: 5 }}>Value</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              placeholder={metric === "mrr" ? "e.g. 5000000" : "e.g. 100000"}
              className="input" onKeyDown={e => e.key === "Enter" && handleSave()} />
          </div>

          <div style={{ padding: "10px 12px", borderRadius: 7, background: "var(--s2)", border: "1px solid var(--b1)", fontSize: 10, color: "var(--t2)", lineHeight: 1.5 }}>
            We'll check this metric every hour and email you when the condition is met.
          </div>

          <button onClick={handleSave} disabled={!value || saving} className="btn-primary"
            style={{ width: "100%", opacity: !value || saving ? .5 : 1 }}>
            {saving ? "Saving..." : "Create Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}
