# ARCHAI — Sovereign Semantic Heritage Infrastructure

**Version:** v10.5 (MV-Only · Live LLM · Full Metadata)  
**Author:** Rob Graham · FAMTEC / RMIT  
**Context:** PhD research project — semantic infrastructure for cultural memory in museums  
**Licence:** Research / prototype — MV collection data is CC BY 4.0 (Museums Victoria)

---

## What ARCHAI Is

ARCHAI is a single-page prototype (HTML/CSS/JS) that connects a local AI stack to Museums Victoria's open collection data. It provides:

- **Semantic search** across MV objects using vector embeddings (Qdrant + nomic-embed-text)
- **Object-as-speaker chat** — each museum object speaks in the first person via llama3, grounded in its verified metadata (hallucination prevention active)
- **NFC tag management** — assign physical NFC tags to MV objects, configure visitor-facing pages
- **Visitor view** — public-facing interface where visitors tap NFC, browse objects, ask questions
- **Nodel exhibition control** — gallery-level node monitoring for exhibition hardware (projectors, media players, robots, compute nodes)
- **FAMTEC Exchange** — institution-to-institution sharing of hardware, skills, and technician availability
- **Role-based access** — Admin / Curator / Collections / Technician / Volunteer / Visitor views with tab-level gating
- **Vocabulary & Thesaurus** — AAT, Local, LCSH, TGN integration for controlled metadata tagging

The entire frontend is a **single HTML file** (`ARCHAI_v10_5.html`) with no build step. It talks directly to local services over `localhost`.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ARCHAI Frontend                     │
│              (single HTML file · browser)            │
│                                                     │
│   Curator Search ──→ Ollama embed ──→ Qdrant search │
│   Object Chat    ──→ Ollama llama3 ──→ response     │
│   Visitor View   ──→ Ollama llama3 ──→ response     │
│   NFC Management ──→ local state (Directus future)  │
│   Nodel Panel    ──→ prototype (Nodel API future)   │
│   FAMTEC Exchange──→ prototype (separate DB future)  │
└───────┬──────────────┬──────────────┬───────────────┘
        │              │              │
   localhost:6333  localhost:11434  localhost:8055
     Qdrant           Ollama        Directus (optional)
   (vector DB)      (local LLM)      (CMS layer)
```

### Service Ports

| Service | Port | Purpose | Required? |
|---------|------|---------|-----------|
| **Qdrant** | `localhost:6333` | Vector database — stores MV object embeddings | **Yes** |
| **Ollama** | `localhost:11434` | Local LLM — embedding (nomic-embed-text) + chat (llama3) | **Yes** |
| **Directus** | `localhost:8055` | Headless CMS — future structured editing layer | **No** (optional, health-checked only) |
| **Backend** | `localhost:8787` | ARCHAI backend API (Cloudflare Workers style) | **No** (referenced in infra bar, not required for prototype) |

### Data Flow

1. **MV Harvester** (`node scripts/mv-harvester.js`) pulls objects from Museums Victoria's public API
2. Objects are embedded via `nomic-embed-text` (Ollama) and stored in Qdrant collection `archai_pilot`
3. Frontend loads objects from Qdrant on page load via `/collections/archai_pilot/points/scroll`
4. Semantic search: query → Ollama embed → Qdrant nearest-neighbour → ranked results
5. Object chat: metadata → llama3 system prompt → grounded first-person response
6. Text fallback: if Ollama is offline, search falls back to text matching against loaded objects

---

## Local Development Setup

### Prerequisites

- **Docker** (for Qdrant)
- **Ollama** (native macOS/Linux install recommended)
- **Node.js** ≥18 (for the harvester script)
- A modern browser (Chrome/Firefox/Safari)

### 1. Start Qdrant

```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

Or via docker-compose if you have a `docker-compose.yml`:

```bash
docker compose up -d
```

### 2. Start Ollama

```bash
# Install if needed: https://ollama.com
ollama serve
```

**Critical for browser access** — set CORS origins:

```bash
# macOS
launchctl setenv OLLAMA_ORIGINS "*"
# Then restart Ollama

# Linux (systemd)
sudo systemctl edit ollama
# Add: Environment="OLLAMA_ORIGINS=*"
# Then: sudo systemctl restart ollama
```

