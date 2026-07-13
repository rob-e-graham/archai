#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend-archai"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
UID_VALUE="$(id -u)"

mkdir -p "$LAUNCH_AGENTS"

cat > "$LAUNCH_AGENTS/com.famtec.archai-backend.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.famtec.archai-backend</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>export HOME="$HOME"; export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"; eval "\$(/opt/homebrew/bin/fnm env --use-on-cd --shell zsh)"; fnm use default >/dev/null; cd "$BACKEND_DIR"; exec npm start</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$BACKEND_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/archai-backend.launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/archai-backend.launchd.err</string>
</dict>
</plist>
PLIST

cat > "$LAUNCH_AGENTS/com.famtec.archai-cloudflared.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.famtec.archai-cloudflared</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>export HOME="$HOME"; export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"; exec /opt/homebrew/bin/cloudflared tunnel --config "$BACKEND_DIR/tunnel/config.yml" run archai-api</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$BACKEND_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/archai-cloudflared.launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/archai-cloudflared.launchd.err</string>
</dict>
</plist>
PLIST

# ── Keep the Mac awake (idle sleep is the other recurring outage cause) ──
cat > "$LAUNCH_AGENTS/com.famtec.archai-caffeinate.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.famtec.archai-caffeinate</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string>
    <string>-dimsu</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/archai-caffeinate.launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/archai-caffeinate.launchd.err</string>
</dict>
</plist>
PLIST

# ── Stack supervisor: keeps Docker + Qdrant alive and flags any outage ──
cat > "$LAUNCH_AGENTS/com.famtec.archai-supervisor.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.famtec.archai-supervisor</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>export HOME="$HOME"; export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"; exec "$BACKEND_DIR/scripts/archai-stack-supervisor.sh"</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$BACKEND_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/archai-supervisor.launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/archai-supervisor.launchd.err</string>
</dict>
</plist>
PLIST

chmod +x "$BACKEND_DIR/scripts/archai-stack-supervisor.sh"

PLISTS=(
  com.famtec.archai-backend
  com.famtec.archai-cloudflared
  com.famtec.archai-caffeinate
  com.famtec.archai-supervisor
)

for label in "${PLISTS[@]}"; do
  chmod 644 "$LAUNCH_AGENTS/$label.plist"
  plutil -lint "$LAUNCH_AGENTS/$label.plist"
done

for label in "${PLISTS[@]}"; do
  launchctl bootout "gui/$UID_VALUE" "$LAUNCH_AGENTS/$label.plist" 2>/dev/null || true
  launchctl bootstrap "gui/$UID_VALUE" "$LAUNCH_AGENTS/$label.plist"
  launchctl kickstart -k "gui/$UID_VALUE/$label"
done

echo "ARCHAI public LaunchAgents installed and started:"
printf '  • %s\n' "${PLISTS[@]}"
echo "Docker + Qdrant are now supervised, the Mac is kept awake, and outages are flagged."
echo "Optional phone alerts: add 'export ARCHAI_ALERT_WEBHOOK=<url>' to ~/.zshrc and re-run."
