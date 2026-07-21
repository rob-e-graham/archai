# Community Cultural Protocols — source-community authority over what the AI says

> *So here's the question for anyone building "the collection that can listen": does your system have a mechanism for a source community to say **don't let it answer that** — a restriction the AI actually honors, not just a staff review after the fact?*

This document describes ARCHAI's answer to that question. The short version: yes, and the honouring happens **at the AI inference boundary — before and after the model runs — not as a curatorial review after publication.**

---

## Why this exists

ARCHAI lets visitors hold a conversation with a collection object. That is exactly the "objects that answer / catalogs that talk back" pattern — and it carries exactly the risk named in the critique: the system is trained on the institution's own catalogue, and the institution still decides what gets said. Making the museum voice *conversational* does not change **whose** voice it is.

The correction is not a better content filter written by the museum. It is a different **locus of authority**. A source community — or a guardian (kaitiaki) acting for it — must be able to set the terms on which the AI may speak about an object connected to them, and the system must obey those terms mechanically, at the moment of answering.

This design draws directly on work Indigenous communities have already built:

- **CARE Principles for Indigenous Data Governance** (GIDA, 2020) — Collective benefit, **Authority to control**, Responsibility, Ethics.
- **Local Contexts — Traditional Knowledge (TK) Labels** — labels a community attaches to a catalogue item asserting cultural authority and specific-use restrictions, independent of copyright.
- **Mukurtu CMS** — community-set access protocols (public / restricted / closed, and by finer conditions) built with the Warumungu community.
- **Te Hiku Media — Kaitiakitanga License** — guardianship, not ownership; access governed by tikanga; benefit flows back to the people who contributed.

## The three places the restriction is honoured

Everything below lives in `backend-archai/src/services/culturalProtocol.js` and is enforced on the **public** visitor path (`POST /api/proxy/chat`) as well as the staff path (`POST /api/chat/object`). Both paths resolve the *same* protocol, so there is one source of authority.

1. **Resolve (`resolveProtocol`).** The object's community terms are looked up in a **server-authoritative registry**. A static AUXIO page cannot strip a restriction by omitting or editing the object reference: a protocol keyed on the collection, institution, cultural context, or a restriction flag still applies. When several protocols overlap, the **stricter** access wins and their restricted-topic lists merge — a community can only ever *add* protection.

2. **Pre-inference gate (`evaluateAccess`).** Before the language model is called:
   - `closed` objects never reach the model at all.
   - A question that touches a **restricted topic** (e.g. burial, human remains, secret/sacred content, monetary value) is declined before generation.
   - The visitor receives the **community's own decline wording**, not a generic museum message.

3. **Post-inference backstop (`screenResponse`).** If restricted knowledge surfaces in generated text despite the pre-gate, the whole answer is replaced with the community decline. Defence in depth, because a probabilistic model is never a guarantee on its own.

Plus a **voice constraint (`applyVoiceConstraint`).** When `noVoice` is set, the model is instructed **not** to speak in the first person as the object and **not** to claim that the community or an ancestor speaks through it. It describes the object neutrally in the third person and attributes authority to the community. This is the direct refusal of "give the object a voice" when the source community has not consented to it.

Every block is written to the audit log (`cultural.protocol.block`), so enforcement is itself accountable.

## Who can set a protocol

The write path (`POST /api/protocols`) is gated by a **community steward key** that sits **outside** the staff role system. Museum staff — including the `admin` role — **cannot** register or weaken a community protocol through the app. Steward keys are configured out-of-band:

```
CULTURAL_STEWARD_KEYS="iwi-kaitiaki:<key>,warlpiri-steward:<key>"
```

A steward-set protocol is marked `communityAuthoritative` and is binding. This mirrors the Kaitiakitanga model: the institution holds the object, but authority over the knowledge is governed by the community.

## Access levels (Mukurtu-style)

| Level | The AI may… |
|---|---|
| `open` | Answer from the verified record, subject to topic restrictions and the voice constraint. |
| `restricted` | Give minimal, materials-level facts; decline substantive interpretation of the fenced-off topics; defer to the community. |
| `closed` | Not answer at all; return the community decline and point to the steward. |

## API

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/protocols` | public | Registry: TK-label catalogue, access levels, governance basis, registered protocols. |
| `POST /api/protocols/resolve` | public | The effective protocol / public notice for one object (transparency). |
| `POST /api/protocols` | **steward key** | Register or update a community protocol. |
| `POST /api/proxy/chat` | public | Visitor chat — enforces the protocol inline. |

Send an object reference with a chat request so the server can resolve the protocol:

```json
{
  "systemPrompt": "…",
  "userPrompt": "Who is buried with this?",
  "object": { "collection": "archai_tepapa", "culturalContext": "Taonga Māori" }
}
```

A blocked response comes back in the same envelope a normal answer uses (so the page never dead-ends), with a `culturalProtocol` block naming the authority as `source-community`.

## The registry file

`backend-archai/src/config/cultural-protocols.json` ships the reference registry (TK-label catalogue + seeded demonstrations). Community-registered protocols are written to `data/runtime/cultural-protocols.json` (gitignored, durable across restarts) and take precedence over the seed. Each protocol has:

- `match` — how the protocol binds to objects (collection / institution / cultural_context / registration / canonical_id / restriction_flag).
- `access` — `open` | `restricted` | `closed`.
- `tkLabels` — TK-label codes (e.g. `TK_A`, `TK_CV`, `TK_S`).
- `noVoice` — refuse first-person ventriloquism.
- `restrictedTopics` — phrases that trigger a decline pre- and post-model.
- `declineMessage` / `culturalNotice` — the community's own wording, shown to visitors.
- `community` — name, authority, steward contact, `benefitFlowsBack`, `ownershipClaimByInstitution`.

## Tests

`npm run test:cultural` (in `backend-archai/`) runs the enforcement offline — no Ollama, Qdrant, or server required. It proves: restricted topics blocked before the model; closed objects blocked entirely; leaked knowledge caught after the model; the voice constraint applied; overlapping protocols resolving to the stricter access; ungoverned objects unaffected; and steward-set protocols binding.

## What this is and isn't

It **is** a mechanism for a source community to say *don't let it answer that*, enforced by the AI at answer time and not overridable by museum staff in the app.

It **is not** a claim that the mechanism substitutes for relationship. A registry key is a technical delegation of authority; it works only when the guardianship behind it is real. The point of building it is to make the honest answer to the question "yes" instead of "we review it afterwards" — and to make that the default posture of the collection that listens.
