#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  ./reset_and_seed.sh

What it does:
  - Truncates the 3 tables:
      trade_or_tighten.clients
      trade_or_tighten.client_portfolios
      trade_or_tighten.client_orders
  - Inserts 2 fake clients + portfolios

Environment overrides:
  - DATABASE_URL: Postgres connection string
  - ENV_FILE: path to the env file to read DATABASE_URL from (default: ./backend/.env)
  - CLIENT1_ID / CLIENT2_ID: UUIDs for seeded clients
USAGE
  exit 0
fi

# Your backend `.env` contains non-env lines (a psql snippet), so we **do not** `source` it.
# Instead, we extract DATABASE_URL safely from a line like:
#   DATABASE_URL="postgres://..."
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    while IFS= read -r line; do
      case "$line" in
        DATABASE_URL=*|export\ DATABASE_URL=*)
          line="${line#export }"
          value="${line#DATABASE_URL=}"
          value="${value%$'\r'}"
          value="${value#\"}"; value="${value%\"}"
          value="${value#\'}"; value="${value%\'}"
          DATABASE_URL="$value"
          break
          ;;
      esac
    done < "$ENV_FILE"
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set, and couldn't be found in $ENV_FILE" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install Postgres client tools first." >&2
  exit 1
fi

# You can override these by running:
#   CLIENT1_ID=... CLIENT2_ID=... ./reset_and_seed.sh
CLIENT1_ID="${CLIENT1_ID:-326bdde7-2612-4b5c-8d9f-4d9e3feb7af8}"
CLIENT2_ID="${CLIENT2_ID:-30589016-75ee-4752-ac66-013d4c55dd36}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
begin;

-- Clear all rows (and reset identity for client_orders.db_order_id).
truncate table
  trade_or_tighten.client_orders,
  trade_or_tighten.client_portfolios,
  trade_or_tighten.clients
restart identity;

-- Fake user 1 (copied from your snippet).
insert into trade_or_tighten.clients (client_id, last_seq)
values ('$CLIENT1_ID', 0)
on conflict (client_id) do nothing;

insert into trade_or_tighten.client_portfolios (
  client_id,
  cash_available, cash_reserved,
  asset1_available, asset1_reserved,
  asset2_available, asset2_reserved,
  asset3_available, asset3_reserved,
  asset4_available, asset4_reserved
) values (
  '$CLIENT1_ID',
  100000, 0,
  1000, 0,
  0, 0,
  0, 0,
  0, 0
)
on conflict (client_id) do nothing;

-- Fake user 2.
insert into trade_or_tighten.clients (client_id, last_seq)
values ('$CLIENT2_ID', 0)
on conflict (client_id) do nothing;

insert into trade_or_tighten.client_portfolios (
  client_id,
  cash_available, cash_reserved,
  asset1_available, asset1_reserved,
  asset2_available, asset2_reserved,
  asset3_available, asset3_reserved,
  asset4_available, asset4_reserved
) values (
  '$CLIENT2_ID',
  100000, 0,
  1000, 0,
  0, 0,
  0, 0,
  0, 0
)
on conflict (client_id) do nothing;

commit;
SQL

echo "Done."
echo "Seeded clients:"
echo "  CLIENT1_ID=$CLIENT1_ID"
echo "  CLIENT2_ID=$CLIENT2_ID"
