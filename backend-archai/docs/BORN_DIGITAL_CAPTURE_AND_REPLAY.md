# Born-Digital Capture and Replay

## Purpose

ARCHAI can describe, preserve, and present born-digital works without reducing them to screenshots. A screenshot is useful documentation, but it is not the interactive work.

The system therefore records a work separately from its accessible manifestations.

## Manifestation model

One collection object may have several manifestations:

| Kind | Meaning | Typical access |
|---|---|---|
| `live_external` | Artist- or institution-hosted live work | Link out; embed only with permission |
| `web_archive` | Time-specific interactive web capture | WACZ replay in an isolated viewer |
| `software` | Preserved executable or source package | Staff access or controlled download |
| `emulation` | Software plus a documented runtime environment | Sandboxed emulator session |
| `video` | Approved documentation or walkthrough | ARCHAI media proxy/cache |
| `image` | Screenshot, installation view, or still documentation | ARCHAI image derivative |
| `audio` | Sound component or approved documentation | ARCHAI media proxy/cache |
| `model_3d` | Approved 3D derivative | Sandboxed 3D viewer |
| `document` | Manual, artist statement, score, or technical notes | Document viewer/download |

The visitor interface must label the experience honestly, for example:

- Live work
- Archived interactive capture
- Emulated version
- Video documentation
- Documentation image
- Metadata only

## Rights are manifestation-specific

A public metadata API does not grant permission to copy an image, executable, website, video, or interactive artwork. Each manifestation carries its own rights record:

- status: `cleared`, `restricted`, `review_required`, or `metadata_only`
- permission basis: institution approval, artist permission, open licence, public domain, or contract
- licence and rights holder
- source and credit line
- reviewer and review date
- restrictions or cultural protocol notes

ARCHAI blocks publication unless the manifestation is explicitly `cleared`. A web archive also requires capture provenance.

## Recommended web-art workflow

1. Create or import the canonical collection object.
2. Obtain written permission to capture and replay the work, unless an applicable open licence clearly permits both.
3. Capture the work with self-hosted Browsertrix or an equivalent standards-based tool.
4. Review the capture for completeness, privacy, tracking, external dependencies, and sensitive content.
5. Export a WACZ file and calculate its SHA-256 checksum.
6. Store the preservation package in the institutional DAMS or preservation store.
7. Store an approved access copy in `MEDIA_CACHE_DIR`.
8. Register a `web_archive` manifestation through `POST /api/media/published`.
9. Curatorial or rights staff approve it through the existing publication workflow.
10. Present it with a pinned, self-hosted ReplayWeb.page viewer in an isolated origin.

## Example manifest

```json
{
  "mediaId": "web_echo_circuit_1997_capture_01",
  "objectId": "FAMTEC_1997_0234",
  "kind": "web_archive",
  "manifestationLabel": "Archived interactive capture",
  "storageFilename": "echo-circuit-1997-capture-01.wacz",
  "mimeType": "application/wacz+zip",
  "entryUrl": "https://example.org/echo-circuit/",
  "posterUrl": "/api/media/published/web_echo_circuit_1997_capture_01/poster",
  "rights": {
    "status": "cleared",
    "basis": "artist_permission",
    "rightsHolder": "Example Artist",
    "creditLine": "Captured and replayed with permission of Example Artist",
    "sourceUrl": "https://example.org/echo-circuit/",
    "reviewedBy": "curator@example.org",
    "reviewedAt": "2026-06-22T10:00:00.000Z"
  },
  "capture": {
    "capturedAt": "2026-06-22T09:30:00.000Z",
    "capturedBy": "collections@example.org",
    "captureTool": "Browsertrix",
    "captureToolVersion": "pinned-deployment-version",
    "originalUrl": "https://example.org/echo-circuit/",
    "entryUrl": "https://example.org/echo-circuit/",
    "sha256": "sha256-of-the-wacz",
    "renderingNotes": "Tested in Chromium and Safari; external analytics removed."
  },
  "publishedStatus": "approved"
}
```

## Replay architecture

WACZ is the preferred access package for captured web works because it contains archived resources, indexes, entry pages, and contextual metadata. ReplayWeb.page can request only the required byte ranges rather than downloading a complete capture.

ARCHAI now exposes cleared, published WACZ files at:

```text
GET /api/media/published/:mediaId/archive
```

The production frontend should load that URL using a pinned, self-hosted ReplayWeb.page release. Use its sandbox and subdomain isolation options. Do not run archived JavaScript in the main ARCHAI or AUXIO origin.

Recommended origin split:

```text
archai.institution.example       Main interface
replay.archai.institution.example  Isolated archived-work replay
```

## Preservation storage

The visitor access copy is not the preservation master. Keep:

- original WACZ/WARC and checksums
- crawl logs and quality review
- artist or rights-holder permission
- software/source packages where supplied
- dependency and runtime documentation
- screenshots and video walkthroughs as fallback documentation
- migration/emulation decisions and test results

ResourceSpace can manage access derivatives and documentation. A preservation repository or managed archival storage should retain the preservation package and fixity history.

