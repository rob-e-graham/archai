import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole.js';
import { setVerification, verificationSummary } from '../services/verificationService.js';

export const verificationRouter = Router();

const setSchema = z.object({
  objectId: z.string().min(1),
  tier: z.enum(['institutional_record', 'verified_oral_history', 'community_response']).optional(),
  verified: z.boolean().optional(),
  method: z.string().optional(),
  notes: z.string().optional().default(''),
});

// Public read: how the collection is distributed across the verification tiers.
verificationRouter.get('/summary', (_req, res) => {
  res.json({ ok: true, summary: verificationSummary() });
});

// Curatorial action: move a record across the verification line.
verificationRouter.post('/set', requireRole('curator'), (req, res) => {
  const input = setSchema.parse(req.body || {});
  const result = setVerification({ ...input, actorEmail: req.archai.user.email });
  if (result.error) return res.status(result.status || 400).json({ ok: false, error: result.error });
  res.json({ ok: true, ...result });
});
