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

The production frontend should load that URL using a pinned, self-hosted ReplayWeb.page release. Use its sandbox and subdomain isolation options. Do not run archived JavaScript in the main ARCHAI or AUX.IO origin.

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
