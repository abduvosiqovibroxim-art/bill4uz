#!/usr/bin/env bash
# On-demand logical snapshot (manual "save now"). Runs inside the sidecar:
#   docker exec billiard_backup bash /ops/pg-backup/snapshot.sh
set -euo pipefail

PGHOST="${PGHOST:-postgres}"
PGUSER="${POSTGRES_USER:-billiard}"
PGDB="${POSTGRES_DB:-billiard}"
export PGPASSWORD="${POSTGRES_PASSWORD:-billiard}"
ROOT="${BACKUP_ROOT:-/backups}"

mkdir -p "$ROOT/manual"
ts="$(date -u +%Y%m%dT%H%M%SZ)"
f="$ROOT/manual/${PGDB}_${ts}.dump"
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDB" -Fc -f "$f"
echo "Saved: ${f}  ($(du -h "$f" | cut -f1))"
