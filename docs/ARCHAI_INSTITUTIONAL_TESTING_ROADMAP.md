# ARCHAI Institutional Testing Roadmap

Last updated: 2026-06-29

ARCHAI is currently a draft institutional demo and research prototype. The strongest near-term goal is to make the main app reliable enough for structured testing with GLAM partners while keeping the public website as a clear demonstration layer.

## Current Working Lanes

- Collection intelligence: semantic and conversational search across harvested metadata in Qdrant.
- Object review: staff-facing lenses for Curatorial, Collections, Exhibition, and Interpretation use.
- AUX.IO: visitor pages generated from object records with rights-aware media, source attribution, audio tools, related objects, IIIF image viewing where available, and visible legal/source status.
- AUX.IO Management: create/select an object, assign it to a QR/NFC/spatial trigger, choose visitor visibility, preview, and publish in the prototype.
- Vocabulary and thesaurus: prototype UI for mapping local terms to controlled vocabulary and flagging sensitive/public-facing language.
- Media gate: per-item public display rules that hold restricted, missing, placeholder, or low-quality media from visitor-facing surfaces.

## WIP Boundaries To State Clearly

- This is a draft demo, not a finished enterprise system.
- Directus persistence is only partly wired; some staff/project workflows are still local-browser prototype state.
- CMS/DAMS connectors are not yet a general plug-in system.
- Nodel/exhibition operations and FAMTEC Exchange are lower-priority prototype modules.
- Browser voice is the current working demo path; Whisper/Piper/Coqui-style open-source audio remains the production research path.
- Institution names identify source records only and do not imply partnership or endorsement.

## Next App Jobs For Institutional Testing

1. Search and Browse Reliability
- Keep thumbnails lightweight in result cards.
- Open full object detail only after selection.
- Always show source institution, legal status, match score, and matched themes.
- Keep metadata-only records searchable for staff, but clearly mark when public media is unavailable.

2. Object Review And Staff Actions
- Add share/copy, read summary, save to project, and export project list to every selected object.
- Turn local project lists into Directus-backed project sets.
- Support object lists for exhibitions, conservation review, research sets, loan planning, and visitor-route planning.

3. AUX.IO Workflow
- Make the workflow legible: Create or select object -> assign access point -> configure visitor visibility -> preview -> publish -> export QR/poster/postcard.
- Keep share/save/download functions near visitor actions and legal/source details lower in the page.
- Auto-read replies only when a visitor asks by voice; typed questions stay text-first with optional read-aloud.

4. Thesaurus And Vocabulary
- Explain why it matters: consistent search, safer public labels, better cross-collection discovery, and clearer translation.
- Separate local institutional terms from external vocabularies.
- Add mapping notes, confidence, and review status.
- Keep cultural safety/protocol flags visible before public publication.

5. CMS/DAMS/API Connectors
- Build a custom harvester tab or connector builder.
- Support APIs, IIIF manifests, CSV/spreadsheets, ResourceSpace, CollectiveAccess, eHive, EMu, TMS, Directus, and local media folders.
- Preserve raw source records separately from canonical metadata, display text, embeddings, translations, and interpretation.

6. Training Mode
- Keep an in-app overlay explaining the test flow for staff.
- Add short guided tasks for Curator, Collections, Exhibition, Interpretation, and AUX.IO Publisher roles.
- Track successful/failed workflows during partner testing.

## Product Principle

ARCHAI should feel like a semantic layer above existing institutional systems, not a replacement for those systems. It should reduce gatekeeping around collection interaction while respecting archival structure, source authority, legal status, and institutional governance.
