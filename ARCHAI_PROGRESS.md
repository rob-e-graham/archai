# ARCHAI Progress Log

Last updated: 2026-07-09
Maintained as an active handoff note so Claude, Codex, and Rob can quickly see where the work is up to if a session ends or tokens run out.

Primary build planning is now also summarized in [ROADMAP.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ROADMAP.md). Use that for milestone order, and use this file for detailed handoff notes.

## 2026-07-09 v11.6.7 → v11.6.11 public /app deploy pipeline, live-demo fixes, read-only demo lockdown

Publicity-readiness pass on the public `fineartmedia.tech/app` demo. Context: the
live page is a **separate copy** of the app in the `fineartmedia-tech-web` project
(served by Cloudflare Pages; backend reached via the `archai-api.fineartmedia.tech`
tunnel). It had drifted to an old build because it was hand-copied. Everything below
is on branch `claude/archai-app-improvements-lmz0n1` (draft PR #9).

Implemented:

- **Deterministic deploy — `deploy-web-app.mjs` (new).** Regenerates the website's
  `app.html` from the canonical `ARCHAI_v10_8.html`, injects `window.ARCHAI_API_BASE`,
  and re-reads the output to confirm the build marker + API base. **Refuses to publish**
  if the file has no build marker, contains two different `Build vX.Y.Z` strings (the
  exact stale-header bug we hit), or lost the API-base contract. Flags `--dry-run`,
  `--no-push`. Replaces hand-copying and stops the drift.
- **Live-demo fixes (found only in the deployed app):**
  - Converse result cards rendered as full-width stretched banners — they relied on a
    flex parent that wasn't there. Wrapped them in `.convo-obj-cards`.
  - Header showed the new build then "reverted" — a stale hardcoded version string in the
    JS that rewrites the header overwrote the static one. Aligned both.
  - Connect Collection panel was flush to the left edge — its grid had no padding while
    every other tab insets via its column classes. Added the standard 30px/42px inset.
- **Default view diversified.** The opening result list rendered image-backed objects in
  load order, so Museum Victoria (loaded first) always sat on top. `diversifyByCollection`
  interleaves objects across their source collections and randomises per render, so each
  visit opens on a fresh, varied mix.
- **Public read-only demo lockdown (safe under publicity):**
  - Backend is the boundary. `requestContext` detects public traffic (Cloudflare tunnel
    headers or a public host) and pins it to a read-only `demo` role, ignoring any
    `x-archai-role` a visitor sends. `publicDemoGuard` is a **deny-by-default allowlist**:
    the demo role may call only the read endpoints it needs (search, converse, chat, embed,
    scroll/info, AUXIO pages, health); everything else → 403. Unlisted routes fail *closed*.
    Verified with a full allow/block matrix, including a spoof attempt (`role=admin` from the
    public side stays blocked). Staff on localhost/Tailscale are untouched. Kill-switch
    `ARCHAI_PUBLIC_LOCKDOWN=off`; remote-staff override `ARCHAI_STAFF_KEY` + `x-archai-staff-key`.
  - Frontend matches: `IS_PUBLIC_DEMO` locks the UI to the `demo` role and hides staff-only
    controls (role picker, admin links, Training Mode, Reload/Run Harvesters, Manage
    Vocabularies, Select All/Export/Batch Tag, Save to Project, Edit in Directus) via
    `data-staff-only`.
- **`docs/STABILITY_AND_TESTING_PROTOCOL.md` (new).** Root-cause table, the self-verifying
  deploy, a 5-minute pre-publicity QA checklist run on the *live* URL, and rules for testing
  at scale without exposing write/publish/ingest or infrastructure paths.
- Renamed three remaining lowercase `aux.io` tag strings to `auxio`.
- Build label `v11.6.7` → `v11.6.11`.

Verification:

- `deploy-web-app.mjs` guard tested: consistent file passes; a mismatched-version file
  aborts before publishing.
- Public-demo middleware unit-tested with mock req/res across 15 cases: staff localhost and
  Tailscale → `admin`; public (by Cloudflare header and by host) → `demo`; all reads the demo
  needs → allow; all writes/admin/publish/harvest/comment-POST → 403; `role=admin` spoof from
  the public side → 403.
- Auckland "No image" confirmed as source-data coverage (records with no digitised media),
  not a rendering bug — the pipeline passes image URLs through for records that have them.

Deploy state / next steps:

- Frontend v11.6.9 is live; **v11.6.11 (diversify + lockdown) is committed and pushed but
  needs deploying**, and this deploy also requires a **backend restart** on the Mac Studio so
  `publicDemoGuard` loads. Two-step deploy documented to Rob (checkout code + restart backend,
  then `node deploy-web-app.mjs`).
- Open decision for Rob: website is now locked to the read-only public demo, so staff testing
  happens on the Mac (localhost/Tailscale) — or add a secret `?staff=KEY` unlock so Rob keeps
  full access on the website while the public stays read-only.

## 2026-07-02 v11.6.6 main-app correctness pass: escaping, convo click-through, voice retry states

A focused defect/polish pass over `ARCHAI_v10_8.html`, targeting the roadmap's voice-UX queue item and rendering correctness for international collection metadata.

Implemented:

- Added `escHTML()` and stopped using `escQ()` for plain HTML text. `escQ` escapes apostrophes as `\'` for inline-handler strings, so titles like `Traveller's cup` were rendering with stray backslashes on AUXIO cards, the project panel, comments, and the object picker. `escQ` now only remains in `onclick="fn('…')"` string contexts.
- Escaped previously-raw collection text in semantic result cards, conversational result cards, related-object cards, the AUXIO phone preview, the visitor panel, object-detail key/full metadata, and vocabulary results. Source records containing `&`, `<i>`, or stray angle brackets no longer break card layout.
- Conversational search citations now register through one `ensureConvoObject()` helper with a stable key, so clicking a cited object card in the results area reliably opens object detail (previously the thread and results area generated different random keys for records without a registration number). Registered convo objects now also carry an `_mv` payload, so object detail shows the image and metadata instead of an empty record.
- Voice UX polish (roadmap near-term queue item 4): object-detail voice now shows the live interim transcript while listening (matching the collection voice), `no-speech` errors give an explicit retry instruction in both voice panels, the "already running" state keeps the Stop button enabled instead of lying about listening state, and the object-detail status indicator now recognises its own "did not expose speech capture" message as an error state.
- Fixed a crash path in the visitor panel: `vAsk()` dereferenced `o.chat.default` but institution draft objects were created without `chat`. Drafts now get `chat`/`status` fields and `vAsk` falls back safely.
- `saveNFC()` save-feedback now targets the AUXIO editor's own button (`#nfcEditor .btn.primary`) instead of the first primary button in the document.
- `runHarvesters()` no longer relies on the implicit global `event`; the button passes itself.
- Build label bumped to `v11.6.6`.

Verification:

- Inline script extracted and passed `node --check`.
- Served via `python3 -m http.server` and `http://127.0.0.1:8000/ARCHAI_v10_8.html` returned `HTTP 200`, containing `Build v11.6.6`, `ensureConvoObject`, and the new voice retry strings.
- All remaining `escQ` call sites audited: only inline-handler JS-string contexts remain.

## 2026-06-30 AUXIO management working-set clarity + seeded demo objects

Rob could not work out how to load an object into AUXIO from the staff app, so the management panel has been simplified around a clearer test workflow.

Implemented in [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html):

- AUXIO Management now starts with `10` loaded demo records.
- Claude curated the preferred "wow range" seed list in Huggle (born-digital/game records, Wellcome art/science records, musical instruments, street art, early photo/projection media).
- Codex wired the app to prefer that curated seed list when those records are present, then fill any missing slots from image-backed safe records.
- The remaining `110` AUXIO records are intentionally empty slots ready for assignment.
- The sidebar now explains the working set: loaded demo records vs empty assignable slots.
- Empty records read as `Empty slot — assign object` instead of looking like broken data.
- Opening the AUXIO Management tab auto-selects the first empty slot when nothing is already selected.
- Empty-slot editor copy now gives a clear three-step workflow: search/browse, click `Assign`, preview/save/publish.
- Creating an institution draft with a blank title no longer throws a browser alert. It creates a clearly labelled `AUXIO ### draft object` so demonstrations can proceed quickly, then staff can rename/enrich it.
- The object picker placeholder now explains that staff can search by title, object number, institution, material, or rights.
- Search/seed matching now strips diacritics, improving matches for international records such as `écorché`.

Why this matters:

- AUXIO now feels more like a museum/gallery setup bench: a strong curated default set, then many empty tags/QRs ready to assign.
- This supports institutional testing where staff need to create visitor pages for their own objects, not only browse preloaded public demo objects.
- The public website's hosted full app demo at `/app.html` was synced to this build and retains `window.ARCHAI_API_BASE = https://archai-api.fineartmedia.tech`.

Verification:

- `ARCHAI_v10_8.html` inline script parses cleanly.
- Local static server on `http://127.0.0.1:8000/ARCHAI_v10_8.html` returned `HTTP 200`.
- Served page contains `AUX_IO_PRELOADED_COUNT = 10`, `AUX_IO_DEMO_SEED_TERMS`, `AUX_IO_EMPTY_SLOT_COUNT`, and the new empty-slot workflow language.

## 2026-06-29 v11.6.3 WIP clarity, Auckland hold, voice auto-read, and funding prep

Rob asked for a full app audit/update pass before partner and investor outreach, with clearer WIP language, tighter AUXIO behaviour, safer Auckland image handling, and RMIT-Breakthrough Victoria planning captured properly.

Implemented:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now displays a visible `Draft institutional demo / WIP` banner and a `Training Mode` overlay.
- Training Mode explains the current test flow: collection search, object review, AUXIO publishing, vocabulary/thesaurus use, CMS/DAMS connectors, and current prototype boundaries.
- Staff-side image rendering now routes through the same safer image picker across search cards, conversational result cards, object detail, source-image links, related objects, AUXIO management preview, and visitor-preview thumbnails.
- Auckland image URLs are upgraded from the low-resolution `?rendering=` routes to the 800px derivative path where possible, but records marked `media_placeholder` or `media_available: false` are held from image display.
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now auto-reads the response only when the visitor asked by voice. Typed questions remain text-first with manual `Read Reply`.
- [backend-archai/scripts/audit-auckland-placeholder-media.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/audit-auckland-placeholder-media.js) was run against Qdrant.
- Auckland audit result: `120` checked, `120` held as placeholder/unavailable, `0` restored.
- AUXIO was regenerated after the audit and now publishes `1,402` public visitor pages.
- Generated AUXIO pages no longer contain `Auckland Museum` or `Digital image not yet created`.
- Public website copy in [fineartmedia-tech-web/archai.html](/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html) now reports `1,402` rights-gated AUXIO pages and moves the `Open full app WIP` link out of the AUXIO visitor-flow panel into the staff-facing `Talk to ARCHAI` panel.
- Added [docs/ARCHAI_INSTITUTIONAL_TESTING_ROADMAP.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_INSTITUTIONAL_TESTING_ROADMAP.md).
- Added [docs/RMIT_BV_PRE_SEED_PREP.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/RMIT_BV_PRE_SEED_PREP.md), including a draft reply to Eric Hoefgen and a Lean Canvas / risk-assumption framing.

Important decision:

- Auckland remains useful as staff-searchable metadata, but should not be used as public AUXIO image media until a different Auckland media route, API access mode, or replacement harvest set provides genuinely usable images.

Next recommended app jobs:

- Move local object project lists into Directus or backend persistence.
- Add a dedicated custom harvester / CMS-DAMS connector tab.
- Add guided training tasks per role: Curator, Collections, Exhibition/AV, Interpretation, AUXIO Publisher.
- Build an institutional test script that checks collection search, object review, AUXIO publish, legal status, image zoom, voice question, and project export.
- Prepare RMIT IP&C / NoD discussion and partner validation outreach for GLAM pilots.

## Current focus

Keep the system clean, fast, and aligned with the ARCHAI white paper:

- preserve raw museum metadata as the permanent heritage layer
- build a clean canonical metadata layer above it
- build translation, display text, embeddings, and interaction as regenerable layers
- keep ARCHAI and AUXIO reading from structured derived data, not from messy raw payloads

Protect what is already working while we improve it:

- keep the current phone/browser voice path stable
- treat desktop microphone selection and Whisper capture as an additive next layer
- avoid replacing the live phone experience until a better path is genuinely proven

## 2026-06-24 website audio + AUXIO demo alignment

- Tightened the public website `Talk to ARCHAI` audio flow so captured speech automatically asks ARCHAI when recording ends or the user presses Stop.
- Added clearer live/pending audio states and active button feedback to match the smoother AUXIO voice interaction.
- Updated the website voice selector scoring to prefer modern/neutral browser voices and strongly avoid legacy novelty voices.
- Pinned the embedded AUXIO phone preview to a stable generated page (`NFC585.html`) instead of loading the lightweight website `aux.html`, while keeping the Surprise button pointed at the live random AUXIO route.
- Verified the website inline script passes `node --check` after extraction and confirmed the pinned local backend AUXIO page returns HTTP 200.

## 2026-06-22 licence update

- Replaced MPL-2.0 in `LICENSE` with All Rights Reserved notice (Copyright © 2026 Rob Graham)
- `backend-archai/package.json` licence field changed from `MPL-2.0` to `UNLICENSED`
- README and website copy update deferred to Codex pass (in progress)

## 2026-06-07 focus update

Rob asked to start moving all next goals forward rather than only discussing them.

Immediate action sequence:

- keep ARCHAI main app as the source of truth
- make app search/browse feel as strong as the public website demo
- keep result thumbnails light, then open full metadata on selected object
- keep matched themes/keywords, match score, source institution, and legal status visible
- expand AUXIO management beyond a tiny mock set while preserving safe internal function names
- track Whisper/Piper as an open-source optional accessibility layer, not a replacement for the working phone browser path yet

Work started:

- added [ROADMAP.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ROADMAP.md)
- refreshed [docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md) so it no longer describes old mock-only panels as the current state
- bumped the main app display build label to `v11.5`
- changed default browse cards to prefer image-backed demo objects while preserving the full object record when selected
- expanded AUXIO Management from a tiny sample to a larger image-backed working set generated from live loaded objects

Still next:

- connect AUXIO Management to the generated page manifest so every generated visitor page can be searched, previewed, edited, and published persistently
- add an explicit release-time rights audit command
- prototype the Whisper/Piper voice path separately from the working browser speech path

## Core architectural direction

After reviewing [README.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/README.md) and [ARCHAI_ISEA2026_Rob_Graham.pdf](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_ISEA2026_Rob_Graham.pdf), the strongest direction is:

1. `raw_records`
Store the source museum payload exactly as harvested.

2. `canonical_objects`
Normalize every object into one consistent schema:
- title
- maker / artist
- date / period
- medium / materials
- culture
- provenance
- rights / licence
- institution
- source URL
- image refs
- source language / available translations

3. `display_texts`
Keep clean public/staff-facing text separately from raw data.
- prefer institution-supplied multilingual fields when available
- only generate missing translations as derived fields
- store translation provenance:
  - translation source
  - translation model
  - translation date
  - confidence / note

4. `search_vectors`
Build embeddings from canonical and display text, not directly from inconsistent raw payloads.

5. `interactions`
Keep chat logs, visitor comments, editorial notes, and prompt-layer outputs separate again from the source record.

## Fast system principle

For speed, translation should happen primarily during ingest/enrichment, not at live query time.

Why:
- faster object pages
- faster chat
- fewer repeated LLM calls
- cleaner provenance
- easier multilingual support
- better alignment with the white paper’s permanent vs regenerable layer separation

## Important current status

### Live collections in Qdrant

- `archai_pilot`
- `archai_met`
- `archai_va`
- `archai_aic`
- `archai_cma`
- `archai_rijks`
- `archai_europeana`
- `archai_auckland`
- `archai_tepapa`
- `archai_mplus`
- `archai_brasiliana`
- `archai_curator`

### Known collection counts at last check

- `archai_pilot`: 40
- `archai_met`: 135
- `archai_va`: 300
- `archai_aic`: 150
- `archai_cma`: 150
- `archai_rijks`: 150
- `archai_europeana`: 150
- `archai_auckland`: 120
- `archai_tepapa`: 95
- `archai_mplus`: 110
- `archai_brasiliana`: 120

Total live source objects in the current working set: `1520`

### AUXIO generation

Latest collection harvests were run successfully and AUXIO pages were regenerated.

Last noted AUXIO output:
- `1519` generated visitor pages in [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)
- live source spread: MV 39, Met 42, V&A 300, AIC 150, CMA 150, Rijks 150, Europeana 150, Auckland 120, Te Papa 95, M+ 110, Brasiliana 120

### Legal cleanup and open-only backfill

This is the current highest-trust public-demo state:

- `208` rights-restricted objects and `8` unevaluated / copyright-not-evaluated objects were removed from the live public-facing stack
- Art Institute of Chicago was re-harvested public-domain only
- Europeana was re-harvested with `reusability=open`
- AUXIO generation now purges stale pages before regeneration, so removed records cannot linger as orphaned public HTML pages

Current live outcome:

- `1520` live source objects
- `1520` curator vectors
- `1519` AUXIO pages
- public object views now surface a normalized legal status plus raw licence / rights detail
- current audited rights mix resolves to `1091` open, `165` attribution, `59` share-alike, `205` mixed / non-commercial, `0` restricted, `0` unknown

### Rights visibility

Legal status is now being surfaced more clearly across the public-facing stack:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now normalizes raw licence / rights fields into visitor-readable statuses such as `Open access`, `Attribution required`, `Share alike`, `Restricted / mixed`, `Restricted`, and `Check source`
- the public website demo at [fineartmedia-tech-web/archai.html](/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html) now shows the same legal status language on result cards and object views
- AUXIO generation now carries legal status, reuse guidance, and raw licence / rights detail into the visitor page output instead of only a raw licence label

Important note:
- item-level rights still matter more than collection-level branding
- this normalized status layer is a display layer, not a substitute for preserving the original source licence / rights metadata

### Voice baseline to protect

Current working voice reality:

- the live speech demo is browser-native, not full Whisper/Coqui yet
- phone/browser testing is currently the strongest and most reliable path, especially for AUXIO
- the main app object detail currently exposes explicit response languages:
  - English
  - Arabic
  - Spanish
  - French
  - Portuguese
  - Japanese
- both the main app and AUXIO now expose playback voice choices:
  - `ARCHAI Neutral (recommended)`
  - `Browser Default`
  - browser/system voices exposed by the current device
- desktop Chrome still does not offer an in-app microphone picker in the current browser demo; it uses the browser or system default microphone

Important implementation rule:

- do not replace the current phone/browser path until recorded audio + Whisper + selectable microphone input is working as well or better

Latest UI stabilization:

- main app voice status now preserves its visual indicator instead of wiping it out during status updates
- AUXIO now shows the same listening / pending / error status dot alongside the speech text
- regenerated AUXIO pages now carry that cue through to the public visitor page output

### Europeana / Keytec

The Europeana key is already available through Keytec / macOS Keychain and was wired into the `archai` profile.

Working dry-run pattern:

```bash
node "/Users/robgraham/Desktop/APPS/Keytec API Wallet/source/bin/famtec.js" run archai -- node "/Users/robgraham/Desktop/APPS/ARCHAI APP/backend-archai/scripts/europeana-harvester.js" --limit 3 --dry-run
```

Working real-harvest pattern:

```bash
node "/Users/robgraham/Desktop/APPS/Keytec API Wallet/source/bin/famtec.js" run archai -- node "/Users/robgraham/Desktop/APPS/ARCHAI APP/backend-archai/scripts/europeana-harvester.js" --limit 150
```

## New collection targets already identified

Best immediate targets for regional balance and legally reusable data:

- Auckland Museum — live
- Te Papa — live
- M+ — live
- Brasiliana Museus — live
- Tokyo Museum Collection API — explored, held out of live onboarding
- DigitalNZ
- QAGOMA
- National Museum of Australia
- WA Museum
- National Palace Museum
- National Taiwan Museum of Fine Arts
- Qatar Museums / Qatar Digital Library
- Computer History Museum
- Trove

Important rule:
- always keep item-level rights and cultural protocol metadata
- never flatten away Indigenous / community sensitivity signals

## Partial work in progress

### Experimental translation UI started in the main app

A partial `Response Language` prototype was started in [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html).

It currently adds:
- language buttons to the object detail chat panel
- an on-demand `Translate Record` concept
- helper functions for object-detail translation handling

Important:
- this was started before the architecture review fully confirmed that translation belongs in ingest/enrichment
- it should now be treated as experimental
- do **not** blindly build more live translation UI on top of it without deciding whether to:
  - finish it as a temporary prototype, or
  - remove / replace it in favour of the ingest-time translation pipeline

This partial work currently exists only in:
- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)

