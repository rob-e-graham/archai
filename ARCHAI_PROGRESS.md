# ARCHAI Progress Log

Last updated: 2026-06-02
Maintained as an active handoff note so Claude, Codex, and Rob can quickly see where the work is up to if a session ends or tokens run out.

## Current focus

Keep the system clean, fast, and aligned with the ARCHAI white paper:

- preserve raw museum metadata as the permanent heritage layer
- build a clean canonical metadata layer above it
- build translation, display text, embeddings, and interaction as regenerable layers
- keep ARCHAI and AUX.IO reading from structured derived data, not from messy raw payloads

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
- `archai_curator`

### Known collection counts at last check

- `archai_pilot`: 80
- `archai_met`: 135
- `archai_va`: 150
- `archai_aic`: 150
- `archai_cma`: 150
- `archai_rijks`: 150
- `archai_europeana`: 150
- `archai_auckland`: 120

Total live source objects in the current working set: `1085`

### AUX.IO generation

Europeana harvest was run successfully and AUX.IO pages were regenerated.

Last noted AUX.IO output:
- `951` generated visitor pages in [nfc-pages/v](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/v)
- live source spread: MV 39, Met 42, V&A 150, AIC 150, CMA 150, Rijks 150, Europeana 150, Auckland 120

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

- Te Papa
- Auckland Museum
- DigitalNZ
- QAGOMA
- National Museum of Australia
- WA Museum
- M+
- Tokyo Museum Collection API
- National Palace Museum
- National Taiwan Museum of Fine Arts
- Brasiliana Museus
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
- a second browser-side false-image filter now suppresses Auckland placeholder media even when the source provides a technically valid image URL

Verified locally on the website demo:

- `textile and fabric` search initially returned `36 image-ready objects`
- after false-image suppression, the visible result set settled at `33 image-ready objects`
- top result cues now read more cleanly, for example:
  - `textile`
  - `Silk (textile)`
  - `Cloth`
  - `Persia`
  - `locally loom woven textile`

Important remaining issue:

- some Auckland Museum records still expose placeholder media such as `Digital image not yet created`
- the website demo now suppresses the obvious placeholder thumbnails at render time
- the next proper step is still a source-quality filter during Auckland onboarding so false media never enters the canonical layer in the first place

Good next step after this session:

1. identify repeatable Auckland placeholder media signatures
2. suppress them in the harvester or canonical media selection logic
3. continue onboarding more regionally diverse collections for language and rights testing
