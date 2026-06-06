# ARCHAI Progress Log

Last updated: 2026-06-05
Maintained as an active handoff note so Claude, Codex, and Rob can quickly see where the work is up to if a session ends or tokens run out.

## Current focus

Keep the system clean, fast, and aligned with the ARCHAI white paper:

- preserve raw museum metadata as the permanent heritage layer
- build a clean canonical metadata layer above it
- build translation, display text, embeddings, and interaction as regenerable layers
- keep ARCHAI and AUX.IO reading from structured derived data, not from messy raw payloads

Protect what is already working while we improve it:

- keep the current phone/browser voice path stable
- treat desktop microphone selection and Whisper capture as an additive next layer
- avoid replacing the live phone experience until a better path is genuinely proven

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

### AUX.IO generation

Latest collection harvests were run successfully and AUX.IO pages were regenerated.

Last noted AUX.IO output:
- `1519` generated visitor pages in [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)
- live source spread: MV 39, Met 42, V&A 300, AIC 150, CMA 150, Rijks 150, Europeana 150, Auckland 120, Te Papa 95, M+ 110, Brasiliana 120

### Legal cleanup and open-only backfill

This is the current highest-trust public-demo state:

- `208` rights-restricted objects and `8` unevaluated / copyright-not-evaluated objects were removed from the live public-facing stack
- Art Institute of Chicago was re-harvested public-domain only
- Europeana was re-harvested with `reusability=open`
- AUX.IO generation now purges stale pages before regeneration, so removed records cannot linger as orphaned public HTML pages

Current live outcome:

- `1520` live source objects
- `1520` curator vectors
- `1519` AUX.IO pages
- public object views now surface a normalized legal status plus raw licence / rights detail
- current audited rights mix resolves to `1091` open, `165` attribution, `59` share-alike, `205` mixed / non-commercial, `0` restricted, `0` unknown

### Rights visibility

Legal status is now being surfaced more clearly across the public-facing stack:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now normalizes raw licence / rights fields into visitor-readable statuses such as `Open access`, `Attribution required`, `Share alike`, `Restricted / mixed`, `Restricted`, and `Check source`
- the public website demo at [fineartmedia-tech-web/archai.html](/Users/robgraham/Desktop/APPS/fineartmedia-tech-web/archai.html) now shows the same legal status language on result cards and object views
- AUX.IO generation now carries legal status, reuse guidance, and raw licence / rights detail into the visitor page output instead of only a raw licence label

Important note:
- item-level rights still matter more than collection-level branding
- this normalized status layer is a display layer, not a substitute for preserving the original source licence / rights metadata

### Voice baseline to protect

Current working voice reality:

- the live speech demo is browser-native, not full Whisper/Coqui yet
- phone/browser testing is currently the strongest and most reliable path, especially for AUX.IO
- the main app object detail currently exposes explicit response languages:
  - English
  - Arabic
  - Spanish
  - French
  - Portuguese
  - Japanese
- both the main app and AUX.IO now expose playback voice choices:
  - `ARCHAI Neutral (recommended)`
  - `Browser Default`
  - browser/system voices exposed by the current device
- desktop Chrome still does not offer an in-app microphone picker in the current browser demo; it uses the browser or system default microphone

Important implementation rule:

- do not replace the current phone/browser path until recorded audio + Whisper + selectable microphone input is working as well or better

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

No matching AUX.IO template translation implementation has been completed yet in:
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
6. make ARCHAI and AUX.IO read from those clean layers

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
- AUX.IO regenerated to `951` pages with correct source collection tags in-page
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
- AUX.IO session logs
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
- regenerated AUX.IO pages in [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)

These should be reviewed carefully before any broad cleanup or commit.

## Good working rule for the next session

If time or tokens are short, continue in this order:

1. protect and document the schema
2. protect raw metadata
3. normalize source data
4. preserve existing source translations
5. derive missing translations
6. rebuild embeddings
7. only then tune ARCHAI / AUX.IO UI around the clean data layer

## If picking up quickly

Start by checking:

- [ARCHAI_PROGRESS.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_PROGRESS.md)
- [README.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/README.md)
- [ARCHAI_ISEA2026_Rob_Graham.pdf](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_ISEA2026_Rob_Graham.pdf)
- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
- [backend-archai/scripts](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts)

## Short handoff sentence

