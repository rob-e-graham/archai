# ARCHAI v0.1-alpha (Independent FAMTEC release)

First public prototype + backend scaffold release for ARCHAI.

## Highlights

- `ARCHAI_v6.html` local-online prototype with role-aware interface and backend-aware fallbacks
- `ARCHAI_v6_offline_demo.html` email/share-friendly offline demo build
- `FAMTEC_exchange.html` standalone FAMTEC prototype page
- `backend-archai/` Node/Express backend scaffold (mock-ready, API-key-ready)
- NFC visitor page runtime/page-model scaffolding
- Nightly vector pipeline skeleton (CollectiveAccess + ResourceSpace -> safety gate -> embeddings -> Qdrant)
- Hallucination prevention baseline (5-layer guard + provenance logging)
- FAMTEC institution/post/enquiry/thread workflow APIs and UI integration
- CHIN-profile vocabulary integration scaffold (`/api/vocab/search?profile=chin`)

## Current status

This is a **prototype + integration scaffold** release.

- Many workflows are functional with local mock data
- Frontend and backend are linked for core demo flows
- External adapters (CollectiveAccess, ResourceSpace, Qdrant, Ollama, CHIN vocab providers) are scaffolded and need credentials/mappings to become production-real

## Included major components

- Semantic search prototype (local mock + backend route shape)
- Conversational object prototype (metadata-grounded mock responses with provenance)
- NFC assignment and visitor page modeling
- Upload/ingest queue prototype + backend draft route
- Admin health/pipeline triggers (prototype + backend)
- FAMTEC Exchange posting, enquiry, and messaging (baseline)

## Next priorities

1. CollectiveAccess adapter implementation + field mapping
2. ResourceSpace adapter implementation + media derivative publishing
3. Qdrant and Ollama production adapters
4. Persistent backend storage (replace in-memory runtime state)
5. Dedicated NFC runtime frontend bundle
6. FAMTEC production split (separate service, auth, storage)
7. CHIN provider adapters (AAT / Nomenclature / DOCAM)

## Notes

ARCHAI follows a local-first / sovereign architecture:

- Canonical heritage records remain in CollectiveAccess + ResourceSpace
- AI derivative layers (embeddings, cached responses, indexes) are regenerable
- Cultural safety gating is applied before vector indexing
