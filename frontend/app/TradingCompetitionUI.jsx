"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SecurityQuadrant from "./components/SecurityQuadrant";
import PortfolioPanel from "./components/PortfolioPanel";
import OpenOrdersPanel from "./components/OpenOrdersPanel";
import LeaderboardPanel from "./components/LeaderboardPanel";
import InboxPanel from "./components/InboxPanel";

// --- Mock Data ---
const SECURITIES = [
  {
    id: "SEC-A", ticker: "ALPHA", color: "#00E5A0", currentPrice: 52.3, change: +2.8,
    history: [44, 46, 45, 48, 47, 50, 49, 51, 50, 52, 51, 53, 52, 51, 53, 52.3],
    bids: [
      { price: 52.0, qty: 120 }, { price: 51.8, qty: 85 }, { price: 51.5, qty: 200 },
      { price: 51.2, qty: 150 }, { price: 51.0, qty: 310 },
    ],
    asks: [
      { price: 52.5, qty: 95 }, { price: 52.8, qty: 140 }, { price: 53.0, qty: 75 },
      { price: 53.3, qty: 220 }, { price: 53.5, qty: 180 },
    ],
  },
  {
    id: "SEC-B", ticker: "BETA", color: "#6C8EFF", currentPrice: 34.7, change: -1.2,
    history: [38, 37, 36, 37, 35, 36, 35, 34, 35, 34, 35, 34, 33, 34, 35, 34.7],
    bids: [
      { price: 34.5, qty: 200 }, { price: 34.3, qty: 150 }, { price: 34.0, qty: 90 },
      { price: 33.8, qty: 175 }, { price: 33.5, qty: 260 },
    ],
    asks: [
      { price: 35.0, qty: 110 }, { price: 35.2, qty: 80 }, { price: 35.5, qty: 195 },
      { price: 35.8, qty: 130 }, { price: 36.0, qty: 240 },
    ],
  },
  {
    id: "SEC-C", ticker: "GAMMA", color: "#FF6C6C", currentPrice: 78.1, change: +5.4,
    history: [65, 67, 70, 68, 72, 71, 73, 72, 74, 75, 73, 76, 75, 77, 76, 78.1],
    bids: [
      { price: 77.8, qty: 60 }, { price: 77.5, qty: 130 }, { price: 77.0, qty: 95 },
      { price: 76.5, qty: 210 }, { price: 76.0, qty: 170 },
    ],
    asks: [
      { price: 78.5, qty: 85 }, { price: 79.0, qty: 120 }, { price: 79.5, qty: 55 },
      { price: 80.0, qty: 190 }, { price: 80.5, qty: 145 },
    ],
  },
  {
    id: "SEC-D", ticker: "DELTA", color: "#FFB84D", currentPrice: 21.5, change: +0.3,
    history: [20, 20.5, 21, 20.8, 21.2, 21, 21.5, 21.3, 21.8, 21.5, 21.2, 21.6, 21.4, 21.7, 21.3, 21.5],
    bids: [
      { price: 21.3, qty: 300 }, { price: 21.0, qty: 180 }, { price: 20.8, qty: 250 },
      { price: 20.5, qty: 120 }, { price: 20.0, qty: 400 },
    ],
    asks: [
      { price: 21.8, qty: 160 }, { price: 22.0, qty: 220 }, { price: 22.3, qty: 90 },
      { price: 22.5, qty: 275 }, { price: 23.0, qty: 140 },
    ],
  },
];

