---
title: "ARCHAI: Cultivating a Living Archive"
subtitle: "Augmented Reanimation, Cultural Heritage, Artificial Intelligence"
---

# ARCHAI: Cultivating a Living Archive
## Augmented Reanimation, Cultural Heritage, Artificial Intelligence

---

**6th Summit on New Media Art Archiving**
In conjunction with ISEA2026, Dubai, 11–12 April 2026

**Rob Graham**
PhD Candidate, RMIT University · Founder, FAMTEC (Fine Art Media Tech) · rob@fineartmedia.tech

*Extended implementation update, June 2026*

---

## Abstract

"Museums are not silent repositories of Memory; they are living, thinking organisms, where imagination and knowledge, tradition and innovation meet." – Gayane Umerova, UNESCO Global Dialogue on AI and the Future of Museums, 2025 [15]

Greetings ladies, gentlemen, and agents. Let's wake up the collection and start the conversation.

This paper presents ARCHAI — a sovereign semantic toolkit for GLAM institutions that functions as a new interpretive layer sitting above existing collection management systems (CMS) and digital asset management platforms (DAMS). It does not replace institutional infrastructure. It makes it conversational.

The system currently indexes more than 20,000 objects across eighteen international institutions and open civic datasets — The Met, Rijksmuseum, Tate, Wellcome Collection, Smithsonian Institution, J. Paul Getty Museum, Te Papa Tongarewa, M+, QAGOMA, the Art Institute of Chicago, Auckland War Memorial Museum, Brasiliana Museus, Europeana, Museums Victoria, Cleveland Museum of Art, and others — alongside a six-city street art and public art corpus drawn from municipal open data, and an interactive digital culture index built from the RAWG games database. An automated open data harvesting pipeline implements per-source licence verification at harvest time; a five-layer hallucination prevention framework ensures that every AI response is grounded in verified curatorial fact; 2,357 per-object visitor pages — each scannable via AUX.IO tag or QR code — are now live and downloadable in five physical formats. Visitors can hold natural language conversations with individual collection objects. Museum posters appear on walls in Brunswick, Footscray, Brussels, Chicago.

Interpreted through a fine art lens, ARCHAI extends a tradition reaching back 2,500 years — from the ancient Greek method of loci through to contemporary AI data art — into what this paper argues is the first open-source-method, sovereignty-preserving implementation of the conversational collection at international scale.

**Keywords:** sovereign infrastructure · conversational objects · hallucination prevention · vector embeddings · local LLM · GLAM semantic toolkit · AUX.IO interpretation · metadata-grounded AI · prosopopoeia · method of loci · technological reanimation · fine art archiving · FAMTEC · open data pipeline · physical deployment · downloadable archive · street art data · interactive digital heritage · AUX.IO

---

## Introduction

ARCHAI is practice-based doctoral research led by Rob Graham at RMIT University, School of Design, with successful prototype tests completed and eighteen live collection sources now operational. It is simultaneously a live research programme, an open-source-method toolkit in preparation for broader sector deployment, and a fine art proposition about what it might mean for objects to speak.

In practice-based research, building the thing is the research. Not as an illustration of theory, but as the primary act of discovery. The architectural decisions made under real institutional constraints, the frameworks that crystallise through friction with actual collections and actual objects: these are the contribution. The commit history is part of the methodology. The prototype iterations are documented findings. The code advances arguments that the writing must then sustain.

### Twelve Technical Contributions

The research is built around twelve interconnected contributions:

(1) Vector embeddings for heritage discovery: semantic search across heterogeneous collections without dependence on controlled curatorial vocabulary. (2) Provenance-tracked AI interpretation: every generated response records its complete derivation chain back to source materials. (3) Two-layer architecture: permanent heritage assets held separately from regenerable AI processing layers, with the heritage foundation never modified by AI. (4) Conversational objects: individual collection items speaking directly to visitors from their own validated metadata, via AUX.IO tap or QR scan. (5) Five-layer hallucination prevention: a documented framework ensuring AI responses remain grounded in verified curatorial fact. (6) Transferable hardware reference implementation: a scalable sovereign stack adaptable to institutions of varying collection size and interaction complexity, released as a GLAM toolkit under the FAMTEC programme. (7) Cross-institutional open data pipeline: automated harvesting from eighteen international sources with per-source licence verification, IIIF integration, and legal gate enforcement at point of ingest. (8) Physical deployment layer: a five-format downloadable artefact system (A4/A2/A0/postcard/sticker) generated client-side via Canvas API, enabling museum objects to enter public space through printing, paste-up, and street activation. (9) Multilingual audio interface: voice input via local Whisper transcription, per-language voice output via Coqui TTS, extending conversational access across languages and interaction modalities. (10) Multi-category public cultural data integration: municipal open data (street and public art, six cities across three continents) and interactive digital culture (RAWG games database) integrated under identical licence-gate enforcement as institutional museum collections, extending ARCHAI's understanding of what constitutes a heritage object worth indexing. (11) Thematic discovery navigation: seven disciplinary group tabs enabling cross-collection discovery from 2,357 objects without controlled vocabulary dependency, structured around Pacific & Indigenous, Painting, Design & Objects, History & Science, Street Art, and Games as entry points to the archive. (12) Legal gate enforcement at scale: per-source rights verification documented in a collection-targets matrix, implemented in harvester code, and surfaced on every public object page — not a configuration setting, but a coded constraint.

