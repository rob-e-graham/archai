# Institutional Expectations Map

**Author**: Rob Graham
**Context**: RMIT Design PhD — supervised by Chris Barker
**Last updated**: 2026-06-05
**Status**: Working research document — literature review draft material

---

## 1. Purpose

This document responds to Chris Barker's supervision note:

> Existing expectations of the institution — what do museums, galleries, archives, and collecting institutions already expect from digital engagement platforms?

The aim is to map what GLAM institutions (Galleries, Libraries, Archives, Museums) currently expect from digital platforms — including the standards they require, the operational assumptions they hold, the ethical frameworks they apply, and the institutional cultures that shape technology adoption. This helps position ARCHAI clearly: where it aligns with expectations, where it deliberately diverges, and where it addresses needs that institutions recognise but have not yet resolved.

---

## 2. Metadata Standards Institutions Expect

### 2.1 Dublin Core

Dublin Core is the most widely used horizontal metadata standard for cross-domain resource description. It defines 15 core elements:

| Element | ARCHAI canonical field |
|---------|----------------------|
| Title | title |
| Creator | maker / artist |
| Subject | (derived from record + embeddings) |
| Description | description |
| Publisher | institution |
| Contributor | (where available) |
| Date | date / period |
| Type | (object type / medium) |
| Format | (media format) |
| Identifier | source ID / accession number |
| Source | source URL |
| Language | source language |
| Relation | (semantically related objects via vector search) |
| Coverage | culture / place / period |
| Rights | rights / licence |

ARCHAI's canonical object schema maps cleanly to Dublin Core. This is important because institutions evaluating any new system will expect Dublin Core compatibility at minimum. ARCHAI does not need to output Dublin Core XML, but its internal schema should be demonstrably mappable.

