# Public Media Audit — 22 June 2026

## Purpose

ARCHAI keeps canonical metadata available to authorised staff even when an object's media is missing, technically broken, or not cleared for public reuse. AUX.IO is a separate publication layer and is generated only from records that pass both the media-availability and rights gates.

This audit tested the first supplied image URL for every image-bearing record. It checked the HTTP response, image bytes/content type, known placeholder patterns, and browser canvas CORS. Results were written to Qdrant only after source snapshots were taken for the collections undergoing policy migration.

## Current result

| Source | Records | URLs supplied | Healthy | Hidden/broken | AUX.IO pages | QR print formats | Current decision |
|---|---:|---:|---:|---:|---:|---:|---|
| Art Institute of Chicago | 150 | 150 | 0 | 150 | 0 | 0 | Current image endpoint returns a Cloudflare HTML challenge; metadata remains staff-searchable |
| Auckland Museum | 120 | 120 | 119 | 1 | 119 | 0 | Public display with item attribution; derivative output remains disabled |
| Brasiliana Museus | 120 | 120 | 7 | 113 | 7 | 0 | Only seven current image URLs resolve; do not show the 404 records |
| Cleveland Museum of Art | 150 | 150 | 150 | 0 | 150 | 0 | Public display works; remote images are not currently canvas-safe |
| Europeana | 150 | 150 | 150 | 0 | 150 | 0 | `reusability=open` display set; remote images are not currently canvas-safe |
| J. Paul Getty Museum | 200 | 200 | 0 | 200 | 0 | 0 | Legacy constructed URLs failed; hold until an explicit item-level Open Content URL is verified |
| Metropolitan Museum of Art | 135 | 135 | 135 | 0 | 135 | 0 | Public-domain display works; print derivatives remain fail-closed until explicitly migrated |
| M+ | 110 | 110 | 110 | 0 | 0 | 0 | Preview/non-commercial media is held from AUX.IO |
| National Gallery of Art | 150 | 150 | 150 | 0 | 150 | 150 | CC0 metadata and `published_images.openaccess=1` media; print formats enabled |
| Museums Victoria | 40 | 39 | 36 | 3 | 36 | 0 | CC BY display set; one metadata-only record and three failed images remain staff-searchable |
| QAGOMA | 200 | 0 | 0 | 0 | 0 | 0 | CC BY metadata only; no object media published |
| RAWG | 193 | 193 | 193 | 0 | 193 | 0 | API display with an active RAWG link; redistribution/derivative downloads disabled |
| Rijksmuseum | 150 | 150 | 150 | 0 | 150 | 0 | Public-domain display works; print derivatives remain fail-closed until explicitly migrated |
| Smithsonian Institution | 145 | 145 | 141 | 4 | 141 | 141 | Only item-level `usage.access=CC0` media; print formats enabled for healthy images |
| Municipal street-art data | 439 | 0 | 0 | 0 | 0 | 0 | Metadata-only; artist and photographer media rights require item-level review |
| Tate | 150 | 0 | 0 | 0 | 0 | 0 | CC0 metadata only; Tate's dataset explicitly excludes images |
| Te Papa Tongarewa | 95 | 95 | 95 | 0 | 0 | 0 | Preview-first/item-specific rights; held from the current exact-rights AUX.IO gate |
| Victoria and Albert Museum | 300 | 300 | 299 | 1 | 0 | 0 | Media is technically healthy but held pending an explicit reusable-media migration |
| Wellcome Collection | 150 | 150 | 149 | 1 | 149 | 149 | Item-level open licences; derivative-friendly records gain print formats |
| **Total** | **3147** | **2357** | **1884** | **473** | **1380** | **440** | **790 metadata-only records; 504 otherwise healthy records held by public-media policy** |

## Publication rules

1. `media_available === false` hides a broken or placeholder image without deleting its metadata.
2. `media_public_display_allowed === false` prevents public display even if the URL works.
3. AUX.IO additionally evaluates the normalized item/source rights statement and explicit source holds.
4. `poster_download_allowed === true` and `media_canvas_safe === true` are both required before any poster, sticker, or postcard control appears.
5. Every enabled physical format draws a QR code back to the permanent AUX.IO URL.
6. `nfc-pages/aux-id-map.json` keeps canonical object IDs bound to permanent numeric AUX.IO IDs across regeneration.

## Reproduce the audit

Report only:

```bash
cd backend-archai/scripts
node audit-public-media.js
```

After taking Qdrant snapshots and reviewing the report:

```bash
node audit-public-media.js --apply --concurrency 20
```

Then rebuild `archai_curator`, regenerate AUX.IO, and run the generated-page verification. Do not use `npm audit fix --force` or loosen a rights gate merely to increase the public page count.

## Known follow-up work

- Replace the AIC image route with an officially supported, browser-readable endpoint or a permitted institutional proxy/cache.
- Repair Brasiliana URLs from the source data rather than manufacturing replacements.
- Re-harvest Getty only from explicit item-level Open Content image references.
- Review V&A, Te Papa, M+, Met, Rijksmuseum, CMA, and Europeana media terms source by source before enabling derivative downloads.
- Seek a written Street Art Cities research/data partnership before any public integration; its standard academic exports exclude images.
