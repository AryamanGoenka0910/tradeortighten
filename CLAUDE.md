# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time trading competition platform ("Trade or Tighten") for the MIG Quant Conference. Players trade four securities via WebSocket connections, with order matching handled by a C++ order book engine and portfolio accounting managed in PostgreSQL through atomic database procedures.

**Tech Stack:**
- **Frontend:** Next.js 16 (React 19) + TypeScript + TailwindCSS
- **Backend:** Node.js (TypeScript, ES modules) with WebSocket server
- **Order Engine:** C++ standalone process (stdio JSON protocol)
- **Database:** PostgreSQL (Supabase) with stored procedures for atomic portfolio updates
- **Auth:** Supabase Auth

## Repository Structure

```
tradeortighten/
├── frontend/          # Next.js app
│   ├── app/           # App router pages & components
│   │   ├── components/         # UI components (SecurityQuadrant, PortfolioPanel, etc.)
│   │   ├── TradingCompetitionUI.jsx  # Main trading UI
│   │   └── trade/page.tsx     # Trading page
│   └── lib/           # Client utilities (supabaseClient)
├── backend/           # Node.js WebSocket server
│   └── src/
│       ├── server.ts              # Main WS entry point
│       ├── db.ts                  # Postgres connection pool
│       ├── handlers/              # Message handlers (place, cancel, initial_load)
│       ├── order_book_engine/     # C++ bridge (EngineBridge, engine_types)
│       ├── lib/                   # connection_manager, order_utils
│       └── client_logic/
│           ├── client_types.ts    # TypeScript domain types
│           ├── supabase.ts        # Supabase client
│           └── migrations/        # SQL schema + stored procedures
└── OrderBook/         # C++ matching engine
    ├── src/           # order_book.cpp, price_level.cpp, main.cpp
    ├── tests/         # order_book_tests.cpp
    └── build/         # CMake build output
```

## Commands

### Backend (WebSocket Server)
```bash
cd backend
node --loader ts-node/esm src/server.ts
```
Server runs on `ws://localhost:8080`.

### Frontend (Next.js)
```bash
cd frontend
npm run dev      # Dev server (http://localhost:3000)
npm run build    # Production build
npm start        # Serve production build
npm run lint     # Run ESLint
```

### OrderBook (C++ Engine)
```bash
cd OrderBook
cmake -S . -B build
cmake --build build -j
./build/OrderBook       # Run engine (stdio mode)
./build/OrderBookTests  # Run tests
ctest --test-dir build --output-on-failure  # Run tests via ctest
```

**Prerequisites:** CMake ≥3.20, C++20 compiler, `nlohmann_json` (via vcpkg or system package manager)

## Architecture

### Message Flow: Client → WS Server → Engine → DB → Broadcast

1. **Client sends place order** (via WebSocket):
   ```json
   {
     "clientId": "uuid",
     "type": "place",
     "seq": 123,
     "clientOrderId": "my-order-1",
     "side": "buy",
     "price": 100,
     "qty": 50
   }
   ```

2. **Backend (`place_handler.ts`):**
   - Calls `place_taker_order(...)` DB function → reserves cash/positions
   - Submits to C++ engine via `EngineBridge.request(...)` (stdio JSON)
   - Engine returns: `{ orderId, trades: [...], all_bids, all_asks, execution_status }`
   - If rejected: calls `reject_order(...)` to release reservations
   - If filled/partial: calls `update_taker_order(...)` + `update_maker_order(...)` for each counterparty
   - Broadcasts updated order book to all connected clients

3. **C++ Engine (`OrderBook/`):**
   - Reads JSON requests from stdin: `{ reqId, op: "place"|"cancel", clientId, side, price, qty }`
   - Writes JSON responses to stdout: `{ reqId, orderId, trades: [...], all_bids, all_asks }`
   - Uses price-time priority matching (buy/sell price levels in maps)
   - No persistence—state lives in memory; Node.js owns truth in Postgres

