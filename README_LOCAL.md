# ARCHAI Local Prototype (Quick Start)

This folder contains the current local ARCHAI prototype, the backend scaffold, AUXIO visitor pages, and related support files.

## Main entry points

- `ARCHAI_v10_8.html` — current main frontend with:
  - multi-collection search
  - live object chat
  - curator tools
  - AUXIO management
  - comments + proxy integration
  - PWA manifest + service worker

- `backend-archai/` — backend proxy/API for public-safe hosting, comments, and curator services

- `nfc-pages/` — generated AUXIO visitor pages

- `start-archai.sh` — recommended full-stack launcher
- `serve_local_archai.sh` — static-server helper for frontend/PWA testing only

## Recommended launch

From this folder:

```bash
./start-archai.sh
```

Then open:

- `http://localhost:8000/ARCHAI_v10_8.html`

## Frontend-only launch

If you only want the static frontend/PWA:

```bash
./serve_local_archai.sh
```

Then open:

- `http://localhost:8000/ARCHAI_v10_8.html`

## Direct URLs

- Main app: `http://localhost:8000/ARCHAI_v10_8.html`
- AUXIO index: `http://localhost:8787/aux/index.html`
- Backend API: `http://localhost:8787/api/health`

## Notes

- The PWA requires `http://localhost:8000`, not `file://`.
- If `localhost:8000` shows a directory listing or returns `404` for `ARCHAI_v10_8.html`, the server is likely rooted in the wrong folder. `start-archai.sh` now replaces stale port `8000` servers automatically.
- The public `fineartmedia.tech/aux` landing page lives in the website repo, while the tunnel-backed AUXIO object pages come from this ARCHAI repo/backend.
