-- cancel_order: client-initiated cancel of a resting order.
-- Looks up by engine order_id (always assigned for a resting order).
-- Releases the reservation and marks the order cancelled.
create or replace function trade_or_tighten.cancel_order(
  p_client_id uuid,
  p_order_id int4,
  p_status text,
  p_asset_id int2 default null
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
begin
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
    and (p_asset_id is null or co.asset = p_asset_id)
  for update;

  if v_existing.side = 'buy' then
    update trade_or_tighten.client_cash cp
    set cash_reserved = cash_reserved - (v_existing.price * v_existing.current_qty)
    where cp.client_id = p_client_id;
  else
    update trade_or_tighten.client_positions cp
    set reserved = reserved - v_existing.current_qty
    where cp.client_id = p_client_id
      and cp.asset_id = v_existing.asset;
  end if;

  update trade_or_tighten.client_orders co
  set status = p_status
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

-- reject_order: engine-rejection cleanup for an order that was never accepted.
-- Looks up by (client_order_id, seq) because no engine order_id was assigned.
-- Releases the reservation made by place_taker_order and marks the order rejected.
create or replace function trade_or_tighten.reject_order(
  p_client_id uuid,
  p_client_order_id text,
  p_seq int4
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
begin
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

  if v_existing.side = 'buy' then
    update trade_or_tighten.client_cash cp
    set cash_reserved = cash_reserved - (v_existing.price * v_existing.current_qty)
    where cp.client_id = p_client_id;
  else
    update trade_or_tighten.client_positions cp
    set reserved = reserved - v_existing.current_qty
    where cp.client_id = p_client_id
      and cp.asset_id = v_existing.asset;
  end if;

  update trade_or_tighten.client_orders co
  set status = 'rejected'
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
