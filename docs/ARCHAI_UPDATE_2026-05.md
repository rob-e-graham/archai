# ARCHAI™ — Project Update, May 2026

## Sovereign Semantic Heritage AI Infrastructure
**Rob Graham** · FAMTEC (Fine Art Media Tech) / RMIT University, School of Design
**Supervisors:** Chris Barker (Senior), [Co-supervisor TBC]
**Programme:** PhD, Design Research (DR235)

---

## Abstract

This update documents developments to ARCHAI™ since the ISEA2026 Dubai presentation (April 2026). Key advances include: (1) a backend proxy architecture enabling safe public deployment without cloud dependency; (2) an AI-moderated visitor comment system that transforms audience responses into searchable collection records; (3) a unified curator vector collection combining institutional metadata with community knowledge; (4) the Obtext data format for portable, AI-grounded object conversations; (5) trademark protection and MPL-2.0 licensing of the ARCHAI™ toolkit; and (6) the AUX universal access page — a single interface serving NFC, QR, hyperlink, and Bluetooth beacon access patterns.

---

## 1. Backend Proxy Architecture

### Problem
Direct exposure of local AI services (Ollama, Qdrant) to public networks creates unacceptable security risks: prompt injection, resource exhaustion, and potential exploitation of the LLM for non-heritage purposes.

### Solution
A Node.js/Express proxy layer mediating all public access:

- **Rate limiting** — sliding window per IP (15 chat requests/min, 30 search/min, 20 scroll/min)
- **Prompt injection blocking** — regex-based pattern detection for common jailbreak attempts ("ignore previous instructions", "you are now", "disregard", etc.)
- **Safety wrapper** — system prompt prepended to all LLM calls enforcing the prosopopoeia frame and metadata-grounding constraint
- **Token caps** — maximum 512 generated tokens, 500 character user prompt
- **Schema validation** — all inputs validated via Zod schemas before reaching backend services

### Architecture
```
Visitor phone → Cloudflare Tunnel → Backend proxy → Ollama/Qdrant (local)
                                    ├── Rate limit check
                                    ├── Injection pattern check
                                    ├── Safety wrapper injection
                                    └── Response relay
```

This maintains the sovereign infrastructure principle — all computation remains on institutional hardware — while enabling safe public interaction.

---

## 2. AI-Moderated Visitor Comments

### Concept
Visitor responses to museum objects are not ephemeral reactions but potential collection records. ARCHAI™ now captures, screens, and preserves these as structured data attached to the object they reference.

### Implementation
1. **Submission** — visitor posts comment via any access point (AUX page, NFC, app)
2. **AI screening** — Ollama classifies as safe / suspicious / harmful (temperature 0.1 for consistency)
3. **Routing** — safe comments appear immediately; suspicious/harmful held for curator review
4. **Curator decision** — human reviews flagged content, approves or removes (AI never has final say)
5. **Persistence** — SQLite database with full audit trail (moderated_at, moderated_by)
6. **Integration** — comments become part of the object's vector representation in the curator collection

### Significance
This addresses a gap in museum informatics: visitor knowledge is typically lost or siloed in third-party platforms (Instagram comments, TripAdvisor reviews). ARCHAI™ treats audience response as *institutional data* while maintaining appropriate safeguards.

### Threaded Discussions
Comments support parent_id threading, enabling staff-visitor dialogue. Curators can reply contextually, creating persistent Q&A records that enrich future AI responses about the object.

---

## 3. Curator Vector Collection

### Design
A unified Qdrant collection (`archai_curator`) combining:
- All object metadata from source collections (Museums Victoria, Met, V&A)
- Visitor comments attached to each object
- AI moderation flags and community engagement metrics

### Build Process
1. Scroll all points from source collections
2. For each object, query SQLite for associated comments
3. Construct enriched text representation (title, type, date, maker, materials, location, description + visitor comments)
4. Embed via nomic-embed-text (768 dimensions)
5. Upsert to curator collection with enriched payload

### Purpose
Enables curators to perform semantic search across *everything* — finding connections between objects, identifying community interest patterns, and surfacing relationships that metadata alone might not reveal.

---

## 4. Obtext — Object Context Data Format

### Definition
**Obtext** (Object Context) is a structured data format that encapsulates everything needed for an AI system to speak authentically as a museum object. It provides the grounding layer for prosopopoeia-based conversations.

