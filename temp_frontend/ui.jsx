import { useState, useEffect, useRef, useCallback } from "react";

// --- Mock Data ---
const SECURITIES = [
  {
    id: "SEC-A", name: "Alpha Index", ticker: "ALPHA", color: "#00E5A0", currentPrice: 52.3, change: +2.8,
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
    id: "SEC-B", name: "Beta Yield", ticker: "BETA", color: "#6C8EFF", currentPrice: 34.7, change: -1.2,
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
    id: "SEC-C", name: "Gamma Vol", ticker: "GAMMA", color: "#FF6C6C", currentPrice: 78.1, change: +5.4,
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
    id: "SEC-D", name: "Delta Spread", ticker: "DELTA", color: "#FFB84D", currentPrice: 21.5, change: +0.3,
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

// --- Sparkline ---
function SparkChart({ data, color, height = 52 }) {
  const w = 240;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const p = 3;
  const eH = height - p * 2;
  const eW = w - p * 2;
  const pts = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * eW;
    const y = p + eH - ((v - min) / range) * eH;
    return `${x},${y}`;
  });
  const area = [`${p},${height - p}`, ...pts, `${p + eW},${height - p}`].join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${color.replace("#","")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

// --- Compact Order Book ---
function OrderBook({ bids, asks }) {
  const maxQty = Math.max(...bids.map(b=>b.qty), ...asks.map(a=>a.qty));
  const Row = ({ items, isBid }) => (
    <div style={{ flex: 1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"1px 4px", color:"#4b5563", fontSize:"8px", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"1px" }}>
        {isBid ? <><span>Qty</span><span>Bid</span></> : <><span>Ask</span><span>Qty</span></>}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ position:"relative", display:"flex", justifyContent:"space-between", padding:"1px 4px", fontSize:"10px", fontFamily:"'JetBrains Mono',monospace", lineHeight:"1.5" }}>
          <div style={{ position:"absolute", [isBid?"right":"left"]:0, top:0, bottom:0, width:`${(item.qty/maxQty)*100}%`, background: isBid ? "rgba(0,229,160,0.06)" : "rgba(255,108,108,0.06)", borderRadius:"1px" }} />
          {isBid ? (
            <><span style={{color:"#6b7280",position:"relative"}}>{item.qty}</span><span style={{color:"#00E5A0",fontWeight:600,position:"relative"}}>{item.price.toFixed(1)}</span></>
          ) : (
            <><span style={{color:"#FF6C6C",fontWeight:600,position:"relative"}}>{item.price.toFixed(1)}</span><span style={{color:"#6b7280",position:"relative"}}>{item.qty}</span></>
          )}
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ display:"flex", gap:"2px" }}>
      <Row items={bids} isBid={true} />
      <div style={{ width:"1px", background:"#1a1f2e" }} />
      <Row items={asks} isBid={false} />
    </div>
  );
}

