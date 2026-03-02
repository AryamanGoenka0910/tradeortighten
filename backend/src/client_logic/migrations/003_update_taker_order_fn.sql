create or replace function trade_or_tighten.update_taker_order(
  p_client_id uuid,
  p_client_order_id text,
  p_seq int4,
  p_order_id int4,
  p_order_status text,
  p_remaining_qty int4,
  p_price_delta int4,
  p_asset_delta int4,
  p_asset int2
)
returns table (
  db_order_id int4,
  client_id uuid,
  client_order_id text,
  seq int4,
  order_id int4,
  side text,
  price int4,
  original_qty int4,
  current_qty int4,
  status text,
  asset int2,
  positions_available int4,
  positions_reserved int4,
  cash_available int4,
  cash_reserved int4
)
language plpgsql
as $$
declare
  v_existing record;
  v_positions record;
  v_cash record;
begin

  -- Lock the order row.
  select
    co.db_order_id,
    co.client_id,
    co.client_order_id,
    co.seq,
    co.order_id,
    co.side,
    co.price,
    co.original_qty,
    co.current_qty,
    co.status,
    co.asset
  into v_existing
  from trade_or_tighten.client_orders co
  where co.client_id = p_client_id
    and co.client_order_id = p_client_order_id
    and co.seq = p_seq
  for update;

  -- Portfolio deltas:
  -- Semantics:
  -- - available = true holdings
  -- - reserved  = buying/selling power locked for open orders
  -- - for buys: consume reserved at *limit price* and cash at *execution notional*
  -- - for sells: consume reserved asset qty and credit cash at execution notional
  if p_asset_delta > 0 or p_price_delta > 0 then
    if v_existing.side = 'buy' then
      update trade_or_tighten.client_cash cp
      set
        cash_available = cash_available - p_price_delta,
        cash_reserved = cash_reserved - (v_existing.price * p_asset_delta)
      where cp.client_id = p_client_id
      returning cash_available, cash_reserved
      into v_cash;

      update trade_or_tighten.client_positions cp
      set
        available = available + p_asset_delta
      where cp.client_id = p_client_id
        and cp.asset_id = p_asset
      returning available, reserved
      into v_positions;

    else
      update trade_or_tighten.client_positions cp
      set
        available = available - p_asset_delta,
        reserved = reserved - p_asset_delta
      where cp.client_id = p_client_id
        and cp.asset_id = p_asset
      returning available, reserved
      into v_positions;

      update trade_or_tighten.client_cash cp
      set
        cash_available = cash_available + p_price_delta
      where cp.client_id = p_client_id
      returning cash_available, cash_reserved
      into v_cash;
    end if;
  end if;

  update trade_or_tighten.client_orders co
  set
    order_id = coalesce(co.order_id, p_order_id),
    current_qty = p_remaining_qty,
    status = p_order_status
  where co.db_order_id = v_existing.db_order_id
  returning
    co.db_order_id,
    co.client_id,
    co.client_order_id,
    co.seq,
    co.order_id,
    co.side,
    co.price,
    co.original_qty,
    co.current_qty,
    co.status,
    co.asset
  into v_existing;

  return query
  select
    v_existing.db_order_id,
    v_existing.client_id,
    v_existing.client_order_id,
    v_existing.seq,
    v_existing.order_id,
    v_existing.side,
    v_existing.price,
    v_existing.original_qty,
    v_existing.current_qty,
    v_existing.status,
    v_existing.asset,
    v_positions.available,
    v_positions.reserved,
    v_cash.cash_available,
    v_cash.cash_reserved;
end;
$$;
