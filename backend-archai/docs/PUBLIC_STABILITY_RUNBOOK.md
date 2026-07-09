# ARCHAI Public Stability Runbook

Date: 2026-06-08

## What Must Be Online

For public ARCHAI / AUXIO access to work during a launch day, these layers need to be healthy:

1. Qdrant on `localhost:6333`
2. Ollama on `localhost:11434`
3. ARCHAI backend on `localhost:8787`
4. Cloudflare tunnel `archai-api.fineartmedia.tech`
5. Static website `fineartmedia.tech`
6. Dark Plates site `darkplates.art`

## Current Stable Start Method: LaunchAgents

Install or refresh the macOS user LaunchAgents:

```bash
cd "/Users/robgraham/Desktop/APPS/ARCHAI APP"
backend-archai/scripts/install-public-launchagents.sh
```

The LaunchAgents restart:

- ARCHAI backend if port `8787` stops listening
- Cloudflare tunnel if `cloudflared tunnel ... archai-api` stops running

They are installed into:

- `~/Library/LaunchAgents/com.famtec.archai-backend.plist`
- `~/Library/LaunchAgents/com.famtec.archai-cloudflared.plist`

## Health Check

```bash
cd "/Users/robgraham/Desktop/APPS/ARCHAI APP"
backend-archai/scripts/healthcheck-public.sh
```

Expected output: every line should be `OK`.

## Logs

```bash
tail -f /tmp/archai-backend.launchd.log
tail -f /tmp/archai-backend.launchd.err
tail -f /tmp/archai-cloudflared.launchd.log
tail -f /tmp/archai-cloudflared.launchd.err
```

## Fallback Watchdog

If LaunchAgents are unavailable, use the terminal watchdog from a trusted terminal/Codex session:

```bash
cd "/Users/robgraham/Desktop/APPS/ARCHAI APP"
nohup backend-archai/scripts/archai-public-watchdog.sh >/tmp/archai-public-watchdog.nohup.log 2>&1 &
```

The LaunchAgent path is preferred for public traffic because it survives Codex/terminal session cleanup and automatically restarts on login.

## Common Failure

If the backend fails with a `better-sqlite3` Node ABI error, rebuild native modules using the active `fnm default` Node:

```bash
cd "/Users/robgraham/Desktop/APPS/ARCHAI APP/backend-archai"
fnm use default
npm rebuild better-sqlite3
```
