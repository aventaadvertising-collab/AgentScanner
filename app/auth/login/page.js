"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "../AuthModal";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already signed in, redirect home
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg, #0A0B10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "2.5px solid var(--g, #2DD4BF)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (user) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #0A0B10)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <style>{`
        :root {
          --bg: #0A0B10; --s1: #12141C; --s2: #1A1D28;
          --b1: rgba(255,255,255,.06); --b2: rgba(255,255,255,.1);
          --t1: #F1F5F9; --t2: #94A3B8; --t3: #64748B;
          --g: #2DD4BF; --gd: linear-gradient(135deg, #2DD4BF, #14B8A6);
          --m: 'JetBrains Mono', monospace; --f: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .modal-bg { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 999; }
        .input { width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--b1); background: var(--bg); color: var(--t1); font-size: 12px; font-family: var(--f); outline: none; box-sizing: border-box; transition: border .15s; }
        .input:focus { border-color: var(--g); }
        .btn-primary { padding: 10px 20px; border-radius: 8px; border: none; background: var(--gd); color: #0A0B10; font-size: 13px; font-weight: 700; font-family: var(--m); cursor: pointer; transition: opacity .12s; }
        .btn-primary:hover { opacity: .9; }
        .btn-close { background: none; border: none; color: var(--t3); font-size: 16px; cursor: pointer; padding: 4px; line-height: 1; }
      `}</style>
      <AuthModal onClose={() => router.push("/")} initialMode="signin" />
    </div>
  );
}
