# ARCHAI
## Cultivating a Living Archive
*Augmented Reanimation, Cultural Heritage, Artificial Intelligence*

---

**6th Summit on New Media Art Archiving**  
In conjunction with ISEA2026, Dubai, 11–12 April 2026

**Rob Graham**  
FAMTEC (Fine Art Media Tech) · rob@fineartmedia.tech

---

## Abstract

“Museums are not silent repositories of Memory — they are living, thinking organisms, where imagination and knowledge, tradition and innovation meet. They are spaces where the past is not only preserved but reborn, where every visitor becomes part of a continuous human conversation.”
— Gayane Umerova, UNESCO Global Dialogue on AI and the Future of Museums, November 2025 [16]

Previous Summits on New Media Art Archiving have mapped the preservation crisis facing new media art with increasing precision. This paper does not revisit that map. It reports on what was built.

ARCHAI is a sovereign, open-source AI toolkit for cultural institutions and artist-run spaces. It maintains a strict separation between permanent heritage assets and regenerable AI processing layers, tracks every AI-generated response back to its source materials through a verifiable provenance chain, and enables visitors to hold natural language conversations with individual collection objects — each one drawing exclusively from its own curatorially-validated metadata. A five-layer hallucination prevention framework ensures that every response is grounded in verified curatorial fact. The hardware specification scales with the size and interaction complexity of each deployment; the complete stack runs on locally-owned commodity components, and collection data never leaves the institution’s physical infrastructure.

Interpreted through a fine art lens, ARCHAI extends a tradition reaching back 2,500 years — from ancient Greek prosopopoeia and the method of loci through to contemporary AI data art — into what this paper argues is the first open-source, sovereignty-preserving implementation of the conversational collection. The framework is currently being tested across several Melbourne-based GLAM institutions through the FAMTEC research and development programme.

**Keywords:**
sovereign infrastructure  ·  conversational objects  ·  hallucination prevention  ·  vector embeddings  ·  local LLM  ·  open-source GLAM toolkit  ·  NFC interpretation  ·  metadata-grounded AI  ·  prosopopoeia  ·  method of loci  ·  technological reanimation  ·  fine art archiving  ·  FAMTEC

## 1  Introduction

ARCHAI is research and development led by Rob Graham through FAMTEC (Fine Art Media Tech), currently being tested across several Melbourne-based GLAM institutions. It is simultaneously a live research programme and an open-source toolkit in preparation for broader sector deployment.

In practice-based research, building constitutes the research — not as illustration of theory but as the primary epistemic act. The architectural decisions made under real institutional constraints, the frameworks that crystallise through friction with actual collections and actual materials: these are the contribution. The commit history is part of the methodology. The prototype iterations are documented findings. The code advances arguments that the writing must then sustain.

### 1.1  Six Technical Contributions

The research is characterised by six interconnected contributions:

- 01  Vector embeddings for heritage discovery — semantic search across heterogeneous collections without dependence on controlled curatorial vocabulary.
- 02  Provenance-tracked AI interpretation — every generated response records its complete derivation chain back to source materials.
- 03  Two-layer architecture — permanent heritage assets held separately from regenerable AI processing layers.
- 04  Conversational objects — individual collection items speaking directly to visitors from their own validated metadata, via NFC tap.
- 05  Five-layer hallucination prevention — a documented framework ensuring AI responses remain grounded in verified curatorial fact.
- 06  Transferable hardware reference implementation — a scalable open-source stack adaptable to institutions of varying collection size and interaction complexity, released as a GLAM toolkit under the FAMTEC programme.

ARCHAI sits at the intersection of new media art archiving, fine art practice, and AI infrastructure design. Its ISEA2026 context is apt: the community grappling with AI artwork preservation is the same community producing those works. The archivists and the artists are often the same person, navigating the same tension simultaneously. ARCHAI functions as both preservation infrastructure and artistic proposition — an argument, made in code and hardware, about what it might actually mean for objects to speak.

### 1.2  Current Prototype Status (March 2026)