### Specification
An Obtext record contains:
- **Identity** — title, registration number, institution
- **Physical** — materials, dimensions, weight, condition
- **Temporal** — creation date, acquisition date, exhibition history
- **Spatial** — current location, provenance chain, geographic origin
- **Semantic** — description, significance, cultural context
- **Relational** — related objects, maker biography, collection context
- **Community** — visitor comments, discussion threads, engagement metrics
- **Constraints** — what the object does NOT know (preventing hallucination)

### Implementation
Obtext is currently encoded as structured text within the LLM system prompt. Future work will formalise this as `obtext.md` — a portable, human-readable markdown file that can be:
- Version controlled alongside the object record
- Shared between institutions
- Validated against minimum completeness standards
- Extended with institution-specific fields

### Relationship to Prosopopoeia
Obtext is the *substrate* of prosopopoeia in ARCHAI™. The five-layer hallucination prevention framework operates on the Obtext record:
1. System prompt grounding (Obtext as source of truth)
2. Safety wrapper enforcement (role constraint)
3. Token limits (preventing extended confabulation)
4. Prompt injection blocking (protecting the Obtext frame)
5. "Not in my record" escape valve (graceful uncertainty)

---

## 5. AUX — Universal Access Interface

### Problem
The previous approach generated ~194 static HTML pages per collection, one per object. This created:
- Maintenance overhead (regenerate on any metadata change)
- Storage bloat (redundant template code in every file)
- Inflexibility (access method baked into page design)

### Solution
**AUX** is a single HTML page (`aux.html`) that dynamically loads any object from the ARCHAI™ database. Access methods become interchangeable:

| Method | URL Pattern | Use Case |
|--------|-------------|----------|
| NFC tag | `fineartmedia.tech/aux.html?id=REG123` | Physical object labels |
| QR code | Same URL in QR format | Print materials, exhibition graphics |
| Hyperlink | Direct URL share | Digital comms, social media |
| Bluetooth beacon | URL broadcast via Eddystone | Proximity detection |

### Design Principles
- **Mobile-first** — designed for phone viewports (safe-area-insets for notch devices)
- **Progressive enhancement** — works without backend (shows error), degrades gracefully (metadata only when chat unavailable)
- **Backend discovery** — tries multiple endpoints in priority order (production tunnel, Tailscale, localhost)
- **Instant sharing** — Web Share API on supported devices, clipboard fallback

### Naming Rationale
"AUX" (Latin: voice) — because the page gives voice to objects. It directly references the prosopopoeia concept central to ARCHAI™ without being tied to any specific access technology.

---

## 6. Intellectual Property Protection

### Trademark
ARCHAI™ is asserted as a common law trademark of Rob Graham / FAMTEC. First use in commerce: 2024. Classes covered: software (9), SaaS/research (42), cultural services (41).

### Licensing
- **Code:** Mozilla Public License 2.0 — file-level copyleft requiring modifications to be shared, while permitting integration into larger proprietary systems
- **Brand:** ARCHAI™ name and branding reserved; forks must rebrand
- **Data:** Separate licences per source institution (CC BY 4.0, CC0, V&A Open Access)
- **Research:** All concepts, methods, and architectural patterns are Rob Graham's IP under active doctoral research

### Future
The ARCHAI™ toolkit will be released as fully open-source upon completion of the doctoral programme, enabling any institution to deploy sovereign heritage AI infrastructure.

---

## 7. Technical Summary (v10.8)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Vector DB | Qdrant (Docker) | Semantic search, object storage |
| LLM | Ollama (llama3) | Object conversations, moderation |
| Embeddings | nomic-embed-text | 768-dim semantic vectors |
| Backend | Express.js + SQLite | Proxy, comments, curator tools |
| Frontend | Single HTML file | Zero-dependency UI |
| Access | AUX (universal page) | NFC/QR/link/beacon entry |
| Hosting | Mac Studio M2 Max | Sovereign compute (~$3,500 USD) |

### What's Next
- Multimodal search (colour picker, image similarity via CLIP, sound)
- Obtext.md formal specification
- Cloudflare Tunnel deployment for public AUX access
- Longitudinal study of visitor comment patterns
- Institution partnership pilots

---

## References

Graham, R. (2026). ARCHAI: Sovereign Semantic Heritage AI Infrastructure for the Post-Cloud Museum. *Proceedings of ISEA2026*, Dubai.

Graham, R. (2026). Prosopopoeia as Interface: When Museum Objects Speak for Themselves. *6th Summit on New Media Art Archiving*, Dubai.

---

*ARCHAI™ is a trademark of Rob Graham / FAMTEC (Fine Art Media Tech). MPL-2.0 licensed. GitHub: github.com/rob-e-graham/archai*
