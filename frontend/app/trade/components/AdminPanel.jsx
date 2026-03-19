"use client";

import { useState, useEffect, useRef } from "react";

// --- Mock Data ---
const MOCK_USERS = [
  {
    id: "u1", username: "QuantWolf", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-101", symbol: "ALPHA", side: "BUY", price: 52.0, qty: 30, status: "RESTING" },
      { id: "ORD-102", symbol: "GAMMA", side: "SELL", price: 78.5, qty: 20, status: "RESTING" },
      { id: "ORD-103", symbol: "ALPHA", side: "BUY", price: 50.0, qty: 100, status: "FILLED" },
    ],
  },
  {
    id: "u2", username: "AlphaSeeker", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-201", symbol: "BETA", side: "BUY", price: 34.5, qty: 60, status: "RESTING" },
      { id: "ORD-202", symbol: "DELTA", side: "SELL", price: 22.0, qty: 40, status: "PARTIAL" },
      { id: "ORD-203", symbol: "BETA", side: "SELL", price: 36.0, qty: 50, status: "FILLED" },
    ],
  },
  {
    id: "u3", username: "BayesianBandit", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-301", symbol: "ALPHA", side: "SELL", price: 53.0, qty: 25, status: "RESTING" },
      { id: "ORD-302", symbol: "GAMMA", side: "BUY", price: 77.0, qty: 45, status: "FILLED" },
    ],
  },
  {
    id: "u4", username: "SigmaTrader", role: "Attendee", status: "Banned",
    orders: [
      { id: "ORD-401", symbol: "DELTA", side: "BUY", price: 21.0, qty: 80, status: "CANCELLED" },
    ],
  },
  {
    id: "u5", username: "MarkovChain", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-501", symbol: "ALPHA", side: "BUY", price: 51.5, qty: 50, status: "RESTING" },
      { id: "ORD-502", symbol: "BETA", side: "BUY", price: 34.0, qty: 90, status: "RESTING" },
      { id: "ORD-503", symbol: "GAMMA", side: "SELL", price: 79.0, qty: 30, status: "FILLED" },
      { id: "ORD-504", symbol: "DELTA", side: "BUY", price: 21.3, qty: 120, status: "PARTIAL" },
    ],
  },
  {
    id: "u6", username: "GammaHedge", role: "Sponsor", status: "Active",
    orders: [],
  },
  {
    id: "u7", username: "DeltaForce", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-701", symbol: "DELTA", side: "SELL", price: 22.5, qty: 70, status: "RESTING" },
    ],
  },
  {
    id: "u8", username: "ThetaDecay", role: "Attendee", status: "Active",
    orders: [
      { id: "ORD-801", symbol: "ALPHA", side: "SELL", price: 52.8, qty: 40, status: "RESTING" },
      { id: "ORD-802", symbol: "BETA", side: "BUY", price: 34.2, qty: 100, status: "FILLED" },
    ],
  },
];


