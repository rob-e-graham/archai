# ARCHAI R&D Note — 2026-06-04

## Why this note exists

This is a practical research note for the next stage of ARCHAI.

The goal is not to turn ARCHAI into a generic collections management system or a generic DAM. The stronger direction is:

- keep raw source records intact
- keep a clean canonical metadata layer
- keep legal / rights logic explicit
- let ARCHAI and AUX.IO operate above that as semantic, interpretive, and accessible interfaces

ARCHAI should be a **sovereign semantic layer for collections**, not a clumsy replacement for every existing museum system.

## Core finding

The market is already full of systems that do parts of this well:

- collections management
- digital asset management
- preservation
- IIIF delivery
- born-digital conservation
- web archiving
- emulation

ARCHAI becomes stronger when it **integrates with these patterns** rather than trying to imitate all of them at once.

## What established systems do well

### 1. Collections management systems

These are strongest at documentation, object history, procedures, and internal control.

#### CollectionSpace

- open-source collections management system used by museums and cultural heritage organisations
- includes API access, CSV import, self-hosting documentation, and a Data Preparedness Framework
- current public documentation notes that the 8.3 release is focusing on search and search-result improvements
- important signal for ARCHAI: data governance and migration readiness matter as much as the interface

Why it matters to ARCHAI:

- ARCHAI should be able to read from systems like this cleanly
- the "canonical object record" in ARCHAI should feel compatible with this level of documentation discipline
- NAGPRA / cultural protocol support is a serious benchmark, not a side feature

Sources:

- https://collectionspace.org/
- https://collectionspace.org/documentation/

#### EMu (Axiell)

- enterprise museum collections management system
- supports broad museum workflows and aligns with SPECTRUM-oriented documentation practice
- includes IMu for web publishing

Why it matters to ARCHAI:

- many museums already live inside systems like EMu
- ARCHAI should assume it is a semantic / interpretive layer above institutional catalogues, not a forced replacement

Sources:

- https://help.emu.axiell.com/v5.1/en-US/Topics/EMu/The%20EMu%20Museum%20Collection%20Management%20System.htm
- https://help.emu.axiell.com/v6.4/en/Topics/EMu/Collections%20Management.htm

#### CollectiveAccess

- open-source collections management and presentation platform
- Providence is the cataloguing layer
- Pawtucket is the public presentation layer
- supports GraphQL, IIIF, OAI-PMH, and legacy JSON APIs

Why it matters to ARCHAI:

- this is very close to the split ARCHAI wants:
  - structured cataloguing layer
  - public presentation layer
  - interoperable APIs
- ARCHAI should borrow the principle, but keep its own strength in semantic interpretation and conversational access

Sources:

- https://manual.collectiveaccess.org/intro/whatIs.html
- https://manual.collectiveaccess.org/providence/developer/web_api.html

#### Omeka S

- strong for public-facing digital collections, exhibitions, and lightweight REST access
- IIIF Presentation module and IIIF Server module are mature and practical
- supports Mirador in core and external IIIF media

Why it matters to ARCHAI:

- useful model for public discovery and exhibition publishing
- especially relevant if ARCHAI later needs lightweight institution-facing publishing tools or interpretation overlays

Sources:

- https://omeka.org/s/docs/developer/api/
- https://omeka.org/s/docs/user-manual/modules/iiifpresentation/
- https://omeka.org/s/modules/IiifServer/

### 2. DAM and preservation systems

These are strongest at media handling, permissions, workflows, and long-term survivability.

#### ResourceSpace

- open-source DAM with REST API
- rights metadata, workflow states, AI features, and museum integrations
- publicly states integration paths with TMS, EMu, MuseumPlus, and IIIF

Why it matters to ARCHAI:

- useful reference for the **media layer**
- rights, permissions, and asset workflows need to be treated separately from the object record
- ARCHAI should not flatten media and metadata into one blob

Sources:

- https://www.resourcespace.com/index
- https://www.resourcespace.com/knowledge-base/api/
- https://www.resourcespace.com/faq

#### Preservica

- strong active digital preservation platform
- focuses on long-term readability, integrity, authenticity, and retrieval
- especially relevant where files must survive format obsolescence

Why it matters to ARCHAI:

- ARCHAI should preserve provenance and derivative history
- if born-digital, video, old operating systems, and software-based art become a major part of the project, preservation workflows need to be first-class

Sources:

- https://preservica.com/
- https://preservica.com/about

### 3. IIIF and media delivery

These are strongest at image access, manifests, viewers, zoom, and interoperability.