const LEADERBOARD = [
  { rank: 1, name: "QuantWolf", pnl: 12450.2, trades: 87 },
  { rank: 2, name: "AlphaSeeker", pnl: 11230.5, trades: 124 },
  { rank: 3, name: "BayesianBandit", pnl: 9870.0, trades: 63 },
  { rank: 4, name: "SigmaTrader", pnl: 8540.3, trades: 95 },
  { rank: 5, name: "MarkovChain", pnl: 7210.8, trades: 78 },
  { rank: 6, name: "GammaHedge", pnl: 6890.1, trades: 112 },
  { rank: 7, name: "DeltaForce", pnl: 5430.6, trades: 56 },
  { rank: 8, name: "ThetaDecay", pnl: 4870.9, trades: 91 },
  { rank: 9, name: "VegaLong", pnl: 4120.4, trades: 44 },
  { rank: 10, name: "RhoRunner", pnl: 3560.7, trades: 103 },
  { rank: 11, name: "KappaFlow", pnl: 2980.2, trades: 67 },
  { rank: 12, name: "EpsilonEdge", pnl: 2340.0, trades: 82 },
  { rank: 13, name: "ZetaPrime", pnl: 1890.5, trades: 39 },
  { rank: 14, name: "EtaVolatil", pnl: 1230.8, trades: 71 },
  { rank: 15, name: "IotaSpread", pnl: 870.3, trades: 58 },
  { rank: 16, name: "LambdaCalc", pnl: 540.1, trades: 93 },
  { rank: 17, name: "MuNeutral", pnl: 210.6, trades: 47 },
  { rank: 18, name: "NuTrader", pnl: -120.4, trades: 85 },
  { rank: 19, name: "XiMomentum", pnl: -450.9, trades: 36 },
  { rank: 20, name: "OmicronPhi", pnl: -890.2, trades: 74 },
];

const INITIAL_MESSAGES = [
  { id: 1, title: "Welcome to MIG Quant Comp 2026", body: "Welcome traders! The competition has begun. You have 4 securities to trade. Good luck!", time: "10:00 AM", read: true },
  { id: 2, title: "Market Intel: Alpha Index", body: "ALPHA has shown strong momentum. Rumor: a catalyst event may hit within 30 min.", time: "10:15 AM", read: false },
];

const MOCK_POSITIONS = [
  { ticker: "ALPHA", side: "BUY", qty: 25, entryPrice: 50.2, currentPrice: 52.3 },
  { ticker: "GAMMA", side: "SELL", qty: 10, entryPrice: 80.0, currentPrice: 78.1 },
];

const MOCK_OPEN_ORDERS = [
  { id: "ORD-001", ticker: "BETA", side: "BUY", type: "LIMIT", price: 33.5, qty: 50, filled: 0, status: "OPEN" },
  { id: "ORD-002", ticker: "DELTA", side: "SELL", type: "LIMIT", price: 22.5, qty: 30, filled: 12, status: "PARTIAL" },
  { id: "ORD-003", ticker: "ALPHA", side: "BUY", type: "LIMIT", price: 51.0, qty: 40, filled: 0, status: "OPEN" },
];

