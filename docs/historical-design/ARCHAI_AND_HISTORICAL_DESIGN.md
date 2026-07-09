# ARCHAI and Historical Design Principles

**Author**: Rob Graham
**Context**: RMIT Design PhD — supervised by Chris Barker
**Last updated**: 2026-06-05
**Status**: Working research document — literature review draft material

---

## 1. Why This Document Exists

This document addresses a foundational question for the ARCHAI PhD:

> What are the historical design principles that have shaped human-computer interaction, and how does ARCHAI — as a sovereign, AI-mediated cultural heritage system — contribute to, extend, or challenge those principles?

The aim is not a textbook survey. It is a situated analysis that maps ARCHAI's specific design decisions against the intellectual traditions they draw from and diverge from. Each section covers the principle, its original framing, how it has been applied in heritage and cultural contexts, and where ARCHAI's architecture creates new ground.

---

## 2. Shneiderman — Direct Manipulation and the Eight Golden Rules

### 2.1 Original Framing

Ben Shneiderman's work on direct manipulation interfaces (1982) and his Eight Golden Rules of Interface Design (1985, refined through the 2020s) established a dominant paradigm for usability-centred design. The Eight Golden Rules are:

1. **Strive for consistency** — consistent sequences of actions in similar situations; identical terminology in prompts, menus, and help screens; consistent commands throughout.
2. **Seek universal usability** — recognise the needs of diverse users, from novice to expert, across ages, disabilities, and cultures.
3. **Offer informative feedback** — for every user action, the system should provide clear feedback.
4. **Design dialogs to yield closure** — sequences of actions should be organised into groups with a clear beginning, middle, and end, providing the user with a sense of accomplishment.
5. **Prevent errors** — design the system so that users cannot make serious errors; if an error is made, offer simple, constructive instructions for recovery.
6. **Permit easy reversal of actions** — actions should be reversible wherever possible, relieving anxiety and encouraging exploration.
7. **Keep users in control** — experienced users want to feel in charge of the interface and that the system responds to their actions.
8. **Reduce short-term memory load** — the limitation of human information processing in short-term memory means interfaces should avoid requiring users to remember information from one display to another.

Shneiderman's 1982 cognitive analysis of direct manipulation established three core principles: (1) continuous representation of the objects and actions of interest, (2) rapid, incremental, and reversible actions, and (3) physical actions and gestures to replace typed commands. These principles, derived from experience and refined over three decades, "require validation and tuning for specific design domains" (Shneiderman, in IxDF).

