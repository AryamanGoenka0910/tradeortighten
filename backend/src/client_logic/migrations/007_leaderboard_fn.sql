-- get_leaderboard_data: returns raw portfolio data for all clients.
-- Valuation and ranking are computed in Node.js using live mid-prices.
create or replace function trade_or_tighten.get_leaderboard_data()
returns table (
  client_id      uuid,
  client_name    text,
  cash_available int4,
  cash_reserved  int4,
  positions      jsonb   -- { "1": total_qty, "2": total_qty, ... }
)
language sql
as $$
  select
    c.client_id,
    c.client_name,
    cc.cash_available,
    cc.cash_reserved,
    coalesce(
      (select jsonb_object_agg(cp.asset_id::text, cp.available + cp.reserved)
       from trade_or_tighten.client_positions cp
       where cp.client_id = c.client_id),
      '{}'::jsonb
    ) as positions
  from trade_or_tighten.clients c
  join trade_or_tighten.client_cash cc on cc.client_id = c.client_id
$$;
