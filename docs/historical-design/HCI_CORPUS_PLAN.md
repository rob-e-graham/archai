# HCI Corpus Plan

**Author**: Rob Graham
**Context**: RMIT Design PhD — supervised by Chris Barker
**Last updated**: 2026-06-05
**Status**: Working plan — partially executed via FIELD_SIGNALS_AND_KEY_TERMS.md

---

## 1. Purpose

This document outlines a practical plan for bringing recent HCI conference abstracts into a research corpus that can help shape ARCHAI.

The aim is not literature review for its own sake. The aim is to build a **field-sensitive reference layer** that helps ARCHAI understand:

- which problems are already being discussed
- which adjacent fields use similar language
- which values and design assumptions dominate the discourse
- where ARCHAI is aligned
- where ARCHAI is genuinely contributing something new

---

## 2. Current Progress

### What has been done (2026-06-05)

The initial research sweep is complete and documented in [FIELD_SIGNALS_AND_KEY_TERMS.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/FIELD_SIGNALS_AND_KEY_TERMS.md). This covers:

- 15+ recent papers from ACM CHI, DIS, TEI, IUI, JOCCH, IJHCI, and adjacent venues (2021–2026)
- Key term mapping with frequency signals
- Field signals analysis (what the field is asking for)
- Vocabulary bridge between HCI and GLAM
- Identification of ARCHAI's novel contributions vs existing work

### What remains

- Systematic corpus download from ACM Digital Library (requires institutional access)
- Quantitative keyword frequency analysis across full abstract sets
- Citation network mapping (who cites whom, which papers cluster)
- Formal gap analysis suitable for literature review chapter

---

## 3. Conference Targets

### Primary HCI venues

| Conference | Period | Access method | Priority |
|-----------|--------|---------------|----------|
| CHI | 2021–2026 | ACM Digital Library (RMIT institutional access) | High |
| DIS | 2021–2026 | ACM Digital Library | High |
| TEI | 2021–2026 | ACM Digital Library | High |
| CSCW | 2021–2026 | ACM Digital Library | Medium |
| IUI | 2021–2026 | ACM Digital Library | Medium |
| UIST | 2021–2026 | ACM Digital Library | Medium |
| C&C | 2021–2026 | ACM Digital Library | Low-medium |
| NordiCHI | 2021–2026 | ACM Digital Library | Low |
| OzCHI | 2021–2026 | ACM Digital Library / direct | Medium (local context) |

### Heritage and cultural computing venues

| Venue | Period | Access method | Priority |
|-------|--------|---------------|----------|
| JOCCH | 2021–2026 | ACM Digital Library | High |
| MW (Museums and the Web) | 2021–2026 | museumsandtheweb.com (open access proceedings) | High |
| IJHCI | 2021–2026 | Taylor & Francis (RMIT library) | Medium |
| DH conferences | 2021–2026 | ADHO / open access | Low-medium |
| EVA / ICHIM | 2021–2026 | Various | Low |

### Adjacent venues worth checking

| Venue | Why |
|-------|-----|
| ISEA | Rob's own white paper is at ISEA2026. Check for related work on AI + heritage + interaction. |
| Ars Electronica | Media art + technology intersection. Born-digital, software art, interactive installations. |
| SIGGRAPH | Digital heritage visualisation, 3D scanning, preservation technology. |
| ICOM general conferences | Policy, standards, institutional direction. |

---

## 4. Key Terms for Corpus Search

### 4.1 Core ARCHAI terms

These are the terms most directly relevant to ARCHAI's specific contributions:

- museum + AI
- gallery + conversational agent
- heritage + chatbot
- collection + semantic search
- object + voice / speech
- NFC + museum / heritage
- tangible interaction + heritage
- sovereign AI / local AI / on-premises AI
- hallucination prevention + cultural heritage
- object agency / object voice
- accessibility + museum + voice
- multilingual + heritage + interaction

### 4.2 Broader field terms

These capture adjacent discourse and signals:

