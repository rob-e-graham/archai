# ARCHAI

ARCHAI is an open-source AI toolkit for cultural heritage institutions developed by Rob Graham through FAMTEC (Fine Art Media Tech).

This repository currently contains a working web and Capacitor iOS prototype focused on conversational collection access, metadata-grounded interpretation, and infrastructure that institutions can run on their own terms.

## Direction

ARCHAI is being developed as:

- a semantic interface layer that sits above existing collection management and digital asset management systems
- a framework for metadata-grounded conversational objects and collection discovery
- a sovereignty-first alternative to black-box, cloud-only AI deployments in the GLAM sector
- a practice-based research project where implementation, testing, and documentation evolve together

The project direction is centered on:

- vector embeddings for heritage discovery
- provenance-tracked AI interpretation
- separation between permanent heritage assets and regenerable AI layers
- conversational object experiences, including NFC-triggered interpretation
- hallucination prevention and curatorial boundary enforcement
- transferable, open-source infrastructure for institutional deployment

## Project Context

ARCHAI responds to a practical problem in museums, archives, and collection-based institutions: digitised collections often remain difficult to discover, interpret, and activate for both staff and visitors.

Rather than replacing institutional systems, ARCHAI is intended to connect to them through APIs, normalize metadata, generate semantic search infrastructure, and support conversational access grounded in verified collection records.

This repository represents an active prototype and research environment, not a finished product. It is part of a broader research and infrastructure direction around living archives, technological reanimation, cultural heritage AI, and institutionally sovereign deployment.

## Current Prototype in This Repo

The code in this repository currently includes:

- a single-page web frontend in `index.html`
- a Capacitor iOS wrapper in `ios/App`
- a Node backend in `server/server.js`
- prompt and profile configuration in `server/prompts`
- local and cloud AI routing
- Supabase-based account/auth scaffolding
- RevenueCat and token/memory scaffolding for premium features

## Key Principles

- Heritage data remains foundational and authoritative
- AI outputs should be regenerable, inspectable, and bounded
- Institutions should be able to own, audit, and rebuild their systems
- Uncertainty should be surfaced clearly rather than masked by fluent AI output
- Open infrastructure is preferable to vendor lock-in where possible

## Research Framing

The broader ARCHAI framework explores:

- conversational terminals for collection access
- NFC interpretation points as object-specific interfaces
- local LLM inference and vector search for sovereign deployment
- preservation of software-dependent and AI artworks through reproducible environments
- cultural safety pathways for sensitive materials

The practical argument behind the work is simple: a collection that has been digitised is not the same as a collection that can be found, understood, and meaningfully engaged with.

## Running This Prototype

### 1. Install dependencies

```bash
npm install
```

### 2. Set backend URL

Edit `public/config.js`:

```js
window.AURA_API_BASE = 'https://api.your-domain.com';
```

For local development, keep:

```js
window.AURA_API_BASE = 'http://localhost:3000';
```

### 3. Run web app locally

```bash
npm run dev
```

### 4. Build + sync iOS project

```bash
npm run ios
```

This runs:

- `npm run build`
- `npx cap sync ios`
- `npx cap open ios`

## Xcode Setup

In Xcode:

1. Set Signing Team
2. Confirm Bundle Identifier in `capacitor.config.json`
3. Set Version and Build number
4. Add app icons and launch assets
5. Configure any native capabilities required by the current build

## Cloud LLM Setup

The backend currently supports provider-based routing through the server layer.

1. Copy `server/.env.example` to `server/.env`
2. Set the provider credentials required by your chosen backend mode
3. Keep `LLM_PROVIDER=together` for current cloud mode
4. Use `LLM_PROVIDER=ollama` for local model fallback

The backend route `/api/llama` supports both providers in the current prototype.

## Prompt Editing

Edit these files to change model behavior without restructuring the app:

- `server/prompts/system_prompt.txt`
- `server/prompts/prompt_db.json`
- `server/prompts/soul.md`

Backend behavior:

- each request builds a base system prompt
- profile blocks can be layered in from `prompt_db.json`
- frontend context can be appended per request

Optional request field:

- `promptProfile` in `/api/llama` body, for example `balanced`, `poetic`, `direct`, or `deep`

## Notes

- This repository reflects Rob Graham's current independent research and development direction through FAMTEC.
- It should be read as an evolving ARCHAI prototype and infrastructure project, rather than as a legacy institutional profile.
- To test on a physical iPhone, the backend must be reachable over HTTPS.
