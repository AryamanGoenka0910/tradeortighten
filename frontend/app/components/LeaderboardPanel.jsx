"use client";

import { useState } from "react";

// Mock expanded data for sponsor view
const TEAM_DETAILS = {
  QuantWolf: {
    members: ["Alice Zhang", "Bob Patel"],
    cash: 42300,
    holdings: [
      { ticker: "ALPHA", qty: 150, avgPrice: 49.2 },
      { ticker: "GAMMA", qty: 80, avgPrice: 74.5 },
    ],
    recentTrades: [
      { ticker: "ALPHA", side: "BUY", price: 52.0, qty: 30, time: "10:28 AM" },
      { ticker: "GAMMA", side: "SELL", price: 78.5, qty: 20, time: "10:25 AM" },
      { ticker: "ALPHA", side: "BUY", price: 51.5, qty: 50, time: "10:18 AM" },
    ],
  },
  AlphaSeeker: {
    members: ["Charlie Kim", "Diana Reyes"],
    cash: 38750,
    holdings: [
      { ticker: "BETA", qty: 200, avgPrice: 33.1 },
      { ticker: "DELTA", qty: 120, avgPrice: 20.8 },
    ],
    recentTrades: [
      { ticker: "BETA", side: "BUY", price: 34.5, qty: 60, time: "10:30 AM" },
      { ticker: "DELTA", side: "BUY", price: 21.3, qty: 40, time: "10:22 AM" },
    ],
  },
  BayesianBandit: {
    members: ["Evan Cho", "Faye Nguyen"],
    cash: 55200,
    holdings: [
      { ticker: "ALPHA", qty: 100, avgPrice: 48.0 },
      { ticker: "BETA", qty: 90, avgPrice: 35.2 },
    ],
    recentTrades: [
      { ticker: "ALPHA", side: "SELL", price: 52.3, qty: 25, time: "10:31 AM" },
      { ticker: "BETA", side: "BUY", price: 34.7, qty: 30, time: "10:20 AM" },
    ],
  },
};

// Generate fallback details for teams without explicit mock data
function getTeamDetails(name) {
  if (TEAM_DETAILS[name]) return TEAM_DETAILS[name];
  return {
    members: ["Team Member 1", "Team Member 2"],
    cash: Math.floor(25000 + Math.random() * 40000),
    holdings: [
      { ticker: "ALPHA", qty: Math.floor(Math.random() * 200), avgPrice: 50 + (Math.random() * 5 - 2.5) },
      { ticker: "BETA", qty: Math.floor(Math.random() * 150), avgPrice: 34 + (Math.random() * 3 - 1.5) },
    ],
    recentTrades: [
      { ticker: "ALPHA", side: Math.random() > 0.5 ? "BUY" : "SELL", price: 51 + Math.random() * 3, qty: Math.floor(10 + Math.random() * 50), time: "10:15 AM" },
    ],
  };
}

