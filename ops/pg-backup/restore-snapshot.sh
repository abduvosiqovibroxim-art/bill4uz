#!/usr/bin/env bash
# Restore the database from a logical snapshot (.dump). Runs inside the sidecar:
#   docker exec billiard_backup bash /ops/pg-backup/restore-snapshot.sh <tier/file.dump>
# Example:
#   docker exec billiard_backup bash /ops/pg-backup/restore-snapshot.sh minutely/billiard_20260624T120000Z.dump
#
# DESTRUCTIVE: drops and recreates the target database from the snapshot.
# Stop the API first (or it will keep writing) for a clean restore.
set -euo pipefail

PGHOST="${PGHOST:-postgres}"
PGUSER="${POSTGRES_USER:-billiard}"
PGDB="${POSTGRES_DB:-billiard}"
export PGPASSWORD="${POSTGRES_PASSWORD:-billiard}"
ROOT="${BACKUP_ROOT:-/backups}"

FILE="${1:-}"
[ -z "$FILE" ] && { echo "usage: restore-snapshot.sh <dumpfile (path or tier/name)>"; exit 1; }
[ -f "$FILE" ] || FILE="$ROOT/$FILE"
[ -f "$FILE" ] || { echo "Backup not found: $FILE"; echo "Run list.sh to see available snapshots."; exit 1; }

echo "Restoring database '$PGDB' from: $FILE"
psql -h "$PGHOST" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$PGDB\" WITH (FORCE);"
psql -h "$PGHOST" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$PGDB\" OWNER \"$PGUSER\";"
pg_restore -h "$PGHOST" -U "$PGUSER" -d "$PGDB" --no-owner --no-privileges "$FILE"
echo "Restore complete. Restart the API if it was running."