No matching AUXIO template translation implementation has been completed yet in:
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)

## Research and audit docs worth keeping

These are the strongest current research / audit docs and should be treated as active working references:

- [docs/VOICE_AUDIT_2026-06-05.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/VOICE_AUDIT_2026-06-05.md)
- [docs/VOICE_BROWSER_DEMO.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/VOICE_BROWSER_DEMO.md)
- [docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md)
- [docs/ARCHAI_R_AND_D_2026-06-04.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_R_AND_D_2026-06-04.md)
- [docs/RESEARCH_INDEX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/RESEARCH_INDEX.md)
- [docs/historical-design/HISTORICAL_DESIGN_BRIEF.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/HISTORICAL_DESIGN_BRIEF.md)
- [docs/historical-design/ARCHAI_AND_HISTORICAL_DESIGN.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/ARCHAI_AND_HISTORICAL_DESIGN.md)
- [docs/historical-design/FIELD_SIGNALS_AND_KEY_TERMS.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/FIELD_SIGNALS_AND_KEY_TERMS.md)
- [docs/historical-design/INSTITUTIONAL_EXPECTATIONS_MAP.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/INSTITUTIONAL_EXPECTATIONS_MAP.md)
- [docs/historical-design/ETHICS_APPLICATION_NOTES.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/ETHICS_APPLICATION_NOTES.md)
- [docs/historical-design/HCI_CORPUS_PLAN.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/HCI_CORPUS_PLAN.md)