function ExpandedRow({ entry }) {
  const details = getTeamDetails(entry.name);

  return (
    <div style={{
      padding: "8px 10px", background: "#0a0d14", borderRadius: "0 0 6px 6px",
      borderTop: "1px solid #1a1f2e", marginBottom: "2px",
      animation: "fadeSlideDown 0.2s ease-out",
    }}>
      {/* Team Info */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>Team Members</div>
        <div style={{ fontSize: "10px", color: "#9ca3af" }}>{details.members.join(" · ")}</div>
      </div>

      {/* Cash */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid #131825" }}>
        <span style={{ fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cash Balance</span>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#6C8EFF", fontFamily: "'JetBrains Mono',monospace" }}>
          ${details.cash.toLocaleString()}
        </span>
      </div>

      {/* Holdings */}
      <div style={{ marginTop: "6px" }}>
        <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>Holdings</div>
        {details.holdings.map((h, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "3px 6px", background: "#0c0f17", borderRadius: "4px", marginBottom: "2px",
            fontSize: "10px", fontFamily: "'JetBrains Mono',monospace",
          }}>
            <span style={{ fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{h.ticker}</span>
            <span style={{ color: "#9ca3af" }}>{h.qty} @ ${h.avgPrice.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Recent Trades */}
      <div style={{ marginTop: "6px" }}>
        <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>Recent Trades</div>
        {details.recentTrades.map((t, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "3px 6px", background: "#0c0f17", borderRadius: "4px", marginBottom: "2px",
            fontSize: "9px", fontFamily: "'JetBrains Mono',monospace",
          }}>
            <span style={{ color: t.side === "BUY" ? "#00E5A0" : "#FF6C6C", fontWeight: 700 }}>{t.side}</span>
            <span style={{ color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{t.ticker}</span>
            <span style={{ color: "#9ca3af" }}>{t.qty} @ ${t.price.toFixed(1)}</span>
            <span style={{ color: "#3b4252" }}>{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, expandable, expanded, onToggle }) {
  return (
    <div>
      <div
        onClick={expandable ? onToggle : undefined}
        style={{
          display: "flex", alignItems: "center", padding: "6px 8px",
          borderRadius: expanded ? "5px 5px 0 0" : "5px", marginBottom: expanded ? "0" : "1px",
          background: entry.rank <= 3 ? "rgba(255,184,77,0.03)" : "transparent",
          cursor: expandable ? "pointer" : "default",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (expandable) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={(e) => { if (expandable) e.currentTarget.style.background = entry.rank <= 3 ? "rgba(255,184,77,0.03)" : "transparent"; }}
      >
        <div style={{
          width: "22px", height: "22px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: 800, marginRight: "8px", fontFamily: "'JetBrains Mono',monospace",
          background: entry.rank === 1 ? "rgba(255,215,0,0.12)" : entry.rank === 2 ? "rgba(192,192,192,0.08)" : entry.rank === 3 ? "rgba(205,127,50,0.08)" : "#0f1219",
          color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#4b5563",
        }}>{entry.rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{entry.name}</div>
          <div style={{ fontSize: "7px", color: "#3b4252" }}>{entry.trades} trades</div>
        </div>
        {entry.portfolioValue !== undefined && (
          <div style={{ fontSize: "9px", color: "#4b5563", fontFamily: "'JetBrains Mono',monospace", marginRight: "10px" }}>
            ${entry.portfolioValue.toLocaleString()}
          </div>
        )}
        <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: entry.pnl >= 0 ? "#00E5A0" : "#FF6C6C" }}>
          {entry.pnl >= 0 ? "+" : ""}{entry.pnl.toLocaleString("en-US", { minimumFractionDigits: 1 })}
        </div>
        {expandable && (
          <div style={{
            marginLeft: "8px", fontSize: "8px", color: "#3b4252",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}>▼</div>
        )}
      </div>
      {expanded && <ExpandedRow entry={entry} />}
    </div>
  );
}

export default function LeaderboardPanel({ onClose, leaderboard, mode = "attendee" }) {
  const [expandedRank, setExpandedRank] = useState(null);
  const isInline = mode === "sponsor";
  const expandable = mode === "sponsor";

  const userRank = { rank: 42, name: "You", pnl: -1250.8, trades: 31 };

  // For sponsor mode, add portfolioValue to leaderboard entries
  const entries = leaderboard.map((e) => ({
    ...e,
    ...(isInline ? { portfolioValue: 150000 + e.pnl } : {}),
  }));

  const containerStyle = isInline
    ? {
        background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
        display: "flex", flexDirection: "column", minHeight: 0, height: "100%",
        overflow: "hidden", width: "100%",
      }
    : {
        position: "fixed", top: 0, right: 0, bottom: 0, width: "350px", background: "#0a0d14",
        borderLeft: "1px solid #151a27", zIndex: 100, display: "flex", flexDirection: "column",
        animation: "slideIn 0.2s ease-out", boxShadow: "-16px 0 50px rgba(0,0,0,0.5)",
      };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isInline ? "12px 14px" : "14px 18px",
        borderBottom: "1px solid #151a27",
      }}>
        <span style={{
          fontSize: isInline ? "16px" : "14px", fontWeight: 800,
          color: isInline ? "#6b7280" : "#e5e7eb",
          letterSpacing: isInline ? "0.8px" : "0",
          textTransform: isInline ? "uppercase" : "none",
          fontFamily: "'Space Grotesk',sans-serif",
        }}>
          {isInline ? "Leaderboard" : "🏆 Leaderboard"}
        </span>
        {!isInline && (
          <button onClick={onClose} style={{
            background: "#151a27", border: "none", color: "#6b7280", cursor: "pointer",
            fontSize: "13px", width: "26px", height: "26px", borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>

      {/* Column header for sponsor mode */}
      {isInline && (
        <div style={{
          display: "flex", alignItems: "center", padding: "4px 8px",
          fontSize: "8px", color: "#3b4252", letterSpacing: "0.5px",
          textTransform: "uppercase", fontWeight: 600,
        }}>
          <div style={{ width: "30px" }}>#</div>
          <div style={{ flex: 1 }}>Team</div>
          <div style={{ width: "70px", textAlign: "right" }}>Value</div>
          <div style={{ width: "80px", textAlign: "right" }}>P&L</div>
          <div style={{ width: "16px" }} />
        </div>
      )}

      {/* Entries */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 8px" }}>
        {entries.map((e) => (
          <LeaderboardRow
            key={e.rank}
            entry={e}
            expandable={expandable}
            expanded={expandedRank === e.rank}
            onToggle={() => setExpandedRank(expandedRank === e.rank ? null : e.rank)}
          />
        ))}

        {/* "YOU" section only for attendee mode */}
        {!isInline && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", padding: "0 8px" }}>
              <div style={{ flex: 1, height: "1px", background: "#1a1f2e" }} />
              <span style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "1px" }}>YOU</span>
              <div style={{ flex: 1, height: "1px", background: "#1a1f2e" }} />
            </div>
            <div style={{
              display: "flex", alignItems: "center", padding: "8px", borderRadius: "6px",
              background: "rgba(108,142,255,0.05)", border: "1px solid rgba(108,142,255,0.1)",
            }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: 800, marginRight: "8px", fontFamily: "'JetBrains Mono',monospace",
                background: "rgba(108,142,255,0.08)", color: "#6C8EFF",
              }}>{userRank.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6C8EFF", fontFamily: "'Space Grotesk',sans-serif" }}>{userRank.name}</div>
                <div style={{ fontSize: "7px", color: "#3b4252" }}>{userRank.trades} trades</div>
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#FF6C6C" }}>
                {userRank.pnl.toLocaleString("en-US", { minimumFractionDigits: 1 })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
