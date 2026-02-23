export default function LeaderboardPanel({ onClose, leaderboard }) {
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
        {leaderboard.map((e) => (
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
              {e.pnl >= 0 ? "+" : ""}{e.pnl.toLocaleString("en-US", { minimumFractionDigits: 1 })}
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
          <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#FF6C6C" }}>{userRank.pnl.toLocaleString("en-US", { minimumFractionDigits: 1 })}</div>
        </div>
      </div>
    </div>
  );
}
