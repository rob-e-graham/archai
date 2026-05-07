# ARCHAI — Remote Testing via Tailscale

Access the full ARCHAI stack from iPad, iPhone, or any device — anywhere.

## Prerequisites

- **Tailscale** installed on Mac Studio and all test devices
- All devices signed into the same Tailnet

## Current Tailscale Devices

| Device | Tailscale IP | Role |
|--------|-------------|------|
| Mac Studio | `100.109.26.39` | Server (runs everything) |
| iPad Pro | `100.67.189.36` | Demo / testing |
| iPhone 15 Pro Max | `100.82.246.35` | Mobile testing |

## URLs (use from any device on the Tailnet)

| Service | URL |
|---------|-----|
| **Main App** | `http://100.109.26.39:8000/ARCHAI_v10_8.html` |
| **NFC Visitor Index** | `http://100.109.26.39:8000/nfc-pages/v/index.html` |
| **Backend API** | `http://100.109.26.39:8787/api/health` |
| **Qdrant** | `http://100.109.26.39:6333/collections` |
| **Ollama** | `http://100.109.26.39:11434/api/tags` |
| **Directus** | `http://100.109.26.39:8055` |

## Starting the Stack (on Mac Studio)

### 1. Docker (Qdrant, Directus, Redis, MySQL)
```bash
cd ~/Desktop/APPS/ARCHAI\ APP
docker compose up -d
```

### 2. Ollama (must bind to all interfaces for remote access)
```bash
# Quit the Ollama GUI app first if running, then:
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" \
  /Applications/Ollama.app/Contents/Resources/ollama serve &
```

**Why both flags?**
- `OLLAMA_HOST=0.0.0.0:11434` — listens on all network interfaces (not just localhost)
- `OLLAMA_ORIGINS="*"` — allows CORS from browser on remote devices

### 3. Backend
```bash
cd backend-archai && npm run dev
```

### 4. Frontend
```bash
python3 -m http.server 8000
```

## Regenerating NFC Pages for Remote Access

NFC visitor pages have the Ollama host baked in. When the IP changes, regenerate:

```bash
cd nfc-pages
node generate-nfc-pages.js --host http://100.109.26.39:11434
```

## Troubleshooting

### "Site can't provide a secure connection"
Your browser is forcing HTTPS. Type `http://` explicitly — these are plain HTTP services.

### AI chat gives generic/metadata responses
Ollama is not reachable from the device. Check:
1. Ollama is running with `OLLAMA_HOST=0.0.0.0:11434`
2. CORS is enabled with `OLLAMA_ORIGINS="*"`
3. Test: `curl http://100.109.26.39:11434/api/tags`

### NFC pages load but chat doesn't work
Pages were generated with an old IP. Regenerate with `--host` flag (see above).

### Tailscale shows device but can't connect
Open the Tailscale app on the device to wake the VPN — iOS suspends it in background.

## Static LAN IP (optional)

To prevent local IP drift: System Settings → Network → Wi-Fi → Details → TCP/IP → Configure IPv4: Manually → set to `192.168.1.113`, subnet `255.255.255.0`, router `192.168.1.1`.

Tailscale IPs are permanent and don't change — preferred for remote access.

---

Rob Graham · FAMTEC / RMIT
