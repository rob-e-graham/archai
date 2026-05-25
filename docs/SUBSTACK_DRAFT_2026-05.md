# What If Museum Objects Could Talk Back?

*Introducing ARCHAI™ — sovereign AI infrastructure that lets cultural heritage speak for itself.*

---

## The moment it clicked

I was standing in front of a 150-year-old proof coin at Museums Victoria, reading the same three-line label that's been there since 2019. Registration number. Date. "Gold, proof." That's it. That's all most visitors will ever learn about this object.

But the collection database has pages of information — who commissioned it, the political context of its minting, the metallurgical techniques, the provenance chain that brought it from the Royal Mint to Melbourne. An entire biography, locked behind a staff login.

I thought: what if the coin could just *tell you*?

---

## Objects speaking as themselves

ARCHAI™ is a research toolkit I've been building as part of my PhD at RMIT University (Design). The core idea is old — *prosopopoeia*, the rhetorical device of giving voice to inanimate things. What's new is making it work with verified institutional data, on sovereign infrastructure, without sending anything to the cloud.

Here's what happens when you tap an NFC tag next to that proof coin:

1. Your phone opens a page
2. The coin introduces itself — in first person — using its actual museum record
3. You can ask it questions: "When were you made?" "What are you made of?" "Why are you significant?"
4. It answers from its verified metadata. If you ask something it doesn't know, it says so.

No hallucination. No making things up. No sending your conversation to OpenAI.

---

## The technical bit (for those who care)

ARCHAI™ runs entirely on a single Mac Studio (~$3,500 USD). No subscriptions. No API keys to third parties. No cloud dependency.

The stack:
- **Qdrant** vector database — stores museum objects as 768-dimensional semantic embeddings
- **Ollama** running llama3 — provides the conversational layer
- **nomic-embed-text** — converts questions and metadata into searchable vectors
- **Express.js** backend — rate limiting, prompt injection protection, AI comment moderation
- **SQLite** — persistent storage for visitor interactions

Three museum collections are currently searchable simultaneously: Museums Victoria (194 objects, CC BY 4.0), The Metropolitan Museum of Art (100 objects, CC0), and the Victoria and Albert Museum (80 objects, V&A Open Access).

### The five-layer hallucination prevention framework

This is the research contribution that matters most. Museum objects cannot lie:

1. **Obtext grounding** — every conversation is anchored to a structured data format containing only verified institutional metadata
2. **Safety wrapper** — the LLM is constrained to its assigned role and cannot be re-directed
3. **Token limits** — responses are capped at 512 tokens, preventing extended confabulation
4. **Prompt injection blocking** — common jailbreak patterns are detected and rejected before reaching the model
5. **Graceful uncertainty** — when asked something outside its record, the object says "That's not in my verified record" rather than inventing an answer

---

## Why "sovereign"?

The museum sector is being sold AI solutions that require sending collection data — and visitor interaction data — to commercial cloud providers. This creates:

- **Dependency** — if the provider changes pricing or terms, the institution loses access to its own AI capabilities
- **Data sovereignty** — visitor interactions, which are culturally sensitive research data, leave the institution's control
- **Homogeneity** — every museum using the same cloud API gets the same generic responses

ARCHAI™ takes the opposite approach. Everything runs on hardware the institution owns and controls. The AI model is open-source. The data never leaves the building. The total cost is a one-time hardware purchase, not a monthly subscription.

This isn't anti-cloud ideology — it's practical. A regional museum with a $50k annual budget can deploy this. A national institution concerned about data sovereignty can trust it. A researcher studying visitor behaviour can access everything locally.

---

## AI-moderated visitor comments (or: making audience knowledge permanent)

Here's something museums waste every day: visitor knowledge.

When someone stands in front of an object and says "My grandmother had one of these — she used it for X" — that's primary source material. It's oral history. It's contextual information that no curator would have access to otherwise.

In most museums, that knowledge evaporates. Or it ends up as an Instagram comment that the institution will never see.

ARCHAI™ captures visitor comments as part of the object's collection record. Each comment is:
- **AI-screened** in real time (safe / suspicious / harmful)
- **Curated by humans** — the AI flags, a person decides
- **Threaded** — staff can reply, creating persistent Q&A records
- **Searchable** — comments are embedded into the curator vector collection, discoverable by semantic search

This means a curator can search "objects visitors connect to family memories" and find patterns across the entire collection. Visitor knowledge becomes institutional knowledge — properly attributed, safely moderated, permanently preserved.

---

## Obtext: the data format that makes objects conversational

I've been developing a concept called **Obtext** (Object Context) — the structured data format that contains everything an AI system needs to speak authentically as a museum object.

Think of it as the object's biography in a format that both humans and AI can read. It includes:
- Identity (what it is, where it lives)
- Physical properties (materials, condition, dimensions)
- Temporal context (when made, when acquired, exhibition history)
- Significance (why it matters, cultural context)
- Constraints (what it explicitly does *not* know)

The constraints field is crucial. By telling the AI what the object doesn't know, we prevent it from filling gaps with plausible-sounding fabrication. An 1866 proof coin doesn't know about cryptocurrency, and its Obtext record ensures it won't pretend to.

---

## AUX: one page to access them all

The latest development is **AUX** — a universal access page that works with any entry method:

- **NFC tag** on a physical label → opens AUX
- **QR code** in a print catalogue → opens AUX
- **Hyperlink** shared on social media → opens AUX
- **Bluetooth beacon** broadcasting a URL → opens AUX

Same page, same experience, any entry point. The object speaks regardless of how you arrived.

The name is Latin for "voice" — because that's what the page provides. A voice for objects that have been silent behind three-line labels for decades.

---

## Where this is going

ARCHAI™ is my doctoral research at RMIT University, supervised by Chris Barker in the School of Design. It was presented at ISEA2026 in Dubai (April 2026) and the 6th Summit on New Media Art Archiving.

**Near-term:**
- Multimodal search (find objects by colour, by visual similarity, by sound)
- Public deployment via Cloudflare Tunnel
- Formal Obtext specification
- Institution partnership pilots

**Longer-term:**
- The toolkit will be released as fully open-source after the PhD
- Any institution will be able to deploy sovereign heritage AI for the cost of a single computer
- The research explores what happens when audiences can genuinely converse with collections — not just read about them

---

## Try it

The ARCHAI™ project page is live at [fineartmedia.tech/archai.html](https://fineartmedia.tech/archai.html). When the backend is running, you can search across all three museum collections and talk to any object.

The code is on [GitHub](https://github.com/rob-e-graham/archai) under MPL-2.0.

If you work in museums, cultural heritage, or digital humanities and this resonates — I'd love to hear from you: rob@fineartmedia.tech

---

*Rob Graham is a PhD candidate at RMIT University (Design), founder of FAMTEC (Fine Art Media Tech), and former Head of Technology at the National Communication Museum. His research focuses on sovereign AI infrastructure for cultural heritage institutions.*

*ARCHAI™ is a trademark of Rob Graham / FAMTEC.*
