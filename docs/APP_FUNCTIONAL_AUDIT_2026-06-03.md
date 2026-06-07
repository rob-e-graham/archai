# ARCHAI Main App — Functional Audit

Date: 2026-06-07. App file: `ARCHAI_v10_8.html` (+ `backend-archai`).
Question: what's needed for the main app to be fully functioning.

## Status by panel

| Panel / feature | Data source | Status |
|---|---|---|
| Curator search ("collection intelligence") | Qdrant curator (1,520 obj) | ✅ Real |
| Object chat | proxy → qwen2.5:14b + personality + SafeChat | ✅ Real (fixed this session) |
| Visitor object chat | same proxy | ✅ Real (fixed this session) |
| Comments (visitor) | SQLite, AI-moderated | ✅ Real |
| Semantic search | Qdrant + nomic embeddings | ✅ Real |
| Objects browse panel | Live Qdrant objects loaded into `OBJECTS` | ✅ Real data, needs better image/legal filtering |
| AUX.IO management panel | Generated in-memory from live objects | 🔶 Real objects, still not synced to generated page manifest |
| Vocab / thesaurus panel | Qdrant-derived vocab + curated CHIN/AAT/DOCAM/Nomenclature terms | ✅ Functional prototype |
| FAMTEC Exchange panel | Prototype workflow data | 🔶 Placeholder concept, clearly separate from PhD core |
| Nodel (exhibition control) | simulated devices | 🔶 Mock by design (no hardware in demo) |
| Integrations: CollectiveAccess / ResourceSpace | mock | 🔶 Mock by design (institution-configured) |

## Fixed this session
- **Chat was using llama3 directly when run locally** — bypassed qwen + the
  personality system + SafeChat. Added `BACKEND_BASE` (localhost:8787, CORS open)
  so all AI chat routes through `/api/proxy/chat` locally and remotely. Hardcoded
  model strings updated llama3 → qwen2.5:14b.

## Priority roadmap to "fully functioning"

### P1 — make the browse/search experience consistent (high impact, visible)
1. **Keep image-backed browse first.** The app now loads real Qdrant objects, but the default browse/search should consistently favour image-ready, legally legible records for demos.
2. **Search parity with website demo.** Result cards should show image, legal status, match score, matched themes/keywords, source institution, and light metadata. Full metadata belongs in the selected object view.
3. **Theme / technology filter UI.** Use `themes[]` / `is_technology` where available, and keep plain language collection-search chips for visitors and staff.

### P2 — connect the management surfaces
4. **AUX.IO management → generated pages.** It currently creates an in-memory working set from real objects. Next step is to read the generated AUX.IO manifest/pages so every generated page can be searched, previewed, and eventually edited.
5. **AUX.IO save path.** Replace the current local confirmation with a persistent backend/Directus/SQLite save route.

### P3 — concept surfaces (label or build)
6. **FAMTEC Exchange.** Keep clearly labelled as a separate FAMTEC workflow prototype and potential later ARCHAI addition.
7. **Nodel + CMS/DAMS integrations.** Fine as simulated for the demo; gate behind an "institution config" note so reviewers know they're live-on-deploy.
8. **Open voice layer.** Keep browser speech as a working phone-first demo, then add Whisper/Piper as an optional open-source accessibility module.

## Notes
- Backend health at last major check: Qdrant live, Ollama online, 1,520 curator vectors, 11 source collections plus curator.
- All AI now runs on the dual-model setup: qwen2.5:14b (visitor) / qwen2.5:32b (curator).
- Re-run `tag-themes.js` after any harvest/curator rebuild to refresh themes.