- affect / emotion + heritage / museum
- embodied interaction + cultural
- situated interaction + gallery / exhibition
- more-than-human design + heritage
- digital repatriation
- Indigenous data sovereignty + AI
- born-digital preservation
- IIIF + interaction / viewer
- curatorial + AI / technology
- audio guide + AI / conversational
- kiosk + museum + accessibility
- trust + AI + museum / heritage

### 4.3 Rob's personal key terms

From the supervisor notes — "feelings and fields that are similar":

- feelings
- affect
- emotion
- encounter
- experience
- memory
- materiality
- presence
- trust
- unease
- curiosity
- interpretation
- voice

---

## 5. Practical Workflow

### Step 1: Build a conference/source register

Create a spreadsheet or structured file listing:
- Conference name
- Year
- Proceedings URL / DOI
- Number of papers
- Access status (open / institutional)

### Step 2: Download or collect abstracts

**For ACM venues** (CHI, DIS, TEI, CSCW, IUI, UIST, C&C, JOCCH):
- Use RMIT institutional ACM Digital Library access
- ACM DL allows bulk browsing of proceedings by year
- Export options: BibTeX, CSV, or manual collection
- Focus on abstracts + keywords (full papers only where highly relevant)

**For non-ACM venues** (MW, IJHCI, DH):
- MW proceedings are typically open access
- IJHCI via RMIT Taylor & Francis access
- DH via ADHO open access archives

### Step 3: Save in a clean local corpus

Suggested structure:
```
docs/historical-design/corpus/
  chi-2021.bib
  chi-2022.bib
  chi-2023.bib
  chi-2024.bib
  chi-2025.bib
  chi-2026.bib
  dis-2021.bib
  ...
  jocch-2021-2026.bib
  mw-2021-2026.bib
  corpus-index.md
```

### Step 4: Search key terms

Options:
- Simple: `grep` across BibTeX abstract fields
- Better: Python script to parse BibTeX, extract abstracts, count term frequency
- Best: Load into a local vector database (ARCHAI's own Qdrant) and do semantic search over abstracts

The "search your own corpus with your own tools" approach would be a nice PhD meta-move — using ARCHAI's semantic search infrastructure to analyse the research field that ARCHAI contributes to.

### Step 5: Cluster and synthesise

- Group papers by theme (conversational AI, tangible interaction, affect, sovereignty, accessibility, etc.)
- Identify gaps (what is NOT being published about)
- Track vocabulary patterns (what language is the field using vs what ARCHAI uses)
- Write synthesis notes per cluster

### Step 6: Feed back into ARCHAI

Results should inform:
- ARCHAI interface language (use terms the field recognises)
- Prompt design (personality profiles should reflect research on affect and trust)
- PhD writing (literature review, positioning, contribution statements)
- Partnership/funding language (speak the field's language in applications)

---

## 6. Outputs

### Already produced

- [FIELD_SIGNALS_AND_KEY_TERMS.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/historical-design/FIELD_SIGNALS_AND_KEY_TERMS.md) — initial research sweep with 15+ papers, key term map, field signals

### Still needed

| Output | Purpose | Status |
|--------|---------|--------|
| Searchable abstract corpus | Local BibTeX/text files for all target conferences 2021–2026 | Not started — requires RMIT library access sessions |
| Key-term frequency map | Quantitative analysis of term occurrence across corpus | Not started |
| Citation network sketch | Who cites whom, which papers cluster together | Not started |
| Field signals note (expanded) | Deeper analysis of recurring concerns and unmet needs | Partially done in FIELD_SIGNALS doc |
| Vocabulary bridge (expanded) | Full mapping between HCI and GLAM terminology | Partially done in FIELD_SIGNALS doc |
| Gap analysis | Formal identification of what ARCHAI contributes that doesn't exist in the literature | Partially done — needs systematic verification |
| Literature review chapter draft | PhD chapter integrating all of the above | Not started |

---

## 7. Important Caution

This corpus should be used as:

- a research lens
- a language map
- a way of identifying needs and adjacent methods

It should **not** flatten the GLAM field into HCI assumptions, or force museums and collections into generic software language.

ARCHAI sits at the intersection of multiple fields — HCI, heritage studies, museum informatics, design research, AI ethics, and more-than-human design. The corpus plan should respect that multiplicity rather than reducing everything to HCI terminology.
