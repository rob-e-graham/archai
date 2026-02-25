# ARCHAI Architecture (Practical Build View)

## Three-layer principle

1. Heritage Foundation Layer (Permanent)
- CollectiveAccess (collection records / canonical metadata)
- ResourceSpace (digital assets / DAMS)
- Human-authored curatorial records, artist statements, conservation docs
- Never modified by AI outputs

2. Derivative Processing Layer (Regenerable)
- Qdrant vectors and payloads
- Embedding outputs (`nomic-embed-text` or similar)
- Local LLM generated responses / caches
- Pipeline logs / sync batches / provenance traces
- Can be rebuilt entirely from Layer 1 source records

3. Interface Layer
- ARCHAI UI (roles: curator, collections, technician, volunteer, visitor, admin)
- NFC object pages / local kiosks / HDMI fullscreen pages
- FAMTEC exchange (architecturally separate production service, proxied/linked from ARCHAI)

## Core services in this scaffold

- `routes/`: API surface the frontend can target immediately
- `adapters/`: external integrations (CA, RS, Qdrant, Ollama) behind swappable interfaces
- `services/vectorPipelineService.js`: nightly dump -> transform -> embed -> upsert
- `services/hallucinationGuard.js`: 5-layer response gating
- `services/provenanceService.js`: response trace logging
- `services/nfcService.js`: object/tag -> fullscreen page model mapping

## Production split (recommended)

- ARCHAI app + backend on local institutional infrastructure
- FAMTEC on separate online service with separate DB and auth domain
- Shared identity via SSO / token bridge, not shared DB