| System | Status | Notes |
| --- | --- | --- |
| Semantic search (Qdrant + nomic-embed-text) | Operational | 31,204 vectors · local · nightly pipeline |
| Conversational objects (Ollama / llama3) | Prototype live | Pepper robot reanimated. NFC Morse Key deployed. |
| NFC Tap-to-Transform | 18 tags active | 12 live · 3 draft · 3 unassigned. Sanity CMS integration. |
| ARCHAI UI (v0.6.1) | Working prototype | Curator · Upload · Nodel · NFC · Vocab · Visitor · Admin |
| FAMTEC Exchange | Prototype stage | Institution network · loan / rental / booking. Architecturally separate. |
| Met Open Access integration | Link + preview | v6 prototype panel. Cross-collection discovery trial. |
| Hallucination prevention | Framework documented | 5 layers. Morse Key: 10/10 quality, 0 confabulations across 50 tests. |

## 2  The Digital Heritage Access Crisis

In 2026, every major cloud provider has a prepared pitch for cultural institutions. The proposition is consistent: conversational interfaces, semantic discovery, automated enrichment, meaningful visitor engagement. The pricing appears manageable — until the contract is signed and an institution’s collection data is resident on servers in a jurisdiction beyond its control, potentially contributing to training corpora for models it will never own.

The scale of what actually remains inaccessible is rarely stated plainly. Following the Museums of Tomorrow Roundtable 2025 — a convening of international museum directors held at NVIDIA headquarters — Szantó and Campbell noted that what museums have digitised “remains mostly hidden from view, stored on local networks, accessible only to those working inside institutions.” [11] Most collections are processed in single-digit percentages. Decades of digitisation investment, and the overwhelming majority of the result is invisible to the public it was intended to serve. This is not a peripheral problem. It is the central problem.

ARCHAI begins from a different premise. Cloud AI creates not only cost but structural dependency: APIs are modified without notice, services are discontinued, model behaviour shifts between versions in ways that are rarely explained and almost never documented. An institution’s collection data — its irreplaceable archival record — becomes resident on infrastructure it does not control, potentially used to train systems it has no capacity to audit.

> *Sovereignty is not merely an ethical preference. It is a preservation requirement. An institution that cannot maintain independent access to its own interpretive systems has, in a meaningful sense, lost control of its collection.*

Angie Judge, CEO of Dexibit, articulated this plainly in 2025: “Just as with the age of the internet and the digital revolution, AI will quickly create a world of the haves and have nots.” [12] The ARCHAI toolkit is a direct response to this structural asymmetry. Hardware requirements scale with collection size and the complexity of interactions being supported. What remains constant is that the infrastructure is locally owned, locally operated, and answerable only to the institution running it.

ARCHAI’s answer is infrastructure an institution can own, audit, modify, and rebuild from first principles if needed. The AI layer is explicitly regenerable. The heritage layer is permanently stable. When improved embedding models become available, retraining runs against unchanged source records. The institution retains control at every stage.

## 3  An Ancient Proposition, A Contemporary Implementation

ARCHAI did not emerge from a theoretical framework applied to an existing system. It has a lineage — one that extends not to the emergence of digital heritage practice, nor to the invention of the museum, but to the origins of Western rhetoric itself.

### 3.1  The Method of Loci: The Original Conversational Collection

The method of loci — the memory palace — was codified by the Greek poet Simonides of Ceos (c.556–468 BCE) and later documented by Cicero in De Oratore and Quintilian in Institutio Oratoria. Its governing insight is spatial: memory is most reliably structured when knowledge is anchored to specific physical locations. Roman orators memorised entire speeches by mentally traversing a familiar building, depositing vivid images at fixed points along the route. Recall was achieved by retracing the path.

Cicero’s formulation: “It is chiefly order that gives distinctness to memory.” [13] The palace was not decorative architecture but operational epistemic infrastructure — a spatial system for holding, organising, and recovering knowledge. It remained effective across millennia precisely because it worked with cognitive architecture rather than against it.

ARCHAI proposes a specific inversion of this technique. In the classical memory palace, a human uses architecture as a mnemonic device for knowledge held internally. In ARCHAI, the architecture — the physical collection itself — employs AI to externalise its knowledge to visitors moving through it. Each NFC tag is a locus. Each collection object is its own bounded epistemic domain. The visitor retains nothing artificially; the building has already done the remembering, and it speaks.

