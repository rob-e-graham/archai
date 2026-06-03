# ARCHAI Main App — Functional Audit

Date: 2026-06-03. App file: `ARCHAI_v10_8.html` (+ `backend-archai`).
Question: what's needed for the main app to be fully functioning.

## Status by panel

| Panel / feature | Data source | Status |
|---|---|---|
| Curator search ("collection intelligence") | Qdrant curator (1,555 obj) | ✅ Real |
| Object chat | proxy → qwen2.5:14b + personality + SafeChat | ✅ Real (fixed this session) |
| Visitor object chat | same proxy | ✅ Real (fixed this session) |
| Comments (visitor) | SQLite, AI-moderated | ✅ Real |
| Semantic search | Qdrant + nomic embeddings | ✅ Real |
| **Objects panel** | 4 hard-coded mock objects | ⚠️ Mock — not reading the 1,555 real objects |
| **AUX.IO / NFC tags panel** | 3 mock tags | ⚠️ Mock — doesn't reflect the 1,554 generated pages |
| **Vocab / thesaurus panel** | empty | ⚠️ No vocabulary loaded |
| **FAMTEC Exchange panel** | 3 mock listings | ⚠️ Placeholder concept |
| Nodel (exhibition control) | simulated devices | �ðŸ”¶ Mock by design (no hardware in demo) |
| Integrations: CollectiveAccess / ResourceSpace | mock | 🔶 Mock by design (institution-configured) |

## Fixed this session
- **Chat was using llama3 directly when run locally** — bypassed qwen + the
  personality system + SafeChat. Added `BACKEND_BASE` (localhost:8787, CORS open)
  so all AI chat routes through `/api/proxy/chat` locally and remotely. Hardcoded
  model strings updated llama3 → qwen2.5:14b.

## Priority roadmap to "fully functioning"

### P1 — make the browse experience real (high impact, visible)
1. **Objects panel → live Qdrant.** Replace the 4 mock objects with a real
   scroll/search over the curator collection (1,555 objects), with the new
   `themes` / `is_technology` filters surfaced as facets. This is the single
   biggest gap: the curator can search, but the browse grid is fake.
2. **Theme / technology filter UI.** Now that every object has `themes[]` +
   `is_technology` (indexed in Qdrant), add filter chips (Technology, Born-Digital,
   Photography, Painting…) to search + browse. Directly answers the "limited
   technology results" problem.

### P2 — connect the management surfaces
3. **AUX.IO tags panel → real pages.** Reflect the 1,554 generated visitor pages
   (status, object, collection) instead of 3 mock tags; link to the live page.
4. **Vocab panel.** Either load a real controlled vocabulary (Getty AAT subset)
   or hide the panel until it has data.

### P3 — concept surfaces (label or build)
5. **FAMTEC Exchange.** Either build a minimal real data model or label it clearly
   as a concept/roadmap surface so it doesn't read as broken.
6. **Nodel + CMS/DAMS integrations.** Fine as simulated for the demo; gate behind
   an "institution config" note so reviewers know they're live-on-deploy.

## Notes
- Backend health: Qdrant live, Ollama online, 1,555 curator vectors, 12 collections.
- All AI now runs on the dual-model setup: qwen2.5:14b (visitor) / qwen2.5:32b (curator).
- Re-run `tag-themes.js` after any harvest/curator rebuild to refresh themes.