ARCHAI should remain a fast, layered, provenance-aware system: raw collection data stays clean, canonical data gets normalized, translations and embeddings are derived during ingest, and ARCHAI / AUX.IO sit above that as interpretive interfaces.

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
- AUX.IO was regenerated again to `1311` visitor pages after the source-side cleanup

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
- AUX.IO regenerated to `1071` visitor pages across `9` live collections

Workflow notes:

- [nfc-pages/generate-nfc-pages.js](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/generate-nfc-pages.js) now includes `archai_tepapa`
- AUX.IO default generation cap was lifted from `1000` to `5000`
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
- AUX.IO regenerated to `1311` visitor pages across `11` live collections

Workflow notes:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) still needed a final UI sync so Brasiliana appeared in the app shell
- [README.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/README.md) and the public website wrapper also needed post-harvest count updates

## Tokyo Museum Collection / ToMuCo status — 2026-06-03

Outcome:

- technically reachable, but held out of the live stack for now

Reason:

- the current legal / media gate did not produce a strong enough set of public-safe, image-backed records for ARCHAI or AUX.IO
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
- next cleanup pass should move this kind of source-specific normalization further upstream into onboarding so ARCHAI and AUX.IO read cleaner display metadata by default

## Speech / accessibility R&D note — 2026-06-04

Direction:

- likely `Whisper` for speech-to-text
- likely `Coqui TTS` for richer text-to-speech
- keep an eye on lighter offline deployment options such as `whisper.cpp`, `faster-whisper`, and lightweight local TTS fallbacks for kiosk installs

Why it fits:

- supports the long-term AUX.IO direction around accessibility, spoken interaction, and multilingual visitor support
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
  - AUX.IO visitor input
  - ARCHAI staff-facing conversational search
  - translation-aware response output

## Browser speech demo added to ARCHAI + AUX.IO — 2026-06-04

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) object detail now includes a lightweight browser speech demo:
  - `Start Voice Question`
  - `Stop Listening`
  - `Read Reply`
  - `Stop Audio`
- the object-detail legal status note was also moved lower in the flow so it no longer interrupts the object introduction too aggressively
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now includes the same browser speech demo controls for AUX.IO
- AUX.IO pages were regenerated from the updated template, so the controls are now live in:
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
- AUX.IO regeneration completed successfully to `1519` visitor pages
- local live page check confirmed the voice controls render on:
  - `http://127.0.0.1:8002/nfc-pages/v/NFC001.html`

Morning test points:

- main app object detail:
  - `http://127.0.0.1:8002/ARCHAI_v10_8.html`
- AUX.IO sample page:
  - `http://127.0.0.1:8002/nfc-pages/v/NFC001.html`

Next production step:

- replace browser speech with a backend voice layer:
  - Whisper / faster-whisper / whisper.cpp for speech-to-text
  - Coqui or a lighter local TTS stack for speech output

## Phone testing route for AUX.IO / main app voice demo — 2026-06-04

What was fixed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now routes backend API calls to the host Mac over LAN / Tailscale instead of incorrectly calling `localhost` from the phone
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now rewrites preview ports such as `:8000` or `:8002` to backend port `:8787`, so generated AUX.IO pages can talk back to the backend correctly from phones
- AUX.IO pages were regenerated again after the routing fix

Important truth:

- this enables **phone testing for the browser speech demo**
- it is **not yet real Whisper / Coqui backend speech**
- current voice path is still browser-native:
  - `SpeechRecognition` / `webkitSpeechRecognition`
  - `speechSynthesis`

Phone test URLs on the local network:

- main app:
  - `http://192.168.1.113:8002/ARCHAI_v10_8.html`
- AUX.IO sample page:
  - `http://192.168.1.113:8002/nfc-pages/v/NFC001.html`

Supporting research note:

- [docs/ARCHAI_R_AND_D_2026-06-04.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/ARCHAI_R_AND_D_2026-06-04.md)
  - maps ARCHAI against CMS / DAM / IIIF / preservation patterns
  - identifies born-digital / web-art directions
  - outlines the likely Whisper + Coqui production path

## Neutral voice control added to main app + AUX.IO — 2026-06-05

What changed:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html) now includes a `Playback Voice` selector in object detail
- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html) now includes the same selector for AUX.IO
- generated AUX.IO pages were rebuilt so the selector is present in:
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

Full technical audit of the browser-native speech demo across both ARCHAI main app and AUX.IO.

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
