# ARCHAI International Onboarding Matrix

Last verified: `2026-06-02`

This matrix keeps international expansion focused on:

- legal reuse
- image quality
- clean provenance
- cultural protocol
- multilingual value

It is not a list of "interesting museums". It is a go / caution / hold layer for onboarding.

## Approval rules

### Approved open

Safe to prioritise for public-facing ARCHAI / AUXIO testing once image quality is confirmed.

### Approved with item rights check

Metadata is open enough to proceed, but every image must keep its source licence and item-level rights attached.

### Approved metadata with media check

Metadata access is strong, but image or download rights vary by contributing museum or partner source.

### Non-commercial only

Fine for PhD research, pilot demos, and grant work if we stay explicitly non-commercial.

### Pending verification

Do not onboard beyond basic technical exploration until legal and media terms are confirmed from the source.

## Verified priority targets

| Priority | Source | Region | Access | Metadata | Images | Demo status | Why it matters |
|---|---|---|---|---|---|---|---|
| 1 | Te Papa | Aotearoa / Pacific | API, free key or guest token | CC BY 4.0 | Per-item / mixed | Live with item rights check | Live as preview-first onboarding with item rights attached and sensitive records excluded by default |
| 2 | Auckland Museum | Aotearoa / Pacific | API | Mixed / per-item | Mixed / per-item | Live with placeholder filter | Already live; now needs source-side media cleanup |
| 3 | M+ | Asia | Public GraphQL API | CC0 | Preview-first / source rights apply | Live | Strong Asia-focused visual culture, design, and moving-image source with bilingual metadata |
| 4 | Brasiliana Museus | South America | Open platform | Open data / open access | Spot-check per item | Live with item rights check | First live South American expansion path, filtered to public-domain / open-access records |
| 5 | DigitalNZ | Aotearoa / Pacific | Aggregator API | Mixed, rights-field dependent | Partner-specific | Approved metadata with partner rights check | Strong breadth and multilingual / regional reach |
| 6 | QAGOMA | Australia / Asia Pacific | Open dataset | Open dataset | Recheck per item | Approved dataset with image rights recheck | Strong Australian and Asia-Pacific balancing source |
| 7 | National Museum of Australia | Australia | API, free key | CC BY-NC 4.0 | Public domain / CC variants | Non-commercial only | Valuable object-rich source for research and demo context |
| 8 | Tokyo Museum Collection (ToMuCo) | Asia | API | Open metadata | Source-provider dependent | Hold | Technically reachable, but current legal gate does not yield enough public-safe image-backed records for live onboarding |

## Sources not yet cleared

| Source | Region | Current state | Main blocker |
|---|---|---|---|
| WA Museum | Australia | Worth pursuing | API and reuse terms not yet fully checked |
| National Palace Museum | Asia | Promising | Open-data and image terms not yet confirmed in this pass |
| National Taiwan Museum of Fine Arts | Asia | Promising | Legal and technical verification still needed |
| Qatar Museums | Middle East | High-value candidate | API path and reuse terms unclear |
| Qatar Digital Library | Middle East | Archive-rich | Better suited to document layers until rights and object fit are confirmed |
| Computer History Museum | Specialist | Strong thematic fit | Developer and media terms not yet verified |
| Trove | Australia | Good metadata breadth | Aggregated partner rights make media reuse more complex |

## Recommended next onboarding order

1. `DigitalNZ`
2. `QAGOMA`
3. `National Museum of Australia`
4. `WA Museum`
5. `National Palace Museum`

This sequence gives ARCHAI:

- stronger Pacific and Southern Hemisphere representation
- a cleaner Australian and Pacific next wave
- broader multilingual testing through partner-rich aggregators
- stronger legal discipline before the next mixed-rights onboarding pass
- better balance than continuing to only add Europe / North America

## Quality rules for every new international source

Do not ingest a source into public-facing demos unless it passes all of these:

1. the source has clear metadata terms
2. image reuse is explicit or safely item-level traceable
3. placeholder media is filtered out
4. institution name, source URL, and rights stay attached to every object
5. culturally sensitive records can be excluded or handled carefully
6. multilingual source fields are preserved before machine translation is attempted

### Current hold note

`ToMuCo` remains architecturally interesting, but it is being kept out of the live stack for now because the current legal / media gate did not produce a strong enough set of public-safe, image-backed records for ARCHAI or AUXIO.

## Official source links

### Te Papa

- https://www.tepapa.govt.nz/learn/research/datasets/collections-api
- https://data.tepapa.govt.nz/collection
- https://www.tepapa.govt.nz/api-terms-of-use

### DigitalNZ

- https://digitalnz.org/developers
- https://digitalnz.org/developers/api-docs-v3
- https://digitalnz.org/about/terms-of-use/developer-api-terms-of-use

### QAGOMA

- https://www.data.qld.gov.au/dataset/qagoma-collection

### National Museum of Australia

- https://www.nma.gov.au/about/our-collection/museum-api
- https://www.nma.gov.au/about/our-collection/museum-api/collection-api-terms-of-use

### M+

- https://api.mplus.org.hk/
- https://api.mplus.org.hk/en/documentation

### Tokyo Museum Collection

- https://museumcollection.tokyo/en/developer/
- https://museumcollection.tokyo/en/terms/

### Brasiliana Museus

- https://brasiliana.museus.gov.br/dados-abertos/