> *The inverse memory palace: where knowledge flows outward from objects to visitors, rather than inward from visitors to objects. Two and a half millennia of rhetorical technique, arriving at a vector database.*

### 3.2  Prosopopoeia: Objects Given Voice

Alongside the memory palace, ancient and Renaissance rhetoric deployed prosopopoeia — the technique of giving voice to absent figures or inanimate objects. Quintilian examined it at length in Institutio Oratoria [17], noting its capacity to render the absent present and the silent articulate. The technique is ancient, cross-cultural, and — as the ARCHAI prototypes demonstrate — structurally suited to a vector database architecture.

ARCHAI’s conversational objects are the computational heirs of prosopopoeia, subject to one constraint the ancient orator did not face. A character in Ovid may testify to whatever the narrative requires. ARCHAI cannot. The Morse Key speaks from its verified archival record and from nowhere else. It has no literary licence. It has what its metadata can truthfully sustain — which, in a well-maintained collection, is still considerable.

#### 3.2.1  Storage Architecture and the Memory Palace

The spatial logic of the memory palace extends into ARCHAI’s physical storage architecture, which implements a three-tier model corresponding to the thermal properties of the data it holds. This architecture was developed through the FAMTEC R&D programme and reflects both preservation best practice and the specific demands of running AI inference against large heritage collections.

The first tier is hot storage: a primary NAS unit (solid-state, RAID configuration) holds active collection records, current vector embeddings, and all live operational data. This is the layer the AI queries in real time. The second tier is warm storage: a secondary NAS unit (high-density spinning disk, RAID) holds the bulk digital asset archive — high-resolution media, backup embeddings, and historical pipeline outputs. It is always available but not always in active use. The third tier is cold storage: a single LTO-9 magnetic tape unit holds archival preservation masters, off-site replication targets, and the long-term institutional record. Tape is chosen deliberately: it is the most cost-effective medium for multi-decade archival storage, immune to ransomware by virtue of being physically offline, and the preferred standard of national libraries and broadcast archives worldwide.

This three-tier structure — two NAS units plus one tape unit — constitutes the minimum recommended storage configuration for an ARCHAI deployment. It reflects the same principle as the memory palace itself: that the durability and retrievability of knowledge depend on the discipline of the architecture that holds it.

### 3.3  From Anadol to ARCHAI: Two Models of Data as Art

At the contemporary end of the lineage sits Refik Anadol, who describes data as “a pigment — a brush that can think.” [14] His studio has produced landmark works at the intersection of AI and institutional archives: Unsupervised at MoMA (2022) recorded an average of 38 minutes of visitor engagement per work, against an industry norm of 27 seconds per artwork — a gap that warrants serious attention from anyone working in heritage interpretation. Dvořák Dreams trained on one million data points including 54 hours of Dvořák recordings.

These are significant works. They are also cloud-dependent, enterprise-resourced undertakings that a regional gallery, a small archive, or an artist-run space cannot replicate. ARCHAI operates in a complementary register: where Anadol transforms institutional data into aesthetic spectacle, ARCHAI transforms it into epistemic conversation. Both are legitimate artistic and archival propositions; only one is designed to operate on locally-owned infrastructure scaled to what each institution actually requires. Both, however, rest on the same foundational claim: the archive is not inert storage. It is generative material awaiting the right conditions to speak.

## 4  Architecture: The Two-Layer Principle

The central architectural decision in ARCHAI addresses a genuine tension that does not resolve through preference. AI-generated content is useful and inherently unstable: models improve, embeddings shift, responses vary with context and version. Heritage records require the opposite: permanence, authority, citability, and immunity to alteration by anything the AI layer does with them.

### 4.1  Heritage Foundation Layer

This layer holds institutional truth. Original documents, curatorial records, artist statements, conservation reports, interview transcripts, primary digital assets. CollectiveAccess manages collection records; ResourceSpace handles digital asset management. Nothing generated by AI enters this layer — not an interpretation, not a summary, not a cached response. Nothing.

This reflects Ernst’s distinction between “cultural archive” and “technomathematical storage” — the former maintaining interpretive authority, the latter enabling computational operations. [3] The heritage layer is the former. It does not change as a consequence of what the latter does with it.