#### IIIF

- core standards: Image API 3.0, Presentation API 3.0, Content Search API 2.0, Change Discovery API, Authorization Flow
- already widely used across museums and research platforms

Why it matters to ARCHAI:

- ARCHAI should consume IIIF when available
- later, ARCHAI should probably emit IIIF manifests or compatible structures for enriched records
- IIIF is the cleanest route to deep zoom, multipage records, annotation, and viewer interoperability

Source:

- https://iiif.io/api

#### Cantaloupe

- high-performance IIIF image server
- supports derivatives, zoom, scaling, redaction, watermarking, and access control

Why it matters to ARCHAI:

- ideal reference if institutions want local sovereign media delivery
- especially useful if ARCHAI becomes a viewer over local high-resolution media

Source:

- https://cantaloupe-project.github.io/

#### Mirador

- configurable IIIF viewer for comparison, annotation, and metadata-rich viewing

Why it matters to ARCHAI:

- useful model for curator-side comparison workflows
- could later complement ARCHAI rather than being replaced by it

Source:

- https://projectmirador.org/index.html

## Born-digital, web art, software art, and legacy systems

This is where ARCHAI can become genuinely distinctive if handled carefully.

### Rhizome and ArtBase

- Rhizome’s ArtBase is a major born-digital art archive
- it includes online works, software, videogames, poetry, electronic literature, and moving images
- important legal note: unless a work explicitly states otherwise, ArtBase works are presumed copyrighted to the artist

Why it matters to ARCHAI:

- Rhizome is a model for *preservation practice*, not automatically a harvestable public media source
- ARCHAI should learn from this domain, but should not assume born-digital art is open just because it is online

Sources:

- https://artbase.rhizome.org/wiki/FAQ
- https://rhizome.org/preservation-services/

### Browsertrix / ArchiveWeb.page / Webrecorder

- Browsertrix is a strong modern platform for archiving dynamic web content
- ArchiveWeb.page captures websites locally in the browser and exports WARC / WACZ
- Webrecorder / Rhizome work remains highly relevant as a preservation approach for dynamic web-native culture

Why it matters to ARCHAI:

- this is the right toolset for preserving web-native exhibitions, artist websites, dynamic documentation, and social media-based work
- instead of pretending that screenshots are enough, ARCHAI can eventually preserve:
  - live web captures
  - replay packages
  - browser context
  - related metadata

Sources:

- https://webrecorder.net/browsertrix
- https://webrecorder.net/archivewebpage/

### EaaSI / emulation direction

- the Software Preservation Network’s EAASI Research Alliance is an active community around emulation-based access to software collections
- Rhizome preservation services also explicitly support legacy software environments and old browsers / plugins

Why it matters to ARCHAI:

- for old OS snapshots, software art, CD-ROMs, Flash, web art, kiosk works, and legacy browser experiences, ARCHAI will eventually need:
  - a software environment record
  - a capture / emulation record
  - a public replay strategy

Source:

- https://www.softwarepreservationnetwork.org/eaasi-research-alliance/

### Variable Media

- the Guggenheim’s Variable Media Initiative remains one of the clearest conceptual models for preserving media-based and performative work
- it focuses on behaviours and acceptable change, not just components

Why it matters to ARCHAI:

- this is philosophically aligned with the idea that an object record may need:
  - fixed metadata
  - media assets
  - behavioural instructions
  - installation notes
  - reinterpretation / migration rules

Source:

- https://www.guggenheim.org/conservation/the-variable-media-initiative

## Speech, accessibility, and conversational interfaces

### Whisper

- OpenAI Whisper remains a strong speech-to-text baseline
- multilingual recognition, translation, and language identification make it relevant for museums and multilingual visitor contexts

Source:

- https://github.com/openai/whisper

### whisper.cpp

- very strong local / edge deployment option
- especially relevant for Apple Silicon, kiosk hardware, and offline systems

Source:

- https://github.com/ggml-org/whisper.cpp

### Coqui TTS

- useful path for richer multilingual speech output
- XTTS-v2 supports multiple languages and voice cloning scenarios

Important caution:

- voice cloning should be treated very carefully in museums
- neutral accessibility narration is safer than theatrical or mimetic “object voices” unless clearly framed

Source:

- https://docs.coqui.ai/en/stable/models/xtts.html

### Piper

- strong lightweight local TTS fallback
- likely better for low-overhead deployment than a heavier voice stack

Source:

- https://github.com/rhasspy/piper

## Open data and international collection growth

