"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 30, height: 30, borderRadius: 7, border: "1px solid var(--b1)",
        background: avatarUrl ? `url(${avatarUrl}) center/cover` : "var(--gd)",
        color: "var(--g)", fontSize: 10, fontWeight: 800, fontFamily: "var(--m)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color .12s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--b2)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--b1)"}
      >
        {!avatarUrl && initials}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 38, right: 0, width: 220,
          background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 10,
          boxShadow: "0 16px 48px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.03)",
          overflow: "hidden", animation: "fi .12s ease", zIndex: 200,
        }}>
          {/* User Info */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--b1)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", marginBottom: 2 }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "var(--t3)" }}>{user?.email}</div>
            {profile?.role === "product_owner" && (
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "var(--gd)", color: "var(--g)", fontWeight: 700, letterSpacing: ".04em" }}>PRODUCT OWNER</span>
            )}
          </div>

          {/* Menu Items */}
          <div style={{ padding: "6px" }}>
            {[
              { label: "My Watchlist", icon: "★", href: "/#watchlist" },
              { label: "My Products", icon: "◆", href: "/dashboard" },
              { label: "Alerts", icon: "🔔", href: "/dashboard#alerts" },
              { label: "Settings", icon: "⚙", href: "/dashboard#settings" },
            ].map((item, i) => (
              <a key={i} href={item.href} onClick={() => setOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                borderRadius: 6, fontSize: 12, fontWeight: 500, color: "var(--t1)",
                textDecoration: "none", cursor: "pointer", transition: "background .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--s2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 12, width: 18, textAlign: "center", color: "var(--t3)" }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          {/* Sign Out */}
          <div style={{ padding: "6px", borderTop: "1px solid var(--b1)" }}>
            <button onClick={() => { signOut(); setOpen(false); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              color: "#DC2626", background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--f)", textAlign: "left", transition: "background .1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 12, width: 18, textAlign: "center" }}>↪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
