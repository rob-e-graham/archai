# ARCHAI — Onboarding & Backend Plan (ship-readiness)

**2026-07-02 · Claude (Fable) — from the deep white paper, the functional audits, and the
institutional-expectations map.** Purpose: the concrete path from "working demo" to
"an institution can onboard and run a pilot."

## Where the app now stands (post today's fixes)

- Hosted app (`/app`) loads all 3,147 objects and seeds the 10 AUXIO demos — the
  proxy contract bug is fixed and deployed.
- Assign-from-collection picker works (it was the same bug).
- New **Connect Collection** tab: builds a harvester config matching
  `collection-targets.json`, endpoint test, run instructions. Demo partner content
  now uses RMIT Gallery / RMIT Library (demo) — no real third-party names in
  fictional content.
- Print family (poster/postcard/sticker): sentence-safe auto-fit text, big
  walk-past type, truncation-as-invitation ("scan to keep reading").

## The onboarding funnel (what a new institution actually does)

1. **Connect** — Connect Collection tab → harvester config (API/IIIF/OAI-PMH/CSV/CMS),
   rights defaults, cultural-safety gates. Keys live in the host keychain, never in
   configs.
2. **Dry-run** — `legal-harvest-bot --report` + harvester `--dry-run`: what would be
   admitted, what the rights gate excludes, media health counts.
3. **Legal review** — item-level rights verdict recorded in the registry
   (`collection-targets.json` status), per the international onboarding matrix.
4. **Live harvest** — raw records preserved verbatim; canonical layer derived;
   embeddings built; `archai_curator` rebuilt.
5. **Staff acceptance** — curators search their own collection, review voices/lenses,
   flag sensitive records (exclusion is the default until protocols are agreed).
6. **Curated AUXIO publish** — staff assign objects to AUXIO slots, preview,
   publish; QR/poster kit generated for the floor.
7. **Evaluate** — findability, trust, visitor engagement (the PhD pilot instruments,
   post-ethics).

The Connect tab now covers step 1 in-app; steps 2–4 are host-side scripts by design
(sovereignty: harvests run on the institution's machine).

## Backend: the four gaps between demo and product

**P1 — Durable persistence (the gate to any real pilot).** AUXIO assignments,
institution drafts, and project lists live in browser/runtime-session state; a
restart loses staff work. Move `objectRepository` + `upsertNfcTag` + project lists
to SQLite (single-file, zero-ops, fits the appliance model) or Directus. Everything
else depends on this.

**P2 — Auth boundary (the gate to sharing the staff app).** Unauthenticated requests
currently default to `admin`; client-side role switching is not a security boundary
(documented in PUBLIC_APP_DEMO_HOSTING.md). Minimum: server-side session tokens +
deny-by-default roles on write routes. Until then the staff app stays behind
Tailscale/Access — correctly.

**P3 — Connector registration API.** The Connect tab generates configs; add
`POST /api/connectors` (validated, persisted, audit-logged) so a config saved in the
app lands in the registry without hand-editing JSON. Harvest execution stays a
host-side deliberate act.

**P4 — Sovereign voice (the white-paper honesty gap).** Browser speech sends audio
to Google in Chrome; the self-hosted Whisper/Piper routes (`/api/voice/stt|tts`)
close the sovereignty claim and are prerequisites for the ethics application's
speech-privacy story.

Order: **P1 → P2 → P3 → P4.** P1+P2 make one real pilot possible; P3 makes the
tenth onboarding cheap; P4 completes the thesis claim.

## Improvement ideas beyond the gaps

- Health-driven counts: app header/source labels should read `/api/health`, not
  hardcoded numbers (drift keeps recurring).
- Per-collection proxy info route (sidebar count 404) — cosmetic, quick.
- Guided role walkthroughs in Training Mode (Curator / Collections / AUXIO
  Publisher) doubling as the pilot's task script.
- Institutional data agreement one-pager auto-attached to each connector config
  (the ethics scaffold already drafts it).
- `poster_download_allowed` for Met/Rijks/AIC CC0 → unlocks the icon tier of the
  poster show (Great Wave, Rembrandt).