Previous Summits have mapped the terrain this work builds on. Strauss and Fleischmann conceptualised archives as thinking spaces where AI fundamentally alters how collections are accessed [4]. Carroll examined emerging AI applications in media art archives [5]. Kobayashi investigated the challenge of conserving art experience as technical environments evolve [6]. Rossenova and Wong have both pointed toward the need for connected, interoperable archive infrastructure [7, 8]. ARCHAI is not a map. It is a built thing. Its ISEA2026 context is apt: the community grappling with AI artwork preservation is the same community producing those works. The archivists and the artists are often the same person, navigating the same tension simultaneously.

---

## The Digital Heritage Access Crisis

In 2026, every major cloud provider has a prepared pitch for cultural institutions. Conversational interfaces, semantic discovery, automated enrichment, meaningful visitor engagement. The pricing looks manageable until the contract is signed and an institution's collection data is resident on servers in a jurisdiction beyond its control, potentially contributing to training corpora for models it will never own.

The scale of what remains inaccessible is rarely stated plainly. Following the Museums of Tomorrow Roundtable 2025, Szántó and Campbell noted that what museums have digitised "remains mostly hidden from view, stored on local networks, accessible only to those working inside institutions." [11] Most collections are processed in single-digit percentages. Decades of digitisation investment, and the overwhelming majority of the result is invisible to the public it was intended to serve. This is not a peripheral problem. It is the central problem.

But the access crisis runs deeper than public visibility. Curators, collections officers, and volunteers inside institutions face the same problem from the other side. Legacy cataloguing systems, inconsistent metadata standards, and siloed DAMS structures mean that the people who know the collection best are often working with the least capable tools. The semantic gap — between what an object is, what the record says about it, and what a visitor can discover — persists whether the visitor is inside the building or outside it.

Sovereignty is not merely an ethical preference. It is a preservation requirement. An institution that cannot maintain independent access to its own interpretive systems has, in a meaningful sense, lost control of its collection.

Angie Judge, CEO of Dexibit, articulated this plainly in 2025: "Just as with the age of the internet and the digital revolution, AI will quickly create a world of the haves and have nots." [12] The ARCHAI toolkit is a direct response to this structural asymmetry. Hardware requirements scale with collection size and the complexity of interactions being supported. What remains constant is that the infrastructure is locally owned, locally operated, and answerable only to the institution running it.

---

## An Ancient Proposition, A Contemporary Implementation

ARCHAI did not emerge from a theoretical framework applied to an existing system. It has a lineage, one that extends not to the emergence of digital heritage practice, nor to the invention of the museum, but to the origins of Western rhetoric itself.

### The Method of Loci: The Original Conversational Collection

The method of loci — the memory palace — was codified by the Greek poet Simonides of Ceos (c.556–468 BCE) and later documented by Cicero in De Oratore and Quintilian in Institutio Oratoria. Its insight is spatial: memory is most reliably structured when knowledge is anchored to specific physical locations. Roman orators memorised entire speeches by mentally traversing a familiar building, depositing vivid images at fixed points along the route. Recall was achieved by retracing the path.

Cicero's formulation: "It is chiefly order that gives distinctness to memory." [13] The palace was not decorative architecture but operational epistemic infrastructure — a spatial system for holding, organising, and recovering knowledge. It remained effective across millennia precisely because it worked with cognitive architecture rather than against it.

ARCHAI proposes a specific inversion of this. In the classical memory palace, a person uses architecture as a device for knowledge they hold internally. In ARCHAI, the architecture — the physical collection itself — uses AI to externalise its knowledge to visitors moving through it. Each AUX.IO tag is a locus. Each collection object is its own bounded epistemic domain. The visitor retains nothing artificially; the building has already done the remembering, and it speaks.

The inverse memory palace. Two and a half millennia of rhetorical technique, arriving at a vector database.

### Prosopopoeia: Objects Given Voice

Alongside the memory palace, ancient and Renaissance rhetoric deployed prosopopoeia — the technique of giving voice to absent figures or inanimate objects. Quintilian examined it at length in Institutio Oratoria [16], noting its capacity to render the absent present and the silent articulate. The technique is ancient, cross-cultural, and structurally suited to a vector database architecture.

ARCHAI's conversational objects are the computational heirs of prosopopoeia, with one constraint the ancient orator never faced. A character in Ovid can say whatever the narrative requires. ARCHAI cannot. Each object speaks from its verified archival record and from nowhere else. It has no literary licence. It has what its metadata can truthfully sustain — which, in a well-maintained collection, is still considerable.

### From Anadol to ARCHAI: Two Models of Data as Art

At the contemporary end of the lineage sits Refik Anadol, who describes data as "a pigment — a brush that can think." [14] His studio has produced landmark works at the intersection of AI and institutional archives: Unsupervised at MoMA recorded an average of 38 minutes of visitor engagement per work, against an industry norm of 27 seconds per artwork. These are significant works, cloud-dependent and enterprise-resourced — undertakings that a regional gallery, a small archive, or an artist-run space cannot replicate.

ARCHAI operates in a complementary register. Where Anadol transforms institutional data into aesthetic spectacle, ARCHAI transforms it into epistemic conversation. Both rest on the same foundational claim: the archive is not inert storage. It is generative material awaiting the right conditions to speak.

---

## Architecture: The Semantic Interface Principle

