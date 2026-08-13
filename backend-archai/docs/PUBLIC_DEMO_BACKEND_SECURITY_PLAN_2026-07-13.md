# Public Demo Backend Security Plan

Date: 2026-07-13

Scope: public ARCHAI demo at `fineartmedia.tech/app` using `archai-api.fineartmedia.tech` through Cloudflare tunnel.

This is an operational plan, not a claim that the backend is production-secure.

## Current Posture

The public app is intentionally exposed for outreach, but the backend is still a research prototype. The current protection model is:

- public traffic is detected in `requestContext.js`
- public traffic is pinned to the `demo` role
- `publicDemoGuard.js` blocks all public API routes except an explicit allowlist
- rate limiting exists for proxy/search/chat routes
- staff routes are expected to be used over localhost/Tailscale/private network unless a staff key is configured

Current public health as of the outreach review:

```text
objects: 3804
vectors: 6951
qdrant: live
ollama: online
```

## Public Allowlist

Currently allowed for public/demo traffic:

- `GET /api/health`
- `GET /api/proxy/qdrant/health`
- `GET /api/proxy/ollama/health`
- `POST /api/proxy/qdrant/scroll`
- `POST /api/proxy/qdrant/search`
- `POST /api/proxy/qdrant/info`
- `POST /api/proxy/curator/converse`
- `POST /api/proxy/curator/search`
- `POST /api/proxy/chat`
- `POST /api/proxy/embed`
- `GET /api/nfc/tags`
- `GET /api/nfc/tags/:tagId`
- `GET /api/nfc/pages/:tagId`
- `GET /api/nfc/published/*`
- `POST /api/nfc`
- `GET /api/comments`

Important tension:

- The banner says "read-only public demo".
- `POST /api/nfc` is a public write route for Make-AUXIO demos.

This is acceptable only as a temporary sandbox feature if it remains low-risk, escaped, non-source-mutating, and easy to clean up. It is not compatible with a strict read-only security claim.

## Outreach-Day Rules

For 2026-07-14 outreach:

1. Keep `ARCHAI_PUBLIC_LOCKDOWN` on.
2. Do not expose Directus, Qdrant dashboard, Ollama, or admin routes publicly.
3. Do not add new public write routes.
4. Do not run harvesters or curator rebuilds during active outreach unless the app is already broken.
5. If the backend dies, restart the LaunchAgent rather than running loose background processes.
6. Prefer linking to `/archai` first; use `/app` as the live demo.

## Immediate P1/P2 Work

### P1: Make the public claim match the backend behavior

Choose one:

1. Strict read-only demo:
   - remove public `POST /api/nfc`
   - update app UI so public visitors cannot create AUXIO records
   - keep Make-AUXIO available only on private/staff traffic

2. Public sandbox demo:
   - keep `POST /api/nfc`
   - change banner copy from "read-only" to "public sandbox demo"
   - add cleanup/expiry for demo-created tags
   - add per-IP/per-session write throttling
   - add audit summary for demo-created objects

Recommendation for outreach: keep current behavior for now, but avoid talking about public editing. For production/pilot: implement option 1 unless a partner explicitly wants a public sandbox.

### P2: Replace role headers with real sessions

Current limitation:

- `x-archai-role` is a convenience header, not real auth.
- Public traffic is pinned to `demo`, which helps, but private/staff traffic still trusts a client-controlled role header.

Minimum next step:

- server-side signed session token
- named users
- session expiry
- role stored server-side or in signed token
- deny-by-default if no valid session
- staff override key only for emergency/admin use, rotated regularly

### P2: Split public and staff API surfaces

Recommended shape:

- `/api/public/*`: public demo routes only
- `/api/staff/*`: authenticated staff routes
- `/api/admin/*`: authenticated admin routes

This makes accidental route exposure easier to see in code review.

### P2: Harden write routes

Routes requiring real auth before partner pilot:

- object create/update
- upload routes
- workflows
- media publish/unpublish
- pipeline/nightly sync triggers
- webhooks admin/event review
- FAMTEC posts/uploads/imports
- comments posting if shown publicly
- Make-AUXIO if not explicitly public sandbox

For each route:

- validate input with schema
- require session role
- write audit log
- rate limit writes
- test public 403

### P2: Operational restart checklist

Known failure from 2026-07-13:

- Cloudflare returned `502`
- backend LaunchAgent was not running
- Qdrant and data were OK

Recovery:

```bash
launchctl kickstart -k gui/$(id -u)/com.famtec.archai-backend
curl -s --max-time 20 https://archai-api.fineartmedia.tech/api/health
```

If Qdrant is unreachable:

```bash
open -a Docker
docker start archai_qdrant
curl -s http://localhost:6333/collections
```

Do not rely on `docker ps` health for Qdrant until the healthcheck is fixed; the current image does not include `curl`.

### P3: Fix Qdrant healthcheck

Current issue:

- Docker marks `archai_qdrant` unhealthy.
- REST is working.
- Healthcheck fails because it executes `curl` inside the container.

Fix options:

- use an image/tooling that contains `curl`
- use Qdrant's supported health endpoint from host-side watchdog instead of container healthcheck
- remove misleading Docker healthcheck and document host health check

## Verification Commands

Public API:

```bash
curl -s --max-time 20 https://archai-api.fineartmedia.tech/api/health \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["ok"], d["counts"]["totalVectors"], d["integrations"]["qdrant"]["mode"], d["integrations"]["ollama"]["online"])'
```

Expected:

```text
True 6951 live True
```

Public search:

```bash
curl -s --max-time 30 -X POST https://archai-api.fineartmedia.tech/api/proxy/curator/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"painting","limit":3}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("ok"), len(d.get("results", [])))'
```

Expected:

```text
True 3
```

Public AUXIO tag metadata:

```bash
curl -s --max-time 20 https://archai-api.fineartmedia.tech/api/nfc/tags \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("ok"), len(d.get("tags", [])))'
```

Expected current runtime:

```text
True 4
```

Static generated AUXIO page:

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' --max-time 20 https://archai-api.fineartmedia.tech/aux/NFC120.html
```

Expected:

```text
200 text/html; charset=UTF-8
```

Public blocked route spot check:

```bash
curl -s -i --max-time 20 https://archai-api.fineartmedia.tech/api/admin/users | head
```

Expected:

- HTTP `403`
- JSON error with `demo_read_only`

## Pilot Readiness Gate

Before an RMIT or partner pilot, do not rely on the current demo guard alone. Minimum pilot gate:

- authenticated staff sessions
- public/staff route split
- no public write routes unless explicitly sandboxed
- persistent audit log for all writes
- documented takedown/correction process
- ICIP/cultural protocol gate before public exposure
- backup/recovery checklist tested
- health monitor or Huggle alarm for backend/Qdrant failures

## Huggle Coordination

Use Huggle before security-related edits:

1. Read `#archai` and `#planning`.
2. Claim exact files.
3. Post planned public-surface change.
4. Test public allowed and blocked routes.
5. Post summary and release claim.

Security changes should not be mixed with visual/UI cleanup in the same commit.

