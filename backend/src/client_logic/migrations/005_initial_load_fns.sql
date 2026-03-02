create or replace function trade_or_tighten.ensure_client_and_portfolio(
  p_client_id uuid,
  p_client_name text,
  p_starting_cash int4,
  p_starting_asset int4
)
returns table (
  client_id uuid,
  client_name text,
  last_seq int4,
  cash_available int4,
  cash_reserved int4,
  asset1_available int4,
  asset1_reserved int4,
  asset2_available int4,
  asset2_reserved int4,
  asset3_available int4,
  asset3_reserved int4,
  asset4_available int4,
  asset4_reserved int4
)
language plpgsql
as $$
begin
  insert into trade_or_tighten.clients (client_id, client_name, last_seq)
  values (p_client_id, p_client_name, 0)
  on conflict on constraint clients_pkey do nothing;

  insert into trade_or_tighten.client_cash (client_id, cash_available, cash_reserved)
  values (p_client_id, p_starting_cash, 0)
  on conflict on constraint client_cash_pkey do nothing;

  insert into trade_or_tighten.client_positions (client_id, asset_id, available, reserved)
  values
    (p_client_id, 1, p_starting_asset, 0),
    (p_client_id, 2, p_starting_asset, 0),
    (p_client_id, 3, p_starting_asset, 0),
    (p_client_id, 4, p_starting_asset, 0)
  on conflict on constraint client_positions_pkey do nothing;

  return query
  select
    c.client_id,
    c.client_name,
    c.last_seq,
    cc.cash_available,
    cc.cash_reserved,
    p1.available,
    p1.reserved,
    p2.available,
    p2.reserved,
    p3.available,
    p3.reserved,
    p4.available,
    p4.reserved
  from trade_or_tighten.clients c
  join trade_or_tighten.client_cash cc on cc.client_id = c.client_id
  left join trade_or_tighten.client_positions p1 on p1.client_id = c.client_id and p1.asset_id = 1
  left join trade_or_tighten.client_positions p2 on p2.client_id = c.client_id and p2.asset_id = 2
  left join trade_or_tighten.client_positions p3 on p3.client_id = c.client_id and p3.asset_id = 3
  left join trade_or_tighten.client_positions p4 on p4.client_id = c.client_id and p4.asset_id = 4
  where c.client_id = p_client_id;
end;
$$;

create or replace function trade_or_tighten.get_client_open_orders(
  p_client_id uuid
)
returns table (
  order_id int4,
  side text,
  price int4,
  original_qty int4,
  current_qty int4,
  status text,
  asset int2
)
language sql
as $$
  select
    co.order_id,
    co.side,
    co.price,
    co.original_qty,
    co.current_qty,
    co.status,
    co.asset
  from trade_or_tighten.client_orders co
  where co.client_id = p_client_id
    and co.order_id is not null
    and co.status in ('pending', 'partially_filled')
  order by co.order_id;
$$;
