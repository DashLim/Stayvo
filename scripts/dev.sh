#!/usr/bin/env bash
# Reliable local dev: production build + server (~10s). Use npm run dev:hot for next dev / HMR.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
unset npm_config_devdir 2>/dev/null || true

if [[ "$PWD" == "$HOME/Documents/"* ]]; then
  echo "stayvo: repo is under ~/Documents (iCloud). Using build+start instead of next dev." >&2
  echo "stayvo: for hot reload later, move to ~/Developer/Stayvo and run npm run dev:hot" >&2
fi

node_major() { node -p "parseInt(process.versions.node, 10)"; }
if [[ "$(node_major)" -ge 24 ]]; then
  for brew_node22 in /opt/homebrew/opt/node@22/bin /usr/local/opt/node@22/bin; do
    [[ -x "$brew_node22/node" ]] && export PATH="$brew_node22:$PATH" && break
  done
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  node scripts/postinstall-macos-nosync.mjs 2>/dev/null || true
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$PIDS" ]]; then
    echo "stayvo: freeing port ${PORT} (pid ${PIDS//$'\n'/, })." >&2
    kill $PIDS 2>/dev/null || true
    sleep 1
  fi
fi

echo "stayvo: building…"
npm run build

echo "stayvo: open http://localhost:${PORT} (Ctrl+C to stop)"
exec bash scripts/start.sh
