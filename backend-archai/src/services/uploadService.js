import { z } from 'zod';
import { repo } from './objectRepository.js';

export const uploadMetadataSchema = z.object({
  ca_object_id: z.string().min(1),
  ca_object_title: z.string().min(1),
  idno: z.string().optional().default(''),
  description: z.string().optional().default(''),
  item_type: z.string().optional().default(''),
  materials: z.string().optional().default(''),
  dimensions: z.string().optional().default(''),
  date: z.string().optional().default(''),
  subject_tags: z.string().optional().default(''),
  current_location: z.string().optional().default(''),
  photo_number: z.string().optional().default(''),
  filename: z.string().optional().default(''),
  cultural_safety_flags: z.array(z.string()).optional().default([]),
});

export function generateResourceSpaceFilename({ ca_object_id, ca_object_title, photo_number }) {
  const titleSlug = ca_object_title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${ca_object_id}_${titleSlug}${photo_number ? `_${photo_number}` : ''}.jpg`;
}

export function queueUploadDraft(input, actor = 'system') {
  const metadata = uploadMetadataSchema.parse(input);
  const filename = metadata.filename || generateResourceSpaceFilename(metadata);
  const record = {
    id: crypto.randomUUID(),
    status: 'queued',
    actor,
    filename,
    metadata: { ...metadata, filename },
    createdAt: new Date().toISOString(),
    destinations: ['resourcespace', 'collectiveaccess-link'],
  };
  repo.saveUpload(record);
  repo.audit({ type: 'upload.queued', actor, summary: `Queued upload ${filename}` });
  return record;
}
