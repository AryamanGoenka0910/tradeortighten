"use client";

// Public sponsor view — no auth required
import { useState, useEffect, useRef } from "react";
import SecurityQuadrant from "../trade/components/SecurityQuadrant";
import LeaderboardPanel from "../trade/components/LeaderboardPanel";
import PageHeader from "../trade/components/PageHeader";
import { SECURITY_META } from "@/lib/securities";

const NOOP = () => {};

type PriceLevel = { price: number; qty: number };
type OrderBook = { bids: PriceLevel[]; asks: PriceLevel[] };

export default function ViewPage() {
  const [orderBooks, setOrderBooks] = useState<Record<number, OrderBook>>({
    1: { bids: [], asks: [] }, 2: { bids: [], asks: [] },
    3: { bids: [], asks: [] }, 4: { bids: [], asks: [] },
  });
  const [midPrices, setMidPrices] = useState<Record<number, number>>({ 1: 50, 2: 50, 3: 50, 4: 50 });
  const [histories, setHistories] = useState<Record<number, number[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [leaderboard, setLeaderboard] = useState<{ rank: number; clientName: string; portfolioValue: number }[]>([]);
  const viewerClientId = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const ws = new WebSocket("wss://ary-credit.ngrok.app");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "view", clientId: viewerClientId.current }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "leaderboard_update" && Array.isArray(msg.entries)) {
          setLeaderboard(msg.entries);
          return;
        }
        if (msg.type === "price_history_update" && msg.priceHistory) {
          setHistories(msg.priceHistory);
          return;
        }
        if (msg.clientId === viewerClientId.current && msg.type === "order_book_update" && msg.orderBook) {
          const assetId: number = msg.assetId ?? 1;
          setOrderBooks(prev => ({ ...prev, [assetId]: msg.orderBook }));
          setMidPrices(prev => ({ ...prev, [assetId]: msg.midPrice }));
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
        gridTemplateColumns: "repeat(2,minmax(0,1fr)) 320px",
        gridTemplateRows: "repeat(2,minmax(0,1fr))",
        gap: "6px", padding: "6px", minHeight: 0,
      }}>
        {SECURITY_META.map((meta) => (
          <SecurityQuadrant
            key={meta.id}
            viewToggle={true}
            security={{ ...meta, history: histories[meta.id] }}
            orderBook={orderBooks[meta.id]}
            midPrice={midPrices[meta.id]}
            onOrder={NOOP}
            rejectionMsg={null}
            onDismissRejection={NOOP}
          />
        ))}
        <div style={{ gridColumn: "3", gridRow: "1 / span 2" }}>
          <LeaderboardPanel leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
}
