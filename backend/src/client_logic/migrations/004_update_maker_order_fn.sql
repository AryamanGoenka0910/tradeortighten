create or replace function trade_or_tighten.update_maker_order(
  p_client_id uuid,
  p_order_id int8,
  p_trade_price int8,
  p_trade_qty int8
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
  v_existing record;
  v_fill_qty int8;
  v_trade_value int8;
  v_next_qty int8;
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
    co.status
  into v_existing
  from trade_or_tighten.client_orders co
  where co.client_id = p_client_id
    and co.order_id = p_order_id
  for update;

  if not found then
    return;
  end if;

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
    update trade_or_tighten.client_portfolios cp
    set
      cash_available = cp.cash_available - v_trade_value,
      cash_reserved = cp.cash_reserved - (v_existing.price * v_fill_qty),
      asset1_available = cp.asset1_available + v_fill_qty
    where cp.client_id = p_client_id;
  else
    update trade_or_tighten.client_portfolios cp
    set
      asset1_available = cp.asset1_available - v_fill_qty,
      asset1_reserved = cp.asset1_reserved - v_fill_qty,
      cash_available = cp.cash_available + v_trade_value
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

