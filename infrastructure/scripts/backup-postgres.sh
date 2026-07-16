#!/usr/bin/env bash
# Daily PostgreSQL backup. Intended to run via cron on the production server.
#
# Usage:
#   ./infrastructure/scripts/backup-postgres.sh
#
# Env overrides:
#   BACKUP_DIR=/var/backups/qr-platform/postgres   (default, must exist and be writable)
#   RETENTION_DAYS=14                              (default; older backups are deleted)
#
# Cron example (03:00 daily), see docs/setup/postgresql.md:
#   0 3 * * * /opt/qr-platform/infrastructure/scripts/backup-postgres.sh >> /var/log/qr-platform/backup-postgres.log 2>&1
set -euo pipefail

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

BACKUP_DIR="${BACKUP_DIR:-/var/backups/qr-platform/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/qr_platform_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Backing up database '$POSTGRES_DB' to $BACKUP_FILE ..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --format=custom \
  --file="$BACKUP_FILE" \
  "$POSTGRES_DB"

echo "Backup written: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

echo "Removing backups older than $RETENTION_DAYS days from $BACKUP_DIR ..."
find "$BACKUP_DIR" -name "qr_platform_*.dump" -mtime "+$RETENTION_DAYS" -print -delete

echo "Done."
