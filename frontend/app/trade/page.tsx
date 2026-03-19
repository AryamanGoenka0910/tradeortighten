"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SecurityQuadrant from "./components/SecurityQuadrant";
import PortfolioPanel from "./components/PortfolioPanel";
import OpenOrdersPanel from "./components/OpenOrdersPanel";
import LeaderboardPanel from "./components/LeaderboardPanel";
import PageHeader from "./components/PageHeader";
import { SECURITY_META } from "@/lib/securities";


// --- Types ---
interface PriceLevel { price: number; qty: number; }
interface OrderBook { bids: PriceLevel[]; asks: PriceLevel[]; }
interface Position { available: number; reserved: number; }
interface Portfolio {
  cashAvailable: number;
  cashReserved: number;
  positions: Record<number, Position>;
}
interface UiOrder {
  id: string;
  orderId: number;
  ticker: string;
  side: "BUY" | "SELL";
  price: number;
  remainingQty: number;
  qty: number;
  status: "RESTING" | "PARTIAL" | "FILLED" | "CANCELLED";
  assetId: number;
}
interface LeaderboardEntry {
  rank: number;
  clientName: string;
  totalValue: number;
  cashAvailable: number;
  cashReserved: number;
}
interface PlaceOrderPayload { ticker: string; side: string; price: number; qty: number; }
interface WsMessage {
  type?: string;
  clientId?: string;
  portfolio?: Record<string, unknown>;
  orders?: ServerOrderRaw[];
  order?: ServerOrderRaw;
  orderBook?: OrderBook;
  assetId?: number;
  asset?: number;
  seq?: number;
  serverLastSeq?: number;
  client?: { lastSeq?: number };
  entries?: LeaderboardEntry[];
  reason?: string;
}
// --- Portfolio helpers ---
interface ServerPortfolioRaw {
  cashAvailable?: number | string;
  cashReserved?: number | string;
  asset1Available?: number | string; asset1Reserved?: number | string;
  asset2Available?: number | string; asset2Reserved?: number | string;
  asset3Available?: number | string; asset3Reserved?: number | string;
  asset4Available?: number | string; asset4Reserved?: number | string;
}
interface ServerPortfolioPartial {
  cashAvailable?: number | string;
  cashReserved?: number | string;
  assetId?: number | null;
  positionsAvailable?: number | string;
  positionsReserved?: number | string;
}

function normalizeFullPortfolio(raw: ServerPortfolioRaw): Portfolio {
  return {
    cashAvailable: Number(raw.cashAvailable ?? 0),
    cashReserved: Number(raw.cashReserved ?? 0),
    positions: {
      1: { available: Number(raw.asset1Available ?? 0), reserved: Number(raw.asset1Reserved ?? 0) },
      2: { available: Number(raw.asset2Available ?? 0), reserved: Number(raw.asset2Reserved ?? 0) },
      3: { available: Number(raw.asset3Available ?? 0), reserved: Number(raw.asset3Reserved ?? 0) },
      4: { available: Number(raw.asset4Available ?? 0), reserved: Number(raw.asset4Reserved ?? 0) },
    },
  };
}

function mergePartialPortfolio(prev: Portfolio | null, partial: ServerPortfolioPartial): Portfolio {
  const base = prev ?? { cashAvailable: 0, cashReserved: 0, positions: {} };
  const next = {
    cashAvailable: Number(partial.cashAvailable ?? base.cashAvailable),
    cashReserved: Number(partial.cashReserved ?? base.cashReserved),
    positions: { ...base.positions },
  };
  if (partial.assetId != null) {
    next.positions[partial.assetId] = {
      available: Number(partial.positionsAvailable ?? 0),
      reserved: Number(partial.positionsReserved ?? 0),
    };
  }
  return next;
}

// --- Order helpers ---
interface ServerOrderRaw {
  orderId: string;
  side?: string;
  price?: number;
  originalQty?: number;
  currentQty?: number;
  status?: string;
  asset?: number;
}
function mapServerOrderToUi(order: ServerOrderRaw): UiOrder {
  const serverStatus = String(order.status ?? "");
  const status = (
    serverStatus === "filled" ? "FILLED"
      : serverStatus === "partially_filled" ? "PARTIAL"
      : serverStatus === "cancelled" ? "CANCELLED"
      : "RESTING"
  ) as UiOrder["status"];

  const assetId = Number(order.asset ?? 1);
  const orderId = Number(order.orderId);
  return {
    id: `ORD-${assetId}-${orderId}`,
    orderId,
    ticker: SECURITY_META.find(s => s.id === assetId)?.ticker ?? "ALPHA",
    side: (order.side === "buy" ? "BUY" : "SELL") as "BUY" | "SELL",
    price: Number(order.price),
    remainingQty: Number(order.currentQty ?? 0),
    qty: Number(order.originalQty ?? 0),
    status,
    assetId,
  };
}

