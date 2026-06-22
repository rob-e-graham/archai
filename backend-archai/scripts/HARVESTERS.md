# ARCHAI Harvesters

Each harvester fetches objects from a museum API, generates embeddings via Ollama, and stores them in Qdrant. After harvesting, run the AUX.IO page generator to create conversational pages.

## Available Harvesters

### Existing (live)

| Harvester | Institution | Country | Objects | Images | API Key | Licence |
|-----------|------------|---------|---------|--------|---------|---------|
| `met-harvester.js` | The Metropolitan Museum of Art | 🇺🇸 USA | 470K+ | ✅ | None | CC0 |
| `aic-harvester.js` | Art Institute of Chicago | 🇺🇸 USA | 131K+ | ✅ IIIF | None | CC0 |
| `cleveland-harvester.js` | Cleveland Museum of Art | 🇺🇸 USA | 41K+ | ✅ | None | CC0 |
| `va-harvester.js` | Victoria & Albert Museum | 🇬🇧 UK | 1.2M+ | ⚠️ Down | None | Mixed |
| `rijksmuseum-harvester.js` | Rijksmuseum | 🇳🇱 Netherlands | 800K+ | ✅ IIIF | None | CC0 |
| `europeana-harvester.js` | Europeana (4000+ institutions) | 🇪🇺 Europe | Millions | ✅ | 🔑 Free | Mixed |
| `aucklandmuseum-harvester.js` | Auckland Museum | 🇳🇿 New Zealand | 1M+ searchable | ✅ | None | Mixed / per-record |
| `tepapa-harvester.js` | Museum of New Zealand Te Papa Tongarewa | 🇳🇿 New Zealand | 500K+ searchable | ✅ Preview-first | Optional / guest fallback | Metadata CC BY 4.0 · images mixed |
| `mplus-harvester.js` | M+, Hong Kong | 🇭🇰 Hong Kong | Public GraphQL catalog | ✅ Preview-first | None | CC0 metadata · source rights apply |
| `brasiliana-harvester.js` | Brasiliana Museus | 🇧🇷 Brazil | Large Tainacan platform | ✅ | None | Public domain / open-access, item-checked |

**Museums Victoria** objects are in the `archai_pilot` collection (harvested separately via the pipeline).

### New — Modern Art, Design, Science & Street Art

| Harvester | Institution / Source | Type | Images | API Key | Licence |
|-----------|---------------------|------|--------|---------|---------|
| `smithsonian-harvester.js` | Smithsonian SAAM + Cooper Hewitt | Modern American art + design | ✅ CC0-flagged only | 🔑 Free (api.data.gov) | CC0 |
| `tate-harvester.js` | Tate Collection | British art, Turner → early Modernism | ✅ pre-1920 PD works | None | CC0 |
| `streetart-harvester.js` | Vancouver + Brussels + NYC open data | Street art & public murals | ✅ per-source | None | OGL / CC BY / Public Domain |
| `getty-harvester.js` | J. Paul Getty Museum, Los Angeles | Greek/Roman antiquities, European painting, manuscripts, photography | ✅ CC0 open content | None | CC0 |
| `wellcome-harvester.js` | Wellcome Collection, London | Anatomy, science, medicine, natural history, medical art | ✅ per-item open licence | None | CC BY 4.0 / CC0 |
| `qagoma-harvester.js` | QAGOMA — Queensland Art Gallery \| GOMA | Asia-Pacific contemporary, Aboriginal & Torres Strait Islander, Australian art | ✅ per-item open licence | None | CC BY 4.0 (QLD Open Data) |

**Legal status of new harvesters:**

- **Smithsonian**: CC0 verified at item level via API `usage.access` field. Only CC0-flagged records are harvested. Images and metadata cleared for public display including commercial use. Free key required — register at api.data.gov.
- **Tate**: Data and public-domain-work images are CC0 (Tate Open Access, 2019). Harvester applies a hard `year < 1920` filter so every harvested object and its image is safely in the public domain. No contemporary in-copyright works are included.
- **Street Art**: Three open-data city portals, each with explicit open licences. Attribution is stored per-record in the Qdrant payload. No key required.
- **Getty**: CC0 via the Getty Open Content Program (~140,000 images). Harvester checks `is_open_content` flag per object. No key required.
- **Wellcome**: CC BY 4.0 or better, verified per item via the `license.id` API field. Only records with an open-licence image are harvested. Attribution is stored in payload. No key required.
- **QAGOMA**: Queensland Government open data (CC BY 4.0). Downloaded as a CSV via the CKAN API. Only image-backed records without explicit copyright restrictions are harvested. Image reuse should be rechecked at item level before large-scale AUX.IO display expansion.

