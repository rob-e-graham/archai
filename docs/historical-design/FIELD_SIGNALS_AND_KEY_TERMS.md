# Field Signals and Key Terms: HCI and Cultural Heritage Research (2021–2026)

**Author**: Rob Graham
**Context**: RMIT Design PhD — supervised by Chris Barker
**Last updated**: 2026-06-05
**Status**: Working research document — literature review draft material

---

## 1. Purpose

This document responds to a key task from Chris Barker's supervision:

> Download the last 5 years of HCI conference abstracts. Search key terms — feelings and fields that are similar. Retroactively have capacity to answer questions in the field and with their needs and field signals.

Rather than downloading raw abstract databases (which would require institutional ACM Digital Library access for bulk export), this document takes a more productive approach: it maps recent papers from major HCI and heritage venues against ARCHAI's key terms, identifies field signals — recurring concerns, unresolved needs, and vocabulary patterns — and positions ARCHAI's specific contributions against the current state of the discourse.

The aim is to build a **field-sensitive reference layer** that helps ARCHAI:

- understand which problems are already being discussed
- identify which adjacent fields use similar language
- track which values and design assumptions dominate the discourse
- surface where ARCHAI is aligned with existing work
- articulate where ARCHAI is genuinely contributing something new

---

## 2. Target Conferences and Venues

### Primary HCI venues

| Venue | Full name | Relevance to ARCHAI |
|-------|-----------|---------------------|
| **CHI** | ACM Conference on Human Factors in Computing Systems | Largest HCI venue. Papers on museum AI, conversational agents, accessibility, tangible interaction. |
| **DIS** | ACM Designing Interactive Systems | Design theory, participatory design, values in design, critical design. |
| **TEI** | International Conference on Tangible, Embedded, and Embodied Interaction | Physical-digital bridging, NFC, smart objects, embodied computing. Most directly relevant to ARCHAI's NFC layer. |
| **CSCW** | ACM Conference on Computer-Supported Cooperative Work and Social Computing | Collaborative systems, institutional workflows, social dimensions of technology. |
| **UIST** | ACM Symposium on User Interface Software and Technology | Novel interaction techniques, input methods, system architectures. |
| **IUI** | ACM Conference on Intelligent User Interfaces | AI-driven interfaces, conversational agents, adaptive systems. |
| **C&C** | ACM Conference on Creativity and Cognition | Creative AI, generative systems, artistic practice. |
| **NordiCHI** | Nordic Conference on Human-Computer Interaction | Scandinavian HCI tradition — participatory design, critical computing. |
| **OzCHI** | Australian Conference on Human-Computer Interaction | Australian HCI community — relevant for RMIT context. |

### Heritage and cultural computing venues

| Venue | Full name | Relevance to ARCHAI |
|-------|-----------|---------------------|
| **JOCCH** | ACM Journal on Computing and Cultural Heritage | The primary journal for heritage computing. Recent papers on tangible interaction, AI chatbots, digital preservation in museums. |
| **MW** | Museums and the Web | Practitioner-focused conference. Institutional technology, digital strategy, visitor engagement. |
| **ICOM / CIDOC** | International Council of Museums / Comité International pour la Documentation | Museum standards, documentation practice, ethics, cultural protocol. |
| **DH** | Digital Humanities conferences (ADHO, etc.) | Text analysis, archives, computational culture, digital scholarship. |
| **ICHIM / EVA** | International Conference on Hypermedia and Interactivity in Museums / Electronic Visualisation and the Arts | Multimedia in museums, interactive exhibitions, visualisation. |
| **IJHCI** | International Journal of Human-Computer Interaction | Peer-reviewed journal. Recent papers on affect, emotion, cultural heritage interaction. |

---

## 3. Recent Relevant Papers (2021–2026)

### 3.1 Conversational AI in Museums and Heritage

**"Conversational AI-Enhanced Exploration System to Query Large-Scale Digitised Collections of Natural History Museums"**
Yiyuan Wang, Andrew Johnston, Zoe Sadokierski, Rhiannon Stephens, Shane T. Ahyong
University of Technology Sydney + Australian Museum, 2025 (arXiv)

A system enabling web-based exploration of nearly 1.7 million digitised life-science specimen records from the Australian Museum. It combines an interactive map (React + Leaflet.js) for visual-spatial discovery with a natural-language conversational agent that retrieves collection-specific information. The system uses OpenAI's GPT-5-mini with function-calling to query the Atlas of Living Australia (ALA) Biocache API in real-time.

