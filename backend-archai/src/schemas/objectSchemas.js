import { z } from 'zod';

export const mediaRightsSchema = z.object({
  status: z.enum(['cleared', 'restricted', 'review_required', 'metadata_only']).default('review_required'),
  basis: z.enum([
    'institution_approved',
    'artist_permission',
    'open_licence',
    'public_domain',
    'contract',
    'unknown',
  ]).default('unknown'),
  licence: z.string().optional().nullable(),
  rightsHolder: z.string().optional().nullable(),
  creditLine: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  reviewedBy: z.string().optional().nullable(),
  reviewedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).default({});

export const captureProvenanceSchema = z.object({
  capturedAt: z.string(),
  capturedBy: z.string(),
  captureTool: z.string(),
  captureToolVersion: z.string().optional().nullable(),
  originalUrl: z.string(),
  entryUrl: z.string().optional().nullable(),
  sha256: z.string().optional().nullable(),
  renderingNotes: z.string().optional().nullable(),
}).optional().nullable();

export const publishedMediaSchema = z.object({
  mediaId: z.string(),
  objectId: z.string(),
  kind: z.enum([
    'image',
    'video',
    'audio',
    'interactive',
    'html',
    'document',
    'model_3d',
    'software',
    'web_archive',
    'emulation',
    'live_external',
  ]),
  manifestationLabel: z.string().optional().nullable(),
  resourceSpaceId: z.string().optional().nullable(),
  playbackUrl: z.string().optional().nullable(),
  archiveUrl: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  entryUrl: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  thumbUrl: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  storageFilename: z.string().optional().nullable(),
  byteSize: z.number().int().nonnegative().optional().nullable(),
  durationSeconds: z.number().optional().nullable(),
  captionsUrl: z.string().optional().nullable(),
  rightsLabel: z.string().optional().nullable(),
  rights: mediaRightsSchema,
  capture: captureProvenanceSchema,
  publishedStatus: z.enum(['draft', 'approved', 'published']).default('draft'),
  autoplayMuted: z.boolean().default(true),
  loop: z.boolean().default(false),
  // Born-digital / interactive works
  // interactiveUrl: local path (/born-digital/WORK_ID/index.html) or external URL
  //   rendered as a sandboxed <iframe> in the AUXIO visitor page
  interactiveUrl: z.string().optional().nullable(),
  // archiveSource: path or URL to a WARC file — replayed via ReplayWeb.page
  archiveSource: z.string().optional().nullable(),
  // archiveSeedUrl: the original URL to navigate to within the WARC replay
  archiveSeedUrl: z.string().optional().nullable(),
});

export const objectWorkflowSchema = z.object({
  state: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
  assignedRole: z.enum(['collections', 'curator', 'admin', 'technician']).optional().nullable(),
  notes: z.string().default(''),
  updatedBy: z.string().default('system'),
  updatedAt: z.string(),
});

// Verification tier — the layer that lets a record, an oral history and an open
// community response coexist in one interface without being flattened together.
//   institutional_record  — the museum's own object record
//   verified_oral_history — a community memory the curatorial team has confirmed
//   community_response    — living, unverified community interpretation
// `verified` is the single line visitors read from: institutional records and
// confirmed oral histories sit above it, community responses below it.
export const objectVerificationSchema = z.object({
  tier: z.enum(['institutional_record', 'verified_oral_history', 'community_response']).default('institutional_record'),
  verified: z.boolean().default(false),
  verifiedBy: z.string().optional().nullable(),
  verifiedAt: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  notes: z.string().default(''),
});

// Accession — the path a verified record travels to enter the archival CMS
// (CollectiveAccess). A record is never accessioned until it is both verified
// and curatorially approved; that gate is what keeps "what we've heard" separate
// from "what we've confirmed".
export const accessionSchema = z.object({
  status: z.enum(['not_accessioned', 'ready', 'accessioned', 'returned']).default('not_accessioned'),
  accessionNumber: z.string().optional().nullable(),
  cmsTarget: z.enum(['collectiveaccess']).default('collectiveaccess'),
  cmsRecordId: z.string().optional().nullable(),
  accessionedBy: z.string().optional().nullable(),
  accessionedAt: z.string().optional().nullable(),
  notes: z.string().default(''),
});
