create schema if not exists trade_or_tighten;

create table if not exists trade_or_tighten.clients (
  client_id uuid primary key,
  client_name text not null,
  last_seq int4 not null default 0
);

create table if not exists trade_or_tighten.client_cash (
  client_id uuid primary key references trade_or_tighten.clients(client_id),
  cash_available int4 not null,
  cash_reserved int4 not null
);

create table if not exists trade_or_tighten.client_positions (
  client_id uuid not null references trade_or_tighten.clients(client_id),
  asset_id int2 not null,
  available int4 not null,
  reserved int4 not null,
  primary key (client_id, asset_id)
);

create table if not exists trade_or_tighten.client_orders (
  db_order_id int4 generated always as identity primary key,
  client_id uuid not null references trade_or_tighten.clients(client_id),
  client_order_id text not null,
  seq int4 not null,
  order_id int4 null,
  side text not null,
  price int4 not null,
  original_qty int4 not null,
  current_qty int4 not null,
  status text not null,
  asset int2 not null
);

create unique index if not exists client_orders_client_id_client_order_id_key
  on trade_or_tighten.client_orders (client_id, client_order_id);