create or replace function trade_or_tighten.ensure_client_and_portfolio(
  p_client_id uuid,
  p_client_name text,
  p_starting_cash int8,
  p_starting_asset1 int8
)
returns table (
  client_id uuid,
  client_name text,
  last_seq int8,
  cash_available int8,
  cash_reserved int8,
  asset1_available int8,
  asset1_reserved int8,
  asset2_available int8,
  asset2_reserved int8,
  asset3_available int8,
  asset3_reserved int8,
  asset4_available int8,
  asset4_reserved int8
)
language plpgsql
as $$
begin
  insert into trade_or_tighten.clients (client_id, client_name, last_seq)
  values (p_client_id, p_client_name, 0)
  on conflict on constraint clients_pkey do nothing;

  insert into trade_or_tighten.client_portfolios (
    client_id,
    cash_available,
    cash_reserved,
    asset1_available,
    asset1_reserved,
    asset2_available,
    asset2_reserved,
    asset3_available,
    asset3_reserved,
    asset4_available,
    asset4_reserved
  )
  values (
    p_client_id,
    p_starting_cash,
    0,
    p_starting_asset1,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  )
  on conflict on constraint client_portfolios_pkey do nothing;

  return query
  select
    c.client_id,
    c.client_name,
    c.last_seq,
    cp.cash_available,
    cp.cash_reserved,
    cp.asset1_available,
    cp.asset1_reserved,
    cp.asset2_available,
    cp.asset2_reserved,
    cp.asset3_available,
    cp.asset3_reserved,
    cp.asset4_available,
    cp.asset4_reserved
  from trade_or_tighten.clients c
  join trade_or_tighten.client_portfolios cp on cp.client_id = c.client_id
  where c.client_id = p_client_id;
end;
$$;

create or replace function trade_or_tighten.get_client_open_orders(
  p_client_id uuid
)
returns table (
  order_id int8,
  side text,
  price int8,
  original_qty int8,
  current_qty int8,
  status text
)
language sql
as $$
  select
    co.order_id,
    co.side,
    co.price,
    co.original_qty,
    co.current_qty,
    co.status
  from trade_or_tighten.client_orders co
  where co.client_id = p_client_id
    and co.order_id is not null
    and co.status in ('pending', 'partially_filled')
  order by co.order_id;
$$;
