# Migrations Outline

## 001_init.sql
Defines the full schema — tables for `clients`, `client_cash`, `client_positions`, and `client_orders`, plus a unique index on `(client_id, client_order_id)` to enforce order idempotency.

---

## 002_place_taker_order_fn.sql — `place_taker_order`
Validates and inserts a new taker order, enforcing sequence ordering (idempotency) and reserving the required cash or asset before the order is submitted to the engine. This is the sole entry point for creating an order row; all downstream functions assume its invariants hold.

**Runtime checks:**
- `qty > 0`
- `price > 0`
- `side in ('buy', 'sell')`
- Client exists (NOT FOUND guard on `clients FOR UPDATE`)
- Cash row exists (NOT FOUND guard on `client_cash`)
- Position row exists (NOT FOUND guard on `client_positions`)
- `seq = last_seq + 1` (or exact retry of `last_seq`)
- On retry: payload must match existing order fields exactly
- Sufficient free cash (buy): `cash_available - cash_reserved >= price * qty`
- Sufficient free asset (sell): `asset_available - asset_reserved >= qty`

---

## 003_update_taker_order_fn.sql — `update_taker_order`
Settles portfolio deltas for a taker order after the engine responds, updating cash/position balances and the order's status and remaining quantity. All inputs are guaranteed valid by `002` and the engine, so this function contains no validation — it is purely mechanical settlement.

**Runtime checks:** None.

---

## 004_update_maker_order_fn.sql — `update_maker_order`
Settles a partial or full fill for a resting maker order when a taker crosses it, applying cash/position deltas and deriving the new order status. Called once per trade leg that involves a maker.

**Runtime checks:** None.
---

## 005_initial_load_fns.sql — `ensure_client_and_portfolio`, `get_client_open_orders`
`ensure_client_and_portfolio` idempotently provisions a new client with starting cash and positions across all four assets, returning the full portfolio snapshot. `get_client_open_orders` returns all resting (`pending` / `partially_filled`) orders for a client for reconnect hydration.

**Runtime checks:** None — both use `ON CONFLICT DO NOTHING` or read-only queries.

---

## 006_close_order_fn.sql — `cancel_order`, `reject_order`
`cancel_order` releases the reservation for a client-cancelled resting order (looked up by engine `order_id`) and marks it `cancelled`. `reject_order` does the same for an engine-rejected order that never received an engine ID (looked up by `client_order_id` + `seq`).

**Runtime checks:** None — reservation release is guaranteed safe by `002`'s invariants.

TODO:
Place an order the engine will reject → confirm cash_reserved / positions.reserved returns to pre-order value and order row has status rejected
Place a resting order → cancel it → confirm reservation released and status is cancelled
Place and fill an order normally → confirm cancel path is not triggered