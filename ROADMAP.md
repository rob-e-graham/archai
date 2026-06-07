# ARCHAI Roadmap

Last updated: 2026-06-07

This roadmap turns the current progress logs, audits, and research notes into a practical build sequence. ARCHAI is the main app and source of truth. The public website is a demo window into that system.

## Current North Star

ARCHAI is an open-source toolkit for sovereign semantic heritage infrastructure:

- preserve raw museum records exactly as received
- normalize records into a shared canonical layer
- keep rights, provenance, language, and cultural protocol metadata visible
- search collections semantically across institutions
- support staff-facing collection intelligence and visitor-facing AUX.IO interpretation
- keep speech, translation, and AI interpretation as optional, documented, replaceable layers

## Milestone 1: Stabilize The Main App

Goal: make `ARCHAI_v10_8.html` feel like the serious app, not the older website demo.

- Make curator search and object browse use the same image-backed, rights-aware result logic.
- Keep thumbnails lightweight and open full metadata only after object selection.
- Surface match score, matched themes/keywords, institution, and legal status on result cards.
- Keep object detail focused on full metadata, source links, legal detail, interpretation, comments, and related objects.
- Reduce visitor-style language in staff-facing object views.

Status: in progress.

## Milestone 2: Make AUX.IO Management Real Enough For Demo

Goal: make AUX.IO management reflect the generated visitor-page universe rather than a tiny mock panel.

- Generate a larger image-backed working set from live collection objects.
- Keep internal legacy `NFC` function names only where renaming would add risk; keep user-facing labels as AUX.IO.
- Show linked object, live/draft status, location, legal status, and preview.
- Next deeper step: read the generated AUX.IO manifest/pages directly so every generated page is editable.

Status: started, needs backend/manifest sync.

## Milestone 3: Rights And Provenance Gate

Goal: every public-facing object must be legally legible.

- Preserve raw rights/licence/source metadata.
- Show normalized legal status in ARCHAI, website demo, and AUX.IO.
- Keep source URL visible.
- Filter public demos toward image-backed, legally acceptable records.
- Use `backend-archai/scripts/legal-harvest-bot.js` as the repeatable legal gate before public-demo harvests.

Status: strong, with legal harvest bot now tracked as the release safety rail.

## Milestone 4: Collection Onboarding Pipeline

Goal: add collections without making the database messy.

Every harvester should output:

- raw source record
- canonical object fields
- rights/provenance fields
- source language and available translation fields
- image/media fields with quality checks
- clean embedding text

Immediate target areas:

- Australia / Aotearoa / Pacific
- Asia
- South America
- Middle East
- technology, media art, born-digital, video, software, and web-art archives

Status: active. See `backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md`.

## Milestone 5: Open Voice And Accessibility Layer

Goal: build a browser-independent, open-source voice layer without breaking the current phone demo.

Recommended stack:

- speech-to-text: Whisper or whisper.cpp
- text-to-speech: Piper first, Coqui only after voice/model licence audit
- browser speech: optional convenience mode, not the core dependency

Desired flow:

1. user records a question
2. ARCHAI transcribes locally
3. question goes through the normal grounded collection response path
4. response can be read back using an open, institution-approved voice

Status: browser-native demo working, proper open voice backend not yet built.

## Milestone 6: Research And Partner Readiness

Goal: make the project understandable to GLAM partners, RMIT, funders, and collaborators.

- Keep README, progress log, audit, and roadmap aligned.
- Maintain a clear public-demo disclaimer.
- Maintain a clear open-source and rights statement.
- Keep research notes linked through `docs/RESEARCH_INDEX.md`.
- Document which features are live, simulated, prototype-only, or future research.

Status: improving.

## Near-Term Build Queue

1. Main app result browse/search parity with website demo.
2. AUX.IO management working set expanded from real objects.
3. ROADMAP + functional audit kept current.
4. Voice UX polish: immediate listening feedback, clearer stop/retry states.
5. Whisper/Piper prototype as separate optional path.
6. Rights audit command before every public demo push.
7. Generated AUX.IO manifest sync for true page editing.