## Recommended next move

Build the ingest structure first before more UI:

1. define the canonical schema
2. map each source harvester into that schema
3. preserve any multilingual source fields already provided by institutions
4. generate only missing derived translations
5. build vectors from canonical / display layers
6. make ARCHAI and AUXIO read from those clean layers

## New work added in this pass

### Translation-aware onboarding scaffolding

Added:

- [backend-archai/scripts/lib/multilingual.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/lib/multilingual.js)
- [backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md)
- [backend-archai/scripts/collection-targets.json](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/collection-targets.json)

This starts a clean pattern for:

- preserving source multilingual fields
- marking source language and available languages
- keeping translation status explicit
- making future onboarding repeatable across institutions

### Europeana multilingual preservation improved

[backend-archai/scripts/europeana-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/europeana-harvester.js) now preserves multilingual structures more deliberately through:

- `title_translations`
- `description_translations`
- `creator_translations`
- `medium_translations`
- `subject_translations`
- `display_texts`
- `source_language`
- `available_languages`
- `translation_status`
- `translation_ready`

This is the first real harvester in the repo moving toward the intended onboarding model.

Verification:

- `node "/Users/robgraham/Desktop/APPS/Keytec API Wallet/source/bin/famtec.js" run archai -- node "backend-archai/scripts/europeana-harvester.js" --limit 2 --dry-run`
- completed successfully after the multilingual helper was added
- reported: `553` rich objects from `89` institutions in `20` countries

### Auckland Museum onboarding started

Added:

- [backend-archai/scripts/aucklandmuseum-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/aucklandmuseum-harvester.js)

Dry-run verification completed successfully:

- `node "/Users/robgraham/Desktop/APPS/ARCHAI APP/backend-archai/scripts/aucklandmuseum-harvester.js" --limit 8 --dry-run`
- reported: `189` suitable records after public-safe filtering
- rights filtering excluded `398` records
- sensitive / taonga filtering excluded `10` records

Important onboarding notes:

- default pass excludes `isSensitive` and `isTaonga`
- rights are filtered conservatively for public-facing use
- source multilingual fields are preserved where present
- intended as the first strong Southern Hemisphere collection in the live stack

Live onboarding completed in this pass:

- `archai_auckland` created in Qdrant with `120` public-safe records
- `archai_curator` rebuilt to `1085` vectors across all live collections
- AUXIO regenerated to `951` pages with correct source collection tags in-page
- main app collection loading updated to scroll beyond the first `200` points per collection

## Suggested schema blocks

### Raw record

- source collection
- source object id
- raw payload JSON
- harvest date
- source API endpoint
- source licence / rights notes

### Canonical object

- canonical id
- institution
- title
- artist / maker
- date / period
- object type
- medium
- materials
- discipline
- category
- culture
- place
- provenance summary
- dimensions
- registration number
- image URLs
- source URL
- source language

### Display texts

- canonical id
- language code
- title_display
- subtitle_display
- short description
- long description
- wall text
- fun fact
- did you know
- provenance narrative
- translation source
- translation model
- translation generated at

### Search vector source text

- canonical id
- language code
- embedding text
- embedding model
- embedding generated at

### Interaction layer

- visitor comments
- moderation flags
- curator notes
- staff prompts / response tone presets
- AUXIO session logs
- ARCHAI session logs

## White paper alignment summary

The white paper strongly supports:

- semantic interface layer above institutional systems
- permanent heritage layer kept separate from AI processing
- editorial / interpretation layer separate from archival record
- regenerable AI outputs
- provenance-aware derived content

This means the architecture should avoid:

- translating everything ad hoc in the browser
- writing AI-generated interpretation back into raw museum records
- mixing raw metadata with public-facing rewritten text in a single layer

## Current repo realities

There are already many unrelated working-tree changes in this repo outside this progress note.

Notable currently modified areas include:
- backend proxy / conversational search files
- Docker files and config
- documentation drafts
- regenerated AUXIO pages in [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)

These should be reviewed carefully before any broad cleanup or commit.

## Good working rule for the next session

If time or tokens are short, continue in this order:

1. protect and document the schema
2. protect raw metadata
3. normalize source data
4. preserve existing source translations
5. derive missing translations
6. rebuild embeddings
7. only then tune ARCHAI / AUXIO UI around the clean data layer

## If picking up quickly

Start by checking:

- [ARCHAI_PROGRESS.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_PROGRESS.md)
- [README.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/README.md)
- [ARCHAI_ISEA2026_Rob_Graham.pdf](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_ISEA2026_Rob_Graham.pdf)
- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
- [backend-archai/scripts](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts)

## Short handoff sentence

ARCHAI should remain a fast, layered, provenance-aware system: raw collection data stays clean, canonical data gets normalized, translations and embeddings are derived during ingest, and ARCHAI / AUXIO sit above that as interpretive interfaces.

## Website demo status — 2026-06-02 afternoon

Work completed in the public website wrapper at [archai.html](/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html):

- heading refined to `Search the collection, then ask ARCHAI what the results reveal`
- result score label changed from raw `%` to `Match %` so it reads as semantic relevance, not upload progress
- result cards now show lightweight `match cues` drawn from structured metadata
- cue cleanup added so the website shows museum-facing language rather than internal catalog or ontology noise
- a second browser-side false-image filter was added first to suppress Auckland placeholder media even when the source provided a technically valid image URL

Verified locally on the website demo:

- `textile and fabric` search initially returned `36 image-ready objects`
- after false-image suppression, the visible result set settled at `33 image-ready objects`
- top result cues now read more cleanly, for example:
  - `textile`
  - `Silk (textile)`
  - `Cloth`
  - `Persia`
  - `locally loom woven textile`

Resolved follow-up:

- repeatable Auckland placeholder assets were identified by exact media hashes
- [backend-archai/scripts/aucklandmuseum-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/aucklandmuseum-harvester.js) now filters those placeholder assets during ingest, before they reach Qdrant
- latest Auckland dry run skipped `11` placeholder-media records while still returning a full `120` clean objects
- latest live Auckland refresh skipped `15` placeholder-media records, rewrote the `archai_auckland` collection, and left `0` known placeholder hashes in the live source collection
- `archai_curator` was rebuilt to `1445` vectors after the Auckland refresh
- AUXIO was regenerated again to `1311` visitor pages after the source-side cleanup

Good next step after this session:

1. keep watching Auckland for new placeholder variants beyond the two known hashes
2. consider moving media validation into a shared onboarding helper for other mixed-rights sources
3. continue onboarding more regionally diverse collections for language and rights testing

## International source gating added

To keep expansion clean, a legal / quality gate has now been added at the planning layer:

- [backend-archai/scripts/INTERNATIONAL_ONBOARDING_MATRIX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/INTERNATIONAL_ONBOARDING_MATRIX.md)
- [backend-archai/scripts/collection-targets.json](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/collection-targets.json)

This does three important things:

- separates `approved open` from `item-rights-check` sources
- marks `non-commercial only` sources clearly for PhD/demo use
- stops us onboarding attractive but legally muddy collections too early

Verified next-priority international targets currently favour:

1. DigitalNZ
2. QAGOMA
3. National Museum of Australia
4. WA Museum
5. National Palace Museum

These were chosen for legal clarity, multilingual value, regional balance, and likelihood of producing public-safe, image-backed records.

## Te Papa onboarding completed — 2026-06-02

Added:

- [backend-archai/scripts/tepapa-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/tepapa-harvester.js)

What changed:

- Te Papa now lives in its own source collection: `archai_tepapa`
- onboarding uses guest-token auth by default, with optional `TEPAPA_API_KEY`
- metadata remains source-faithful and rights-aware
- public-facing media uses preview-first selection so item-level image restrictions stay respected
- culturally sensitive records remain excluded by default unless deliberately revisited later

Verification:

- `archai_tepapa` created in Qdrant with `120` records
- backend health now reports `1205` live source objects across `9` collections
- `archai_curator` rebuilt to `1205` vectors
- AUXIO regenerated to `1071` visitor pages across `9` live collections

Workflow notes:

- [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) now includes `archai_tepapa`
- AUXIO default generation cap was lifted from `1000` to `5000`
- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now knows about Te Papa and displays `Build v11.1 · 9 live collections`

Completed since that Te Papa pass:

1. M+ live onboarding completed
2. Brasiliana live onboarding completed
3. ToMuCo explored but held out of live onboarding on public-rights grounds

## M+ onboarding completed — 2026-06-03

Added:

- [backend-archai/scripts/mplus-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/mplus-harvester.js)

What changed:

- M+ now lives in its own source collection: `archai_mplus`
- bilingual metadata fields are preserved where exposed
- public preview media is attached from the source object pages
- source-rights context remains attached to each record rather than being flattened away

Verification:

- `archai_mplus` created in Qdrant with `120` records
- backend health now reports `1325` live source objects across `10` source collections
- `archai_curator` was expanded and rebuilt as part of the next onboarding pass

Workflow notes:

- [backend-archai/src/routes/proxy.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/src/routes/proxy.js) now knows `archai_mplus`
- [backend-archai/src/services/conversational-search.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/src/services/conversational-search.js) now includes M+ in the collection-intelligence layer
- [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) now includes M+

## Brasiliana onboarding completed — 2026-06-03

Added:

- [backend-archai/scripts/brasiliana-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/brasiliana-harvester.js)

What changed:

- Brasiliana Museus now lives in its own source collection: `archai_brasiliana`
- only public-domain / open-access records that pass the item-level rights gate are admitted
- rights-restricted items were intentionally skipped rather than softened for demo use
- all source media URLs came through as HTTPS, which keeps the public wrapper cleaner than the Auckland onboarding pass

Verification:

- `archai_brasiliana` created in Qdrant with `120` records
- rights-restricted records skipped during harvest: `1995`
- backend health now reports `1445` live source objects across `11` source collections
- `archai_curator` rebuilt to `1445` vectors
- AUXIO regenerated to `1311` visitor pages across `11` live collections

Workflow notes:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) still needed a final UI sync so Brasiliana appeared in the app shell
- [README.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/README.md) and the public website wrapper also needed post-harvest count updates

## Tokyo Museum Collection / ToMuCo status — 2026-06-03

Outcome:

- technically reachable, but held out of the live stack for now

Reason:

- the current legal / media gate did not produce a strong enough set of public-safe, image-backed records for ARCHAI or AUXIO
- this remains a possible future metadata / research source, but not a clean public demo source yet

## Main app search aligned with website demo — 2026-06-04

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now uses the backend curator-search path for classic search instead of the older direct `embed → spray-search each collection → raw merge` loop.
- classic search now shows curator-ranked, image-backed matches with `Match %` scoring rather than raw cosine values
- result cards now surface lightweight metadata match cues so the user can see why a work is appearing
- Europeana-style bilingual titles now display more cleanly in the app search and object-detail views
- Europeana-style aggregator registration strings are softened in the display layer so public-facing UI does not look like raw ingest plumbing