4. **Database Workflow (migrations in `client_logic/migrations/`):**
   - **001_init.sql:** Schema (`clients`, `client_cash`, `client_positions`, `client_orders`) + indexes
   - **002_place_taker_order_fn.sql:** Validates seq, self-match check, reserves funds, inserts pending order
   - **003_update_taker_order_fn.sql:** Settles taker deltas after engine response
   - **004_update_maker_order_fn.sql:** Settles maker deltas when crossed by taker
   - **005_initial_load_fns.sql:** `ensure_client_and_portfolio`, `get_client_open_orders`
   - **006_close_order_fn.sql:** `cancel_order` (release reservations)
   - **007_leaderboard_fn.sql:** `get_leaderboard_data()` — raw portfolio data, ranked in Node.js

### Key Invariants
- **Idempotency:** `(client_id, client_order_id)` is UNIQUE; `seq = last_seq + 1` or retry of `last_seq` with exact payload match
- **Atomicity:** All cash/position updates happen in DB transactions via stored procedures
- **Self-Matching:** Prevented in `place_taker_order` (002) — rejects if client has a resting order on the opposite side at a crossing price
- **Cancel Order:** Engine cancel runs first, then DB cancel — prevents race where a new taker matches a DB-cancelled order still resting in the engine
- **Cash Reservation:** Reserved at limit price; unreserved at limit price on fill/cancel. Price improvement flows to free cash
- **Order State:** `pending` (resting) → `partially_filled` → `filled` | `cancelled`
- **Maker Updates:** Run in parallel via `Promise.all` — all counterparties settled concurrently

### WebSocket Message Types
**Inbound (client → server):**
- `place`, `cancel`, `initial_load`

**Outbound (server → client):**
- `order_update_snapshot` (order + portfolio state)
- `place_rejected`, `place_duplicate_ignored`, `cancel_rejected`, `cancel_accepted`
- `order_book_update` (broadcast to all: bids, asks, midPrice, seq)
- `leaderboard_update` (broadcast every 1s)
- `price_history_update` (broadcast every 10s, capped at 100 entries per asset)

## Database Connection
Requires `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL=postgres://user:pass@host:5432/db
```

## Known Limitations (Accepted for Competition Scope)
- **Phantom price levels in C++ engine:** Cancelled orders set qty=0 in `order_map` but are not erased; IDs remain in price level deques and are skipped during matching. Negligible for a short competition session.
- **Engine crash = game over:** No restart logic in `EngineBridge`. If the C++ process exits, all subsequent requests fail. Acceptable — a crashed engine means the competition ends.
- **Ghost order book flash (~few ms):** Between engine cancel completing and the clean book broadcast reaching clients, a concurrent place response could briefly show the cancelled order. Self-corrects immediately.
- **Stale pending on in-flight duplicate:** If a client sends the same seq twice while the first is in-flight, the duplicate response shows `pending`. Overwritten by the real `order_update_snapshot` within milliseconds.
- **Maker update DB failure:** If `update_maker_order` throws for a counterparty, the taker's portfolio is already settled and the error is logged. The maker's fill is lost. Only possible if Postgres crashes mid-flight — if that happens the game is over anyway.
- **Taker update DB failure:** If `update_taker_order` throws, the engine already matched the order but the DB is not updated. Only possible on Postgres crash — game over.

## Testing & Validation
- **Backend:** No formal test suite yet (manual testing via WS client or UI)
- **OrderBook:** `./build/OrderBookTests` covers core matching logic
- **Migrations:** Manual testing outlined in `migrations_outline.md` (place → reject, place → cancel, place → fill)

## Development Notes
- **TypeScript:** Backend uses ES modules (`"type": "module"` in package.json); run with `--loader ts-node/esm`
- **Frontend:** Uses Next.js app router; currently mixes `.jsx` and `.tsx` files
- **WebSocket:** Single server instance (no horizontal scaling yet); stored in `connection_manager.ts` registry
- **Prices & Quantities:** All integers (no decimals) to avoid floating-point precision issues
