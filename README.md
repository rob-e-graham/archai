# ARCHAI — Sovereign Semantic Heritage Infrastructure

> "Museums are not silent repositories of Memory; they are living, thinking organisms." — Gayane Umerova, UNESCO, 2025

**Version:** 10.6 · **Author:** Rob Graham · FAMTEC / RMIT · **Target:** ISEA2026 Dubai (April 11–12)

---

## What's Working

### ✅ Multi-Collection Semantic Search
Three museums in Qdrant, searched simultaneously via nomic-embed-text embeddings:
- **Museums Victoria** (~80 objects, CC BY 4.0)
- **The Met, NYC** (~150 objects, CC0)
- **V&A, London** (~150 objects, Open Access)

Results colour-tagged by source. Sort by name/date/discipline/source. Filter by institution or images. Deduplicated by canonical_id.

### ✅ Object-as-Speaker LLM Chat
Each object speaks in first person via llama3, grounded in verified metadata. Dynamic institution names. Hallucination prevention active. Metadata fallback when Ollama offline.

### ✅ NFC Visitor Pages (Mobile)
200 standalone HTML pages from all 3 collections. Share (iOS native, email, copy, X). Persistent comments. LLM chat over LAN. Captive portal for exhibition WiFi.

### ✅ Role Switcher
Admin / Curator / Collections / Technician / Volunteer / Visitor — tab-level access gating.

### ✅ FAMTEC Exchange
Inter-institutional sharing: loan, rental, skills, crew. Institution chat. Prototype data.

### ✅ Nodel Panel
Gallery cards, node table, fault log, schedule, emergency stop. Prototype data.

### ✅ Vocabulary & Thesaurus
AAT, Local, LCSH, TGN. Term search. Indigenous protocol layer.

---

## Not Yet Working

- 🔲 Cross-collection RAG (LLM searching Qdrant mid-conversation)
- 🔲 LLM image analysis (llava for colours/text extraction)
- 🔲 Thesaurus backend (AAT API, auto-tagging)
- 🔲 FAMTEC persistence (needs Directus/SQLite)
- 🔲 NFC ↔ Curator linking
- 🔲 Directus integration (health-checked only)
- 🔲 Live Nodel API connection

---

## Quick Start
```bash
cd ~/archai && ./start-demo.sh
```

Starts Docker, Qdrant, Ollama (LAN+CORS), checks NFC pages, serves on port 8000.

- **Main app:** http://localhost:8000/ARCHAI_v10_6.html
- **NFC index:** http://localhost:8000/nfc-pages/v/
- **Phone:** http://LAN_IP:8000/nfc-pages/v/NFC066.html

---

## Architecture
```
ARCHAI Frontend (single HTML) → Ollama (embed+chat) → Qdrant (3 collections)
NFC Pages (static HTML) → Ollama over LAN → llama3 chat on phone
```

| Service | Port | Required |
|---------|------|----------|
| Qdrant | localhost:6333 | Yes |
| Ollama | localhost:11434 | Yes |
| Directus | localhost:8055 | No (optional) |

---

## Project Structure
```
archai/
├── ARCHAI_v10_6.html              ← Main frontend
├── start-demo.sh                  ← One-command startup
├── backend-archai/scripts/
│   ├── mv-harvester.js            ← Museums Victoria → Qdrant
│   ├── met-harvester.js           ← Met NYC → Qdrant
│   └── va-harvester.js            ← V&A London → Qdrant
├── nfc-pages/
│   ├── generate-nfc-pages.js      ← All collections → HTML per tag
│   ├── nfc-visitor-template.html
│   ├── captive-portal.html
│   └── v/                         ← Generated pages
├── docs/
│   └── ARCHAI_ISEA2026_Rob_Graham.pdf
└── docker-compose.yml
```

---

## Hardware

Mac Studio M2 Max · 64GB · 1TB. Institutional deployment: ~$3,500–5,000 USD one-time. No subscriptions, no cloud.

---

## Version History

| Version | Changes |
|---------|---------|
| v6 | Initial prototype |
| v7 | Role switcher, FAMTEC, Nodel, NFC, vocabulary |
| v10.4 | MV-only, live Qdrant + Ollama, LLM chat |
| v10.5 | Restored all panels, NFC page generator |
| **v10.6** | **Multi-collection, sort/filter, dedup, harvesters, NFC share+comments, 200 pages** |

---

Apache 2.0 · Rob Graham · FAMTEC / RMIT · rob@fineartmedia.tech
