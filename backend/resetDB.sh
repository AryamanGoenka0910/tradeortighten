#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  ./resetDB.sh

What it does:
  - Applies all SQL migrations from:
      ./src/client_logic/migrations/*.sql
  - Truncates the 3 tables:
      trade_or_tighten.clients
      trade_or_tighten.client_portfolios
      trade_or_tighten.client_orders

Environment overrides:
  - DATABASE_URL: Postgres connection string
  - ENV_FILE: path to the env file to read DATABASE_URL from (default: ./backend/.env)
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

MIGRATIONS_DIR="$SCRIPT_DIR/src/client_logic/migrations"
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

shopt -s nullglob
migration_files=("$MIGRATIONS_DIR"/*.sql)
shopt -u nullglob

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo "No migration files found in $MIGRATIONS_DIR" >&2
  exit 1
fi

echo "Applying migrations..."
for migration_file in "${migration_files[@]}"; do
  echo "  -> $(basename "$migration_file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration_file"
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
begin;

-- Clear all rows (and reset identity for client_orders.db_order_id).
truncate table
  trade_or_tighten.client_orders,
  trade_or_tighten.client_portfolios,
  trade_or_tighten.clients
restart identity;

commit;
SQL

echo "Done. Migrations applied and database reset."
