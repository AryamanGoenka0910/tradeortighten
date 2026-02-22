# TradingCompetitionUI (frontend/ui.jsx) Integration Guide

This file describes how to replace the hardcoded mock data in `frontend/ui.jsx` with live backend + WebSocket data for the MIG Quant Competition UI.

The UI is already wired visually. Your job is to replace:
- `SECURITIES`
- `LEADERBOARD`
- `INITIAL_MESSAGES`
- `MOCK_POSITIONS`
- `MOCK_OPEN_ORDERS`
- The timer + message demo `useEffect` blocks
- `handleOrder` and `cancelOrder`

with live state fed by your backend.

**Quick Map (What Uses What)**
- `SecurityQuadrant` needs a `security` object with book + last price.
- `OrderBook` needs `bids` + `asks` arrays of `{ price, qty }`.
- `PortfolioPanel` needs `positions`.
- `OpenOrdersPanel` needs `orders`.
- `LeaderboardPanel` needs `LEADERBOARD` and `userRank`.
- `InboxPanel` needs `messages`.
- The header clock currently counts down locally.

**Data Models (Match These Shapes)**
Use these exact shapes to avoid UI breakage.

Securities (each entry shown in a quadrant):
- `id`: string (stable key, ex: "SEC-A")
- `name`: string
- `ticker`: string (ex: "ALPHA")
- `color`: string (hex, used for accents)
- `currentPrice`: number
- `change`: number (delta vs. prev close or session open)
- `history`: number[] (sparkline points; newest last)
- `bids`: `{ price: number, qty: number }[]` (sorted high -> low)
- `asks`: `{ price: number, qty: number }[]` (sorted low -> high)

Positions:
- `ticker`: string
- `side`: "BUY" | "SELL" (SELL renders as short)
- `qty`: number
- `entryPrice`: number
- `currentPrice`: number

Open Orders:
- `id`: string (stable key)
- `ticker`: string
- `side`: "BUY" | "SELL"
- `type`: "LIMIT" | "MARKET" (UI just displays it)
- `price`: number
- `qty`: number
- `filled`: number
- `status`: "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED"

Leaderboard:
- `rank`: number
- `name`: string
- `pnl`: number
- `trades`: number

Messages:
- `id`: number or string (stable key)
- `title`: string
- `body`: string
- `time`: string (displayed as-is)
- `read`: boolean

**Recommended WebSocket Event Types**
This UI does not require a specific protocol, but the following event types map cleanly to the state it needs.

- `book_snapshot`: one-time snapshot for a ticker
- `book_update`: incremental updates for a ticker
- `trade`: last trade price update for a ticker
- `positions`: full position list
- `orders`: full open order list
- `order_update`: single order update
- `leaderboard`: full leaderboard list
- `inbox`: new message
- `clock`: server time or remaining session time
- `system`: status messages

Example payloads (adapt to your backend):

```json
{ "type": "book_snapshot", "ticker": "ALPHA", "bids": [[52.0,120],[51.8,85]], "asks": [[52.5,95],[52.8,140]] }
```

```json
{ "type": "trade", "ticker": "ALPHA", "price": 52.3, "change": 2.8 }
```

```json
{ "type": "positions", "positions": [{"ticker":"ALPHA","side":"BUY","qty":25,"entryPrice":50.2,"currentPrice":52.3}] }
```

```json
{ "type": "order_update", "order": {"id":"ORD-001","ticker":"BETA","side":"BUY","type":"LIMIT","price":33.5,"qty":50,"filled":12,"status":"PARTIAL"} }
```

```json
{ "type": "leaderboard", "rows": [{"rank":1,"name":"QuantWolf","pnl":12450.2,"trades":87}] }
```

**Wiring Steps**
1. Convert constant mock data to state.
   - Replace `SECURITIES` with `const [securities, setSecurities] = useState([]);`
   - Replace `MOCK_POSITIONS` and `MOCK_OPEN_ORDERS` with state and setters.
   - Replace `LEADERBOARD` and `INITIAL_MESSAGES` with state if you want live updates.

