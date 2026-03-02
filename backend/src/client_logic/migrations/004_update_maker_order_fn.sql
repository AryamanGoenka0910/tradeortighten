create or replace function trade_or_tighten.update_maker_order(
  p_client_id uuid,
  p_order_id int4,
  p_trade_price int4,
  p_trade_qty int4,
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
  asset int2
)
language plpgsql
as $$
declare
  v_existing record;
  v_fill_qty int4;
  v_trade_value int4;
  v_next_qty int4;
  v_next_status text;
begin
  -- Load and lock the maker order.
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
    and co.order_id = p_order_id
  for update;

  v_fill_qty := least(p_trade_qty, v_existing.current_qty);
  v_trade_value := p_trade_price * v_fill_qty;
  v_next_qty := greatest(0, v_existing.current_qty - v_fill_qty);
  v_next_status := case
    when v_next_qty = 0 then 'filled'
    when v_next_qty < v_existing.original_qty then 'partially_filled'
    else 'pending'
  end;

  -- Portfolio settlement for this maker fill.
  if v_existing.side = 'buy' then
    update trade_or_tighten.client_cash cp
    set
      cash_available = cash_available - v_trade_value,
      cash_reserved = cash_reserved - (v_existing.price * v_fill_qty)
    where cp.client_id = p_client_id;

    update trade_or_tighten.client_positions cp
    set
      available = available + v_fill_qty
    where cp.client_id = p_client_id
      and cp.asset_id = p_asset;
  else
    update trade_or_tighten.client_positions cp
    set
      available = available - v_fill_qty,
      reserved = reserved - v_fill_qty
    where cp.client_id = p_client_id
      and cp.asset_id = p_asset;

    update trade_or_tighten.client_cash cp
    set
      cash_available = cash_available + v_trade_value
    where cp.client_id = p_client_id;
  end if;

  -- Order state update after fill.
  update trade_or_tighten.client_orders co
  set
    current_qty = v_next_qty,
    status = v_next_status
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
    v_existing.asset;
end;
$$;

