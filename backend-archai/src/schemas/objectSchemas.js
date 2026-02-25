import { z } from 'zod';

export const publishedMediaSchema = z.object({
  mediaId: z.string(),
  objectId: z.string(),
  kind: z.enum(['image', 'video', 'audio']),
  resourceSpaceId: z.string().optional().nullable(),
  playbackUrl: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  thumbUrl: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  durationSeconds: z.number().optional().nullable(),
  captionsUrl: z.string().optional().nullable(),
  rightsLabel: z.string().default('internal prototype'),
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
