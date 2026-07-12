import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole.js';
import { repo } from '../services/objectRepository.js';
import { listAccessionQueue, accessionReadiness, commitAccession } from '../services/accessionService.js';

export const accessionRouter = Router();

const commitSchema = z.object({
  objectId: z.string().min(1),
  notes: z.string().optional().default(''),
});

// Records that are verified + approved and waiting to enter the archival CMS.
accessionRouter.get('/queue', requireRole('collections'), (_req, res) => {
  res.json({ ok: true, queue: listAccessionQueue() });
});

// Accession readiness (and blockers) for a single record.
accessionRouter.get('/:id', requireRole('collections'), (req, res) => {
  const record = repo.getObject(req.params.id);
  if (!record) return res.status(404).json({ ok: false, error: 'Object not found' });
  res.json({ ok: true, objectId: record.id, ...accessionReadiness(record) });
});

// Commit a record into the archival CMS. Gated: verified + approved only.
accessionRouter.post('/commit', requireRole('curator'), (req, res) => {
  const input = commitSchema.parse(req.body || {});
  const result = commitAccession({ ...input, actorEmail: req.archai.user.email });
  if (result.error) {
    return res.status(result.status || 400).json({ ok: false, error: result.error, blockers: result.blockers });
  }
  res.json({ ok: true, ...result });
});