2. Remove the demo effects.
   - Delete or disable the countdown `useEffect` (the one that decrements `clock`).
   - Delete or disable the fake message `useEffect` that injects a message after 8 seconds.

3. Add a WebSocket (or SSE) connection.
   - Keep it inside `TradingCompetitionUI` or extract a hook (recommended).
   - On connect, request initial snapshots for each ticker and user data.

4. Update UI state on each message.
   - Update only the relevant portion to keep renders smooth.
   - Keep `history` length bounded (ex: last 16 points for the sparkline).

5. Send orders and cancellations to backend.
   - Replace `handleOrder` and `cancelOrder` with WebSocket or REST calls.
   - Optionally do optimistic UI updates, then reconcile with server updates.

**Minimal Hook Skeleton**
This is a starting point that matches the state the UI needs. Adjust to your backend.

```jsx
// inside TradingCompetitionUI
const [securities, setSecurities] = useState([]);
const [positions, setPositions] = useState([]);
const [openOrders, setOpenOrders] = useState([]);
const [leaderboard, setLeaderboard] = useState([]);
const [messages, setMessages] = useState([]);
const [clock, setClock] = useState("00:00:00");

useEffect(() => {
  const ws = new WebSocket("ws://<host>/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "subscribe", tickers: ["ALPHA","BETA","GAMMA","DELTA"] }));
    ws.send(JSON.stringify({ type: "get_positions" }));
    ws.send(JSON.stringify({ type: "get_orders" }));
    ws.send(JSON.stringify({ type: "get_leaderboard" }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
      case "book_snapshot":
      case "book_update": {
        setSecurities(prev => updateBook(prev, msg));
        break;
      }
      case "trade": {
        setSecurities(prev => updateLastTrade(prev, msg));
        break;
      }
      case "positions": {
        setPositions(msg.positions);
        break;
      }
      case "orders": {
        setOpenOrders(msg.orders);
        break;
      }
      case "order_update": {
        setOpenOrders(prev => applyOrderUpdate(prev, msg.order));
        break;
      }
      case "leaderboard": {
        setLeaderboard(msg.rows);
        break;
      }
      case "inbox": {
        setMessages(prev => [{ ...msg.message, read: false }, ...prev]);
        break;
      }
      case "clock": {
        setClock(msg.clock);
        break;
      }
      default:
        break;
    }
  };

  ws.onclose = () => {
    // optional: backoff + reconnect
  };

  return () => ws.close();
}, []);
```

**Where to Plug State Into the Render**
- Replace `SECURITIES[0..3]` with `securities[0..3]`.
- Replace `LEADERBOARD` usage with `leaderboard` state.
- Replace `positions` and `openOrders` with state variables.
- Replace `messages` state init with live data.

**Order Submission**
`InlineOrderEntry` sends `{ ticker, side, price, qty }` into `handleOrder`.

Replace `handleOrder` with a backend call:

```jsx
const handleOrder = (order) => {
  ws.send(JSON.stringify({
    type: "place_order",
    ticker: order.ticker,
    side: order.side === "BID" ? "BUY" : "SELL",
    price: order.price,
    qty: order.qty,
  }));
};
```

And replace `cancelOrder` similarly:

```jsx
const cancelOrder = (id) => {
  ws.send(JSON.stringify({ type: "cancel_order", id }));
};
```

**Notes / Pitfalls**
- Keep `bids` and `asks` sorted or the book display will look wrong.
- `history` should be a short rolling window (ex: 16 points).
- `change` should match `currentPrice` or the header color will be incorrect.
- `id` keys should be stable across updates to avoid React remounts.

If you want, I can implement the actual WebSocket wiring inside `frontend/ui.jsx` once you share the backend event schema.
