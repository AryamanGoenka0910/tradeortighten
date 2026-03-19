"use client";

function LeaderboardRow({ entry }) {
  const pnl = entry.pnl ?? 0;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "7px 8px",
        borderRadius: "5px", marginBottom: "2px",
        background: entry.rank <= 3 ? "rgba(255,184,77,0.03)" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = entry.rank <= 3 ? "rgba(255,184,77,0.03)" : "transparent"; }}
    >
      <div style={{
        width: "26px", height: "26px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 800, marginRight: "10px", fontFamily: "'JetBrains Mono',monospace",
        background: entry.rank === 1 ? "rgba(255,215,0,0.12)" : entry.rank === 2 ? "rgba(192,192,192,0.08)" : entry.rank === 3 ? "rgba(205,127,50,0.08)" : "#0f1219",
        color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#4b5563",
      }}>{entry.rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#e5e7eb", fontFamily: "'Space Grotesk',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.clientName}
        </div>
      </div>
      <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: pnl >= 0 ? "#00E5A0" : "#FF6C6C" }}>
        {pnl >= 0 ? "+" : ""}{pnl.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

export default function LeaderboardPanel({ leaderboard }) {
  return (
    <div style={{
      background: "#0c0f17", border: "1px solid #131825", borderRadius: "10px",
      display: "flex", flexDirection: "column", minHeight: 0, height: "100%",
      overflow: "hidden", width: "100%",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #151a27" }}>
        <span style={{
          fontSize: "13px", fontWeight: 800, color: "#6b7280",
          letterSpacing: "0.8px", textTransform: "uppercase",
          fontFamily: "'Space Grotesk',sans-serif",
        }}>
          Leaderboard
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: "flex", alignItems: "center", padding: "4px 8px",
        fontSize: "10px", color: "#3b4252", letterSpacing: "0.5px",
        textTransform: "uppercase", fontWeight: 600,
      }}>
        <div style={{ width: "36px" }}>#</div>
        <div style={{ flex: 1 }}>Team</div>
        <div>P&L</div>
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 8px" }}>
        {leaderboard.length === 0 ? (
          <div style={{ color: "#3b4252", textAlign: "center", padding: "24px 0", fontSize: "12px" }}>
            Waiting for data…
          </div>
        ) : leaderboard.map((e) => (
          <LeaderboardRow key={e.rank} entry={e} />
        ))}
      </div>
    </div>
  );
}
