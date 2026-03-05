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

const INITIAL_LOGS = [
  { time: "10:00:01", level: "info", msg: "System initialized" },
  { time: "10:00:02", level: "info", msg: "WebSocket server started on ws://localhost:8080" },
  { time: "10:00:03", level: "info", msg: "PostgreSQL connection pool ready (5 connections)" },
  { time: "10:00:05", level: "info", msg: "C++ OrderBook engine spawned (PID 42891)" },
  { time: "10:00:12", level: "connect", msg: "Client connected: QuantWolf (u1)" },
  { time: "10:00:14", level: "connect", msg: "Client connected: AlphaSeeker (u2)" },
  { time: "10:00:18", level: "order", msg: "ORDER PLACED: QuantWolf BUY ALPHA 30@52.0" },
  { time: "10:00:22", level: "order", msg: "ORDER PLACED: AlphaSeeker BUY BETA 60@34.5" },
  { time: "10:00:25", level: "connect", msg: "Client connected: BayesianBandit (u3)" },
  { time: "10:00:31", level: "order", msg: "ORDER FILLED: QuantWolf BUY ALPHA 30@52.0 (matched)" },
  { time: "10:00:35", level: "warn", msg: "High latency detected: 142ms avg response time" },
  { time: "10:00:40", level: "order", msg: "ORDER PLACED: BayesianBandit SELL ALPHA 25@53.0" },
  { time: "10:00:45", level: "connect", msg: "Client connected: MarkovChain (u5)" },
  { time: "10:00:50", level: "order", msg: "ORDER CANCELLED: SigmaTrader BUY DELTA 80@21.0" },
  { time: "10:00:55", level: "info", msg: "Order book snapshot broadcast to 5 clients" },
];

const LOG_TEMPLATES = [
  { level: "order", msg: "ORDER PLACED: {user} {side} {sym} {qty}@{price}" },
  { level: "order", msg: "ORDER FILLED: {user} {side} {sym} {qty}@{price} (matched)" },
  { level: "order", msg: "ORDER CANCELLED: {user} {side} {sym} {qty}@{price}" },
  { level: "connect", msg: "Client connected: {user}" },
  { level: "info", msg: "Order book snapshot broadcast to {n} clients" },
  { level: "info", msg: "Heartbeat OK — {n} active connections" },
  { level: "warn", msg: "High latency detected: {n}ms avg response time" },
];

function generateLog() {
  const users = ["QuantWolf", "AlphaSeeker", "BayesianBandit", "MarkovChain", "DeltaForce", "ThetaDecay"];
  const sides = ["BUY", "SELL"];
  const syms = ["ALPHA", "BETA", "GAMMA", "DELTA"];
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  let msg = template.msg
    .replace("{user}", users[Math.floor(Math.random() * users.length)])
    .replace("{side}", sides[Math.floor(Math.random() * 2)])
    .replace("{sym}", syms[Math.floor(Math.random() * 4)])
    .replace("{qty}", String(Math.floor(10 + Math.random() * 100)))
    .replace("{price}", (20 + Math.random() * 60).toFixed(1))
    .replace("{n}", String(Math.floor(3 + Math.random() * 10)));
  return { time, level: template.level, msg };
}

