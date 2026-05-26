# ARCHAI Repo Map (First GitHub Drop)

## Frontend prototypes
- `ARCHAI_v6.html` - main local-online prototype (backend-aware, fallback-capable)
- `ARCHAI_v6_offline_demo.html` - self-contained email/offline demo build
- `FAMTEC_exchange.html` - separate local FAMTEC page prototype

## Backend scaffold
- `backend-archai/` - mock-ready API + pipeline + docs
- `backend-archai/src/routes/` - API endpoints
- `backend-archai/src/adapters/` - CA / RS / Qdrant / Ollama integration layers
- `backend-archai/src/services/` - workflow, pipeline, hallucination guard, media publish, FAMTEC

## NFC runtime
- `nfc-pages/` - dedicated NFC/fullscreen page templates (future bundle)

## Tools (FAMTEC ecosystem)
- `tools/safechat/` → SafeChat crisis detection module — detects distress in chat, surfaces verified helplines (34 countries), injects safety overrides into LLM prompts
- `tools/keytec/` → KeyTec API Wallet — local-first API key manager, stores in macOS Keychain, injects at runtime via `famtec run <profile> -- <cmd>`
- `tools/RESOURCE_SPACE_COLLECTIVEACCESS_FIELD_MAPPING.md` - field mapping notes

## Tunnel (public access)
- `backend-archai/tunnel/config.yml` - Cloudflare Tunnel config for `archai-api.fineartmedia.tech`

## Docs and support
- `README.md` - project overview + quick start
- `README_LOCAL.md` - local UI quick start
- `REPO_MAP.md` - this file
