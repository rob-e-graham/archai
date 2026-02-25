# FAMTEC Exchange Workflows (Institution Upload / Posting)

This backend now includes a baseline FAMTEC module suitable for demonstrating how other organisations join and post to the exchange.

## Main entities

- `institutions`
- `posts` (hardware available, skills available, hardware request, skills request, question)
- `threads` + `messages`
- `enquiries` (booking/contact requests)
- `uploads` (attachment upload placeholder / presign stub)
- `moderation queue`

## Recommended institution onboarding flow

1. Create institution profile (`POST /api/famtec/institutions`)
2. Admin verifies institution (`POST /api/famtec/institutions/:id/verify`)
3. Institution staff create posts (`POST /api/famtec/posts`)
4. Curator/admin can publish if moderation required (`POST /api/famtec/posts/:id/publish`)
5. Other institutions send enquiries (`POST /api/famtec/posts/:id/enquiry`)

## Posting methods supported in scaffold

### Web form / UI quick-post
Used in `ARCHAI_v6.html` FAMTEC tab via backend calls.

### CSV import (preview)
- `POST /api/famtec/import/csv`
- Current behavior: parses CSV and returns preview rows + headers
- Next step: column mapping + confirm import

### Attachment upload placeholder
- `POST /api/famtec/uploads/presign`
- Returns local placeholder upload instructions
- Next step: wire to object storage or FAMTEC file service

## Endpoints (baseline)

- `GET /api/famtec/institutions`
- `POST /api/famtec/institutions`
- `POST /api/famtec/institutions/:id/verify`
- `GET /api/famtec/posts`
- `POST /api/famtec/posts`
- `PATCH /api/famtec/posts/:id`
- `POST /api/famtec/posts/:id/publish`
- `GET /api/famtec/moderation/queue`
- `POST /api/famtec/posts/:id/enquiry`
- `GET /api/famtec/enquiries`
- `GET /api/famtec/threads`
- `POST /api/famtec/threads`
- `GET /api/famtec/threads/:id/messages`
- `POST /api/famtec/threads/:id/messages`
- `POST /api/famtec/uploads/presign`
- `GET /api/famtec/uploads`
- `POST /api/famtec/import/csv`

## Demo notes

- ARCHAI `v6` FAMTEC tab now attempts to use these endpoints when backend is running on `http://localhost:8787`.
- UI still falls back to local mock data if backend is unavailable.
- Production FAMTEC should remain a separate hosted app/service with its own database and auth.