ARCHAI is not a collection management system. It is not a digital asset management platform. It is a sovereign semantic toolkit — a new interpretive layer that sits above whatever institutional systems are already in place: CollectiveAccess, ResourceSpace, Argus, Vernon, EMu, TMS. It pulls from those systems via API, processes their data locally, and returns a conversational, semantically searchable surface. Institutions do not replace their existing infrastructure. They extend it.

The central architectural decision addresses a genuine tension. AI-generated content is useful and inherently unstable: models improve, embeddings shift, responses vary with context and version. Heritage records require the opposite: permanence, authority, citability, and immunity to alteration by anything the AI layer does with them. ARCHAI resolves this through strict separation.

### Heritage Foundation Layer

This layer is the institution's existing infrastructure: their CMS, DAMS, and associated records. Original documents, curatorial records, artist statements, conservation reports, interview transcripts, primary digital assets. CollectiveAccess manages collection records; ResourceSpace handles digital asset management. Nothing generated by AI enters this layer — not an interpretation, not a summary, not a cached response. Nothing.

This reflects Ernst's distinction between "cultural archive" and "technomathematical storage" — the former maintaining interpretive authority, the latter enabling computational operations [3]. The heritage layer is the former. It does not change as a consequence of what the latter does with it.

### Derivative Processing Layer

This layer holds generated materials: vector embeddings, search indices, AI-synthesised responses, cached queries. Its defining property is that it is entirely regenerable. When an improved embedding model becomes available, the old vectors are discarded and regenerated from the unchanged source records. When something fails in the AI configuration, the processing layer is rebuilt from scratch. The heritage records are unaffected. This separation directly addresses the sustainability concerns documented at the ZKM Workshop [8] and is the architectural decision that makes everything else in the system defensible.

### Editorial Layer

A third layer, positioned between the archival foundation and public-facing interfaces, manages curator-authored interpretation. ARCHAI's own editorial interface lets curators write and publish interpretation content delivered via API to AUX.IO terminals, mobile interfaces, and conversational objects — without that editorial work ever touching the archival records below. Interpretation flows in one direction only: from archive to visitor. It does not flow back.

### Cross-Institutional Open Data Pipeline

Sitting alongside the institution's own infrastructure is ARCHAI's automated harvesting pipeline: a set of legal-gate-aware harvesters that pull CC0, CC BY, and equivalent open materials from eighteen international collections and civic datasets, verify rights at item level, embed each object via nomic-embed-text, and upsert to a named Qdrant collection. The pipeline runs nightly. Each harvester implements the appropriate licence handling for its source — CC0 for unrestricted display, CC BY with attribution preserved in the payload and rendered on every AUX.IO page, metadata-only where image rights are not cleared. A collection-targets matrix documents licence status, API endpoint, authentication requirements, rate limits, and harvest parameters for every source. Legal compliance is not a configuration setting. It is enforced in code and audited per harvest run.

The Getty Museum harvester merits specific note: the legacy collectionapi.getty.edu endpoint was retired between the paper's original submission and this update. The harvester was migrated to the Getty Linked Art SPARQL endpoint at data.getty.edu, which returns JSON-LD per-object records following the CIDOC-CRM model. Image access points are now extracted from the digitally\_shown\_by chain in the Linked Art graph rather than constructed from object identifiers — a more reliable source that eliminates a category of broken image URLs that had appeared in the earlier harvest.

---

## Talking to Objects: Metadata-Grounded Conversational AI

ARCHAI's most visible prototype lets visitors have conversations with individual collection objects. An AUX.IO tag on a heritage artefact opens a chat interface on the visitor's device. The object speaks — not as a generic institutional chatbot, but as that specific object, drawing on its own curatorially-verified metadata record, with a precisely defined understanding of what it knows and what it does not.

ARCHAI is model-agnostic by design. Different institutional contexts may call for different language models operating simultaneously within the same deployment. Curatorial and collections interrogation — complex provenance questions, technical condition assessments, multi-object research queries — may call for a more capable model than casual visitor interactions. The system currently runs qwen2.5:32b as the primary chat model via Ollama, with nomic-embed-text (768-dimension vectors, cosine distance) for semantic search. Both run locally; no visitor query is transmitted externally.

### From Metadata to Voice: The System Prompt Pipeline

Each object's metadata record organises what it can and cannot say into four categories. Verified facts: what the object can assert with confidence — date range, materials, provenance region, functional description, historical context. Unknown fields: an explicit enumeration of what the object cannot know — manufacturer, original owner, service history, specific messages transmitted. The AI is instructed to acknowledge these gaps directly rather than paper over them. Curator-approved statements: pre-authored sentences the object may use verbatim, conveying curatorial authority into the conversation. Prohibited statements: specific claim types the object must not make — named individuals, particular historical events, invented memories.

### Example: The Sound Burger

An Audio-Technica AT-727 Sound Burger, a portable turntable from 1983, operates within a precisely bounded world. A visitor asks: "My dad used to take one of these to parties in Footscray, did you ever play for him?"

Validated response: *My records say I'm a 1983 model, but honestly I don't know where I've been or what I've played. But your dad took one of me to parties in Footscray? I love that. He would've flipped a record over and danced to it, and someone would've knocked over their drink, and it was perfect.*

The object acknowledges what it doesn't know, honours the visitor's connection without fabricating facts, and stays in character throughout. In prototype testing, the conversational object consistently maintained this balance across question types designed to elicit confabulation, nostalgia, or false memory. The challenge is not technical. It is curatorial. The quality of the object's voice is a direct function of the quality of the metadata behind it.

### Visitor Contribution as Collective Prosopopoeia

