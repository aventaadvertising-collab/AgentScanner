"use client";
import ProductDetail, { THEME_VARS, SHARED_STYLES } from "@/app/components/ProductDetail";

export default function ProductPageClient({ product }) {
  return (
    <div style={{ ...THEME_VARS, minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--f)" }}>
      <style>{SHARED_STYLES}</style>
      <style>{`@keyframes fi { from { opacity: 0 } to { opacity: 1 } }`}</style>

      {/* Header */}
      <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(244,245,247,.92)", backdropFilter: "blur(20px)" }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--t1)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#FFF", fontFamily: "var(--m)" }}>AS</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.01em" }}>
            AGENT<span style={{ color: "var(--g)" }}>SCREENER</span>
          </span>
        </a>
        <a href="/dashboard" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(37,99,235,.25)", background: "rgba(37,99,235,.06)", color: "#2563EB", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
          ← Dashboard
        </a>
      </header>

      {/* Product detail */}
      <div style={{ maxWidth: 700, margin: "32px auto", padding: "0 24px" }}>
        <ProductDetail product={product} isModal={false} />
      </div>
    </div>
  );
}