function LogPanel({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColor = (level) => {
    switch (level) {
      case "info": return "#4b5563";
      case "connect": return "#00E5A0";
      case "order": return "#6C8EFF";
      case "warn": return "#FFB84D";
      case "error": return "#FF6C6C";
      default: return "#4b5563";
    }
  };

  return (
    <div style={{
      background: "#06080e", border: "1px solid #131825", borderRadius: "8px",
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid #131825",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF6C6C" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFB84D" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00E5A0" }} />
        <span style={{ fontSize: "10px", color: "#3b4252", marginLeft: "6px", fontFamily: "'JetBrains Mono',monospace" }}>system.log</span>
      </div>
      <div ref={scrollRef} style={{
        flex: 1, overflow: "auto", padding: "8px 10px",
        fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", lineHeight: "18px",
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
            <span style={{ color: "#2a3040" }}>{log.time}</span>
            <span style={{ color: levelColor(log.level), fontWeight: 600, minWidth: "52px" }}>
              [{log.level.toUpperCase()}]
            </span>
            <span style={{ color: "#9ca3af", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {/* Status dot */}
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%", marginRight: "8px",
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
          animation: "fadeSlideDown 0.2s ease-out",
        }}>
          {/* Action buttons */}
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

          {/* Open Orders */}
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

          {/* Filled / Closed Orders */}
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
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");

  // Simulate live log entries
  useEffect(() => {
    if (!wsState) return;
    const iv = setInterval(() => {
      setLogs((prev) => [...prev, generateLog()]);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, [wsState]);

  const toggleBan = (userId) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u
    ));
    setLogs((prev) => {
      const user = users.find((u) => u.id === userId);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const action = user?.status === "Active" ? "BANNED" : "UNBANNED";
      return [...prev, { time, level: "warn", msg: `User ${action}: ${user?.username}` }];
    });
  };

  const cancelOrder = (userId, orderId) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId
        ? { ...u, orders: u.orders.map((o) => o.id === orderId ? { ...o, status: "CANCELLED" } : o) }
        : u
    ));
    setLogs((prev) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      return [...prev, { time, level: "order", msg: `ORDER CANCELLED (admin): ${orderId}` }];
    });
  };

  const handleResetDb = () => {
    setLogs((prev) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      return [
        ...prev,
        { time, level: "warn", msg: "Database reset initiated by admin" },
        { time, level: "info", msg: "Truncating tables: client_orders, client_positions, client_cash..." },
        { time, level: "info", msg: "Re-seeding initial portfolio data..." },
        { time, level: "info", msg: "Database reset complete" },
      ];
    });
  };

  const handleWsToggle = (on) => {
    setWsState(on);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    if (on) {
      setLogs((prev) => [...prev, { time, level: "connect", msg: "WebSocket server started on ws://localhost:8080" }]);
    } else {
      setLogs((prev) => [
        ...prev,
        { time, level: "warn", msg: "WebSocket server shutting down..." },
        { time, level: "error", msg: "WebSocket server stopped — all clients disconnected" },
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
      flex: 1, display: "flex", flexDirection: "column", gap: "6px", padding: "6px",
      minHeight: 0, overflow: "hidden",
    }}>
      {/* Top: Controls + Log */}
      <div style={{ display: "flex", gap: "6px", height: "240px", flexShrink: 0 }}>
        {/* System Controls */}
        <div style={{
          width: "320px", flexShrink: 0, background: "#0c0f17", border: "1px solid #131825",
          borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
            System Controls
          </div>

          {/* WebSocket Status */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
            background: "#0a0d14", borderRadius: "6px", border: "1px solid #131825",
          }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: wsState ? "#00E5A0" : "#FF6C6C",
              boxShadow: wsState ? "0 0 8px rgba(0,229,160,0.4)" : "0 0 8px rgba(255,108,108,0.4)",
              animation: wsState ? "livePulse 2s infinite" : "none",
            }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
              WebSocket
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 700, marginLeft: "auto",
              color: wsState ? "#00E5A0" : "#FF6C6C",
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              {wsState ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleResetDb} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(255,184,77,0.08)", border: "1px solid rgba(255,184,77,0.2)",
              color: "#FFB84D", width: "100%", textAlign: "left",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ fontSize: "13px" }}>↻</span> Reset Database
            </button>

            <button onClick={() => handleWsToggle(true)} disabled={wsState} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: wsState ? "not-allowed" : "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: wsState ? "rgba(0,229,160,0.03)" : "rgba(0,229,160,0.08)",
              border: `1px solid rgba(0,229,160,${wsState ? "0.08" : "0.2"})`,
              color: "#00E5A0", width: "100%", textAlign: "left",
              opacity: wsState ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ fontSize: "13px" }}>▶</span> Turn On WebSocket
            </button>

            <button onClick={() => handleWsToggle(false)} disabled={!wsState} style={{
              padding: "8px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: !wsState ? "not-allowed" : "pointer", fontFamily: "'Space Grotesk',sans-serif",
              background: !wsState ? "rgba(255,108,108,0.03)" : "rgba(255,108,108,0.08)",
              border: `1px solid rgba(255,108,108,${!wsState ? "0.08" : "0.2"})`,
              color: "#FF6C6C", width: "100%", textAlign: "left",
              opacity: !wsState ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ fontSize: "13px" }}>■</span> Close WebSocket
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
            <div style={{
              flex: 1, padding: "6px 8px", background: "#0a0d14", borderRadius: "4px",
              border: "1px solid #131825", textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#00E5A0", fontFamily: "'JetBrains Mono',monospace" }}>{activeCount}</div>
              <div style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "0.5px", textTransform: "uppercase" }}>Active</div>
            </div>
            <div style={{
              flex: 1, padding: "6px 8px", background: "#0a0d14", borderRadius: "4px",
              border: "1px solid #131825", textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#FF6C6C", fontFamily: "'JetBrains Mono',monospace" }}>{bannedCount}</div>
              <div style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "0.5px", textTransform: "uppercase" }}>Banned</div>
            </div>
          </div>
        </div>

        {/* Log Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <LogPanel logs={logs} />
        </div>
      </div>

      {/* Bottom: User Management */}
      <div style={{
        flex: 1, minHeight: 0, background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
            User Management
          </div>
          <span style={{ fontSize: "9px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace" }}>
            {filteredUsers.length} / {users.length} users
          </span>
        </div>

        {/* Search */}
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
              outline: "none",
            }}
          />
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
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
