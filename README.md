# ARCHAI™ — Sovereign Semantic Heritage Infrastructure

> "Museums are not silent repositories of Memory; they are living, thinking organisms, where imagination and knowledge, tradition and innovation meet." — Gayane Umerova, UNESCO, 2025

**Version:** 11.6
**Author:** Rob Graham · FAMTEC (Fine Art Media Tech) / RMIT University
**Status:** Working prototype — rights-aware multi-institution semantic search + LLM object chat + AUX.IO visitor pages
**Target:** ISEA2026 Dubai, 6th Summit on New Media Art Archiving (April 11–12)
**Paper:** `docs/ARCHAI_ISEA2026_Rob_Graham.pdf`
**Licence:** MPL-2.0 (code) · CC BY 4.0 (MV data) · CC0 (Met data) · V&A Open Access — see [NOTICE](NOTICE) for IP and trademark details
**Trademark:** ARCHAI™ is a trademark of Rob Graham / FAMTEC. See NOTICE for usage terms.

---

## Research Status

ARCHAI is an active doctoral research project undertaken by Rob Graham through RMIT University and FAMTEC.

This repository contains an open-source reference implementation and associated research outputs.

Current build planning is tracked in [ROADMAP.md](ROADMAP.md), [ARCHAI_PROGRESS.md](ARCHAI_PROGRESS.md), and [docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md](docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md).

The proposed separation between the public website demo, a future read-only app demo, and the protected staff application is documented in [docs/PUBLIC_APP_DEMO_HOSTING.md](docs/PUBLIC_APP_DEMO_HOSTING.md).

The current per-source public-image and AUX.IO publication decisions are recorded in [backend-archai/docs/PUBLIC_MEDIA_AUDIT_2026-06-22.md](backend-archai/docs/PUBLIC_MEDIA_AUDIT_2026-06-22.md).

ARCHAI is a working research prototype, not a finished commercial product. FAMTEC is open to funded research partnerships, institutional pilot testing, accessibility evaluation, collection-data collaborations, software development support, grant partnerships, and feedback from museums, galleries, archives, universities, and aligned public-interest technology partners.

For research, funding, testing, or development enquiries: rob@fineartmedia.tech

Third-party collection data, trademarks, institutional names, and external systems remain the property of their respective owners. Use of the software does not imply endorsement by any institution represented within the project datasets.

### Public demo rights policy

ARCHAI preserves source licence and rights metadata per object. Public-facing ARCHAI and AUX.IO surfaces are intended to display only media that passes the current item-level legal gate for the research/demo stack.

- source metadata may be ingested more broadly for research and systems testing
- public-facing media should only be shown when the item resolves to an acceptable public/demo status
- all object views now surface a normalized legal status and the underlying licence / rights detail
- non-commercial / preview-first objects remain clearly labeled and should be treated as research/demo media, not general commercial reuse assets

Current audited collection/media layers:

- `3147` staff-searchable source records across `19` connected Qdrant collections
- `790` metadata-only records with no public image
- `2357` supplied image URLs tested on 22 June 2026
- `1884` image URLs passed availability checks
- `473` broken, blocked, placeholder, or non-image URLs hidden from visitor surfaces
- `504` otherwise available media records held from AUX.IO by item/source rights policy
- `1380` generated AUX.IO visitor pages with working, display-cleared media
- `440` pages explicitly cleared for derivative poster/sticker/postcard generation
- permanent numeric AUX.IO IDs are stored in `nfc-pages/aux-id-map.json`, so regenerating the catalogue does not move an existing QR or NFC tag to a different object

---

## Origin

The conceptual foundations of ARCHAI were developed over twenty years of professional practice across museums, galleries, and cultural institutions — including ACMI, TarraWarra Museum of Art, Heide Museum of Modern Art, Museums Victoria, Grande Experiences, and the National Communication Museum. All theoretical frameworks, design principles, and research questions emerged from this accumulated practitioner experience, entirely independent of any single institution.

