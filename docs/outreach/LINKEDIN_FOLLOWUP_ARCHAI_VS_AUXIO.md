# LinkedIn Follow-Up — "AUX.IO is the doorway. ARCHAI is the building."

Drafted 2026-07 after the "What if culture could talk back?" post went viral. The
original post travelled well but the ARCHAI/AUX.IO distinction didn't land clearly.
Two deliverables here: (1) a **pinned comment** for the viral post itself, and
(2) a **follow-up post** to publish separately and convert the attention into the
full infrastructure story.

All figures verified against the repo as of June–July 2026 (README.md, white
paper v2). Update the numbers before posting if collections have grown.

---

## Pinned comment for the viral post (polished)

A few people have asked about the difference between ARCHAI and AUX.IO — here's
the short version.

ARCHAI is the professional platform — the inward-facing side for curators,
collections and exhibitions teams. It handles collection harvesting (currently
20 institutions across five continents), controlled-vocabulary tagging with a
built-in museum thesaurus (AAT, CHIN, LCSH and local terms), metadata
enrichment, interpretation and exhibition planning workspaces, and locally
hosted, evidence-grounded AI. Everything runs on hardware the institution owns
— no collection data goes to the cloud.

AUX.IO is the public interface — the outward-facing side for visitors and
communities. Scan a QR code or NFC tag and talk with an object in your own
language, with every response grounded in the museum's verified record. No
app, no account, no gatekeeper. And with curatorial review, what visitors
contribute can become part of the object's living record.

One platform helps museums build, manage and share knowledge.
The other helps communities discover, explore and contribute to it.

ARCHAI is the building. AUX.IO is the doorway.

### Accuracy notes on the pinned comment
- **"Built-in museum thesaurus"** — accurate: the vocab/thesaurus panel is a
  functional prototype with AAT, CHIN, LCSH, TGN and local ARCHAI terms
  (`docs/APP_FUNCTIONAL_AUDIT_2026-06-03.md`, `vocabProviderService.js`).
- **"AI-assisted exhibition and interpretation design"** (original wording) —
  slightly ahead of the build: what exists today is a prototype
  Project List / Selected Objects workspace for shortlists, interpretation
  drafts and exhibition planning (`ARCHAI_PROGRESS.md`), and README lists
  persistent project workspaces as an active development area. The polished
  version above says "interpretation and exhibition planning workspaces",
  which is defensible. Keep "AI-assisted … design" only if you're comfortable
  describing the roadmap rather than the current build.
- LinkedIn comments don't render markdown — the version above is plain text
  and paste-ready.

---

## Main post

The post that took off last week showed the smallest part of this project.

The poster on the wall, the QR code, the museum object you can talk to on your
phone — that's AUX.IO (*ARCHAI User eXperience: data In, data Out*). It's the
doorway. What most people didn't see is the building behind it.

That building is ARCHAI — sovereign semantic heritage infrastructure, built as
practice-based PhD research at RMIT School of Design.

Here's what's actually underneath every one of those posters:

🏛️ **20 live collections, 3,147+ records.** The Met, the V&A, the Rijksmuseum,
the Smithsonian, the Getty, Wellcome Collection, Museums Victoria, Te Papa,
M+ Hong Kong, municipal street-art data from six cities — searchable together,
in natural language, across institutional boundaries.

🔒 **All of it runs locally.** The language model (Ollama), the vector search
(Qdrant), the embeddings — everything runs on hardware the institution owns.
No visitor question, no object record, no institutional data ever goes to a
third-party cloud. Total hardware cost: roughly AUD $10–20k, one-time. No
subscriptions.

⚖️ **Every object has passed a legal gate.** Rights status (CC0, CC BY, public
domain, metadata-only) is checked per item at harvest, enforced in code — not
in a policy document — and printed on every poster and page. Nothing appears
on a public surface without clearing that gate.

🧭 **The objects can't make things up.** A five-layer hallucination prevention
framework keeps every conversation grounded in the object's verified curatorial
record. Each object knows what it knows — and says so when it doesn't. Curators
define the boundaries; the AI amplifies their reach, it doesn't replace their
judgment.

📄 **It's research.** The paper was accepted to the 6th Summit on New Media Art
Archiving at ISEA2026 Dubai. The prototype is the argument: cultural knowledge
can be conversational without institutions surrendering their data, their
authority, or their infrastructure to someone else's cloud.

So when you scan one of those posters in the street, you're not scanning a
gimmick. You're opening a door into an infrastructure argument: that museums
and artist-run spaces can own the machine, the model, the data, and the
conversation.

The poster is the doorway. ARCHAI is the building. And the building speaks.

#ARCHAIinTheWild #CulturalHeritage #GLAM #SovereignAI #DigitalHeritage
#Museums #OpenAccess #PhDResearch

---

## Short variant (if the long one feels heavy)

Last week's post showed you the doorway. Here's the building.

AUX.IO — the poster, the QR code, the object you talk to — is just the visitor
interface of ARCHAI, a sovereign AI infrastructure for cultural institutions:

→ 20 live collections, 3,147+ records (Met, V&A, Rijksmuseum, Smithsonian,
Getty, Wellcome…), searchable together in natural language
→ Every model, every query, every record running on locally-owned hardware —
nothing goes to the cloud
→ Per-item rights clearance enforced in code, printed on every poster
→ Five-layer hallucination prevention: objects speak only from their verified
curatorial record
→ ~AUD $10–20k one-time hardware, no subscriptions, open-source method
→ Accepted to ISEA2026 Dubai

The argument: institutions can own the machine, the model, the data, and the
conversation.

The poster is the doorway. ARCHAI is the building.

#ARCHAIinTheWild #CulturalHeritage #SovereignAI

---

## Suggested first comment (pin under either version)

If you're at a museum, gallery, or artist-run space and want to see what this
looks like for your collection: the whole method is open, the onboarding guide
is public, and a pilot runs on hardware you already control. Repo + white
paper + GLAM onboarding guide: [link]. And if you took one of the posters into
the street — tag it #ARCHAIinTheWild, I want to see where it ended up.

---

## Posting notes

- **Why this framing works:** the viral post earned attention on the *visible*
  layer; the follow-up converts that attention into the actual research claim
  (sovereignty, rights, curatorial authority) without repeating the first post.
- **Doorway/building metaphor** echoes the memory-palace lineage in the
  research (the building has already done the remembering, and it speaks) —
  it's on-thesis, not just on-brand.
- **Audiences served:** GLAM digital teams (sovereignty + cost), curators
  (authority + hallucination prevention), funders/academics (ISEA2026,
  practice-based research), street-art/community audiences (#ARCHAIinTheWild).
- Numbers to re-verify before posting: collection count (20), record count
  (3,147+), AUX.IO page count (1,402), hardware cost band.
- LinkedIn mechanics: post text has no links (link in first comment instead);
  emoji section markers keep the long version scannable on mobile.