A structured contribution pipeline extends the prosopopoeia model into participatory territory. Through the same AUX.IO interface they use to start a conversation, visitors can submit additions to an object's voice — corrections, contextual knowledge, personal connections — subject to curatorial review. Accepted entries are attributed, timestamped, and linked to the relevant collection record. The object's epistemic domain accumulates over time through distributed community knowledge, mediated by institutional authority.

The temporal dimension of this process is deliberate. Visitor contributions are archived as snapshots, preserving not just the current state of an object's voice but its evolution over time — a record of how community understanding of an object changes as new knowledge is contributed and accepted. This constitutes collective prosopopoeia: the object's voice built from the archive out, through structured dialogue between public memory and institutional record, without exposing the heritage foundation to direct modification.

### Cross-Object Navigation

At the close of each conversation, objects introduce related items in the collection. The Sound Burger names its contemporaries: the Walkman that shared its era, the vinyl records it was designed to play, the FM transmitters that rendered it partially obsolete. Each introduction opens a new conversation. Visitors navigate the collection through the internal logic of the objects rather than the spatial logic of the floor plan. The thematic navigation extends this outward: a visitor who arrives via a Street Art QR code in Brussels and asks their question can follow a cross-collection link to a Wellcome Collection photograph from the same decade, a Rijksmuseum print that uses similar graphic language, a Melbourne mural that cites the same visual tradition.

---

## AUX.IO: The Visitor Interface at Scale

AUX.IO (from Latin *aux*, voice) is the public-facing visitor interface: per-object conversation pages deployable via AUX.IO tag, QR code, hyperlink, or Bluetooth beacon. As of June 2026, the system has been run at full scale across all eighteen collections: 2,357 pages generated from a filtered corpus that excludes objects without verifiable image URLs. Each file is self-contained — it embeds the object's complete metadata, AI system prompt context, thematic group assignment, and four related object cross-links. It requires no database call on page load. The conversation interface communicates with the backend proxy in real time; everything else is served statically.

The AUX.IO index groups all 2,357 objects into seven thematic tabs, enabling visitors to browse by disciplinary area rather than institution: All, Painting, Design & Objects, Pacific & Indigenous, History & Science, Street Art, and Games. Each multi-institution group additionally provides per-institution sub-tabs, injected client-side from a pre-built JSON map. Pacific & Indigenous was deliberately separated from the broader museum collection tabs to surface a distinct and culturally significant content cluster — Te Papa Tongarewa, Auckland War Memorial Museum, and pilot collections from Museums Victoria — rather than subsume it within a generic category.

The physical layer extends outward from every AUX.IO page. Visitors can generate and download high-resolution print files in five formats: A4 (home printing, zine insert), A2 (gallery and studio display), A0 (street paste-up, mural companion), postcard (mailable, event giveaway), and sticker (public space activation, risograph). Each format is generated client-side using the Canvas API — no server round-trip, no stored user data, no file held on ARCHAI infrastructure. The generated file embeds a QR code linking to the live AUX.IO conversation page, a IIIF-sourced image from the originating institution, and full attribution.

The open call **#ARCHAIinTheWild** invites communities — street artists, collectives, educators, zine makers — to take museum objects into public space. This constitutes a new category of heritage distribution: the museum object, physically reproduced at no cost, appearing on a wall in a neighbourhood that may never visit the institution that holds the original. The poster is not a dead end. It is an entrance.

---

## Extending the Collection: Street Art and Interactive Digital Culture

### Street Art and Public Art as Heritage Objects

The cross-institutional pipeline described above treats museum and collecting-institution open data as its primary source material. This encodes an assumption worth questioning: that heritage worth indexing is heritage that has already been institutionalised. Street art and public art challenge that assumption directly. This work lives in public space. Its preservation record is typically held by local authorities, not collecting institutions. Its licence conditions are frequently more open than those of objects held behind museum walls.

ARCHAI now indexes street art and public art as a first-class collection category, sitting within the same sovereign infrastructure, processed through the same licence-gate pipeline, and accessible through the same AUX.IO visitor interface. A mural commissioned by the City of Melbourne, a sculpture in Grant Park Chicago, a painted wall in Vancouver — each becomes a conversational object in the same semantic space as a Rijksmuseum painting or a Wellcome Collection photograph.

Six municipal open data sources have been integrated through a unified street art harvester: Vancouver Open Data (Open Government Licence Canada), Brussels Urban Data (CC BY), City of Melbourne Outdoor Artworks (CC BY 4.0), San Francisco Civic Art Collection (San Francisco Open Data, public domain), City of Chicago Public Art (Chicago Open Data, public domain), and NYC Parks Art in the Parks (endpoint under investigation, returning HTTP 404 as of June 2026). Record mapping follows a shared field schema normalised to the ARCHAI payload standard: canonical identifier, title, artist, date range, medium, location, source URL, thumbnail, licence. Attribution is preserved in the Qdrant payload and rendered on every AUX.IO page. The thematic navigation surfaces these objects under a dedicated Street Art group, distinct from the institutional museum collections, reflecting the different curation logics that apply: site-specificity, unsigned work, documentation by permit rather than acquisition.

This extension raises a structural question. What constitutes the "collection" in a sovereign collection AI? The street art category has no IIIF endpoint, no CollectiveAccess record, and no conservation report. What it has is a council permit, a GPS coordinate, a photograph, and an open licence. ARCHAI's legal gate is rights-based, not institution-based. The same gate that prevents unlicensed Met images from appearing on AUX.IO pages prevents unlicensed mural photographs from appearing there either. The gate is not a museum gate. It is a rights gate.