Pull required models:

```bash
ollama pull nomic-embed-text   # embedding model
ollama pull llama3             # chat model
```

### 3. Run the MV Harvester

```bash
cd backend-archai   # or wherever your backend scripts live
node scripts/mv-harvester.js
```

This pulls objects from the Museums Victoria Collections API, embeds them, and stores them in Qdrant under the `archai_pilot` collection.

### 4. Open the Frontend

Serve locally (required for fetch calls — `file://` protocol blocks CORS):

```bash
# Simple Python server
python3 -m http.server 8000

# Then open:
# http://localhost:8000/ARCHAI_v10_5.html
```

Or use any static file server (live-server, http-server, etc).

### 5. Directus (Optional — Not Required Yet)

```bash
docker run -d --name directus -p 8055:8055 \
  -e KEY=your-key -e SECRET=your-secret \
  -e DB_CLIENT=sqlite3 -e DB_FILENAME=/directus/database/data.db \
  directus/directus
```

Directus is health-checked in the infra bar but not used for any data operations yet. It becomes relevant when you want a structured CMS layer for exhibition node assignments and content editing beyond what the prototype provides.

---

## Project Structure (Current)

```
archai/
├── ARCHAI_v10_5.html          # ← THE FRONTEND (single file, everything)
├── README.md                   # ← This file
├── backend-archai/             # Backend services (if exists)
│   ├── scripts/
│   │   └── mv-harvester.js    # MV API → embed → Qdrant ingest
│   └── ...
├── docker-compose.yml          # Qdrant + optional Directus
└── qdrant_storage/             # Qdrant persistent data (Docker volume)
```

### Frontend File Anatomy

`ARCHAI_v10_5.html` is ~2050 lines containing:

| Section | Lines (approx) | What it does |
|---------|----------------|--------------|
| CSS variables + reset | 1–20 | Design tokens, dark theme |
| Header + infra bar styles | 20–50 | Sticky header, service health dots |
| Tab + panel styles | 50–70 | Tab navigation, role restrictions |
| Curator panel styles | 70–135 | Search bar, result cards, sidebar |
| NFC management styles | 135–235 | 3-column NFC editor, phone preview |
| Vocabulary styles | 237–280 | Term search, AAT/LCSH integration |
| Visitor panel styles | 282–325 | Public-facing object pages |
| Object detail styles | 327–390 | Full metadata view, chat, related |
| Nodel + FAMTEC styles | 390–480 | Gallery cards, node table, exchange |
| HTML panels | 490–930 | All 7 panels + object detail |
| JavaScript | 930–2050 | All logic, data, API calls |

---

## Key Features — How They Work

### Semantic Search
User types a query → embedded via `POST localhost:11434/api/embeddings` (nomic-embed-text) → vector sent to `POST localhost:6333/collections/archai_pilot/points/search` → top 20 results returned with cosine similarity scores. Falls back to text matching if Ollama is offline.

### Object Chat (llama3)
Each object gets a system prompt built from ALL its MV metadata fields. The LLM speaks as the object in first person. Hallucination prevention: the prompt explicitly tells llama3 to only use verified metadata and to say "that's not in my record" for anything unknown. Chat history is maintained per-object session.

### Metadata Fallback
When Ollama is offline, `generateMetadataResponse()` maps question intent (materials, history, significance, location, etc.) to relevant metadata fields and constructs a response directly from the record. No LLM required.

### Role Switching
`ROLE_DEFS` maps each role to allowed tabs. `applyRoleAccess()` adds `.restricted` class to disallowed tabs (greyed out, non-clickable). If the current tab becomes restricted on role change, auto-switches to first allowed tab.

### FAMTEC Exchange
Prototype data in `FAMTEC_FEED` array. Institution list, searchable feed with chip filters, institution-to-institution chat. In production this would be a separate platform with its own database — shown inside ARCHAI for workflow testing only.

### NFC Management
Tags auto-generated from first 8 MV objects on load. 3-column layout: tag list → editor (assign object, toggle visibility, edit chips/story) → phone-frame preview. Publishing sets tag status to 'live'.

