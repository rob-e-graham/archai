# ARCHAI Backend Scaffold (`backend-archai`)

Node/Express backend scaffold for the ARCHAI system.

## Goals

- Run now in mock mode (no API keys)
- Preserve final API contract shape for frontend integration
- Support local-first, sovereign deployments
- Keep AI derivative layers regenerable and separate from canonical collection records

## Implemented Endpoints (mock-ready)

- `GET /api/health`
- `GET /api/integrations`
- `POST /api/search`
- `GET /api/objects`
- `GET /api/objects/:id`
- `PATCH /api/objects/:id`
- `GET /api/nfc/tags`
- `GET /api/nfc/tags/:tagId`
- `GET /api/nfc/pages/:tagId` (fullscreen-friendly HTML runtime page)
- `GET /api/media/published`
- `GET /api/media/published/:mediaId/manifest`
- `GET /api/media/published/:mediaId/poster`
- `GET /api/media/published/:mediaId/thumb`
- `GET /api/media/published/:mediaId/stream` (stub)
- `POST /api/media/published/:mediaId/publish`
- `POST /api/upload/draft`
- `POST /api/upload/filename`
- `GET /api/upload/queue`
- `GET /api/vocab/search`
- `GET /api/nodel/devices`
- `GET /api/nodel/health`
- `POST /api/chat/object`
- `POST /api/pipeline/nightly-sync`
- `GET /api/workflows`
- `POST /api/workflows/transition`
- `POST /api/webhooks/resourcespace`
- `POST /api/webhooks/collectiveaccess`
- `GET /api/webhooks/events`
- `GET /api/admin/users`
- `GET /api/admin/audit`
- `GET /api/admin/sync-batches`
- `GET /api/admin/permissions-matrix`
- `GET /api/famtec/listings`
- `GET /api/famtec/requests`
- `GET /api/famtec/threads`
- `GET/POST /api/comments`

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Mock mode behavior

If API credentials are missing, adapters return mock data but keep the same route contracts.

- CollectiveAccess adapter returns mock object metadata records
- ResourceSpace adapter returns mock asset records
- Embedding adapter returns deterministic mock vectors
- Qdrant adapter stores vectors in memory
- Chat adapter returns metadata-grounded mock responses

## Role headers (for UI testing)

Set `x-archai-role` to one of:

- `admin`
- `curator`
- `collections`
- `technician`
- `volunteer`
- `visitor`

## Architecture docs

See `docs/`:

- `docs/ARCHITECTURE.md`
- `docs/NFC_RUNTIME.md`
- `docs/DATA_PIPELINE_RS_CA_QDRANT.md`
- `docs/HALLUCINATION_PREVENTION.md`
- `docs/DEPLOYMENT_LOCAL_SOVEREIGN.md`
- `docs/OPERATING_MODEL_BASELINE.md`
- `docs/FAMTEC_EXCHANGE_WORKFLOWS.md`
- `docs/GITHUB_RELEASE_CHECKLIST.md`
