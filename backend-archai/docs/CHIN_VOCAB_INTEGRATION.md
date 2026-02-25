# CHIN Vocabulary Integration (Baseline)

## What is implemented now

ARCHAI now supports a `CHIN` vocabulary profile in the backend vocab service.

- `GET /api/vocab/search?profile=chin&q=...`
- `GET /api/vocab/providers?profile=chin`

This profile currently:
- returns ARCHAI local thesaurus terms
- overlays CHIN-aligned mock/federated rows for AAT / Nomenclature / DOCAM-style searches
- exposes a provider catalog so the UI/backend knows which external adapters to add next

## Why a CHIN profile (not a single CHIN thesaurus API)

CHIN guidance points institutions to multiple vocabularies depending on field/use case (AAT, Nomenclature, etc.).
So ARCHAI treats CHIN as a **vocabulary policy/profile layer** that orchestrates several sources.

## Next real integration steps

1. Add a real AAT adapter (Getty endpoint / local mirror)
2. Add a real Nomenclature adapter (LOD/RDF/JSON-LD import or service query)
3. Add local CHIN field mapping presets (Object Name, Object Type, Technique, Materials, etc.)
4. Add source priority + bilingual term preference rules (EN/FR)
5. Persist local mappings and approvals per institution

## UI status

`ARCHAI_v6.html` vocabulary lookup now queries:
- `/api/vocab/search?profile=chin&q=...`

If backend is unavailable, it falls back to local prototype vocab results.
