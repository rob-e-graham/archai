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

chmod 644 "$LAUNCH_AGENTS/com.famtec.archai-backend.plist" "$LAUNCH_AGENTS/com.famtec.archai-cloudflared.plist"
plutil -lint "$LAUNCH_AGENTS/com.famtec.archai-backend.plist" "$LAUNCH_AGENTS/com.famtec.archai-cloudflared.plist"

launchctl bootout "gui/$UID_VALUE" "$LAUNCH_AGENTS/com.famtec.archai-backend.plist" 2>/dev/null || true
launchctl bootout "gui/$UID_VALUE" "$LAUNCH_AGENTS/com.famtec.archai-cloudflared.plist" 2>/dev/null || true
launchctl bootstrap "gui/$UID_VALUE" "$LAUNCH_AGENTS/com.famtec.archai-backend.plist"
launchctl bootstrap "gui/$UID_VALUE" "$LAUNCH_AGENTS/com.famtec.archai-cloudflared.plist"
launchctl kickstart -k "gui/$UID_VALUE/com.famtec.archai-backend"
launchctl kickstart -k "gui/$UID_VALUE/com.famtec.archai-cloudflared"

echo "ARCHAI public LaunchAgents installed and started."
