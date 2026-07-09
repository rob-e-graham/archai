# ARCHAI — Extended Update
## Cultivating a Living Archive: New Collections, Street Art, Games, and a Live Demo
*Post-submission addendum to the 6th Summit on New Media Art Archiving paper, June 2026*

---

**Rob Graham**
FAMTEC (Fine Art Media Tech) · rob@fineartmedia.tech
RMIT University, School of Design · PhD Candidate DR235

---

## Abstract

This document supplements the camera-ready ISEA2026 paper *ARCHAI: Cultivating a Living Archive* with developments implemented in the two months following submission. Three additions are of particular academic significance. First, the ingestion of street art and public art as a discrete collection category: six municipal open data sources across three continents, processed through the same licence-aware pipeline as the institutional museum collections, producing the first cross-city public art semantic index operating under ARCHAI's sovereignty-preserving infrastructure. Second, the integration of interactive digital culture through the RAWG games database — expanding the system's understanding of "heritage object" to include born-digital interactive works and establishing a precedent for treating video games as culturally significant archivable artefacts. Third, the AUXIO visitor page system at scale: 2,357 static per-object conversation pages generated from 18 international collections, deployable via NFC, QR code, hyperlink, or Bluetooth beacon, with a seven-group thematic navigation layer enabling discovery across disciplinary, geographic, and cultural lines without reliance on controlled vocabulary. The system is now being demonstrated live: visitors can tap any NFC tag, scan any QR code on any poster distributed through the #ARCHAIinTheWild open call, and hold a real-time conversation with the object that page represents, regardless of network conditions or device capability.

**New keywords (supplementing original):**
street art open data · public art semantics · interactive digital heritage · games archiving · AUXIO visitor pages · thematic navigation · municipal civic data · RAWG · cross-city collection index

---

## 1  What Has Changed Since April 2026

The ISEA2026 paper reported a system indexing more than 20,000 objects across 17 international institutions. The following sections document the additions made between April and June 2026.

### 1.1  Updated Prototype Status (June 2026)

| System | Status | Notes (updated June 2026) |
| --- | --- | --- |
| Semantic search (Qdrant + nomic-embed-text) | Operational | **18 collections** · 20,000+ objects · 7 thematic groups · nightly pipeline |
| Conversational objects (Ollama / qwen2.5:32b) | Live | NFC AUXIO interfaces live · backend proxy via Cloudflare Tunnel |
| Cross-institutional open data pipeline | Operational | **18 sources** · CC0-filtered · IIIF-integrated · per-source licence enforcement in code |
| NFC / QR AUXIO visitor pages | Live | **2,357 pages generated** · mobile-first · offline-first · `onerror` graceful image fallback |
| Thematic navigation index | Live | **7 group tabs** · All / Painting / Design & Objects / Pacific & Indigenous / History & Science / Street Art / Games · per-group institution sub-tabs |
| Street art collection | **New — Live** | **6 cities** · Vancouver, Brussels, Melbourne, San Francisco, Chicago, NYC (endpoint under investigation) |
| Games / interactive culture | **New — Live** | **RAWG database** · semantic index of video game cultural objects |
| Downloadable poster / sticker / postcard | Live | Canvas API · A0/A2/A4/sticker/postcard · QR codes · #ARCHAIinTheWild open call active |
| Getty harvester | Updated | Migrated from retired collectionapi to **Linked Art SPARQL** (data.getty.edu) · JSON-LD per-object fetch |
| Multilingual audio chat | Prototype | Browser SpeechSynthesis path live · Whisper/Coqui path in development |
| Hallucination prevention | Framework documented | 5 layers. Pilot object: 10/10 quality, 0 confabulations across 50 tests. |
| FAMTEC Exchange | Prototype stage | Institution network · loan / rental / booking. |
| Behaviour preservation (Proxmox VM snapshots) | In development | AI artwork environments · period-appropriate OS · trained weights preserved |

---

## 2  New Collection Category: Street Art and Public Art

### 2.1  Rationale

The nine technical contributions documented in the ISEA2026 paper treat museum and collecting-institution open data as the primary source material for the heritage pipeline. This is a reasonable starting point for a system built on IIIF, CollectiveAccess, and institutional APIs — but it encodes an assumption that heritage worth indexing is heritage that has already been institutionalised. Street art and public art challenge that assumption. This work lives in public space. Its preservation record is typically held by local authorities, not collecting institutions. Its licence conditions are frequently more open than those of the objects held behind museum walls.

