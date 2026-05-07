# ARCHAI — Operations Guide

Startup, testing, adding objects, and API reference.

## Quick Start

```bash
cd ~/Desktop/APPS/ARCHAI\ APP
./start-archai.sh
```

This single command starts all services and runs health checks. It will report which services are online, loaded models, Qdrant collections, and print URLs for local and Tailscale access.

---

## Prerequisites

| Component | Purpose | Install |
|-----------|---------|---------|
| Docker Desktop | Qdrant, Directus, Redis, MySQL | [docker.com](https://docker.com) |
| Ollama | Local LLM inference (llama3, nomic-embed-text) | [ollama.com](https://ollama.com) |
| Node.js 20+ | Backend API server | `brew install node` |
| Python 3 | Static frontend server | Pre-installed on macOS |
| Tailscale | Remote access from iPad/iPhone | [tailscale.com](https://tailscale.com) |

## Services & Ports

| Service | Port | What it does |
|---------|------|-------------|
| **Frontend** | 8000 | Static HTTP server for ARCHAI_v10_6.html and NFC pages |
| **Backend API** | 8787 | Express server — comments, proxy, search, admin |
| **Qdrant** | 6333 | Vector database — stores object embeddings |
| **Ollama** | 11434 | LLM inference — chat (llama3) and embeddings (nomic-embed-text) |
| **Directus** | 8055 | Headless CMS for editorial content |
| **Redis** | 6379 | Cache layer |
| **MySQL** | 3306 | Directus backing store |

---

## Manual Startup (step by step)

If you prefer to start services individually:

### 1. Docker containers

```bash
cd ~/Desktop/APPS/ARCHAI\ APP
docker compose up -d
```

Verify: `curl http://localhost:6333/collections` should return collection list.

### 2. Ollama

**Important:** Quit the Ollama GUI app first if running.

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" \
  /Applications/Ollama.app/Contents/Resources/ollama serve &
```

- `OLLAMA_HOST=0.0.0.0:11434` — binds to all interfaces (needed for Tailscale)
- `OLLAMA_ORIGINS="*"` — allows CORS from remote devices

Verify: `curl http://localhost:11434/api/tags` should list models.

**Required models:**
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 3. Backend API

```bash
cd backend-archai
cp .env.example .env   # first time only
npm install             # first time only
npm run dev
```

Verify: `curl http://localhost:8787/api/health`

### 4. Frontend

```bash
cd ~/Desktop/APPS/ARCHAI\ APP
python3 -m http.server 8000
```

Open: http://localhost:8000/ARCHAI_v10_6.html

---

## Testing

### Health checks (all at once)

```bash
./start-archai.sh
```

### Individual service checks

```bash
# Qdrant
curl http://localhost:6333/collections

# Ollama models
curl http://localhost:11434/api/tags

# Backend API
curl http://localhost:8787/api/health

# Backend proxy (Qdrant through proxy)
curl http://localhost:8787/api/proxy/qdrant/health

# Backend proxy (Ollama through proxy)
curl http://localhost:8787/api/proxy/ollama/health

# Comments API
curl http://localhost:8787/api/comments/stats

# Frontend
curl -I http://localhost:8000/ARCHAI_v10_6.html
```

### Testing AI chat

```bash
# Direct Ollama test
curl http://localhost:11434/api/chat -d '{
  "model": "llama3",
  "stream": false,
  "messages": [{"role":"user","content":"Say hello in one sentence"}]
}'

# Through the safe proxy (rate limited, injection blocked)
curl http://localhost:8787/api/proxy/chat -d '{
  "systemPrompt": "You are a teapot. Speak in first person.",
  "userPrompt": "What are you?",
  "history": []
}'
```

### Testing comments (AI moderated)

```bash
# Post a comment (will be AI-screened by Ollama)
curl -X POST http://localhost:8787/api/comments -H 'Content-Type: application/json' -d '{
  "objectId": "HT 27468",
  "collection": "archai_pilot",
  "text": "This reminds me of my grandmother's kitchen",
  "authorType": "visitor"
}'

# View comments for an object
curl 'http://localhost:8787/api/comments?objectId=HT%2027468'

# View flagged comments (curator queue)
curl http://localhost:8787/api/comments/flagged

# Approve a flagged comment
curl -X PATCH http://localhost:8787/api/comments/COMMENT_ID -H 'Content-Type: application/json' -d '{
  "status": "visible",
  "moderator": "rob"
}'

# Comment stats
curl http://localhost:8787/api/comments/stats
```

### Testing remote access (Tailscale)

From iPad/iPhone on the same Tailnet:

| What | URL |
|------|-----|
| Main app | `http://100.109.26.39:8000/ARCHAI_v10_6.html` |
| NFC visitor pages | `http://100.109.26.39:8000/nfc-pages/v/index.html` |
| Backend API | `http://100.109.26.39:8787/api/health` |

**Troubleshooting:** If the phone forces HTTPS, type `http://` explicitly. If AI chat gives generic responses, check Ollama is running with `OLLAMA_HOST=0.0.0.0:11434`.

---

## Adding New Objects

### How objects get into the system

Objects live in **Qdrant vector collections**. Each object is stored as a point with:
- A **768-dimension vector** (nomic-embed-text embedding of its metadata)
- A **payload** containing all metadata fields (title, type, date, description, images, etc.)

### Current collections

| Collection | Source | Objects | API |
|-----------|--------|---------|-----|
| `archai_pilot` | Museums Victoria | ~194 | [collections.museumsvictoria.com.au/api](https://collections.museumsvictoria.com.au/api) |
| `archai_met` | The Metropolitan Museum of Art, NYC | ~100 | [metmuseum.github.io](https://metmuseum.github.io/) |
| `archai_va` | Victoria and Albert Museum, London | ~80 | [developers.vam.ac.uk](https://developers.vam.ac.uk/) |
| `archai_curator` | All of the above + comments | Built on demand | Internal |

### Harvesting from existing APIs

**Museums Victoria** (archai_pilot):
The MV harvester was run manually during initial setup. MV's API is open at `https://collections.museumsvictoria.com.au/api/search`.

**The Met** (archai_met):
```bash
cd backend-archai/scripts
node met-harvester.js              # harvest default set (~100 objects)
node met-harvester.js --limit 200  # harvest more
```

**V&A London** (archai_va):
```bash
cd backend-archai/scripts
node va-harvester.js               # harvest default set (~150 objects)
node va-harvester.js --limit 100   # harvest fewer
```

Both harvesters:
1. Query the museum's public API with search terms (electronic art, digital, technology, etc.)
2. Fetch full object records with metadata and image URLs
3. Embed metadata text via Ollama (nomic-embed-text)
4. Upsert into Qdrant with the embedding vector and full payload

**Requirements:** Qdrant and Ollama must be running.

### Adding a new institution / API collection

To add a new museum source:

1. **Create a Qdrant collection:**
```bash
curl -X PUT http://localhost:6333/collections/archai_NEWNAME \
  -H 'Content-Type: application/json' \
  -d '{"vectors": {"size": 768, "distance": "Cosine"}}'
```

2. **Write a harvester script** — copy `met-harvester.js` or `va-harvester.js` as a template. Key things to adapt:
   - API endpoint and authentication
   - Field mapping (each museum API returns different JSON structures)
   - The `COLLECTION` constant (e.g. `archai_newmuseum`)
   - Search queries relevant to the institution

3. **Register in the frontend** — add the collection to `ARCHAI_v10_6.html`:
```javascript
// Line ~1222
const COLLECTIONS = ['archai_pilot', 'archai_met', 'archai_va', 'archai_NEWNAME'];
const COLLECTION_LABELS = {
  // ... existing ...
  archai_NEWNAME: { name: 'New Museum', short: 'NM', colour: 'rgba(R,G,B,0.7)', border: 'rgba(R,G,B,0.3)' }
};
```

4. **Register in the backend proxy** (if using public hosting):
```javascript
// backend-archai/src/routes/proxy.js line ~12
const ALLOWED_COLLECTIONS = ['archai_pilot', 'archai_met', 'archai_va', 'archai_NEWNAME'];
```

5. **Run the harvester:**
```bash
node your-harvester.js
```

6. **Regenerate NFC pages** (if the new objects should have visitor pages):
```bash
cd nfc-pages
node generate-nfc-pages.js --host http://100.109.26.39:11434
```

### Adding individual objects manually

```bash
# 1. Embed the object description
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "A brass astrolabe from 14th century Isfahan, used for astronomical observation"
}'
# Copy the embedding array from the response

# 2. Upsert into Qdrant
curl -X PUT 'http://localhost:6333/collections/archai_pilot/points' \
  -H 'Content-Type: application/json' \
  -d '{
    "points": [{
      "id": 99999,
      "vector": [PASTE_768_FLOATS_HERE],
      "payload": {
        "title": "Astrolabe",
        "object_type": "Scientific Instrument",
        "date_range": "14th century",
        "description": "A brass astrolabe from Isfahan...",
        "registration_number": "CUSTOM-001",
        "discipline": "Science & Technology",
        "media_thumbnail": "https://example.com/thumb.jpg",
        "source_url": "https://example.com/object"
      }
    }]
  }'
```

### Building the curator vector collection

After adding objects or accumulating visitor comments, rebuild the enriched curator collection:

```bash
curl -X POST http://localhost:8787/api/proxy/curator/build
```

This re-embeds all objects from all three source collections with their full metadata plus any visitor comments, creating `archai_curator` for deep semantic search.

```bash
# Search across everything (objects + comments)
curl -X POST http://localhost:8787/api/proxy/curator/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "objects related to early television technology", "limit": 10}'
```

---

## NFC Visitor Pages

### Generating pages

```bash
cd nfc-pages

# Local development
node generate-nfc-pages.js

# For Tailscale remote testing
node generate-nfc-pages.js --host http://100.109.26.39:11434

# For public hosting via Cloudflare Tunnel
node generate-nfc-pages.js --proxy https://your-tunnel-domain.com
```

This reads all objects from Qdrant and generates one standalone HTML page per object in `./v/`. Each page has:
- Object metadata baked in (works offline)
- AI chat (connects to Ollama or backend proxy)
- Related objects
- Comment submission (AI moderated)

### NFC page index

Browse all generated pages: `http://localhost:8000/nfc-pages/v/index.html`

---

## API Reference

### Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/comments?objectId=X` | Get visible comments for an object |
| POST | `/api/comments` | Submit a comment (AI moderated) |

### Proxy endpoints (for public hosting)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/proxy/qdrant/scroll` | Scroll through collection objects |
| POST | `/api/proxy/qdrant/search` | Semantic vector search |
| POST | `/api/proxy/embed` | Generate embedding via Ollama |
| POST | `/api/proxy/chat` | AI chat (rate limited, injection blocked) |
| GET | `/api/proxy/qdrant/health` | Qdrant status |
| GET | `/api/proxy/ollama/health` | Ollama status |

### Curator endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/comments/flagged` | Comments hidden by AI, awaiting review |
| GET | `/api/comments/objects` | Objects with comment counts |
| GET | `/api/comments/stats` | Comment counts by status/flag |
| PATCH | `/api/comments/:id` | Approve (`visible`) or remove a comment |
| POST | `/api/proxy/curator/build` | Rebuild enriched curator vector collection |
| POST | `/api/proxy/curator/search` | Semantic search across all objects + comments |

### Comment moderation flow

```
Visitor posts comment
        ↓
  Ollama AI classifies
   (safe / suspicious / harmful)
        ↓
  ┌─────┴─────┐
  safe       suspicious/harmful
  ↓               ↓
visible        hidden
immediately    (curator queue)
                  ↓
           curator reviews
           approve → visible
           remove  → gone
```

---

## Environment Variables

Key settings in `backend-archai/.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 8787 | Backend API port |
| `QDRANT_URL` | http://localhost:6333 | Qdrant vector database |
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama LLM server |
| `OLLAMA_EMBED_MODEL` | nomic-embed-text | Model for vector embeddings |
| `OLLAMA_CHAT_MODEL` | llama3.2 | Model for AI chat |
| `ARCHAI_DATA_DIR` | ./data | SQLite database location (point to NAS later) |
| `RESTRICTED_FLAGS` | secret-sacred,... | Cultural safety flags |

---

## File Structure

```
ARCHAI APP/
├── ARCHAI_v10_6.html          # Main frontend (single-file app)
├── start-archai.sh            # Startup + health check script
├── docker-compose.yml         # Qdrant, Directus, Redis, MySQL
├── backend-archai/
│   ├── src/
│   │   ├── server.js          # Express entry point
│   │   ├── config/env.js      # Environment config
│   │   ├── data/db.js         # SQLite database (comments)
│   │   ├── middleware/
│   │   │   └── rateLimit.js   # In-memory rate limiter
│   │   ├── routes/
│   │   │   ├── proxy.js       # Safe Qdrant/Ollama proxy
│   │   │   ├── comments.js    # AI-moderated comments API
│   │   │   └── ...            # Other route modules
│   │   └── services/
│   │       ├── moderation.js      # Ollama-based comment screening
│   │       └── curator-vectors.js # Curator collection builder
│   ├── scripts/
│   │   ├── met-harvester.js   # Met Museum API harvester
│   │   └── va-harvester.js    # V&A API harvester
│   └── data/
│       └── archai.db          # SQLite database (created at runtime)
└── nfc-pages/
    ├── generate-nfc-pages.js  # NFC page generator
    ├── nfc-visitor-template.html
    └── v/                     # Generated visitor pages (194+)
```

---

Rob Graham · FAMTEC / RMIT · 2026