Verification:

- inline script parse passed after the search refactor
- live browser check against a fresh local server (`http://127.0.0.1:8002/ARCHAI_v10_8.html`) returned improved semantic search results for:
  - `textiles weaving embroidery cloth garment costume tapa`
  - `Kemane traditional musical instrument with four cords`
- object handoff from search into the object-detail tab remained functional, with legal status still visible

Notes:

- this is a display-layer cleanup, not a rewrite of the raw source record
- the screenshot showing Greek + English title text and a long Europeana aggregator id is a good reminder that raw heritage records and public display records need to stay distinct
- next cleanup pass should move this kind of source-specific normalization further upstream into onboarding so ARCHAI and AUXIO read cleaner display metadata by default

## Speech / accessibility R&D note — 2026-06-04

Direction:

- likely `Whisper` for speech-to-text
- likely `Coqui TTS` for richer text-to-speech
- keep an eye on lighter offline deployment options such as `whisper.cpp`, `faster-whisper`, and lightweight local TTS fallbacks for kiosk installs

Why it fits:

- supports the long-term AUXIO direction around accessibility, spoken interaction, and multilingual visitor support
- keeps ARCHAI aligned with the sovereignty goal by favouring local inference rather than cloud-only voice services
- creates a clean path for future neutral narration, interpretive voice, and accessible read-aloud modes

Important design note:

- keep a clear distinction between:
  - neutral accessibility narration
  - staff / curatorial interpretation
  - performative or fictional object voice

Next likely focus:

- port the same Europeana display cleanup into the website demo wrapper
- continue onboarding-quality normalization so raw aggregator strings do not surface in public-facing object views
- map a first-pass speech architecture into:
  - AUXIO visitor input
  - ARCHAI staff-facing conversational search
  - translation-aware response output

## Browser speech demo added to ARCHAI + AUXIO — 2026-06-04

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) object detail now includes a lightweight browser speech demo:
  - `Start Voice Question`
  - `Stop Listening`
  - `Read Reply`
  - `Stop Audio`
- the object-detail legal status note was also moved lower in the flow so it no longer interrupts the object introduction too aggressively
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now includes the same browser speech demo controls for AUXIO
- AUXIO pages were regenerated from the updated template, so the controls are now live in:
  - [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)
  - [nfc-pages/v/index.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v/index.html)

What it is:

- browser-native speech only for now, using `SpeechRecognition` / `webkitSpeechRecognition` and `speechSynthesis`
- this is a safe demo step for testing conversational flow without committing to backend Whisper / Coqui plumbing yet

What it is not:

- not yet Whisper-backed
- not yet Coqui-backed
- not yet guaranteed across every browser or kiosk shell
- not yet translation-aware beyond the browser's own language settings

Verification:

