# Cloudflare Tunnel Setup for ARCHAI™ Backend

Keep `config.yml` local because it points at your machine-specific Cloudflare credentials.
Use `config.example.yml` as the committed template.

## One-time setup:

```bash
# 1. Login to Cloudflare (opens browser)
cloudflared tunnel login

# 2. Create the tunnel
cloudflared tunnel create archai-api

# 3. Route DNS (creates archai-api.fineartmedia.tech)
cloudflared tunnel route dns archai-api archai-api.fineartmedia.tech

# 4. Create local config, then run the tunnel
cp tunnel/config.example.yml tunnel/config.yml
cloudflared tunnel --config tunnel/config.yml run archai-api
```

## To run as a service (auto-starts on boot):
```bash
sudo cloudflared service install
```

## Architecture:
```
Public visitor → archai-api.fineartmedia.tech → Cloudflare Edge → Tunnel → localhost:8787
```