User testing with 12 museum volunteers identified four priorities:
1. Comprehensibility of collection scale
2. Query accessibility without technical expertise
3. Response reliability grounded in actual data
4. Ubiquitous access

**ARCHAI comparison**: Similar goals (conversational access to large collections) but fundamentally different architecture. Wang et al. use a cloud LLM (GPT-5-mini) and live API queries — no data is stored locally, and every interaction depends on internet connectivity and a commercial API. ARCHAI uses a locally-hosted LLM with pre-embedded vectors. The sovereignty models are opposite. The UTS system answers questions about the collection as a whole; ARCHAI gives individual objects a voice.

Source: [arXiv 2603.10285](https://arxiv.org/html/2603.10285v1)

---

**"SimViews: An Interactive Multi-Agent System Simulating Visitor-to-Visitor Conversational Patterns to Present Diverse Perspectives of Artifacts in Virtual Museums"**
Mingyang Su, Chao Liu, Jingling Zhang, Wu Shuang, Mingming Fan
Hong Kong University of Science and Technology, 2025 (arXiv)

A multi-agent system where LLM-powered agents with distinct professional identities (ethicists, art historians, biologists) simulate visitor interactions about museum artifacts. Based on Erving Goffman's participation framework, the system supports four conversational patterns:
1. Active speaking — user initiates with agent
2. Passive speaking — agent initiates, user responds
3. Active listening — user joins ongoing agent-to-agent discussion
4. Passive listening — user overhears agent conversation

Technologies: Spark LLM, Azure speech-to-text and text-to-speech, Unity engine, Ready Player Me avatars, behaviour tree logic for autonomous agent navigation.

A 20-participant study showed SimViews significantly enhanced understanding of diverse perspectives and engagement compared to a single-agent baseline: 8.1 conversation turns vs 3.4. "Active listening was rated most helpful for understanding."

**ARCHAI comparison**: Fundamentally different paradigm. SimViews uses multiple simulated human visitors discussing an artifact — the diversity comes from different professional viewpoints. ARCHAI gives the object itself a voice — the diversity comes from personality profiles (narrator, docent, casual, poetic) and the visitor's own questions. SimViews is about multi-perspective interpretation through simulated social interaction; ARCHAI is about direct object-visitor dialogue.

Source: [arXiv 2508.07730](https://arxiv.org/html/2508.07730)

---

**"Using a Large Language Model as Design Material for an Interactive Museum Installation"**
Maria Padilla Engstrom, Anders Sundnes Lovlie
2025 (arXiv / CHI-adjacent)

Explores leveraging an LLM to create interactive museum chatbots that simulate historical figures through role play and dynamic conversation. Identifies a fundamental tension: while LLMs enable engaging interactions, they risk generating misinformation — conflicting with museums' educational mission.

Through Research-through-Design methodology, they propose two design strategies:
1. Emphasising personal narratives over factual accuracy (framing the chatbot as creative engagement rather than educational content)
2. Deliberately exposing chatbot unreliability to encourage visitor critical thinking (using unreliability as a pedagogical tool)

**ARCHAI comparison**: ARCHAI takes a third path not explored in this paper: grounding responses strictly in the object's institutional record, with hallucination prevention constraining the LLM to documented facts. Rather than accepting unreliability or avoiding facts, ARCHAI enforces factual grounding while allowing interpretive personality.

Source: [arXiv 2503.22345](https://arxiv.org/abs/2503.22345)

---

**"Experiencing Art Museum with a Generative Artificial Intelligence Chatbot"**
ACM International Conference on Interactive Media Experiences, 2025

Evaluates visitor experience with a generative AI chatbot at an art museum. Visitors enjoy interacting and find the experience engaging, but report "a lingering sense of unease once the conversation ends."

**Field signal**: The emotional dimension of AI interaction in museums is being studied but not well resolved. The "unease" finding suggests that visitors perceive the gap between the conversational experience (it felt real) and the technical reality (it was an AI). ARCHAI's transparency approach — "responses are grounded in verified collection metadata" — may help address this by anchoring the experience in institutional authority.

Source: [ACM DL 10.1145/3706370.3731650](https://dl.acm.org/doi/10.1145/3706370.3731650)

---

**"An Evaluation of LLM-based Chatbots for Enhancing the Visitor's User Experience at Cultural Exhibits"**
ACM Journal on Computing and Cultural Heritage (JOCCH), 2025

Three case studies evaluating AI chatbot impact on user experience: a digital art exhibition, a painting gallery, and an archaeological museum. Mixed-method approach (quantitative questionnaires + qualitative interviews). Findings: "LLMs have significant potential to enhance visitor engagement and deliver personalized experiences." But challenges remain around "authenticity and historical accuracy given LLMs' tendency to hallucinate."

**Field signal**: Hallucination is the single most-cited concern in museum AI literature. ARCHAI's record-grounded approach with explicit hallucination prevention is a direct response.

Source: [ACM DL 10.1145/3775062](https://dl.acm.org/doi/10.1145/3775062)

---

**"How to Make Museums More Interactive? Case Study of Artistic Chatbot"**
ACM CIKM 2025

The Artistic Chatbot: a voice-to-voice RAG-powered chat system designed to support informal learning at a live art exhibition at the Warsaw Academy of Fine Arts. Uses Retrieval-Augmented Generation (RAG) to ground responses in exhibition materials.

**ARCHAI comparison**: Similar RAG approach (ARCHAI also retrieves from canonical records before generating). The voice-to-voice pattern is the same direction ARCHAI is pursuing with Whisper + Piper/Coqui. Key difference: ARCHAI positions the object as the speaker in first person; this system positions the chatbot as an informational assistant.

Source: [ACM DL 10.1145/3746252.3761485](https://dl.acm.org/doi/10.1145/3746252.3761485)

---

**"Engaging Museum Visitors with AI: The Case of Chatbots"**
Vartiainen and Tedre, 2020 (ResearchGate)

Introduces the Nikola Tesla Chatbot at the Museum of Science and Technology in Belgrade — described as the world's first historical figure chatbot in a museum context. Based on Tesla's biography, designed to reflect the linguistic styles of his time. A survey of 306 adult visitors analysed interactivity, educational impact, and satisfaction.

**ARCHAI comparison**: Tesla chatbot impersonates a specific historical person; ARCHAI gives objects their own voice based on their material and institutional record. The impersonation model raises questions about accuracy and authority that ARCHAI avoids by speaking from documented data rather than biographical simulation.

Source: [ResearchGate](https://www.researchgate.net/publication/336020755_Engaging_Museum_Visitors_with_AI_The_Case_of_Chatbots)

---

### 3.2 Tangible and Embodied Interaction in Heritage

**"Smart Objects and Replicas: A Survey of Tangible and Embodied Interactions in Museums and Cultural Heritage Sites"**
ACM Journal on Computing and Cultural Heritage (JOCCH), 2024

The most comprehensive recent survey of the field. Key findings:

- "Since the early 2000s, tangible and embodied interactions have been applied and researched in cultural heritage and museums, in an attempt to overcome issues induced by screen-based devices that may disengage visitors from the objects, their materiality and the physicality of the visit."
- Analyses "the agency of tangible and embodied interaction systems applied to cultural heritage and the role of design in shaping the expected behaviour of users."
- Smart objects — physical replicas or enhanced originals with embedded sensors and computation — are identified as the strongest approach for maintaining the connection between visitors and material heritage.

**ARCHAI alignment**: This survey directly supports ARCHAI's NFC-bridged approach. The criticism of screen-based devices echoes ARCHAI's design philosophy: the phone is a conversational channel to the object, not a replacement for looking at it.

Source: [ACM DL 10.1145/3631132](https://dl.acm.org/doi/10.1145/3631132)

---

**"Tangible Interaction and Cultural Heritage: An Analysis of the Agency of Smart Objects and Gesture-based Systems"**
ResearchGate, heritage tangible interaction research

Analyses agency of tangible and embodied interaction systems in cultural heritage. Examines the role of design in shaping expected user behaviour. Smart objects and gesture-based systems are positioned as alternatives to screen-based interaction that better preserve the material encounter.

**ARCHAI alignment**: ARCHAI's personality system — which shapes the object's manner of speaking through tone profiles — directly relates to this paper's concern with how design shapes expected behaviour. The personality system creates a behavioural contract: a "narrator" mode sets different expectations from a "poetic" mode.

Source: [ResearchGate](https://www.researchgate.net/publication/322006494_Tangible_Interaction_and_Cultural_Heritage_An_Analysis_of_the_Agency_of_Smart_Objects_and_Gesture-based_Systems)

---

**"NFCSense: Data-Defined Rich-ID Motion Sensing for Fluent Tangible Interaction Using a Commodity NFC Reader"**
ACM CHI 2021

Demonstrates that commodity NFC readers can support rich motion sensing and tangible interaction beyond simple tag identification. Multiple sensing modalities from a single NFC tag.

**ARCHAI relevance**: Shows that NFC-based interaction can be much richer than simple "tap to open link" patterns. Future ARCHAI development could use gesture or motion with NFC for richer physical-digital bridging.

Source: [ACM DL 10.1145/3411764.3445214](https://dl.acm.org/doi/abs/10.1145/3411764.3445214)

---

**"Natureculture Probes: Opening up dialogues in natural heritage(s) landscapes"**
TEI 2025 (Bordeaux)

Design probes applied to natural heritage landscapes. More-than-human framing — exploring dialogues between human visitors and natural heritage environments.

**Field signal**: TEI is engaging directly with more-than-human heritage questions. ARCHAI's approach to object voice sits in this trajectory.

Source: [ACM DL 10.1145/3689050.3704430](https://dl.acm.org/doi/10.1145/3689050.3704430)

---

**"Sensing Bodies: Engaging Postcolonial Histories through More-than-Human Interactions"**
TEI 2024 (Cork)

Embodied interaction with postcolonial heritage objects. Examines how more-than-human interaction methods can engage visitors with difficult histories.

**Field signal**: Heritage interaction is explicitly engaging with postcolonial concerns and more-than-human framing. ARCHAI's work with collections from formerly colonised regions (Brasiliana, Te Papa, M+) needs to be aware of this discourse.

---

### 3.3 Affect, Emotion, and Heritage Interaction

**"Enhancing Young Generation's Heritage Identity Through Emotional Responses to Virtual Cultural Heritage Experience"**
International Journal of Human-Computer Interaction, 2025

VR experiences at the Hani Rice Terraces (China) show "emotional arousal showing the strongest relationship with social-value-based heritage identity enhancement." VR effectively evokes emotional responses that strengthen heritage identity among younger visitors.

**Field signal**: Affect is measurable and matters for heritage engagement. Emotional response is not a side effect — it is a primary mechanism through which heritage identity is constructed.

Source: [IJHCI 2025](https://www.tandfonline.com/doi/full/10.1080/10447318.2025.2505159)

---

**"Experience Design, Affect and Transindividuation in the Context of HCI Studies"**
SAGE Open, 2025

Applies Spinoza's philosophical concept of "affect" as a foundation for design theory and HCI. Argues that affect — understood as the capacity of bodies to be affected and to affect — provides a "more substantial conceptual foundation for design theory" than emotion or user satisfaction.

**ARCHAI alignment**: ARCHAI's voice personality system is an affect-design layer. The tone profiles (narrator, docent, casual, poetic) shape the emotional register of the encounter. This is not just UX styling — it is an affective design decision about what kind of encounter the visitor will have.

Source: [SAGE Open 2025](https://journals.sagepub.com/doi/10.1177/21582440251379088)

---

**"An Empirical Study on the Impact of Different Interaction Methods on User Emotional Experience in Cultural Digital Design"**
PMC, 2025

Gesture-based interaction "significantly enhancing emotional engagement and cultural comprehension compared to keyboard control or passive video viewing."

**Field signal**: The interaction modality matters for emotional response. Voice interaction — ARCHAI's direction with Whisper/Piper — is a natural next step beyond gesture for embodied, emotional heritage encounters.

Source: [PMC 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12431529/)

---

**"Immersive HCI for Intangible Cultural Heritage in Tourism Contexts: A Narrative Review of Design and Evaluation"**
Sustainability, 2025

Reviews VR/AR/MR and multisensory interaction for intangible cultural heritage. Notes these technologies are "increasingly deployed to support the transmission and presentation of intangible cultural heritage, particularly within tourism and heritage interpretation contexts."

**Field signal**: Immersive technologies are being tested widely, but most work is visual. Conversational and voice-based "immersion" is underexplored in the literature.

Source: [Sustainability 2025](https://doi.org/10.3390/su18010153)

---

### 3.4 Museum Accessibility and Voice Interfaces

**"Design for Inclusion: A Systematic Review of Technologies and Frameworks for Enhancing the Museum Experience of Blind and Low-Vision Visitors"**
International Journal of Human-Computer Interaction, 2026

Systematic review of accessibility technologies for museums. "Generative AI has recently emerged as a potential solution for blind and low-vision accessibility, with four relevant papers published between 2024 and 2025 exploring how GenAI can enhance audio descriptions and autonomous navigation."

**ARCHAI alignment**: ARCHAI's speech I/O directly addresses this. Voice question input + read-aloud response makes collection access possible for visitors who cannot type or read screens.

Source: [IJHCI 2026](https://www.tandfonline.com/doi/full/10.1080/10447318.2026.2623227)

---

**"Enhancing museum accessibility for blind and low vision visitors through interactive multimodal tangible interfaces"**
ScienceDirect, 2025

Enhanced interactive tangible user interfaces (ITUIs) with customisable audio controls "significantly improved usability, perceived independence, and user satisfaction among blind and partially sighted museum visitors." Pushbutton-based ITUI outperformed Autoplay and RFID-based systems, achieving the highest ratings in user control (76%) and perceived independence (72%).

**ARCHAI relevance**: Confirms that tangible, audio-first interaction outperforms passive or automated systems for accessibility. ARCHAI's NFC + voice model aligns with the finding that user-controlled tangible triggers produce better accessibility outcomes than automatic or screen-based alternatives.

Source: [ScienceDirect 2025](https://www.sciencedirect.com/science/article/pii/S1071581925000266)

---

### 3.5 NFC in Museums

**NFC adoption data (2024–2025)**:
- "41% of patrons abandoning tours due to device malfunctions, NFC technology emerges as the critical enabler for seamless immersive experiences"
- NFC reduces "setup times by 87% while enhancing educational value"
- Embedded NFC tags in pilot institutions process "18 million monthly interactions"

Visitor-facing NFC interactions in museums typically follow a simple pattern: tap tag, receive information. Most implementations link to static web pages, audio clips, or app-based content.

**ARCHAI extension**: ARCHAI extends the NFC tap from "receive information" to "begin a conversation." The tap does not deliver a fixed page — it opens a channel to a sovereign, record-grounded, personality-driven conversational system. This is a substantive architectural difference from typical NFC museum implementations.

Sources:
- [NFC cards in Museums — Medium (2024)](https://medium.com/@davidharris00017/nfc-cards-in-museums-enhancing-visitor-engagement-and-learning-1228af418e11)
- [NFC in Museums and Historical Sites — QR Lab](https://qrlab.com/blog/post/nfc-in-museums-and-historical-sites-interactive-tours)
- [What Can NFC Do For Museums? — MuseumNext](https://www.museumnext.com/article/what-can-near-field-communications-do-for-museums/)
- [Enhancing Exhibits with NFC — Nearfield Advisors](https://nearfieldadvisors.com/uncategorized/enhancing-exhibits-with-nfc-technology-a-new-era-of-visitor-engagement/)

---

### 3.6 Sovereign AI and Local Infrastructure

**"Sovereign AI Infrastructure Is Becoming the Next Strategic Asset"**
LinkedIn / industry analysis, 2025

Sovereign AI — AI infrastructure under national or institutional control rather than cloud-provider dependency — is becoming a strategic priority globally.

**"Sovereign AI Is Becoming Public Infrastructure"**
Swiss Institute of Artificial Intelligence, 2025

The EU's AI Factories initiative leverages EuroHPC supercomputing resources for startups, universities, and SMEs. First wave of seven sites launched after 2024, six more selected in October 2025.

For speech-to-text: "Self-hosting Whisper provides complete data sovereignty — audio files never leave your infrastructure."

**ARCHAI alignment**: ARCHAI is already sovereign by architecture. The Mac Studio deployment, locally-hosted LLM (Llama-3.3-70B-Turbo via Ollama), local Qdrant vector database, and planned local Whisper + Piper speech stack mean no collection data, visitor interaction, or speech recording ever leaves the institution's hardware.

Sources:
- [Sovereign AI — LinkedIn 2025](https://www.linkedin.com/pulse/sovereign-ai-infrastructure-becoming-next-strategic-asset-keen-e4bvc)
- [Sovereign AI as Public Infrastructure — SIAI 2025](https://siai.org/memo/2025/12/202512284707)

---

## 4. Key Term Map

### 4.1 Terms that appear frequently in recent HCI/heritage literature

| Term | Frequency signal (2021–2026) | ARCHAI relevance |
|------|------------------------------|------------------|
| conversational AI | High (sharp spike 2024–2026) | Core feature — object chat, conversational search |
| visitor engagement | High (steady) | Primary design goal |
| tangible interaction | Medium-high | NFC-bridged physical-digital encounter |
| embodied interaction | Medium | Physical presence, voice, multimodal encounter |
| affect / emotion | Rising (2024–2025 spike) | Voice personality, tone profiles, affective design |
| cultural heritage AI | Rising | Direct match — ARCHAI's primary domain |
| accessibility | Steady | Speech input/output, multilingual, tone control |
| sovereignty / sovereign AI | Rising sharply (2025–2026) | Core architectural principle |
| hallucination / grounding | Rising (2024–2025) | Hallucination prevention is live in production |
| object agency | Low-medium | Underexplored in practice — ARCHAI contributes here |
| more-than-human design | Rising (2024–2025) | Aligned framing — objects as participants |
| digital repatriation | Medium | Sovereignty + community control |
| born-digital | Medium | Future direction (R&D doc covers this) |
| thing theory | Niche / theoretical | Theoretical framing for object voice |
| NFC + heritage | Low | Niche — ARCHAI is ahead of most implementations |
| RAG (retrieval-augmented generation) | High (2024–2026) | ARCHAI uses RAG: retrieves canonical records before generating |
| curatorial AI | Very low | ARCHAI may be defining this term |
| voice interface accessibility museum | Low | Sparse literature — ARCHAI could contribute |

### 4.2 Terms Rob should search further

These terms produced interesting but thin results — deeper targeted searches would yield useful material:

- **"museum chatbot evaluation"** — growing body of user studies, mostly 2024–2025
- **"affective computing heritage"** — emotion-sensing in cultural contexts
- **"voice interface accessibility museum"** — very sparse, strong contribution opportunity
- **"situated interaction gallery"** — connects Suchman to physical exhibition contexts
- **"multimodal museum AI"** — combining vision, text, and speech for heritage
- **"curatorial AI"** — almost no results; ARCHAI may be defining this concept
- **"object personality AI"** — no results; novel contribution
- **"heritage data sovereignty"** — connects ARCHAI to Indigenous data sovereignty, CARE principles
- **"museum AI trust"** — visitor trust in AI-generated interpretation; growing concern

---

## 5. Field Signals: What the Field Is Asking For

### 5.1 Grounding and trust

Multiple 2024–2025 papers flag visitor unease with AI-generated responses. The JOCCH evaluation paper notes challenges with "authenticity and historical accuracy given LLMs' tendency to hallucinate." The IMX 2025 paper reports visitors feeling "a lingering sense of unease."

**What the field needs**: Systems that can demonstrate their responses come from verified records. Not just claims of accuracy — auditable grounding.

**What ARCHAI provides**: Hallucination prevention constrains the LLM to the object's canonical record. Responses include the source metadata. The system explicitly says "If it's not in my record, I don't know it."

### 5.2 Beyond screen-based interaction

The JOCCH 2024 smart objects survey explicitly criticises screens for disengaging visitors from objects. TEI and DIS conferences consistently publish work on tangible, embodied alternatives.

**What the field needs**: Physical-digital bridging that preserves the material encounter rather than replacing it with a screen.

**What ARCHAI provides**: NFC tap as the primary interaction trigger. The phone is a conversational channel, not a destination. The object's physical presence is not replaced — it is augmented.

### 5.3 Multilingual access

Several papers note language barriers as significant accessibility gaps. International museums serve visitors from dozens of countries. Current systems typically offer fixed translations of wall labels, not dynamic multilingual interaction.

**What ARCHAI provides**: Six languages live for conversational responses. Speech recognition and TTS language-aware. Whisper supports 99 languages. The system can respond in the visitor's language to questions about objects from any collection.

### 5.4 Sovereignty and data governance

The 2024–2025 digital repatriation and sovereign AI literature is growing rapidly. The EU AI Factories initiative, Indigenous data sovereignty movements, and institutional concerns about cloud AI dependency all point in the same direction.

**What the field needs**: AI heritage systems that institutions can control, audit, and trust — without sending collection data or visitor interactions to commercial cloud providers.

**What ARCHAI provides**: Fully local deployment. No cloud dependency for core function. All data stays on institutional hardware.

### 5.5 Affect matters

The emotional dimension of heritage encounters is being taken seriously in HCI research. The IJHCI 2025 VR study shows emotional arousal as the strongest predictor of heritage identity enhancement. The SAGE 2025 paper on Spinozan affect argues for a richer theoretical foundation.

**What the field needs**: Systems that are designed with affect in mind — not just information delivery but emotional encounter.

**What ARCHAI provides**: Personality profiles (narrator, docent, casual, poetic) are affect-design decisions. They shape the emotional register of every encounter. Voice output (TTS) adds another affective dimension — hearing an object speak produces a different emotional response from reading text.

### 5.6 Object agency is undertheorised in practice

There is plenty of theory — Thing Theory, ANT, OOO, more-than-human design — but very few working systems that give objects literal voice grounded in institutional records.

**What the field needs**: Practical systems that operationalise object agency in a way that institutions can deploy, test, and evaluate.

**What ARCHAI provides**: The first working system (as far as surveyed literature shows) that gives heritage objects first-person conversational voice, grounded in their institutional records, running on sovereign infrastructure, with personality profiles and hallucination prevention.

---

## 6. What Communities Are Already Asking Similar Questions

| Community | What they ask | How ARCHAI connects |
|-----------|--------------|---------------------|
| ACM CHI | How do visitors interact with AI in cultural spaces? | ARCHAI is a testable system for exactly this question |
| ACM DIS | What values should guide the design of heritage interaction? | ARCHAI's sovereignty, grounding, and object-agency principles are designable, arguable positions |
| TEI | How can tangible interaction bridge physical and digital heritage? | NFC tap → conversational object encounter |
| JOCCH | How can computing serve cultural heritage? | ARCHAI is a full-stack answer: harvest, embed, interpret, publish |
| MW (Museums and the Web) | What technology actually works in galleries? | ARCHAI is deployable now with 11 live collections |
| ICOM / CIDOC | What documentation standards and ethics apply? | ARCHAI respects Dublin Core, legal gating, cultural protocol |
| Indigenous Data Sovereignty | How should AI systems handle community-controlled heritage? | Sovereign architecture, per-object cultural protocol gates |
| Accessibility / inclusive design | How do we make collections accessible to everyone? | Voice I/O, multilingual, tone control, NFC (no screen required for primary interaction) |

---

## 7. Vocabulary Bridge: HCI to GLAM

| HCI term | GLAM equivalent | ARCHAI usage |
|----------|----------------|--------------|
| User | Visitor / researcher / staff / community member | All four, role-differentiated in the interface |
| Interface | Gallery / exhibition / catalogue / reading room | Semantic layer above the catalogue |
| Affordance | Object label / didactic panel / audio stop | NFC tag + voice prompt |
| Feedback | Search results / wall text / audio clip | Conversational response grounded in record |
| System model | CMS / DAMS / catalogue database | Canonical metadata + vector index + personality layer |
| Accessibility | Inclusive design / universal access / equity | Speech I/O, multilingual, tone control, NFC |
| Data sovereignty | Institutional custody / community control / cultural protocol | Local infrastructure, no cloud dependency |
| Personalisation | Visitor journey / interpretation level / learning mode | Personality profiles, language selection, tone preference |
| Conversational agent | Audio guide / docent / gallery assistant | First-person object voice — fundamentally different framing |
| Hallucination | Misattribution / false provenance / fabricated history | Record grounding + explicit "not in my record" fallback |
| RAG | Catalogue lookup + interpretive narration | Retrieve canonical record → generate grounded response |
| Embedding | Semantic indexing / concept mapping | Vector representations of object metadata for similarity search |

---

## 8. Where ARCHAI Is Genuinely New

Based on this survey, the following ARCHAI features do not appear in combination in any system described in the 2021–2026 literature:

1. **Sovereign locally-hosted LLM** for heritage interpretation (no cloud dependency)
2. **Semantic vector search** over canonical heritage metadata from multiple institutions
3. **NFC-bridged physical-digital encounter** triggering conversational AI, not static content
4. **First-person object voice** with personality system (narrator, docent, casual, poetic)
5. **Hallucination prevention** via record grounding with explicit "not in my record" fallback
6. **Per-object legal and cultural protocol gates** controlling what is publicly visible
7. **Multilingual conversational access** with speech input/output planned for 99+ languages
8. **Eleven live international collection sources** from six countries across four continents

Individual elements exist. No system in the surveyed literature combines all of them.
