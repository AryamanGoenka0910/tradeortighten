"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "wss://ary-credit.ngrok.app";
// const WS_URL = "ws://localhost:8080";

const ASSET_NAMES = { 1: "ALPHA", 2: "BETA", 3: "GAMMA", 4: "DELTA" };
const ASSET_COLORS = { 1: "#00E5A0", 2: "#6C8EFF", 3: "#FF6C6C", 4: "#FFB84D" };

export default function AdminPanel() {
  const wsRef = useRef(null);
  const adminIdRef = useRef(`admin-${Math.random().toString(36).slice(2, 9)}`);

  const [wsConnected, setWsConnected] = useState(false);
  const [tradingActive, setTradingActive] = useState(true);
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(600);

  // Local countdown mirror for admin display
  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => setTimerSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [timerRunning]);

  const sendMsg = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ clientId: adminIdRef.current, ...msg }));
    }
  }, []);

  const refreshOrders = useCallback(() => {
    sendMsg({ type: "admin_get_orders" });
  }, [sendMsg]);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let pollTimer;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Register and get initial data
        ws.send(JSON.stringify({ clientId: adminIdRef.current, type: "admin_get_orders" }));
        // Poll every 5 seconds
        pollTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ clientId: adminIdRef.current, type: "admin_get_orders" }));
          }
        }, 5000);
      };

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        if (msg.type === "admin_orders_snapshot") {
          setOrders(msg.orders ?? []);
          setLastRefresh(new Date());
          setServerError(null);
        } else if (msg.type === "trading_state_update") {
          setTradingActive(msg.enabled);
        } else if (msg.type === "admin_error") {
          setServerError(msg.error ?? "Unknown server error");
        } else if (msg.type === "timer_update") {
          if (msg.action === "start") {
            setTimerSeconds(600);
            setTimerRunning(true);
          } else {
            setTimerRunning(false);
            setTimerSeconds(600);
          }
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        clearInterval(pollTimer);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(pollTimer);
      ws?.close();
    };
  }, []);

  const handleToggleTrading = (enable) => {
    sendMsg({ type: "admin_toggle_trading", enabled: enable });
  };

  const handleTimerStart = () => sendMsg({ type: "admin_timer_start" });
  const handleTimerReset = () => sendMsg({ type: "admin_timer_reset" });

  const timerClock = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  const handleCancelOrder = (order) => {
    if (order.orderId == null) return;
    setCancellingId(order.dbOrderId);
    sendMsg({
      type: "admin_cancel_order",
      ownerId: order.clientId,
      orderId: order.orderId,
      assetId: order.assetId,
    });
    // Clear cancelling state after response expected
    setTimeout(() => setCancellingId(null), 3000);
  };

  const openOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "partially_filled"
  );

  return (
    <div style={{
      width: "100%", display: "flex", flexDirection: "column", gap: "8px",
      padding: "8px", overflowY: "auto", overflowX: "hidden",
    }}>

      {/* Trading Controls */}
      <div style={{
        background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", flexShrink: 0,
      }}>
        <div style={{
          fontSize: "11px", fontWeight: 800, color: "#6b7280",
          letterSpacing: "0.8px", textTransform: "uppercase",
          fontFamily: "'Space Grotesk',sans-serif", marginBottom: "12px",
        }}>
          System Controls
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* WS status */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 10px", background: "#0a0d14",
            borderRadius: "6px", border: "1px solid #131825",
          }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: wsConnected ? "#00E5A0" : "#FF6C6C",
              boxShadow: wsConnected ? "0 0 6px rgba(0,229,160,0.5)" : "0 0 6px rgba(255,108,108,0.5)",
            }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>
              WS
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
              color: wsConnected ? "#00E5A0" : "#FF6C6C",
            }}>
              {wsConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Trading state indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", background: "#0a0d14",
            borderRadius: "6px",
            border: `1px solid ${tradingActive ? "rgba(0,229,160,0.2)" : "rgba(255,108,108,0.2)"}`,
          }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: tradingActive ? "#00E5A0" : "#FF6C6C",
            }} />
            <span style={{
              fontSize: "10px", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
              color: tradingActive ? "#00E5A0" : "#FF6C6C",
            }}>
              {tradingActive ? "TRADING ACTIVE" : "TRADING HALTED"}
            </span>
          </div>

          {/* Toggle buttons */}
          <button
            onClick={() => handleToggleTrading(true)}
            disabled={tradingActive || !wsConnected}
            style={{
              padding: "7px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: (tradingActive || !wsConnected) ? "not-allowed" : "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(0,229,160,0.08)",
              border: "1px solid rgba(0,229,160,0.2)",
              color: "#00E5A0",
              opacity: (tradingActive || !wsConnected) ? 0.35 : 1,
            }}
          >
            ▶ Start Trading
          </button>

          <button
            onClick={() => handleToggleTrading(false)}
            disabled={!tradingActive || !wsConnected}
            style={{
              padding: "7px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: (!tradingActive || !wsConnected) ? "not-allowed" : "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(255,108,108,0.08)",
              border: "1px solid rgba(255,108,108,0.2)",
              color: "#FF6C6C",
              opacity: (!tradingActive || !wsConnected) ? 0.35 : 1,
            }}
          >
            ■ Stop Trading
          </button>
        </div>
      </div>

      {/* Timer Controls */}
      <div style={{
        background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", flexShrink: 0,
      }}>
        <div style={{
          fontSize: "11px", fontWeight: 800, color: "#6b7280",
          letterSpacing: "0.8px", textTransform: "uppercase",
          fontFamily: "'Space Grotesk',sans-serif", marginBottom: "12px",
        }}>
          Round Timer
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Timer display */}
          <div style={{
            padding: "7px 14px", background: "#0a0d14", borderRadius: "6px",
            border: `1px solid ${timerRunning ? "rgba(0,229,160,0.25)" : "#131825"}`,
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
              background: timerRunning ? "#00E5A0" : "#3b4252",
              boxShadow: timerRunning ? "0 0 6px rgba(0,229,160,0.5)" : "none",
            }} />
            <span style={{
              fontSize: "18px", fontWeight: 800, color: timerSeconds === 0 ? "#FF6C6C" : "#e5e7eb",
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px",
            }}>
              {timerClock}
            </span>
            <span style={{ fontSize: "9px", color: timerRunning ? "#00E5A0" : "#3b4252", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
              {timerRunning ? "RUNNING" : "PAUSED"}
            </span>
          </div>

          <button
            onClick={handleTimerStart}
            disabled={timerRunning || !wsConnected}
            style={{
              padding: "7px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: (timerRunning || !wsConnected) ? "not-allowed" : "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)",
              color: "#00E5A0", opacity: (timerRunning || !wsConnected) ? 0.35 : 1,
            }}
          >
            ▶ Start Timer
          </button>

          <button
            onClick={handleTimerReset}
            disabled={!wsConnected}
            style={{
              padding: "7px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              cursor: !wsConnected ? "not-allowed" : "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
              background: "rgba(255,184,77,0.08)", border: "1px solid rgba(255,184,77,0.2)",
              color: "#FFB84D", opacity: !wsConnected ? 0.35 : 1,
            }}
          >
            ↺ Reset Timer
          </button>
        </div>
      </div>

      {/* Open Orders Table */}
      <div style={{
        background: "#0c0f17", border: "1px solid #131825",
        borderRadius: "10px", padding: "14px", flexShrink: 0,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "10px",
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 800, color: "#6b7280",
            letterSpacing: "0.8px", textTransform: "uppercase",
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            Open Orders
            <span style={{
              marginLeft: "8px", fontSize: "9px", fontWeight: 700,
              fontFamily: "'JetBrains Mono',monospace", color: "#3b4252",
            }}>
              ({openOrders.length})
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {lastRefresh && (
              <span style={{ fontSize: "8px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace" }}>
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshOrders}
              disabled={!wsConnected}
              style={{
                padding: "4px 10px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                cursor: wsConnected ? "pointer" : "not-allowed",
                fontFamily: "'Space Grotesk',sans-serif",
                background: "rgba(108,142,255,0.08)",
                border: "1px solid rgba(108,142,255,0.2)",
                color: "#6C8EFF", opacity: wsConnected ? 1 : 0.4,
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {serverError && (
          <div style={{
            padding: "8px 10px", borderRadius: "6px", marginBottom: "8px",
            background: "rgba(255,108,108,0.08)", border: "1px solid rgba(255,108,108,0.2)",
            fontSize: "10px", color: "#FF6C6C", fontFamily: "'JetBrains Mono',monospace",
          }}>
            Server error: {serverError}
          </div>
        )}

        {openOrders.length === 0 ? (
          <div style={{
            textAlign: "center", color: "#3b4252",
            fontSize: "11px", padding: "24px 0",
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {wsConnected ? "No open orders" : "Connecting..."}
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 44px 60px 60px 72px 60px",
              padding: "4px 8px", marginBottom: "3px",
              fontSize: "8px", fontWeight: 700, color: "#3b4252",
              letterSpacing: "0.6px", textTransform: "uppercase",
              fontFamily: "'Space Grotesk',sans-serif",
            }}>
              <span>User</span>
              <span>Asset</span>
              <span>Side</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Status</span>
              <span></span>
            </div>

            {openOrders.map((order) => {
              const assetColor = ASSET_COLORS[order.assetId] ?? "#9ca3af";
              const assetName = ASSET_NAMES[order.assetId] ?? `A${order.assetId}`;
              const isPartial = order.status === "partially_filled";
              const isCancelling = cancellingId === order.dbOrderId;

              return (
                <div
                  key={order.dbOrderId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 44px 60px 60px 72px 60px",
                    alignItems: "center",
                    padding: "6px 8px",
                    background: "#0a0d14",
                    borderRadius: "4px",
                    marginBottom: "2px",
                    fontSize: "10px",
                    fontFamily: "'JetBrains Mono',monospace",
                    opacity: isCancelling ? 0.5 : 1,
                  }}
                >
                  <span style={{
                    color: "#e5e7eb", fontWeight: 600,
                    fontFamily: "'Space Grotesk',sans-serif",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {order.clientName}
                  </span>

                  <span style={{ color: assetColor, fontWeight: 700, fontSize: "9px" }}>
                    {assetName}
                  </span>

                  <span style={{
                    color: order.side === "buy" ? "#00E5A0" : "#FF6C6C",
                    fontWeight: 700, fontSize: "9px", textTransform: "uppercase",
                  }}>
                    {order.side}
                  </span>

                  <span style={{ color: "#9ca3af" }}>
                    {order.currentQty}
                    {isPartial && (
                      <span style={{ color: "#4b5563", fontSize: "8px" }}>
                        /{order.originalQty}
                      </span>
                    )}
                  </span>

                  <span style={{ color: "#9ca3af" }}>{order.price}</span>

                  <span style={{
                    fontSize: "8px", padding: "2px 5px", borderRadius: "3px",
                    fontWeight: 700, width: "fit-content",
                    background: isPartial ? "rgba(255,184,77,0.1)" : "rgba(108,142,255,0.1)",
                    color: isPartial ? "#FFB84D" : "#6C8EFF",
                  }}>
                    {isPartial ? "PARTIAL" : "RESTING"}
                  </span>

                  <button
                    onClick={() => handleCancelOrder(order)}
                    disabled={isCancelling || order.orderId == null}
                    style={{
                      padding: "3px 7px", borderRadius: "3px", fontSize: "8px",
                      fontWeight: 700, cursor: "pointer",
                      fontFamily: "'Space Grotesk',sans-serif",
                      background: "rgba(255,108,108,0.08)",
                      border: "1px solid rgba(255,108,108,0.2)",
                      color: "#FF6C6C",
                      opacity: (isCancelling || order.orderId == null) ? 0.4 : 1,
                    }}
                  >
                    {isCancelling ? "..." : "Cancel"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
