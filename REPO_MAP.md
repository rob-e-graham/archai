# ARCHAI Repo Map (v10.9)

This file is the working map of the current ARCHAI structure, aligned to the
GitHub `main` branch notes and operations guide.

## Core layers

### 1. Frontend app
- `ARCHAI_v10_8.html` - main single-file curator + visitor interface
- `manifest.json` / `sw.js` / `icons/` - PWA shell assets
- `ARCHAI_v10_5.html`, `ARCHAI_v6.html` - older snapshots kept as references, not current runtime targets

### 2. Backend API and proxy
- `backend-archai/src/server.js` - Express entry point
- `backend-archai/src/routes/proxy.js` - safe Qdrant/Ollama/curator proxy
- `backend-archai/src/routes/comments.js` - visitor comment API (+ oral-history verification)
- `backend-archai/src/services/moderation.js` - AI moderation for comments
- `backend-archai/src/services/verificationService.js` + `routes/verification.js` - verification tiers (institutional record / verified oral history / community response)
- `backend-archai/src/services/accessionService.js` + `routes/accession.js` - accession CMS path (verified + approved → CollectiveAccess)
- `docs/VERIFICATION_AND_ACCESSION.md` - how verification and the accession path work
- `backend-archai/src/services/curator-vectors.js` - curator vector collection build/search
- `backend-archai/src/data/db.js` - SQLite persistence layer

### 3. Collection and vector pipeline
- `backend-archai/scripts/` - harvesters for source museum APIs
- Qdrant collections currently in play:
  - `archai_pilot`
  - `archai_met`
  - `archai_va`
  - `archai_aic`
  - `archai_cma`
  - `archai_rijks`
  - `archai_europeana`
  - `archai_curator` (enriched curator layer, built on demand)

### 4. Visitor page runtime
- `nfc-pages/generate-nfc-pages.js` - page generator
- `nfc-pages/nfc-visitor-template.html` - source template
- `nfc-pages/v/` - generated visitor pages

## Support docs
- `README.md` - public project overview
- `ARCHAI_OPERATIONS_GUIDE.md` - startup, health checks, APIs, adding objects
- `REMOTE_TESTING_GUIDE.md` - Tailscale / remote device testing
- `README_LOCAL.md` - local serving notes
- `NOTICE` - IP / trademark notice

## Related but separate
- The public website wrappers such as `fineartmedia.tech/aux` and `fineartmedia.tech/archai`
  live in the separate website repo, not this one.
- This repo is the ARCHAI application/runtime repo.

## Current cleanup priorities
1. Keep the app served from `http://localhost:8000/ARCHAI_v10_8.html`, not `file://`, unless the frontend explicitly handles file-mode.
2. Remove stale MV-only and old-model wording from `ARCHAI_v10_8.html`.
3. Keep backend/API assumptions aligned with the GitHub v10.9 notes:
   - local Ollama for chat + embeddings
   - Qdrant as the object/vector layer
   - SQLite for moderated comments
   - curator vectors as the interrogation layer across objects + comments
4. Treat the single-file frontend as the current runtime, but continue moving logic toward clearer backend/data boundaries over time.

## Working mental model
- `ARCHAI_v10_8.html` is the interface
- `backend-archai/` is the operational brain and public-safe proxy
- Qdrant stores collection metadata as searchable vectors
- SQLite stores social/editorial memory such as visitor comments
- `archai_curator` is the bridge that lets curators interrogate the collection semantically
