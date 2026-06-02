# ARCHAI Harvesters

Each harvester fetches objects from a museum API, generates embeddings via Ollama, and stores them in Qdrant. After harvesting, run the AUX.IO page generator to create conversational pages.

## Available Harvesters

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

## Quick Start

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

# Dry run (no writes)
node cleveland-harvester.js --dry-run
node aucklandmuseum-harvester.js --dry-run
node tepapa-harvester.js --dry-run
node mplus-harvester.js --dry-run
node brasiliana-harvester.js --dry-run
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
| `archai_brasiliana` | 12,000,000+ | Brasiliana Museus |

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

## International Expansion Notes

ARCHAI is moving toward translation-aware onboarding at ingest time, not only in the live interface. See:

- [COLLECTION_ONBOARDING_BLUEPRINT.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md)
- [INTERNATIONAL_ONBOARDING_MATRIX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/INTERNATIONAL_ONBOARDING_MATRIX.md)
- [collection-targets.json](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/collection-targets.json)

### Available but no public API
- ColBase (Japan) — 4 national museums, web-only, no REST API
- MNBA Buenos Aires — on Google Arts & Culture only
- Smithsonian — huge collection but poor image delivery via API

### Future targets
- Harvard Art Museums (needs API key)
- Cooper Hewitt / Smithsonian Design (needs API key)
- Brooklyn Museum (needs API key)
- DigitalNZ (partner-rights gate still needed before public AUX.IO use)
- Tokyo Museum Collection / ToMuCo (technically explored, but currently held out of live onboarding on public-rights grounds)
