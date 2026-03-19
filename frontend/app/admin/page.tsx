"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useBackendStatus } from "@/lib/useBackendStatus";
import AdminPanel from "./AdminPanel";

export default function AdminPage() {
  const router = useRouter();
  const { reconnected, clearReconnected } = useBackendStatus();
  const [ready, setReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        router.push("/");
      } else if (sessionStorage.getItem("isAdmin") === "false") {
        router.push("/trade");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  if (!ready) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#080a12",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3b4252", fontFamily: "'Space Grotesk',-apple-system,sans-serif", fontSize: "12px",
      }}>
        Verifying session...
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#080a12",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'Space Grotesk',-apple-system,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes livePulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,229,160,0.4); } 50% { box-shadow:0 0 0 4px rgba(0,229,160,0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1a1f2e; border-radius:2px; }
        input::placeholder { color:#2a3040; }
      `}</style>

      {reconnected && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
          background: "rgba(255,184,77,0.12)", borderBottom: "1px solid rgba(255,184,77,0.25)",
          padding: "8px 20px", display: "flex", alignItems: "center", gap: "10px",
          fontFamily: "'Space Grotesk',sans-serif", backdropFilter: "blur(8px)",
        }}>
          <span style={{ fontSize: "13px" }}>⚡</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFB84D", flex: 1 }}>
            Backend reconnected — reload to restore your live connection
          </span>
          <button onClick={() => window.location.reload()} style={{
            padding: "3px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: 700,
            cursor: "pointer", background: "rgba(255,184,77,0.15)", border: "1px solid rgba(255,184,77,0.3)",
            color: "#FFB84D", fontFamily: "'Space Grotesk',sans-serif",
          }}>Reload</button>
          <button onClick={clearReconnected} style={{
            background: "none", border: "none", color: "#FFB84D", cursor: "pointer", fontSize: "14px", lineHeight: 1,
          }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: "8px 20px", borderBottom: "1px solid #131825",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(180deg,#0c0f17,#080a12)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px",
              background: "linear-gradient(135deg,#FFB84D,#FF8C00)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 900, color: "#0a0d14",
            }}>M</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#e5e7eb", letterSpacing: "-0.3px" }}>MIG Quant Competition</div>
              <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.5px" }}>MICHIGAN INVESTMENT GROUP · 2026</div>
            </div>
          </div>
          <div style={{
            fontSize: "9px", padding: "3px 8px", borderRadius: "4px",
            background: "rgba(255,108,108,0.08)", border: "1px solid rgba(255,108,108,0.15)",
            color: "#FF6C6C", fontWeight: 700, letterSpacing: "0.5px",
          }}>
            ADMIN
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #3b1820", cursor: isSigningOut ? "not-allowed" : "pointer",
            background: "#140b10", color: "#ff8ea1", fontSize: "11px",
            display: "flex", alignItems: "center", gap: "4px", fontWeight: 700, opacity: isSigningOut ? 0.6 : 1,
          }}
        >
          ⎋ <span style={{ fontSize: "10px" }}>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      </div>

      {/* Admin Panel */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <AdminPanel />
      </div>
    </div>
  );
}