function UserRow({ user, onBan, onCancelOrder }) {
  const [expanded, setExpanded] = useState(false);
  const openOrders = user.orders.filter((o) => o.status === "RESTING" || o.status === "PARTIAL");
  const filledOrders = user.orders.filter((o) => o.status === "FILLED" || o.status === "CANCELLED");

  return (
    <div style={{ marginBottom: "2px" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", padding: "8px 10px",
          background: "#0a0d14", border: "1px solid #131825", borderRadius: expanded ? "6px 6px 0 0" : "6px",
          cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#0c1018"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#0a0d14"; }}
      >
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%", marginRight: "8px", flexShrink: 0,
          background: user.status === "Active" ? "#00E5A0" : "#FF6C6C",
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
            {user.username}
          </span>
        </div>

        <span style={{
          fontSize: "9px", padding: "2px 6px", borderRadius: "3px", marginRight: "8px",
          fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
          background: user.role === "Sponsor" ? "rgba(108,142,255,0.1)" : "rgba(255,255,255,0.03)",
          color: user.role === "Sponsor" ? "#6C8EFF" : "#4b5563",
        }}>
          {user.role}
        </span>

        <span style={{
          fontSize: "9px", padding: "2px 6px", borderRadius: "3px", marginRight: "8px",
          fontWeight: 700,
          background: user.status === "Active" ? "rgba(0,229,160,0.08)" : "rgba(255,108,108,0.08)",
          color: user.status === "Active" ? "#00E5A0" : "#FF6C6C",
        }}>
          {user.status}
        </span>

        <span style={{ fontSize: "9px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace", marginRight: "8px" }}>
          {user.orders.length} orders
        </span>

        <div style={{
          fontSize: "8px", color: "#3b4252",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▼</div>
      </div>

      {expanded && (
        <div style={{
          padding: "10px 12px", background: "#080a12",
          border: "1px solid #131825", borderTop: "none", borderRadius: "0 0 6px 6px",
        }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onBan(user.id); }}
              style={{
                padding: "4px 10px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, cursor: "pointer",
                fontFamily: "'Space Grotesk',sans-serif",
                background: user.status === "Active" ? "rgba(255,108,108,0.1)" : "rgba(0,229,160,0.1)",
                border: `1px solid ${user.status === "Active" ? "rgba(255,108,108,0.2)" : "rgba(0,229,160,0.2)"}`,
                color: user.status === "Active" ? "#FF6C6C" : "#00E5A0",
              }}
            >
              {user.status === "Active" ? "Ban User" : "Unban User"}
            </button>
          </div>

          {openOrders.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px", fontWeight: 600 }}>
                Open Orders ({openOrders.length})
              </div>
              {openOrders.map((ord) => (
                <div key={ord.id} style={{
                  display: "flex", alignItems: "center", padding: "5px 8px",
                  background: "#0c0f17", borderRadius: "4px", marginBottom: "2px",
                  fontSize: "10px", fontFamily: "'JetBrains Mono',monospace",
                }}>
                  <span style={{ color: ord.side === "BUY" ? "#00E5A0" : "#FF6C6C", fontWeight: 700, width: "32px" }}>{ord.side}</span>
                  <span style={{ color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, width: "52px" }}>{ord.symbol}</span>
                  <span style={{ color: "#9ca3af", flex: 1 }}>{ord.qty} @ ${ord.price.toFixed(1)}</span>
                  <span style={{
                    fontSize: "8px", padding: "1px 4px", borderRadius: "2px", marginRight: "6px",
                    fontWeight: 700,
                    background: ord.status === "PARTIAL" ? "rgba(255,184,77,0.1)" : "rgba(108,142,255,0.1)",
                    color: ord.status === "PARTIAL" ? "#FFB84D" : "#6C8EFF",
                  }}>{ord.status}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelOrder(user.id, ord.id); }}
                    style={{
                      padding: "2px 6px", borderRadius: "3px", fontSize: "8px", fontWeight: 700, cursor: "pointer",
                      background: "rgba(255,108,108,0.08)", border: "1px solid rgba(255,108,108,0.15)",
                      color: "#FF6C6C", fontFamily: "'Space Grotesk',sans-serif",
                    }}
                  >Cancel</button>
                </div>
              ))}
            </div>
          )}

          {filledOrders.length > 0 && (
            <div>
              <div style={{ fontSize: "8px", color: "#3b4252", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px", fontWeight: 600 }}>
                Filled / Closed ({filledOrders.length})
              </div>
              {filledOrders.map((ord) => (
                <div key={ord.id} style={{
                  display: "flex", alignItems: "center", padding: "5px 8px",
                  background: "#0c0f17", borderRadius: "4px", marginBottom: "2px",
                  fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", opacity: 0.6,
                }}>
                  <span style={{ color: ord.side === "BUY" ? "#00E5A0" : "#FF6C6C", fontWeight: 700, width: "32px" }}>{ord.side}</span>
                  <span style={{ color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, width: "52px" }}>{ord.symbol}</span>
                  <span style={{ color: "#9ca3af", flex: 1 }}>{ord.qty} @ ${ord.price.toFixed(1)}</span>
                  <span style={{
                    fontSize: "8px", padding: "1px 4px", borderRadius: "2px",
                    fontWeight: 700,
                    background: ord.status === "FILLED" ? "rgba(0,229,160,0.08)" : "rgba(255,108,108,0.08)",
                    color: ord.status === "FILLED" ? "#00E5A0" : "#FF6C6C",
                  }}>{ord.status}</span>
                </div>
              ))}
            </div>
          )}

          {user.orders.length === 0 && (
            <div style={{ fontSize: "10px", color: "#3b4252", textAlign: "center", padding: "12px 0" }}>No orders</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [wsState, setWsState] = useState(true);
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");


  const toggleBan = (userId) => {
    const user = users.find((u) => u.id === userId);
    setUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u
    ));
    const action = user?.status === "Active" ? "BANNED" : "UNBANNED";
    addLog([{ level: "warn", msg: `User ${action}: ${user?.username}` }]);
  };

  const cancelOrder = (userId, orderId) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId
        ? { ...u, orders: u.orders.map((o) => o.id === orderId ? { ...o, status: "CANCELLED" } : o) }
        : u
    ));
    addLog([{ level: "order", msg: `ORDER CANCELLED (admin): ${orderId}` }]);
  };

  const handleResetDb = () => {
  };

  const handleWsToggle = (on) => {
    setWsState(on);
    if (on) {
      addLog([{ level: "connect", msg: "WebSocket server started on ws://localhost:8080" }]);
    } else {
      addLog([
        { level: "warn", msg: "WebSocket server shutting down..." },
        { level: "error", msg: "WebSocket server stopped — all clients disconnected" },
      ]);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === "Active").length;
  const bannedCount = users.filter((u) => u.status === "Banned").length;

  return (
    <div style={{
      width: "100%", display: "flex", flexDirection: "column", gap: "8px", padding: "8px",
      overflowY: "auto", overflowX: "hidden",
    }}>

      {/* 1. System Controls */}
      <div style={{
        background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", flexShrink: 0,
      }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif", marginBottom: "12px" }}>
          System Controls
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* WS Status */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
            background: "#0a0d14", borderRadius: "6px", border: "1px solid #131825", flexShrink: 0,
          }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: wsState ? "#00E5A0" : "#FF6C6C",
              boxShadow: wsState ? "0 0 8px rgba(0,229,160,0.4)" : "0 0 8px rgba(255,108,108,0.4)",
            }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
              WebSocket
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 700, marginLeft: "4px",
              color: wsState ? "#00E5A0" : "#FF6C6C",
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              {wsState ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          {/* Action buttons in a row */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
            <button onClick={handleResetDb} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(255,184,77,0.08)", border: "1px solid rgba(255,184,77,0.2)",
              color: "#FFB84D", display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span>↻</span> Reset DB
            </button>

            <button onClick={() => handleWsToggle(true)} disabled={wsState} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: wsState ? "not-allowed" : "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: wsState ? "rgba(0,229,160,0.03)" : "rgba(0,229,160,0.08)",
              border: `1px solid rgba(0,229,160,${wsState ? "0.08" : "0.2"})`,
              color: "#00E5A0", opacity: wsState ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span>▶</span> Start WS
            </button>

            <button onClick={() => handleWsToggle(false)} disabled={!wsState} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: !wsState ? "not-allowed" : "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: !wsState ? "rgba(255,108,108,0.03)" : "rgba(255,108,108,0.08)",
              border: `1px solid rgba(255,108,108,${!wsState ? "0.08" : "0.2"})`,
              color: "#FF6C6C", opacity: !wsState ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span>■</span> Stop WS
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <div style={{
              padding: "6px 14px", background: "#0a0d14", borderRadius: "4px",
              border: "1px solid #131825", textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#00E5A0", fontFamily: "'JetBrains Mono',monospace" }}>{activeCount}</div>
              <div style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "0.5px", textTransform: "uppercase" }}>Active</div>
            </div>
            <div style={{
              padding: "6px 14px", background: "#0a0d14", borderRadius: "4px",
              border: "1px solid #131825", textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#FF6C6C", fontFamily: "'JetBrains Mono',monospace" }}>{bannedCount}</div>
              <div style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "0.5px", textTransform: "uppercase" }}>Banned</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. User Management */}
      <div style={{
        background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
            User Management
          </div>
          <span style={{ fontSize: "9px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace" }}>
            {filteredUsers.length} / {users.length} users
          </span>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: "6px",
              background: "#0a0d14", border: "1px solid #1a1f2e", color: "#e5e7eb",
              fontSize: "11px", fontFamily: "'Space Grotesk',sans-serif",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} onBan={toggleBan} onCancelOrder={cancelOrder} />
          ))}
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: "center", color: "#3b4252", fontSize: "11px", padding: "20px 0" }}>
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
