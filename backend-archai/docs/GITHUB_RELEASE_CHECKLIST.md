# GitHub Tonight Checklist

## Before pushing

- [ ] Confirm `.env` not committed (use `.env.example` only)
- [ ] Confirm no institution secrets / keys in code or docs
- [ ] Confirm legacy institution-specific references removed from public-facing files
- [ ] Add screenshots (optional) for `ARCHAI_v6` and `FAMTEC_exchange`
- [ ] Add issue templates for integration tasks (optional)

## Suggested first GitHub issues

- [ ] Implement CollectiveAccess live adapter (API auth + field mapping)
- [ ] Implement ResourceSpace live adapter (API auth + asset metadata fetch)
- [ ] Implement Qdrant REST adapter (real upsert/search)
- [ ] Implement Ollama embedding + chat calls
- [ ] Connect `ARCHAI_v6.html` search to `/api/search`
- [ ] Replace inline NFC HTML endpoint with dedicated frontend bundle
- [ ] Add test suite + schema validation for pipeline mappings
- [ ] Add cultural safety policy configuration UI
