import { useState } from "react";

function SparkChart({ data, color, height }) {
  const w = 200;
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
        <linearGradient id={`g-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${color.replace("#", "")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

function OrderBook({ bids, asks }) {
  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));
  const Row = ({ items, isBid }) => (
    <div style={{ flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "1px 4px", color: "#4b5563", fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "1px" }}>
        <span>{isBid ? "Bid" : "Ask"}</span>
        <span style={{ textAlign: "right" }}>Qty</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "1px 4px", fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", lineHeight: "1.5" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(item.qty / maxQty) * 100}%`, background: isBid ? "rgba(0,229,160,0.06)" : "rgba(255,108,108,0.06)", borderRadius: "1px" }} />
          <span style={{ color: isBid ? "#00E5A0" : "#FF6C6C", fontWeight: 600, position: "relative" }}>{item.price.toFixed(1)}</span>
          <span style={{ color: "#6b7280", position: "relative", textAlign: "right" }}>{item.qty}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <Row items={asks} isBid={false} />
      <div style={{ height: "1px", background: "#1a1f2e" }} />
      <Row items={bids} isBid={true} />
    </div>
  );
}

function InlineOrderEntry({ security, onSubmit }) {
  const [side, setSide] = useState("BID");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [flash, setFlash] = useState(null);

  const handleOrder = () => {
    if (!price || !qty) return;
    setFlash(side);
    onSubmit({ ticker: security.ticker, side, price: parseFloat(price), qty: parseInt(qty, 10) });
    setTimeout(() => { setFlash(null); setPrice(""); setQty(""); }, 600);
  };

  const isBid = side === "BID";
  const accent = isBid ? "#00E5A0" : "#FF6C6C";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px", padding: "10px 0 0 0",
      borderTop: "1px solid #131825",
      minHeight: "56px",
    }}>
      <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", border: "1px solid #1a1f2e", flexShrink: 0 }}>
        {["BID", "ASK"].map((s) => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: "12px 15px", border: "none", cursor: "pointer", fontSize: "9px", fontWeight: 700, letterSpacing: "0.3px",
            background: side === s ? (s === "BID" ? "rgba(0,229,160,0.15)" : "rgba(255,108,108,0.15)") : "#0a0d14",
            color: side === s ? (s === "BID" ? "#00E5A0" : "#FF6C6C") : "#4b5563",
            transition: "all 0.1s",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <span style={{ position: "absolute", left: "7px", top: "50%", transform: "translateY(-50%)", fontSize: "9px", color: "#3b4252" }}>$</span>
        <input
          type="number" step="0.1" placeholder="Price" value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOrder()}
          style={{
            width: "100%", padding: "12px 7px 12px 18px", borderRadius: "4px",
            border: `1px solid ${flash ? `${accent}60` : "#1a1f2e"}`, background: "#0a0d14",
            color: "#e5e7eb", fontSize: "11px", fontFamily: "'JetBrains Mono',monospace",
            outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
          }}
        />
      </div>

      <input
        type="number" placeholder="Qty" value={qty}
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleOrder()}
        style={{
          width: "85px", padding: "12px 7px", borderRadius: "4px",
          border: `1px solid ${flash ? `${accent}60` : "#1a1f2e"}`, background: "#0a0d14",
          color: "#e5e7eb", fontSize: "11px", fontFamily: "'JetBrains Mono',monospace",
          outline: "none", boxSizing: "border-box", flexShrink: 0, transition: "border-color 0.2s",
        }}
      />

      <button
        onClick={handleOrder}
        style={{
          padding: "12px 12px", borderRadius: "4px", border: "none", cursor: "pointer",
          fontSize: "9px", fontWeight: 800, letterSpacing: "0.3px", flexShrink: 0,
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

export default function SecurityQuadrant({ security, onOrder }) {
  const isPos = security.change >= 0;

  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px",
      position: "relative", overflow: "hidden", minHeight: 0,
      width: "100%", justifySelf: "stretch",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: security.color, boxShadow: `0 0 6px ${security.color}40` }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.3px" }}>{security.ticker}</span>
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

      <SparkChart data={security.history} color={security.color} height={74} />

      <div style={{ minHeight: 0, overflow: "auto" }}>
        <OrderBook bids={security.bids} asks={security.asks} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <InlineOrderEntry security={security} onSubmit={onOrder} />
      </div>
    </div>
  );
}