---

## Migration Notes for Claude Code

### What to Keep
- All Qdrant integration (search, scroll, embedding)
- All Ollama integration (embed, chat, health checks)
- The MV harvester pipeline
- Role switching logic and ROLE_DEFS
- NFC management and visitor view
- FAMTEC exchange prototype data and UI
- Nodel gallery cards and node table
- Metadata fallback system (`generateMetadataResponse`)

### What to Consider Changing
- **Single file → component architecture**: The HTML file is self-contained by design (easy to ship, no build step). For Claude Code, you might want to split into modules, but the single-file approach works well for rapid iteration and ISEA demo.
- **Directus**: Not wired into any data operations. Keep the health check, add Directus integration when you need structured content editing (exhibition node assignments, NFC page content management).
- **FAMTEC Exchange**: Currently prototype-only data. In production, this becomes a separate service with its own auth/DB. The ARCHAI integration boundary is intentional.
- **Nodel Integration**: Gallery cards and node table are static/prototype. Real Nodel API integration would replace the static HTML with live WebSocket data from your Nodel instance.
- **Backend (localhost:8787)**: Referenced in infra bar but not used for any core operations. The frontend talks directly to Qdrant and Ollama.

### Environment Variables / Config

Currently hardcoded in the HTML. For Claude Code migration, extract these:

```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=archai_pilot
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3
DIRECTUS_URL=http://localhost:8055    # optional
MV_API_BASE=https://collections.museumsvictoria.com.au/api
```

### CORS Requirements

Ollama must have `OLLAMA_ORIGINS=*` set, otherwise browser fetch calls will fail. Qdrant allows CORS by default. This is the most common setup issue.

### Testing Checklist

- [ ] Qdrant reachable — green dot in infra bar, object count displayed
- [ ] Ollama reachable — green dot, model names shown
- [ ] MV objects load on page open — result cards appear with thumbnails
- [ ] Semantic search works — type query, get ranked results with cosine scores
- [ ] Text fallback works — stop Ollama, search still returns text-matched results
- [ ] Object detail opens — click any result card, full metadata + chat panel
- [ ] LLM chat works — ask object a question, get first-person response
- [ ] Metadata fallback works — stop Ollama, ask object question, get metadata response
- [ ] NFC management — tags listed, assign object, preview updates
- [ ] Visitor view — object list, story, ask questions, related works
- [ ] Role switcher — change role, tabs grey out appropriately
- [ ] FAMTEC exchange — institution list, feed cards, chat, chip filters
- [ ] Nodel panel — gallery cards, node table, fault log visible

---

## Version History

| Version | Key Changes |
|---------|-------------|
| v6 | Initial prototype with mock objects, local search |
| v7 | Role switcher, FAMTEC exchange, Nodel gallery cards, NFC management, visitor view, vocabulary panel |
| v10.4 | MV-only — removed all mock objects, live Qdrant integration, live Ollama LLM chat, object detail panel, semantic search with text fallback, metadata response generator |
| **v10.5** | **Restored: role switcher, FAMTEC exchange tab, full Nodel panel (gallery cards + node table + fault log), tab role-gating. All v10.4 MV/Qdrant/Ollama functionality preserved.** |

---

## Useful Commands

```bash
# Check Qdrant is running
curl http://localhost:6333/collections

# Check Ollama models
curl http://localhost:11434/api/tags

# Check Directus health
curl http://localhost:8055/server/health

# Count objects in Qdrant
curl -s http://localhost:6333/collections/archai_pilot | jq '.result.points_count'

# Test embedding
curl http://localhost:11434/api/embeddings -d '{"model":"nomic-embed-text","prompt":"telephone"}'

# Test chat
curl http://localhost:11434/api/chat -d '{"model":"llama3","stream":false,"messages":[{"role":"user","content":"hello"}]}'

# Serve frontend locally
python3 -m http.server 8000
```

---

## Contact

Rob Graham — FAMTEC / RMIT  
GitHub: [github.com/rob-e-graham/archai](https://github.com/rob-e-graham/archai)
