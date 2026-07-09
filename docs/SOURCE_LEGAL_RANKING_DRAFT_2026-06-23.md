# Modern / Born-Digital / Generative Source — Legal Ranking (DRAFT)

**Date:** 2026-06-23 · **Author:** Claude (overnight, for Rob + Codex review)
**Status:** DRAFT for review — **not legal advice.** Each source's current Terms of
Use / API licence are binding and must be re-read at build time per source.

Purpose: rank the modern/digital/generative/games sources Rob named, so we only
build harvesters for the licence-clean ones and gate the rest. Columns per Codex's
spec. Modes: `harvest-public-media` · `metadata-only` · `partner-permission` ·
`do-not-harvest` / display-link-only.

---

## The headline

**Most of these are metadata-only.** Modern and contemporary art is in copyright,
so unlike the PD/CC0 historical sources, their *images* generally cannot be
harvested and re-displayed. They make the collection **broader and more modern as
staff-searchable records + deep links**, but they do **not** flood the public,
image-backed AUXIO set. Genuinely public-displayable modern additions come from a
few narrow seams: per-record PD/CC0 at Harvard, *per-project* CC0 generative works
(some Art Blocks / fxhash), and born-digital replay via **partnership** (Rhizome).
Set expectations accordingly.

---

## Ranking table

| Source | API / data access | Metadata licence | Media (image) licence | Born-digital replay value | Commercial / public-demo risk | **Recommended ARCHAI mode** |
|---|---|---|---|---|---|---|
| **Tate** | GitHub dataset (CSV/JSON); no live API | **CC0** ✓ | Images **not** in dataset; licensed separately | n/a | Low (metadata) / High (images) | **metadata-only** — link to tate.org.uk |
| **MoMA** | GitHub dataset (CSV/JSON) | **CC0** ✓ | Images **not** included; copyright via Art Resource | n/a | Low / High | **metadata-only** |
| **Whitney** | GitHub open-access dataset | CC0 / open ✓ | Mostly in-copyright (contemporary) | n/a | Low / High | **metadata-only** |
| **Harvard Art Museums** | REST API (free key), IIIF | Open / permissive | **Mixed** — some PD/CC0, many "© President & Fellows of Harvard College" | n/a | Medium | **metadata-only**, with `harvest-public-media` **gated per-record** to PD/CC0 only |
| **Rhizome ArtBase** | Linked Open Data / Wikibase SPARQL | Open metadata ✓ | Artworks = **artists' copyright**; Rhizome stewards | **HIGH** — canonical net-art archive | Medium / High | **partner-permission** — metadata + deep link now; media/replay only with Rhizome + artist consent |
| **Art Blocks** | The Graph GraphQL subgraph (on-chain) | On-chain metadata open | **Per-project** — some CC0, many NFT-licence / CC BY-NC / ARR; creator/owner-held | **HIGH** — deterministic, on-chain reproducible | High (creator rights, commercial NFT context) | **metadata-only** default; `harvest-public-media` **only per-project where licence is explicitly CC0** |
| **fxhash** | GraphQL API | Open metadata | **Creator-chosen per token** (CC0 / fxhash licence / none) | **HIGH** — Tezos generative, reproducible | High (per-token variance) | **metadata-only** default; per-token harvest only where **CC0/open** |
| **Ars Electronica (Prix archive)** | Web + structured data; no clean open API | Archive metadata public | Media rights with **artists** | Medium (docs of media/interactive works) | Medium / High | **partner-permission** / metadata-first |
| **RAWG (games)** | REST API (free key, request caps) | ToS: **no data redistribution** | Box art/screenshots = publishers' | n/a | High (redistribution forbidden) | **display-link only** — live API calls + attribution; never harvest-store-redistribute |

---

## Build order (recommendation)

**Phase 1 — clean, low-risk, immediate modern breadth (metadata-only):**
Tate · MoMA · Whitney · Harvard (metadata). All CC0/open metadata, no image
redistribution. Adds modern/contemporary records as staff-searchable + link-out.

**Phase 2 — narrow public-image seams (per-record gate):**
Harvard `harvest-public-media` **only** where record rights = PD/CC0. This is the
one source here that yields *some* re-displayable modern images.

**Phase 3 — born-digital (the exciting demos, rights-complex):**
- **Rhizome** — pursue as a **partnership** (it fits the sovereignty/preservation
  thesis and the paper's born-digital section). Metadata + deep link until consent.
- **Art Blocks / fxhash** — per-item, CC0-only harvest of generative works that are
  explicitly CC0. These are the only modern works we can legally *replay* publicly
  without permission. Build a per-token licence check, never a blanket pull.

**Phase 4 — games:** RAWG as **display-link only** (metadata + live API, no store).

---

## Hard gates that apply to ALL of the above
(carry over from the existing legal-harvest-bot posture)

1. **Default-private rights gate** — nothing public until record-level rights are
   explicitly open (CC0 / CC-BY / PD); everything else is link-out.
2. **Per-record, not per-source, rights flag** — especially Harvard, Art Blocks,
   fxhash where licence varies within the source.
3. **Attribution at point of use**, per each source's ToS (Tate/MoMA/RAWG all
   request/require it even on open metadata).
4. **No redistribution where forbidden** (RAWG explicit).
5. **Rights re-validation TTL** — cached "open" can go stale; re-check.
6. **Takedown / DMCA path.**
7. **ICIP / cultural protocols** — less likely to bite for these Western-modern
   sources, but keep the hard gate in place by default.

---

## Note for the summit paper / collection-balance framing
Honest line: ARCHAI's modern/born-digital expansion is **metadata-first**, with
public image display reserved for the narrow open-licence seams (PD/CC0 records,
explicitly-CC0 generative works, partnership-cleared net art). This *strengthens*
the sovereignty argument — the system stays legally clean while growing — rather
than weakening it.

---

### Sources checked
MoMA collection (GitHub, CC0 metadata, images excluded) · Tate collection (GitHub,
CC0 metadata, images excluded) · RAWG API Terms of Service (no data redistribution;
free commercial use within request caps). Whitney / Harvard / Rhizome / Art Blocks /
fxhash / Ars Electronica assessed from established licensing knowledge — **confirm
each against current ToS before building.**
