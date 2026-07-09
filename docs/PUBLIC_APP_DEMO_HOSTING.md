# Public ARCHAI App Demo Hosting

**Status:** Proposed deployment architecture  
**Updated:** 23 June 2026  
**Purpose:** Host a credible ARCHAI work-in-progress demo without exposing staff, publishing, ingestion, or infrastructure controls.

## Decision

Do not publish the current staff application and backend unchanged.

The website demo at `fineartmedia.tech/archai` should remain the public entry point. A separate read-only application build can later be hosted at a dedicated address such as `demo.archai.fineartmedia.tech` or `app.fineartmedia.tech`.

The existing staff application should remain protected by Tailscale, a private institutional network, or Cloudflare Access until real authentication and server-side authorisation are complete.

## Why the Current Staff Build Is Not Public-Safe

The prototype middleware in `backend-archai/src/middleware/requestContext.js` currently assigns the `admin` role when no role header is supplied. The interface also exposes operational concepts including collection editing, AUXIO publishing, harvesting, batch actions, infrastructure controls, and service administration.

A client-side role selector is useful for prototyping, but it is not an access-control boundary. Public hosting requires identity and permissions to be enforced by the server.

## Recommended Three-Layer Deployment

### 1. Public Website Demo

Address: `fineartmedia.tech/archai`

- Search all connected sources or focus on one source.
- Show only media that passes the public rights and image-health gates.
- Offer grounded whole-collection conversation with staff response lenses.
- Offer optional browser speech input and text-to-speech.
- Link directly to the AUXIO visitor experience.
- State clearly that this is a research demo and that source inclusion does not imply endorsement.

### 2. Read-Only App Demo

Suggested address: `demo.archai.fineartmedia.tech`

- Reuse the visual language of the staff application.
- Lock the application to a non-privileged `demo` role.
- Remove or disable editing, publishing, batch tagging, harvesting, deletion, service controls, and emergency controls.
- Use a separate API key or session with read-only server permissions.
- Use a separate demo database or read-only replica where practical.
- Reset any visitor-created state on a schedule.
- Display a persistent `Research prototype - read-only demo` banner.

### 3. Protected Staff App

Suggested address: `staff.archai.fineartmedia.tech`

- Require Tailscale, institutional VPN, or Cloudflare Access.
- Require authenticated named users.
- Enforce server-side role-based access control.
- Record publishing, metadata, and pipeline actions in an audit log.
- Keep Directus, Qdrant, Ollama, and operational endpoints off the public network.

## Public API Allowlist

The public website and read-only demo should expose only purpose-built routes for:

- Sanitised health and public counts.
- Semantic search over approved public fields.
- Grounded collection conversation with rate limits.
- Published AUXIO pages and approved media.
- Public source, attribution, and legal-status information.
- Optional anonymous feedback through a moderated endpoint.

The public gateway must block arbitrary Qdrant proxying, collection scrolling, curator-index builds, harvesters, pipeline execution, publish or unpublish actions, batch editing, Directus administration, audit administration, and raw infrastructure controls.

## Required Controls

- Replace the default-admin request context with deny-by-default authentication.
- Validate authorisation on every protected backend route.
- Apply per-IP and per-session rate limits to search, conversation, and speech-related services.
- Restrict CORS to the intended public and staff origins.
- Add Content Security Policy, frame policy, and secure response headers.
- Keep secrets and API keys server-side.
- Validate and sanitise model, metadata, and user-generated output before rendering.
- Preserve item-level source, attribution, legal status, and public-display decisions.
- Monitor uptime, latency, model availability, and public error rates without exposing private collection data.

## Delivery Phases

1. **Current:** Use the integrated website demo and published AUXIO pages.
2. **Read-only build:** Create a separate public app shell with only search, object detail, conversation, vocabulary preview, and AUXIO preview.
3. **Gateway:** Add explicit public API routes and deny all operational routes by default.
4. **Authentication:** Add named staff accounts and server-side roles.
5. **Pilot:** Deploy with one partner institution on a private network before wider public hosting.

## Public Launch Checklist

- Unauthenticated requests never receive staff or admin privileges.
- Every public route has an explicit allowlist entry and rate limit.
- No public interface can write to source metadata or publishing state.
- Restricted or unavailable media is not rendered as public display media.
- Search, conversation, AUXIO, speech, and offline states are tested on desktop and mobile.
- The demo banner, research status, source acknowledgement, and rights language are visible.
- A rollback procedure and current backup are documented and tested.

