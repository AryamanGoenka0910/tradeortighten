create or replace function trade_or_tighten.place_taker_order(
  p_client_id uuid,
  p_client_order_id text,
  p_seq int8,
  p_side text,
  p_price int8,
  p_qty int8
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
  v_last_seq int8;
  v_existing record;
  v_cash_available int8;
  v_cash_reserved int8;
  v_asset1_available int8;
  v_asset1_reserved int8;
begin
  if p_qty <= 0 then
    raise exception 'qty must be positive';
  end if;
  if p_price <= 0 then
    raise exception 'price must be positive';
  end if;
  if p_side not in ('buy', 'sell') then
    raise exception 'invalid side';
  end if;

  -- 1) Sequence gate (lock client row)
  select last_seq into v_last_seq
  from trade_or_tighten.clients c
  where c.client_id = p_client_id
  for update;

  if not found then
    raise exception 'unknown client';
  end if;

  -- Allow exact retry of the most recent seq (idempotent).
  if p_seq = v_last_seq then
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
      and co.client_order_id = p_client_order_id;

    if not found then
      raise exception 'duplicate seq without matching order';
    end if;

    -- Ensure the retry is truly for the same logical order.
    if v_existing.seq <> p_seq then
      raise exception 'duplicate seq without matching order';
    end if;
    if v_existing.side <> p_side
      or v_existing.price <> p_price
      or v_existing.original_qty <> p_qty
    then
      raise exception 'retry payload mismatch for existing order (client_id=%, client_order_id=%, seq=%)', p_client_id, p_client_order_id, p_seq;
    end if;

    return query
    select v_existing.db_order_id, v_existing.client_id, v_existing.client_order_id, v_existing.seq,
           v_existing.order_id,
           v_existing.side, v_existing.price, v_existing.original_qty,
           v_existing.current_qty, v_existing.status;
    return;
  elsif p_seq <> v_last_seq + 1 then
    raise exception 'bad seq: expected % (or retry %), got %', v_last_seq + 1, v_last_seq, p_seq;
  end if;

  -- 2) Check + reserve balances
  -- Semantics:
  -- - *_available = total holdings (ignores open orders)
  -- - *_reserved  = locked for open orders
  -- - free        = available - reserved
  --
  -- Assumption: single instrument where "sell" reserves asset1 and "buy" reserves cash.
  select
    cash_available,
    cash_reserved,
    asset1_available,
    asset1_reserved
  into
    v_cash_available,
    v_cash_reserved,
    v_asset1_available,
    v_asset1_reserved
  from trade_or_tighten.client_portfolios cp
  where cp.client_id = p_client_id
  for update;

  if not found then
    raise exception 'missing portfolio';
  end if;

  if p_side = 'buy' then
    if (v_cash_available - v_cash_reserved) < (p_price * p_qty) then
      raise exception 'insufficient cash';
    end if;

    update trade_or_tighten.client_portfolios cp
    set
      cash_reserved = cp.cash_reserved + (p_price * p_qty)
    where cp.client_id = p_client_id;
  else
    if (v_asset1_available - v_asset1_reserved) < p_qty then
      raise exception 'insufficient asset1';
    end if;

    update trade_or_tighten.client_portfolios cp
    set
      asset1_reserved = cp.asset1_reserved + p_qty
    where cp.client_id = p_client_id;
  end if;

  -- 3) Insert order (client_order_id is the idempotency key)
  insert into trade_or_tighten.client_orders as co (
    client_id, client_order_id, seq, side, price, original_qty, current_qty, status
  ) values (
    p_client_id, p_client_order_id, p_seq, p_side, p_price, p_qty, p_qty, 'pending'
  )
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

  -- 4) Update last_seq
  update trade_or_tighten.clients c set last_seq = p_seq where c.client_id = p_client_id;

  return query
  select v_existing.db_order_id, v_existing.client_id, v_existing.client_order_id, v_existing.seq,
         v_existing.order_id,
         v_existing.side, v_existing.price, v_existing.original_qty,
         v_existing.current_qty, v_existing.status;
end;
$$;