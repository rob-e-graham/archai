# ARCHAI — Museum & Gallery Onboarding Candidates

Date: 2026-06-03
Author: research pass for Rob Graham / FAMTEC

Answers two linked questions:
1. Which museums/galleries can we legally onboard with good open metadata?
2. Why are technology results so limited right now?

---

## Why technology results are limited (data-backed)

Diagnostic run across the live 1445-object curator collection:

- **Only ~15% of all objects are technology-related** (machine, engine, computer,
  radio, telephone, camera, instrument, aircraft, transport, communication…).
- The current 11 sources are **overwhelmingly art museums**, and the art museums
  carry almost no technology:

| Collection | Tech objects / total |
|-----------|----------------------|
| V&A (design/decorative) | 82 / 150 |
| Museums Victoria | 28 / 80 |
| Art Institute of Chicago | 30 / 150 |
| Cleveland | 21 / 150 |
| Te Papa | 21 / 120 |
| M+ | 14 / 120 |
| Europeana | 13 / 150 |
| Auckland | 11 / 120 |
| The Met | 5 / 135 |
| **Rijksmuseum** | **0 / 150** |
| Brasiliana | 1 / 120 |

**Conclusion:** the gap is structural, not a search bug. The collection skews to
fine art because that's where the easy open APIs were. To make ARCHAI's
technology/communication story strong (which is the project's core lineage), we need
to onboard **science & technology museums**. The candidates below are chosen with
that as the priority.

---

## Tier 1 — Technology-rich, legally clean, onboard next

### 1. Smithsonian Open Access ⭐ top pick
- **License: CC0** (public domain — the cleanest possible legal position).
- **Scale:** 5.1M digitised items across 21 museums.
- **Why it fixes the gap:** includes the **National Air and Space Museum**,
  **National Museum of American History**, and **Cooper Hewitt Design Museum** —
  deep technology, communication, transport, computing, design.
- **API:** api.si.edu via api.data.gov (free key). JSON + AWS open-data mirror.
- **Attribution:** none legally required (CC0) but we'll cite anyway.
- Docs: https://www.si.edu/openaccess/devtools

### 2. Powerhouse / MAAS, Sydney ⭐ Australian, on-brand
- **License: CC-BY** (open, attribution required).
- **Scale:** 75,000 objects, 1880–present.
- **Why:** a museum of *applied arts and sciences* — design, innovation, science,
  technology. Directly aligned with the project's communication-technology lineage, and it's
  Australian (strengthens the sovereignty framing).
- **API:** public Collection API via Data.NSW.
- Docs: https://data.nsw.gov.au/data/dataset/powerhouse-museum-collection-api

### 3. Science Museum Group, UK
- **License: Creative Commons** (CC-BY / CC0 on many images).
- **Scale:** 7.3M items; 500k+ online.
- **Why:** science, technology, engineering, medicine, transport, **and media** —
  "media" is the exact communication-technology angle ARCHAI cares about.
- **API:** open Collection API + static JSON/CSV exports, code on GitHub.
- Docs: https://www.sciencemuseumgroup.org.uk/our-work/our-collection/using-our-collection-api

---

## Tier 2 — High-quality general collections, legally clean

| Source | License | Scale | API | Notes |
|--------|---------|-------|-----|-------|
| **Cooper Hewitt** (Smithsonian Design) | CC0 | ~200k | REST API + JSON dumps | Design/tech; own API if not via Smithsonian |
| **Getty Museum** | CC0 (most) | 250k+ | data.getty.edu | Strong metadata, paintings/photography |
| **Harvard Art Museums** | mixed; metadata open | 200k+ | JSON API (free key) | Excellent structured metadata |
| **Wellcome Collection** | CC-BY / CC0 | huge | API | Medical/science history — complements tech |
| **Brooklyn Museum** | open (per-record rights flags) | ~200k | own API | Models copyright transparency well |

---

## Tier 3 — Aggregators (breadth, variable metadata)

- **DigitalNZ** — NZ aggregator, API key, mixed rights per record (filter to open).
- **Europeana** (already live) — pan-European aggregator; can pull more.
- **DPLA** (Digital Public Library of America) — US aggregator, API, rights vary.

---

## Recommended onboarding order

1. **Smithsonian** (CC0, huge tech depth) — biggest single fix for the tech gap.
2. **Powerhouse/MAAS** (CC-BY, Australian, applied sciences) — on-brand.
3. **Science Museum Group** (CC, media + transport + tech).
4. Then Tier 2 for breadth (Cooper Hewitt / Getty / Harvard) as time allows.

Each follows the same pattern as the existing harvesters:
harvest (image-backed + license-gated) → embed → add to `ALLOWED_COLLECTIONS`
(proxy.js), `ALL_COLLECTIONS` (generate-nfc-pages.js), `COLLECTION_INSTITUTIONS`
(both + conversational-search.js) → rebuild curator → regenerate AUX.IO.

## Strategy B — re-harvest sources we already have (zero new legal work)

Rob's insight: we've **already cleared rights** on the 11 live collections, so we
can go back and pull more **technology and born-digital** assets from them without
any new legal review. Proven this session:

- **V&A re-harvest**, limit 150 → 300 (queries were already tech-focused:
  electronic, computer, synthesizer, robot, circuit, MP3 player…).
- Result: V&A doubled to 300 tech-rich objects (Furby, Speak & Spell, drum
  machines, electronic clocks, MP3 players, oscillons).
- **Curator technology density rose 15% → 25%** (226/1445 → 402/1595) from this
  single legal re-harvest.

This is the cheapest, safest lever for the tech gap. Next candidates to re-harvest
for technology (already rights-cleared):
- **Europeana** — its queries already include scientific instrument, camera,
  telescope, Deutsches Museum technology, printing press. Raise limit / add
  born-digital + industrial terms.
- **The Met** — add scientific instrument / musical instrument / arms-and-armor
  department queries.
- **Museums Victoria** — it's a science museum; add technology/communication terms.
- **Te Papa, Auckland** — social-history + technology terms.

Pattern (append-safe — collections upsert, they don't wipe):
```
node scripts/<source>-harvester.js --limit <higher>
curl -s -X POST http://localhost:8787/api/proxy/curator/build
cd nfc-pages && node generate-nfc-pages.js
```

## Legal rule (carried from this session)

Only onboard records that are **image-backed AND carry an explicit open license**
(CC0 / Public Domain Mark / CC-BY with cleared rights). The ToMuCo legal gate
added this session is the reference implementation — it skips any item without a
recognised open license. ToMuCo itself is **on hold**: its open-licensed items
have no images and its image-backed items have no clear license, so none are
legally usable as image-backed records.
