#!/usr/bin/env bash
# Billuz tiered backup scheduler — runs inside the billiard_backup sidecar.
#
# Produces, into $BACKUP_ROOT (a host folder bind-mounted as /backups):
#   minutely/  hourly/  daily/   — logical snapshots (pg_dump -Fc) with rotation
#   basebackups/                 — physical base backups (pg_basebackup), the PITR anchor
#   wal-archive/                 — WAL segments archived continuously by Postgres itself
#
# Granularity:
#   seconds/minutes  -> WAL archive + a base backup  => point-in-time recovery (restore-pitr.sh)
#   minutes/hours/days -> the snapshot tiers          => simple restore (restore-snapshot.sh)
set -uo pipefail

PGHOST="${PGHOST:-postgres}"
PGUSER="${POSTGRES_USER:-billiard}"
PGDB="${POSTGRES_DB:-billiard}"
export PGPASSWORD="${POSTGRES_PASSWORD:-billiard}"

ROOT="${BACKUP_ROOT:-/backups}"
MIN_KEEP="${MINUTELY_KEEP:-60}"      # ~1 hour of minute snapshots
HOUR_KEEP="${HOURLY_KEEP:-48}"       # ~2 days of hourly snapshots
DAY_KEEP="${DAILY_KEEP:-14}"         # ~2 weeks of daily snapshots
BASE_KEEP="${BASEBACKUP_KEEP:-7}"    # keep this many physical base backups

mkdir -p "$ROOT"/{minutely,hourly,daily,manual,basebackups,wal-archive,logs}
LOG="$ROOT/logs/backup.log"

log() { echo "[$(date -u +%FT%TZ)] $*" >> "$LOG"; echo "[backup] $*"; }

rotate() { # $1=dir $2=keep  (keep newest $keep *.dump)
  ls -1t "$1"/*.dump 2>/dev/null | tail -n +"$(( $2 + 1 ))" | while read -r old; do rm -f "$old"; done
}

snapshot() { # $1=tier $2=keep
  local tier="$1" keep="$2" ts f
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  f="$ROOT/$tier/${PGDB}_${ts}.dump"
  if pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDB" -Fc -f "$f" 2>>"$LOG"; then
    log "snapshot[$tier] $(basename "$f") $(du -h "$f" | cut -f1)"
    rotate "$ROOT/$tier" "$keep"
  else
    log "ERROR snapshot[$tier] failed (see log)"; rm -f "$f"
  fi
}

prune_wal() {
  # Drop archived WAL older than the oldest retained base backup (it can never be replayed past that).
  local oldest
  oldest="$(ls -1dt "$ROOT/basebackups"/base_* 2>/dev/null | tail -n 1)"
  [ -z "$oldest" ] && return 0
  find "$ROOT/wal-archive" -type f ! -newer "$oldest" -delete 2>>"$LOG" || true
}

basebackup() {
  local ts dir
  ts="$(date -u +%Y%m%dT%H%M%SZ)"; dir="$ROOT/basebackups/base_${ts}"
  if pg_basebackup -h "$PGHOST" -U "$PGUSER" -D "$dir" -Ft -z -Xs -P 2>>"$LOG"; then
    log "basebackup $(basename "$dir")"
    ls -1dt "$ROOT/basebackups"/base_* 2>/dev/null | tail -n +"$(( BASE_KEEP + 1 ))" | while read -r old; do rm -rf "$old"; done
    prune_wal
  else
    log "ERROR basebackup failed (see log)"; rm -rf "$dir"
  fi
}

echo "[backup] waiting for $PGHOST ..."
until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDB" >/dev/null 2>&1; do sleep 2; done
log "scheduler started (min=$MIN_KEEP hour=$HOUR_KEEP day=$DAY_KEEP base=$BASE_KEEP, root=$ROOT)"

# Anchor PITR immediately if there is no base backup yet.
[ -z "$(ls -A "$ROOT/basebackups" 2>/dev/null)" ] && basebackup

last_min="" last_hour="" last_day=""
while true; do
  cmin="$(date -u +%Y%m%d%H%M)"
  chour="$(date -u +%Y%m%d%H)"
  cday="$(date -u +%Y%m%d)"
  [ "$cmin"  != "$last_min"  ] && { last_min="$cmin";   snapshot minutely "$MIN_KEEP"; }
  [ "$chour" != "$last_hour" ] && { last_hour="$chour"; snapshot hourly   "$HOUR_KEEP"; }
  [ "$cday"  != "$last_day"  ] && { last_day="$cday";   snapshot daily    "$DAY_KEEP"; basebackup; }
  sleep 15
done