### 4.2  Derivative Processing Layer

This layer holds generated materials: vector embeddings, search indices, AI-synthesised responses, cached queries. Its defining property is that it is entirely regenerable. When an improved embedding model becomes available, the old vectors are discarded and regenerated from the unchanged source records. When something fails in the AI configuration, the processing layer is rebuilt from scratch. The heritage records are unaffected. This separation directly addresses the sustainability concerns documented at the ZKM Workshop [8] and is the architectural decision that makes everything else in the system defensible.

### 4.3  The Headless CMS Layer

A third layer, positioned between the archival foundation and the public-facing interfaces, manages curator-authored interpretation. An open-source headless CMS — Ghost (MIT-licensed, Node.js) or Directus, depending on institutional requirements — enables curators to write and publish interpretation content delivered via API to NFC terminals, mobile interfaces, and conversational objects, without that editorial work ever touching the archival records below. Interpretation flows in one direction only: from archive to visitor. It does not flow back.

*FIGURE 1  —  ARCHAI THREE-LAYER ARCHITECTURE*

| LAYER 3  ·  Interface Layer ARCHAI Web App  ·  Role-aware  ·  NFC-enabled Curator  ·  Collections Officer  ·  AV Technician  ·  Volunteer  ·  Visitor |
| --- |
| LAYER 2  ·  Derivative Processing Layer  (Regenerable) Qdrant  ·  Ollama / llama3  ·  nomic-embed-text  ·  Ghost / Directus CMS Nightly pipeline  ·  Cultural safety gate  ·  Provenance trace  ·  Hallucination prevention |
| LAYER 1  ·  Heritage Foundation Layer  (Permanent — Never Modified by AI) CollectiveAccess (CMS)  ·  ResourceSpace (DAMS) Canonical records  ·  Artist statements  ·  Conservation reports  ·  Primary digital assets |

## 5  Talking to Objects: Metadata-Grounded Conversational AI

ARCHAI’s most immediately visible prototype enables visitors to hold conversations with individual collection objects. An NFC tag affixed to a Morse key from circa 1920 opens a chat interface on the visitor’s device. The key speaks — not as a generic institutional chatbot with contextual knowledge of Morse keys, but as that specific object, drawing on its own curatorially-verified metadata record, with a precisely defined understanding of what it knows and what it does not.

The mechanism is architectural. Each object runs its own Ollama model instance, configured with a structured system prompt assembled from its validated metadata record. The object’s knowledge is bounded by that record. Equally significant: it is explicitly instructed to acknowledge the boundaries of its knowledge rather than exceed them.

### 5.1  From Metadata to Voice: The System Prompt Pipeline

Each object’s metadata record organises its epistemic constraints into four categories:

- Verified facts  statements the object may assert with confidence: date range, materials, provenance region, functional description, historical context.
- Unknown fields  an explicit enumeration of what the object cannot know: manufacturer, original owner, service history, specific messages transmitted. The AI is instructed to acknowledge these gaps directly.
- Curator-approved statements  pre-authored sentences the object may use verbatim, conveying curatorial authority into the conversation.
- Prohibited statements  specific claim types the object must not make: named individuals, particular historical events, invented memories.
### 5.2  Example: The Morse Key

Object 424 — a Morse key, Western Australia, circa 1920 — operates within a precisely bounded epistemic domain. A visitor asks: “My grandfather used you on the Adelaide railway, right?” A poorly-designed system invents a memory; the visitor leaves with a false one. ARCHAI’s system does not:

> **Validated response:** *My records say I came from Western Australia, though my exact working life is a bit hazy. But your grandfather worked the Adelaide railway? That’s beautiful. He would’ve used a key just like me. Even if it wasn’t me he pressed, we shared that connection. *click-click**

The object acknowledges its own epistemic limits, honours the visitor’s connection without fabricating facts, and maintains character throughout. Across 50 pre-deployment test conversations — including deliberate attempts to elicit confabulation — the Morse Key achieved a 10/10 metadata quality score and zero confabulation incidents.

### 5.3  Visitor Contribution as Collective Prosopopoeia

