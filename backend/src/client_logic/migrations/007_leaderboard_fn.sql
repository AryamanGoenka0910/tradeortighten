-- get_leaderboard: returns all clients ranked by total portfolio value.
-- p_prices is a JSON object mapping asset_id (as string) to current price,
-- e.g. {"1": 105, "2": 98, "3": 120, "4": 87}
-- total_value = cash_available + cash_reserved
--             + sum over all positions of (available + reserved) * price
create or replace function trade_or_tighten.get_leaderboard(
  p_prices jsonb
)
returns table (
  rank        bigint,
  client_id   uuid,
  client_name text,
  total_value numeric,
  cash_available int4,
  cash_reserved  int4
)
language sql
as $$
  select
    rank() over (order by portfolio_value desc) as rank,
    c.client_id,
    c.client_name,
    portfolio_value                             as total_value,
    cc.cash_available,
    cc.cash_reserved
  from trade_or_tighten.clients c
  join trade_or_tighten.client_cash cc on cc.client_id = c.client_id
  cross join lateral (
    select
      (cc.cash_available + cc.cash_reserved) +
      coalesce((
        select sum(
          (cp.available + cp.reserved) *
          coalesce((p_prices ->> cp.asset_id::text)::numeric, 0)
        )
        from trade_or_tighten.client_positions cp
        where cp.client_id = c.client_id
      ), 0) as portfolio_value
  ) pv
  order by rank
$$;