**Sources NOT suitable for image display (metadata-only):**

| Source | Reason | Use case |
|--------|--------|----------|
| Whitney Museum | CC0 covers metadata only; images require separate licensing | Semantic search enrichment |
| MoMA (GitHub dataset) | CC0 metadata only; images via Art Resource licence only | Semantic search enrichment |
| Harvard Art Museums | Non-commercial use only; 2-week cache limit | Research context only |

## Quick Start

### Legal gate first

Before adding or refreshing public-demo collection data, run the legal harvest bot. It reads `collection-targets.json`, checks each target's policy and verification state, and only runs harvesters that pass the current legal / quality gate.

```bash
# Report only from the repository root: shows ready/live/review/blocked queues
npm --prefix backend-archai run harvest:legal

# Direct script form from this folder
node legal-harvest-bot.js --report

# Dry-run approved targets, including live refreshes
node legal-harvest-bot.js --run-ready --include-live --dry-run --limit 20

# Refresh selected approved live targets
node legal-harvest-bot.js --targets=tepapa,mplus,brasiliana --run-ready --include-live --limit 120
```

Do not bypass this gate for public-facing ARCHAI or AUX.IO demos. Raw/source research experiments can be broader, but the public stack needs item-level rights and media quality checks.

### Individual harvesters

```bash
# No API key needed
node met-harvester.js --limit 150
node aic-harvester.js --limit 150
node cleveland-harvester.js --limit 150 --min-richness 6

# No key needed (OAI-PMH)
node rijksmuseum-harvester.js --limit 150

# Need free API key
EUROPEANA_API_KEY=xxx node europeana-harvester.js --limit 150

# Southern Hemisphere onboarding
node aucklandmuseum-harvester.js --limit 120
node tepapa-harvester.js --limit 120
node mplus-harvester.js --limit 120
node brasiliana-harvester.js --limit 120

# Modern art + design + science (no key needed unless noted)
node tate-harvester.js --limit 150              # No key needed
node streetart-harvester.js --limit 300         # No key needed (Vancouver + Brussels + NYC)
node getty-harvester.js --limit 200             # No key needed (CC0 Open Content)
node wellcome-harvester.js --limit 150          # No key needed (CC BY 4.0)
node qagoma-harvester.js --limit 200            # No key needed (QLD Open Data)
SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --limit 200   # Free key: api.data.gov

# Street art — single source
node streetart-harvester.js --source vancouver --limit 100
node streetart-harvester.js --source brussels --limit 100
node streetart-harvester.js --source nyc --limit 100

# Smithsonian — specific unit
SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --unit CHSDM --limit 100  # Cooper Hewitt only
SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --unit SAAM --limit 100   # American Art only

# Getty — specific department
node getty-harvester.js --department "Antiquities" --limit 100

# Wellcome — specific work type (k=pictures, l=3d objects)
node wellcome-harvester.js --worktype k --limit 100

# QAGOMA — specific region
node qagoma-harvester.js --region "Asia Pacific" --limit 100

# Dry run (no writes)
node cleveland-harvester.js --dry-run
node aucklandmuseum-harvester.js --dry-run
node tepapa-harvester.js --dry-run
node mplus-harvester.js --dry-run
node brasiliana-harvester.js --dry-run
node tate-harvester.js --dry-run
node streetart-harvester.js --dry-run
node getty-harvester.js --dry-run
node wellcome-harvester.js --dry-run
node qagoma-harvester.js --dry-run
SMITHSONIAN_API_KEY=xxx node smithsonian-harvester.js --dry-run
```

## After Harvesting

Regenerate AUX.IO pages:
```bash
cd ../nfc-pages
node generate-nfc-pages.js --limit 300
```

## Qdrant Collections

