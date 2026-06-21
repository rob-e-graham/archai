import { z } from 'zod';

export const publishedMediaSchema = z.object({
  mediaId: z.string(),
  objectId: z.string(),
  kind: z.enum(['image', 'video', 'audio', 'interactive', 'html']),
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
  // Born-digital / interactive works
  // interactiveUrl: local path (/born-digital/WORK_ID/index.html) or external URL
  //   rendered as a sandboxed <iframe> in the AUX.IO visitor page
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
