export default function InboxPanel({ messages, onClose, onMarkRead }) {
  const unread = messages.filter((m) => !m.read).length;

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
        {messages.map((msg) => (
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