ARCHAI now indexes street art and public art as a first-class collection category: same licence-gate enforcement, same vector embedding pipeline, same AUXIO visitor page generation, same conversational object interface. A mural in Brunswick, a commissioned sculpture in Chicago, a wheat-paste in Vancouver — each becomes a conversational object in the same semantic space as a Rijksmuseum painting or a Wellcome Collection photograph.

### 2.2  Sources and Implementation

Six municipal open data sources have been integrated through a unified street art harvester:

| Source | City | Licence | Objects |
| --- | --- | --- | --- |
| Vancouver Open Data | Vancouver, Canada | Open Government Licence Canada | ✓ |
| Brussels Urban Data | Brussels, Belgium | Open Data Brussels (CC BY) | ✓ |
| City of Melbourne — Outdoor Artworks | Melbourne, Australia | CC BY 4.0 | ✓ |
| SF Open Data — Civic Art Collection | San Francisco, USA | San Francisco Open Data (Public Domain) | ✓ |
| City of Chicago — Public Art | Chicago, USA | Chicago Open Data (Public Domain) | ✓ |
| NYC Parks — Art in the Parks | New York, USA | Under investigation (endpoint returned 404 June 2026) | Pending |

Each source is accessed through its Socrata or equivalent open data API. Record mapping follows a shared field schema normalised to the ARCHAI payload standard: `canonical_id`, `title`, `artist`, `date_range`, `medium`, `location`, `source_url`, `media_thumbnail`, `licence`. Attribution is preserved in the Qdrant payload and rendered on every AUXIO page.

The street art collection sits in a dedicated Qdrant collection (`archai_streetart`) and appears as a named group in the AUXIO thematic index. Its thematic separation is deliberate: street art presents different curation logics than museum collection objects — it is site-specific, often unsigned, frequently ephemeral, and subject to removal. The ARCHAI pipeline records what is documented at harvest time; the AUXIO page makes explicit that the work exists in a specific location and may have changed since indexing.

### 2.3  Academic Significance

This extension raises a structural question the original paper did not fully address: what constitutes the "collection" in a sovereign, open-source collection AI? The nine original contributions assume that source institutions are self-identifying collecting bodies — museums, archives, libraries — with formal acquisition processes, documented provenance chains, and established licence frameworks. Street art as a category tests all three assumptions. The work may not have been formally acquired. Provenance may extend no further than an artist's name on a council permit application. Licence may be inferred from the data portal's general terms rather than a per-object rights statement.

ARCHAI's response is architectural: the legal gate and the cultural safety gate are applied identically regardless of source type. Where rights cannot be verified to an adequate level of confidence, the record is indexed as metadata-only and the image is not displayed. The same principle that prevents unlicensed Met images from appearing on AUXIO pages prevents unlicensed mural photographs from appearing there either. The gate is not a museum gate. It is a rights gate.

---

## 3  New Collection Category: Interactive Digital Culture (Games)

### 3.1  Rationale

The ISEA2026 paper frames ARCHAI's scope through GLAM institutions and the objects they hold: paintings, sculptures, photographs, manuscripts, scientific instruments. This is appropriate for the core use case. It is not, however, a complete account of the cultural objects that are subject to preservation risk and that visitors might productively address through conversational AI.

Video games are cultural objects. They have authorship, date ranges, genres, platforms, cultural contexts, and critical significance. They also face acute preservation challenges: they are software-dependent, platform-locked, and vulnerable to the same cloud-decommissioning risk that ARCHAI addresses for interactive art installations. Including games in the ARCHAI index is not a lateral move. It is a direct extension of the system's founding premise — that digital cultural objects risk losing their capacity for genuine interaction — into a domain where that risk is both well-documented and largely unaddressed by existing museum infrastructure.

### 3.2  Implementation

Games are harvested from the RAWG database, a comprehensive games catalogue with an open API. The RAWG harvest implements the same pipeline as all other sources: per-item rights check, field normalisation to the ARCHAI payload schema, vector embedding of description and metadata, upsert to a dedicated Qdrant collection (`archai_rawg`).

The RAWG API terms of service require an active hyperlink to rawg.io on every display page. This is implemented in the AUXIO visitor template as a mandatory footer attribution — it cannot be removed through configuration. This is consistent with ARCHAI's broader principle that attribution and licence conditions are enforced in code rather than left to curatorial discretion.

In the AUXIO thematic index, games appear in a dedicated **Games** group tab alongside the seven other disciplinary groups. Sub-tabs within the group allow filtering by platform, genre, or release decade — the same sub-tab mechanism used for the museum collection groups, applied to game catalogue metadata instead of institutional provenance.

### 3.3  Conversational Game Objects

