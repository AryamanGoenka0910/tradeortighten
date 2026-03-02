#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"

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
  - DATABAASE_URL: accepted as a compatibility alias for DATABASE_URL
  - ENV_FILE: path to the env file to read DATABASE_URL from (default: ./backend/.env)
USAGE
  exit 0
fi

# Compatibility alias: if DATABAASE_URL is set, use it.
# If both are set, DATABAASE_URL intentionally wins.
if [[ -n "${DATABAASE_URL:-}" ]]; then
  DATABASE_URL="$DATABAASE_URL"
fi

# Read DATABASE_URL from env file when not already provided.
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    env_database_url=""
    env_databaase_url=""

    while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
      line="${raw_line%$'\r'}"
      # Trim leading whitespace so lines like "  DATABASE_URL=..." still parse.
      line="${line#"${line%%[![:space:]]*}"}"

      [[ -z "$line" || "${line:0:1}" == "#" ]] && continue

      case "$line" in
        DATABAASE_URL=*|export\ DATABAASE_URL=*)
          line="${line#export }"
          value="${line#DATABAASE_URL=}"
          value="${value#\"}"; value="${value%\"}"
          value="${value#\'}"; value="${value%\'}"
          env_databaase_url="$value"
          ;;
        DATABASE_URL=*|export\ DATABASE_URL=*)
          line="${line#export }"
          value="${line#DATABASE_URL=}"
          value="${value#\"}"; value="${value%\"}"
          value="${value#\'}"; value="${value%\'}"
          env_database_url="$value"
          ;;
      esac
    done < "$ENV_FILE"

    if [[ -n "$env_databaase_url" ]]; then
      DATABASE_URL="$env_databaase_url"
    elif [[ -n "$env_database_url" ]]; then
      DATABASE_URL="$env_database_url"
    fi
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

MIGRATIONS_DIR="$BACKEND_DIR/src/client_logic/migrations"
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

echo "Dropping and recreating schema..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
drop schema if exists trade_or_tighten cascade;
create schema trade_or_tighten;
SQL

echo "Applying migrations..."
for migration_file in "${migration_files[@]}"; do
  echo "  -> $(basename "$migration_file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration_file"
done

echo "Done. Schema dropped, migrations applied, database reset."