Source: [Dublin Core Metadata Initiative](https://dcpapers-data.dublincore.org/articles/dcmi-2022/953137810/files/dcmi-953137810.pdf)

### 2.2 SPECTRUM (Collections Trust)

SPECTRUM is the UK museum collections management standard, also used internationally. SPECTRUM 5.1 was published in September 2022.

Key characteristics:
- Divided into 21 collections management procedures
- Covers daily activities (moving objects, updating locations) and occasional activities (insurance, deaccession)
- Primary procedures are mandatory for UK Museum Accreditation
- SPECTRUM 5.1 includes revised definitions for Cataloguing and Use of Collections, plus new guidance on "dealing with catalogue records containing information that is inaccurate, harmful, or offensive"
- Available in English, Welsh, German, and Swedish
- Free to download and use non-commercially

**Primary SPECTRUM procedures** (required for UK accreditation):
1. Object entry
2. Acquisition and accessioning
3. Location and movement control
4. Cataloguing
5. Object exit
6. Loans in
7. Loans out
8. Inventory control

**ARCHAI's relationship**: ARCHAI is not a collections management system and does not need to implement SPECTRUM procedures. But institutions that use SPECTRUM will expect ARCHAI to be compatible — meaning ARCHAI should be able to read from SPECTRUM-compliant systems (EMu, CollectionSpace, CollectiveAccess) without losing procedural context. The revised guidance on harmful catalogue records is particularly relevant: ARCHAI's hallucination prevention and personality system should not reproduce harmful language from source records without appropriate framing.

Sources:
- [SPECTRUM — Collections Trust](https://collectionstrust.org.uk/spectrum/)
- [Introduction to SPECTRUM 5.1](https://collectionstrust.org.uk/spectrum/spectrum-5/)
- [All SPECTRUM procedures](https://collectionstrust.org.uk/spectrum/procedures/)
- [Revised SPECTRUM guidance — Museums Association (2022)](https://www.museumsassociation.org/museums-journal/news/2022/09/revised-spectrum-guidance-aims-to-move-away-from-gatekeeper-mindset/)
- [SPECTRUM 5.1 UK Collections Management Standards — OMA Resource Hub](https://resources.museumsontario.ca/resource/spectrum-5-1-uk-collections-management-standards/)

### 2.3 CIDOC-CRM

CIDOC-CRM (ISO 21127) is the conceptual reference model for cultural heritage documentation, maintained by ICOM's documentation committee. It provides an event-based ontology for describing relationships between people, objects, places, and events in heritage contexts.

**ARCHAI's relationship**: ARCHAI's canonical metadata can be mapped to CIDOC-CRM event-based modelling if needed for interoperability with research infrastructure. This is a future concern, not an immediate requirement — but awareness of CIDOC-CRM shows institutional fluency.

### 2.4 IIIF (International Image Interoperability Framework)

IIIF has become the dominant standard for image delivery in GLAM. Current specifications:

| API | Version | Purpose |
|-----|---------|---------|
| Image API | 3.0 | Standardised image delivery: zoom, crop, rotate, scale |
| Presentation API | 3.0 | Manifests for organising sequences of images with metadata |
| Content Search API | 2.0 | Searching within manifests and annotations |
| Change Discovery API | 1.0 | Tracking changes across IIIF resources |
| Authorization Flow | 1.0 | Access control for restricted content |

IIIF-powered viewers (Mirador, Universal Viewer) are "integral components in presenting and sharing digital collections of GLAM institutions worldwide." Researchers emphasise "the need for long-term accessibility and standardised formats such as IIIF for images and MARC 21 for cataloguing to ensure data compatibility and reusability across platforms."

**ARCHAI's relationship**: ARCHAI should:
1. **Consume IIIF** where available — harvest and preserve IIIF manifest URLs, use IIIF images for display
2. **Not replace IIIF viewers** — Mirador and Universal Viewer serve different needs (deep zoom, annotation, comparison)
3. **Eventually emit enriched IIIF-compatible structures** — manifests with ARCHAI-generated annotations, interpretation layers, multilingual descriptions

Sources:
- [IIIF API specifications](https://iiif.io/api)
- [2024 IIIF Annual Conference](https://iiif.io/event/2024/los-angeles/schedule/)
- [IIIF News](https://iiif.io/news/)

### 2.5 Other Standards

| Standard | Domain | ARCHAI relevance |
|----------|--------|------------------|
| MARC 21 | Library cataloguing | Relevant if ARCHAI connects to library collections |
| LIDO | Lightweight museum data exchange (XML) | ARCHAI harvesters could consume LIDO exports |
| OAI-PMH | Metadata harvesting protocol | Standard for bulk metadata exchange; several of ARCHAI's source APIs support it |
| Schema.org | Structured data for web | Important for SEO/discoverability of AUX.IO pages |
| Rights Statements | Standardised rights declarations (rightsstatements.org) | ARCHAI already uses normalised rights language compatible with this |
| Creative Commons | Open access licensing | ARCHAI harvests CC0/public domain; gates restricted material |
| Traditional Knowledge Labels | Community-controlled access indicators | Not yet implemented; important for Indigenous collections |

---

## 3. What Institutions Expect from Digital Platforms

Based on the 2024 UK GLAM Digital Collections Infrastructure research, SPECTRUM 5.1, the IDbGLAM "2025 Project," and broader institutional literature, institutions expect:

### 3.1 Core expectations (non-negotiable)

1. **Reliable metadata ingestion**: Systems must handle messy, inconsistent source data without losing provenance. Every institution's data is different. Export formats are rarely clean.

2. **Standards compliance**: Dublin Core at minimum. IIIF for images. SPECTRUM awareness for UK-accredited museums. OAI-PMH for interoperability.

3. **Rights management**: Per-object, per-asset. Clear attribution rules. Publication gates that prevent restricted material from appearing publicly. Institutional legal teams need to be able to audit what is visible.

4. **Search that works**: Keyword search is baseline. Faceted search is expected. Semantic search is increasingly desired but rarely delivered. Visitors expect Google-quality search; institutions rarely achieve it.

5. **Multilingual support**: Especially for international collections and institutions with diverse visitor populations. Fixed translations of wall labels are standard; dynamic multilingual interaction is rare.

6. **Accessibility**: WCAG compliance for web interfaces. Screen reader support. Alternative formats (audio, tactile, simplified language). Increasingly, AI-generated audio descriptions are expected.

7. **Long-term sustainability**: Institutions think in decades, not product cycles. "Will this still work in 2040?" is a real question. Open standards, open source, and documented architectures are valued.

8. **Institutional control**: IT departments expect to manage, update, and audit systems. Cloud-only systems raise concerns about vendor lock-in, data sovereignty, and ongoing costs.

9. **Integration with existing CMS/DAMS**: Institutions already use EMu, CollectiveAccess, CollectionSpace, TMS, ResourceSpace, Preservica, or similar. Any new system must work alongside these, not demand their replacement.

10. **Staff training requirements**: Museum staff are not software engineers. Systems must be learnable without deep technical expertise. Documentation matters.

### 3.2 Emerging expectations (2024–2026)

1. **AI transparency**: Institutions are increasingly wary of black-box AI. They want to know:
   - What model is being used?
   - Where does visitor data go?
   - What safeguards prevent the AI from saying something wrong, harmful, or offensive?
   - Can the institution audit or override AI-generated content?

2. **Data sovereignty**: European and Australian institutions are pushing for local/on-premises processing. GDPR, the Australian Privacy Act, and institutional governance policies all favour systems where data stays under institutional control.

3. **Community consultation**: Especially for Indigenous collections. Institutions expect systems to support consultation processes, access restrictions, and community-controlled metadata. The Traditional Knowledge Labels project (Local Contexts) is increasingly referenced.

4. **Open access momentum**: Major institutions (Smithsonian CC0, Met Open Access, Rijksmuseum API, Europeana open data) are moving toward open access. Systems should support and benefit from this trend. ARCHAI's open-data harvesting model aligns directly.

5. **Born-digital readiness**: Institutions are beginning to grapple with software art, web archives, digital-native collections, and born-digital materials. Most CMS/DAMS are not designed for these. ARCHAI's R&D doc identifies this as a future direction.

6. **Harmful content handling**: SPECTRUM 5.1 explicitly added guidance on catalogue records containing "information that is inaccurate, harmful, or offensive." Institutions expect systems to surface, flag, or contextualise harmful historical language rather than reproducing it uncritically.

### 3.3 The IDbGLAM "2025 Project"

The "2025 Project" envisions IDbGLAM as "an innovative platform designed to centralize access to digitized collections and digital experiences offered by GLAM institutions worldwide." This signals growing appetite for cross-institutional discovery layers — systems that can search across institutions, not just within one.

**ARCHAI alignment**: ARCHAI already operates across 11 institutions. The curator collection provides cross-institutional semantic search. AUX.IO publishes per-object pages from all sources. This is precisely the kind of cross-institutional discovery the field is moving toward, but ARCHAI does it at a sovereign, local level rather than through a centralised cloud platform.

Source: [The 2025 Project — Digital Innovation in GLAM](https://suaudiversified.net/glam-2025project/)

---

## 4. Where ARCHAI Aligns with Institutional Expectations

| Expectation | ARCHAI status | Detail |
|-------------|---------------|--------|
| Standards-compatible metadata | Aligned | Canonical schema maps to Dublin Core. Raw records preserved intact. |
| Rights management | Aligned | Per-object legal gating. Live in production. 1,091 open + 165 attribution + 59 share-alike + 205 mixed/NC. Zero restricted or unknown. |
| Search | Strong | Semantic vector search (Qdrant) + conversational search (LLM) + cross-collection curator. Significantly beyond most institutional search. |
| Multilingual | Partially aligned | 6 languages live for conversational responses. Whisper supports 99 for speech. No institution-level translation pipeline yet. |
| Institutional control | Strong | Self-hosted on Mac Studio. No cloud accounts. No data shared with third parties. Institution controls what is harvested, public, restricted. |
| Integration with existing CMS | Aligned | Harvesters read from institution APIs. Does not replace CMS. Positions itself as interpretive layer above catalogues. |
| AI transparency | Aligned | Hallucination prevention active. Responses grounded in metadata. Source record visible alongside conversation. |
| Open access support | Strong | Harvests CC0/public domain. Gates restricted material. Benefits from open access momentum. |
| Accessibility | Partially aligned | Speech I/O live (browser demo). Voice personality/tone controls. Multilingual. Full WCAG compliance not yet audited for all pages. |
| Long-term sustainability | Needs attention | Open source. Documented architecture. But who maintains it after the PhD? This is a legitimate institutional question. |

---

## 5. Where ARCHAI Deliberately Diverges from Expectations

| Expectation | ARCHAI position | Why |
|-------------|----------------|-----|
| Full CMS replacement | No | Institutions already have CMS (EMu, CollectiveAccess, CollectionSpace, TMS). ARCHAI adds value on top as a semantic/interpretive layer. Replacing a CMS is a multi-year, multi-million-dollar institutional project. |
| Full DAMS replacement | No | ResourceSpace, Preservica, and similar systems handle media asset workflows, permissions, and preservation. ARCHAI handles metadata and interpretation. |
| IIIF server | No | Cantaloupe, IIPImage serve images. ARCHAI should consume IIIF, not serve it. |
| Enterprise procurement model | No | ARCHAI is open source, practice-based, researcher-built. This is a strength for the PhD (honest about what it is) and a challenge for institutional adoption (no commercial support contract, no SLA). |
| Scripted audio guide | No | ARCHAI's conversational, contextual, object-voiced interaction is fundamentally different from pre-recorded audio guides. This is the core innovation, not a limitation. |
| Cloud-native deployment | No | ARCHAI is deliberately local-first. This diverges from the trend toward cloud platforms (AWS, Azure, GCP) but aligns with the emerging sovereignty discourse. |

---

## 6. Risk Areas for Institutional Adoption

### 6.1 Trust in AI-generated responses

Institutions will ask: "What if it says something wrong?"

ARCHAI's answer:
- Hallucination prevention constrains responses to the object's documented record
- The system explicitly says "if it's not in my record, I don't know it"
- Source metadata is visible alongside the conversation
- The system does not claim authority beyond the record

But this needs to be **demonstrable and auditable**. A one-page "how ARCHAI prevents hallucination" note would help institutional evaluation.

### 6.2 Curatorial authority

Some curators will resist an AI "speaking for" objects. This is a legitimate concern rooted in decades of professional practice around interpretive authority.

ARCHAI's response:
- The personality system distinguishes accessibility narration from curatorial interpretation from performative object voice
- Staff roles (admin, curator, researcher) can control what personality modes are available
- The system speaks from the institutional record, not from its own "knowledge"
- Curators can review and shape personality profiles

### 6.3 IT department approval

Self-hosted systems need documentation, security review, and maintenance plans. The Mac Studio deployment model is unusual for enterprise IT departments accustomed to rack-mounted servers, virtualisation, and cloud infrastructure.

ARCHAI's response:
- Mac Studio is a deliberate choice for cost ($3.5–5K vs $50K+ server infrastructure), Apple Silicon ML performance, and simplicity
- The system runs standard open-source components (Node.js, Qdrant, Ollama)
- Docker deployment is available
- But: no commercial support contract, no SLA, no vendor relationship

### 6.4 Cultural sensitivity

Any system that interprets Indigenous or culturally sensitive objects needs community consultation, not just technical safeguards. ARCHAI's per-object gating system can enforce access restrictions, but the decisions about what to restrict and how to frame sensitive materials must come from communities and curators, not from the software.

The Traditional Knowledge Labels framework (Local Contexts) provides a model for community-controlled metadata that ARCHAI could implement in future.

### 6.5 Sustainability beyond the PhD

"Who maintains ARCHAI after the PhD?" is a legitimate institutional question. Possible answers:

1. **Open source community**: ARCHAI is open source. Others can contribute, fork, and maintain.
2. **Institutional adoption**: An institution that deploys ARCHAI takes ownership of their instance.
3. **Research continuation**: Post-doctoral or ongoing research funding sustains development.
4. **Practice-based maintenance**: As a practice-based PhD artefact, ARCHAI can continue as a living research instrument.

This question should be addressed honestly in the PhD, not avoided.

---

## 7. What Institutions Need That Nobody Is Providing Well

Based on this survey, several institutional needs are poorly served by existing systems:

1. **Semantic search across collections**: Most CMS/DAMS provide keyword search only. Cross-collection semantic search barely exists outside research prototypes. ARCHAI provides this.

2. **Conversational interpretation**: No commercial museum system offers conversational, object-voiced interpretation grounded in institutional records. Audio guides are scripted. Chatbots are generic. ARCHAI fills this gap.

3. **Sovereign AI**: Most AI-driven heritage systems depend on cloud APIs (GPT, Claude, Gemini). Institutions that need data sovereignty have few options. ARCHAI's local-first architecture is rare.

4. **Accessible multilingual voice interaction**: Most museum accessibility solutions are visual or text-based. Voice-first, multilingual interaction for collections is almost non-existent in production. ARCHAI is building toward this.

5. **Rights-aware publishing with legal gates**: Most public collection portals publish everything or nothing. Per-object legal gating with normalised rights language is uncommon. ARCHAI's rights system is mature.

---

## 8. Summary

ARCHAI aligns with institutional expectations where alignment matters (standards, rights, integration, AI transparency, sovereignty) and deliberately diverges where divergence is the innovation (conversational interpretation, object voice, local-first deployment, non-transactional interaction). The PhD should frame these divergences not as limitations but as design positions — argued, justified, and testable.

The five strongest alignment points for institutional audiences:
1. Dublin Core-compatible canonical metadata
2. Per-object legal gating in production
3. Self-hosted / sovereign architecture
4. Hallucination prevention grounded in institutional records
5. Cross-collection semantic search across 11 international sources

The five strongest innovation points:
1. First-person object voice with personality system
2. NFC-bridged conversational encounter (not static content)
3. Locally-hosted LLM for heritage interpretation
4. Affective design through tone/personality profiles
5. Multilingual voice I/O for collection accessibility
