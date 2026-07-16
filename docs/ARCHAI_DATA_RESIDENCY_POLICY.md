# ARCHAI — Data Residency & Sovereignty Policy

**Version:** 0.2 (Draft for pilot partners)
**Status:** Research prototype. Pre-institutional deployment.
**Last updated:** 9 July 2026
**Contact:** rob@fineartmedia.tech

---

## 1. Purpose

This document states where data lives in an ARCHAI deployment, what leaves the host machine, what an institution retains, and what obligations ARCHAI accepts toward communities whose cultural material is represented.

It is written to be read by a registrar, a legal officer, a systems administrator, and a community representative — not only by an engineer.

Where a guarantee cannot currently be made, this document says so. Over-claiming is the failure mode this project exists to address.

---

## 2. Core principle

**Data residency is answered by architecture, not by promise.**

ARCHAI is designed to run on infrastructure owned and physically controlled by the deploying institution. Collection records, visitor questions, generated responses, and community contributions reside on that hardware. They are not transmitted to ARCHAI, to a vendor, or to a third-party cloud service as a condition of operation.

There is no ARCHAI-operated server that institutional data passes through. There is no ARCHAI account. There is nothing for ARCHAI to retain, subpoena, sell, lose, or shut down.

*Sovereign by default. Connected by choice.*

---

## 3. Current deployment reality

Stated plainly, because pilot partners are entitled to accuracy:

| Component | Where it runs | Data leaves machine? |
|---|---|---|
| Language model (inference) | Local — open-weight model via Ollama | No |
| Vector database / embeddings | Local — Qdrant | No |
| Collection records & metadata | Local | No |
| Visitor questions & conversation | Local | No |
| Community contributions | Local, pending curatorial review | No |
| Voice input / output (speech) | **Browser Web Speech API, in the visitor's browser** | **Varies by browser — see §7** |

The present research instance operates on a single consumer-grade machine. This is a deliberate demonstration that meaningful cultural AI does not require data-centre infrastructure, enterprise procurement, or specialist AI staff.

---

## 4. Jurisdiction

Because data does not leave the deploying institution's hardware, the applicable jurisdiction is the institution's own.

ARCHAI deployments are not subject to foreign-jurisdiction data access regimes — including the US CLOUD Act and FISA §702 — by virtue of using ARCHAI, because no ARCHAI-controlled entity holds, processes, or can access the data.

Institutions in Australia deploying ARCHAI retain data within Australia. The same holds for any jurisdiction. Residency follows the machine.

*(The one exception under the current prototype is the browser speech layer described in §3 and §7; text-only operation has no such exception.)*

---

## 5. What ARCHAI collects

**From institutions:** Nothing.
**From visitors:** Nothing transmitted externally by ARCHAI itself.

ARCHAI as a project receives no telemetry, no analytics, no usage statistics, no conversation logs, and no visitor data from deployed instances. Institutions may configure local analytics for their own purposes; these remain local and remain theirs.

If a pilot partner elects to share evaluation data with the research project, this occurs only under a separate, explicit, written agreement, with data specified, minimised, and time-bounded.

---

## 6. Cultural safety and Indigenous data governance

ARCHAI treats cultural safety as an architectural constraint, not a usage policy.

**Gating occurs at ingestion.** Material identified as culturally restricted, sacred, secret, or subject to community access protocols is not embedded into the vector index. It cannot be retrieved because it was never encoded. This is materially different from filtering outputs after the fact.

This design is informed by:

- **CARE Principles** for Indigenous Data Governance (Collective Benefit, Authority to Control, Responsibility, Ethics)
- **OCAP®** (Ownership, Control, Access, Possession)
- **Te Mana Raraunga** — Māori Data Sovereignty principles
- The **Right of Reply** and **Right to Know** as articulated by the Indigenous Archives Collective

**Authority sits with communities, not with the institution and not with the software.** Where a community determines that material should not be spoken about by a machine, that determination is implemented as a technical exclusion, and it is the community's to revoke or amend.

**Contribution is a two-way pathway.** Communities and individuals may contribute knowledge, correction, or context to the record. Contributions enter a curatorial review queue. The software does not write to the archive; people do, at a cadence institutions set.

**Limits:** ARCHAI provides the mechanism. It cannot supply the relationship. Identification of restricted material requires consultation the institution must undertake. No software substitutes for consent.

---

## 7. Known limitations and residual external dependencies

Stated in full, because a policy that only lists strengths is marketing.

1. **Voice is not yet fully sovereign.** The current speech layer uses the browser's built-in Web Speech API. Depending on the visitor's browser, speech *recognition* (audio in) and some synthesis *voices* (text out) are processed by the browser vendor's servers — for example Google in Chrome, or Apple in Safari — rather than on the host machine. This is the single largest gap between ARCHAI's stated principles and its present implementation. Local, open-weight speech — **Whisper** for recognition and **Piper** for synthesis — is in active development to close it. Institutions with strict requirements should operate ARCHAI in **text-only mode**, which is fully sovereign.

