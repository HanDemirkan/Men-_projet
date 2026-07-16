#!/usr/bin/env bash
# Daily backup of STORAGE_DIR (packages/storage's LocalStorageAdapter root).
# Intended to run via cron on the production server, alongside backup-postgres.sh.
#
# Usage:
#   ./infrastructure/scripts/backup-storage.sh
#
# Env overrides:
#   BACKUP_DIR=/var/backups/qr-platform/storage   (default, must exist and be writable)
#   RETENTION_DAYS=14                             (default; older backups are deleted)
#
# Cron example (03:15 daily, offset from the Postgres backup), see docs/operations/backup-restore.md:
#   15 3 * * * /opt/qr-platform/infrastructure/scripts/backup-storage.sh >> /var/log/qr-platform/backup-storage.log 2>&1
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

if [ -z "${STORAGE_DIR:-}" ] || [ ! -d "$STORAGE_DIR" ]; then
  echo "Error: STORAGE_DIR ('${STORAGE_DIR:-}') is not set or does not exist." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/qr-platform/storage}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up $STORAGE_DIR to $BACKUP_FILE ..."
tar -czf "$BACKUP_FILE" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")"

echo "Backup written: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

echo "Removing backups older than $RETENTION_DAYS days from $BACKUP_DIR ..."
find "$BACKUP_DIR" -name "storage_*.tar.gz" -mtime "+$RETENTION_DAYS" -print -delete

echo "Done."
