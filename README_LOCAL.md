# ARCHAI Local Prototype (Quick Start)

This folder contains local HTML prototypes for ARCHAI and the standalone FAMTEC Exchange concept.

## Files

- `ARCHAI_v5.html` — main prototype (`v0.6`) with:
  - Curator search
  - Upload & Ingest
  - Nodel
  - NFC management
  - Vocabulary
  - Visitor view
  - FAMTEC tab (opens separate page)
  - Admin
  - Version & Links

- `ARCHAI_v6.html` — `v6` prototype with The Met integration links + small Met preview panel

- `FAMTEC_exchange.html` — standalone local FAMTEC Exchange prototype page

- `serve_local_archai.sh` — simple local web server helper (recommended for The Met preview)

## Recommended Launch (for Met preview)

From this folder:

```bash
./serve_local_archai.sh
```

Then open:

- `http://localhost:8000/ARCHAI_v6.html`

## Direct URLs (when local server is running)

- ARCHAI v5: `http://localhost:8000/ARCHAI_v5.html`
- ARCHAI v6 (Met preview): `http://localhost:8000/ARCHAI_v6.html`
- FAMTEC Exchange: `http://localhost:8000/FAMTEC_exchange.html`

## Notes

- Opening the HTML files directly (`file://`) is fine for most UI work.
- The Met API preview in `ARCHAI_v6.html` is more reliable via `http://localhost:8000` (not `file://`) because browsers may block API requests from local files.
- FAMTEC is currently a local prototype page. In production it should be a separate online app/service with separate data storage and auth.
