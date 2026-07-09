# ARCHAI IIIF Integration Notes

Last updated: 2026-06-25

IIIF is a strong fit for ARCHAI because it lets the semantic layer work with cultural images as structured, addressable media rather than flat thumbnails. A IIIF image can be requested at different sizes, cropped to regions, zoomed deeply, cited, and annotated without altering the institution's source record.

## What is now in place

ARCHAI now has a shared helper:

```text
backend-archai/scripts/lib/iiif.js
```

It provides:

- `normaliseIiifBase(url)` — strips a IIIF image request back to the image-service base.
- `iiifImageUrl(base, size, options)` — builds a valid Image API URL.
- `iiifInfoUrl(base)` — builds the `info.json` URL.
- `buildIiifImageSet(base, options)` — returns thumbnail, display, large, base, and info URLs.
- `looksLikeIiifImageService(url)` — lightweight detection helper for future audits/UI.

## Harvesters currently using the shared helper

- `aic-harvester.js` — Art Institute of Chicago IIIF.
- `aucklandmuseum-harvester.js` — Auckland Museum IIIF-style derivatives. This fixed the prior ~70px thumbnail issue.
- `nga-harvester.js` — National Gallery of Art Open Access IIIF.
- `rijksmuseum-harvester.js` — Rijksmuseum Micrio IIIF-style images.
- `va-harvester.js` — V&A Framemark IIIF.
- `wellcome-harvester.js` — Wellcome Collection IIIF thumbnails/images.

These payloads now prefer explicit fields:

```text
media_thumbnail
media_medium
media_large
media_iiif_base
media_iiif_info_url
media_iiif_available
```

## Why it matters for ARCHAI

IIIF supports ARCHAI's core direction: a sovereign semantic layer above existing GLAM systems. The source system keeps its archival authority, while ARCHAI can offer richer access and interpretation.

Useful product directions:

- Deep zoom for object detail pages.
- "Look closer" mode in AUXIO for visitors.
- Curatorial image-region annotations.
- Evidence-linked answers where ARCHAI can point to a specific visual detail.
- Multi-image/page object support through IIIF manifests.
- Cross-institution image viewing through one consistent viewer.

## Recommended next build

1. Add a small image viewer component that activates only when `media_iiif_available` is true.
2. Add a "Look closer" button to AUXIO below the hero image.
3. Store region annotations separately from source metadata:

```json
{
  "canonical_id": "source:id",
  "region": "pct:10,20,30,40",
  "label": "Maker's mark",
  "note": "Visible in the lower-right corner.",
  "created_by": "curator",
  "visibility": "staff|public"
}
```

4. Extend the media audit to record actual image dimensions and prevent low-resolution derivatives from entering public AUXIO.
5. Add IIIF Presentation API manifest ingestion for collections that expose multi-image works.

## Boundary

IIIF availability does not automatically mean public reuse is allowed. ARCHAI should continue treating rights and media quality as separate gates:

- `media_iiif_available` means the image service can provide structured derivatives.
- `media_public_display_allowed` means ARCHAI is allowed to display the media publicly.
- `poster_download_allowed` means derivatives/downloads are allowed.

This distinction is important for rights-aware public demos and future institutional deployments.