### Interactive Digital Culture: Games as Heritage Objects

Video games are cultural objects. They have authorship, date ranges, genres, platforms, cultural contexts, and critical significance. They also face acute preservation challenges: they are software-dependent, platform-locked, and vulnerable to the same cloud-decommissioning risk that ARCHAI addresses for interactive art installations. Including games in the ARCHAI index is a direct extension of the system's founding premise into a domain where that risk is both well-documented and largely unaddressed by existing museum infrastructure.

Games are harvested from the RAWG database, a comprehensive games catalogue with an open API. The RAWG harvest implements the same pipeline as all other sources: per-item rights check, field normalisation to the ARCHAI payload schema, vector embedding of description and metadata, upsert to a dedicated Qdrant collection. The RAWG API terms of service require an active hyperlink to rawg.io on every display page. This is implemented in the AUX.IO visitor template as a mandatory footer attribution that cannot be removed through configuration — consistent with ARCHAI's broader principle that attribution and licence conditions are enforced in code rather than left to curatorial discretion.

The conversational interface for game objects presents an interesting challenge for the prosopopoeia model. A museum painting can be addressed in the first person from a position of stable identity: *I am a Dutch oil on panel, made in Delft c.1660.* A video game has a more complex identity: it is a software system, a cultural artefact, a commercial product, and a play experience — simultaneously. The ARCHAI system prompt for game objects positions the AI not as the game itself speaking, but as the game's archival record addressing the visitor: *This is the archival record for [title]. I can tell you what is documented about this work — its design, its reception, its technical context, and its cultural significance. I cannot play the game for you. I can tell you what the people who played it said.* This is both epistemically honest and archivally defensible.

---

## Hallucination Prevention: A Five-Layer Framework

The central risk of conversational AI in a cultural heritage context is confabulation — plausible-sounding false information delivered with the confidence of an authoritative source. Graham Black has argued that museums function as "bastions of reliable knowledge" in an increasingly unreliable information environment [14]. When an AI-powered exhibit fabricates a fact about an object, the consequence is not merely an inaccuracy. It is a curatorial failure with measurable consequences for institutional trust.

ARCHAI implements five nested prevention layers. Layer 1, Metadata Boundary Enforcement: each object's system prompt explicitly defines what it can assert, what it cannot, and what it must acknowledge as unknown. Structured metadata schemas require curators to document both known facts and explicitly unknown fields; a JSON unknown\_fields property forces enumeration of epistemic gaps. Objects must reach 8/10 on the metadata quality score before curator review can proceed. Layer 2, AI Epistemic Constraints: the object is instructed to use uncertainty language ("circa", "approximately", "objects like me") for unverified claims, and to acknowledge ignorance rather than fabricate. Layer 3, Real-Time Response Validation: responses are validated against the object's metadata before delivery. Critical failures trigger an automatic fallback: "I want to make sure I'm giving you accurate information. Let me stick to what I know for certain…" Layer 4, Human Curator Sign-Off: no object is deployed without curator approval of a minimum of fifty test conversations, including structured attempts designed to elicit confabulation. This is not optional. Layer 5, Post-Launch Monitoring: conversation logs are reviewed weekly. Visitor corrections are treated as quality signals and investigated. Monthly curator audits maintain ongoing accuracy.

In prototype testing, the pilot object achieved a 10/10 metadata quality score and zero confabulation incidents across fifty structured test conversations.

---

## Hardware Reference Implementation

ARCHAI is designed for hardware that institutions can procure, maintain, and run without specialist infrastructure staff on retainer. The architecture requires one thing most institutions do not already have: sufficient local compute to run a large language model at reasonable inference speed. Everything else is open-source software running on commodity components.

The current production prototype runs on an Apple Mac Studio M4 Max with 64GB unified memory and 1TB storage, operating at under 120W at full inference load. This machine is available from any Apple retailer, requiring no specialist configuration. Apple Silicon's unified memory architecture makes it unusually well-suited to LLM inference: the GPU and CPU share the same memory pool, allowing large models to run in memory that would not fit on a dedicated GPU in a comparably priced workstation.

A base deployment — compute, AUX.IO hardware, and the open-source software stack — represents a one-time capital investment of approximately AUD 10,000–20,000, depending on collection scale, the number of concurrent visitor interactions being supported, and the media richness of the digital assets being served. A smaller institution running a focused single-gallery installation requires considerably less compute and storage than a metropolitan collection operating across multiple buildings. There are no per-query fees, no subscription tiers, and no dependency on external model availability.

For institutions managing capital procurement constraints, the FAMTEC exchange model supports access through loan, rental, and skills-sharing arrangements. The barrier to entry is shaped by institutional need and available infrastructure rather than a fixed price point.

The storage architecture implements a three-tier model corresponding to the access frequency and preservation requirements of the data it holds. Hot storage: a primary NAS unit (solid-state, RAID configuration) holds active collection records, current vector embeddings, and all live operational data. Warm storage: a secondary NAS unit (high-density spinning disk, RAID) holds the bulk digital asset archive — high-resolution media, backup embeddings, and historical pipeline outputs. Cold storage: a single LTO-9 magnetic tape unit holds archival preservation masters and long-term institutional records. Tape is chosen deliberately: it is the most cost-effective medium for multi-decade archival storage, immune to ransomware by virtue of being physically offline, and the preferred standard of national libraries and broadcast archives worldwide. This three-tier structure constitutes the minimum recommended storage configuration for an ARCHAI deployment. It reflects the same principle as the memory palace: durable knowledge requires a disciplined architecture.