### Current strongest open / semi-open directions for ARCHAI

- Te Papa API
- M+ API
- Brasiliana Museus
- Smithsonian Open Access
- Europeana with hard item-level legal gates

### Important legal and operational notes

#### Te Papa

- metadata is CC BY 4.0
- image rights vary per item

Source:

- https://data.tepapa.govt.nz/docs/

#### M+

- metadata/open data direction is strong
- API uses GraphQL
- M+ asks users not to cache or store returned content for more than two weeks without refreshing

This is important:

- ARCHAI should review its M+ refresh / retention behaviour against these terms

Sources:

- https://api.mplus.org.hk/
- https://api.mplus.org.hk/en/documentation/termsofuse

#### Brasiliana Museus

- strongly open-data friendly
- metadata and images are available
- but reproduction conditions should still be checked per item

Source:

- https://brasiliana.museus.gov.br/dados-abertos/

#### Smithsonian Open Access

- very important target for modern open 2D, 3D, and cross-disciplinary content
- CC0 for open access assets
- also useful because it includes 3D and some non-traditional collection types

Sources:

- https://www.si.edu/openaccess
- https://www.si.edu/openaccess/faq

## What ARCHAI should add next

### 1. A proper media asset layer

Every object should support multiple assets, not just one image.

Suggested asset types:

- primary image
- gallery image
- deep zoom / IIIF image
- audio
- video
- transcript
- captions / subtitles
- 3D model
- IIIF manifest
- web capture (WARC / WACZ)
- software environment snapshot
- emulation profile
- PDF / wall text / installation file
- map / floorplan / spatial anchor

Each asset should have:

- asset type
- source URL
- local URL
- legal status
- attribution rule
- language
- alt text / caption
- checksum
- derivative status
- publication status

### 2. A work / asset / variant model

This becomes essential for born-digital and media-based art.

Suggested split:

- `work`
- `object record`
- `asset`
- `variant`
- `capture`
- `environment`

That allows:

- one artwork with multiple media manifestations
- one born-digital work with multiple emulation targets
- one web artwork with repeated archival captures over time

### 3. IIIF-aware enrichment

ARCHAI should:

- harvest and preserve IIIF manifest URLs when present
- ingest IIIF metadata cleanly
- later expose enriched IIIF manifests or compatible structures

### 4. Rights gate by asset, not just by object

This is crucial.

Object metadata may be public-safe while a media asset is not.

ARCHAI should keep:

- object-level legal status
- asset-level legal status
- a strict publish gate for public demo layers like AUX.IO

### 5. Accessibility as a first-class feature

Not an afterthought.

Priority path:

- speech-to-text for input
- read-aloud for replies
- transcripts saved with interaction provenance
- language-aware playback
- simple / learning / curatorial / interpretive tone controls

### 6. A born-digital preservation pilot

ARCHAI should run one focused pilot around born-digital material instead of trying to solve everything at once.

Best first pilot:

- one web-native artwork or historical web exhibition
- one software-based artwork or legacy digital object
- one piece with video / transcript / interaction history

That would test:

- capture
- replay
- metadata
- legal status
- interpretive layer
- visitor access

## Recommended architecture direction

### ARCHAI should become:

- a semantic discovery layer
- an interpretation layer
- a public / staff interaction layer
- a provenance-aware publication layer

### ARCHAI should not try to become all at once:

- a full enterprise CMS replacement
- a full DAM replacement
- a full preservation repository replacement
- a full IIIF server replacement

Instead:

- integrate with CMS patterns
- integrate with DAM patterns
- integrate with IIIF
- integrate with preservation workflows
- differentiate through semantic interpretation, conversational access, multilingual layers, and sovereignty

## Best next steps

### Immediate

1. formalise the `asset` schema in the canonical layer
2. add per-asset legal status and publication status
3. review M+ refresh / retention compliance
4. add Smithsonian Open Access as a high-priority future onboarding target

### Near-term

1. replace browser speech demo with Whisper / whisper.cpp + local TTS path
2. preserve IIIF manifest links wherever available
3. prototype one born-digital / web archive object type

### Strategic

1. keep AUX.IO as the accessible visitor surface
2. keep ARCHAI as the curator / collections / interpretation layer
3. make both read from the same clean canonical data and asset graph

## Bottom line

The research supports the direction you are already moving toward:

- clean metadata
- explicit rights
- semantic interpretation
- media-rich object records
- multilingual access
- born-digital readiness
- sovereign local infrastructure

That combination is not common, and it is the part worth building carefully.
