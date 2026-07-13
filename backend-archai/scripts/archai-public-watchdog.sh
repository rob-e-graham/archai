#!/usr/bin/env bash
set -uo pipefail

# ⚠️ DEPRECATED — do not run. Superseded by archai-stack-supervisor.sh + the
# LaunchAgents installed by install-public-launchagents.sh.
#
# This script starts the backend and cloudflared itself. Those are now owned by
# launchd (KeepAlive), so running this too double-starts them and causes the
# `EADDRINUSE :8787` port conflict. Kept only for reference/history.
#
# To supervise the public demo, use:
#     bash backend-archai/scripts/install-public-launchagents.sh
if [ "${ARCHAI_WATCHDOG_FORCE:-}" != "1" ]; then
  echo "archai-public-watchdog.sh is DEPRECATED and does nothing." >&2
  echo "Use: bash backend-archai/scripts/install-public-launchagents.sh" >&2
  echo "(sets up Docker/Qdrant supervision, keep-awake, and outage alerts via launchd)." >&2
  exit 0
fi

ROOT="/Users/robgraham/Desktop/APPS/ARCHAI APP"
BACKEND_DIR="$ROOT/backend-archai"
LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/archai-backend.watchdog.log"
TUNNEL_LOG="$LOG_DIR/archai-cloudflared.watchdog.log"
WATCHDOG_LOG="$LOG_DIR/archai-public-watchdog.log"

export HOME="/Users/robgraham"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$WATCHDOG_LOG"
}

trap 'log "Watchdog received stop signal"; exit 0' INT TERM
trap 'log "Watchdog recovered from a non-fatal command error"' ERR

backend_running() {
  lsof -nP -iTCP:8787 -sTCP:LISTEN >/dev/null 2>&1
}

tunnel_running() {
  pgrep -f "cloudflared tunnel" >/dev/null 2>&1
}

start_backend() {
  log "Starting ARCHAI backend on :8787"
  (
    cd "$BACKEND_DIR"
    eval "$(/opt/homebrew/bin/fnm env --use-on-cd --shell bash)"
    fnm use default >/dev/null
    exec npm start
  ) >>"$BACKEND_LOG" 2>&1 &
}

start_tunnel() {
  log "Starting Cloudflare tunnel archai-api"
  /opt/homebrew/bin/cloudflared tunnel \
    --config "$BACKEND_DIR/tunnel/config.yml" \
    run archai-api >>"$TUNNEL_LOG" 2>&1 &
}

log "ARCHAI public watchdog started"

while true; do
  if ! backend_running; then
    start_backend
    sleep 4
  fi

  if ! tunnel_running; then
    start_tunnel
    sleep 4
  fi

  sleep 15
done