The open-source software stack includes Qdrant for vector storage (self-hosted, zero cloud dependency), Ollama for local LLM inference and per-object model instances, nomic-embed-text for semantic embedding (768-dimension, open-source, runs locally via Ollama), CollectiveAccess for collection management at the Heritage Foundation Layer, ResourceSpace for digital asset management, Ghost or Directus as an open-source headless CMS for the curator interpretation layer, Whisper for local audio transcription with no visitor speech transmitted externally, Coqui TTS for per-object per-language voice synthesis, and Proxmox VE for virtualisation and behaviour preservation.

---

## Working Prototypes

### Conversational Terminals

Local language models housed in repurposed vintage hardware — a deliberate aesthetic decision connecting contemporary AI inference to the communication technology history the collection documents. Visitors submit questions; Qdrant retrieves relevant collection materials; the system synthesises a response with a full provenance chain attached. Every claim is traceable to its source document. The terminal does not speculate. It cites.

### AUX.IO and QR Interpretation Points

AUX.IO tags and QR codes function as the system's spatial index — each one a locus in the living memory palace, anchoring AI responses to a specific object at a specific location. When a visitor taps or scans, the system resolves exactly which object is being addressed. Voice interaction is available through period-appropriate analogue handsets via Coqui TTS. The AUX.IO page loads on the visitor's own device — no app required, no login, no data collected. As of June 2026, 2,357 of these pages are live, covering objects from eighteen collections across institutional museums, civic street art databases, and the interactive digital culture index.

### AUX.IO Visitor Pages in Public Space

The poster and physical deployment system has moved from prototype to open call. Any of the 2,357 AUX.IO pages can generate a print-ready file. Posters are appearing — on walls in Brunswick, as stickers at art fairs, as postcard inserts in zines. Each one embeds a QR code that connects back to the live conversation page. The archive is expanding outward through every surface that can carry it.

### Technological Reanimation

When a manufacturer discontinues cloud services, interactive hardware dies with it — the device physically intact, its capacity for interaction gone. ARCHAI has been used to reverse this: decommissioned interactive works that once required corporate server infrastructure now run entirely on local language models via Ollama, drawing on the same archival infrastructure as every other conversational object in the building. This is functional preservation — not housing hardware behind glass, but restoring its genuine capacity for interaction through sovereign infrastructure. Such works are simultaneously collection objects, preservation challenges, and active artworks.

### ARCHAI Interface (v11.5)

The ARCHAI prototype is a role-aware web application with seven panels: Curator & Collections (semantic search, object detail, provenance chain, comment thread with approve/remove/reply actions for curators), Upload & Ingest (metadata wizard, AI-assisted thesaurus tagging, cultural safety gate), Exhibitions Live (Nodel exhibition control), AUX.IO Management (full tag lifecycle, AUX.IO record creation and assignment), Vocabulary & Thesaurus (Getty AAT, LCSH, DOCAM, CHIN Disciplines, local and Indigenous vocabularies), Visitor View (AUX.IO page previews and live visitor chat), and Admin (user management, permissions matrix, system configuration, pipeline settings, audit log). Six roles are implemented — Admin, Curator, Collections Officer, AV Technician, Volunteer, and Visitor — each with a precisely scoped permission set. The interface now includes seven browse discipline tabs in the curator search panel, with Street Art as a named category alongside Ceramics, Painting, Photography, Sculpture, Textiles, and Technology — bringing the collection's expanded scope into the curatorial workflow as well as the public interface.

### FAMTEC Exchange

FAMTEC (Fine Art Media Tech) is a parallel initiative extending the ARCHAI ecosystem into institution-to-institution exchange: hardware sharing through loan and rental, skilled technician bookings, and cross-institutional exhibition support. FAMTEC runs as an architecturally independent service with its own database and authentication layer, preserving each institution's data sovereignty, with an API bridge connecting the two systems where workflows require it.

---

## Behaviour Preservation for AI Artworks

For AI artworks and software-dependent works, ARCHAI extends preservation beyond source code to encompass complete computational environments. Kirschenbaum's concept of "forensic materiality" is essential here: preservation must capture not only formal representations but the specific material conditions that make execution possible [1]. A neural network trained on one dataset produces different behaviour from an architecturally identical network trained on another. The trained weights are not documentation of the artwork. They are the artwork.

ARCHAI preserves these environments as Proxmox VM snapshots: period-appropriate operating system, exact dependency versions, trained models, and documented outputs captured together as a reproducible computational environment. For spatial works that cannot be re-executed in situ, VR reconstruction produces experiential documents with explicit fidelity ratings — distinguishing clearly between what has been reconstructed and what remains speculative.

Rinehart and Ippolito argue that preservation strategies must become "medium-independent, translatable into new mediums when their original formats are obsolete." [2] ARCHAI operationalises this directly. Reanimated interactive works are not simulations of their original behaviour. They are restorations of genuine capacity for interaction, running on infrastructure the institution controls, without a cloud dependency that could be deactivated without notice.

---

## Cultural Safety Protocols

ARCHAI implements specific protocols for culturally sensitive materials, particularly First Nations content. The architecture is intentional: sensitivity is embedded at record level and propagates through the entire pipeline, rather than being applied as a filter at query time.

