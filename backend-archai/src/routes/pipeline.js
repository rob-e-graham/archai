import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import { runNightlySync } from '../services/vectorPipelineService.js';

export const pipelineRouter = Router();

pipelineRouter.post('/nightly-sync', requireRole('admin'), async (req, res) => {
  const batch = await runNightlySync({ since: req.body?.since, initiatedBy: req.archai.user.email });
  res.json({ ok: true, batch });
});
