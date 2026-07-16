#!/usr/bin/env bash
# Restores a storage backup produced by backup-storage.sh.
#
# DESTRUCTIVE: replaces the current contents of STORAGE_DIR.
# Requires --yes to run, so it can never be triggered by accident.
#
# Usage:
#   ./infrastructure/scripts/restore-storage.sh <backup-file> --yes
set -euo pipefail

BACKUP_FILE="${1:-}"
CONFIRM_FLAG="${2:-}"

if [ -z "$BACKUP_FILE" ] || [ "$CONFIRM_FLAG" != "--yes" ]; then
  echo "Usage: $0 <backup-file> --yes" >&2
  echo "This OVERWRITES the current contents of STORAGE_DIR. The --yes flag is required to proceed." >&2
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

if [ -z "${STORAGE_DIR:-}" ]; then
  echo "Error: STORAGE_DIR is not set in $ENV_FILE." >&2
  exit 1
fi

PARENT_DIR="$(dirname "$STORAGE_DIR")"

echo "Restoring $BACKUP_FILE into $STORAGE_DIR ..."
mkdir -p "$STORAGE_DIR"
tar -xzf "$BACKUP_FILE" -C "$PARENT_DIR"

echo "Restore complete."
