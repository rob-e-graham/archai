# ARCHAI™
## Sovereign Semantic Heritage Infrastructure

> *"Museums are not silent repositories of Memory — they are living, thinking organisms, where imagination and knowledge, tradition and innovation meet. They are spaces where the past is not only preserved but reborn, where every visitor becomes part of a continuous human conversation."*
> — Gayane Umerova, UNESCO Global Dialogue on AI and the Future of Museums, 2025

**ARCHAI** (Augmented Reanimation, Cultural Heritage, Artificial Intelligence) is a sovereign, open-source-method AI toolkit for cultural institutions and artist-run spaces. It layers conversational AI onto collection objects using local language models, vector semantic search, and AUX.IO visitor interfaces (deployable via NFC, QR, hyperlink, or beacon) — with all computation running on locally-owned hardware and collection data never leaving the institution's physical infrastructure.

The research paper (#999) was accepted for the **6th Summit on New Media Art Archiving, ISEA2026 Dubai**. The paper is at `docs/ARCHAI_ISEA2026_Rob_Graham.pdf`. A post-submission update covering June 2026 developments is at `docs/ARCHAI_ISEA2026_UPDATE_2026-06.md`.

---

## Research Context

**Investigator:** Rob Graham  
**Institution:** RMIT University, School of Design — PhD Researcher (DR235)  
**Organisation:** FAMTEC (Fine Art Media Tech)  
**Supervisors:** Chris Barker (Senior), co-supervisor TBC  
**Contact:** rob@fineartmedia.tech  

ARCHAI is a practice-based doctoral research project. In practice-based research, building constitutes the research — not as illustration of theory, but as the primary epistemic act. The commit history of this repository is part of the methodology. The prototype iterations are documented findings. The code advances arguments that the writing must then sustain.

The research draws on a lineage extending from the Greek method of loci (Simonides, Cicero, Quintilian) through Renaissance rhetorical prosopopoeia to contemporary AI data art (Anadol, Ernst, Kirschenbaum). ARCHAI proposes a specific inversion of the classical memory palace technique: where in the original, a human uses architecture as a mnemonic device for knowledge held internally, ARCHAI uses AI to externalise the building's knowledge to visitors moving through it. Each NFC tag is a locus. Each collection object is its own bounded epistemic domain. The visitor retains nothing artificially; the building has already done the remembering, and it speaks.

---

## What ARCHAI Does

**Conversational collection access** — visitors hold natural language conversations with individual objects via NFC tap or QR scan. Each object speaks from its own curatorially-validated metadata record, with explicit epistemic boundaries. A five-layer hallucination prevention framework ensures responses remain grounded in verified curatorial fact.

**Sovereign infrastructure** — all AI inference (Ollama / qwen2.5:32b), vector search (Qdrant), and data processing runs locally. No visitor query, no object record, and no institutional data is transmitted to third-party cloud services.

**Cross-institutional semantic search** — nomic-embed-text embeddings (768-dimension) index the current 3,147-record pilot corpus across international museum, gallery, open-data, and digital-culture sources. Queries are natural language; results are merged by cosine similarity across all collections.

**Physical deployment** — a five-format downloadable artefact system (A4, A2, A0, postcard, sticker) generated client-side via Canvas API. Each format embeds a QR code linking to the live AUX.IO conversation page, a IIIF-sourced image from the originating institution, and full attribution. Museum objects enter public space — paste-up, zine, mural companion — while remaining connected to a live conversational interface.

**Rights-aware harvesting** — every object in the system has passed a per-item legal gate at harvest time. Licence status (CC0, CC BY, metadata-only, open government) is enforced in code, not configuration, and surfaced on every object page. No image is displayed on a public ARCHAI or AUX.IO surface without having passed that gate.

---

## Collection Status — June 2026

20 live collections/data sources · 3,147+ current records · 1,402 public AUX.IO visitor pages generated

| Collection | Institution | Objects | Licence | Status |
|---|---|---|---|---|
| `archai_pilot` | Museums Victoria | 40 | CC BY 4.0 | Live |
| `archai_met` | The Metropolitan Museum of Art, New York | 200 | CC0 | Live |
| `archai_va` | Victoria and Albert Museum, London | 300 | V&A Open Access | Live |
| `archai_aic` | Art Institute of Chicago | 150 | CC0 (public domain gate) | Live |
| `archai_cma` | Cleveland Museum of Art | 150 | CC0 (public domain gate) | Live |
| `archai_rijks` | Rijksmuseum, Amsterdam | 150 | Public Domain Mark | Live |
| `archai_europeana` | Europeana | 150 | Reusability=open (per-item) | Live |
| `archai_auckland` | Auckland War Memorial Museum | 120 | CC BY | Searchable metadata; public media held pending real image derivatives |
| `archai_tepapa` | Museum of New Zealand Te Papa Tongarewa | 95 | Non-commercial / item rights attached | Live |
| `archai_mplus` | M+, Hong Kong | 110 | CC0 metadata · preview media | Live |
| `archai_brasiliana` | Brasiliana Museus | 120 | Public domain / open-access (item gate) | Live |
| `archai_tate` | Tate, London | 150 | CC BY (pre-1920 filter) | Live |
| `archai_wellcome` | Wellcome Collection, London | 150 | CC BY | Live |
| `archai_smithsonian` | Smithsonian Institution | 150 | CC0 (API flag gate) | Live |
| `archai_getty` | J. Paul Getty Museum, Los Angeles | 200 | CC0 (Linked Art SPARQL) | Live |
| `archai_qagoma` | QAGOMA, Brisbane | — | Metadata-only (image API blocked) | Partial |
| `archai_streetart` | Municipal public/street-art data | 439 | Brussels CC BY 4.0 images; other municipal feeds metadata/source-link only | Mixed: 139 public images + staff metadata |
| `archai_rawg` | RAWG Video Games Database | varies | RAWG API (attribution required) | Live |
| `archai_curator` | All live collections + visitor comments | Built on demand | Mixed | Live |

---

## Core Technical Contributions

Twelve interconnected contributions characterise the research:

1. **Vector embeddings for heritage discovery** — semantic search across heterogeneous collections without reliance on controlled curatorial vocabulary.
2. **Provenance-tracked AI interpretation** — every generated response records its complete derivation chain back to source materials.
3. **Two-layer architecture** — permanent heritage assets held separately from regenerable AI processing layers. The heritage foundation is never modified by AI.
4. **Conversational objects** — individual collection items speaking to visitors from their own validated metadata, via NFC tap or QR scan.
5. **Five-layer hallucination prevention** — structured metadata schemas, AI epistemic constraints, real-time validation, human curator sign-off, and post-launch monitoring.
6. **Transferable hardware reference implementation** — a sovereign, scalable open-source stack adaptable to institutions of varying size. Total capital investment: approximately AUD 10,000–20,000 one-time; no subscriptions.
7. **Cross-institutional open data pipeline** — automated harvesting from international museum, gallery, open-data, and digital-culture sources with per-source licence verification, IIIF integration, and legal gate enforcement at point of ingest.
8. **Physical deployment layer** — five-format downloadable artefact system (A4/A2/A0/postcard/sticker) generated client-side via Canvas API, enabling museum objects to enter public space with live QR links back to conversational interfaces.
9. **Multilingual audio interface** — voice input (Whisper, local), voice output (Coqui TTS), extending conversational access across languages and interaction modalities.
10. **Multi-category public cultural data integration** — municipal open data (street and public art, six cities) and interactive digital culture (RAWG games) integrated under identical licence-gate enforcement as institutional museum collections.
11. **Thematic discovery navigation** — disciplinary group tabs with per-institution sub-tabs across the current 3,147-record corpus, enabling cross-collection discovery without controlled vocabulary dependency.
12. **Legal gate enforcement at scale** — per-source rights verification documented in a collection-targets matrix, implemented in harvester code, and surfaced on every public object page.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — Interface                                             │
│  ARCHAI Web App (v11.5) · AUX.IO Visitor Pages (1,519 pages)    │
│  Role-aware · NFC/QR/link/beacon · Curator · Collections ·      │
│  Technician · Volunteer · Visitor · Admin                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│  LAYER 2 — Derivative Processing Layer (Regenerable)            │
│  Qdrant · Ollama / qwen2.5:32b · nomic-embed-text               │
│  Express.js proxy · Rate limiting · Prompt injection blocking    │
│  Nightly pipeline · Cultural safety gate · Provenance trace      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│  LAYER 1 — Heritage Foundation Layer (Permanent)                │
│  CollectiveAccess (CMS) · ResourceSpace (DAMS)                  │
│  Canonical records · Artist statements · Conservation reports   │
│  Primary digital assets — NEVER modified by AI                  │
└──────────────────────────────────────────────────────────────────┘

Public access: Visitor device → Cloudflare Tunnel → Backend proxy → Ollama / Qdrant (local)
Storage: Hot NAS (SSD RAID) · Warm NAS (HDD RAID) · Cold LTO-9 tape (off-site, ransomware-immune)
Compute: Apple Mac Studio M4 Max · 64GB Unified Memory · under 120W at full inference
```

**Open-source software stack:**

| Component | Role |
|---|---|
| Qdrant | Vector database · semantic search · self-hosted |
| Ollama / qwen2.5:32b | Local LLM inference · conversational objects |
| nomic-embed-text (768-dim) | Open-source embedding model · local |
| CollectiveAccess | Collection management · Heritage Foundation Layer |
| ResourceSpace | Digital asset management · canonical media |
| Ghost / Directus | Headless CMS · curator interpretation layer |
| Whisper (local) | Voice input transcription · no visitor speech sent externally |
| Coqui TTS | Per-object, per-language voice synthesis |
| Proxmox VE | VM snapshots · behaviour preservation for AI artworks |

---

## AUX.IO — Visitor Interface

AUX.IO (from Latin *aux*, voice) is the public-facing visitor interface: a per-object conversation page deployable via NFC tag, QR code, hyperlink, or Bluetooth beacon. Each page is a self-contained static HTML file embedding the object's complete metadata and AI context. No app is required; no login is needed; no data is collected from the visitor.

From any AUX.IO page, a visitor may:
- hold a natural language conversation with the object (grounded in its verified record)
- select a response style: Guide / Curatorial / Learning / Interpretive
- use voice input and audio response (browser SpeechRecognition + SpeechSynthesis; Whisper/Coqui in development)
- download a print-ready poster in five formats
- share the page, copy the link, or post directly
- submit a response that joins the collection record (curator-reviewed before publication)
- navigate to related objects across the current live collection set

The open call **#ARCHAIinTheWild** invites communities — street artists, collectives, educators, zine makers — to take AUX.IO posters into public space. Every poster embeds a QR code that connects back to the live conversational interface.

---

## Repository Structure

```
archai/
├── ARCHAI_v10_8.html              ← Main web application (single-file, role-aware)
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
│   └── v/                         ← 1519 audited visitor pages
├── docs/
│   ├── ARCHAI_ISEA2026_Rob_Graham.pdf         ← Conference paper
│   └── ARCHAI_ISEA2026_UPDATE_2026-06.md      ← Post-submission update
├── LICENSE                        ← All rights reserved
└── docker-compose.yml
```

---

## Intellectual Property and Licence

**Copyright © 2026 Rob Graham. All rights reserved.**

This repository and all associated source code, documentation, assets, and files are the exclusive property of Rob Graham. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, sell, or create derivative works from this software or its documentation, in whole or in part, without prior written permission from Rob Graham.

**ARCHAI™** is a trademark of Rob Graham / FAMTEC (Fine Art Media Tech). First use in commerce: 2024. Classes covered: software (9), SaaS/research (42), cultural services (41). Use of anything in this repository does not grant any right to use the ARCHAI™ name or branding.

**Third-party data:** Collection data, images, and metadata harvested from source institutions remain the property of those institutions and are subject to their respective licence terms. ARCHAI harvests only materials that pass a per-item legal gate. Each source institution's licence conditions are documented in `backend-archai/scripts/collection-targets.json` and enforced in harvester code. Institutional names and trademarks are used for identification purposes only and do not imply endorsement.

**Research outputs:** All conceptual frameworks, architectural patterns, and research findings documented in this repository are Rob Graham's intellectual property under active doctoral research at RMIT University.

For licensing enquiries: rob@fineartmedia.tech

---

## Origin and Research Independence

The conceptual foundations of ARCHAI were developed over more than twenty years of professional practice across museums, galleries, and cultural institutions — including ACMI, TarraWarra Museum of Art, Heide Museum of Modern Art, Museums Victoria, Grande Experiences, and the National Communication Museum. All theoretical frameworks, design principles, and research questions emerged from this accumulated practitioner experience, and are entirely independent of any single institution or employer.

All code in this repository was written after departing the National Communication Museum, developed independently through FAMTEC as part of doctoral research at RMIT University, School of Design. The first version committed to this repository (v6, the `v0.1-alpha` release) was the first working prototype, built from the updated PhD research document and the ISEA2026 white paper. Earlier conceptual iterations (v1–v4) existed as planning documents and AI-assisted conversation prototypes during the research design phase — the ideas that informed them are documented in the PhD drafts and the ARCHAI Master Plan.

This repository, its commit history, and its git log constitute a verifiable, timestamped research journal of the entire development process, establishing clear provenance for all code, design decisions, and research outputs.

---

## Collaboration and Partnership

FAMTEC and RMIT are open to the following forms of engagement:

- **Funded research partnerships** — co-investigator roles, ARC Linkage, or industry-funded PhD support
- **Institutional pilot testing** — hosting a sovereign ARCHAI deployment on institutional hardware
- **Collection data collaboration** — contributing open-licensed collection data to the pipeline
- **Accessibility evaluation** — testing multilingual and multimodal interfaces with diverse visitor groups
- **Software development support** — contribution to specific system components under formal agreement
- **Grant partnerships** — co-applicants on public-interest technology and digital heritage programmes

ARCHAI is a working research prototype, not a finished commercial product. All partnership discussions are subject to formal agreement and consistent with RMIT University's research integrity and IP policies.

**Contact:** Rob Graham · rob@fineartmedia.tech  
**Project:** fineartmedia.tech/archai  
**AUX.IO:** fineartmedia.tech/aux  
**GitHub:** github.com/rob-e-graham/archai

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
| **v11.6.1** | **Brussels public street-art images enabled through the dataset's CC BY 4.0 licence, Vancouver/Melbourne municipal feeds retained as metadata/source-link only, curator rebuilt to 3147 records, and AUX.IO regenerated to 1519 public pages with 139 street-art pages** |
| **v11.6.2** | **Auckland placeholder-media audit added; high-resolution Auckland API placeholders are now detected by content hash and held from public AUX.IO while remaining searchable in the staff database. Curatorial object detail gained share/copy, save-to-project, read-summary, and a local project-list workspace for staff testing. AUX.IO regenerated to 1,402 public pages after placeholder and rights gates.** |

---

## Selected References

Kirschenbaum, M. G. (2008). *Mechanisms: New Media and the Forensic Imagination*. MIT Press.

Rinehart, R. & Ippolito, J. (2014). *Re-collection: Art, New Media, and Social Memory*. MIT Press.

Ernst, W. (2013). *Digital Memory and the Archive*, ed. Parikka, J. University of Minnesota Press.

Quintilian (c. 95 CE). *Institutio Oratoria*, trans. Butler, H. E. Harvard University Press, 1921.

Cicero (55 BCE). *De Oratore*, trans. Sutton, E. W. & Rackham, H. Harvard University Press, 1942.

Kelly, L. (2016). *The Memory Code*. Allen & Unwin.

Szántó, A. & Campbell, T. P. (2025). "A.I. Is Coming for Museums." *Artnet News*, 29 October 2025.

Global Indigenous Data Alliance. (2020). *CARE Principles for Indigenous Data Governance*. gida-global.org/care

---

*ARCHAI™ — Copyright © 2026 Rob Graham / FAMTEC. All rights reserved. Trademark registered.*  
*RMIT University, School of Design · rob@fineartmedia.tech*
