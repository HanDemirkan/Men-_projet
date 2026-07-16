#!/usr/bin/env bash
# Restores a PostgreSQL backup produced by backup-postgres.sh.
#
# DESTRUCTIVE: drops and recreates every object in the target database.
# Requires --yes to run, so it can never be triggered by accident.
#
# Usage:
#   ./infrastructure/scripts/restore-postgres.sh <backup-file> --yes
#
# See docs/setup/postgresql.md for the full restore procedure (including
# when/why to take a fresh backup of the current state before restoring).
set -euo pipefail

BACKUP_FILE="${1:-}"
CONFIRM_FLAG="${2:-}"

if [ -z "$BACKUP_FILE" ] || [ "$CONFIRM_FLAG" != "--yes" ]; then
  echo "Usage: $0 <backup-file> --yes" >&2
  echo "This OVERWRITES the target database. The --yes flag is required to proceed." >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. This script must run on the production server." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "Restoring $BACKUP_FILE into database '$POSTGRES_DB' on $POSTGRES_HOST:$POSTGRES_PORT ..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --clean \
  --if-exists \
  --no-owner \
  "$BACKUP_FILE"

echo "Restore complete. Run 'pnpm db:migrate:deploy' if the backup predates a schema migration."