export default function TradePage() {
  const router = useRouter();

  // Client Game Data
  const [openOrders, setOpenOrders] = useState<UiOrder[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rightTab, setRightTab] = useState<"orders" | "leaderboard">("orders");

  // Client MetaData
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);

  // Client UI data
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [rejections, setRejections] = useState<Record<number, string>>({});

  // Orderbook Data
  const [orderBooks, setOrderBooks] = useState<Record<number, OrderBook>>({
    1: { bids: [], asks: [] },
    2: { bids: [], asks: [] },
    3: { bids: [], asks: [] },
    4: { bids: [], asks: [] },
  });
  const [histories, setHistories] = useState<Record<number, number[]>>({ 1: [], 2: [], 3: [], 4: [] });


  const applyOrderDelta = (serverOrder: ServerOrderRaw) => {
    const mapped = mapServerOrderToUi(serverOrder);
    const isTerminal = mapped.status === "FILLED" || mapped.status === "CANCELLED";

    setOpenOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === mapped.id);

      if (isTerminal) return idx === -1 ? prev : prev.filter((o) => o.id !== mapped.id);
      if (idx === -1) return [...prev, mapped];

      const next = [...prev];
      next[idx] = mapped;
      return next;
    });
  };

  const syncSeq = (serverSeq: unknown) => {
    const n = Number(serverSeq);
    if (!Number.isFinite(n)) return;
    seqRef.current = Math.max(seqRef.current, n);
  };

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isMounted = true;

    const boot = async () => {
      if (!supabase) {
        setAuthError("Supabase is not configured.");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setAuthError("Not logged in. Please sign in.");
        return;
      }

      const user = data.user;
      const resolvedClientName: string | null =
        (user.user_metadata?.first_name as string | undefined) ??
        (user.user_metadata?.last_name as string | undefined) ??
        null;

      if (!resolvedClientName || !user.id) return;
      if (!isMounted) return;
      setClientId(user.id);
      setClientName(resolvedClientName);

      socket = new WebSocket("wss://ary-credit.ngrok.app");
      // socket = new WebSocket("ws://localhost:8080");
      wsRef.current = socket;

      socket.onopen = () => {
        wsRef.current?.send(
          JSON.stringify({
            type: "initial_load",
            clientId: user.id,
            clientName: resolvedClientName,
            lastSeq: 0,
          }),
        );
        console.log("WebSocket connection opened.");
      };

      socket.onmessage = (event) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(event.data) as WsMessage;
        } catch {
          return;
        }

        console.log("Received message:", msg);

        if (msg.type === "leaderboard_update" && Array.isArray(msg.entries)) {
          setLeaderboard(msg.entries);
          return;
        }

        if (msg.clientId === user.id && msg.type === "initial_load_snapshot") {
          if (msg.portfolio) {
            setPortfolio(normalizeFullPortfolio(msg.portfolio as ServerPortfolioRaw));
          }

          if (msg.client?.lastSeq != null) {
            syncSeq(msg.client.lastSeq);
          }

          if (Array.isArray(msg.orders)) {
            const mappedOrders = (msg.orders ?? []).map(mapServerOrderToUi);
            setOpenOrders(mappedOrders);
            return;
          }
        }

        if (msg.clientId === user.id && msg.type === "order_update_snapshot" && msg.order && msg.portfolio) {
          syncSeq(msg.seq);
          applyOrderDelta(msg.order);
          setPortfolio((prev) => mergePartialPortfolio(prev, msg.portfolio as ServerPortfolioPartial));
          return;
        }

        if (msg.clientId === user.id && msg.type === "cancel_accepted" && msg.order) {
          applyOrderDelta(msg.order);
          if (msg.portfolio) {
            setPortfolio((prev) => mergePartialPortfolio(prev, msg.portfolio as ServerPortfolioPartial));
          }
          return;
        }

        if (msg.clientId === user.id && msg.type === "place_duplicate_ignored" && msg.order) {
          syncSeq(msg.seq);
          applyOrderDelta(msg.order);
          return;
        }

        if (msg.clientId === user.id && msg.type === "order_book_update" && msg.orderBook) {
          const assetId: number = msg.assetId ?? 1;
          setOrderBooks(prev => ({ ...prev, [assetId]: msg.orderBook! }));
          setHistories(prev => {
            const ob = msg.orderBook!;
            if (!ob.bids.length || !ob.asks.length) return prev;
            const mid = (ob.bids[0].price + ob.asks[ob.asks.length - 1].price) / 2;
            return { ...prev, [assetId]: [...(prev[assetId] ?? []), mid].slice(-30) };
          });
          return;
        }

        if (msg.clientId === user.id && msg.type === "place_rejected") {
          if (msg.serverLastSeq != null) {
            seqRef.current = msg.serverLastSeq;
          } else {
            syncSeq(msg.seq);
          }
          if (msg.asset != null && msg.reason) {
            // TODO: MAKE a mapping of reasons
            const assetId = msg.asset;
            const reason = msg.reason.length > 80 ? msg.reason.slice(0, 80) + "…" : msg.reason;
            setRejections(prev => ({ ...prev, [assetId]: reason }));
            setTimeout(() => {
              setRejections(prev => { const next = { ...prev }; delete next[assetId]; return next; });
            }, 2000);
          }
          return;
        }
      };

      socket.onerror = () => {
        setAuthError("WebSocket connection failed.");
      };
    };

    boot();

    return () => {
      isMounted = false;
      if (socket) socket.close();
      wsRef.current = null;
    };
  }, []);

  const cancelOrder = (ord: UiOrder) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !clientId) return;
    socket.send(JSON.stringify({
      type: "cancel",
      clientId,
      orderId: ord.orderId,
      assetId: ord.assetId,
    }));
  };

  const handleOrder = (order: PlaceOrderPayload) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !clientId) return;

    console.log("Placing order:", order);

    const nextSeq = seqRef.current + 1;
    seqRef.current = nextSeq;

    const asset = SECURITY_META.find(s => s.ticker === order.ticker);
    if (!asset) return;

    const payload = {
      type: "place",
      clientId,
      seq: nextSeq,
      clientOrderId:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `client-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      side: order.side === "BID" ? "buy" : "sell",
      price: Math.round(Number(order.price)),
      qty: Math.round(Number(order.qty)),
      asset: asset.id,
    };

    socket.send(JSON.stringify(payload));
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };


  if (authError) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080a12", color: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',-apple-system,sans-serif" }}>
        <div style={{ border: "1px solid #3b1820", background: "#140b10", borderRadius: "10px", padding: "16px 18px", maxWidth: "520px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ff8ea1", marginBottom: "8px" }}>Authentication Error</div>
          <div style={{ fontSize: "12px", color: "#f3c5cf" }}>{authError}</div>
        </div>
      </div>
    );
  }

  if (!clientId || !clientName) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080a12", color: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',-apple-system,sans-serif" }}>
        Loading trader session...
      </div>
    );
  }


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

      <PageHeader
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />

    {/* Main Content */}
    <div style={{
      flex: 1, display: "grid",
      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
      gridTemplateRows: "repeat(2,minmax(0,1fr))",
      gap: "6px", padding: "6px", minHeight: 0,
    }}>
      {SECURITY_META.map((meta) => (
        <SecurityQuadrant
          key={meta.id}
          viewToggle={false}
          security={{ ...meta, history: histories[meta.id] }}
          orderBook={orderBooks[meta.id]}
          onOrder={handleOrder}
          rejectionMsg={rejections[meta.id] ?? null}
          onDismissRejection={() => setRejections(prev => { const next = { ...prev }; delete next[meta.id]; return next; })}
        />
      ))}
      <div style={{ gridColumn: "3", gridRow: "1 / span 2", display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}>
        <PortfolioPanel portfolio={portfolio} orders={openOrders} />

        {/* Tab toggle */}
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {(["orders", "leaderboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              style={{
                flex: 1,
                padding: "5px 0",
                borderRadius: "6px",
                border: rightTab === tab ? "1px solid #1e2a40" : "1px solid #131825",
                background: rightTab === tab ? "#111827" : "transparent",
                color: rightTab === tab ? "#e5e7eb" : "#4b5563",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'Space Grotesk',sans-serif",
                transition: "all 0.15s",
              }}
            >
              {tab === "orders" ? "Open Orders" : "Leaderboard"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {rightTab === "orders" ? (
            <OpenOrdersPanel orders={openOrders} onCancel={cancelOrder} />
          ) : (
            <LeaderboardPanel leaderboard={leaderboard} />
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