The conversational interface for game objects presents an interesting challenge for the prosopopoeia model. A museum painting can be addressed in the first person from a position of stable identity: *I am a Dutch oil on panel, made in Delft c.1660. My pigments include…* A video game has a more complex identity: it is a software system, a cultural artefact, a commercial product, and a play experience — simultaneously. Its "voice" is necessarily more mediated than a physical object's.

ARCHAI addresses this through a modified system prompt template for game objects that positions the conversational AI not as the game itself speaking, but as the game's archival record addressing the visitor: *This is the archival record for [title]. I can tell you what is documented about this work — its design, its reception, its technical context, and its cultural significance. I cannot play the game for you. I can tell you what the people who played it said.* This distinction is both epistemically honest and archivally defensible. It also maintains the hallucination prevention framework: the object speaks from its record, not from speculation.

---

## 4  AUXIO at Scale: 2,357 Visitor Pages

### 4.1  From Prototype to Pipeline

The ISEA2026 paper described the AUXIO visitor page as a prototype: per-object static HTML pages deployable via NFC tap or QR scan, generated from Qdrant payloads. As of June 2026, the system has been run at full scale across all 18 collections: **2,357 pages generated** from a filtered corpus that excludes objects without verifiable image URLs (640 objects skipped for missing or unresolvable images).

The generation pipeline processes approximately 3,000 objects per run, applies the image-availability filter, and produces one HTML file per passing object. Each file is self-contained: it embeds the object's complete metadata, its AI system prompt context, its thematic group assignment, and four related object references. It requires no database call on page load. The conversation interface communicates with the backend proxy in real time; everything else is served statically.

### 4.2  Thematic Navigation

The AUXIO index page groups all 2,357 objects into seven thematic tabs, enabling visitors to browse by disciplinary area rather than institution:

| Group | Collections Included |
| --- | --- |
| **All** | Full corpus |
| **Painting** | The Met, Rijksmuseum, Tate, CMA, Getty, AIC, Europeana |
| **Design & Objects** | V&A, M+, Smithsonian, QAGOMA |
| **Pacific & Indigenous** | Te Papa Tongarewa, Auckland War Memorial Museum, pilot collections |
| **History & Science** | Wellcome Collection, Brasiliana Museus |
| **Street Art** | 6-city municipal open data corpus |
| **Games** | RAWG interactive digital culture index |

Each multi-institution group additionally provides per-institution sub-tabs, injected client-side from a pre-built JSON map. A visitor browsing Painting can narrow to Rijksmuseum or Tate without reloading. The thematic structure is a curatorial decision, not a technical one: Pacific & Indigenous was deliberately separated from the broader museum collection to surface a distinct and culturally significant content cluster rather than subsume it within a generic "collections" category.

### 4.3  Image Integrity and Graceful Degradation