// --- Inline Order Entry (always visible) ---
function InlineOrderEntry({ security, onSubmit }) {
  const [side, setSide] = useState("BID");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [flash, setFlash] = useState(null);

  const handleOrder = () => {
    if (!price || !qty) return;
    setFlash(side);
    onSubmit({ ticker: security.ticker, side, price: parseFloat(price), qty: parseInt(qty) });
    setTimeout(() => { setFlash(null); setPrice(""); setQty(""); }, 600);
  };

  const isBid = side === "BID";
  const accent = isBid ? "#00E5A0" : "#FF6C6C";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "3px", padding: "5px 0 0 0",
      borderTop: "1px solid #131825",
    }}>
      <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", border: "1px solid #1a1f2e", flexShrink: 0 }}>
        {["BID", "ASK"].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: "4px 7px", border: "none", cursor: "pointer", fontSize: "8px", fontWeight: 700, letterSpacing: "0.3px",
            background: side === s ? (s === "BID" ? "rgba(0,229,160,0.15)" : "rgba(255,108,108,0.15)") : "#0a0d14",
            color: side === s ? (s === "BID" ? "#00E5A0" : "#FF6C6C") : "#4b5563",
            transition: "all 0.1s",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <span style={{ position: "absolute", left: "5px", top: "50%", transform: "translateY(-50%)", fontSize: "8px", color: "#3b4252" }}>$</span>
        <input
          type="number" step="0.1" placeholder="Price" value={price}
          onChange={e => setPrice(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleOrder()}
          style={{
            width: "100%", padding: "4px 5px 4px 14px", borderRadius: "3px",
            border: `1px solid ${flash ? accent + "60" : "#1a1f2e"}`, background: "#0a0d14",
            color: "#e5e7eb", fontSize: "10px", fontFamily: "'JetBrains Mono',monospace",
            outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
          }}
        />
      </div>

      <input
        type="number" placeholder="Qty" value={qty}
        onChange={e => setQty(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleOrder()}
        style={{
          width: "44px", padding: "4px 5px", borderRadius: "3px",
          border: `1px solid ${flash ? accent + "60" : "#1a1f2e"}`, background: "#0a0d14",
          color: "#e5e7eb", fontSize: "10px", fontFamily: "'JetBrains Mono',monospace",
          outline: "none", boxSizing: "border-box", flexShrink: 0, transition: "border-color 0.2s",
        }}
      />

      <button
        onClick={handleOrder}
        style={{
          padding: "4px 8px", borderRadius: "3px", border: "none", cursor: "pointer",
          fontSize: "8px", fontWeight: 800, letterSpacing: "0.3px", flexShrink: 0,
          background: flash ? accent : `${accent}18`,
          color: flash ? "#0a0d14" : accent,
          transition: "all 0.15s",
        }}
      >
        {flash ? "✓" : "ORDER"}
      </button>
    </div>
  );
}

// --- Security Quadrant ---
function SecurityQuadrant({ security, onOrder }) {
  const isPos = security.change >= 0;
  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px",
      position: "relative", overflow: "hidden", minHeight: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: security.color, boxShadow: `0 0 6px ${security.color}40` }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.3px" }}>{security.ticker}</span>
          <span style={{ fontSize: "9px", color: "#3b4252" }}>{security.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-0.5px" }}>
            {security.currentPrice.toFixed(1)}
          </span>
          <span style={{ fontSize: "9px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: isPos ? "#00E5A0" : "#FF6C6C" }}>
            {isPos ? "+" : ""}{security.change.toFixed(1)}
          </span>
        </div>
      </div>

      <SparkChart data={security.history} color={security.color} height={44} />

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <OrderBook bids={security.bids} asks={security.asks} />
      </div>

      <InlineOrderEntry security={security} onSubmit={onOrder} />
    </div>
  );
}

// --- Portfolio Panel ---
function PortfolioPanel({ positions }) {
  const cash = 48749.20;
  const posVal = positions.reduce((s, p) => s + p.qty * p.currentPrice * (p.side === "SELL" ? -1 : 1), 0);
  const uPnl = positions.reduce((s, p) => {
    const d = p.side === "BUY" ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
    return s + d * p.qty;
  }, 0);
  const total = cash + posVal;

  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: "2px",
      minHeight: 0, overflow: "hidden",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif" }}>
        Portfolio
      </div>

      {[
        { label: "Cash Balance", value: `$${cash.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "#e5e7eb" },
        { label: "Buying Power", value: `$${(cash*2).toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "#e5e7eb" },
      ].map((r,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
          <span style={{ fontSize:"10px", color:"#4b5563" }}>{r.label}</span>
          <span style={{ fontSize:"11px", fontWeight:700, color:r.color, fontFamily:"'JetBrains Mono',monospace" }}>{r.value}</span>
        </div>
      ))}

      <div style={{ height:"1px", background:"#131825", margin:"4px 0" }} />

      <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
        <span style={{ fontSize:"10px", color:"#4b5563" }}>Portfolio Value</span>
        <span style={{ fontSize:"11px", fontWeight:700, color:"#e5e7eb", fontFamily:"'JetBrains Mono',monospace" }}>${total.toLocaleString("en-US",{minimumFractionDigits:2})}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
        <span style={{ fontSize:"10px", color:"#4b5563" }}>Unrealized P&L</span>
        <span style={{ fontSize:"11px", fontWeight:700, color: uPnl >= 0 ? "#00E5A0" : "#FF6C6C", fontFamily:"'JetBrains Mono',monospace" }}>
          {uPnl >= 0 ? "+" : ""}${uPnl.toFixed(2)}
        </span>
      </div>

      <div style={{ height:"1px", background:"#131825", margin:"6px 0 4px 0" }} />
      <div style={{ fontSize:"9px", fontWeight:700, color:"#4b5563", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"4px" }}>Holdings</div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {positions.length === 0 ? (
          <div style={{ fontSize:"10px", color:"#3b4252", textAlign:"center", padding:"16px 0" }}>No positions</div>
        ) : positions.map((pos, i) => {
          const pnl = (pos.side === "BUY" ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice) * pos.qty;
          const pnlPct = (pos.side === "BUY" ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice) / pos.entryPrice * 100;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 8px", borderRadius: "6px", marginBottom: "3px",
              background: pnl >= 0 ? "rgba(0,229,160,0.03)" : "rgba(255,108,108,0.03)",
              border: `1px solid ${pnl >= 0 ? "rgba(0,229,160,0.06)" : "rgba(255,108,108,0.06)"}`,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{pos.ticker}</span>
                  <span style={{
                    fontSize: "7px", fontWeight: 700, padding: "1px 4px", borderRadius: "3px",
                    background: pos.side === "BUY" ? "rgba(0,229,160,0.1)" : "rgba(255,108,108,0.1)",
                    color: pos.side === "BUY" ? "#00E5A0" : "#FF6C6C",
                  }}>{pos.side === "BUY" ? "LONG" : "SHORT"}</span>
                </div>
                <div style={{ fontSize: "9px", color: "#4b5563", fontFamily: "'JetBrains Mono',monospace", marginTop: "1px" }}>
                  {pos.qty} @ {pos.entryPrice.toFixed(1)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: pnl >= 0 ? "#00E5A0" : "#FF6C6C" }}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}
                </div>
                <div style={{ fontSize: "8px", color: "#4b5563", fontFamily: "'JetBrains Mono',monospace" }}>
                  {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Open Orders Panel ---
function OpenOrdersPanel({ orders, onCancel }) {
  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px",
      minHeight: 0, overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
          Open Orders
        </span>
        <span style={{ fontSize: "9px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace" }}>
          {orders.length} active
        </span>
      </div>

      <div style={{ display: "flex", padding: "2px 6px", fontSize: "7px", color: "#3b4252", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
        <span style={{ flex: 1 }}>Asset</span>
        <span style={{ width: "32px", textAlign: "center" }}>Side</span>
        <span style={{ width: "44px", textAlign: "right" }}>Price</span>
        <span style={{ width: "50px", textAlign: "right" }}>Fill</span>
        <span style={{ width: "42px", textAlign: "center" }}>Status</span>
        <span style={{ width: "22px" }}></span>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {orders.length === 0 ? (
          <div style={{ fontSize: "10px", color: "#3b4252", textAlign: "center", padding: "20px 0" }}>No open orders</div>
        ) : orders.map((ord) => (
          <div key={ord.id} style={{
            display: "flex", alignItems: "center", padding: "6px",
            borderRadius: "5px", marginBottom: "2px",
            background: "#0a0d14", border: "1px solid #131825",
            fontSize: "10px", fontFamily: "'JetBrains Mono',monospace",
          }}>
            <span style={{ flex: 1, fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", fontSize: "10px" }}>{ord.ticker}</span>
            <span style={{ width: "32px", textAlign: "center", fontSize: "8px", fontWeight: 700, color: ord.side === "BUY" ? "#00E5A0" : "#FF6C6C" }}>{ord.side}</span>
            <span style={{ width: "44px", textAlign: "right", color: "#9ca3af" }}>{ord.price.toFixed(1)}</span>
            <span style={{ width: "50px", textAlign: "right", color: "#9ca3af" }}>
              {ord.filled > 0 ? `${ord.filled}/${ord.qty}` : `0/${ord.qty}`}
            </span>
            <span style={{ width: "42px", textAlign: "center", fontSize: "7px", fontWeight: 700, letterSpacing: "0.3px", color: ord.status === "PARTIAL" ? "#FFB84D" : "#6C8EFF" }}>{ord.status}</span>
            <button
              onClick={() => onCancel(ord.id)}
              style={{
                width: "16px", height: "16px", borderRadius: "3px", border: "1px solid #1a1f2e",
                background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: "9px",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "#FF6C6C40"; e.target.style.color = "#FF6C6C"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#1a1f2e"; e.target.style.color = "#4b5563"; }}
              title="Cancel order"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Leaderboard Slide Panel ---
function LeaderboardPanel({ onClose }) {
  const userRank = { rank: 42, name: "You", pnl: -1250.8, trades: 31 };
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "350px", background: "#0a0d14",
      borderLeft: "1px solid #151a27", zIndex: 100, display: "flex", flexDirection: "column",
      animation: "slideIn 0.2s ease-out", boxShadow: "-16px 0 50px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #151a27" }}>
        <span style={{ fontSize: "14px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>🏆 Leaderboard</span>
        <button onClick={onClose} style={{ background: "#151a27", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "6px 8px" }}>
        {LEADERBOARD.map(e => (
          <div key={e.rank} style={{
            display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: "5px", marginBottom: "1px",
            background: e.rank <= 3 ? "rgba(255,184,77,0.03)" : "transparent",
          }}>
            <div style={{
              width: "22px", height: "22px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9px", fontWeight: 800, marginRight: "8px", fontFamily: "'JetBrains Mono',monospace",
              background: e.rank === 1 ? "rgba(255,215,0,0.12)" : e.rank === 2 ? "rgba(192,192,192,0.08)" : e.rank === 3 ? "rgba(205,127,50,0.08)" : "#0f1219",
              color: e.rank === 1 ? "#FFD700" : e.rank === 2 ? "#C0C0C0" : e.rank === 3 ? "#CD7F32" : "#4b5563",
            }}>{e.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{e.name}</div>
              <div style={{ fontSize: "7px", color: "#3b4252" }}>{e.trades} trades</div>
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: e.pnl >= 0 ? "#00E5A0" : "#FF6C6C" }}>
              {e.pnl >= 0 ? "+" : ""}{e.pnl.toLocaleString("en-US",{minimumFractionDigits:1})}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", padding: "0 8px" }}>
          <div style={{ flex: 1, height: "1px", background: "#1a1f2e" }} />
          <span style={{ fontSize: "7px", color: "#3b4252", letterSpacing: "1px" }}>YOU</span>
          <div style={{ flex: 1, height: "1px", background: "#1a1f2e" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "8px", borderRadius: "6px", background: "rgba(108,142,255,0.05)", border: "1px solid rgba(108,142,255,0.1)" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, marginRight: "8px", fontFamily: "'JetBrains Mono',monospace", background: "rgba(108,142,255,0.08)", color: "#6C8EFF" }}>{userRank.rank}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#6C8EFF", fontFamily: "'Space Grotesk',sans-serif" }}>{userRank.name}</div>
            <div style={{ fontSize: "7px", color: "#3b4252" }}>{userRank.trades} trades</div>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#FF6C6C" }}>{userRank.pnl.toLocaleString("en-US",{minimumFractionDigits:1})}</div>
        </div>
      </div>
    </div>
  );
}

// --- Inbox Panel ---
function InboxPanel({ messages, onClose, onMarkRead }) {
  const unread = messages.filter(m => !m.read).length;
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "370px", background: "#0a0d14",
      borderLeft: "1px solid #151a27", zIndex: 100, display: "flex", flexDirection: "column",
      animation: "slideIn 0.2s ease-out", boxShadow: "-16px 0 50px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #151a27" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>📨 Inbox</span>
          {unread > 0 && <span style={{ background: "#FF6C6C", color: "#0a0d14", fontSize: "8px", fontWeight: 800, padding: "1px 5px", borderRadius: "6px", fontFamily: "'JetBrains Mono',monospace" }}>{unread}</span>}
        </div>
        <button onClick={onClose} style={{ background: "#151a27", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 10px" }}>
        {messages.map(msg => (
          <div key={msg.id} onClick={() => onMarkRead(msg.id)} style={{
            padding: "11px 13px", borderRadius: "7px", marginBottom: "4px", cursor: "pointer",
            background: msg.read ? "transparent" : "rgba(108,142,255,0.03)",
            border: msg.read ? "1px solid #131825" : "1px solid rgba(108,142,255,0.1)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {!msg.read && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6C8EFF" }} />}
                <span style={{ fontSize: "11px", fontWeight: 700, color: msg.read ? "#6b7280" : "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{msg.title}</span>
              </div>
              <span style={{ fontSize: "8px", color: "#3b4252", fontFamily: "'JetBrains Mono',monospace" }}>{msg.time}</span>
            </div>
            <div style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.5, paddingLeft: msg.read ? 0 : "11px" }}>{msg.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState("01:23:47");
  const [positions] = useState(MOCK_POSITIONS);
  const [openOrders, setOpenOrders] = useState(MOCK_OPEN_ORDERS);

  useEffect(() => {
    let s = 1*3600+23*60+47;
    const iv = setInterval(() => {
      s = Math.max(0, s - 1);
      setClock(`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const m = { id: 3, title: "⚡ Volatility Alert: GAMMA", body: "GAMMA Vol surged past resistance. Large block orders on ask side.", time: "10:32 AM", read: false };
      setMessages(prev => [m, ...prev]);
      setToast(m);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  const markRead = id => setMessages(prev => prev.map(m => m.id === id ? {...m, read:true} : m));
  const cancelOrder = id => setOpenOrders(prev => prev.filter(o => o.id !== id));
  const handleOrder = (order) => {
    const newOrd = { id: `ORD-${Date.now()}`, ticker: order.ticker, side: order.side === "BID" ? "BUY" : "SELL", type: "LIMIT", price: order.price, qty: order.qty, filled: 0, status: "OPEN" };
    setOpenOrders(prev => [newOrd, ...prev]);
  };

  const unreadCount = messages.filter(m => !m.read).length;
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
        </div>
      </div>

      {/* 3x2 Grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "5px", padding: "5px", minHeight: 0,
      }}>
        <SecurityQuadrant security={SECURITIES[0]} onOrder={handleOrder} />
        <SecurityQuadrant security={SECURITIES[1]} onOrder={handleOrder} />
        <PortfolioPanel positions={positions} />
        <SecurityQuadrant security={SECURITIES[2]} onOrder={handleOrder} />
        <SecurityQuadrant security={SECURITIES[3]} onOrder={handleOrder} />
        <OpenOrdersPanel orders={openOrders} onCancel={cancelOrder} />
      </div>

      {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />}
      {showInbox && <InboxPanel messages={messages} onClose={() => setShowInbox(false)} onMarkRead={markRead} />}
    </div>
  );
}