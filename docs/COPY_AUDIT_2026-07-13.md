# ARCHAI copy audit — accuracy pass before outreach

**Date:** 2026-07-13
**Scope:** public-facing copy in the `rob-e-graham/archai` repo (README, in-app, docs).
**Lens:** *"Over-claiming is the failure mode this project exists to address."* Every claim
should describe what actually runs, or be explicitly marked planned / in development.
**Not covered:** the website (`fineartmedia-tech-web` — separate repo, not in scope here, and
outbound to `fineartmedia.tech` is blocked from the audit environment). See "Website" below.

---

## Fixed in this pass (README)

- **CollectiveAccess / ResourceSpace** were shown as Layer 1 and in the stack table as if the
  demo runs them. It does not (adapters are scaffolded). Reframed as *example* CMS/DAMS ARCHAI can
  sit above, connector scaffolded. ✅
- **Storage line** ("Hot NAS · Warm NAS · Cold LTO-9 tape, off-site, ransomware-immune") presented
  a backup architecture that isn't in place (the setup guides say NAS is "when purchased/available").
  Reframed as *target architecture, planned*; current instance runs on Mac Studio local storage. ✅
- **Proxmox VE** listed as a live stack component. The instance is a single Mac Studio (macOS), not
  Proxmox. Marked *(planned)*. ✅

## P1 — needs your true value, then align everywhere (do before outreach)

1. **Object / record counts are inconsistent across README, essay and log.** Three numbers are in play:
   - README: **3,147** records ("3,147-record pilot corpus", "3,147+ current records").
   - Essay: **3,267** objects.
   - Runtime (log, 2026-07-xx): **3,267** collection objects, **3,147** curator vectors.
   Likely reality: **3,267 = total objects in Qdrant**, **3,147 = curator-searchable vectors**. If so,
   the essay's "3,267 objects" and README's "3,147 records" are describing *different things* and should
   both say which. Pick one public framing (e.g. "3,267 objects indexed; 3,147 curator-searchable") and
   use it identically in README + essay + website.

2. **AUXIO "talking pages" count: 1,402 vs 1,522.** README says **1,402**; the manifest/log shows **1,522**
   in places (pre-gate) and **1,402** in others (post rights/placeholder gates). Get the live number:
   `curl -s https://archai-api.fineartmedia.tech/api/aux-manifest | python3 -c "import sys,json;p=json.load(sys.stdin).get('pages') or [];print(len([x for x in p if 'NFC' in str(x)]))"`
   Use whatever that returns everywhere (and remember it now includes `exhibition-map.html` + `index.html`,
   which are not talking objects — count NFC pages only).

3. **Collection / institution / source count wobbles: 19 vs 20 vs 21.** README front matter says "20 live
   collections"; the v11.6 changelog says "Nineteen"; runtime shows "21 Qdrant collections"; essay says
   "20 institutions". These are different denominators (collections ≠ institutions ≠ Qdrant collections,
   which include `archai_curator` etc.). State one public number with its definition and match it across
   README + essay + website.

4. **Model claim: `qwen2.5:32b` vs `qwen2.5:14b`.** README says inference runs on `qwen2.5:32b`, but
   `docker-compose.yml` sets chat + curator to `qwen2.5:14b`, and `APP_FUNCTIONAL_AUDIT` describes a dual
   setup (14b visitor / 32b curator). Confirm what is actually loaded on the Mac and make README match.
   If it's the dual setup, say so ("qwen2.5:14b visitor · qwen2.5:32b curator").

## P2 — verify or soften

5. **"six languages today"** (README feature 9). Confirm the translation/multilingual path is genuinely
   live for six languages; the progress log describes the translation UI as experimental/WIP. If it's not
   fully live, say "browser-native read-aloud in the visitor's language; multilingual translation in
   development" rather than a hard "six languages today".

6. **Coqui vs Piper.** README says "Piper/Coqui (in development)"; the policy commits to "Whisper + Piper";
   the roadmap says "Piper first, Coqui only after a voice/model licence audit". Minor, but pick one
   default (Piper) and mark Coqui as licence-gated, so the speech story reads consistently.

## Website (not yet audited — needs access)

The public site copy lives in `fineartmedia-tech-web/archai.html` (and siblings). It is a **separate repo**
not reachable from this environment, and `fineartmedia.tech` is network-blocked here. To audit it, either
paste the page text, or bring that repo into a session with access. The same checks apply: object/AUXIO
counts (the log notes the site reports 1,402 AUXIO pages — confirm against the live number in P1.2),
the CMS/DAMS framing, any infra claims, and the model/voice wording.

## Principle going forward

Match the essay's own standard: anything not currently running is labelled **planned** or **in development**,
and every headline number is defined (objects vs vectors vs pages) and identical across README, essay, and
website. The credibility of "an object that admits what it doesn't know" depends on the project doing the same.
