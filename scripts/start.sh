#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"
unset npm_config_devdir 2>/dev/null || true

if [[ ! -f .next/BUILD_ID ]]; then
  echo "stayvo: no production build yet — run: npm run build" >&2
  exit 1
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$PIDS" ]]; then
    echo "stayvo: port ${PORT} in use — stopping pid ${PIDS//$'\n'/, }." >&2
    kill $PIDS 2>/dev/null || true
    sleep 1
  fi
fi

echo "stayvo: server ready → http://localhost:${PORT}"
if [[ "$HOST" == "0.0.0.0" ]]; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -n "$LAN_IP" ]]; then
    echo "stayvo: on your phone (same Wi‑Fi) → http://${LAN_IP}:${PORT}"
  fi
fi
exec ./node_modules/.bin/next start -H "$HOST" -p "$PORT"
