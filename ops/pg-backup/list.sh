#!/usr/bin/env bash
# List available backups and the WAL archive range.
#   docker exec billiard_backup bash /ops/pg-backup/list.sh
set -uo pipefail
ROOT="${BACKUP_ROOT:-/backups}"

for tier in manual minutely hourly daily; do
  echo "== $tier =="
  ls -1t "$ROOT/$tier"/*.dump 2>/dev/null | head -n 10 | while read -r f; do
    echo "   $(basename "$f")  $(du -h "$f" | cut -f1)"
  done
done

echo "== basebackups (PITR anchors) =="
ls -1dt "$ROOT/basebackups"/base_* 2>/dev/null | while read -r d; do
  echo "   $(basename "$d")  $(du -sh "$d" 2>/dev/null | cut -f1)"
done

echo "== WAL archive =="
segs="$(ls -1 "$ROOT/wal-archive" 2>/dev/null | grep -v '\.backup$' || true)"
n="$(printf '%s\n' "$segs" | grep -c . || true)"
first="$(printf '%s\n' "$segs" | head -n 1)"
last="$(printf '%s\n' "$segs" | tail -n 1)"
echo "   segments: ${n:-0}   range: ${first:-none} .. ${last:-none}"