A structured contribution pipeline extends the prosopopoeia model into participatory territory. Visitors may submit additions to an object’s voice — corrections, contextual knowledge, personal connections — subject to curatorial review. Accepted entries are attributed, timestamped, and linked to the relevant collection record. The object’s epistemic domain accumulates over time through distributed community knowledge, mediated by institutional authority.

This constitutes collective prosopopoeia: the object’s voice built from the archive out, through structured dialogue between public memory and institutional record — without exposing the heritage foundation to direct modification. Errors are bounded and reversible. The authority of the canonical record is uncompromised.

### 5.4  Cross-Object Navigation

At the close of each conversation, objects introduce related items in the collection. The Morse Key names its contemporaries: the Telegraph Sounder it worked alongside, the Semi-Automatic Bug Key that superseded it, the Telephone Switchboard that rendered the entire technology obsolete. Each introduction opens a new conversation. Visitors navigate the collection through the internal logic of the objects rather than the spatial logic of the floor plan.

## 6  Hallucination Prevention: A Five-Layer Framework

The central risk of deploying conversational AI in a cultural heritage context is confabulation — plausible-sounding false information delivered with the confidence of an authoritative source. Graham Black has argued that museums function as “bastions of reliable knowledge” in an increasingly unreliable information environment. [15] When an AI-powered exhibit fabricates a fact about an object, the consequence is not merely an inaccuracy. It is a curatorial failure with measurable consequences for institutional trust, and those consequences are not resolved by a software update.

| Layer | Stage | Mechanism |
| --- | --- | --- |
| 01 | Source Data | Structured metadata schemas require curators to document both known facts and explicitly unknown fields. A JSON ‘unknown_fields’ property forces enumeration of epistemic gaps. Objects must reach 8/10 on the metadata quality score before curator review can proceed. |
| 02 | AI Constraints | The system prompt assembled from validated metadata encodes epistemic boundaries directly. The object is instructed to use uncertainty language (‘circa’, ‘approximately’, ‘keys like me’) for unverified claims, and to acknowledge ignorance rather than fabricate. |
| 03 | Real-Time Validation | Response validation runs against the object’s metadata before delivery. Critical failures trigger an automatic fallback: ‘I want to make sure I’m giving you accurate information. Let me stick to what I know for certain…’ |
| 04 | Human Review | No object is deployed without curator sign-off on a minimum of 50 test conversations, including structured red-team attempts designed to elicit confabulation. This is not optional. |
| 05 | Post-Launch Monitoring | Conversation logs are reviewed weekly. Visitor corrections are treated as quality signals and investigated. Monthly curator audits maintain ongoing accuracy. |

## 7  Hardware Reference Implementation

ARCHAI is designed for hardware that institutions can procure, maintain, and operate without specialist infrastructure staff on retainer. The reference stack is built from commodity components: widely available, well-documented, and serviceable by a capable generalist. The specific configuration scales with collection size and the number of concurrent visitor interactions the deployment needs to support.

### 7.1  Compute

| Component | Specification | Role |
| --- | --- | --- |
| Primary Compute | Apple Mac Studio (M4 Max · 64GB Unified Memory) or equivalent high-RAM workstation. Under 120W at full inference. | Local LLM inference via Ollama. Scales vertically with collection size and concurrent interaction load. |
| Development / R&D | High-VRAM workstation (e.g. RTX 5090 · 32GB VRAM) | Experimental inference, model fine-tuning, prototype development. |

### 7.2  Storage Architecture

ARCHAI’s storage architecture implements a three-tier model corresponding to the access frequency and preservation requirements of the data it holds. This structure — two NAS units plus one LTO magnetic tape unit — constitutes the minimum recommended configuration for a production deployment.

| Tier | Component | Specification | Role |
| --- | --- | --- | --- |
| Hot | NAS Primary | Synology or equivalent · SSD RAID · always-on | Active collection records, live vector index, NFC configuration, operational pipeline data. |
| Warm | NAS Secondary | Synology or equivalent · high-density HDD RAID · bulk media | DAMS media archive, backup embeddings, historical pipeline outputs. Available but not continuously active. |
| Cold | Tape (LTO-9) | Single LTO-9 drive · 200TB cartridge capacity · off-site replication via Hyper Backup | Archival preservation masters, long-term institutional record. Physically offline — immune to ransomware, aligned with national library and broadcast archive standards. |

