# ARCHAI Operating Model Baseline (How the Whole System Needs to Work)

This document is the practical blueprint for how ARCHAI should function across all user groups and subsystems, with baseline code placeholders already present in this repo.

## 1. Core system modes

1. Collection operations mode (staff-facing)
- Roles: collections officer, curator, admin
- Tasks: record editing, upload prep, tagging, workflow transitions, publish approvals
- APIs: `/api/objects`, `/api/upload`, `/api/vocab`, `/api/workflows`, `/api/admin/*`

2. Discovery mode (staff + future public search)
- Semantic search and filtered browsing of collection records
- APIs: `/api/search`, `/api/objects`, `/api/media/published`

3. Conversational object mode (visitor/NFC)
- NFC tag -> object page -> bounded chat -> provenance trace
- APIs: `/api/nfc/tags/:tagId`, `/api/chat/object`, `/api/media/published/:mediaId/*`

4. AV/runtime operations mode (Nodel / technicians)
- Device health, kiosk playback, runtime status, playback failures
- APIs: `/api/nodel/health`, `/api/nodel/devices` (expand later to events + restart controls)

5. FAMTEC exchange mode (separate production service, local prototype now)
- Institution listings (loan/rental), requests, technician booking discussions
- APIs (placeholder in ARCHAI backend): `/api/famtec/*`
- Production target: separate online app + DB + auth domain

6. Admin/governance mode
- Users, roles, audit logs, sync batches, policy settings
- APIs: `/api/admin/users`, `/api/admin/audit`, `/api/admin/sync-batches`, `/api/admin/permissions-matrix`

## 2. Role-based workflows (baseline)

## Collections officer
- Prepare upload metadata (RS + CA linkage)
- Generate filename / queue draft upload
- Apply vocab terms from thesaurus
- Submit object workflow from `draft` -> `review`

Baseline APIs:
- `POST /api/upload/filename`
- `POST /api/upload/draft`
- `GET /api/vocab/search`
- `POST /api/workflows/transition`

## Curator
- Review object metadata and interpretive text
- Approve object for publication (`review` -> `approved`)
- Publish NFC/media manifests (`approved` -> `published`)
- Validate bounded chat voice / prohibited claims

Baseline APIs:
- `PATCH /api/objects/:id`
- `POST /api/workflows/transition`
- `POST /api/media/published/:mediaId/publish`
- `POST /api/chat/object` (QA/testing)

## Technician / AV
- Monitor kiosk/device status and runtime failures
- Validate media playback derivatives for kiosks
- Future: restart runtimes / clear caches / inspect logs

Baseline APIs:
- `GET /api/nodel/health`
- `GET /api/nodel/devices`
- `GET /api/media/published`

## Volunteer
- Read-only records + visitor preview
- Add notes/comments (moderated)

Baseline APIs:
- `GET /api/objects`
- `POST /api/comments`

## Visitor
- NFC object page, play media, ask bounded questions, leave comments

Baseline APIs:
- `GET /api/nfc/tags/:tagId`
- `GET /api/media/published/:mediaId/manifest`
- `GET /api/media/published/:mediaId/stream` (stubbed; implement proxy/cache)
- `POST /api/chat/object`
- `POST /api/comments`

## Admin
- User/role management, audit inspection, sync batch review, pipeline rerun

Baseline APIs:
- `GET /api/admin/*`
- `POST /api/pipeline/nightly-sync`
- `GET /api/webhooks/events`

## 3. Data lifecycle (baseline)

1. Create/ingest
- Collections prepares metadata + RS upload draft
- CA and RS become canonical sources

2. Curation and review
- Object metadata/interpretation reviewed
- Workflow state tracked (`draft/review/approved/published`)

3. Publish
- Media manifest approved for visitor-safe derivative playback
- NFC page model resolves object + published media + chat affordances

4. Derivative AI processing (nightly / on-demand)
- CA + RS deltas pulled
- Cultural safety gate applied
- Embeddings generated locally
- Vectors upserted into Qdrant
- Sync batch logged

5. Visitor interaction
- Visitor taps NFC / opens local page
- Media plays from ARCHAI published endpoint (proxy/cache/redirect)
- Chat response generated with hallucination guard + provenance
- Comments stored as moderated submissions

6. Rebuild / recovery
- If AI/vector layer fails: regenerate from CA/RS canonical records
- Heritage records remain unchanged

## 4. NFC + video playback baseline

Recommended production behavior:
- NFC page model includes `publishedMedia[]`
- Visitor page renders `<video>` using ARCHAI `playbackUrl`
- ARCHAI serves local cached derivative or proxies approved RS derivative
- Never expose preservation masters to visitor pages

Current code placeholders:
- `GET /api/nfc/tags/:tagId` -> page model
- `GET /api/media/published/:mediaId/manifest` -> media metadata
- `GET /api/media/published/:mediaId/stream` -> 501 stub with implementation guidance

## 5. Source system change detection (nightly + event-driven)

ARCHAI should support both:

1. Nightly scheduled sync (baseline implemented)
- `POST /api/pipeline/nightly-sync` and scheduler cron in `src/server.js`

2. Event-driven incremental sync (baseline placeholders added)
- `POST /api/webhooks/collectiveaccess`
- `POST /api/webhooks/resourcespace`
- events stored for admin review in `GET /api/webhooks/events`

This dual model improves reliability: webhooks for near-real-time updates, nightly job as reconciliation.

## 6. Hallucination prevention operating requirements

Every conversational object should maintain:
- verified facts
- explicit unknowns
- curator-approved statements
- prohibited claims
- provenance logs per response

Baseline code:
- `src/services/hallucinationGuard.js`
- `src/services/provenanceService.js`
- `POST /api/chat/object`

## 7. What still needs real integration code (after keys)

- CollectiveAccess live adapter auth + field mapping
- ResourceSpace live adapter asset fetch + derivative mapping
- Qdrant REST upsert/search implementation
- Ollama HTTP embedding/chat implementation
- Published media stream proxy/cache endpoint implementation
- Persistence (DB) for uploads, audit logs, comments, webhook events, workflows
- Auth/SSO (currently role header for testing)

## 8. Why this baseline is useful now

Even before API keys, the repo can demonstrate:
- complete API shape
- role flows
- publish workflow states
- NFC page modeling
- media manifest concept
- hallucination prevention architecture
- nightly pipeline orchestration

That is enough to discuss scope, governance, hardware, and implementation sequencing with supervisors and collaborators.
