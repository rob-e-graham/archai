# ARCHAI Alignment Audit - 2026-06-23

This audit records the current runtime state after the WACZ replay/access-copy refactor and smoke-test pass. It is intended as a clean handover point before the next ARCHAI app/interface refactor.

## Runtime Snapshot

- Local backend: `http://localhost:8787/api/health`
- Public backend tunnel: `https://archai-api.fineartmedia.tech/api/health`
- Main app static server: `http://localhost:8000/ARCHAI_v10_8.html`
- Public ARCHAI demo: `https://fineartmedia.tech/archai`
- Public AUXIO landing page: `https://fineartmedia.tech/aux`
- Dark Plates launch site: `https://darkplates.art`

Verified backend counts:

- Collection objects: `3267`
- Qdrant collections: `21`
- Curator vectors: `3147`
- Total vectors: `6414`
- AUXIO manifest pages: `1522`
- Runtime chat model: `qwen2.5:14b`
- Runtime embed model: `nomic-embed-text`
- Ollama status: online

Important note: AUXIO page numbers are permanent IDs, not a dense sequence. The manifest currently reports `1522` pages with the last permanent page ID at `3247`; gaps are expected because records have been removed, filtered, or legally quarantined over time.

## What Was Refactored

- WACZ archive/screenshot reading was moved out of the media route into `backend-archai/src/services/waczAccessService.js`.
- Media routes now call the service instead of carrying inline ZIP/WARC parsing helpers.
- A repeatable runtime smoke test was added at `backend-archai/scripts/smoke-test-runtime.js`.
- `backend-archai/package.json` now exposes `npm run test:smoke`.

The refactor keeps the public media behaviour the same while making replay/access-copy handling easier to test and extend.

## Verified Checks

These commands passed locally:

```bash
find backend-archai/src -name '*.js' -print0 | xargs -0 -n1 node --check
npm --prefix backend-archai run test:smoke
backend-archai/scripts/healthcheck-public.sh
curl -I http://localhost:8000/ARCHAI_v10_8.html
```

Smoke checks covered:

- Backend health endpoint
- AUXIO manifest endpoint
- Published media manifest endpoint
- AUXIO WACZ access page
- AUXIO WACZ screenshot extraction
- ARCHAI WACZ screenshot extraction
- CD-ROM-style interactive player route
- Epicycloid creative-coding player route

Public stability checks covered:

- Local backend
- Public backend tunnel
- AUX manifest
- Public ARCHAI page
- Public AUX page
- Dark Plates

## Current Known Drift

- `ARCHAI_v10_8.html` still contains some hardcoded presentation labels such as `Build v11.6`, `19 connected collections`, and `11 museum APIs`. The backend now reports `21` Qdrant collections, `3267` collection objects, and `3147` curator vectors. The next app pass should make these labels read from `/api/health` rather than from static copy.
- `README.md` and `ARCHAI_PROGRESS.md` mention earlier AUXIO counts in some historical sections. That is acceptable in version history, but the current-state sections should be checked before the next public push.
- Full dynamic ReplayWeb loading remains beta. The stable public path is now the ARCHAI access-copy page with screenshot, source link, rights label, timestamp, WACZ download, and a separate ReplayWeb beta link.
- The Codex browser tool could not open local `localhost` / `127.0.0.1` app URLs in this session, even though `curl` confirmed the servers were reachable. Treat this as a browser-tool limitation rather than app downtime.
- Main app click-level workflow testing still needs a browser session that can access local ports reliably.

## Product Alignment Notes

- The main ARCHAI app remains the primary staff-facing system.
- The website is a public demo and explanatory layer, not the source of truth.
- AUXIO should remain the near-term product focus after the collection search layer: institutions need to create, assign, edit, preview, publish, and export their own object pages.
- Nodel, FAMTEC Exchange, and exhibition operations can stay later-stage until the core search/AUXIO workflow is stable.
- NASA is quarantined for media-lab R&D only and should not be presented as a core GLAM collection unless deliberately promoted with clear context.

## Recommended Next Refactor

1. Move hardcoded app counts/source labels to a runtime `GET /api/health` driven UI model.
2. Add one small browser-accessible app smoke page or test harness for search, AUXIO preview, and published media playback.
3. Cache WACZ screenshot extraction or pre-generate thumbnails so repeated public access does not repeatedly unzip WACZ files.
4. Add a dedicated search smoke test that verifies image-backed results and rights labels for a few stable queries.
5. Continue separating raw metadata, canonical normalized metadata, derived translation/embedding data, and public interpretation copy.