## Security and privacy

- Capture only with authority and a documented collecting purpose.
- Remove credentials, personal data, analytics, and session tokens.
- Replay archived code in a sandboxed, isolated origin.
- Disable live network access by default during replay.
- Malware-scan software packages before storage and execution.
- Apply file-size, CPU, memory, and session limits to emulation.
- Keep staff-only packages separate from public derivatives.
- Record cultural protocols independently of copyright status.

## Street art and contemporary collections

Street-art platforms are useful discovery and partnership targets, but their maps and photographs must not be harvested merely because they are publicly viewable. Artist rights, photographer rights, property context, platform terms, location sensitivity, and work status may all differ.

The preferred path is:

1. seek a data partnership with the platform, municipality, artist, or commissioning body;
2. ingest metadata under documented terms;
3. ingest only item-level media with an explicit open licence or written permission;
4. preserve creator, photographer, location, date, work status, source, and rights separately;
5. support takedown, changed-status, and disappeared-work records.

Until those conditions are met, street-art targets remain discovery or metadata-only sources, not automatic public-demo harvests.

## Practical next increment

1. Self-host a pinned ReplayWeb.page build under an isolated replay origin.
2. Add a staff form for registering manifestations and reviewing rights.
3. Connect manifests to ResourceSpace rather than runtime memory.
4. Capture one institution-owned or artist-permissioned test work.
5. Test replay, offline behaviour, accessibility, and fallback documentation.
6. Add emulation only after the web-archive workflow is stable.

## Local capture command

For institution-owned, artist-permissioned, openly licensed, or public-domain web works:

```bash
cd backend-archai
./scripts/capture-born-digital.sh \
  --url https://example.org/approved-work \
  --media-id approved_work_capture_01 \
  --object-id COLLECTION_OBJECT_ID \
  --rights-holder "Rights holder name" \
  --rights-basis artist_permission \
  --rights-cleared
```

The script pins Browsertrix Crawler `1.12.4`, creates a WACZ and screenshot, calculates SHA-256, writes a sidecar manifestation, registers it with ARCHAI, and publishes it through the rights gate. It refuses to run unless the operator explicitly supplies `--rights-cleared`.

## Local interactive demo

A rights-safe synthetic CD-ROM-style access-copy demo is registered as:

```text
mediaId: cdrom_window_1997_demo
kind: interactive
play: /api/media/published/cdrom_window_1997_demo/play
source: /born-digital/cdrom-window-1997/index.html
```

It is not a recovered artwork and does not use copied operating-system assets. It exists to demonstrate the manifestation player, sandboxing, and rights-gated publication workflow before connecting real artist- or institution-approved software/media-art access copies.

A first real open-source creative-coding manifestation is also registered:

```text
mediaId: epicycloid_2017_open_demo
kind: interactive
play: /api/media/published/epicycloid_2017_open_demo/play
source: /born-digital/epicycloid-2017-open/index.html
upstream: https://github.com/fepegar/creative-coding
licence: MIT
```

This is not presented as a museum-owned artwork. It is a rights-clean open-source interactive sketch used to test how ARCHAI can preserve attribution, licence, access-copy files, and sandboxed playback for real born-digital/creative-code material.

## WACZ access-copy fallback

Full browser replay is useful, but it should not be the only public access path. During local testing on 23 June 2026, the archived AUXIO and ARCHAI WACZ files loaded in ReplayWeb.page but the embedded replay iframe still reported "Archived Page Not Found" despite valid page metadata, timestamps, WACZ downloads, and screenshot/text records.

ARCHAI now treats WACZ replay in two layers:

```text
Stable access page:
/api/media/published/<mediaId>/replay

Extracted capture screenshot:
/api/media/published/<mediaId>/capture-image

Experimental full ReplayWeb route:
/api/media/published/<mediaId>/replay-web
```

The stable access page displays the verified `urn:view:` screenshot extracted from the WACZ, source URL, rights label, capture timestamp, WACZ download, and a link to the beta ReplayWeb route. This gives curators and visitors a trustworthy access-copy view even when full dynamic browser replay needs further QA.

Keep this distinction in future designs:

- **Access copy:** reliable, rights-cleared, explainable, and available now.
- **Replay/emulation:** powerful but must be tested per object, per browser, and per rights context.
- **Download/package:** available only when the manifestation is cleared and publication policy allows it.

## Specialist media-lab sources

NASA Image and Video Library was tested as a high-value public-media source for video/image playback R&D. ARCHAI ingested a small `archai_nasa` lab collection from the official API, but it is intentionally excluded from the main curator aggregate and public AUXIO generation by default.

Why:

- NASA is valuable for testing video, captions, archival media, and science/technology interpretation.
- NASA is not a museum/gallery collection in the same sense as the GLAM sources that define the public ARCHAI demo.
- NASA media also carries no-endorsement and logo/emblem restrictions that should remain visible in any downstream use.

Use NASA media only as labelled media-lab material, or promote individual records manually when the demo explicitly calls for a science/media playback example. Do not let specialist lab collections auto-flow into the museum/gallery search layer.