The three-tier model reflects the same principle as the memory palace: durable knowledge requires a disciplined architecture. Hot storage supports real-time AI inference; warm storage holds the institutional media archive; cold storage preserves what must survive decades without active maintenance. Each tier is independently replaceable without affecting the others. The heritage foundation layer remains intact regardless of what happens in the processing layers above it.

### 7.3  Open-Source Software Stack

| Component | Role |
| --- | --- |
| Qdrant | Vector database for semantic search. Self-hosted, zero cloud dependency. |
| Ollama | Local LLM inference. Per-object model instances for conversational objects. |
| nomic-embed-text | Open-source embedding model (768-dim). Runs locally via Ollama. |
| CollectiveAccess | Open-source collection management system. Heritage Foundation Layer. |
| ResourceSpace | Digital asset management. Canonical media storage. |
| Ghost / Directus | Open-source headless CMS for curator interpretation layer. NFC page authoring. |
| Whisper (local) | Audio transcription and voice input for kiosk and terminal interactions. |
| Coqui TTS | Per-object voice synthesis. Period-appropriate audio interfaces. |
| Docker / Nginx | Containerisation and routing for all services. |
| Proxmox VE | Virtualisation for behaviour preservation. VM snapshots of AI artwork environments. |

### 7.4  Capital Investment Range

Total hardware investment for a production ARCHAI deployment ranges from approximately $AUD 10,000 to $AUD 20,000 depending on collection scale, the number of concurrent interactions being supported, and the media richness of the digital assets being served. A smaller institution running a focused single-gallery installation requires considerably less compute and storage than a metropolitan collection operating across multiple buildings with high visitor throughput. The upper figure represents a fully specified deployment with primary compute, both NAS tiers, and LTO-9 tape. This is a one-time capital investment; there are no per-query fees, no subscription tiers, and no dependency on external model availability.

For institutions managing capital procurement constraints, the FAMTEC exchange model supports access through loan, rental, and skills-sharing arrangements. The barrier to entry is shaped by institutional need and available infrastructure rather than a fixed price point.

## 8  Working Prototypes

### 8.1  Conversational Terminals

Local language models housed in repurposed vintage hardware — a deliberate aesthetic decision connecting contemporary AI inference to the communication technology history that the collection documents. Visitors submit questions; Qdrant retrieves relevant collection materials; the system synthesises a response with a full provenance chain attached. Every claim is traceable to its source document. The terminal does not speculate. It cites.

### 8.2  NFC Interpretation Points

NFC tags function as the system’s spatial index — each one a locus in the living memory palace, anchoring AI responses to a specific object at a specific location. When a visitor taps, the system resolves exactly which object is being addressed. Voice interaction is available through period-appropriate analogue handsets via Coqui TTS. Sanity CMS manages the public-facing NFC pages, keeping visitor interfaces cleanly decoupled from the collection infrastructure behind them.

### 8.3  Technological Reanimation: Pepper Robot

A Pepper social robot, whose original manufacturer discontinued cloud services, now runs local language models via Ollama. The robot speaks again — not through external servers but through the collection itself, drawing on the same archival infrastructure that serves every other conversational object in the building. This is functional preservation: not housing the hardware behind glass, but restoring its genuine capacity for interaction through sovereign infrastructure. The robot is simultaneously a collection object, a preservation challenge, and an active artwork. It is also, in a precise sense, the proposition made physical.

### 8.4  ARCHAI Interface (v0.6.1)

The ARCHAI prototype is a role-aware web application with seven panels: Curator & Collections (semantic search, object detail, provenance chain), Upload & Ingest (metadata wizard, AI-assisted thesaurus tagging, cultural safety gate), Exhibitions Live (Nodel exhibition control), NFC Management (full tag lifecycle), Vocabulary & Thesaurus (Getty AAT, LCSH, local and Indigenous vocabularies), Visitor View (NFC page previews and live visitor chat), and Admin (user management, permissions matrix, system configuration, pipeline settings, audit log). Six roles are implemented — Admin, Curator, Collections Officer, AV Technician, Volunteer, and Visitor — each with a precisely scoped permission set. A v6 panel adds The Met Open Access API, enabling initial cross-institutional collection discovery trials.