2. **Model provenance is inherited.** ARCHAI runs open-weight models it did not train. Their training data, and any bias within it, is not fully auditable by this project. Open weights permit inspection and replacement; they do not guarantee clean provenance.

3. **Scale is untested.** The prototype has not been evaluated under full institutional load, concurrent users, or long-term operation.

4. **Software updates require deliberate action.** Sovereignty means no vendor pushes updates to your machine. It also means no vendor patches your machine. Institutions assume maintenance responsibility. This is the trade.

---

## 8. Exit, portability, and continuity

There is no exit process, because there is no lock-in.

- The collection data was always yours and never moved.
- The index, the models, and the configuration reside on your hardware.
- The software is intended for open release and may be forked, modified, audited, or abandoned without consequence once released.
- If this project ceases tomorrow, every deployed instance continues to run.

An institution's ability to keep an object speaking does not depend on ARCHAI's continued existence, solvency, roadmap, or goodwill. This is the central claim, and it is the one on which every other claim depends.

---

## 9. Epistemic integrity

Cultural institutions hold higher public trust than most knowledge institutions. A system that speaks in an institution's name inherits that trust and can spend it.

ARCHAI's objects are constrained to decline rather than infer. Where evidence in the collection record does not support an answer, the object states the limit of what is known. Verification layers sit between model fluency and visitor-facing output.

An object that admits what it does not know is worth more than one that guesses well.

---

## 10. Licensing and openness

ARCHAI is intended for release as an open toolkit for galleries, libraries, archives, museums, community archives, and the not-for-profit sector.

- **Source:** inspectable at [github.com/rob-e-graham/archai](https://github.com/rob-e-graham/archai)
- **Licence:** All rights reserved during the doctoral research period; intended for open-source release on completion of the research — see [LICENSE](../LICENSE).
- **Cost at point of contact:** free to the person encountering the object
- **Dependencies:** open source (Ollama, Qdrant, open-weight models)

Openness here is a sovereignty mechanism, not a marketing posture. An institution cannot meaningfully own infrastructure it is forbidden to read. The current all-rights-reserved licence reflects the pre-release research period only; the intended end state is an open toolkit the sector can hold without permission.

---

## 11. Direction — the plan to full sovereignty

This policy describes a research prototype, not a finished product. It is published now so partners can judge the **trajectory** as well as the current state. The direction is fixed even where the implementation is incomplete.

**Closing the §7 gaps.** Each present limitation has a committed path:

- **Voice sovereignty.** Replace the browser Web Speech layer with a self-hosted open stack — **Whisper** for capture, **Piper** for synthesis — so audio and text for speech never leave the host machine. Until that ships, text-only mode is the fully-sovereign default.
- **Scale.** Pilot deployments on institutional hardware will test concurrent load, long-running operation, and larger collections before any production claim is made.
- **Maintenance.** Documented, institution-run update and backup procedures, so sovereignty does not become fragility — the institution can patch and restore without a vendor.
- **Model provenance.** A curated, documented set of open-weight models with a clear replacement path, so an institution can swap the model without swapping the system. The direction is toward models that show their work — **OLMo 2** (Allen Institute for AI: published weights, code, and training data), **Pythia** (EleutherAI: built to be studied), **IBM Granite** (documented, legally-backed data), and corpora such as **PleIAs' Common Corpus** (public-domain and openly-licensed text only) — with certification schemes like **Fairly Trained** as a signal of properly-licensed training data. Open weights make the model a chosen, inspectable, replaceable layer rather than a black box; the institution should always be able to know what is speaking in its name.

Progress against these is tracked in the public roadmap, and this document is revised as each gap closes (§12).

**The sector vision.** ARCHAI's end state is an open toolkit that galleries, libraries, archives, museums, community archives, and the not-for-profit sector can hold without permission. It is built to:

- preserve raw records exactly as received;
- normalise them into a shared canonical layer while keeping rights, provenance, language, and cultural-protocol metadata visible;
- search and interpret collections locally, and across institutions by choice;
- support both staff-facing collection intelligence and visitor-facing AUXIO interpretation;
- keep speech, translation, and AI interpretation as optional, documented, replaceable layers.

Sovereign infrastructure the sector **owns**, not a service it rents.

**How the work sustains itself.** The core toolkit is intended to be **free for not-for-profit and educational use**. The project is funded through consultation, installation, and commercial licensing for organisations that want hands-on deployment or want to build on the system — the arrangement that keeps the core open rather than forcing it behind a paywall. During the current doctoral research period the code remains all-rights-reserved while it is tested and hardened; open release follows completion.

**Community authority grows, not shrinks.** The two-way contribution pathway (§6) is the seed of a curated, community-governed knowledge layer: correction, context, and reply entering the record at a cadence institutions set, with communities retaining authority to add, amend, restrict, or revoke. The software will always write to the archive **through** people, never around them.

---

## 12. Review

This document is versioned and will be revised as limitations in §7 are closed, as the commitments in §11 are met, or as new limitations are identified. Superseded versions remain publicly available so that claims made at any point in time can be checked against what was true.

---

*Sovereign by default. Connected by choice.*
