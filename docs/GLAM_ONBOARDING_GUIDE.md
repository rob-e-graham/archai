# ARCHAI — Onboarding Guide for GLAM Institutions

**Setting up and using ARCHAI: sovereign conversational access to your collection.**
Version 2026-07 · maintained alongside `ONBOARDING_AND_BACKEND_PLAN.md` and
`backend-archai/scripts/COLLECTION_ONBOARDING_BLUEPRINT.md`.

---

## 1. What ARCHAI is (and is not)

ARCHAI is a **semantic interface layer** that sits *above* your existing
collection-management and asset systems. It reads from them and never writes back.
It adds:

- **Conversational search** across your collection in plain language (staff and public);
- **AUX.IO** — a first-person conversational page per object, reachable by QR/NFC/link,
  grounded strictly in your institutional record (the object cannot invent facts);
- **Rights-aware publishing** — per-item legal gates decide what appears publicly;
- **Print access objects** — poster/postcard/sticker exports with QR access;
- **Staff collection intelligence** — cross-collection semantic search with lenses.

It is **not** a CMS, a DAMS or an IIIF server, and it does not replace yours.
Everything runs on hardware you own: a local language model (Ollama), a local vector
database (Qdrant), local embeddings. **No collection data or visitor conversation
leaves your building.**

## 2. What you need

| Requirement | Detail |
|---|---|
| Compute | One Apple-Silicon workstation (Mac Studio class) or equivalent capable of local LLM inference. A modest one-time cost — no per-query fees, no subscriptions. |
| Software | Node.js 20+, Ollama (with `qwen2.5:14b` or larger + `nomic-embed-text`), Qdrant (Docker), the ARCHAI repository. |
| Collection access | A read path to your records: JSON API, IIIF, OAI-PMH, CSV export, or a CMS/DAMS connector (EMu, TMS, CollectiveAccess, ResourceSpace, Directus). Read-only credentials are enough. |
| People | A curator/collections lead (rights + interpretation decisions), and IT support for the initial install. No AI expertise required. |

## 3. Install (host machine, once)

```bash
git clone https://github.com/rob-e-graham/archai.git && cd archai
docker compose up -d                      # Qdrant vector database
ollama pull qwen2.5:14b && ollama pull nomic-embed-text
cd backend-archai && npm install && npm run dev   # backend on :8787
# open ARCHAI_v10_8.html via a local web server for the staff app
```

The backend health check at `http://localhost:8787/api/health` should report `ok`.

### Secrets — the Keytec protocol

**API keys never live in config files, the repository, or the browser.** ARCHAI uses
the Keytec pattern: keys are stored once in the host keychain and injected into the
environment only for the duration of a harvest run:

```bash
famtec add <sourceid>                       # store once — becomes SOURCEID_API_KEY
famtec profile create <sourceid>
famtec profile attach <sourceid> <sourceid>
famtec run <sourceid> -- node scripts/generic-harvester.js --config <cfg>.json
```

The Connect Collection page generates these commands for you when your API needs a
key. If a key ever appears inside a JSON config or a commit, that is a bug — report it.

## 4. Connect your collection (the onboarding funnel)

**Step 1 — Connect.** In the staff app, open the **Connect Collection** tab. Enter
your institution, source type and API base URL, choose your rights defaults and
cultural-safety gates, and press **Test endpoint**. The page generates a harvester
config (download it) and the exact commands to run. Browser CORS failures here are
normal and don't block anything — the host-side harvester is not subject to them.

**Step 2 — Dry-run.** On the ARCHAI host:

```bash
node backend-archai/scripts/generic-harvester.js --config archai-connector-<id>.json --limit 10
```

