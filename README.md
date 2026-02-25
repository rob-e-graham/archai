# ARCHAI (Prototype + Backend Scaffold)

![Status](https://img.shields.io/badge/status-v0.1--alpha-blue)
![Mode](https://img.shields.io/badge/mode-mock--ready%20%2F%20API--key--ready-0a7)
![License](https://img.shields.io/badge/license-MIT-black)

ARCHAI is a sovereign, open-source GLAM toolkit prototype for metadata-grounded conversational objects, semantic search, NFC interpretation, and institution-controlled AI infrastructure.

Status: `v0.1-alpha` (prototype UI + backend scaffold, local-first, mock-ready / API-key-ready)

Suggested GitHub repository description:
`Local-first sovereign GLAM toolkit for semantic search, conversational objects, NFC interpretation, and FAMTEC exchange workflows.`

This repository package currently includes:

- `ARCHAI_v6.html` - local-online prototype UI (Met test panel moved to Version tab)
- `ARCHAI_v6_offline_demo.html` - supervisor/email-friendly offline demo
- `FAMTEC_exchange.html` - standalone local FAMTEC exchange prototype page
- `backend-archai/` - Node backend scaffold (mock-ready now, API-key-ready for CA/RS/Qdrant/Ollama)
- `nfc-pages/` - NFC/HDMI runtime page templates and notes
- `tools/` - support notes and sanitized helper mappings
- `REPO_MAP.md` - quick guide to repo layout
- `CONTRIBUTING.md`, `LICENSE`, `.github/` templates - first GitHub repo support materials

## Quick Start (Frontend only)

Open `ARCHAI_v6_offline_demo.html` directly in a browser for an offline demo.

For local online testing (Met preview + future backend wiring):

```bash
cd "/Users/robgraham/Desktop/ARCHAI APP"
./serve_local_archai.sh
```

Then open [http://localhost:8000/ARCHAI_v6.html](http://localhost:8000/ARCHAI_v6.html).

## Screenshots (Add to GitHub README)

Suggested screenshots to add next:

- `ARCHAI_v6` curator search + object detail
- `ARCHAI_v6` visitor / NFC conversational page preview
- `ARCHAI_v6` FAMTEC Exchange posting + enquiry workflow
- `ARCHAI_v6` Upload & Ingest / Admin workflow screens

Example markdown once you export images into `docs/screenshots/`:

```md
## Screenshots
![Curator view](docs/screenshots/archai-curator-v6.png)
![Visitor NFC view](docs/screenshots/archai-visitor-nfc-v6.png)
![FAMTEC Exchange](docs/screenshots/famtec-exchange-v6.png)
```

## Quick Start (Backend scaffold)

```bash
cd "/Users/robgraham/Desktop/ARCHAI APP/backend-archai"
cp .env.example .env
npm install
npm run dev
```

API base URL defaults to `http://localhost:8787`.

## What is implemented tonight

- API scaffold for `search`, `objects`, `upload`, `nfc`, `vocab`, `chat`, `admin`, `pipeline`, `famtec`
- FAMTEC institution/post/enquiry/thread workflows (backend + UI wiring in `ARCHAI_v6.html`)
- Mock adapters for CollectiveAccess, ResourceSpace, Ollama embeddings/chat, Qdrant
- Nightly sync pipeline skeleton (CA + RS -> transform -> safety gate -> embeddings -> Qdrant upsert)
- 5-layer hallucination prevention guard + provenance logging structures
- NFC page models and a local HTML runtime endpoint (`/api/nfc/pages/:tagId`)
- Documentation for architecture, deployment and data sovereignty approach
- CHIN-profile vocabulary integration scaffold (`/api/vocab/search?profile=chin`)

## Next required inputs (API keys / institution config)

- CollectiveAccess API base URL + auth method
- ResourceSpace API base URL + key/user
- Qdrant host / key (if remote) or local container
- Ollama runtime details (chat + embedding models)
- Institution-specific cultural safety flags + restricted workflows

## Notes

- This scaffold is intentionally mock-capable so the full flow can be demonstrated before integration credentials are available.
- Permanent heritage records (CollectiveAccess + ResourceSpace) remain separated from regenerable AI derivative layers (embeddings, caches, chat responses).

## First GitHub Issues (Recommended)

- CollectiveAccess adapter implementation + field mapping
- ResourceSpace adapter implementation + derivative publishing
- Qdrant + Ollama production adapters
- NFC runtime frontend bundle (`nfc-pages/`) + kiosk mode
- FAMTEC production split (separate service + auth + storage)
- CHIN vocabulary provider adapters (AAT / Nomenclature / DOCAM)
