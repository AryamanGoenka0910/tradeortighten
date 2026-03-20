"use client";

import { useState, useEffect } from "react";

const ROUNDS_INFO = [
  {
    label: "Round 1",
    securities: [
      { ticker: "ALPHA", color: "#00E5A0", desc: "Stock A — standard equity." },
      { ticker: "BETA",  color: "#6C8EFF", desc: "Stock B — standard equity." },
      { ticker: "GAMMA", color: "#FF6C6C", desc: "Stock C — standard equity." },
      { ticker: "SIGMA", color: "#FFB84D", desc: "ETF — basket of ALPHA, BETA, GAMMA plus a mystery fourth stock (DELTA). Fair value = weighted average of all four components." },
    ],
  },
  {
    label: "Round 2",
    securities: [
      { ticker: "ALPHA",  color: "#00E5A0", desc: "Crypto A" },
      { ticker: "BETA",   color: "#6C8EFF", desc: "Crypto B" },
      { ticker: "GAMMA",  color: "#FF6C6C", desc: "Yes if ALPHA > BETA Pays 100 Per Contract If Outcome is Yes" },
      { ticker: "SIGMA",  color: "#FFB84D", desc: "No if ALPHA > BETA Pays 100 Per Contract If Outcome is No" },
    ],
  },
  {
    label: "Round 3",
    securities: [
      { ticker: "ALPHA",  color: "#00E5A0",   desc: "Stock A — standard equity." },
      { ticker: "BETA",   color: "#6C8EFF",   desc: "Stock B — standard equity." },
      { ticker: "GAMMA",  color: "#FF6C6C",   desc: "True value is always |price(ALPHA) − price(BETA)|." },
      { ticker: "SIGMA",  color: "#FFB84D",   desc: "Continuously compounding bond — accrues value every 10 seconds at a fixed rate unknown starting at $10." },
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
  // Round state (driven by admin via WS)
  currentRound?: 1 | 2 | 3 | null;
}

export default function PageHeader({
  showInbox,
  unreadCount = 0,
  onToggleInbox,
  isSigningOut,
  onSignOut,
  timerRunning = false,
  timerResetKey = 0,
  currentRound = null,
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
        padding: "12px 28px", borderBottom: "1px solid #131825",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(180deg,#0c0f17,#080a12)", flexShrink: 0,
        position: "relative", zIndex: 50,
      }}>
        {/* Left: logo + live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "8px",
              background: "linear-gradient(135deg,#FFB84D,#FF8C00)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 900, color: "#0a0d14",
            }}>M</div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#e5e7eb", letterSpacing: "-0.3px" }}>MIG Quant Competition</div>
              <div style={{ fontSize: "10px", color: "#3b4252", letterSpacing: "0.5px" }}>MICHIGAN INVESTMENT GROUP · 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00E5A0", animation: "livePulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#00E5A0", fontWeight: 700, letterSpacing: "1px" }}>LIVE</span>
          </div>
          {currentRound !== null && (
            <div style={{
              padding: "4px 10px", borderRadius: "5px",
              background: "rgba(108,142,255,0.1)", border: "1px solid rgba(108,142,255,0.25)",
              fontSize: "10px", fontWeight: 800, color: "#6C8EFF",
              letterSpacing: "0.8px", fontFamily: "'Space Grotesk',sans-serif",
            }}>
              ROUND {currentRound}
            </div>
          )}
        </div>

        {/* Right: info + clock + optional trade controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Info button */}
          <button
            onClick={() => setShowInfo((v) => !v)}
            style={{
              padding: "7px 14px", borderRadius: "7px", cursor: "pointer",
              border: showInfo ? "1px solid #2a3a5c" : "1px solid #1a1f2e",
              background: showInfo ? "#111827" : "#0f1219",
              color: showInfo ? "#6C8EFF" : "#4b5563",
              fontSize: "14px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "'Space Grotesk',sans-serif",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>ⓘ</span>
            <span style={{ fontSize: "12px", letterSpacing: "0.5px" }}>INFO</span>
          </button>

          {/* Timer */}
          <div style={{ padding: "7px 16px", borderRadius: "7px", background: "#0f1219", border: `1px solid ${timerRunning ? "rgba(0,229,160,0.2)" : "#1a1f2e"}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", color: timerRunning ? "#00E5A0" : "#4b5563" }}>{timerRunning ? "LIVE" : "TIME"}</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: seconds === 0 ? "#FF6C6C" : "#e5e7eb", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>{clock}</span>
          </div>

          {onToggleInbox && (
            <button onClick={onToggleInbox} style={{
              padding: "8px 13px", borderRadius: "7px", border: "1px solid #1a1f2e", cursor: "pointer",
              background: showInbox ? "#151a27" : "#0f1219", color: "#e5e7eb", fontSize: "16px",
              display: "flex", alignItems: "center", position: "relative",
            }}>
              📨
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  background: "#FF6C6C", color: "#0a0d14", fontSize: "9px", fontWeight: 800,
                  width: "16px", height: "16px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'JetBrains Mono',monospace",
                }}>{unreadCount}</span>
              )}
            </button>
          )}

          {onSignOut && (
            <button onClick={onSignOut} disabled={isSigningOut} style={{
              padding: "8px 13px", borderRadius: "7px", border: "1px solid #3b1820",
              cursor: isSigningOut ? "not-allowed" : "pointer",
              background: "#140b10", color: "#ff8ea1", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "5px", fontWeight: 700,
              opacity: isSigningOut ? 0.6 : 1,
            }}>
              ⎋ <span style={{ fontSize: "12px" }}>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
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
            width: "740px", background: "#0c0f17",
            border: "1px solid #1a1f2e", borderRadius: "12px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            animation: "fadeSlideDown 0.15s ease",
            overflow: "hidden",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "16px 22px 14px",
              borderBottom: "1px solid #131825",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
                Competition Rounds
              </div>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#4b5563", fontSize: "22px", lineHeight: 1, padding: "2px 6px",
                }}
              >×</button>
            </div>

            {/* Round tabs */}
            <div style={{ display: "flex", gap: "6px", padding: "14px 22px 0" }}>
              {ROUNDS_INFO.map((round, i) => (
                <button
                  key={i}
                  onClick={() => setActiveRound(i)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "7px", cursor: "pointer",
                    border: activeRound === i ? "1px solid #2a3a5c" : "1px solid #131825",
                    background: activeRound === i ? "#111827" : "transparent",
                    color: activeRound === i ? "#e5e7eb" : "#4b5563",
                    fontSize: "13px", fontWeight: 700,
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
            <div style={{ padding: "14px 22px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {ROUNDS_INFO[activeRound].securities.map((sec) => (
                <div
                  key={sec.ticker}
                  style={{
                    padding: "13px 16px", borderRadius: "8px",
                    background: "#0a0d14", border: "1px solid #131825",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "6px" }}>
                    <div style={{
                      width: "9px", height: "9px", borderRadius: "50%", flexShrink: 0,
                      background: sec.color,
                      boxShadow: `0 0 7px ${sec.color}66`,
                    }} />
                    <span style={{
                      fontSize: "14px", fontWeight: 800, color: sec.color,
                      fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px",
                    }}>{sec.ticker}</span>
                  </div>
                  <div style={{
                    fontSize: "12px", color: "#9ca3af", lineHeight: "1.6",
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
