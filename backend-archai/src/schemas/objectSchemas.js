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
});

export const objectWorkflowSchema = z.object({
  state: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
  assignedRole: z.enum(['collections', 'curator', 'admin', 'technician']).optional().nullable(),
  notes: z.string().default(''),
  updatedBy: z.string().default('system'),
  updatedAt: z.string(),
});
