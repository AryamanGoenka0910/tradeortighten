export default function PortfolioPanel({ portfolio, orders }) {
  // console.log(portfolio);
  const cash = Number(portfolio?.cashAvailable ?? 0);
  const cashReserved = Number(portfolio?.cashReserved ?? 0);

  const securities = {
    "CASH": {
      ticker: "CASH",
      qty: Math.max(0, cash),
      reserved: cashReserved,
      price: 1,
      isCash: true,
    },
    "ALPHA": {
      ticker: "ALPHA",
      qty: portfolio?.asset1Available ?? 0,
      reserved: portfolio?.asset1Reserved ?? 0,
      price: 100,
      isCash: false,
    },
    "BETA": {
      ticker: "BETA",
      qty: portfolio?.asset2Available ?? 0,
      reserved: portfolio?.asset2Reserved ?? 0,
      price: 100,
      isCash: false,
    },
    "GAMMA": {
      ticker: "GAMMA",
      qty: portfolio?.asset3Available ?? 0,
      reserved: portfolio?.asset3Reserved ?? 0,
      price: 100,
      isCash: false,
    },
    "DELTA": {
      ticker: "DELTA",
      qty: portfolio?.asset4Available ?? 0,
      reserved: portfolio?.asset4Reserved ?? 0,
      price: 100,
      isCash: false,
    },
  }

  for (const order of orders) {
    if (order.side === "BUY") {
      securities["CASH"].reservedValue += order.qty * order.price;
      securities["CASH"].reservedPrice += order.qty * order.price;
    } else {
      securities["ALPHA"].reservedValue += order.qty * order.price;
      securities["ALPHA"].reservedPrice += order.qty;
    }
  }

  const portfolioValue = Object.values(securities).map((s) => (s.price * s.qty)).reduce((a, b) => a + b, 0);
  const uPnl = (200000 - portfolioValue);


  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: "2px",
      minHeight: 0, overflow: "hidden", width: "100%",
    }}>
      <div style={{ fontSize: "16px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "2px", fontFamily: "'Space Grotesk',sans-serif" }}>
        Portfolio
      </div>

      <div style={{ height: "1px", background: "#131825", margin: "4px 0", fontSize: "14px"}} />

      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "14px" }}>
        <span style={{ color: "#4b5563" }}>Portfolio Value</span>
        <span style={{ fontWeight: 700, color: "#e5e7eb", fontFamily: "'JetBrains Mono',monospace" }}>${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "14px" }}>
        <span style={{ color: "#4b5563" }}>Unrealized P&L</span>
        <span style={{ fontWeight: 700, color: uPnl >= 0 ? "#00E5A0" : "#FF6C6C", fontFamily: "'JetBrains Mono',monospace" }}>
          {uPnl >= 0 ? "+" : ""}${uPnl.toFixed(2)}
        </span>
      </div>

      <div style={{ height: "1px", background: "#131825", margin: "6px 0 4px 0" }} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 64px 86px 86px",
            columnGap: "6px",
            padding: "2px 6px",
            fontSize: "14px",
            color: "#3b4252",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span>Asset</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span style={{ textAlign: "right" }}>Buy Pwr</span>
          <span style={{ textAlign: "right" }}>Cash Val</span>
        </div>

        {Object.values(securities).map((row, i) => (  
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 64px 86px 86px",
              columnGap: "6px",
              alignItems: "center",
              padding: "6px",
              borderRadius: "5px",
              marginBottom: "2px",
              background: "#0a0d14",
              border: "1px solid #131825",
              fontSize: "14px",
              fontFamily: "'JetBrains Mono',monospace",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif" }}>{row.ticker}</span>
            <span style={{ textAlign: "right", color: row.isCash ? "#6C8EFF" : "#9ca3af", fontWeight: 700 }}>{row.isCash ? "$" : ""}{row.qty.toFixed(0)}</span>
            <span style={{ textAlign: "right", color: row.isCash ? "#6C8EFF" : "#9ca3af" }}>{row.isCash ? "$" : ""}{(row.qty - row.reserved).toFixed(0)}</span>
            <span style={{ textAlign: "right", color: "#9ca3af" }}>${(row.price * row.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
