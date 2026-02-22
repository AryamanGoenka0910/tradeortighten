create schema if not exists trade_or_tighten;

create table if not exists trade_or_tighten.clients (
  client_id uuid primary key,
  last_seq int8 not null default 0
);

create table if not exists trade_or_tighten.client_portfolios (
  client_id uuid primary key references trade_or_tighten.clients(client_id),
  cash_available int8 not null,
  cash_reserved int8 not null,
  asset1_available int8 not null,
  asset1_reserved int8 not null,
  asset2_available int8 not null,
  asset2_reserved int8 not null,
  asset3_available int8 not null,
  asset3_reserved int8 not null,
  asset4_available int8 not null,
  asset4_reserved int8 not null
);

create table if not exists trade_or_tighten.client_orders (
  db_order_id int8 generated always as identity primary key,
  client_id uuid not null references trade_or_tighten.clients(client_id),
  client_order_id text not null,
  seq int8 not null,
  order_id int8 null,
  side text not null,
  price int8 not null,
  original_qty int8 not null,
  current_qty int8 not null,
  status text not null
);

create unique index if not exists client_orders_client_id_client_order_id_key
  on trade_or_tighten.client_orders (client_id, client_order_id);