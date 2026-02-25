import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole.js';
import { listWorkflows, transitionWorkflow } from '../services/workflowService.js';

export const workflowsRouter = Router();

const transitionSchema = z.object({
  objectId: z.string().min(1),
  toState: z.enum(['draft', 'review', 'approved', 'published', 'archived']),
  notes: z.string().optional().default(''),
});

workflowsRouter.get('/', requireRole('collections'), (_req, res) => {
  res.json({ ok: true, workflows: listWorkflows() });
});

workflowsRouter.post('/transition', requireRole('collections'), (req, res) => {
  const input = transitionSchema.parse(req.body || {});
  const result = transitionWorkflow({
    ...input,
    actorRole: req.archai.role,
    actorEmail: req.archai.user.email,
  });
  if (result.error) return res.status(result.status || 400).json({ ok: false, error: result.error });
  res.json({ ok: true, ...result });
});
