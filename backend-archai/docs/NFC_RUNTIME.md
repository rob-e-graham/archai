# NFC Runtime Pages (Local HDMI / Fullscreen)

## Short answer

Yes: the NFC/visitor pages can run as local fullscreen browser pages on HDMI-attached displays and kiosks.

## Recommended NFC runtime models

1. Visitor mobile tap flow (most common)
- NFC tag encodes URL such as `/api/nfc/pages/NFC-002` or a web app route `/nfc/NFC-002`
- Visitor phone opens a lightweight page for that object
- Chat requests call local ARCHAI backend (`/api/chat/object`)

2. Local HDMI kiosk flow (gallery kiosk / wall display)
- Mini PC or local thin client connected via HDMI
- Browser launched in kiosk/fullscreen mode
- Opens a local URL (e.g. `http://archai.local/kiosk/hall3`)
- Kiosk polls local state or uses WebSocket later for live updates
- NFC reader attached by USB triggers object page changes or modal overlays

3. Robot/plinth attached display flow
- Dedicated runtime page for a specific object/device
- Fullscreen local browser page renders object media + chat + status light
- Reads only approved/published interpretation payloads

## Why local fullscreen browser pages are a good fit

- Fast to iterate (HTML/CSS/JS)
- Easy to style consistently with ARCHAI UI
- Works on commodity mini PCs
- Keeps data on local network
- Simple failover (reload browser, swap machine, cached assets)

## Practical deployment notes

- Use a local DNS name: `http://archai.local`
- Pre-cache core CSS/JS/media for resilience
- Force browser kiosk mode and auto-restart on boot
- Add watchdog service to reload page if no heartbeat
- Keep NFC page content read-only from published CMS/API endpoints

## Video playback on NFC visitor pages (important)

## Short answer

Yes, NFC visitor pages can play videos sourced from ResourceSpace, but production pages should usually **play via ARCHAI media proxy/cache endpoints**, not direct public DAMS URLs.

## Recommended playback path (production)

1. ResourceSpace stores canonical video assets + derivatives
2. ARCHAI sync/publish step records approved playback derivatives (MP4/HLS) and metadata
3. NFC page requests object page model from ARCHAI (`/api/nfc/tags/:tagId`)
4. Page model includes a `publishedMedia[]` entry (poster, video URL, caption, rights flags)
5. NFC page `<video>` player loads the ARCHAI-served URL (local LAN)
6. ARCHAI either:
   - redirects to an approved local ResourceSpace derivative URL, or
   - proxies/streams the derivative, or
   - serves a cached copy on local storage (best for reliability)

## Why not direct ResourceSpace URLs in the NFC page?

- avoids exposing DAMS internal URL structure/keys
- allows access control and rights checks per published object
- supports local caching for smoother playback on kiosks
- lets ARCHAI switch between RS, cache, or CDN later without changing NFC page code

## Recommended video formats for kiosks / visitor pages

- `MP4 (H.264/AAC)` for broad browser support
- `HLS (.m3u8)` for longer works / adaptive streaming (optional next phase)
- poster image (`jpg/webp`) for quick load before playback
- caption/subtitle track (`.vtt`) where available

## ResourceSpace integration pattern

- Use ResourceSpace as the DAMS source of truth for the master file and derivatives
- Publish only an approved derivative for visitor playback (not preservation master)
- Store in ARCHAI page model:
  - `resourceSpaceId`
  - `playbackUrl` (ARCHAI URL)
  - `posterUrl`
  - `duration`
  - `autoplayMuted` (kiosk policy)
  - `loop`
  - `rightsLabel`
  - `captionsUrl` (optional)

## Kiosk / HDMI playback behavior (recommended defaults)

- `autoplay muted` = `true` for shared gallery spaces
- `controls` = `true` on touch kiosks, `false` on passive displays
- `preload=\"metadata\"` for bandwidth balance
- graceful fallback to poster + text if video unavailable
- heartbeat/watchdog to reload on stalled playback

## Offline / local network resilience

- For critical installations, cache playback derivatives on the local ARCHAI host/NAS
- NFC page should prefer local cached URL, then fallback to ResourceSpace derivative if allowed
- Log playback failures to Nodel/AV health endpoint for technician review

## In this scaffold

- `GET /api/nfc/pages/:tagId` returns a fullscreen-friendly HTML page now
- `GET /api/nfc/tags/:tagId` returns JSON page model for future frontend templates

## Next production step

Move from server-rendered inline HTML to a dedicated `nfc-pages/` frontend bundle that consumes `/api/nfc/tags/:tagId`, `/api/chat/object`, and a published media playback endpoint (e.g. `/api/media/published/:mediaId/stream`).
