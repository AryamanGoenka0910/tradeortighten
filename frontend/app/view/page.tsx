"use client";

// Public sponsor view — no auth required
import { useState, useEffect, useRef } from "react";
import SecurityQuadrant from "../trade/components/SecurityQuadrant";
import LeaderboardPanel from "../trade/components/LeaderboardPanel";
import PageHeader from "../trade/components/PageHeader";
import { SECURITY_META } from "@/lib/securities";

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

const NOOP = () => {};

type PriceLevel = { price: number; qty: number };
type OrderBook = { bids: PriceLevel[]; asks: PriceLevel[] };

export default function ViewPage() {
  const [orderBooks, setOrderBooks] = useState<Record<number, OrderBook>>({
    1: { bids: [], asks: [] }, 2: { bids: [], asks: [] },
    3: { bids: [], asks: [] }, 4: { bids: [], asks: [] },
  });
  const [histories, setHistories] = useState<Record<number, number[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const viewerClientId = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "initial_load", clientId: viewerClientId.current, clientName: "viewer", lastSeq: 0 }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.clientId === viewerClientId.current && msg.type === "order_book_update" && msg.orderBook) {
          // TODO: backend needs to include assetId in this message; defaulting to 1 (ALPHA) until then
          const assetId: number = msg.assetId ?? 1;
          setOrderBooks(prev => ({ ...prev, [assetId]: msg.orderBook }));
          setHistories(prev => {
            const ob: OrderBook = msg.orderBook;
            if (!ob.bids.length || !ob.asks.length) return prev;
            const mid = (ob.bids[0].price + ob.asks[ob.asks.length - 1].price) / 2;
            return { ...prev, [assetId]: [...prev[assetId], mid].slice(-30) };
          });
        }
      } catch { /* ignore malformed messages */ }
    };
    return () => ws.close();
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#080a12",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'Space Grotesk',-apple-system,sans-serif",
    }}>
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
      `}</style>

      <PageHeader />

      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "repeat(5,minmax(0,1fr))",
        gridTemplateRows: "repeat(1,minmax(0,1fr))",
        gap: "6px", padding: "6px", minHeight: 0,
      }}>
        {SECURITY_META.map((meta) => (
          <SecurityQuadrant
            key={meta.id}
            viewToggle={true}
            security={{ ...meta, history: histories[meta.id] }}
            orderBook={orderBooks[meta.id]}
            onOrder={NOOP}
            rejectionMsg={null}
            onDismissRejection={NOOP}
          />
        ))}
        <LeaderboardPanel leaderboard={LEADERBOARD} />
      </div>
    </div>
  );
}