### 8.5  FAMTEC Exchange

FAMTEC (Fine Art Media Tech) is a parallel initiative extending the ARCHAI ecosystem into institution-to-institution exchange: hardware sharing through loan and rental, skilled technician bookings, and cross-institutional exhibition support. FAMTEC runs as an architecturally independent service with its own database and authentication layer, preserving each institution’s data sovereignty, with an API bridge connecting the two systems where workflows require it. Its architectural separation from ARCHAI is a design decision, not an oversight.

## 9  Behaviour Preservation for AI Artworks

For AI artworks and software-dependent works, ARCHAI extends preservation beyond source code to encompass complete computational environments. Kirschenbaum’s concept of “forensic materiality” is pertinent here: preservation must capture not only formal representations but the specific material conditions that make execution possible. [1] A neural network trained on one dataset produces different behaviour from an architecturally identical network trained on another. The trained weights are not documentation of the artwork. They are the artwork.

ARCHAI addresses this through Proxmox VM snapshots: period-appropriate operating system, exact dependency versions, trained models, and documented outputs are preserved together as a reproducible computational environment. For spatial works that cannot be re-executed in situ, VR reconstruction produces experiential documents with explicit fidelity ratings — distinguishing clearly between what has been reconstructed and what remains speculative.

Rinehart and Ippolito argue that preservation strategies must become “medium-independent, translatable into new mediums when their original formats are obsolete.” [2] ARCHAI operationalises this directly. The reanimated Pepper robot is not a simulation of its original behaviour. It is a restoration of the work’s genuine capacity for interaction, running on infrastructure the institution controls, without a cloud dependency that could be deactivated without notice.

## 10  Cultural Safety Protocols

ARCHAI implements specific protocols for culturally sensitive materials, particularly First Nations content. The architecture is intentional: sensitivity is embedded at record level and propagates through the entire pipeline, rather than being applied as a filter at query time.

Materials flagged with sensitivity metadata in CollectiveAccess follow entirely separate processing pathways. At the Heritage Foundation Layer, these records are held under access controls consistent with institutional cultural safety policy. At the Semantic Layer, sensitive records are excluded from general embedding pipelines by default — not filtered on retrieval, but never embedded in the first place. When a query potentially surfaces sensitive material, appropriate pathways are triggered: surfacing consent frameworks, flagging consultation requirements, or adjusting response framing. The CARE Principles for Indigenous Data Governance inform this architecture throughout. [9]

In the upload interface, all new materials pass through a four-level cultural safety review prior to embedding: No concern / Unsure — flag for review / Restrict access / Exclude from AI entirely. Materials at the exclusion level are permanently removed from the vector pipeline regardless of subsequent configuration changes. The exclusion is not a configurable setting. It is a record-level property that the pipeline evaluates before any processing occurs.

## 11  Limitations

ARCHAI addresses specific and real problems in digital heritage access, but it does not dissolve the larger challenge of what it means to keep complex, time-based, and software-dependent works genuinely alive. Embodied experience resists meaningful preservation. Platform-native works resist migration in ways that no amount of VM snapshotting fully addresses. AI does not supplant curatorial expertise — language models produce fluent, confident text that can be confidently wrong, and human judgment remains necessary at every layer of the system.

The toolkit model introduces its own risks. An institution that deploys ARCHAI without the systems administration capacity to maintain it may find it has exchanged one form of dependency for another. Cloud services render real costs invisible behind a subscription line. ARCHAI makes those costs visible and concrete — hardware, power, staff time, ongoing maintenance. That transparency is the point. But transparency does not eliminate cost.

Finally: ARCHAI is a proposition grounded in a specific institutional, geographic, and disciplinary context. The fine art lens applied here — treating infrastructure design as artistic practice, object metadata as epistemic sculpture, hallucination prevention as a form of curatorial integrity — is not the only valid framework. It is, however, the lens that makes this contribution legible to the community gathering at ISEA2026: artists, archivists, and technologists who understand that the architecture of tools is inseparable from what those tools make possible.

