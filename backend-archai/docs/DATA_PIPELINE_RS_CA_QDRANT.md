# Data Pipeline: CollectiveAccess + ResourceSpace -> Vector DB (Qdrant)

## What should happen nightly (authoritative workflow)

1. Scheduler triggers nightly sync (e.g. 02:30 local time)
2. Pull changed metadata records from CollectiveAccess since last sync
3. Pull changed media/asset metadata from ResourceSpace since last sync
4. Join records by shared object identifier / CA-RS linkage field
5. Normalize into ARCHAI object payload schema
6. Apply cultural safety / restriction gate
7. Build embedding text from approved fields only
8. Generate embeddings locally (`nomic-embed-text` via Ollama)
9. Upsert vectors + payload metadata into Qdrant
10. Write sync batch audit + provenance + model version logs
11. Update UI health/status counters

## Important principle

CollectiveAccess and ResourceSpace usually do **not** push directly into Qdrant.
ARCHAI owns this pipeline so institutions control:

- what fields are indexed
- what is excluded
- which embedding model/version is used
- how provenance is recorded
- when re-indexing occurs

## Field mapping (starter)

From CollectiveAccess (canonical metadata):
- `idno` -> `objectId`
- `preferred_labels.name` / title -> `title`
- object type -> `type`
- production date -> `year/date`
- description -> `description`
- materials/technique -> `materials`
- location -> `location`
- vocab terms -> `tags`
- curatorial text -> `curatorApproved` / interpretation
- restrictions / access flags -> `restrictions`

From ResourceSpace (asset metadata):
- resource ID -> `resourceSpaceId`
- file type -> `mediaType`
- filename
- checksums
- derivative/thumb availability
- rights/license metadata
- storage/archive flags

## Video playback publishing path (NFC visitor pages)

Vector indexing is only part of the pipeline. For visitor-facing NFC pages, ARCHAI should also publish a **media playback manifest** per object.

Recommended path:

1. ResourceSpace stores preservation master + derivatives
2. ARCHAI nightly (or publish-time) pipeline reads RS derivative availability
3. ARCHAI selects approved visitor derivative(s) (e.g. MP4 web version, poster frame)
4. ARCHAI writes a published media manifest linked to object ID:
   - `mediaId`
   - `resourceSpaceId`
   - `kind` (`video`, `image`, `audio`)
   - `posterUrl`
   - `playbackUrl` (ARCHAI-served endpoint)
   - `duration`
   - `captionsUrl` (optional)
   - `rightsLabel`
   - `publishedStatus`
5. NFC page model includes this manifest so the local browser can render `<video>` safely

This keeps visitor pages stable even if ResourceSpace URL structures or auth settings change.

## ARCHAI media serving options (choose per institution)

- `Proxy stream` (ARCHAI streams RS derivative to client)
- `Signed redirect` (ARCHAI validates + redirects to RS/local URL)
- `Local cache` (ARCHAI/NAS serves cached derivative copy; best for kiosks and HDMI reliability)

For sovereignty and reliability, `Local cache` is the preferred end state for high-traffic works.

## Cultural safety gate (before embeddings)

Do not embed or index records flagged as, for example:
- `secret-sacred`
- `community-restricted`
- `embargoed` (institution policy dependent)

This scaffold enforces a starter rule in `services/vectorPipelineService.js` and `.env` (`RESTRICTED_FLAGS`).

## Qdrant payload design (recommended)

Vector point:
- `id`: stable object ID (e.g. `FAMTEC_2022_0008`)
- `vector`: embedding
- `payload`:
  - title
  - type
  - year
  - location
  - tags
  - source IDs (CA, RS)
  - embedding model/version
  - update timestamp
  - visibility / status flags

## Rebuild strategy (regenerable derivative layer)

- Keep source records unchanged in CA/RS
- Version embedding model names in sync logs
- Re-run pipeline to regenerate all vectors when changing embedding model
- Store sync batches and errors for auditability

## In this scaffold

- `POST /api/pipeline/nightly-sync` runs the full mock pipeline now
- `src/services/vectorPipelineService.js` contains the orchestration
- Adapters are mock-ready and API-key-ready
