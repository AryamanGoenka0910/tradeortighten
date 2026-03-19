"use client";

import { useState, useEffect } from "react";

const ROUNDS_INFO = [
  {
    label: "Round 1",
    securities: [
      { ticker: "ALPHA", color: "#00E5A0", desc: "A high-growth tech company navigating regulatory headwinds in the semiconductor space." },
      { ticker: "BETA",  color: "#6C8EFF", desc: "A mid-cap financial services firm exposed to interest rate sensitivity and credit risk." },
      { ticker: "GAMMA", color: "#FF6C6C", desc: "An energy producer balancing commodity price volatility with long-term supply contracts." },
      { ticker: "DELTA", color: "#FFB84D", desc: "A consumer staples conglomerate with defensive earnings but slow organic growth." },
    ],
  },
  {
    label: "Round 2",
    securities: [
      { ticker: "ALPHA", color: "#00E5A0", desc: "Post-earnings surprise: beat on revenue but missed margins; market reassessing fair value." },
      { ticker: "BETA",  color: "#6C8EFF", desc: "Central bank pivot speculation has driven sharp repricing across the yield curve." },
      { ticker: "GAMMA", color: "#FF6C6C", desc: "Geopolitical supply disruption has created a volatile bid in spot and futures markets." },
      { ticker: "DELTA", color: "#FFB84D", desc: "Activist investor disclosure triggers a takeover premium debate among participants." },
    ],
  },
  {
    label: "Round 3",
    securities: [
      { ticker: "ALPHA", color: "#00E5A0", desc: "Macro shock scenario: recession fears drive correlation spikes and de-risking flows." },
      { ticker: "BETA",  color: "#6C8EFF", desc: "Liquidity crunch forces forced selling; spread between bid and fair value widens sharply." },
      { ticker: "GAMMA", color: "#FF6C6C", desc: "Flight-to-safety dynamics compress volatility while volume surges in defensive names." },
      { ticker: "DELTA", color: "#FFB84D", desc: "Recovery trade emerges as policy response stabilises sentiment and risk appetite returns." },
    ],
  },
];

const TIMER_TOTAL = 600; // 10 minutes

interface PageHeaderProps {
  // Trade page extras (all optional)
  showInbox?: boolean;
  unreadCount?: number;
  onToggleInbox?: () => void;
  isSigningOut?: boolean;
  onSignOut?: () => void;
  // Timer control (driven by WS)
  timerRunning?: boolean;
  timerResetKey?: number;
}

export default function PageHeader({
  showInbox,
  unreadCount = 0,
  onToggleInbox,
  isSigningOut,
  onSignOut,
  timerRunning = false,
  timerResetKey = 0,
}: PageHeaderProps) {
  const [seconds, setSeconds] = useState(TIMER_TOTAL);
  const [showInfo, setShowInfo] = useState(false);
  const [activeRound, setActiveRound] = useState(0);

  // Reset timer when reset command received
  useEffect(() => {
    setSeconds(TIMER_TOTAL);
  }, [timerResetKey]);

  // Countdown while running
  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [timerRunning]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      <div style={{
        padding: "8px 20px", borderBottom: "1px solid #131825",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(180deg,#0c0f17,#080a12)", flexShrink: 0,
        position: "relative", zIndex: 50,
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

        {/* Right: info + clock + optional trade controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Info button */}
          <button
            onClick={() => setShowInfo((v) => !v)}
            style={{
              padding: "5px 10px", borderRadius: "6px", cursor: "pointer",
              border: showInfo ? "1px solid #2a3a5c" : "1px solid #1a1f2e",
              background: showInfo ? "#111827" : "#0f1219",
              color: showInfo ? "#6C8EFF" : "#4b5563",
              fontSize: "12px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "5px",
              fontFamily: "'Space Grotesk',sans-serif",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "13px", lineHeight: 1 }}>ⓘ</span>
            <span style={{ fontSize: "10px", letterSpacing: "0.5px" }}>INFO</span>
          </button>

          {/* Timer */}
          <div style={{ padding: "5px 12px", borderRadius: "6px", background: "#0f1219", border: `1px solid ${timerRunning ? "rgba(0,229,160,0.2)" : "#1a1f2e"}`, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "8px", color: timerRunning ? "#00E5A0" : "#4b5563" }}>{timerRunning ? "LIVE" : "TIME"}</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: seconds === 0 ? "#FF6C6C" : "#e5e7eb", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>{clock}</span>
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

      {/* Info panel overlay */}
      {showInfo && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowInfo(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(8,10,18,0.6)",
            }}
          />
          {/* Panel */}
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 50,
            width: "420px", background: "#0c0f17",
            border: "1px solid #1a1f2e", borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            animation: "fadeSlideDown 0.15s ease",
            overflow: "hidden",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "12px 16px 10px",
              borderBottom: "1px solid #131825",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
                  Competition Rounds
                </div>
                <div style={{ fontSize: "9px", color: "#3b4252", marginTop: "2px", letterSpacing: "0.4px" }}>
                  Securities & scenario overview
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#4b5563", fontSize: "16px", lineHeight: 1, padding: "2px 4px",
                }}
              >×</button>
            </div>

            {/* Round tabs */}
            <div style={{ display: "flex", gap: "4px", padding: "10px 16px 0" }}>
              {ROUNDS_INFO.map((round, i) => (
                <button
                  key={i}
                  onClick={() => setActiveRound(i)}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: "6px", cursor: "pointer",
                    border: activeRound === i ? "1px solid #2a3a5c" : "1px solid #131825",
                    background: activeRound === i ? "#111827" : "transparent",
                    color: activeRound === i ? "#e5e7eb" : "#4b5563",
                    fontSize: "10px", fontWeight: 700,
                    fontFamily: "'Space Grotesk',sans-serif",
                    letterSpacing: "0.4px",
                    transition: "all 0.12s",
                  }}
                >
                  {round.label}
                </button>
              ))}
            </div>

            {/* Securities list */}
            <div style={{ padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {ROUNDS_INFO[activeRound].securities.map((sec) => (
                <div
                  key={sec.ticker}
                  style={{
                    padding: "10px 12px", borderRadius: "7px",
                    background: "#0a0d14", border: "1px solid #131825",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                    <div style={{
                      width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                      background: sec.color,
                      boxShadow: `0 0 6px ${sec.color}66`,
                    }} />
                    <span style={{
                      fontSize: "11px", fontWeight: 800, color: sec.color,
                      fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px",
                    }}>{sec.ticker}</span>
                  </div>
                  <div style={{
                    fontSize: "10px", color: "#9ca3af", lineHeight: "1.5",
                    fontFamily: "'Space Grotesk',sans-serif",
                  }}>{sec.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
