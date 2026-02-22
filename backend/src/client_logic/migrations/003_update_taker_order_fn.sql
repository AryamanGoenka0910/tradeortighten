create or replace function trade_or_tighten.update_taker_order(
    p_client_id uuid,
    p_client_order_id text,
    p_seq int8,
    p_order_id int8,
    p_order_status text,
    p_remaining_qty int8,
    p_price_delta int8,
    p_asset1_delta int8
)
returns table (
  db_order_id int8,
  client_id uuid,
  client_order_id text,
  seq int8,
  order_id int8,
  side text,
  price int8,
  original_qty int8,
  current_qty int8,
  status text
)
language plpgsql
as $$
declare
  v_status text;
  v_existing record;
  v_filled_qty int8;
begin
  if p_remaining_qty < 0 then
    raise exception 'remaining qty (%) cannot be negative', p_remaining_qty;
  end if;

  if p_price_delta < 0 then
    raise exception 'price_delta (%) cannot be negative', p_price_delta;
  end if;

  if p_asset1_delta < 0 then
    raise exception 'asset1_delta (%) cannot be negative', p_asset1_delta;
  end if;

  if p_order_status not in ('pending', 'partially_filled', 'filled', 'cancelled', 'rejected') then
    raise exception 'invalid order status: %', p_order_status;
  end if;

  v_status := p_order_status;

  -- Lock the pre-engine order row.
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
    co.status
  into v_existing
  from trade_or_tighten.client_orders co
  where co.client_id = p_client_id
    and co.client_order_id = p_client_order_id
    and co.seq = p_seq
  for update;

  if not found then
    raise exception 'unknown order for client_id=% seq=% client_order_id=%', p_client_id, p_seq, p_client_order_id;
  end if;

  if p_remaining_qty > v_existing.original_qty then
    raise exception 'remaining qty (%) cannot exceed original qty (%)', p_remaining_qty, v_existing.original_qty;
  end if;

  -- Idempotency: if the row is already bound to an engine order id, it must match.
  if v_existing.order_id is not null and v_existing.order_id <> p_order_id then
    raise exception 'order already bound to different engine order id: existing=% new=%', v_existing.order_id, p_order_id;
  end if;

  -- Apply portfolio deltas.
  -- Semantics:
  -- - available = true holdings
  -- - reserved  = buying/selling power locked for open orders
  -- - for buys: consume reserved at *limit price* and cash at *execution notional*
  -- - for sells: consume reserved asset qty and credit cash at execution notional
  if p_asset1_delta > 0 or p_price_delta > 0 then
    if v_existing.side = 'buy' then
      update trade_or_tighten.client_portfolios cp
      set
        cash_available = cash_available - p_price_delta,
        cash_reserved = cash_reserved - (v_existing.price * p_asset1_delta),
        asset1_available = asset1_available + p_asset1_delta
      where cp.client_id = p_client_id
        and cp.cash_reserved >= (v_existing.price * p_asset1_delta);

      if not found then
        raise exception 'insufficient reserved cash to settle fill (client_id=%, order_id=%)', p_client_id, p_order_id;
      end if;
    else
      update trade_or_tighten.client_portfolios cp
      set
        asset1_available = asset1_available - p_asset1_delta,
        asset1_reserved = asset1_reserved - p_asset1_delta,
        cash_available = cash_available + p_price_delta
      where cp.client_id = p_client_id
        and cp.asset1_reserved >= p_asset1_delta;

      if not found then
        raise exception 'insufficient reserved asset1 to settle fill (client_id=%, order_id=%)', p_client_id, p_order_id;
      end if;
    end if;
  end if;

  update trade_or_tighten.client_orders co
  set
    order_id = coalesce(co.order_id, p_order_id),
    current_qty = p_remaining_qty,
    status = v_status
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
    co.status
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
    v_existing.status;
end;
$$;