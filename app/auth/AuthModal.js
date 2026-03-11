"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function AuthModal({ onClose, initialMode = "signin" }) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Client-side validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !name?.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await signInWithEmail(email, password);
        if (err) { setError(err.message); setLoading(false); return; }
        onClose();
      } else {
        const { data, error: err } = await signUpWithEmail(email, password, name);
        if (err) { setError(err.message); setLoading(false); return; }
        // Supabase returns user with empty identities if email already registered
        // (to prevent email enumeration — signUp doesn't error)
        if (data?.user?.identities?.length === 0) {
          setError("An account with this email already exists. Try signing in instead.");
          setLoading(false);
          return;
        }
        setCheckEmail(true);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    setError("");
    const { error: err } = await signInWithOAuth(provider);
    if (err) setError(err.message);
  };

  const handleWallet = async () => {
    setError("");
    if (typeof window.ethereum === "undefined" && typeof window.solana === "undefined") {
      setError("No wallet detected. Install MetaMask or Phantom.");
      return;
    }
    // For MVP: sign a message, then use Supabase custom JWT or store wallet address
    // This is the frontend trigger — backend verification comes next
    try {
      let address = "";
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        address = accounts[0];
      } else if (window.solana) {
        const resp = await window.solana.connect();
        address = resp.publicKey.toString();
      }
      // For now: sign in with email using wallet address as identifier
      // Full implementation would use Supabase edge function to verify signature
      setError(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}. Full wallet auth requires backend setup — see docs.`);
    } catch (e) {
      setError("Wallet connection failed. Please try again.");
    }
  };

  if (checkEmail) {
    return (
      <div onClick={onClose} className="modal-bg">
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "88%", maxWidth: 420, padding: "40px 32px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,.12)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--gd)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✉</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: "0 0 8px" }}>Check Your Email</h2>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6, marginBottom: 20 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <button onClick={onClose} className="btn-primary">Got it</button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} className="modal-bg">
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 14, width: "90%", maxWidth: 400, boxShadow: "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)", margin: 0 }}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>
              {mode === "signin" ? "Welcome back to AgentScreener" : "Start tracking AI products"}
            </p>
          </div>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px" }}>

          {/* OAuth Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <button onClick={() => handleOAuth("google")} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--b1)",
              background: "var(--s1)", color: "var(--t1)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "all .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--s2)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--s1)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <button onClick={() => handleOAuth("github")} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--b1)",
              background: "#0F1218", color: "#FFFFFF", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "opacity .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>

            <button onClick={handleWallet} style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--b1)",
              background: "var(--s1)", color: "var(--t1)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "all .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--s2)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--s1)"}
            >
              <span style={{ fontSize: 14 }}>🔗</span>
              Connect Wallet
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--b1)" }} />
            <span style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--b1)" }} />
          </div>

          {/* Email Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 5 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="input" />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="input" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 5 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Min 8 characters" : "Your password"} className="input" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>

            {error && (
              <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.12)", fontSize: 11, color: "#DC2626", lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: 4, opacity: loading ? .6 : 1 }}>
              {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </div>

          {/* Toggle */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ fontSize: 11, color: "var(--t3)" }}>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--g)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)" }}>
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