- inline script parse passed for:
  - [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)
  - [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
- AUXIO regeneration completed successfully to `1519` visitor pages
- local live page check confirmed the voice controls render on:
  - `http://127.0.0.1:8002/nfc-pages/v/NFC001.html`

Morning test points:

- main app object detail:
  - `http://127.0.0.1:8002/ARCHAI_v10_8.html`
- AUXIO sample page:
  - `http://127.0.0.1:8002/nfc-pages/v/NFC001.html`

Next production step:

- replace browser speech with a backend voice layer:
  - Whisper / faster-whisper / whisper.cpp for speech-to-text
  - Coqui or a lighter local TTS stack for speech output

## Phone testing route for AUXIO / main app voice demo — 2026-06-04

What was fixed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now routes backend API calls to the host Mac over LAN / Tailscale instead of incorrectly calling `localhost` from the phone
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now rewrites preview ports such as `:8000` or `:8002` to backend port `:8787`, so generated AUXIO pages can talk back to the backend correctly from phones
- AUXIO pages were regenerated again after the routing fix

Important truth:

- this enables **phone testing for the browser speech demo**
- it is **not yet real Whisper / Coqui backend speech**
- current voice path is still browser-native:
  - `SpeechRecognition` / `webkitSpeechRecognition`
  - `speechSynthesis`

Phone test URLs on the local network:

- main app:
  - `http://192.168.1.113:8002/ARCHAI_v10_8.html`
- AUXIO sample page:
  - `http://192.168.1.113:8002/nfc-pages/v/NFC001.html`

Supporting research note:

- [docs/ARCHAI_R_AND_D_2026-06-04.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_R_AND_D_2026-06-04.md)
  - maps ARCHAI against CMS / DAM / IIIF / preservation patterns
  - identifies born-digital / web-art directions
  - outlines the likely Whisper + Coqui production path

## Neutral voice control added to main app + AUXIO — 2026-06-05

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now includes a `Playback Voice` selector in object detail
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now includes the same selector for AUXIO
- generated AUXIO pages were rebuilt so the selector is present in:
  - [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)

How it works:

- `ARCHAI Neutral (recommended)` tries to choose a more modern browser voice
- it penalizes older legacy voices such as `Alex` and similar novelty / older system voices
- `Browser Default` remains available
- users can also manually choose any voice the current browser exposes

Why:

- the previous browser default could sound like an older male voice on some systems
- this gives immediate control now, before full Whisper / Coqui voice output is added

## Voice audit completed — 2026-06-05

Full technical audit of the browser-native speech demo across both ARCHAI main app and AUXIO.

See [VOICE_AUDIT_2026-06-05.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/VOICE_AUDIT_2026-06-05.md) for the complete document.

Key findings:

- browser demo flow is correct: mic → transcript → ARCHAI question → response → read aloud
- 10 issues identified, most significant:
  - Chrome SpeechRecognition sends audio to Google (not sovereign)
  - TTS voice quality varies across devices
  - no mic-active visual indicator
  - no speech privacy notice for users
- no backend voice endpoints exist yet — zero `/api/voice/*` routes
- backend currently has 17 route groups, none speech-related

Recommended production path:

1. **STT**: whisper.cpp on Mac Studio (Apple Silicon native, medium model, local, sovereign)
2. **TTS**: Piper first (lightweight, fast, clear narration), Coqui XTTS-v2 later for richer voices
3. **Routes**: `/api/voice/stt`, `/api/voice/tts`, `/api/voice/status`
4. **Frontend**: Replace Web Speech API with MediaRecorder + backend POST; replace speechSynthesis with audio element playback
5. **Fallback**: Keep browser demo as fallback when backend voice is unavailable

Privacy and ethics:

- current Chrome path sends audio to Google — contradicts sovereignty principle
- backend Whisper path keeps all audio local
- ethics application needs speech privacy disclosure before public testing
- voice cloning (Coqui) requires separate ethics clearance

Updated docs:

- [VOICE_BROWSER_DEMO.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/VOICE_BROWSER_DEMO.md) — added audit reference
- [ARCHAI_R_AND_D_2026-06-04.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_R_AND_D_2026-06-04.md) — updated speech section with current state and plan
- [RESEARCH_INDEX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/RESEARCH_INDEX.md) — added voice audit entry

## Historical design and HCI research completed — 2026-06-05

Responding to Chris Barker's supervisor notes, three substantive research documents written in `docs/historical-design/`:

### ARCHAI_AND_HISTORICAL_DESIGN.md

Maps ARCHAI against foundational HCI design principles:

- Shneiderman's Eight Golden Rules and direct manipulation (1985)
- Norman's affordances, signifiers, conceptual models (1988/2013)
- Dourish's embodied interaction and phenomenological computing (2001)
- Suchman's situated action (1987)
- Bill Brown's Thing Theory and object agency (2001–2024)
- More-than-human design movement (2024–2025 Design Museum exhibition, DRS manifesto)
- Digital repatriation and Indigenous data sovereignty (2024–2025)

Key finding: ARCHAI's combination of sovereign infrastructure, semantic interpretation, NFC-bridged physicality, first-person object voice, and institutional data governance does not appear in any system described in the current HCI or heritage technology literature surveyed.

### FIELD_SIGNALS_AND_KEY_TERMS.md

Mapped 15+ recent papers from ACM CHI, DIS, TEI, IUI, JOCCH (2021–2026) against ARCHAI's key terms. Notable:

- Wang et al. 2025 (UTS/Australian Museum): conversational AI over 1.7M specimen records — similar goals but opposite sovereignty model (cloud GPT vs local LLM)
- Su et al. 2025 (HKUST): SimViews multi-agent visitor simulation — different paradigm (multiple human perspectives vs object agency)
- JOCCH 2024 survey: tangible/embodied interactions in museums — explicitly notes screen-based devices disengage visitors from objects
- Multiple 2025 papers on affect/emotion in heritage interaction — ARCHAI's personality/tone system maps directly to this research

Field signals: growing demand for AI transparency, grounded responses, multilingual access, data sovereignty. "Object agency" and "curatorial AI" are underexplored terms — ARCHAI may be defining them.

### INSTITUTIONAL_EXPECTATIONS_MAP.md

Maps what GLAM institutions expect from digital platforms (Dublin Core, SPECTRUM, IIIF, rights management, accessibility) and where ARCHAI aligns or deliberately diverges. Identifies five risk areas for institutional adoption: AI trust, curatorial authority, IT approval, cultural sensitivity, and post-PhD sustainability.

### Ethics application updated

ETHICS_APPLICATION_NOTES.md now includes RMIT Research Ethics Platform (REP) process detail: CHEAN (low risk) vs HREC (more than low risk) review tiers. ARCHAI likely needs HREC review given AI interpretation, speech capture, visitor interaction, and institutional collaboration.

### Updated indexes

- [RESEARCH_INDEX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/RESEARCH_INDEX.md) — all new documents indexed

## AUXIO institutional workflow pass — 2026-06-07

Rob clarified the product priority: AUXIO needs to feel like a realistic museum/gallery publishing workflow, while Nodel, FAMTEC Exchange, and exhibition operations can remain later-stage modules.

Implemented in `ARCHAI_v10_8.html`:

- AUXIO editor now explains the workflow as create → assign → preview → publish.
- Staff can create a new AUXIO record from scratch.
- Placement/location is editable for gallery, QR, NFC, kiosk, map, or future spatial trigger contexts.
- Object picker now searches across all loaded objects, while opening with an image-backed shortlist for performance.
- Staff can draft a local institutional object record with title, accession, institution, type, date, image/media URL, source URL, description, and legal status.
- Draft institutional objects are added to the current app session, assigned to the AUXIO record, and shown in the phone preview.
- AUXIO export now includes institution, rights status, rights detail, visibility options, object title, object ID, location, and URL.
- Removed the placeholder `saveNFC` override so the existing backend save attempt with local confirmation is the active path again.
- Rights parser now treats `Permission required` and `Internal preview only` as restricted.

State / next step:

- This is still a prototype layer. Production should persist institution-created object records and AUXIO assignments in Directus, with raw source metadata stored separately from visitor-facing interpretation.
- Generated static AUXIO pages still come from the page generator; live generation from staff-created records remains future work.
- Nodel, FAMTEC Exchange, and exhibition operations are intentionally lower priority until AUXIO and curatorial search are more complete.

## High-intelligence AUXIO persistence pass — 2026-06-07

Follow-up review found a mismatch: the frontend `saveNFC()` function posted to `/api/nfc`, but the backend only exposed read-only AUXIO/NFC routes. That meant saves always fell back locally and were not genuinely represented in backend state.

Fixed:

- `backend-archai/src/routes/nfc.js` now exposes `POST /api/nfc`.
- Payload validation added with Zod.
- `NFC001` and `NFC-001` formats are normalized at the backend boundary.
- Optional institution draft objects are accepted with the save payload.
- `backend-archai/src/services/objectRepository.js` now supports runtime `saveObject()` and `upsertNfcTag()`.
- AUXIO saves now upsert the tag assignment, visibility settings, location, and optional institution draft object into the backend runtime repository.
- Saves are audited as `auxio.save`.
- Frontend `saveNFC()` now includes local institution draft object data when applicable and reports `Saved to backend` on success.
- Verified live against the restarted backend on `http://127.0.0.1:8787/api/nfc`: sample `NFC998` saved as `NFC-998` with draft object `institution-live-test-001` and returned `mode: runtime-session`.

Important boundary:

- This is runtime-session persistence, not durable production storage.
- Directus or SQLite-backed persistence is still required before public/institutional deployment.
- The current implementation is useful for demo realism and workflow testing: create object → assign AUXIO → preview → save to backend session.

## Born-digital manifestation and legal-source pass — 2026-06-22

Reviewed the proposed street-art, contemporary-art, and born-digital sources against authoritative licence and access information. The earlier source notes were too optimistic about the reuse of modern-art images.

Implemented:

- Expanded published media from image/video/audio into a manifestation model covering documents, 3D, software, web archives, emulation, and live external works.
- Added structured manifestation-level rights and capture provenance schemas.
- Added curator manifest registration at `POST /api/media/published`.
- Added a publication gate: media cannot publish until rights are explicitly `cleared`; WACZ captures also require capture provenance.
- Added byte-range WACZ delivery at `GET /api/media/published/:mediaId/archive` for cleared, published captures.
- Added [BORN_DIGITAL_CAPTURE_AND_REPLAY.md](./backend-archai/docs/BORN_DIGITAL_CAPTURE_AND_REPLAY.md).
- Added [CONTEMPORARY_AND_STREET_ART_SOURCE_AUDIT.md](./backend-archai/scripts/CONTEMPORARY_AND_STREET_ART_SOURCE_AUDIT.md).
- Linked the new model from the AUXIO runtime and collection onboarding documents.

Legal/source findings:

- Smithsonian item-level CC0 assets are the strongest next modern-content candidate.
- MoMA metadata is CC0, but its artwork images are expressly excluded.
- Whitney provides CC0 open datasets/API data, but media still needs item-level verification.
- Tate's CC0 dataset is an unmaintained 2014 metadata snapshot and excludes images.
- Rhizome ArtBase is a strong research partner and methodological model, not a source to republish without artist/Rhizome permission.
- Street Art Cities now publishes official monthly research datasets, but the standard exports exclude images and prohibit non-academic integration without express consent; treat it as a partnership lead rather than an automatic public-demo source.

Verification:

- JavaScript syntax checks passed for the changed backend files.
- Manifest schema validation passed.
- Live backend test: review-gated WACZ registration succeeded and publication was correctly blocked with HTTP 409.
- Live backend test: rights-cleared WACZ with capture provenance published successfully; archive delivery correctly returned 404 while the actual WACZ was absent.

Next safe increment:

1. Self-host a pinned ReplayWeb.page viewer on an isolated replay origin.
2. Capture one institution-owned or artist-permissioned pilot work with Browsertrix.
3. Persist manifests and rights reviews in the institutional CMS/DAMS instead of runtime memory.
4. Build the Smithsonian harvester with a strict item-level CC0 media gate.

## National Gallery of Art onboarding — 2026-06-22

- Verified the NGA collection dataset is CC0 and updated approximately daily.
- Confirmed linked media has a separate item-level `openaccess` field.
- Added `nga-harvester.js`, which streams the large CSV exports without cloning the roughly 5 GB repository.
- The harvester joins objects to IIIF images using the NGA TMS object ID.
- It accepts only `published_images.openaccess=1` and explicitly counts/excludes `openaccess=0` fair-use derivatives.
- Preserves source UUIDs, stable object links, IIIF bases, assistive image descriptions, dimensions, provenance, attribution, and Wikidata IDs.
- Registered NGA with the legal harvest bot as a verified, ready source.
- Full dry run passed: 68,592 open-access image records found, 60,135 fair-use/restricted image records rejected, and 63,200 image-backed objects eligible for rights-safe selection.
- No NGA records have been written to Qdrant yet; the source is validated and ready for a deliberate live onboarding run.

## Rights-cleared WACZ capture and durable replay — 2026-06-22

Completed the first end-to-end born-digital preservation test using only ARCHAI/FAMTEC-owned public demonstrators.

Implemented:

- Added `backend-archai/scripts/capture-born-digital.sh` with an explicit `--rights-cleared` safety gate.
- Pinned Browsertrix Crawler `1.12.4` for reproducible WACZ capture.
- Added persistent media manifests at `MEDIA_MANIFEST_FILE`; runtime registrations now survive backend restarts.
- Self-hosted pinned ReplayWeb.page `2.4.6` assets from the ARCHAI backend.
- Added an isolated replay page at `GET /api/media/published/:mediaId/replay`.
- Retained byte-range archive delivery at `GET /api/media/published/:mediaId/archive`.
- Added owned mock records for the ARCHAI and AUXIO public demonstrators.

Verified local preservation packages:

- `archai_public_2026-06-22.wacz`
  - SHA-256: `660aee3eae32441ef6a5a9afafd42c8b644dd643b66339fc99b49e7addee979c`
- `auxio_public_2026-06-22.wacz`
  - SHA-256: `67c536fc9563f6a7f4a87ce4231ce3e867be000a75b5cbccd25cacaf2af95f70`

Verification completed on a temporary backend instance:

- manifest registration returned HTTP 201;
- rights-cleared publication returned HTTP 200;
- replay page and self-hosted replay assets returned HTTP 200;
- WACZ range request returned HTTP 206;
- both manifests remained published after a backend restart;
- persisted checksums matched the captured WACZ packages.

Important boundary:

- Captured WACZ files and runtime manifests remain under ignored local preservation storage and are not committed to Git.
- The active `:8787` backend should be restarted only after the collection-integration merge is complete.
- Public replay remains limited to manifestations whose item-level rights are explicitly `cleared`.

## Nineteen-source integration, media audit, and QR output — 2026-06-22

Integrated Claude's collection branch after preserving the pre-merge generated output in a named Git stash: `pre-claude-collection-integration-2026-06-22`.

Collection state:

- 19 connected source collections in Qdrant
- 3147 staff-searchable records
- Smithsonian and RAWG KeyTec credentials confirmed without exposing key values
- Smithsonian refreshed to 145 item-level CC0 records
- National Gallery of Art onboarded with 150 records; 60,135 fair-use/restricted image rows were excluded by `openaccess=1`
- RAWG retained as attributed API display only; poster/sticker/postcard redistribution disabled
- Tate corrected to CC0 metadata-only; its GitHub licence explicitly excludes images
- Getty legacy media held after all 200 constructed URLs failed live image checks
- QAGOMA retained as metadata-only pending formal media/API access

Added `backend-archai/scripts/audit-public-media.js`:

- checks HTTP response, real image content, known placeholders, and canvas CORS;
- records `media_available`, `media_canvas_safe`, audit status, content type, and timestamp;
- report-only by default and writes only with `--apply`;
- Qdrant snapshots were taken for RAWG, Tate, Wellcome, street art, Getty, and QAGOMA before the rights migration.
- per-source results and follow-up decisions are documented in `backend-archai/docs/PUBLIC_MEDIA_AUDIT_2026-06-22.md`.

Audit result:

- 2357 image URLs checked
- 1884 available
- 473 hidden as broken, blocked, placeholder, or non-image responses
- 1284 canvas-safe
- 790 metadata-only records
- notable holds: Getty 200/200 broken; AIC 150/150 currently blocked by a Cloudflare image challenge; Brasiliana 113/120 returned 404

AUXIO result:

- 1380 visitor pages regenerated from working, display-cleared media
- 504 otherwise available records held by the public-media rights policy
- 440 pages explicitly support reusable derivative outputs
- A4, A2, A0, 100 mm sticker, and A6 postcard layouts all draw a QR code to the current AUXIO page
- QR generation is self-hosted from the MIT-licensed `qrcode-generator` library and fails closed rather than producing a QR-less asset
- save/print formats are grouped under a compact `Save / print with QR` disclosure below the share controls
- `nfc-pages/aux-id-map.json` now reserves a permanent numeric AUXIO ID for every canonical record; a second full regeneration produced identical registry and representative page hashes, so existing physical QR/NFC links no longer drift when collection order changes

Street-art source policy:

- the six municipal public-art feeds remain a metadata-only staff collection until item-level media rights are available;
- Street Art Cities' official monthly JSON/CSV exports are suitable for academic analysis, but exclude images and require express consent for non-academic integration;
- Street Art Cities is recorded as a research-partnership target rather than harvested into the public demo;
- RapidAPI wrappers and secondary listings are discovery leads only until source authority, provenance, and item-level rights are verified directly.

EaaSI integration boundary:

- added an optional EaaSI adapter and health check through `/api/integrations`;
- OAI-PMH `Identify` is used only for configured-node discovery;
- no session-launch URL is invented without an institutional node/API contract;
- architecture and partnership path documented in `backend-archai/docs/EAASI_INTEGRATION.md`.

Dependency audit:

- upgraded `node-cron` from 3.0.3 to 4.5.0, removing the vulnerable legacy `uuid` dependency;
- `npm audit --omit=dev` now reports three moderate findings inherited through ReplayWeb.page's current `@webrecorder/wabac` XML parser;
- npm's automated remediation would force ReplayWeb.page back to 1.0.0, so it was deliberately not applied; replay remains locally hosted, rights-gated, and should be upgraded when Webrecorder publishes a compatible dependency fix.

## Public website demo console and hosting boundary - 2026-06-23

The ARCHAI project page has been reorganised into one coherent three-path demo instead of separate, competing interfaces:

- **Search Collections:** all 19 connected source collections are visible as live-count scope tabs, with `All sources` as the default;
- **Talk to ARCHAI:** whole-collection conversation uses the same Curatorial, Collections, Exhibition, and Interpretation response lenses as the app;
- **Visit AUXIO:** an embedded phone preview links directly to the visitor experience and random-object path.

Voice behavior on the website follows the stable phone-first design:

- browser speech recognition fills the question field but never submits without review;
- listening, error, ready, and read-aloud states are explicit;
- browser voices remain selectable, with a neutral automatic preference;
- typed questions remain available when browser speech recognition is unsupported.

Scoped search was moved behind the existing curator-search endpoint. `POST /api/proxy/curator/search` now accepts an optional allowlisted `collection` value and applies `_source_collection` filtering server-side. This replaces the previous two-request browser sequence of embed plus arbitrary Qdrant search, reduces rate-limit pressure, and keeps public search on a purpose-built route.

Verification completed:

- backend JavaScript and website inline JavaScript syntax checks passed;
- the launchd backend was restarted successfully;
- a live Met-only query returned eight Met results through the local API test;
- the website returned 50 public image-ready Met cards for `portrait painting`;
- direct whole-collection conversation returned a grounded response with cited source objects;
- desktop and 390 px mobile layouts showed no page-level horizontal overflow;
- source tabs remain horizontally scrollable and conversation controls stack on mobile;
- AUXIO loaded inside the embedded phone preview.

Hosting decision:

- keep `fineartmedia.tech/archai` as the public integrated demo;
- build a separate read-only app demo rather than publishing the staff app unchanged;
- keep the operational staff app behind Tailscale, institutional VPN, or Cloudflare Access until server-side authentication and deny-by-default authorisation are complete.

The full hosting boundary and launch checklist are in [docs/PUBLIC_APP_DEMO_HOSTING.md](./docs/PUBLIC_APP_DEMO_HOSTING.md). The key blocker is that the current prototype request context defaults unauthenticated requests to `admin`; client-side role switching is not a security boundary.

## Street-art image recovery and rights split - 2026-06-23

Street/public-art records were present in `archai_streetart` but looked absent from the website because the public demo correctly filtered to image-ready records. The initial street-art harvest had also missed Brussels' current image field name (`url_image`) and treated all municipal street/public-art feeds as metadata-only.

What changed:

- updated `backend-archai/scripts/streetart-harvester.js` to read Brussels `url_image.url`, English/French/Dutch titles and descriptions, source record URLs, and media credit strings;
- corrected Brussels dataset licence to CC BY 4.0 using the dataset metadata reported by the Opendatasoft API;
- enabled `media_public_display_allowed` only for Brussels records with image URLs;
- preserved `poster_download_allowed: false` for street art, so source-authorised display is separated from derivative poster/postcard reuse;
- kept Vancouver and Melbourne records searchable as metadata/source-link records until direct image URLs and media rights are clearer;
- noted that the previous NYC Open Data endpoint currently returns 404 and needs endpoint repair before it should be considered part of the live street-art source set.

Operational result:

- `archai_streetart` remains at 439 records;
- 139 Brussels street-art records now have public-display image URLs and CC BY 4.0 rights text;
- 300 remaining public-art records remain metadata-only;
- `archai_curator` was rebuilt successfully with 3147 records;
- AUXIO was regenerated with 1519 visitor pages, including 139 Public Street Art pages.

Website behaviour:

- if a scoped source returns metadata but no public image-ready records, the public demo now shows a clear metadata-only panel with title, maker/place/date, media-rights basis, and source-record link instead of appearing broken;
- image-enabled Brussels street-art searches now return image cards in the normal website search grid.

## Legal harvest refresh and AUXIO cleanup - 2026-06-23

Rob asked to start the next legal harvests and keep the media gates strict. Codex posted the working state to Claude in Huggle so the next pass can continue without resetting or flattening the dirty worktree.

Harvests and verification:

- `backend-archai/scripts/legal-harvest-bot.js --report` showed National Gallery of Art, Smithsonian, and Getty as the ready queue.
- NGA was dry-run checked, then refreshed live: 150 open-access image-backed records were upserted into `archai_nga`.
- Smithsonian loaded `SMITHSONIAN_API_KEY` from KeyTec/macOS keychain and refreshed live: 145 item-level CC0 records were embedded into `archai_smithsonian`; 1742 records without CC0 media were skipped.
- Getty was dry-run checked only. The current pass found no usable Open Content image URLs, so Getty remains held until image extraction is repaired from explicit source data.
- `archai_curator` was rebuilt successfully to 3147 records.
- A Smithsonian search through the curator endpoint returned source-specific results, confirming the refreshed collection is searchable.

Media publication gate:

- `backend-archai/scripts/audit-public-media.js --apply --concurrency 20` was run after harvest.
- Current audit totals: 2496 supplied image URLs checked; 2026 healthy; 470 hidden or broken; 1426 canvas-safe; 651 metadata-only.
- AUXIO was regenerated after the audit and now publishes 1522 clean visitor pages.
- The generator skipped 651 metadata-only records, 470 unavailable/placeholder media records, and held 504 otherwise healthy records from AUXIO because the source/publication policy is not yet explicit enough.
- Poster/postcard/download controls remain fail-closed: only 439 records currently pass both `poster_download_allowed` and `media_canvas_safe`.

Current AUXIO page breakdown after regeneration:

- Auckland Museum: 120 pages.
- Brasiliana Museus: 7 pages.
- Cleveland Museum of Art: 150 pages.
- Europeana: 150 pages.
- The Metropolitan Museum of Art: 135 pages.
- Museums Victoria: 39 pages.
- National Gallery of Art, Washington: 150 pages.
- RAWG Video Games Database: 193 pages.
- Rijksmuseum, Amsterdam: 150 pages.
- Smithsonian Institution: 139 pages.
- Wellcome Collection: 150 pages.
- Public Street Art: 139 pages.

Follow-ups for Claude/Codex:

- Repair Getty image extraction from item-level Open Content fields; do not manufacture URLs.
- Repair Brasiliana broken image URLs from source data; only 7 of 120 are currently public-display healthy.
- Investigate the six hidden Smithsonian URLs.
- Replace or proxy the AIC image route only if an officially supported, rights-safe browser-readable path exists.
- Keep Vancouver/Melbourne/other municipal public-art records metadata/source-link only unless image rights are explicit.
- Keep the website positioned as a public demo and the main ARCHAI app as the primary staff-facing system.

## Born-digital manifestation player demo - 2026-06-23

Added a small rights-safe synthetic CD-ROM/media-art demo to prove the interactive manifestation path without using copyrighted legacy software or operating-system assets.

- Added `/born-digital` static access-copy serving in the backend.
- Added `GET /api/media/published/:mediaId/play` for published and rights-cleared interactive/html/emulation manifests.
- Registered `cdrom_window_1997_demo` in `backend-archai/data/runtime/media-manifests.json`.
- Created `backend-archai/data/runtime/born-digital/cdrom-window-1997/index.html` as an original 1990s-style interactive stand-in.
- Documented the demo in `backend-archai/docs/BORN_DIGITAL_CAPTURE_AND_REPLAY.md`.

Test URL after backend restart:

```text
http://localhost:8787/api/media/published/cdrom_window_1997_demo/play
```

This is a placeholder for the real workflow: institution-owned, artist-permissioned, openly licensed, or public-domain software/media works should be registered as manifestations with explicit rights and access policy before public replay.

Added a first real open-source creative-coding manifestation:

- Imported an `Epicycloid` p5.js sketch from Fernando's `creative-coding` repository under the MIT licence.
- Preserved upstream attribution and licence text in the access-copy folder.
- Registered `epicycloid_2017_open_demo` as `interactive`, `published`, and `rights.status=cleared`.
- Verified `/api/media/published/epicycloid_2017_open_demo/play` returns 200.

Test URL:

```text
http://localhost:8787/api/media/published/epicycloid_2017_open_demo/play
```

## WACZ replay access-copy fallback - 2026-06-23

Rob tested the replay links and the full ReplayWeb.page route did not reliably replay the captured HTML, even though the WACZ files, page metadata, screenshots, and archive download endpoints were valid.

What changed:

- Added `GET /api/media/published/:mediaId/capture-image` to extract the verified `urn:view:` PNG screenshot from the WACZ screenshot WARC.
- Changed `GET /api/media/published/:mediaId/replay` into a stable ARCHAI access-copy page showing the captured screenshot, original source link, rights label, capture timestamp, WACZ download, and a separate ReplayWeb beta link.
- Moved the experimental full ReplayWeb loader to `GET /api/media/published/:mediaId/replay-web`.
- Kept `GET /api/media/published/:mediaId/play` routing web archives to the stable access-copy page, while interactive HTML manifests still open in the sandboxed player.

Verified locally:

```text
http://localhost:8787/api/media/published/auxio_public_2026-06-22/play
http://localhost:8787/api/media/published/archai_public_2026-06-22/capture-image
http://localhost:8787/api/media/published/cdrom_window_1997_demo/play
http://localhost:8787/api/media/published/epicycloid_2017_open_demo/play
```

Current limitation:

- The underlying ReplayWeb beta route can load the WACZ metadata and timestamp, but still reports "Archived Page Not Found" for the captured page iframe. Treat full dynamic replay as QA/investigation, not the public demo path, until the WACZ lookup mismatch is resolved.

## NASA media-lab harvest quarantined from core GLAM app - 2026-06-23

Rob queried whether NASA fits the core GLAM institution feel. Decision: keep NASA useful for media/playback R&D, but do not treat it as a normal museum/gallery source in the main ARCHAI app or public AUXIO demo.

What happened:

- Added `backend-archai/scripts/nasa-harvester.js` for official NASA Image and Video Library records.
- Dry-run passed with logo/patch/insignia records skipped.
- Live-ingested 120 NASA public-media records into `archai_nasa` for lab testing: mostly archival space images and video records.
- Audio-only search currently returned long podcast-style records without the same clean preview/playback gate, so no audio records were embedded in the top-up pass.
- Changed the registry entry from automatic `ready` to `media_lab` with `media_lab_not_public_demo`.
- Added an explicit `archai_nasa` exclusion to `backend-archai/src/services/curator-vectors.js` so future curator rebuilds do not accidentally merge NASA into the core museum/gallery search layer.

Current boundary:

- `archai_nasa` may be used for media-player, video, caption, and science/technology playback tests.
- It is not in the hardcoded main app collection list, not in AUXIO generation, and not in automatic legal-harvest runs.
- Promote individual NASA records only if the project intentionally needs a science/media example and the UI clearly labels it as a specialist media-lab source, not a museum/gallery institution.

## Runtime alignment/refactor audit - 2026-06-23

Completed a stabilisation pass after the WACZ replay/access-copy work.

What changed:

- moved WACZ ZIP/WARC screenshot extraction into `backend-archai/src/services/waczAccessService.js`
- kept `backend-archai/src/routes/media.js` focused on routing and presentation
- added `backend-archai/scripts/smoke-test-runtime.js`
- added `npm --prefix backend-archai run test:smoke`
- created `docs/APP_ALIGNMENT_AUDIT_2026-06-23.md` as the current handover/audit snapshot

Verified:

- backend health is OK
- Ollama is online on `qwen2.5:14b`
- Qdrant is live
- runtime reports `3267` collection objects, `3147` curator vectors, `21` Qdrant collections, and `6414` total vectors
- AUXIO manifest reports `1522` pages
- local runtime smoke tests passed
- public stability checks passed for backend tunnel, ARCHAI demo, AUX page, and Dark Plates
- local static app server is reachable at `http://localhost:8000/ARCHAI_v10_8.html`

Known drift to clean next:

- app header/source labels still contain hardcoded counts and should read from `/api/health`
- full ReplayWeb dynamic replay remains beta; stable access-copy pages are the public-safe route
- Codex browser tooling could not open local `localhost` app URLs in this session even though shell checks confirmed the app server is reachable

## AUXIO collapsible panel layout demo - 2026-06-24

Rob suggested using the Dark Plates-style dropdown pattern to reduce visual load on AUXIO pages while keeping the visitor experience warm and object-led.

What changed:

- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now wraps heavier utility sections in collapsible panels:
  - Share / save
  - Legal status / source
  - Object record
  - Visitor response
- Related objects remain visible by default because they support exploration and feel important to the visitor flow.
- The object image, title, source, story, and "Ask this object" chat remain immediate rather than hidden.
- AUXIO pages were regenerated from the updated template after the layout pass.

Local test:

```text
http://localhost:8000/nfc-pages/v/NFC001.html
```

Design note:

- This is a first interface demo, not a final lock-in. The next pass should test it on phone, especially whether the collapsed legal/object-record sections still feel discoverable enough for curators and serious users.

## Auckland Museum image rescue - 2026-06-25

Rob flagged blurry Auckland Museum images on AUXIO, especially `AUXIO 001 / NFC001` where a tiny table image was being stretched inside the mobile visitor page.

Root cause:

- Auckland's normal media URLs such as `https://api.aucklandmuseum.com/id/media/v/{id}?rendering=standard.jpg` and `?rendering=original.jpg` return very small derivatives for many records, often around 70px wide.
- The source metadata and rights were valid; the problem was the derivative route, not the AUXIO layout.

Fix applied:

- Updated [backend-archai/scripts/aucklandmuseum-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/aucklandmuseum-harvester.js) so future Auckland harvests use the IIIF-style derivative path:
  - thumbnails: `/full/300,/0/default.jpg`
  - page display: `/full/800,/0/default.jpg`
- Updated all 120 existing `archai_auckland` Qdrant payloads in place, without re-embedding the records.
- Regenerated AUXIO pages from the updated payloads.

Verification:

- `NFC001.html` now uses `https://api.aucklandmuseum.com/id/media/v/40382/full/800,/0/default.jpg` for the hero image.
- Sample Auckland derivative tested with `sips`: `800 x 800`.
- AUXIO public manifest still reports `1522` pages, so Auckland was rescued rather than removed.

Next quality gate:

- Extend the public media audit to store measured image dimensions and hold any future records below a minimum display threshold, so low-resolution derivatives cannot slip into public AUXIO again.

## IIIF helper and first harvester alignment - 2026-06-25

After the Auckland image rescue, Rob asked whether IIIF could become a broader ARCHAI feature rather than a one-off image fix.

What changed:

- Added [backend-archai/scripts/lib/iiif.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/lib/iiif.js), a shared helper for IIIF Image API URL normalisation.
- Added [backend-archai/docs/IIIF_INTEGRATION_NOTES.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/docs/IIIF_INTEGRATION_NOTES.md).
- Wired the helper into the first IIIF-capable harvesters:
  - Auckland Museum
  - Art Institute of Chicago
  - National Gallery of Art, Washington
  - Rijksmuseum
  - V&A
  - Wellcome Collection
- Backfilled the current Qdrant payloads with explicit IIIF availability fields where detectable:
  - `archai_auckland`: 120 records
  - `archai_aic`: 150 records
  - `archai_nga`: 150 records
  - `archai_rijks`: 150 records
  - `archai_va`: 300 records
  - `archai_wellcome`: 150 records
  - Total: 1,020 records

New payload pattern for future harvests:

```text
media_thumbnail
media_medium
media_large
media_iiif_base
media_iiif_info_url
media_iiif_available
```

Why it matters:

- ARCHAI can now distinguish ordinary static images from zoomable/region-addressable IIIF images.
- This opens the path for "Look closer" mode, curatorial region annotations, citation of visual evidence, and richer AUXIO object experiences.
- Rights remain separate from IIIF availability: an object can be IIIF-capable but still not public-display or derivative-download cleared.

Next build:

- Add IIIF availability to the media audit and app UI.
- Prototype a small AUXIO "Look closer" view for IIIF objects.
- Add staff-side region annotations as an ARCHAI overlay, not as edits to source records.

## AUXIO Look Closer prototype - 2026-06-25

Built the first visible IIIF feature into generated AUXIO visitor pages.

What changed:

- Updated [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) with a `Look closer` button, lightweight modal viewer, zoom controls, and source-image open link.
- Updated [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) so the viewer only appears when a record has `media_iiif_available`, `media_iiif_base`, and a large/display image.
- Regenerated [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v) from the current Qdrant payloads.

Current regeneration result:

- `1522` public AUXIO visitor pages generated.
- `651` metadata-only records skipped.
- `470` unavailable or placeholder-media records skipped.
- `504` records held from AUXIO pending item-level media clearance.
- `NFC001.html` now has `Look closer` and uses the Auckland IIIF route `https://api.aucklandmuseum.com/id/media/v/40382/full/800,/0/default.jpg`.

Verification:

```bash
node --check nfc-pages/generate-nfc-pages.js
node --check /tmp/archai-nfc-template-inline-sanitized.js
git diff --check -- nfc-pages/generate-nfc-pages.js nfc-pages/nfc-visitor-template.html ARCHAI_PROGRESS.md
node nfc-pages/generate-nfc-pages.js
rg -n "Look closer|iiifViewer|OBJECT_IIIF|IIIF_LOOK|full/800|Open image" nfc-pages/v/NFC001.html
```

Notes:

- This is deliberately simple: browser-native zoom via a scaled image in an overflow canvas, not a full OpenSeadragon-style deep zoom viewer yet.
- Next sensible step is a measured image-quality audit that records dimensions and automatically suppresses low-resolution derivatives from public AUXIO while keeping their metadata searchable in ARCHAI.

## AUXIO index and IIIF viewer polish - 2026-06-27

Rob tested the new Auckland/IIIF pages and found two UX issues:

- Zooming into the `Look closer` image did not allow mouse/touch panning.
- The AUXIO index still showed Auckland's "Digital image not yet created" placeholders because the index preferred `media_thumbnail` before the repaired `media_medium`.

Fixes applied:

- Updated [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) so `Look closer` uses real layout zoom plus pointer-event drag panning. Mouse, trackpad, and touch should now be able to drag around a zoomed image.
- Updated [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) so the generated AUXIO index:
  - prefers `media_medium` over `media_thumbnail` for list thumbnails;
  - includes a simple client-side search box across AUXIO number, title, source, registration, and collection;
  - centers the directory in a narrower shell with larger thumbnails so it reads less like a raw export.
- Regenerated [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v).

Verification:

```bash
node --check nfc-pages/generate-nfc-pages.js
node --check /tmp/archai-nfc-template-inline-sanitized.js
node nfc-pages/generate-nfc-pages.js
curl -s 'http://127.0.0.1:8000/nfc-pages/v/' | rg -n "idx-search-input|full/800|AUXIO 001|data-search"
curl -s 'http://127.0.0.1:8000/nfc-pages/v/NFC001.html?akl=800' | rg -n "bindIiifPan|pointerdown|pointermove|dragging|touch-action"
```

Current result:

- Public AUXIO page count remains `1522`.
- `AUXIO 001` on the index now uses `https://api.aucklandmuseum.com/id/media/v/40382/full/800,/0/default.jpg`.
- The generated object page contains `bindIiifPan`, `pointerdown`, `pointermove`, and `dragging` support.

## App / website object-view alignment - 2026-06-27

Rob reviewed the AUXIO and staff object views before the Monday partner/investor mailout and identified three alignment issues:

- the AUXIO `Look closer` affordance was visually too bulky under the hero image;
- the visitor-facing `IIIF info` control opened raw IIIF JSON, which reads as broken to non-technical users;
- the staff/demo object views showed legal/admin detail before the interpretive conversation, making the workflow feel less like a curatorial review.

Fixes applied:

- Updated [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) so `Look closer` is a compact floating pill over the image area instead of a large full-width block.
- Updated [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) to remove the raw `IIIF info` link from public AUXIO pages while keeping `Open image`, zoom, reset, and drag-to-pan guidance.
- Regenerated [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v) so all `1522` public AUXIO pages carry the new visitor controls.

## Curatorial object actions and Auckland media hold - 2026-06-29

Rob flagged that staff-facing object records need the same practical actions as AUXIO: share/save/audio controls, plus a way for curators and collections staff to build object lists or project sets. Rob also showed Auckland objects still displaying the "Digital image not yet created" placeholder through the supposedly repaired IIIF route.

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now adds object-level staff actions in the detail view:
  - `Share / Copy`
  - `Save to Project`
  - `Read Summary`
  - existing source image / source record / Directus edit links remain visible.
- A new local browser-based `Project List / Selected Objects` panel was added to staff object detail. It is intentionally a prototype workspace for shortlists, collection review batches, interpretation drafts, or exhibition planning. Production persistence should move to Directus.
- [fineartmedia-tech-web/archai.html](/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html) mirrors the same object actions in the public website demo modal so the demo and main app describe the same workflow.
- [backend-archai/scripts/aucklandmuseum-harvester.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/aucklandmuseum-harvester.js) now knows the new high-resolution Auckland placeholder hash: `3af9d4afa5fe4cc79ccbe168ad66e978`.
- Added [backend-archai/scripts/audit-auckland-placeholder-media.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/audit-auckland-placeholder-media.js), a repeatable Qdrant audit that hashes Auckland media URLs and marks placeholder images as `media_available: false`.

Audit result:

- Auckland checked: `120` records.
- Auckland held as placeholders: `120` records.
- Real Auckland media restored: `0` records.

Resulting AUXIO state:

- AUXIO was regenerated after the Auckland hold.
- Public visitor pages now publish `1,402` records.
- Auckland remains searchable in the staff database but is no longer published as public AUXIO image pages until a genuinely usable image route or better harvest set is found.
- `AUXIO 001-119` are intentionally absent for now because the permanent ID registry must not silently move physical QR/NFC IDs onto different objects.

Verification:

- Main app inline script parses cleanly with Node `vm.Script`.
- Website demo inline script parses cleanly with Node `vm.Script`.
- Generated AUXIO pages no longer contain `Auckland Museum` or `Digital image not yet created`.
- Updated [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) so the actual app object detail view now presents image, key metadata, and object interrogation before expandable `Full Metadata Record` and `Legal Status / Source Use` sections.
- Mirrored the same workflow direction into the public website demo object modal in `/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html`.
- Added `/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/app.html` as a hosted WIP copy of the full ARCHAI app shell with `window.ARCHAI_API_BASE` pointing at `https://archai-api.fineartmedia.tech`.

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node --check /tmp/nfc001.js
node --check /tmp/archai-app-inline.js
node --check /tmp/famtec-archai-inline.js
node --check /tmp/app.html.js
curl -I http://127.0.0.1:8000/nfc-pages/v/NFC001.html
rg -n "IIIF info|Zoomable source image" nfc-pages/v/NFC001.html nfc-pages/v/NFC674.html
```

Current result:

- `IIIF info` no longer appears in generated visitor pages.
- `Look closer` remains available for IIIF-capable objects, now with clearer `Drag to pan when zoomed` wording.
- Staff/demo object review sits above legal/admin details.
- Full app hosting is now available as a WIP static shell at `/app.html`; it still depends on the ARCHAI backend API for live search/chat behaviour.

## AUXIO seeded demo and print-material redesign - 2026-06-30

Rob tested the full hosted app and found the AUXIO create-demo workflow still failing on the public website with the old "Add an object title..." alert. Claude also asked that the first loaded AUXIO demo records be the curated "wow" set rather than generic random records.

Fixes applied:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now uses Build `v11.6.5`.
- The AUXIO startup set now resolves against a curated seed list where possible:
  - Disco Elysium
  - Pentiment
  - Dwarf Fortress
  - A crucified ecorche
  - Interior of the base of the human skull
  - Aseroe rubra
  - Crocodile whistle
  - Bass Ophicleide
  - Black-Figure Hydria / Theseus
  - Jef Aerosol / Warhol / Basquiat / Twiggy
  - Photographie Lunaire / Tycho
  - Old Father Thames lantern slide
- Seed matching now strips diacritics so titles like `écorché` can match plain `ecorche`.
- Creating a new institutional AUXIO draft no longer requires a title. If the title is blank, the app creates a safe placeholder such as `AUXIO 003 draft object`, assigns it, and lets staff rename/enrich it.
- The public website WIP copy at `/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/app.html` was synced from the current full app and keeps `window.ARCHAI_API_BASE = 'https://archai-api.fineartmedia.tech'`.

Print/export redesign:

- Added [docs/AUX_IO_PRINT_DESIGN_PRINCIPLES.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/AUX_IO_PRINT_DESIGN_PRINCIPLES.md) as a compact design brief for posters, postcards, and stickers.
- Reworked [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) print exports around an archival broadside system:
  - warm paper ground instead of a flat black screen-style poster;
  - object-first image hierarchy;
  - stronger QR/access block;
  - lighter, clearer metadata;
  - matching poster, postcard, and sticker family.
- Regenerated [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v) so public AUXIO pages carry the new export template.
- Added first approval previews:
  - [docs/design-previews/aux-io-poster-approval-preview.png](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/design-previews/aux-io-poster-approval-preview.png)
  - [docs/design-previews/aux-io-postcard-approval-preview.png](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/design-previews/aux-io-postcard-approval-preview.png)
  - [docs/design-previews/aux-io-sticker-approval-preview.png](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/design-previews/aux-io-sticker-approval-preview.png)

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node -e "/* generated page inline JS parse check */"
node -e "/* website app.html inline JS parse check */"
git diff --check
git -C /Users/robgraham/Desktop/APPS/fineartmedia-tech-web diff --check
```

Notes:

- The raw `nfc-visitor-template.html` still contains generator placeholders, so parse checks should be run against generated pages such as `nfc-pages/v/NFC1308.html`, not the unfilled template itself.
- The print previews are approval images, not the only outputs. Live A0/A2/A4/postcard/sticker PNGs are still generated client-side from each AUXIO object page.

## AUXIO black public-space print family - 2026-06-30

Rob pushed the print direction away from a quiet gallery handout toward public/street use: posters may sit in streets, laneways, pop-ups, or non-gallery contexts, so the image must act as the hero and the QR must remain instantly scannable.

Design decisions applied:

- Replaced the warm paper print-export system with a black ARCHAI/AUXIO street-gallery system.
- Kept the object image as the dominant visual in the A4/A2/A0 poster exports.
- Added shared print helpers so the aqua border is drawn around the actual rendered image rectangle, not around the empty black image holder. This matters for portrait, landscape, square, and awkward archival-image ratios.
- Kept production QR codes black-on-white for reliability, but tightened the white block with a deliberate black border and aqua outer stroke.
- Reworked A6 postcard and 100 mm sticker exports to match the same system.
- Metadata now sits directly below or beside the object image depending on format, with AUXIO carrying the deeper record.
- Generated multiple approval previews across different object types:
  - anatomical print
  - ancient ceramic fragment
  - lunar photograph
  - born-digital/game image

Files changed:

- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
- [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)
- [docs/AUX_IO_PRINT_DESIGN_PRINCIPLES.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/AUX_IO_PRINT_DESIGN_PRINCIPLES.md)

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node - <<'NODE'
const fs=require('fs');
for (const file of ['nfc-pages/v/NFC1308.html','nfc-pages/v/NFC273.html','nfc-pages/v/NFC926.html']) {
  const html=fs.readFileSync(file,'utf8');
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
  scripts.forEach((code)=>new Function(code));
  console.log('ok', file, scripts.length);
}
NODE
git diff --check
```

Remaining design QA:

- Test printed or screen-displayed QR scanning under real phone conditions.
- If inverted QR is desired aesthetically, keep it as an alternate only after outdoor/low-light scan tests.

## AUXIO print legibility correction - 2026-07-01

Rob reviewed the A0/A2/A4, postcard, and sticker exports and identified the key production issue: the print materials were still behaving too much like a screen layout. Text was too small from distance, some labels sat too close to the border, sticker images were undersized, and the access language implied tap/NFC/map even though the printed materials are QR-led.

Changes applied:

- Reframed print copy as QR-first: `SCAN QR TO TALK TO THIS IMAGE`.
- Removed small `tap / NFC / map / spatial trigger` print labels from poster callouts.
- Increased poster title, object-description, metadata, QR-caption, and footer sizes for distance readability.
- Added larger safe margins so text and QR blocks do not sit against the outer frame.
- Enlarged the QR block and kept black-on-white QR for reliable scanning, with a tight black inner border and aqua outer rule.
- Increased image-border breathing room so the aqua rule surrounds the actual rendered artwork without choking the image.
- Enlarged sticker hero images and sticker QR blocks so the sticker functions as a public access marker rather than a miniature web page.
- Increased postcard title, description, metadata, and access text while keeping the A6 layout balanced.
- Regenerated [nfc-pages/v/](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v) from the updated template.
- Final tuning pass simplified the poster top edge to brand/provenance only, removed the small top-right access label, increased the main CTA again, and moved the registration into the information band so no important print text sits close to the border.

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node - <<'NODE'
const fs = require('fs');
const files = ['nfc-pages/v/NFC120.html','nfc-pages/v/NFC273.html','nfc-pages/v/NFC635.html','nfc-pages/v/NFC926.html','nfc-pages/v/NFC1308.html','nfc-pages/v/NFC2163.html','nfc-pages/v/NFC3147.html','nfc-pages/v/index.html'];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
  for (const code of scripts) new Function(code);
  console.log('ok', file, scripts.length);
}
NODE
git diff --check
```

Next visual QA:

- Refresh an AUXIO object page before exporting new proofs, because the PNGs are generated client-side from the current HTML.
- Test one portrait object, one landscape object, and one square/awkward archival object across A0/A4/postcard/sticker.
- Confirm QR scan reliability from street/poster distance before exploring inverted or stylised QR options.

## AUXIO print system final tightening - 2026-07-01

Second pass after Rob's close-read of the proof set.

Key corrections:

- Increased poster safe margins again so the top labels, title, QR block, and footer no longer sit close to the page edge.
- Removed the small top-right `SCAN / TAP / ASK` style language from the poster system. Print assets are now explicitly QR-led.
- Top brand now reads as a quiet header: `ARCHAI`, `QR VISITOR ACCESS`, and `AUXIO`.
- Enlarged poster title, source metadata, description excerpt, QR caption, URL, and footer copy for distance readability.
- Reduced poster hero height slightly to create a stronger information band below the image without shrinking the image into a label.
- Increased image-border breathing room so the aqua rule frames the actual rendered image rather than hugging image content or empty black space.
- Enlarged sticker hero region and tightened sticker typography/QR placement so it behaves like a public access marker.
- Increased postcard safe margins, title, metadata, description, and QR access copy.
- Reworded small-format access copy to `SCAN QR TO TALK TO THIS IMAGE`.

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node - <<'NODE'
const fs = require('fs');
const files = ['nfc-pages/v/NFC120.html','nfc-pages/v/NFC273.html','nfc-pages/v/NFC631.html','nfc-pages/v/NFC926.html','nfc-pages/v/NFC1308.html','nfc-pages/v/NFC2163.html','nfc-pages/v/NFC3147.html','nfc-pages/v/index.html'];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
  for (const code of scripts) new Function(code);
  console.log('ok', file, scripts.length);
}
NODE
git diff --check
```

Result:

- 1,402 AUXIO pages regenerated from the current 19-collection stack.
- Runtime scripts validated on a mixed sample of Brasiliana, Cleveland, Europeana, Wellcome, public street art, and index pages.
- Next proof should be exported fresh from the browser because old Downloads PNGs are stale.

## AUXIO print geometry fix - 2026-07-02

Rob reviewed the next proof set and found three production blockers: postcard source/rights text was colliding, QR codes were visually off-centre in their cards, and the sticker QR could overlap the hero image. The print system now has stricter layout rules rather than fixed-position assumptions.

Changes applied:

- QR modules are now centred inside the QR card even when the QR library renders a slightly smaller module grid than the requested square.
- Metadata values now fit within their own columns, preventing source and rights text from overlapping.
- The postcard metadata grid now uses a real gutter between source/rights columns.
- Sticker QR was reduced and forced below the hero-image frame so it no longer collides with the artwork.
- Sticker hero/text spacing was rebalanced so the image remains dominant while the title/institution/QR prompt stay readable.
- Postcard title, metadata, description, and access text were slightly enlarged while retaining safe margins.
- Print copy remains QR-first: `SCAN QR TO TALK TO THIS IMAGE`.
- Regenerated 1,402 AUXIO pages from the current 19-collection stack.
- Follow-up cleanup after Claude's pass: replaced remaining `SCAN QR TO START THE CONVERSATION` print labels with `SCAN QR TO TALK TO THIS IMAGE`, then regenerated and revalidated the AUXIO pages.

Verification:

```bash
node nfc-pages/generate-nfc-pages.js
node - <<'NODE'
const fs = require('fs');
const files = ['nfc-pages/v/NFC120.html','nfc-pages/v/NFC273.html','nfc-pages/v/NFC631.html','nfc-pages/v/NFC926.html','nfc-pages/v/NFC1308.html','nfc-pages/v/NFC2163.html','nfc-pages/v/NFC3147.html','nfc-pages/v/index.html'];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
  for (const code of scripts) new Function(code);
  console.log('ok', file, scripts.length);
}
NODE
git diff --check
```

Next visual QA:

- Export fresh A0/A4/postcard/sticker PNGs from the browser before judging; older files in Downloads will not reflect these geometry changes.
- Test one portrait image, one landscape image, one square-ish object, and one long-title object.
- If a single artwork still feels cramped, tune the format rules rather than manually positioning an individual object.
