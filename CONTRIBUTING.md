# Contributing to ARCHAI

## Priorities

ARCHAI is being developed as a sovereign, local-first GLAM toolkit. Contributions should preserve:

- separation of canonical heritage records from AI derivative layers
- local/self-hosted deployment options
- clear provenance and auditability
- cultural safety gating before indexing/generation

## Getting started (prototype + backend)

```bash
cd "/Users/robgraham/Desktop/ARCHAI APP"
./serve_local_archai.sh
```

In another terminal:

```bash
cd "/Users/robgraham/Desktop/ARCHAI APP/backend-archai"
cp .env.example .env
npm install
npm run dev
```

## Coding expectations

- Keep public UI changes accessible and readable on laptop + iPad widths
- Prefer additive changes over destructive rewrites in prototype files
- Preserve API route contracts where possible
- Add docs for any new workflow or integration

## High-value contribution areas

- CollectiveAccess adapter implementation + field mapping
- ResourceSpace adapter implementation + derivative publishing
- Qdrant + Ollama production adapters
- Cultural safety policy config + review workflow
- NFC runtime frontend bundle
- FAMTEC production split (separate service/app)