Nothing is written. You get a report: records fetched, mapped, rights status,
image health, culturally sensitive records excluded. Edit `mapping.fields` in the
config (dot-paths into your API's record shape) until the sample records look right.
Most JSON APIs need **no custom code**; complex sources can get a dedicated
harvester script.

**Step 3 — Legal review.** A person — not the software — confirms item-level rights
for public display and records the verdict in the source registry
(`collection-targets.json`). ARCHAI's defaults are conservative: unknown rights are
held from public display, and **print/poster reuse is off for every new source**
until this review explicitly enables it.

**Step 4 — Live harvest.** Re-run with `--apply`. Raw records are preserved verbatim;
a canonical layer, embeddings and the cross-collection curator index are built from
them. Your source system is untouched.

**Step 5 — Staff acceptance.** Search your own collection in the Curator tab. Check
the voices, lenses and legal labels. Flag anything sensitive — exclusion is the
default until protocols are agreed with the relevant communities.

**Step 6 — Publish AUX.IO objects.** In the **AUX.IO Management** tab: select an
empty slot → search your collection → **Assign** → set location and visitor
visibility → **Save Changes** → **View Live Page**. Print the poster/postcard/
sticker kit from any object's page — the QR opens that object's live conversation.

You can also **create objects by hand** (no API needed): fill the draft form in an
empty AUX.IO slot, save, and the object immediately gets a live, grounded
conversational page. Staff work persists across restarts.

**Step 7 — Evaluate.** Use Training Mode's guided flow with your team: collection
search → object review → AUX.IO publish → voice question → print export.

## 5. Rights and cultural safety (non-negotiable defaults)

- Per-item licence status is enforced in code and shown on every public page.
- Records without healthy, openly-licensed media stay staff-searchable but are held
  from the public image-first set — an honest "view at source" rather than a
  misleading placeholder.
- Culturally sensitive or restricted records are **excluded from embedding by
  default** — never ingested into the AI layer in the first place — until access
  protocols are co-designed with the relevant communities (CARE Principles /
  Local Contexts TK Labels).
- The object's AI voice can only state what the record supports. Ask it something
  outside its record and it says so. Test this yourself on any AUX.IO page.

## 6. How your team uses it day-to-day

| Role | Where they work | What they do |
|---|---|---|
| Curator | Curator & Collections tab | Plain-language semantic search, object review with curatorial/collections/exhibition/interpretation lenses, project lists. |
| Collections staff | Object detail | Full metadata record, source links, legal status, share/save actions. |
| Interpretation | AUX.IO Management | Assign objects to QR/NFC points, tune visitor visibility, publish, print the access kit. |
| Visitors | AUX.IO pages | Scan → read → **ask the object questions** in their own words, by text or voice, in multiple languages. |

## 7. Maintenance

- **Backups:** the heritage layer is your source systems (unchanged). ARCHAI-side,
  back up `backend-archai/data/` (staff work + manifests) and your harvester
  configs. Embeddings and generated pages are **regenerable** — they can always be
  rebuilt from source.
- **Model upgrades:** models are swappable configuration, not architecture. A better
  open-weight model next year means re-pointing Ollama and regenerating derived
  layers — your data and records are never locked to a model.
- **Page regeneration:** after any harvest or template change:
  `node nfc-pages/generate-nfc-pages.js`.

## 8. Transparency — the Huggle protocol

ARCHAI is built by a documented human + multi-agent team, coordinated through
**Huggle**, a local message bus that logs every claim, hand-off and decision, with a
human in the loop on every consequential call. Two things follow for you as a
partner: (1) the development record of the system interpreting your collection is
**inspectable** — decisions are on the record, not in a black box; and (2) the same
discipline applies to your deployment: agent-assisted work on your instance is
logged, and secrets stay outside agent reach (Keytec). Ask for the coordination log
any time.

## 9. Current boundaries (honest list)

- The staff app is a working prototype: keep it behind your network/VPN until the
  server-side authentication layer lands (in progress).
- Voice in the browser uses the device's own speech engine; in Chrome that sends
  audio to Google. The self-hosted Whisper/Piper path (fully sovereign voice) is in
  development — treat browser voice as a demo convenience, not the sovereign path.
- The public demonstration set is curated and 100% open-licensed by construction;
  your own deployment publishes only what passes your gates.

## 10. What a pilot looks like

A structured pilot is a short, consultative project — not a software install.

| Phase | Weeks | What happens | Who |
|---|---|---|---|
| Scope | 1 | Pick the pilot collection subset, agree rights defaults and cultural-safety gates, sign the data agreement | Curator + Rob |
| Connect | 1–2 | Connect Collection config → dry-run → legal review → live harvest | IT + Rob |
| Staff acceptance | 2–3 | Curators search their own records, tune voices/lenses, flag sensitive items | Curatorial team |
| Publish | 3–4 | Curated AUX.IO set assigned + published; QR/poster kit printed for the floor | Interpretation |
| Evaluate | 4–6 | Staff findability + trust, visitor engagement, curatorial sign-off review | Everyone |

Exit criteria are agreed up front: either the institution continues on its own
instance, extends the pilot, or stops — with nothing to unwind, because the
source systems were never modified.

## 11. What it honestly costs

- **Hardware:** one Apple-Silicon workstation-class machine (a few thousand
  dollars, one-time — a minor exhibition line item, not an enterprise contract).
- **No recurring platform fees:** no per-query costs, no subscription tiers, no
  dependency on an external model vendor.
- **Real costs that don't disappear:** staff time for the legal review and
  curatorial acceptance; IT time for install and network placement; ongoing
  light maintenance (backups, occasional regeneration). ARCHAI's design makes
  these costs *visible* rather than hidden inside a subscription — that
  transparency is the point.
- **Skills:** no AI expertise required to operate; comfort with running two or
  three documented terminal commands for harvests.

## 12. The five questions every institution asks

**"What if it says something wrong?"** Responses are generated only from your
verified record via a five-layer prevention framework; where the record runs
out, the object says so. Test it live: ask any AUX.IO object something outside
its record. Curatorial review workflows cover the residual risk — and an
auditable "what was this answer grounded in" trail is part of the design.

**"Does this replace curatorial authority?"** No — it amplifies it. Curators
define the knowledge foundations, the interpretive framings and the response
boundaries; the system distinguishes accessibility narration, curatorial
interpretation and performative object voice, and staff control which modes are
available. The system speaks *from the record*, not from its own opinions.

**"Will our IT department approve it?"** It's a self-hosted, read-only layer:
standard open-source components (Node.js, Qdrant, Ollama), no cloud accounts, no
outbound collection data, keys in the OS keychain. It should sit behind your
network/VPN for staff use; the public layer serves only rights-cleared pages.
Honest caveat: this is research-grade software without a commercial SLA — the
pilot structure exists precisely so your team can evaluate that trade-off.

**"How does it handle culturally sensitive material?"** Exclusion is the
default, enforced before the AI layer ever sees the record. The gates implement
your decisions — but the decisions about what is restricted and how it is framed
belong to communities and curators, never to the software (CARE Principles /
Local Contexts TK Labels).

**"Who maintains it after the research ends?"** Three honest answers: it's
open-source (you can maintain, fork or commission your instance); your
deployment is yours — it keeps working without anyone's permission; and the
architecture is regenerable by design, so nothing about your data is locked to
this software or any AI model.

## 13. The data agreement (one page, plain language)

Every pilot starts with a short signed note that records:
- what ARCHAI harvests (named API/export, read-only) and what it never touches;
- that all data stays on the named institutional/host machine — no cloud;
- that AI interpretation is a *derived layer*, clearly distinguished from your
  record, and never written back into your systems;
- that you can require removal or restriction of any object at any time;
- per-item rights and cultural-protocol flags travel with the data and are
  enforced in code;
- who owns what: your records remain entirely yours; ARCHAI's code is
  open-source; derived layers are disposable.

## 14. Quick-start checklist

- [ ] Read this guide + the one-page partner brief
- [ ] Nominate the pilot collection subset (50–300 objects is ideal)
- [ ] Confirm your API/export access path and rights fields
- [ ] Sign the data agreement
- [ ] Host machine ready (or use the FAMTEC-hosted demo instance to start)
- [ ] Connect → dry-run → legal review → harvest → staff acceptance → publish
- [ ] Book the evaluation review

## 15. Contact

Rob Graham · rob@fineartmedia.tech · fineartmedia.tech/archai
Live demo objects: https://archai-api.fineartmedia.tech/aux/index.html
Talk to an object right now: https://archai-api.fineartmedia.tech/aux/NFC1308.html
