"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/");
      }
    });
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #2563EB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "rgba(15,18,24,.6)", fontSize: 13 }}>Signing you in...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
