export default function PortfolioPanel({ positions }) {
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
      minHeight: 0, overflow: "hidden", width: "100%",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif" }}>
        Portfolio
      </div>

      {[
        { label: "Cash Balance", value: `$${cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#e5e7eb" },
        { label: "Buying Power", value: `$${(cash * 2).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#e5e7eb" },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
          <span style={{ fontSize: "10px", color: "#4b5563" }}>{r.label}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: r.color, fontFamily: "'JetBrains Mono',monospace" }}>{r.value}</span>
        </div>
      ))}

      <div style={{ height: "1px", background: "#131825", margin: "4px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
        <span style={{ fontSize: "10px", color: "#4b5563" }}>Portfolio Value</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'JetBrains Mono',monospace" }}>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
        <span style={{ fontSize: "10px", color: "#4b5563" }}>Unrealized P&L</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: uPnl >= 0 ? "#00E5A0" : "#FF6C6C", fontFamily: "'JetBrains Mono',monospace" }}>
          {uPnl >= 0 ? "+" : ""}${uPnl.toFixed(2)}
        </span>
      </div>

      <div style={{ height: "1px", background: "#131825", margin: "6px 0 4px 0" }} />
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>Holdings</div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {positions.length === 0 ? (
          <div style={{ fontSize: "10px", color: "#3b4252", textAlign: "center", padding: "16px 0" }}>No positions</div>
        ) : positions.map((pos, i) => {
          const pnl = (pos.side === "BUY" ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice) * pos.qty;
          const pnlPct = ((pos.side === "BUY" ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice) / pos.entryPrice) * 100;
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