All code in this repository was written after departing the National Communication Museum, developed independently through FAMTEC as part of doctoral research at RMIT University. The first version committed to GitHub (v6, the `v0.1-alpha` release) was the first working prototype, built from the updated PhD document and the ISEA2026 white paper. Earlier conceptual iterations (v1–v4) existed as planning documents and Claude.ai conversation prototypes during the research design phase — the ideas that informed them are documented in the PhD drafts and the ARCHAI Master Plan.

This repository, its commit history, and its git log constitute a verifiable research journal of the entire development process.

---

## Try It Live

| | |
|---|---|
| **ARCHAI Project Page** | [fineartmedia.tech/archai](https://fineartmedia.tech/archai) |
| **AUX.IO — Talk to Museum Objects** | [fineartmedia.tech/aux](https://fineartmedia.tech/aux) |
| **SafeChat — Crisis Safety Protocol** | [fineartmedia.tech/safechat](https://fineartmedia.tech/safechat) |
| **KeyTec — API Credential Vault** | [fineartmedia.tech/keytec](https://fineartmedia.tech/keytec) |
| **Dark Plates — Autonomous AI Artwork** | [darkplates.art](https://darkplates.art) |

---

## What's Working Right Now

### ✅ Multi-Collection Semantic Search
Nineteen source collections are in Qdrant and searchable by staff. Public media is governed separately from metadata availability:

| Collection | Source | Objects | Licence | Status |
|-----------|--------|---------|---------|--------|
| `archai_pilot` | Museums Victoria | 40 | CC BY 4.0 | ✅ Live |
| `archai_met` | The Metropolitan Museum of Art, NYC | 135 | CC0 | ✅ Live |
| `archai_va` | Victoria and Albert Museum, London | 300 | V&A Open Access | ✅ Live |
| `archai_aic` | Art Institute of Chicago | 150 | CC0 / public-domain only | ✅ Live |
| `archai_cma` | Cleveland Museum of Art | 150 | CC0 / public-domain only | ✅ Live |
| `archai_rijks` | Rijksmuseum | 150 | Public Domain Mark / open API | ✅ Live |
| `archai_europeana` | Europeana | 150 | Reusability=open / per-item | ✅ Live |
| `archai_auckland` | Auckland Museum | 120 | CC BY / open item-filtered | ✅ Live |
| `archai_tepapa` | Museum of New Zealand Te Papa Tongarewa | 95 | Non-commercial / preview-first, item rights attached | ✅ Live |
| `archai_mplus` | M+, Hong Kong | 110 | CC0 metadata · non-commercial preview media | ✅ Live |
| `archai_brasiliana` | Brasiliana Museus | 120 | Public domain / open-access, item-checked | ✅ Live |
| `archai_smithsonian` | Smithsonian Institution | 145 | Item-level CC0 image gate | ✅ Live · 141 media healthy |
| `archai_tate` | Tate | 150 | CC0 metadata only; images excluded | ✅ Staff metadata only |
| `archai_streetart` | Six municipal open-data sources | 439 | OGL / CC BY / public data; per-media review | ✅ Staff metadata only |
| `archai_getty` | J. Paul Getty Museum | 200 | Open Content verification required | ⚠️ Media held; legacy URLs failed audit |
| `archai_wellcome` | Wellcome Collection | 150 | Item-level open licences | ✅ Live · 149 media healthy |
| `archai_qagoma` | QAGOMA | 200 | CC BY metadata; media access pending | ✅ Staff metadata only |
| `archai_rawg` | RAWG Video Games Database | 193 | API display with active attribution link | ✅ Display only; downloads disabled |
| `archai_nga` | National Gallery of Art, Washington | 150 | CC0 metadata + `openaccess=1` image gate | ✅ Live · 150 media healthy |
| `archai_curator` | All live collections + comments | Built on demand | Mixed | ✅ Live |

- Query → embedded via nomic-embed-text → vector searched across all live collections → results merged by cosine similarity
- Results colour-tagged by source museum/institution
- Text fallback when Ollama offline
- Sort by: name, date, discipline, source
- Filter: with images (default), all, or source-specific subsets
- Deduplicated by canonical_id across collections
- Curator collection rebuilds from all `3147` current source records
- Auckland Museum, Te Papa, M+, Brasiliana, Smithsonian, Wellcome, public-art data, games metadata, and NGA broaden the research corpus geographically and materially
- Art Institute of Chicago is now harvested public-domain only at the API layer
- Europeana is currently harvested with `reusability=open`
- Te Papa media is ingested preview-first with item-level rights preserved for public-safe display
- Brasiliana onboarding only admits public-domain / open-access records that pass item-level rights checks
- Legal status is shown on object records in the main app, the public demo, and AUX.IO visitor pages
- `audit-public-media.js` tests image response, content type, placeholders, and canvas CORS before regeneration
- AUX.IO poster, sticker, and postcard tools are separately gated and include a self-hosted QR code

### ✅ Object-as-Speaker LLM Chat
Each object speaks in first person via the local Qwen 2.5 stack, grounded in verified metadata:
- System prompt built from ALL metadata fields
- Dynamic institution name per object
- Hallucination prevention: "That's not in my record"
- Metadata fallback when Ollama offline — no LLM required

### ✅ Object Detail Panel
- Full metadata, image, curatorial description
- Live Qwen 2.5 local chat with question chips
- Semantically related objects across all collections
- Source-specific links: "View on The Met →", "View on V&A →"
- **Visitor comment thread** — all comments (including flagged) with approve/remove/reply actions for curators

### ✅ AI-Moderated Visitor Comments
Comments submitted by visitors are AI-screened in real time:
- Ollama classifies each comment as safe / suspicious / harmful
- Safe comments visible immediately on the object page
- Suspicious/harmful comments hidden — sent to curator review queue
- **Human curator has final say** — approve or remove
- Threaded replies supported (staff can respond to visitors)
- Stored in SQLite — becomes part of the object's collection record
- Comments included in curator vector collection for semantic search

### ⚠️ Prototype Backend Proxy
The proxy provides useful public-demo protections, but it is not yet a complete authentication or authorisation boundary. The current staff app must remain private until the deny-by-default work in [docs/PUBLIC_APP_DEMO_HOSTING.md](docs/PUBLIC_APP_DEMO_HOSTING.md) is complete.

Current controls include:
- Rate limiting per IP (15 chat/min, 30 search/min)
- Prompt injection pattern blocking (regex filter)
- Safety wrapper prepended to all LLM system prompts
- Token and prompt length caps (512 tokens, 500 chars)
- All frontend fetch calls route through `qdrantFetch()`/`ollamaFetch()` wrappers

### ✅ Curator Vector Collection
Enriched `archai_curator` Qdrant collection combining:
- All object metadata from all live source collections
- Visitor comments attached to each object
- Rebuilt on demand via `POST /api/proxy/curator/build`
- Semantic search across everything via `POST /api/proxy/curator/search`

### ✅ AUX.IO Visitor Pages (Mobile)
Standalone AUX.IO object pages generated from the live collection set:
- Object image, metadata, description, LLM chat over LAN or via proxy
- Share: native iOS sheet, email, copy link, X/Twitter
- Comment submission with AI moderation (localStorage fallback offline)
- Related objects with cross-collection links
- Captive portal for exhibition WiFi

### ✅ AUX.IO Management Panel
- 3-column workflow: AUX.IO record list → editor → phone preview
- Create a new AUX.IO record from scratch for institutional testing
- Assign from loaded collection records, with search across all loaded objects
- Draft a local institutional object record with title, accession, institution, media URL, source URL, description, and rights status
- Edit gallery/location/physical trigger text for QR, NFC, kiosk, map, or spatial access points
- Search, filter, publish/unpublish, runtime-backend save, and export JSON config with rights/visibility metadata

### ✅ Role Switcher
| Role | Access |
|------|--------|
| Admin | All tabs |
| Curator | Curator, Nodel, AUX.IO, Vocab, Visitor, FAMTEC |
| Collections | Curator, AUX.IO, Vocab, Visitor, FAMTEC |
| Technician | Nodel, Visitor, FAMTEC |
| Volunteer | Curator, AUX.IO, Visitor, FAMTEC |
| Visitor | Visitor only |

### ✅ Curator Toolbar
- Select All / Export CSV / Batch Tag — fully wired
- CSV export with all metadata fields, scoped to selection or full collection
- Batch tagging applies keywords to selected objects and rebuilds vocab index

### ✅ FAMTEC Exchange
- Test space for interaction design, workflow feel, and interface prototyping inside ARCHAI
- Placeholder institution names are used to simulate exchange activity and help evaluate the app experience
- Feed includes loan, rental, skills, and crew-availability scenarios
- Post listings (hardware, skills, requests), send enquiries, view details
- Enquiries route to institution chat threads where available
- Chip filters and institution chat are functional prototype interactions
- This is not the final FAMTEC platform: production development will be handled separately by FAMTEC outside the PhD work, with potential later integration into ARCHAI once developed

### ✅ Nodel Panel
- Gallery cards with status indicators
- Node table, fault log, schedule
- Refresh status polling, emergency stop with confirmation
- Direct links to Nodel web UI and Directus admin

### ✅ Vocabulary & Thesaurus (CHIN-aligned)
- **Live vocabulary index** built from Qdrant payloads across all live collections (9 facets: discipline, category, object type, classifications, collecting areas, keywords, culture, period, medium)
- **CHIN/AAT reference terms** — 26 curated terms from Getty AAT with scope notes, broader/narrower hierarchies, and AAT IDs
- **DOCAM Glossaurus** — media art preservation terminology (emulation, migration, variable media, documentation strategies)
- **Nomenclature for Museum Cataloging** — Parks Canada/CHIN object naming and classification
- **CHIN Discipline Authority List (2006)** — bilingual EN/FR discipline headings
- Term search across all sources with scope notes, provider badges, and language tags
- Term detail panel: path, scope note, broader/narrower terms, related terms, collection usage with example objects
- Apply to Search (jumps to Curator with search), Add Local Mapping (creates institution-specific terms)
- Indigenous protocol layer with governance notice

## Screenshots

Desktop views:

![Curator collections search](docs/screenshots/archai-curator-collections-search-v10-6.png)
![Exhibitions live dashboard](docs/screenshots/archai-exhibitions-live-dashboard-v10-6.png)
![AUX.IO management with visitor preview](docs/screenshots/archai-nfc-management-visitor-preview-v10-6.png)
![Vocabulary and thesaurus tools](docs/screenshots/archai-vocabulary-thesaurus-v10-6.png)
![Visitor view object page](docs/screenshots/archai-visitor-view-proof-coin-v10-6.png)
![FAMTEC exchange](docs/screenshots/archai-famtec-exchange-v10-6.png)
![Object detail view](docs/screenshots/archai-object-detail-a-fifth-on-a-maze-v10-6.png)
![Curator object conversation](docs/screenshots/archai-curator-object-chat-a-fifth-on-a-maze-v10-6.png)

Mobile views:

![Mobile NFC index](docs/screenshots/archai-mobile-nfc-index-v10-6.png)
![Mobile object hero](docs/screenshots/archai-mobile-object-hero-dream-still-v10-6.png)
![Mobile object detail](docs/screenshots/archai-mobile-object-detail-dream-still-v10-6.png)
![Mobile object chat](docs/screenshots/archai-mobile-object-chat-dream-still-v10-6.png)
![Mobile object response](docs/screenshots/archai-mobile-object-response-dream-still-v10-6.png)
![Mobile related objects and footer](docs/screenshots/archai-mobile-object-related-footer-dream-still-v10-6.png)

---

## What's Not Working Yet

### 🔲 Cross-Collection LLM Intelligence (RAG)
LLM currently only sees one object's metadata. Needs RAG: embed user question → search Qdrant → inject related objects into LLM context → synthesise connections. Curators get full cross-collection access, visitors get bounded single-object responses.

### 🔲 LLM Image Analysis
Use llava to extract colours, text, objects from images → searchable metadata.

### 🔲 External Vocabulary APIs
AAT, LCSH, TGN, and ULAN are listed but inactive — currently using curated reference terms rather than live API lookups. Getty AAT LOD endpoint integration is architecturally ready.

### 🔲 FAMTEC Persistence
Current in-app FAMTEC Exchange uses prototype data and in-memory arrays only. The production FAMTEC Exchange platform will be developed separately by FAMTEC outside the PhD work, with potential later integration into ARCHAI once developed.

### 🔲 Directus Integration
Health-checked only. AUX.IO now saves to the runtime backend session and falls back to local confirmation, but production persistence still needs Directus/SQLite-backed storage for institutional object drafts and tag assignments.

### 🔲 Nodel API
Static prototype data. Needs WebSocket to real Nodel instance. UI links and emergency stop are wired.

### 🔲 Harvester Improvements
Date extraction from titles, better Met filtering, incremental harvest. Run Harvesters button verifies collection counts and triggers reload.

---

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                    ARCHAI Frontend                      │
│                 (ARCHAI_v10_8.html · browser)           │
│                                                         │
│  Search ──→ Ollama embed ──→ Qdrant (19 source collections)│
│  Chat   ──→ Ollama qwen2.5 ──→ grounded response        │
│  AUX.IO ─→ Ollama qwen2.5 ──→ chat over LAN / proxy     │
│  Sort   ──→ client-side on loaded objects               │
│  Comments ──→ Backend API ──→ AI moderation ──→ SQLite  │
└────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │
    localhost:6333  localhost:11434  localhost:8787
      Qdrant          Ollama        Backend API
                                   ├── Safe proxy (rate limit + injection block)
                                   ├── Comments (AI moderation → SQLite)
                                   ├── Curator vectors (build + search)
                                   └── Directus bridge (optional)

  Public access (Cloudflare Tunnel):
  Visitor phone ──→ tunnel ──→ Backend proxy ──→ Ollama/Qdrant
                                    └──→ Comments API (AI screened)
```

---

## Project Structure

```text
archai/
├── ARCHAI_v10_8.html              ← Main frontend (single-file app)
├── README.md                      ← This file
├── ARCHAI_OPERATIONS_GUIDE.md     ← Full ops guide (startup, testing, APIs, adding objects)
├── REMOTE_TESTING_GUIDE.md        ← Tailscale setup for iPad/iPhone testing
├── start-archai.sh                ← One-command startup + health checks
├── backend-archai/
│   ├── src/
│   │   ├── server.js              ← Express entry point
│   │   ├── data/db.js             ← SQLite database (comments)
│   │   ├── middleware/rateLimit.js ← Rate limiter
│   │   ├── routes/
│   │   │   ├── proxy.js           ← Safe Qdrant/Ollama/curator proxy
│   │   │   ├── comments.js        ← AI-moderated threaded comments
│   │   │   └── ...                ← Other route modules
│   │   └── services/
│   │       ├── moderation.js      ← Ollama comment screening
│   │       └── curator-vectors.js ← Curator collection builder
│   ├── scripts/
│   │   ├── nga-harvester.js       ← NGA CC0 + item-level open images
│   │   ├── audit-public-media.js  ← Availability/CORS audit before AUX.IO
│   │   └── ...                    ← Institution-specific legal harvesters
│   └── data/archai.db             ← SQLite (created at runtime)
├── nfc-pages/
│   ├── generate-nfc-pages.js      ← AUX.IO page generator from all live collections
│   ├── nfc-visitor-template.html  ← AUX.IO mobile template
│   ├── aux-id-map.json            ← Permanent canonical object → AUX.IO ID registry
│   ├── captive-portal.html
│   ├── vendor/qrcode-generator.js ← Self-hosted MIT QR generator
│   └── v/                         ← 1380 audited visitor pages
├── docs/
│   └── ARCHAI_ISEA2026_Rob_Graham.pdf
└── docker-compose.yml
```

---

## Quick Start

```bash
cd ~/Desktop/APPS/ARCHAI\ APP
./start-archai.sh
```

Starts Docker, Qdrant, Ollama (with LAN+CORS), backend API, frontend server. Runs 7 health checks, shows loaded models, Qdrant collections, comment count, and prints all URLs.

**Main app:** http://localhost:8000/ARCHAI_v10_8.html
**AUX.IO index:** http://localhost:8787/aux/index.html
**Backend API:** http://localhost:8787/api/health
**Remote testing:** via Tailscale VPN or equivalent secure networking

See `ARCHAI_OPERATIONS_GUIDE.md` for full setup, testing, and API reference.

---

## Hardware

Mac Studio M2 Max · 64GB · 1TB. Base institutional deployment: ~$3,500–5,000 USD one-time. No subscriptions, no cloud dependency.

---

## Version History

| Version | Changes |
|---------|---------|
| v6 | Initial prototype, mock objects |
| v7 | Role switcher, FAMTEC, Nodel, NFC, vocabulary |
| v10.4 | MV-only, live Qdrant + Ollama, LLM chat |
| v10.5 | Restored all panels, AUX.IO page generator |
| v10.6 | Multi-collection (MV+Met+V&A), sort/filter, dedup, AUX.IO share+comments, dynamic institutions |
| v10.7 | Live CHIN-aligned thesaurus (AAT+DOCAM+Nomenclature+CHIN Disciplines), all buttons wired, responsive thumbnail scaling, vocab search with scope notes and provider badges |
| **v10.8** | **Backend proxy for safe public hosting (rate limiting, prompt injection blocking), AI-moderated threaded comments, curator vector collection (all metadata + comments searchable), SQLite persistence, six live source collections in Qdrant, AUX.IO pages wired to backend API, object detail comment thread with approve/remove/reply, startup script with health checks, operations guide** |
| **v10.9** | **AUX.IO moved from the old 62-page website subset to the live generated collection manifest, public website wrappers aligned with newer institutions, and the current runtime/docs brought into sync around the expanded live object set** |
| **v11.0** | **Auckland Museum onboarded into the live stack, collection loading now scrolls beyond the first 200 Qdrant points, curator vectors rebuilt to 1085 live objects, AUX.IO source tagging corrected, and 951 public-facing visitor pages regenerated across 8 collections** |
| **v11.1** | **Te Papa Tongarewa onboarded as the ninth live collection, guest-token and registered-key API access supported, curator vectors rebuilt to 1205 live objects, AUX.IO default cap lifted, and 1071 public-facing visitor pages regenerated across 9 collections** |
| **v11.2** | **M+ Hong Kong onboarded as the tenth live collection with bilingual metadata preserved, public preview media attached from the source object pages, and the curator layer expanded to include Asia-focused visual culture records** |
| **v11.3** | **Brasiliana Museus onboarded as the eleventh live collection using a public-domain / open-access legal gate, curator vectors rebuilt to 1445 live objects, and 1311 AUX.IO visitor pages regenerated across 11 collections** |
| **v11.4** | **Legal cleanup and open-only backfill: 208 rights-restricted and 8 unevaluated objects removed from the live public stack, AIC re-harvested public-domain only, Europeana re-harvested with `reusability=open`, curator rebuilt to 1520 live objects, and AUX.IO regenerated with per-object legal status shown** |
| **v11.5** | **Main app alignment pass: roadmap added, audit refreshed, default browse now favours image-backed demo objects, result cards remain rights-aware, and AUX.IO management uses a larger live-object working set while generated-page sync remains the next step** |
| **v11.5.6** | **AUX.IO management workflow deepened: staff can create a new AUX.IO record, edit placement, assign from loaded records, draft an institution-owned object for testing, preview the visitor page, and export/save rights-aware config data** |
| **v11.5.7** | **AUX.IO save path made real for the current backend session: new tag assignments and institution draft objects can be posted to `/api/nfc`, stored in the runtime repository, audited, and returned to the app while Directus remains the production persistence target** |
| **v11.6** | **Nineteen collection sources and 3147 staff-searchable records aligned across app/backend; NGA onboarded with an item-level open-access gate; 2357 image URLs audited; 473 broken images and 504 rights-held media records removed from public presentation; 1380 AUX.IO pages regenerated; 440 rights-cleared pages gain compact QR poster/sticker/postcard tools; born-digital WACZ replay and an EaaSI integration boundary documented** |

---

Rob Graham · FAMTEC / RMIT · rob@fineartmedia.tech
GitHub: github.com/rob-e-graham/archai

---

ARCHAI™ is a trademark of Rob Graham / FAMTEC (Fine Art Media Tech). Use of the source code under MPL-2.0 does not grant trademark rights. See [NOTICE](NOTICE) for details.