Materials flagged with sensitivity metadata in CollectiveAccess follow entirely separate processing pathways. At the Heritage Foundation Layer, these records are held under access controls consistent with institutional cultural safety policy. At the Semantic Layer, sensitive records are excluded from general embedding pipelines by default — not filtered on retrieval, but never embedded in the first place. When a query potentially surfaces sensitive material, appropriate pathways are triggered: surfacing consent frameworks, flagging consultation requirements, or adjusting response framing. The CARE Principles for Indigenous Data Governance inform this architecture throughout [9].

In the upload interface, all new materials pass through a four-level cultural safety review prior to embedding: No concern / Unsure — flag for review / Restrict access / Exclude from AI entirely. Materials at the exclusion level are permanently removed from the vector pipeline regardless of subsequent configuration changes. The exclusion is not a configurable setting. It is a record-level property that the pipeline evaluates before any processing occurs.

The same principle applies to the cross-institutional harvesting pipeline. Materials from Te Papa Tongarewa, Auckland War Memorial Museum, Brasiliana Museus, and other institutions with significant First Nations or Indigenous holdings are handled with additional care: where licence metadata signals restricted cultural content, the item is excluded from the public vector index and flagged for manual curatorial review before any indexing proceeds.

---

## Honest Limitations

ARCHAI addresses specific and real problems in digital heritage access, but it does not dissolve the larger challenge of what it means to keep complex, time-based, and software-dependent works genuinely alive. Embodied experience resists meaningful preservation. Platform-native works resist migration in ways that no amount of VM snapshotting fully addresses. AI does not supplant curatorial expertise — language models produce fluent, confident text that can be confidently wrong, and human judgment remains necessary at every layer of the system.

The toolkit model introduces its own risks. An institution that deploys ARCHAI without the systems administration capacity to maintain it may find it has exchanged one form of dependency for another. Cloud services render real costs invisible behind a subscription line. ARCHAI makes those costs visible and concrete — hardware, power, staff time, ongoing maintenance. That transparency is the point. But transparency does not eliminate cost.

Municipal data quality introduces a gradient that does not exist in institutional museum collections. Street art open data from city councils is structurally less curated than acquisition records. Field completeness varies significantly between sources: some provide GPS coordinates, artist biographies, commissioning bodies, and conservation notes; others provide a title and a year. ARCHAI's embedding pipeline handles sparse records but the conversational objects derived from them have commensurately less to say. The quality of the conversation is bounded by the quality of the record behind it — and this is true for a mural in Melbourne and a Flemish oil painting in Amsterdam alike.

Infrastructure blocking is a distinct category of constraint from rights restriction. QAGOMA's image API returns HTTP 403 for all requests from non-browser clients, which Cloudflare interprets as automated traffic. This is not a licence issue — QAGOMA's collection data is openly licensed — but a technical barrier that reduces QAGOMA objects to metadata-only status in the current deployment. The distinction matters: it illustrates that legitimate open-access data can be architecturally inaccessible to good-faith automated clients, and that sovereign infrastructure does not automatically resolve infrastructure asymmetries created by third-party content delivery networks.

The cross-institutional pipeline introduces questions of curation at scale. When eighteen institutions' collections are indexed together, the editorial decisions that shape individual institutional catalogues — what is collected, how it is described, whose perspective is centred — are aggregated rather than resolved. ARCHAI does not pretend to neutrality; the collection-targets matrix, the licence gate, and the cultural safety protocols are all editorial decisions. Those decisions are documented, reviewable, and adjustable. But they are decisions.

These limitations are documented not as concessions but as working problems. ARCHAI is a research programme, not a finished product. The commitment is to document what has been built accurately, including where it falls short.

---

## Contribution to Summit Discussions

This paper extends prior Summit work through several documented contributions: implementation of semantic search via vector embeddings in an operational cross-institutional context, building on Carroll's mapping of possibilities [5]; a practical architecture for connecting heterogeneous CMS and DAMS sources to a unified semantic layer without replacing institutional infrastructure, extending Rossenova's work on archive interoperability [7]; a documented hallucination prevention framework for heritage AI applications; the first open-source implementation of conversational objects at cross-institutional scale with legal gate enforcement; and the extension of the heritage pipeline to encompass street art and interactive digital culture as first-class collection categories.

The automated ingestion pipeline that sits at the centre of ARCHAI's architecture — connecting heterogeneous CMS and DAMS sources to a unified vector search layer, implemented across eighteen sources with per-source legal gate enforcement — represents a practical contribution to the infrastructure problems identified at the ZKM Workshop [8] and across the Summit series more broadly. It is operational. The code is in the repository. The pipeline ran last night.

---

## Conclusion

The framework's name carries deliberate intent. In Greek philosophy, archai (ἀρχαί) denotes both origins and first principles — the generative forces that determine what comes into being. ARCHAI treats heritage collections as active archai: not inert records of what has occurred, but living sources that continue to generate new understanding through the right kind of technological mediation.

The subtitle's "reanimation" designates something beyond archival preservation. Defunct systems speak again. Objects recover their interpretive voice. Hardware silenced by a corporate server decommissioning speaks again — through the collection, to visitors who require no knowledge of the technical history to have a genuine encounter with it. A mural documented by a city council in Chicago becomes a conversational object in the same semantic space as a Roman vase at the Getty. A video game from 1997 sits in the same index as a Wellcome Collection photograph. The definition of the collection is not fixed. The archive is expanding.

