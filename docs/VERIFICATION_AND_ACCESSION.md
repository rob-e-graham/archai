# Verification layer & accession CMS path

This document describes how ARCHAI distinguishes **what it has heard** from
**what it has confirmed**, and the path by which a confirmed record enters the
archival CMS (CollectiveAccess).

The design principle: *verification is a layer, not a gate on participation.*
Anyone can offer a memory. Nothing enters the archival CMS until the curatorial
and exhibitions team has reviewed it. Visitors always see where a record sits on
that spectrum.

## The three tiers

Object records and community memories share a single verification vocabulary so
the tiers can coexist in one interface without being flattened together:

| Tier | Meaning | `verified` |
|------|---------|-----------|
| `institutional_record` | The museum's own object record | above the line |
| `verified_oral_history` | A community memory the curatorial team has confirmed | above the line |
| `community_response` | Living, unverified community interpretation | below the line |

`verified` is the single boolean visitors read from. A `✓ verified` marker
distinguishes confirmed records and confirmed oral histories from open community
responses on the public "love" pages.

## Data model

Object records (`backend-archai/src/data/mockObjects.js`,
schemas in `src/schemas/objectSchemas.js`) carry two new fields:

```js
verification: {
  tier: 'institutional_record' | 'verified_oral_history' | 'community_response',
  verified: boolean,
  verifiedBy, verifiedAt, method, notes
}
accession: {
  status: 'not_accessioned' | 'ready' | 'accessioned' | 'returned',
  accessionNumber,            // e.g. FAMTEC.2026.0001
  cmsTarget: 'collectiveaccess',
  cmsRecordId,                // mirrors source.collectiveAccessId
  accessionedBy, accessionedAt, notes
}
```

Community comments (`comments` table, `src/data/db.js`) gain `verified`,
`verified_by` and `verified_at` columns. Legacy databases are migrated in place.

## Verification API

`src/services/verificationService.js` · `src/routes/verification.js`

- `GET  /api/verification/summary` — tier/verified counts across the collection.
- `POST /api/verification/set` *(curator)* — move a record across the line:
  `{ objectId, tier?, verified?, method?, notes? }`.
- `PATCH /api/comments/:id/verify` *(curator)* — confirm a visible community
  memory into a verified oral history: `{ verified: true|false }`.

Records without a `verification` field fall back to a safe default:
a published record is treated as a confirmed institutional record; anything
still in draft/review is unverified.

## Accession CMS path

`src/services/accessionService.js` · `src/routes/accession.js`

Accession is the explicit, enforced path a record travels to become a permanent
record in the archival CMS. A single gate keeps the path legible:

> **A record is only accessioned once it is BOTH verified AND curatorially
> approved (`workflow.state` in `approved` or `published`).**

- `GET  /api/accession/queue` *(collections)* — records that are verified +
  approved and waiting to be committed.
- `GET  /api/accession/:id` *(collections)* — readiness and blockers for one
  record (`not_verified`, `workflow_<state>`, `already_accessioned`).
- `POST /api/accession/commit` *(curator)* — commit a ready record:
  - assigns an accession number (`FAMTEC.<year>.<seq>`),
  - assigns / reuses the CollectiveAccess record id and writes it back onto
    `source.collectiveAccessId` so provenance travels with the record,
  - sets `accession.status = 'accessioned'` and writes an audit entry.

Attempting to commit an unverified or unapproved record returns `409` with the
list of blockers — the path fails loudly rather than silently admitting
unconfirmed data into the CMS.

## Tests

```bash
cd backend-archai
npm run test:verification   # standalone, no server/db required
```

`scripts/test-verification-accession.js` exercises the summary, the accession
gate (unverified → blocked), the queue, a successful commit (accession number +
CMS id write-back), and the full verify → approve → accession path.
