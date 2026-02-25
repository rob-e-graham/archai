# ResourceSpace + CollectiveAccess Field Mapping Notes (ARCHAI)

Derived from existing local helper workflows and adapted for FAMTEC/ARCHAI naming.

## ResourceSpace upload helper fields (recommended backend payload keys)

- `ca_object_id`
- `ca_object_title`
- `idno`
- `description`
- `item_type`
- `materials`
- `dimensions`
- `date`
- `subject_tags`
- `current_location`
- `photo_number`
- `filename` (generated if omitted)
- `cultural_safety_flags[]`

These are supported in `POST /api/upload/draft` and `POST /api/upload/filename`.

## Thesaurus search pattern

The existing thesaurus helper pattern (type/category/path search with quick copy) maps well to:

- `GET /api/vocab/search?q=...&type=...&category=...`

Starter types in scaffold:
- `Classification`
- `Materials`
- `Places`
- `Manufacturers`

## Note

Local legacy helper files are not copied into this package to avoid carrying older institution-specific labels and URLs. This document captures the reusable field design and behavior.
