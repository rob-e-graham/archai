# Deployment (Local Sovereign / Institution-Controlled)

## Minimum reference deployment

- 1 x backend host (Node API, adapters, scheduler)
- 1 x Qdrant host (can be same machine for pilot)
- 1 x Ollama inference host (can be same machine for pilot, GPU preferred)
- 1 x NAS (hot/warm depending scale) for media + exports
- HDMI kiosk devices / mini PCs for local displays

## Network posture

- Backend, Qdrant, Ollama on local LAN/VLAN
- No outbound collection payloads to cloud APIs
- Optional outbound links only for open datasets (Met test) and updates
- FAMTEC production service separate from heritage systems

## Suggested services (pilot)

- `archai-backend` (this scaffold)
- `qdrant`
- `ollama`
- `reverse proxy` (Caddy/Nginx)
- `frontend static server` (ARCHAI UI + NFC pages)

## Backups

- CA and RS remain canonical sources
- Qdrant snapshots (regenerable but useful)
- Pipeline logs / provenance logs
- Config backups (`.env`, mapping files, restriction policy)

## Data sovereignty notes

- Keep CA/RS and ARCHAI backend on institution-owned infrastructure
- Run embeddings and chat models locally (Ollama or equivalent local runtime)
- Treat AI derivative outputs as disposable/regenerable
