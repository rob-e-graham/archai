# ARCHAI — Stability & Testing Protocol

**Purpose:** stop the class of bugs that keep surfacing *after* a change goes
live — stale build versions, broken layout, missing images — and do it without
turning the public demo into a vulnerable system.

**Updated:** 9 July 2026

---

## 1. Why these bugs keep happening

Every issue we hit during the July publicity push had the same shape: a fault
that is **invisible in the source file but only appears in the deployed app**,
with **no check between "committed" and "the public sees it."**

| Symptom | Root cause |
|---|---|
| Live page stuck on an old build | The website `/app` is a *separate copy* of the app that drifted from source |
| Header showed v11.6.7 then "reverted" to v11.6.5 | Two different version strings in one file; JS overwrote the static one on load |
| Converse thumbnails stretched into banners | Cards relied on a flex parent that wasn't there — only visible once converse returned images |
| Connect page flush to the left edge | That panel had no padding; every *other* panel supplies its own |
| Auckland objects with no image | Source-data coverage: many records have no digitised media (not a code bug) |

The fix is not "be more careful." It is **a repeatable deploy that verifies
itself, plus a short manual pass that looks at the actual deployed page.**

---

## 2. The deploy protocol (single source of truth)

The live page at `fineartmedia.tech/app` is **generated**, never hand-edited.

```
cd "/Users/robgraham/Desktop/APPS/ARCHAI APP"
git fetch origin
git checkout origin/<current-feature-branch> -- ARCHAI_v10_8.html deploy-web-app.mjs
node deploy-web-app.mjs --dry-run    # verifies, writes nothing
node deploy-web-app.mjs              # writes app.html, commits, pushes → Cloudflare rebuilds
```

`deploy-web-app.mjs` now **refuses to publish** if:

- the file has no recognised `Build vX.Y.Z` marker;
- the file contains **two different** build versions (the exact stale-header bug);
- the app no longer reads `window.ARCHAI_API_BASE` (the backend contract changed);
- the written `app.html` fails a post-write re-read of the build marker + API base.

**Rule:** bump the build number on every change that touches the app. The header
version is our one honest signal that the deploy landed. If the header doesn't
change, assume the deploy did **not** land (usually Cloudflare cache — wait, then
hard-refresh with Cmd-Shift-R; confirm at `…/app?v=<number>` if unsure).

---

## 3. Pre-publicity QA checklist (5 minutes, on the live URL)

Do this on `fineartmedia.tech/app` itself — not localhost — after every deploy,
because these faults only show in the deployed app.

- [ ] Header reads the **expected build number** and **stays** there after load.
- [ ] **Converse:** ask "car" (or any common word) → answer appears, thumbnails
      are small cards in a row (not stretched banners), result grid populates.
- [ ] **Classic search:** returns results across multiple institutions.
- [ ] **Every tab** opens and its content is inset from the left edge (no flush
      column): Curator, Exhibitions, AUXIO Management, Vocabulary, Connect,
      Visitor, FAMTEC.
- [ ] Open one **object detail** → image (or an honest "No image"), related
      objects, and the chat box all render.
- [ ] One **AUXIO visitor page** loads and its chat responds.
- [ ] Try it once on a **phone** — layout holds, nothing overflows sideways.

If any box fails, fix, bump the build, redeploy, re-check. Do not push publicity
until every box passes.

### Automated pre-check (catches the cheap failures before you look)

```
grep -oE "Build v[0-9]+\.[0-9]+\.[0-9]+" ARCHAI_v10_8.html | sort -u   # must print ONE line
grep -c "AUX\.IO" ARCHAI_v10_8.html                                     # must print 0
```

---

## 4. Testing at scale **without** a vulnerable system

A public demo under publicity is a security surface, not just a stability one.
The two goals do not conflict if we keep this line:

**Let the public exercise read paths. Never expose a write, publish, ingest, or
infrastructure path to an unauthenticated visitor.**

Concrete rules for the public `/app`:

1. **Read-only for visitors.** The demo must run in a non-privileged role that
   hides and blocks editing, AUXIO publishing, batch tagging, harvesters,
   deletion, and service/emergency controls. A client-side role selector is a
   convenience, **not** a security boundary — the *server* must reject those
   actions for the public role. (See `docs/PUBLIC_APP_DEMO_HOSTING.md` — the
   default-admin request context is the outstanding risk to close before wide
   publicity.)
2. **Keep infrastructure private.** Qdrant, Ollama, Directus, and raw proxy
   routes stay off the public internet. The public reaches only purpose-built
   API routes (search, converse, object read, AUXIO pages, public counts).
3. **Rate-limit every public route** per-IP, in separate scopes (search /
   converse / scroll each have their own budget) so one heavy path can't starve
   another and one visitor can't exhaust the service.
4. **Degrade, never error.** When the AI model is saturated (one Mac Studio can
   only generate a couple of 32B answers at once), converse must fall back to
   instant Qdrant search — the visitor always gets the collection, never a raw
   error. This is already in the build; keep it.
5. **Validate and escape all rendered output** (`escHTML` for text, `escQ` for
   inline-handler strings) so model output or record metadata can't inject markup.
6. **No secrets client-side.** API keys live in the host keychain (Keytec) and
   are injected at harvest time, never in the page or the connector config.

Improving *testability* (more people, more devices, harder use) is therefore
about widening the **read** surface and observability — not loosening auth.

---

## 5. Image coverage (expectation-setting, not a bug)

Many source records — especially social-history objects (Auckland, some
aggregators) — have **no digitised image** in the open API, or return a
"Digital image not yet created" placeholder. The app correctly shows "No image"
for these; it is not a rendering fault. The image pipeline is verified working
for records that *do* have media.

For a demo you want to *look* rich:

- Prefer surfacing image-ready objects (converse already filters the result grid
  to image-ready records via `pickSearchImage` / `hasUsableObjectImage`).
- Treat "No image" as an honest, expected state — it demonstrates the rights and
  media gates, which is part of the ARCHAI story, not a flaw to hide.

---

## 6. One-line summary

> The live app is **generated and self-verified**, every change **bumps the
> build**, a **5-minute checklist on the live URL** gates publicity, and the
> public only ever touches **rate-limited read paths** — never write, publish,
> or infrastructure controls.
