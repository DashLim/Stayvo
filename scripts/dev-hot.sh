#!/usr/bin/env bash
# Hot-reload dev (next dev). Can hang for minutes when the repo is under ~/Documents + iCloud.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
echo "stayvo: hot reload dev → http://localhost:${PORT}"
echo "stayvo: if this never shows \"Ready\", use: npm run dev  (build + start, ~10s)"

unset npm_config_devdir 2>/dev/null || true

if [[ -f .nvmrc && -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use >/dev/null 2>&1 || true
fi

node_major() { node -p "parseInt(process.versions.node, 10)"; }
if [[ "$(node_major)" -ge 24 ]]; then
  for brew_node22 in /opt/homebrew/opt/node@22/bin /usr/local/opt/node@22/bin; do
    [[ -x "$brew_node22/node" ]] && export PATH="$brew_node22:$PATH" && break
  done
fi
echo "stayvo: Node $(node -v)."

if [[ "$(uname -s)" == "Darwin" ]]; then
  node scripts/postinstall-macos-nosync.mjs 2>/dev/null || true
  export WATCHPACK_POLLING=true
  export CHOKIDAR_USEPOLLING=true
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  [[ -n "$PIDS" ]] && kill $PIDS 2>/dev/null || true && sleep 1
fi

exec ./node_modules/.bin/next dev --webpack -H localhost -p "$PORT" "$@"