// --- Toast ---
function Toast({ message, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div style={{
      position: "fixed", top: "60px", right: "20px", zIndex: 200,
      background: "#0f1219", border: "1px solid rgba(108,142,255,0.2)",
      borderRadius: "8px", padding: "10px 14px", maxWidth: "280px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeSlideDown 0.25s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6C8EFF", animation: "pulse 1.5s infinite" }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>New Message</span>
        <button onClick={onDismiss} style={{ marginLeft: "auto", background: "none", border: "none", color: "#3b4252", cursor: "pointer", fontSize: "11px" }}>✕</button>
      </div>
      <div style={{ fontSize: "10px", color: "#6b7280", paddingLeft: "13px", marginTop: "2px" }}>{message.title}</div>
    </div>
  );
}

// --- Main App ---
export default function TradingCompetitionUI() {
  const router = useRouter();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState("01:23:47");
  const [positions] = useState(MOCK_POSITIONS);
  const [openOrders, setOpenOrders] = useState(MOCK_OPEN_ORDERS);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let s = 1 * 3600 + 23 * 60 + 47;
    const iv = setInterval(() => {
      s = Math.max(0, s - 1);
      setClock(`${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const m = { id: 3, title: "⚡ Volatility Alert: GAMMA", body: "GAMMA Vol surged past resistance. Large block orders on ask side.", time: "10:32 AM", read: false };
      setMessages((prev) => [m, ...prev]);
      setToast(m);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  const markRead = (id) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  const cancelOrder = (id) => setOpenOrders((prev) => prev.filter((o) => o.id !== id));
  const handleOrder = (order) => {
    const newOrd = { id: `ORD-${Date.now()}`, ticker: order.ticker, side: order.side === "BID" ? "BUY" : "SELL", type: "LIMIT", price: order.price, qty: order.qty, filled: 0, status: "OPEN" };
    setOpenOrders((prev) => [newOrd, ...prev]);
  };
  const handleSignOut = async () => {
    setIsSigningOut(true);
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const unreadCount = messages.filter((m) => !m.read).length;
  const uPnl = positions.reduce((s, p) => s + (p.side === "BUY" ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice) * p.qty, 0);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080a12", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Space Grotesk',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes livePulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,229,160,0.4); } 50% { box-shadow:0 0 0 4px rgba(0,229,160,0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1a1f2e; border-radius:2px; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        input::placeholder { color:#2a3040; }
      `}</style>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

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
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00E5A0", animation: "livePulse 2s infinite" }} />
            <span style={{ fontSize: "8px", color: "#00E5A0", fontWeight: 700, letterSpacing: "1px" }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ padding: "5px 12px", borderRadius: "6px", background: "#0f1219", border: "1px solid #1a1f2e", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "8px", color: "#4b5563" }}>TIME</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>{clock}</span>
          </div>
          <div style={{ padding: "5px 12px", borderRadius: "6px", background: "#0f1219", border: "1px solid #1a1f2e" }}>
            <span style={{ fontSize: "8px", color: "#4b5563" }}>P&L </span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: uPnl >= 0 ? "#00E5A0" : "#FF6C6C", fontFamily: "'JetBrains Mono',monospace" }}>
              {uPnl >= 0 ? "+" : ""}${Math.abs(uPnl).toFixed(0)}
            </span>
          </div>
          <button onClick={() => { setShowInbox(!showInbox); setShowLeaderboard(false); }} style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #1a1f2e", cursor: "pointer",
            background: showInbox ? "#151a27" : "#0f1219", color: "#e5e7eb", fontSize: "12px",
            display: "flex", alignItems: "center", position: "relative",
          }}>
            📨
            {unreadCount > 0 && <span style={{ position: "absolute", top: "-3px", right: "-3px", background: "#FF6C6C", color: "#0a0d14", fontSize: "8px", fontWeight: 800, width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace" }}>{unreadCount}</span>}
          </button>
          <button onClick={() => { setShowLeaderboard(!showLeaderboard); setShowInbox(false); }} style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #1a1f2e", cursor: "pointer",
            background: showLeaderboard ? "#151a27" : "#0f1219", color: "#e5e7eb", fontSize: "11px",
            display: "flex", alignItems: "center", gap: "4px", fontWeight: 600,
          }}>
            🏆 <span style={{ fontSize: "10px" }}>Board</span>
          </button>
          <button onClick={handleSignOut} disabled={isSigningOut} style={{
            padding: "6px 10px", borderRadius: "6px", border: "1px solid #3b1820", cursor: isSigningOut ? "not-allowed" : "pointer",
            background: "#140b10", color: "#ff8ea1", fontSize: "11px",
            display: "flex", alignItems: "center", gap: "4px", fontWeight: 700, opacity: isSigningOut ? 0.6 : 1,
          }}>
            ⎋ <span style={{ fontSize: "10px" }}>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>

      {/* 3x2 Grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "minmax(0,0.75fr) minmax(0,0.75fr) minmax(0,1.5fr)",
        gridTemplateRows: "minmax(0,1fr) minmax(0,1fr)",
        gap: "6px", padding: "6px", minHeight: 0,
      }}>
        <SecurityQuadrant security={SECURITIES[0]} onOrder={handleOrder} />
        <SecurityQuadrant security={SECURITIES[1]} onOrder={handleOrder} />
        <PortfolioPanel positions={positions} />
        <SecurityQuadrant security={SECURITIES[2]} onOrder={handleOrder} />
        <SecurityQuadrant security={SECURITIES[3]} onOrder={handleOrder} />
        <OpenOrdersPanel orders={openOrders} onCancel={cancelOrder} />
      </div>

      {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} leaderboard={LEADERBOARD} />}
      {showInbox && <InboxPanel messages={messages} onClose={() => setShowInbox(false)} onMarkRead={markRead} />}
    </div>
  );
}
