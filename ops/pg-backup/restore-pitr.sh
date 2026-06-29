#!/usr/bin/env bash
# Point-In-Time Recovery (PHYSICAL restore) — restore the database to ANY moment
# (down to the second) using a base backup + the archived WAL.
#
# Run from the repo root in Git Bash:
#   ops/pg-backup/restore-pitr.sh "2026-06-24 15:30:00+00"            # latest base backup
#   ops/pg-backup/restore-pitr.sh "2026-06-24 15:30:00+00" base_20260624T120000Z
#   ops/pg-backup/restore-pitr.sh "2026-06-24 15:30:00+00" "" --yes   # skip the prompt
#
# Time format: 'YYYY-MM-DD HH:MM:SS+00' (UTC offset). Use +05 for Tashkent local time.
#
# DESTRUCTIVE: replaces the entire live database cluster with the restored copy.
set -euo pipefail

TARGET="${1:-}"
BASE="${2:-}"
YES="${3:-}"
[ -z "$TARGET" ] && { echo "usage: restore-pitr.sh \"YYYY-MM-DD HH:MM:SS+00\" [base_name] [--yes]"; exit 1; }

# Resolve backup location (mirror docker-compose default).
BACKUP_DIR="${BACKUP_HOST_DIR:-D:/billuz-backups}"
if [ -f .env ]; then
  envval="$(grep -E '^BACKUP_HOST_DIR=' .env | tail -1 | cut -d= -f2- | tr -d '\r')"
  [ -n "${envval:-}" ] && BACKUP_DIR="$envval"
fi
# Convert a Windows path (D:/...) to a form usable from Git Bash for ls/tar checks.
unix_dir() { echo "$1" | sed -E 's#^([A-Za-z]):#/\L\1#; s#\\#/#g'; }
BACKUP_UNIX="$(unix_dir "$BACKUP_DIR")"

# Pick the base backup (latest if not specified).
if [ -z "$BASE" ]; then
  BASE="$(ls -1 "$BACKUP_UNIX/basebackups" 2>/dev/null | grep '^base_' | sort | tail -n 1)"
fi
[ -z "$BASE" ] && { echo "No base backup found in $BACKUP_DIR/basebackups. Has the sidecar run yet?"; exit 1; }
[ -d "$BACKUP_UNIX/basebackups/$BASE" ] || { echo "Base backup not found: $BASE"; exit 1; }

# Detect the Postgres data volume name (project-prefixed).
VOL="$(docker volume ls --format '{{.Name}}' | grep -E 'pgdata$' | head -n 1)"
[ -z "$VOL" ] && { echo "Could not find the pgdata Docker volume."; exit 1; }

echo "About to PITR-restore:"
echo "   target time : $TARGET"
echo "   base backup : $BASE"
echo "   pgdata vol  : $VOL"
echo "   wal archive : $BACKUP_DIR/wal-archive"
echo "   THIS REPLACES THE LIVE DATABASE."
if [ "$YES" != "--yes" ]; then
  read -r -p "Type 'yes' to continue: " ans
  [ "$ans" = "yes" ] || { echo "Aborted."; exit 1; }
fi

echo "[pitr] stopping app + database containers ..."
docker stop billiard_api billiard_web billiard_bot billiard_backup billiard_pg >/dev/null 2>&1 || true

echo "[pitr] rebuilding data directory from base backup + recovery target ..."
# Helper container: wipe the data dir, extract the base backup, lay down recovery config.
docker run --rm --user root \
  -v "${VOL}:/pgdata" \
  -v "${BACKUP_DIR}:/backups" \
  postgres:16 bash -c '
    set -e
    BASE="'"$BASE"'"; TARGET="'"$TARGET"'"
    rm -rf /pgdata/* /pgdata/.[!.]* 2>/dev/null || true
    tar -xzf "/backups/basebackups/$BASE/base.tar.gz" -C /pgdata
    mkdir -p /pgdata/pg_wal
    [ -f "/backups/basebackups/$BASE/pg_wal.tar.gz" ] && tar -xzf "/backups/basebackups/$BASE/pg_wal.tar.gz" -C /pgdata/pg_wal
    {
      echo ""
      echo "# --- PITR (added by restore-pitr.sh) ---"
      echo "restore_command = '"'"'cp /wal-archive/%f %p'"'"'"
      echo "recovery_target_time = '"'"'"$TARGET"'"'"'"
      echo "recovery_target_action = '"'"'promote'"'"'"
    } >> /pgdata/postgresql.auto.conf
    touch /pgdata/recovery.signal
    chown -R 999:999 /pgdata
    echo "[pitr] data directory ready."
  '

echo "[pitr] starting Postgres to replay WAL up to the target ..."
docker compose up -d postgres
echo "[pitr] started. Watch recovery with: docker logs -f billiard_pg"
echo "[pitr] When it logs 'database system is ready', recovery to '$TARGET' is done."
echo "[pitr] Then bring services back: docker compose up -d backup  (and run your app)."
