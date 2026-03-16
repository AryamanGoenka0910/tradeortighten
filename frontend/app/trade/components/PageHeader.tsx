"use client";

import { useState, useEffect } from "react";

interface PageHeaderProps {
  // Trade page extras (all optional)
  showInbox?: boolean;
  unreadCount?: number;
  onToggleInbox?: () => void;
  isSigningOut?: boolean;
  onSignOut?: () => void;
}

export default function PageHeader({
  showInbox,
  unreadCount = 0,
  onToggleInbox,
  isSigningOut,
  onSignOut,
}: PageHeaderProps) {
  const [clock, setClock] = useState("01:23:47");

  useEffect(() => {
    let s = 1 * 3600 + 23 * 60 + 47;
    const iv = setInterval(() => {
      s = Math.max(0, s - 1);
      setClock(
        `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      padding: "8px 20px", borderBottom: "1px solid #131825",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "linear-gradient(180deg,#0c0f17,#080a12)", flexShrink: 0,
    }}>
      {/* Left: logo + live indicator */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00E5A0", animation: "livePulse 2s infinite" }} />
          <span style={{ fontSize: "8px", color: "#00E5A0", fontWeight: 700, letterSpacing: "1px" }}>LIVE</span>
        </div>
      </div>

      {/* Right: clock + optional trade controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ padding: "5px 12px", borderRadius: "6px", background: "#0f1219", border: "1px solid #1a1f2e", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "8px", color: "#4b5563" }}>TIME</span>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>{clock}</span>
        </div>

        {onToggleInbox && (
          <button onClick={onToggleInbox} style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #1a1f2e", cursor: "pointer",
            background: showInbox ? "#151a27" : "#0f1219", color: "#e5e7eb", fontSize: "12px",
            display: "flex", alignItems: "center", position: "relative",
          }}>
            📨
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: "-3px", right: "-3px",
                background: "#FF6C6C", color: "#0a0d14", fontSize: "8px", fontWeight: 800,
                width: "14px", height: "14px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono',monospace",
              }}>{unreadCount}</span>
            )}
          </button>
        )}

        {onSignOut && (
          <button onClick={onSignOut} disabled={isSigningOut} style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #3b1820",
            cursor: isSigningOut ? "not-allowed" : "pointer",
            background: "#140b10", color: "#ff8ea1", fontSize: "11px",
            display: "flex", alignItems: "center", gap: "4px", fontWeight: 700,
            opacity: isSigningOut ? 0.6 : 1,
          }}>
            ⎋ <span style={{ fontSize: "10px" }}>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