| Collection | ID Offset | Institution |
|-----------|-----------|-------------|
| `archai_pilot` | 0+ | Museums Victoria |
| `archai_met` | 1,000,000+ | The Met |
| `archai_va` | 2,000,000+ | V&A |
| `archai_aic` | 3,000,000+ | Art Institute of Chicago |
| `archai_cma` | 4,000,000+ | Cleveland Museum of Art |
| `archai_rijks` | 5,000,000+ | Rijksmuseum |
| `archai_europeana` | 6,000,000+ | Europeana |
| `archai_auckland` | 7,000,000+ | Auckland Museum |
| `archai_tepapa` | 8,000,000+ | Te Papa Tongarewa |
| `archai_mplus` | 9,000,000+ | M+, Hong Kong |
| `archai_getty` | 10,000,000+ | J. Paul Getty Museum |
| `archai_wellcome` | 11,000,000+ | Wellcome Collection |
| `archai_brasiliana` | 12,000,000+ | Brasiliana Museus |
| `archai_qagoma` | 13,000,000+ | QAGOMA (Queensland Art Gallery / GOMA) |
| `archai_smithsonian` | 14,000,000+ | Smithsonian (SAAM + Cooper Hewitt) |
| `archai_tate` | 15,000,000+ | Tate Collection |
| `archai_streetart` | 16,000,000+ | Street Art (Vancouver · Brussels · NYC) |

> **Note on ID offsets**: The `archai_smithsonian`, `archai_tate`, and `archai_streetart` harvesters were initially documented with conflicting offsets (2M, 3M, 5M — same as older collections). The table above assigns them new non-conflicting offsets in the 14–16M range. Update the harvester `ID_OFFSET` constants if you are re-harvesting from scratch into a fresh Qdrant instance. Existing production data at legacy offsets remains valid until a full re-harvest.

## Data Richness

Cleveland Museum objects are scored by conversational richness — fields like `did_you_know`, `fun_fact`, and `wall_description` make for the most interesting AUX.IO conversations. The `--min-richness` flag filters for objects with enough data to sustain a meaningful dialogue.

## API Key Management (KeyTec)

Store keys in KeyTec instead of .env files:
```bash
famtec add europeana           # Stores as EUROPEANA_API_KEY in macOS Keychain
famtec profile attach archai europeana
famtec run archai -- node europeana-harvester.js
```

## API Key Registration

- **Rijksmuseum**: No key needed (uses OAI-PMH endpoint)
- **Europeana**: https://pro.europeana.eu/page/get-api (free registration)
- **Te Papa**: optional registered key or built-in guest-token fallback for development
- **M+**: public GraphQL endpoint currently works without separate registration for metadata access
- **Brasiliana Museus**: public Tainacan / WordPress API, no key required
- **Smithsonian Open Access**: https://api.data.gov/signup (free registration, instant) — set `SMITHSONIAN_API_KEY`
- **Tate**: no key required (GitHub dataset)
- **Street Art (Vancouver/Brussels/NYC)**: no key required (open city data portals)

## International Expansion Notes

ARCHAI is moving toward translation-aware onboarding at ingest time, not only in the live interface. See:

- [COLLECTION_ONBOARDING_BLUEPRINT.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md)
- [INTERNATIONAL_ONBOARDING_MATRIX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/INTERNATIONAL_ONBOARDING_MATRIX.md)
- [collection-targets.json](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/collection-targets.json)

### Available but no public API
- ColBase (Japan) — 4 national museums, web-only, no REST API
- MNBA Buenos Aires — on Google Arts & Culture only

### Future targets — born-digital & modern culture
- **Rhizome ArtBase** (SPARQL/Linked Open Data) — net art, software art, browser art. Needs dedicated SPARQL harvester + per-work media review.
- **RAWG Video Games Database** — 300K+ games as cultural objects. Free with attribution. Needs `RAWG_API_KEY` and attribution link on every display page.
- **Art Blocks** (GraphQL/The Graph) — on-chain generative art. Image rights complex (token holder owns the output). Start metadata-only.
- **Whitney Museum** — CC0 metadata only, images NOT open. Useful for semantic search enrichment without image display.
- **MoMA dataset** (GitHub) — CC0 metadata only. Same pattern as Whitney.
- **Harvard Art Museums** — non-commercial only, rich provenance data. Research context only.
- **DigitalNZ** — partner-rights gate still needed before public AUX.IO use.
- **Tokyo Museum Collection / ToMuCo** — technically explored, held out on public-rights grounds.
