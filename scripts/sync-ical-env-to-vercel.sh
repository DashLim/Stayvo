#!/usr/bin/env bash
# Re-sync iCal env vars from .env.local to Vercel Production (run after rotating secrets).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi

get_env() {
  local key="$1"
  local val
  val="$(grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '"')"
  echo "$val"
}

ICAL="$(get_env ICAL_FEED_ENCRYPTION_KEY)"
CRON="$(get_env CRON_SECRET)"

if [[ -z "$ICAL" || -z "$CRON" ]]; then
  echo "Set ICAL_FEED_ENCRYPTION_KEY and CRON_SECRET in .env.local first." >&2
  exit 1
fi

npx vercel env rm ICAL_FEED_ENCRYPTION_KEY production -y 2>/dev/null || true
printf '%s' "$ICAL" | npx vercel env add ICAL_FEED_ENCRYPTION_KEY production

npx vercel env rm CRON_SECRET production -y 2>/dev/null || true
printf '%s' "$CRON" | npx vercel env add CRON_SECRET production

echo "Done. Redeploy production for changes to take effect: npx vercel --prod"
