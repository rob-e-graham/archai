#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# ARCHAI stack supervisor — keeps the public demo alive and FLAGS outages.
#
# Fills the gaps the LaunchAgents can't cover:
#   • ensures Docker Desktop is running (the recurring cause: Docker down →
#     Qdrant down → objects silently fail to load)
#   • ensures the Qdrant container is up and answering
#   • checks Ollama, the local backend, and the public tunnel end to end
#   • ALERTS on every state change (up→down and recovery) via a macOS
#     notification, a log line, and an optional webhook — so an outage is
#     flagged the moment it happens instead of when a partner notices.
#
# Ownership split (no double-starts, no EADDRINUSE):
#   LaunchAgents own backend (:8787), cloudflared, and caffeinate.
#   THIS supervisor owns Docker + Qdrant, and FLAGS backend/tunnel/public
#   (it never starts them — launchd does — it only reports).
#
# Install via install-public-launchagents.sh (runs it under launchd, KeepAlive).
# Optional: export ARCHAI_ALERT_WEBHOOK=<slack/discord/webhook url> for push
# alerts to your phone. No secrets live in this repo.
# ══════════════════════════════════════════════════════════════════════
set -uo pipefail

ROOT="/Users/robgraham/Desktop/APPS/ARCHAI APP"
COMPOSE_FILE="$ROOT/docker-compose.yml"
QDRANT_CONTAINER="archai_qdrant"
LOG="/tmp/archai-stack-supervisor.log"

export HOME="/Users/robgraham"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

CHECK_INTERVAL="${ARCHAI_SUPERVISOR_INTERVAL:-20}"
PUBLIC_HEALTH_URL="https://archai-api.fineartmedia.tech/api/health"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }

# Alert only on state transitions so we never spam. Track last state per key.
# File-based, not an associative array, so this runs on stock macOS bash 3.2
# (declare -A needs bash 4+, which macOS does not ship — using it would make the
# supervisor die on launch on any Mac without homebrew bash first on PATH).
STATE_DIR="/tmp/archai-supervisor-state"
mkdir -p "$STATE_DIR"
notify() {
  title="$1"; msg="$2"
  log "ALERT — $title: $msg"
  safe_msg=$(printf '%s' "$msg" | tr '"' "'")
  safe_title=$(printf '%s' "$title" | tr '"' "'")
  osascript -e "display notification \"$safe_msg\" with title \"$safe_title\" sound name \"Basso\"" >/dev/null 2>&1 || true
  if [ -n "${ARCHAI_ALERT_WEBHOOK:-}" ]; then
    curl -fsS -m 8 -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"ARCHAI — ${safe_title}: ${safe_msg}\"}" "$ARCHAI_ALERT_WEBHOOK" >/dev/null 2>&1 || true
  fi
}
# mark <key> up|down <human message-on-change>
mark() {
  key="$1"; now="$2"; msg="$3"
  state_file="$STATE_DIR/$key"
  prev=$(cat "$state_file" 2>/dev/null || printf 'unknown')
  if [ "$now" != "$prev" ]; then
    printf '%s' "$now" > "$state_file"
    if [ "$now" = "down" ]; then notify "$key DOWN" "$msg"; else notify "$key recovered" "$msg"; fi
  fi
}

docker_up()   { docker info >/dev/null 2>&1; }
qdrant_up()   { curl -fsS -m 5 http://localhost:6333/readyz >/dev/null 2>&1 || curl -fsS -m 5 http://localhost:6333/ >/dev/null 2>&1; }
ollama_up()   { curl -fsS -m 5 http://localhost:11434/api/tags >/dev/null 2>&1; }
backend_up()  { curl -fsS -m 6 http://localhost:8787/api/health >/dev/null 2>&1; }
public_up()   { curl -fsS -m 12 "$PUBLIC_HEALTH_URL" >/dev/null 2>&1; }

ensure_docker() {
  if docker_up; then mark Docker up "Docker daemon healthy"; return 0; fi
  mark Docker down "Docker Desktop not running — launching it and starting Qdrant"
  open -ga Docker >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do sleep 3; docker_up && break; done
  docker_up
}

ensure_qdrant() {
  if qdrant_up; then mark Qdrant up "Qdrant answering on :6333"; return 0; fi
  mark Qdrant down "Qdrant not answering — restarting the container"
  docker start "$QDRANT_CONTAINER" >/dev/null 2>&1 \
    || docker compose -f "$COMPOSE_FILE" up -d qdrant >/dev/null 2>&1 || true
  for _ in $(seq 1 15); do sleep 2; qdrant_up && break; done
  qdrant_up
}

trap 'log "supervisor stopping"; exit 0' INT TERM
log "ARCHAI stack supervisor started (interval ${CHECK_INTERVAL}s)"

while true; do
  # Layer we own: Docker → Qdrant. Only try Qdrant once Docker is really up.
  if ensure_docker; then ensure_qdrant; else mark Qdrant down "Qdrant unreachable — Docker is still down"; fi

  # Ollama (native on macOS). Flag only; it usually runs as its own service.
  if ollama_up; then mark Ollama up "Ollama answering on :11434"; else mark Ollama down "Ollama not answering on :11434"; fi

  # Layers launchd owns: flag only, never start (avoids port conflicts).
  if backend_up; then mark Backend up "Backend healthy on :8787"; else mark Backend down "Backend not answering on :8787 (launchd should relaunch)"; fi
  if public_up;  then mark Public  up "Public tunnel healthy";      else mark Public  down "Public site unreachable via the tunnel"; fi

  sleep "$CHECK_INTERVAL"
done