Sources:
- Shneiderman, B. (1982). The future of interactive systems and the emergence of direct manipulation. *Behaviour and Information Technology*, 1(3), 237–256.
- Shneiderman, B. (1987/2016). *Designing the User Interface*. Pearson.
- [Shneiderman's Eight Golden Rules — IxDF](https://ixdf.org/literature/article/shneiderman-s-eight-golden-rules-will-help-you-design-better-interfaces)
- [Shneiderman's Eight Golden Rules — GeeksforGeeks](https://www.geeksforgeeks.org/ben-shneiderman-eight-golden-rules-of-interface-design-human-computer-interaction/)

### 2.2 Application in Heritage and Museum Contexts

Most museum digital interfaces follow Shneiderman's principles closely, often without attribution. Collection search interfaces, touchscreen kiosks, and interactive gallery displays prioritise consistency (uniform search patterns), informative feedback (result counts, loading states), and error prevention (guided search, autocomplete). The 2025 Museum Kiosk Guide emphasises that museum kiosks should "allow users to click an audio button to hear text read aloud" and support "voiceover and image descriptions" — direct applications of rules 2 (universal usability) and 3 (informative feedback).

However, museum kiosk interfaces have been criticised for being overly transactional. A 2024 survey of tangible and embodied interactions in museums (Caporusso et al., JOCCH) notes that "screen-based devices may disengage visitors from the objects, their materiality and the physicality of the visit." The implication is that strict adherence to Shneiderman's rules — especially the emphasis on user control and reversibility — may produce interfaces that feel more like databases than encounters with cultural heritage.

### 2.3 How ARCHAI Relates

ARCHAI honours several of Shneiderman's rules:

- **Consistency** (Rule 1): Every object in the system has a canonical metadata record with the same structural integrity, regardless of which of the eleven source institutions it came from. The conversational interface pattern is consistent across the main app and AUXIO visitor pages.
- **Universal usability** (Rule 2): Speech input/output for accessibility, multilingual support (six languages live, Whisper supports 99), tone controls (narrator, docent, casual, poetic) for different visitor needs.
- **Informative feedback** (Rule 3): Status messages during voice capture ("Listening...", "Question captured. Sending to ARCHAI..."), clear hallucination prevention notices, legal status indicators per object.
- **Closure** (Rule 4): The conversational turn — question, response, option to ask more — provides natural closure.
- **Reduce memory load** (Rule 8): The object's record is always visible alongside the conversation. Visitors do not need to remember what they learned from a wall label — the system holds it.

But ARCHAI deliberately challenges other rules:

- **Reversibility** (Rule 6): A conversation with an object is not reversible. You cannot "undo" an encounter. The interpretive response is generated in context and cannot be unsaid. This is philosophically intentional — heritage encounters are not transactions.
- **User control** (Rule 7): The visitor chooses their question, language, and tone, but they cannot control the interpretation. The object has its own voice, grounded in its record. The system is not a servant; it is a participant. This challenges the assumption that the user should always feel "in charge."
- **Error prevention** (Rule 5): ARCHAI's hallucination prevention system constrains the LLM to the object's record, but the system explicitly allows ambiguity and interpretive depth. A response that says "that's not in my record — but ask me about..." is not an error state. It is a designed conversational move.

### 2.4 Significance for the PhD

Shneiderman's rules remain the most widely taught HCI principles. ARCHAI's selective adherence and deliberate divergence is a designable, arguable position — not carelessness. The PhD should articulate why reversibility and user control are insufficient principles for heritage interpretation systems, and what alternative principles (such as curatorial authority, object agency, and situated interpretation) might replace them.

---

## 3. Norman — Affordances, Signifiers, and Conceptual Models

### 3.1 Original Framing

Don Norman's *The Design of Everyday Things* (1988, revised 2013) introduced a set of fundamental psychological concepts for interface design:

- **Affordances**: the relationship between a physical object's properties and an agent's capabilities, determining how an object could possibly be used. Affordances exist whether or not they are perceived.
- **Signifiers**: perceptible signals of what can be done. "Signifiers are of far more importance to designers than are affordances" (Norman). A signifier communicates where and how to act.
- **Constraints**: physical, logical, semantic, and cultural limitations that guide action.
- **Mappings**: the relationship between controls and their effects. Good mapping makes the relationship between control and outcome feel natural.
- **Feedback**: communication about results of actions. Feedback must be immediate, informative, and proportional.
- **Conceptual models**: the user's understanding of how a system works. "The design model must be mapped to the system image, the users must be able to map their mental model(s) to the system" (Norman). "It is the conceptual model that provides true understanding."

Norman's framework assumes that good design makes the purpose, operation, and state of a system visible and comprehensible. Discoverability — the ability to figure out what actions are possible and how to perform them — is a core goal.

Sources:
- Norman, D.A. (1988/2013). *The Design of Everyday Things*. Basic Books.
- [All about affordance and signifier — UX Planet](https://uxplanet.org/all-about-affordance-and-signifier-terms-by-don-norman-the-ux-pioneer-e0ea7b9b99f5)
- [What are Affordances? — IxDF (2026)](https://ixdf.org/literature/topics/affordances)

### 3.2 Application in Heritage and Museum Contexts

Museum interfaces typically follow Norman's principles through:

- **Affordances**: touchscreens afford tapping; physical buttons on audio guides afford pressing; QR codes afford scanning.
- **Signifiers**: labels saying "Touch to explore," icons indicating audio availability, arrows indicating scroll direction.
- **Feedback**: loading indicators, search result counts, playback progress bars.
- **Conceptual models**: the dominant conceptual model for museum digital interfaces is the database — "search, filter, display." Visitors understand they are querying a catalogue.

The limitation of this model in heritage contexts is that it treats objects as data to be retrieved, not as things to be encountered. The conceptual model of the database is powerful for researchers but may flatten the experiential richness of a gallery visit.

### 3.3 How ARCHAI Relates

ARCHAI reframes Norman's principles for heritage interpretation:

- **Affordance**: The NFC tag is a direct physical affordance. Tap the tag, meet the object. No menus, no search required, no intermediary navigation. The tap is the affordance. On AUXIO visitor pages, the chat input and voice buttons afford asking and speaking.
- **Signifiers**: The "Start Voice Question" button is a signifier. The "Speech Demo" label signals the available interaction mode. On NFC pages, the object's title and image signal that this is a specific, identifiable cultural object that can be spoken to.
- **Feedback**: Status messages during voice capture ("Listening...", "Question captured. Sending to ARCHAI...") provide immediate feedback. The conversational response is itself feedback — but it is interpretive feedback, not transactional.
- **Conceptual model**: This is where ARCHAI most significantly departs from Norman. The visitor's conceptual model is: "I am talking to this object." But the actual system is a semantic search layer over canonical records, with an LLM generating first-person responses grounded in verified metadata, with hallucination prevention constraining outputs. The gap between the visitor's model ("I'm having a conversation with a vase") and the system's reality ("I'm querying a vector database and prompting a language model") is a design research question, not a bug. The PhD should address how this gap is managed — through transparency (the system says "responses are grounded in verified collection metadata"), through trust (hallucination prevention is active), and through framing (the object's personality is grounded in its documented record, not in fabrication).

### 3.4 Significance for the PhD

Norman's conceptual model principle is particularly important for ARCHAI because the system deliberately creates a productive fiction — the object speaks. The visitor's mental model is simpler and more emotionally engaging than the technical reality. The design challenge is maintaining trust (the visitor should feel the responses are grounded) while preserving the experiential quality (the visitor should feel they are in a conversation, not querying a database). This tension is not resolved by Norman's framework, which assumes the goal is to make the system's operation transparent. ARCHAI suggests that in heritage contexts, partial opacity may be desirable — the visitor does not need to understand vector search to have a meaningful encounter with an object.

---

## 4. Dourish — Embodied Interaction

### 4.1 Original Framing

Paul Dourish's *Where the Action Is: The Foundations of Embodied Interaction* (MIT Press, 2001) established embodied interaction as "an approach to interacting with software systems that emphasizes skilled, engaged practice rather than disembodied rationality." Drawing on the phenomenological tradition — particularly Martin Heidegger and Maurice Merleau-Ponty — Dourish argues that meaning emerges from engagement with the world, not from abstract internal representation.

Key principles from Dourish:

- **The primacy of practice**: "the primacy of natural practice over abstract cognition in everyday activity." People do not interact with systems by constructing mental models first; they engage through embodied, situated practice.
- **Tangible and social computing share a foundation**: both "move towards a better fit with everyday human activity, understanding and interaction." Tangible computing "attempts to capitalise on our physical skills and our familiarity with real world objects" and "tries to make computation manifest to us in the world in the same way as we encounter other phenomena."
- **Meaning through encounter**: an embodied approach must "bring the meaning of things into the things themselves — thereby enabling a user to derive the meaning of something from the interaction with it, for example, via its appearance that signals some properties indicating how to use it."
- **Ontology as emergent**: Dourish "echoes Heidegger's notion of ontology as a dynamic phenomenon emergent from participative practice." Objects are not pre-given with fixed meanings; their significance arises through use, context, and engagement.

Merleau-Ponty's phenomenology of perception extends this further: in 2001, Dourish proposed embodied interaction as "a new paradigm for interaction design focusing on physical, bodily, and social aspects of interaction with digital technology." The body is not separate from cognition — perception, action, and understanding are unified in embodied experience.

Sources:
- Dourish, P. (2001). *Where the Action Is: The Foundations of Embodied Interaction*. MIT Press.
- [Dourish — Embodied Interaction (1999 working paper)](https://www.dourish.com/embodied/embodied99.pdf)
- [Dourish — Design Principles for Embodied Interaction](https://www.researchgate.net/publication/221562324_Design_Principles_for_Embodied_Interaction_The_Case_of_Ubiquitous_Computing)
- [Interaction design for and with the lived body — ACM TOCHI 2013](https://dl.acm.org/doi/abs/10.1145/2442106.2442114)

### 4.2 Application in Heritage and Museum Contexts

Embodied interaction has been extensively explored in museum and heritage contexts. The 2024 ACM Journal on Computing and Cultural Heritage survey, "Smart Objects and Replicas: A Survey of Tangible and Embodied Interactions in Museums and Cultural Heritage Sites" (Caporusso et al.), provides the most comprehensive recent overview. Key findings:

- "Since the early 2000s, tangible and embodied interactions have been applied and researched in cultural heritage and museums, in an attempt to overcome issues induced by screen-based devices that may disengage visitors from the objects, their materiality and the physicality of the visit."
- The survey analyses "the agency of tangible and embodied interaction systems applied to cultural heritage and the role of design in shaping the expected behaviour of users."
- Smart objects — physical replicas or enhanced originals with embedded sensors and computation — are identified as the most promising approach for maintaining the connection between visitors and material heritage.

Research in related venues:
- **TEI 2025** (Bordeaux): "Natureculture Probes: Opening up dialogues in natural heritage(s) landscapes" — design probes applied to heritage landscapes with more-than-human framing.
- **TEI 2024** (Cork): "Sensing Bodies: Engaging Postcolonial Histories through More-than-Human Interactions" — embodied interaction with postcolonial heritage objects.
- **NFCSense** (CHI 2021): data-defined rich-ID motion sensing for tangible interaction using commodity NFC readers, demonstrating that NFC can support rich embodied interaction beyond simple tag reading.
- **NFCStack** (UIST 2022): physical building blocks supporting stacking and frictionless interaction based on NFC, extending tangible computing toward more complex spatial interactions.

### 4.3 How ARCHAI Relates

ARCHAI operationalises Dourish's embodied interaction in a heritage context more directly than most systems in the literature:

1. **Physical encounter first**: The visitor is standing in front of the object. The NFC tag bridges the physical and digital without removing the visitor from the physical space. There is no separate screen to look at instead of the object — the phone becomes a conversational channel, not a replacement for looking.

2. **Meaning through interaction**: The object's meaning is not pre-given in a wall label or catalogue entry. It emerges through the conversation. The same object responds differently to different questions. The visitor derives meaning "from the interaction with it" — precisely Dourish's formulation.

3. **Tangible computing**: NFC bridging is a form of tangible computing. The tap is a physical gesture that invokes digital response. The phone is a tangible intermediary, not an abstract interface.

4. **Ontology as emergent**: The object's identity in the system is not fixed. Its personality profile (narrator, docent, casual, poetic) and the visitor's choice of language and tone shape each encounter differently. The object's ontology — what it is and what it means — is dynamically constituted through practice.

5. **The body matters**: Voice interaction adds another embodied dimension. The visitor speaks; the system listens. The response is read aloud. Sound, space, and physical presence are all part of the interaction. This is not a text-only database query — it is an embodied, multimodal encounter.

### 4.4 Significance for the PhD

Dourish is likely the most important theoretical anchor for ARCHAI's interaction model. The PhD should argue that ARCHAI extends embodied interaction from physical manipulation (Dourish's original examples — tangible tokens, spatial displays) to conversational encounter. The object is not manipulated; it is addressed. The visitor does not control the object; they engage with it. This is a shift from embodied manipulation to embodied dialogue — a contribution that, as far as the current literature surveyed shows, has not been articulated in these terms before.

---

## 5. Suchman — Situated Action

### 5.1 Original Framing

Lucy Suchman's *Plans and Situated Actions: The Problem of Human-Machine Communication* (1987, revised 2007 as *Human-Machine Reconfigurations*) argued that human action is fundamentally situated — shaped by the material and social circumstances of the moment, not by pre-formed internal plans.

Suchman's central argument: "the planning model of interaction favoured by the majority of AI researchers does not take sufficient account of the situatedness of most human social behaviour." Plans are not the primary mechanism of action; they are post-hoc rationalisations or loose resources for action, not scripts that determine behaviour.

Suchman demonstrated this through careful analysis of recorded interactions between novice users and an "intelligent" photocopier. The machine's design assumed users would follow planned sequences; in practice, users improvised, adapted, and relied on contextual cues that the machine could not recognise. Suchman's analysis "merges cognitive science with anthropological insights, highlighting the importance of situated action in AI."

The 2007 revision, *Human-Machine Reconfigurations*, extended the analysis to contemporary concerns about agency, accountability, and the politics of human-machine boundaries.

Sources:
- Suchman, L.A. (1987). *Plans and Situated Actions: The Problem of Human-Machine Communication*. Cambridge University Press.
- Suchman, L.A. (2007). *Human-Machine Reconfigurations: Plans and Situated Actions* (2nd ed.). Cambridge University Press.
- [Plans and Situated Actions — ACM Digital Library](https://dl.acm.org/doi/10.5555/38407)
- [Human-Machine Reconfigurations — ACM Digital Library](https://dl.acm.org/doi/10.5555/1212951)

### 5.2 Application in Heritage and Museum Contexts

Traditional museum audio guides are planned systems in Suchman's sense — they assume a linear path through the gallery, with predetermined content triggered by numbered stops. Visitors are expected to follow the plan. In practice, visitors wander, skip exhibits, return to favourites, overhear other visitors' guides, and adapt their path to the social and spatial context of the visit.

Interactive kiosks partially address this by allowing non-linear browsing, but they still assume a search-retrieve-display interaction pattern. The "plan" is implicit: the visitor has a question, searches for it, reads the answer.

Conversational AI introduces a fundamental shift. An LLM-driven conversation is inherently situated — the response depends on the question, which depends on what the visitor noticed, which depends on where they are standing, what they just saw, who they are with, and what they are curious about in that moment. This is Suchman's situated action, not planned retrieval.

### 5.3 How ARCHAI Relates

Every conversation between a visitor and an ARCHAI object is situated in Suchman's sense:

1. **No predetermined script**: The object does not have a set speech to deliver. Its responses are generated from its record in response to the visitor's question. The same object will say different things to different visitors asking different questions.

2. **Context shapes the encounter**: The visitor's chosen language, tone preference, and the specific question they ask all shape the response. A Portuguese-speaking visitor asking about materials in casual mode will get a fundamentally different response from an English-speaking researcher in narrator mode asking about provenance.

3. **Improvisation within constraints**: The LLM generates responses within the constraints of the hallucination prevention system (must stay grounded in the record) and the personality profile (tone, sentence limits, curatorial voice). But within those constraints, each response is improvised — generated fresh, not retrieved from a cache.

4. **The visitor's action is situated too**: The visitor did not plan to ask that specific question before entering the gallery. They are responding to the object's physical presence, its visual qualities, what the wall label says or doesn't say, what another visitor just said, whether their child is tugging their sleeve. ARCHAI's conversational interface accommodates this because it accepts any question, not just pre-mapped queries.

### 5.4 Significance for the PhD

Suchman's framework helps articulate why ARCHAI is not an audio guide and not a chatbot. It is a situated interpretation system — one that responds to the circumstantial reality of a visitor's encounter with an object. The PhD should use Suchman to argue that heritage interpretation cannot be planned in advance; it must be generated in the moment, from verified data, in response to situated human curiosity. ARCHAI is designed to do exactly this.

---

## 6. Thing Theory, Object Agency, and Actor-Network Theory

### 6.1 Thing Theory — Bill Brown

Bill Brown's Thing Theory (developed from his 2001 essay "Thing Theory" in *Critical Inquiry* and extended through *Other Things*, 2015) examines how objects operate beyond human-centred frameworks. The field focuses on "the interconnectedness of objects, their modes of being and irreducible 'thingness', as well as the agency objects are shown to exert when freed from the constraints of a subject-centred perspective" (Tereszewski, 2024).

Brown draws on Heidegger's interrogation of the ontology of things and distinguishes between "objects" (things we use instrumentally, which recede from consciousness) and "things" (objects that assert themselves — when they break, surprise us, or resist our intentions). Around 2010, a second phase of thing theory emerged, with scholars "seeking to decenter the human subject in their materialist studies."

Brown distinguishes his position from Object-Oriented Ontology (OOO — Harman, Morton, Bogost) and New Materialism (Barad, Bennett) by maintaining attention to subject-object relations rather than eliminating the human subject entirely. He "describes his work in terms of the ontical and draws heavily from the work of object-oriented ontologists, speculative realists, and the French science studies scholar Bruno Latour" but critiques them for "neglect of the human subject."

Sources:
- Brown, B. (2001). Thing Theory. *Critical Inquiry*, 28(1), 1–22.
- Brown, B. (2015). *Other Things*. University of Chicago Press.
- [Bill Brown's Thing Theory — Objects & Things](https://objectsandthings.wordpress.com/2010/02/07/bill-browns-thing-theory/)
- [Thing Theory — Oxford Bibliographies](https://www.oxfordbibliographies.com/display/document/obo-9780190221911/obo-9780190221911-0097.xml)
- [Tereszewski (2024) — Thing Theory in Ballard and Bradbury](https://onlinelibrary.wiley.com/doi/10.1111/oli.12440)

### 6.2 Actor-Network Theory — Bruno Latour

Bruno Latour's Actor-Network Theory (developed with Michel Callon and John Law from the 1980s) challenges the idea that only humans have agency. Latour argues that objects are "actants" — participants in shaping events and outcomes. He "often used the term 'actant' to avoid the human-centric connotations of the word 'actor', providing a more neutral way of describing how different elements of a system interact."

ANT assumes "human and non-human actors co-act in dynamic networks" — meaning that a museum object, a display case, a wall label, a lighting rig, a visitor's phone, and a conversational AI system are all actants in the network that produces a heritage encounter.

Recent scholarship (2023–2024) applies ANT to digital tools in social design, examining "how memory, mediation, and interpretation work together as a process of meaning-making in cultural heritage" through Latourian concepts.

Sources:
- Latour, B. (2005). *Reassembling the Social: An Introduction to Actor-Network-Theory*. Oxford University Press.
- [Latour's Actor Network Theory — Simply Psychology](https://www.simplypsychology.org/actor-network-theory.html)
- [Using ANT to revisit the digitalized tool in social design (2023)](https://www.tandfonline.com/doi/full/10.1080/14606925.2023.2279836)

### 6.3 How ARCHAI Relates

ARCHAI operationalises both Thing Theory and ANT in a working system:

1. **Objects as things, not data**: In most museum digital systems, objects are data rows — title, date, medium, image. In ARCHAI, objects are things with voice, personality, and the capacity to respond. They resist being reduced to catalogue entries by speaking from their own position.

2. **Literal voice**: ARCHAI gives objects literal first-person voice. This is not a metaphor. The LLM generates speech grounded in the object's institutional record, framed through a personality profile that gives each object a distinct manner of speaking. A 16th-century Portuguese navigational chart speaks differently from a 1920s Australian landscape painting — not because the system is scripted, but because the personality system and record data shape distinct voices.

3. **Objects as actants**: In ANT terms, the object in ARCHAI is an actant in the network of interpretation. It does not passively wait to be queried. Through its personality profile, record grounding, and the conversational interface, it actively shapes what the visitor learns, how they feel, and what they ask next. The object participates.

4. **Brown's distinction matters**: ARCHAI sits with Brown rather than with pure OOO. The system does not eliminate the human subject — the visitor is essential. The encounter is relational. But the object has genuine agency within the encounter, constrained by its documented record but not reducible to it.

### 6.4 Significance for the PhD

Thing Theory and ANT provide the strongest theoretical grounding for ARCHAI's most distinctive feature: object voice. The PhD should argue that ARCHAI is the first working system to operationalise Thing Theory in a heritage context — not as a thought experiment, but as a deployable, testable, institutionally-viable technical system. The distinction from pure OOO (ARCHAI preserves the human-object relationship, does not eliminate the human) and from simple chatbots (ARCHAI grounds responses in institutional records, not in generative hallucination) should be clearly articulated.

---

## 7. More-Than-Human Design

### 7.1 The Movement

More-than-human design is a growing design movement that "questions the human-centric lens that has defined Western design practice and embraces the idea that the flourishing of all species is interconnected." It extends beyond animal and ecological concerns to include objects, environments, systems, and non-human agencies of all kinds.

Key recent developments:

- **Design Museum London, 2025**: *More than Human* exhibition — a landmark institutional endorsement of more-than-human design thinking. Design Museum curators "pick five works that exemplify 'more-than-human' design" (Dezeen, 2025). The accompanying More than Human Symposium positions this as a defining design discourse.
- **Design Research Society, 2024**: "More-Than-Human Design in Practice" — a peer-reviewed paper examining practical applications of the framework.
- **Design+Posthumanism Network, 2024**: "A more-than-human design manifesto" — a collective statement of principles for post-anthropocentric design practice.
- **Routledge, 2024**: *Design For More-Than-Human Futures: Towards Post-Anthropocentric Worlding* (Tironi, Chilet, Marin, Hermansen) — an edited volume bringing together design research and posthumanist theory.
- **CHI 2022**: Extended Abstracts included more-than-human concepts, methodologies, and practices in HCI.
- **DIS 2024**: "Designing for Interdependence of Bees, Garden, Designer, and the Changing Season" — more-than-human design applied to ecological systems.

Sources:
- [More than Human — Design Museum London](https://designmuseum.org/whats-on/talks-courses-and-workshops/more-than-human-symposium)
- [Design Museum curators pick five works — Dezeen 2025](https://www.dezeen.com/2025/07/10/design-museum-more-than-human-curators-picks/)
- [More than Human shapes a vocabulary for ecological design — Stirworld 2025](https://www.stirworld.com/see-features-more-than-human-at-the-design-museum-shapes-a-vocabulary-for-ecological-design)
- [More-Than-Human Design in Practice — DRS 2024](https://dl.designresearchsociety.org/cgi/viewcontent.cgi?article=3527&context=drs-conference-papers)
- [A more-than-human design manifesto (2024)](https://designandposthumanism.org/2024/05/14/a-more-than-human-design-manifesto/)
- [Design For More-Than-Human Futures — Routledge 2024](https://www.routledge.com/Design-For-More-Than-Human-Futures-Towards-Post-Anthropocentric-Worlding/Tironi-Chilet-Marin-Hermansen/p/book/9781032334400)

### 7.2 How ARCHAI Relates

ARCHAI occupies a distinctive position within more-than-human design:

1. **Objects as participants, not passive displays**: ARCHAI does not claim objects are alive. But it does treat them as participants in a knowledge exchange, with their own voice, personality, and interpretive authority. This is a more-than-human design position applied to cultural heritage.

2. **The voice distinction matters**: The ARCHAI voice system deliberately distinguishes between four registers:
   - **Accessibility narration**: clear, factual read-aloud of object records for visitors who cannot read screens
   - **Curatorial interpretation**: informed, measured explanation grounded in institutional knowledge
   - **Public guide voice**: approachable, engaging narration for general audiences
   - **Performative / fictional object voice**: the object "speaking" in first person with personality and character

   These distinctions are a more-than-human design decision. They determine what kind of agency the object has in each context. An accessibility narrator is a tool; a first-person object voice is a participant.

3. **Not anthropomorphism**: More-than-human design is not about making non-humans seem human. ARCHAI's objects do not pretend to be people. They speak from their material reality — their medium, age, provenance, culture. A ceramic bowl speaks differently from a military uniform. The voice emerges from the object's documented qualities, not from a generic chatbot personality.

### 7.3 Significance for the PhD

More-than-human design provides the contemporary design-theory framing for ARCHAI's approach. The PhD should position ARCHAI as a practical contribution to more-than-human design in heritage contexts — demonstrating that it is possible to build working, institutional-quality systems that treat objects as more-than-passive-data without resorting to anthropomorphism or abandoning institutional accuracy.

---

## 8. Digital Repatriation and Data Sovereignty

### 8.1 The Discourse

Digital repatriation is "the practice of returning data and digital surrogates held by institutions — like museums, archives, and government entities — to Indigenous communities." Recent scholarship (2024–2025) has sharpened the discourse considerably:

- "True digital repatriation must prioritize the sovereignty of source communities over their digital and physical heritage" with "truly decolonial digital practices centering the sovereignty, authority, and cultural values of source communities" (Heritage Management Organisation, 2024).
- Successful projects like **Sipnuuk** (Karuk Tribe) demonstrate Indigenous-controlled digital archives that serve "cultural preservation, education, and intergenerational knowledge transfer" (MIT Solve, 2024).
- **Traditional Knowledge (TK) Labels** offer "community-based forms of copyright" that give Indigenous communities governance over how their cultural materials are described, accessed, and used (Local Contexts project).
- The **Indigenous Data Sovereignty** movement (2025) explicitly addresses AI: "AI supports repatriation of cultural artifacts and historical data, aids language revitalization through AI-powered transcription and translation, and automates metadata creation for more accurate and accessible archives." But it also warns about "algorithmic bias that can distort Indigenous narratives and extraction of data without proper consent."
- Critical perspectives note "the limits of digital repatriation in restitution debates" — digital copies do not resolve the question of physical return, and "the governance of digital instruments must be located under the jurisdiction of source communities" (Center for Art Law, 2025).

Sources:
- [Beyond Access: Rethinking Ownership, Justice, and Decolonization in Digital Repatriation (2024)](https://heritagemanagement.org/beyond-access-rethinking-ownership-justice-and-decolonization-in-digital-repatriation-initiatives/)
- [Against the Illusion: The Limits of Digital Repatriation (2025)](https://itsartlaw.org/art-law/against-the-illusion-the-limits-of-digital-repatriation-in-restitution-debates/)
- [Indigenous Futures in AI: From Language Sovereignty to Ecological Stewardship (2025)](https://icmagazine.org/indigenous-futures-in-artificial-intelligence-from-language-sovereignty-to-ecological-stewardship/)
- [Indigenous Data Sovereignty and AI — BCLA (2025)](https://bclaconnect.ca/wp-content/uploads/2025/11/Indigenous-Data-Sovereignty-and-AI-slides-2025.pdf)
- [Upholding Data Sovereignty in Indigenous Cultural Heritage — Terentia (2025)](https://terentia.io/blog/indigenous-data-sovereignty-cultural-heritage)
- [Supporting Cultural Rights through Archival Repatriation — PoLAR (2024)](https://polarjournal.org/2024/09/21/supporting-cultural-rights-and-indigenous-sovereignty-through-archival-repatriation/)

### 8.2 How ARCHAI Relates

ARCHAI's architectural decisions directly support digital repatriation principles:

1. **Sovereign infrastructure**: ARCHAI runs entirely on local hardware (Mac Studio). No collection data leaves the institution's network. No visitor interactions are sent to cloud services (the current browser speech demo sends audio to Google — the Whisper upgrade will eliminate this). This is sovereignty by architecture, not by policy.

2. **Per-object cultural protocol gates**: ARCHAI's legal and rights gating system operates per object. Objects with restricted cultural status can be excluded from public-facing interfaces (AUXIO) while remaining accessible to authorised staff. This supports community-controlled access without requiring the entire system to be locked down.

3. **Metadata governance**: ARCHAI preserves raw source records intact and builds canonical, display, and interpretive layers above them. This means the institution (or source community) retains the authoritative record. ARCHAI's interpretive layer is explicitly marked as derived — it does not claim to be the record itself.

4. **Multilingual access**: Whisper's 99-language support and ARCHAI's existing six-language conversational interface mean that source communities can interact with their own heritage materials in their own languages, not only in the language of the holding institution.

5. **Institutional control**: No cloud account is required. No data is shared with third parties. The institution controls what is harvested, what is public, what is restricted, and what is said about each object.

### 8.3 Significance for the PhD

The sovereign infrastructure argument is one of ARCHAI's strongest contributions. The PhD should frame sovereignty not as a technical convenience but as a design principle — a deliberate architectural decision that supports institutional autonomy, community control, and ethical data governance. In a landscape where most AI-driven heritage systems rely on cloud APIs (GPT, Claude, Gemini), ARCHAI's local-first design is a political and ethical position as much as a technical one.

---

## 9. Summary: ARCHAI's Position in the Field

ARCHAI is not a usability improvement to museum interfaces. It is a new kind of system that draws on and extends multiple traditions:

| Tradition | Key figure(s) | ARCHAI's contribution |
|-----------|--------------|----------------------|
| Direct manipulation / Eight Golden Rules | Shneiderman (1982/1985) | Selective adherence: consistency, feedback, memory reduction. Deliberate challenge: reversibility, user control. Heritage encounters are not transactions. |
| Affordances and conceptual models | Norman (1988/2013) | NFC tap as direct affordance. Productive fiction as conceptual model — the visitor talks to the object, the system queries a vector database. Trust through grounding, not through transparency of mechanism. |
| Embodied interaction | Dourish (2001) | NFC-bridged physical-digital encounter. Extension from embodied manipulation to embodied dialogue. Meaning emerges from situated, physical, multimodal encounter. |
| Situated action | Suchman (1987/2007) | Every conversation is situated. No predetermined script. Responses are generated in context, not retrieved from cache. Heritage interpretation cannot be planned in advance. |
| Thing Theory | Brown (2001/2015) | First working system to operationalise Thing Theory in heritage. Objects have literal voice, grounded in institutional records. Relational, not eliminative — the visitor matters. |
| Actor-Network Theory | Latour (1987/2005) | Objects are actants in the network of interpretation. The personality system gives each object distinct agency within the encounter. |
| More-than-human design | Design Museum (2025), DRS (2024) | Objects as participants, not passive displays. Four voice registers distinguish accessibility, interpretation, guide, and performative modes. Not anthropomorphism — voice from material reality. |
| Digital repatriation / sovereignty | Indigenous Data Sovereignty (2024–2025) | Local-first, institution-controlled infrastructure. Per-object cultural protocol gates. Multilingual access. Sovereignty by architecture, not by policy. |

### The combination that does not exist elsewhere

The following combination — sovereign locally-hosted LLM, semantic vector search over canonical heritage metadata, NFC-bridged physical-digital encounter, first-person object voice with personality system, hallucination prevention via record grounding, per-object legal and cultural protocol gates, multilingual conversational access with speech input/output — does not appear in any system described in the 2021–2026 HCI, heritage technology, or museum informatics literature surveyed for this document.

Individual elements exist:
- Conversational AI in museums (Wang et al. 2025, Su et al. 2025, Nikola Tesla chatbot)
- NFC in galleries (NFCSense 2021, various museum NFC implementations)
- Tangible interaction with heritage (JOCCH 2024 survey)
- Sovereign AI infrastructure (EU AI Factories, institutional self-hosting)
- Object agency in theory (Thing Theory, ANT, OOO)

But the integration of all of these — as a working, deployable, open-source system with eleven live international collection sources — is ARCHAI's specific contribution.
