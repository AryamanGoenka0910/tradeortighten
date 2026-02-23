export default function OpenOrdersPanel({ orders, onCancel }) {
  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px",
      minHeight: 0, overflow: "hidden", width: "100%",
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
              onMouseEnter={(e) => { e.target.style.borderColor = "#FF6C6C40"; e.target.style.color = "#FF6C6C"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "#1a1f2e"; e.target.style.color = "#4b5563"; }}
              title="Cancel order"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
