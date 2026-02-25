import { Router } from 'express';
import { z } from 'zod';
import { queueUploadDraft, generateResourceSpaceFilename } from '../services/uploadService.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { requireRole } from '../middleware/requireRole.js';
import { repo } from '../services/objectRepository.js';

export const uploadRouter = Router();

const metadataInput = z.object({
  ca_object_id: z.string().min(1),
  ca_object_title: z.string().min(1),
  idno: z.string().optional(),
  description: z.string().optional(),
  item_type: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  date: z.string().optional(),
  subject_tags: z.string().optional(),
  current_location: z.string().optional(),
  photo_number: z.string().optional(),
  cultural_safety_flags: z.array(z.string()).optional(),
});

uploadRouter.post('/draft', requireRole('collections'), (req, res) => {
  const payload = metadataInput.parse(req.body || {});
  const record = queueUploadDraft(payload, req.archai.user.email);
  res.status(201).json({ ok: true, record, resourceSpaceBatchUrl: resourceSpaceAdapter.buildBatchUploadUrl() });
});

uploadRouter.post('/filename', requireRole('collections'), (req, res) => {
  const payload = metadataInput.pick({ ca_object_id: true, ca_object_title: true, photo_number: true }).parse(req.body || {});
  res.json({ ok: true, filename: generateResourceSpaceFilename(payload) });
});

uploadRouter.get('/queue', requireRole('collections'), (_req, res) => {
  res.json({ ok: true, queue: repo.listUploads() });
});