What has changed since the initial prototype is scale, reach, and the depth of the argument. Eighteen institutions and open civic datasets. Twenty thousand objects. Seven disciplinary themes enabling discovery without a cataloguing degree. Two and a half thousand pages — each one an entrance to a conversation. Posters on walls in three continents. A voice that speaks in multiple languages. The building starting to remember everything it has been asked to hold.

This project draws on 2,500 years of practice: the memory palaces of Simonides and Cicero, the rhetorical prosopopoeia of Quintilian and Ovid, the archival media theory of Ernst and Kirschenbaum, the data aesthetics of Anadol, and the conversational object proposals proliferating across contemporary museum practice. At every point in this lineage the underlying claim is the same. Stored knowledge has a voice. The question — always — is whether we have built the architecture to let it speak.

Ring ring. Click. Hello, this is the collection speaking.

---

## Acknowledgements

This research is supported by RMIT University through the School of Design (Generative Practice mode). The author acknowledges the guidance of supervisors Chris Barker, Helen Stuckey, and Johanne Trippas. The author acknowledges the Traditional Custodians of the lands on which this research was undertaken — the Wurundjeri Woi-wurrung and Bunurong Boon Wurrung peoples of the Kulin nation — and pays respect to Elders past and present. The open-access policies of the eighteen source institutions without which this pipeline could not exist are acknowledged as a form of institutional generosity that makes this class of research possible.

---

## References

[1] Matthew G. Kirschenbaum, *Mechanisms: New Media and the Forensic Imagination* (Cambridge, MA: MIT Press, 2008), 25–36.

[2] Richard Rinehart and Jon Ippolito, *Re-collection: Art, New Media, and Social Memory* (Cambridge, MA: MIT Press, 2014), 12, 178.

[3] Wolfgang Ernst, *Digital Memory and the Archive*, ed. Jussi Parikka (Minneapolis: University of Minnesota Press, 2013), 95.

[4] Wolfgang Strauss and Monika Fleischmann, "Exploring the Digital Archive as a Thinking Space," 3rd Summit on New Media Art Archiving, ISEA2023 Paris, 2023.

[5] Sean Carroll, "AI Applications in Media Art Archives," 4th Summit on New Media Art Archiving, ISEA2024 Brisbane, 2024.

[6] Shu Kobayashi, "Conserving Art Experience in Evolving Media Milieus," 5th Summit on New Media Art Archiving, ISEA2025 Seoul, 2025.

[7] Lozana Rossenova, "Connecting media art archives," TIB-Blog, 10 February 2025.

[8] T.C. Wong et al., "Workshop on New Media Art Archiving: Connecting Archives," ZKM | Center for Art and Media Karlsruhe, February 2025.

[9] Global Indigenous Data Alliance, "CARE Principles for Indigenous Data Governance," https://www.gida-global.org/care

[10] Software Preservation Network, "EaaSI: Emulation as a Service Infrastructure," https://www.softwarepreservationnetwork.org/eaasi/

[11] András Szántó and Thomas P. Campbell, "A.I. Is Coming for Museums. The Opportunities Are Vast — So Are the Pitfalls," *Artnet News*, 29 October 2025.

[12] Angie Judge, quoted in Lauren Styx, "How Are Museums Using Artificial Intelligence?" *MuseumNext*, August 2025.

[13] Cicero, *De Oratore*, 55 BCE. Trans. E.W. Sutton and H. Rackham (Cambridge, MA: Harvard University Press, 1942), Book II, 86.

[14] Refik Anadol, quoted in TIME100 AI 2025 profile, *Time* magazine, 2025.

[15] Gayane Umerova, keynote remarks, UNESCO Global Dialogue on AI and the Future of Museums, 8 November 2025.

[16] Graham Black, quoted in Cuseum, "Implementing AI for Cultural Institutions," September 2025.

[17] Quintilian, *Institutio Oratoria*, c.95 CE. Trans. H.E. Butler (Cambridge, MA: Harvard University Press, 1921), Book IX.

[18] Lynne Kelly, *The Memory Code* (Melbourne: Allen & Unwin, 2016).

[19] City of Melbourne, *Outdoor Artworks Dataset*, data.melbourne.vic.gov.au, CC BY 4.0, accessed June 2026.

[20] City of San Francisco, *Civic Art Collection*, data.sfgov.org, San Francisco Open Data, accessed June 2026.

[21] City of Chicago, *Public Art*, data.cityofchicago.org, Chicago Open Data, accessed June 2026.

[22] RAWG Video Games Database, rawg.io, API terms of service, accessed June 2026.

[23] Getty Museum, *Linked Art JSON-LD API*, data.getty.edu/museum/collection, CC0 1.0 Universal, accessed June 2026.

---

## Author Biography

Rob Graham is a PhD candidate at RMIT University (School of Design, Generative Practice mode) and founder of FAMTEC (Fine Art Media Tech), a creative technology consultancy and research organisation serving museums, galleries, archives, and cultural institutions. His research explores sovereign AI infrastructure for cultural heritage, with a specific focus on conversational collection access, hallucination prevention in heritage AI, and the preservation of interactive and born-digital artworks. He has held roles at ACMI, TarraWarra Museum of Art, Heide Museum of Modern Art, Museums Victoria, and Grande Experiences. ARCHAI is his primary doctoral contribution.

rob@fineartmedia.tech · fineartmedia.tech/archai · github.com/rob-e-graham/archai