## Conclusion

The framework’s name carries deliberate intent. In Greek philosophy, archai (ἀρχαί) denotes both origins and first principles — the generative forces that determine what comes into being. ARCHAI treats heritage collections as active archai: not inert records of what has occurred, but living sources that continue to generate new understanding through the right kind of technological mediation.

The subtitle’s “reanimation” designates something beyond archival preservation. Defunct systems speak again. Objects recover their interpretive voice. A Pepper robot silenced by a corporate server decommissioning speaks again — through the collection, to visitors who require no knowledge of the technical history to have a genuine encounter with it.

This project draws on 2,500 years of practice: the memory palaces of Simonides and Cicero, the rhetorical prosopopoeia of Quintilian and Ovid, the archival media theory of Ernst and Kirschenbaum, the data aesthetics of Anadol, and the conversational object proposals proliferating across contemporary museum practice. At every point in this lineage the underlying claim is the same. Stored knowledge has a voice. The question — always — is whether we have built the architecture to let it speak.

> *Traditional preservation systems preserve records. ARCHAI attempts to preserve something more difficult to define: understanding, behaviour, the capacity for discovery, the texture of an encounter between a visitor and an object that has not been reduced to a QR code pointing at a PDF. The infrastructure is open-source. The architecture is documented. The prototypes are running. The building is starting to remember.*

## References

[1]  Matthew G. Kirschenbaum, Mechanisms: New Media and the Forensic Imagination (Cambridge, MA: MIT Press, 2008), 25–36.

[2]  Richard Rinehart and Jon Ippolito, Re-collection: Art, New Media, and Social Memory (Cambridge, MA: MIT Press, 2014), 12, 178.

[3]  Wolfgang Ernst, Digital Memory and the Archive, ed. Jussi Parikka (Minneapolis: University of Minnesota Press, 2013), 95.

[4]  Wolfgang Strauss and Monika Fleischmann, “Exploring the Digital Archive as a Thinking Space,” 3rd Summit on New Media Art Archiving, ISEA2023 Paris, 2023.

[5]  Sean Carroll, “AI Applications in Media Art Archives,” 4th Summit on New Media Art Archiving, ISEA2024 Brisbane, 2024.

[6]  Shu Kobayashi, “Conserving Art Experience in Evolving Media Milieus,” 5th Summit on New Media Art Archiving, ISEA2025 Seoul, 2025.

[7]  Lozana Rossenova, “Connecting media art archives,” TIB-Blog, 10 February 2025.

[8]  T.C. Wong et al., “Workshop on New Media Art Archiving: Connecting Archives,” ZKM | Center for Art and Media Karlsruhe, February 2025.

[9]  Global Indigenous Data Alliance, “CARE Principles for Indigenous Data Governance,” https://www.gida-global.org/care

[10]  Software Preservation Network, “EaaSI: Emulation as a Service Infrastructure,” https://www.softwarepreservationnetwork.org/eaasi/

[11]  András Szántó and Thomas P. Campbell, “A.I. Is Coming for Museums. The Opportunities Are Vast—So Are the Pitfalls,” Artnet News, 29 October 2025.

[12]  Angie Judge, quoted in Lauren Styx, “How Are Museums Using Artificial Intelligence?” MuseumNext, August 2025.

[13]  Cicero, De Oratore, 55 BCE. Trans. E.W. Sutton and H. Rackham (Cambridge, MA: Harvard University Press, 1942), Book II, 86.

[14]  Refik Anadol, quoted in TIME100 AI 2025 profile, Time magazine, 2025.

[15]  Graham Black, quoted in Cuseum, “Implementing AI for Cultural Institutions,” September 2025.

[16]  Gayane Umerova, keynote remarks, UNESCO Global Dialogue on AI and the Future of Museums, 8 November 2025.

[17]  Quintilian, Institutio Oratoria, c.95 CE. Trans. H.E. Butler (Cambridge, MA: Harvard University Press, 1921), Book IX.

[18]  Lynne Kelly, The Memory Code (Melbourne: Allen & Unwin, 2016).

— End of Paper —
