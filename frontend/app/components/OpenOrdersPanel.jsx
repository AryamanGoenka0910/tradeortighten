function OrdersTable({ title, rows, sideColor }) {
  return (
    <div style={{ width: "100%", minHeight: 0, fontSize: "13px", fontFamily: "'Space Grotesk',sans-serif" }}>
      <div style={{ fontWeight: 700, color: sideColor, marginBottom: "4px"}}>
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 84px 110px 72px 92px",
          columnGap: "8px",
          alignItems: "center",
          padding: "2px 6px",
          marginBottom: "4px",
          color: "#3b4252",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 600,
        }}
      >
        <span>Asset</span>
        <span style={{ textAlign: "right" }}>Price</span>
        <span style={{ textAlign: "right" }}>Remaining</span>
        <span style={{ textAlign: "right" }}>Qty</span>
        <span style={{ textAlign: "center" }}>Status</span>
      </div>

      <div style={{ maxHeight: "140px", overflowY: "auto", minHeight: 0 }}>
          {rows.length === 0 ? (
            <div style={{  color: "#3b4252", textAlign: "center", padding: "20px 0" }}>No open orders</div>
          ) : rows.map((ord) => (
            <div key={ord.id} style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 84px 110px 72px 92px",
              columnGap: "8px",
              alignItems: "center",
              padding: "6px 6px",
              borderRadius: "5px", marginBottom: "2px",
              background: "#0a0d14", border: "1px solid #131825",
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              <span style={{ minWidth: "50px", textAlign: "left", fontWeight: 700, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ord.ticker}</span>
              <span style={{ textAlign: "right", color: "#9ca3af" }}>{ord.price.toFixed(1)}</span>
              <span style={{ textAlign: "right", fontWeight: 700, color: "#9ca3af" }}>{ord.remainingQty}</span>
              <span style={{ textAlign: "right", fontWeight: 700, color: "#9ca3af" }}>{ord.qty}</span>
              <span style={{ textAlign: "center", fontWeight: 700, letterSpacing: "0.3px", color: ord.status === "PARTIAL" ? "#FFB84D" : "#6C8EFF" }}>{ord.status}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function OpenOrdersPanel({ orders, onCancel }) {
  return (
    <div 
      style={{
        background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
        padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px",
        minHeight: 0, height: "100%", flex: 1, overflow: "hidden", width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "16px", fontWeight: 800, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
          Open Orders
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: 0 }}>
        <OrdersTable title="Buy Orders" rows={orders.filter((ord) => ord.side === "BUY")} sideColor="#00E5A0" />
        <OrdersTable title="Sell Orders" rows={orders.filter((ord) => ord.side === "SELL")} sideColor="#FF6C6C" />
      </div>
    </div>
  );
}