640 objects in the Qdrant corpus were excluded from page generation because their stored image URLs could not be verified as resolvable. An additional population of objects had image URLs that passed the generation filter but returned HTTP errors at display time — a condition identified through QA review of generated pages (documented in the Getty collection, where the harvester's fallback URL construction using the object UUID did not match the IIIF image resource ID format).

These cases are handled through a client-side `onerror` function on the hero image element. When an image URL returns an error at load time, the function replaces the broken image with a clean "Image unavailable" empty state. The same handling applies to related-object card thumbnails. Index page thumbnails additionally hide on error. This ensures that no page displays a broken image indicator or alt-text substitution to the visitor — the object page remains functional and readable regardless of whether its image resolves.

The underlying cause — image URL fallback quality — has been addressed in the Getty harvester: the speculative UUID-based IIIF URL construction has been removed. Future Getty harvests will only embed objects where a verifiable image access point URL was found in the Linked Art JSON-LD record.

### 4.4  Physical Distribution: #ARCHAIinTheWild

The downloadable poster system described in the ISEA2026 paper is now operating at the scale of the full AUXIO corpus. Any of the 2,357 visitor pages can generate a high-resolution print file in five formats. The open call (#ARCHAIinTheWild) continues: street artists, collectives, zine makers, and educators are invited to take any ARCHAI poster into public space, paste it, distribute it, and document it with the hashtag.

Each poster embeds a QR code linking to its object's AUXIO conversation page. A mural companion in a laneway in Melbourne, a sticker on a wall in Brussels, a postcard distributed at a zine fair in Chicago — each remains connected to a live conversational interface. The physical object is not a dead end. It is an entrance.

---

## 5  Updated Technical Contributions

The nine technical contributions listed in the ISEA2026 paper stand. Three additions are warranted:

**10. Multi-category public cultural data integration** — The pipeline has been extended beyond institutional museum collections to encompass municipal open data (street and public art across six cities) and commercial cultural databases (RAWG games), both implemented under identical licence-gate and cultural-safety-gate enforcement. This establishes a precedent for treating public-space art and interactive digital culture as first-class heritage objects within sovereign AI infrastructure.

**11. Thematic discovery navigation without controlled vocabulary** — The AUXIO index implements seven disciplinary group tabs with per-institution sub-tabs, enabling cross-collection thematic discovery from a corpus of 2,357 objects spanning 18 sources. Filtering is client-side, uses embedded JSON group maps, and requires no server query. Visitors navigate by cultural theme rather than institutional name or controlled vocabulary term — a deliberate inversion of the traditional OPAC browsing model.

**12. Legal gate enforcement at scale** — The per-source licence enforcement described in Contribution 07 has been stress-tested against a wider range of sources including municipal open data portals (Socrata-based APIs with general open government terms) and commercial catalogue APIs (RAWG, with specific attribution requirements). In each case, the legal gate was implemented in code specific to that source, verified against the source's terms, and documented in the collection-targets matrix. QAGOMA is documented as metadata-only due to Cloudflare-blocked image API access — a concrete institutional barrier that the partnership outreach programme is now addressing directly.

---

## 6  Live Demonstration

### 6.1  What the Demo Shows

The live demonstration presents three interlocking components of the ARCHAI system:

**Component A — The ARCHAI Interface (v11.5)**
The main application: a role-aware, seven-panel web interface running locally on Mac Studio hardware. The demo will use the Curator view to show:
- Semantic search across 18 collections using natural language queries (not keyword matching)
- Browse tabs across disciplinary groups, with live filtering by institution within each group
- Object detail view: full metadata, provenance chain, legal status, discipline classification, related objects
- The discipline tab system as a visitor discovery tool — clicking CERAMICS, PHOTOGRAPHY, or STREET ART pulls semantically relevant objects from the relevant institutional collections

**Component B — The AUXIO Visitor Page**
A live NFC tag affixed to a physical object (or a printed QR code) opens an AUXIO conversation page on an attendee's device. The demo will show:
- Page load on a mobile device — no app, no login, no collected data
- Hero image, object metadata, institution link
- Conversational interface: attendee submits a question, Ollama (qwen2.5:32b) responds from the object's validated metadata
- Tone selection: Guide / Curatorial / Learning / Interpretive — same object, different register
- Share, copy link, and poster download from the same page

**Component C — Downloadable Poster**
Live generation of a print-ready poster from any object in the corpus. The demo will generate an A4 PDF — Canvas API, client-side, no server round-trip — and pass it to an attendee for immediate printing or digital sharing. The QR code on the poster connects back to the live conversation page.

### 6.2  What the Demo Proves

The demonstration is not a proof-of-concept. It is a working production system operated live. The claims made in the ISEA2026 paper are visible, testable, and falsifiable in the room:

- **Sovereignty**: all inference runs on locally-owned hardware. The network connection can be disconnected; static AUXIO pages remain fully readable, and a Tailscale tunnel enables conversation access without exposing the local service to the public internet.
- **Licence integrity**: every object on screen displays its legal status. CC0 objects are marked as such. Metadata-only objects display no image. RAWG objects display the mandatory attribution link. The legal gate is visible in the UI, not hidden in configuration.
- **Hallucination prevention**: the conversational object can be addressed with deliberately provocative questions designed to elicit confabulation. The system's response — its use of uncertainty language, its acknowledgement of epistemic limits, its refusal to speculate beyond the record — is directly observable.
- **Scale**: 2,357 objects, 18 collections, 7 thematic groups — browsable, searchable, and conversable in the room.

### 6.3  Technical Requirements for Demo

| Requirement | Specification |
| --- | --- |
| Compute | Mac Studio M4 Max (64GB) or equivalent, locally operated |
| Network | Tailscale VPN tunnel from Mac Studio to demo device — no public internet required for core function |
| AUXIO pages | Served locally on port 8000 (or via Cloudflare Tunnel for remote access) |
| Backend | Node.js/Express proxy on port 8787 — rate limiting, prompt injection blocking active |
| NFC hardware | One or more NFC tags pre-written with AUXIO page URLs |
| Print materials | A4 poster printed in advance — QR codes pre-tested |
| Fallback | Static AUXIO pages functional without backend; metadata visible, conversation requires proxy |

---

## 7  Institutional Partnership Developments

Following the ISEA2026 presentation, outreach to museum digital and technology teams has been formalised through two partnership tracks:

**Track A — Museum digital teams**: The partnership brief positions ARCHAI as infrastructure for the next layer of collection access — conversational, physical, deployable — supplementing rather than competing with the institution's canonical collection record. Current warm leads include Rijksmuseum (pioneered CC0 for museum data), Tate (open access team, active GitHub dataset), Wellcome Collection (strong digital culture), Te Papa Tongarewa, and M+ Hong Kong.

**Track B — Street art organisations**: The AUXIO poster system is offered to street art collectives, public art organisations, urban festivals, and zine makers as a free, no-account-required tool for activating museum objects in public space. Target organisations include Upfest Bristol, Meeting of Styles, POW! WOW!, and Nuart, alongside paste-up and wheat-paste communities and risograph print collectives.

Both tracks treat ARCHAI's existing use of each institution's data as the primary credibility signal: the outreach begins not with a pitch but with a demonstration of what the system already does with their open data.

---

## 8  Updated Limitations

The limitations section of the ISEA2026 paper remains accurate. Two additions are warranted.

**Municipal data quality**: Street art open data from city councils is structurally less curated than museum collection records. Field completeness varies significantly between sources: some provide GPS coordinates, artist biographies, commissioning bodies, and conservation notes; others provide a title and a year. ARCHAI's embedding pipeline handles sparse records but the conversational objects derived from them have commensurately less to say. This is accurately represented in the AUXIO interface — objects with sparse metadata show shorter, less rich responses — but it represents a genuine quality gradient across the corpus that institutional museum records do not have.

**Cloudflare infrastructure blocking**: QAGOMA's image API returns HTTP 403 for all requests from non-browser clients, which Cloudflare interprets as bot traffic. This is not a licence restriction — QAGOMA's collection data is openly licensed — but a technical barrier that reduces QAGOMA objects to metadata-only status in the current deployment. This is documented in the collection-targets matrix and is the subject of direct partnership outreach to the QAGOMA digital team. It illustrates a category of infrastructure problem that is distinct from rights restriction: legitimate open access data that is architecturally inaccessible to good-faith automated clients.

---

## Conclusion

At the time of the ISEA2026 paper, ARCHAI indexed seventeen institutions and twenty thousand objects. As of June 2026: eighteen collections, spanning the Metropolitan Museum of Art and a mural in Brunswick; the Rijksmuseum and a street sculpture in Chicago; the Wellcome Collection and a video game from 1997. Two and a half thousand conversation pages. Posters on walls. A live demo in the room.

The additions documented here are not peripheral. Street art and games extend the system's foundational argument — that cultural objects deserve sovereign AI infrastructure regardless of whether they are held behind museum walls — into territories where that argument is more urgent, not less. Public art is documented by councils and frequently lost. Video games are preserved intermittently and unevenly. If ARCHAI's two-layer architecture (permanent heritage assets, regenerable AI processing) is the right model for a Tate painting, it is the right model for a Melbourne mural and a mid-1990s adventure game.

The demo is the argument. The architecture is documented. The code is running. The posters are in the room.

---

## Updated References

*All original references from the ISEA2026 paper remain valid and are not duplicated here. The following additions apply to this update document.*

[A1]  City of Melbourne, *Outdoor Artworks Dataset*, data.melbourne.vic.gov.au, CC BY 4.0, accessed June 2026.

[A2]  City of San Francisco, *Civic Art Collection*, data.sfgov.org, San Francisco Open Data, accessed June 2026.

[A3]  City of Chicago, *Public Art*, data.cityofchicago.org, Chicago Open Data, accessed June 2026.

[A4]  RAWG Video Games Database, rawg.io, API terms requiring attribution link on display, accessed June 2026.

[A5]  Getty Museum, *Linked Art JSON-LD API*, data.getty.edu/museum/collection, CC0 1.0 Universal, accessed June 2026. (Note: previous collectionapi.getty.edu endpoint retired 2025–2026.)

[A6]  GIDA, *CARE Principles for Indigenous Data Governance*, gida-global.org/care, 2020. (Cited in original paper [9]; reiterated here in context of Pacific & Indigenous thematic group design.)

---

*This document is a post-submission addendum to the camera-ready ISEA2026 paper. It does not supersede the submitted version but supplements it for conference proceedings, partner briefings, and demo context. For the original paper, see ARCHAI_ISEA2026_CameraReady.pdf.*

*ARCHAI — rob@fineartmedia.tech · github.com/rob-e-graham/archai*
*Copyright © 2026 Rob Graham / FAMTEC. All rights reserved.*
