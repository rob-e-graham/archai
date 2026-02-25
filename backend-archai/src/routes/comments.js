import { Router } from 'express';
import { z } from 'zod';

export const commentsRouter = Router();
const comments = [];

const schema = z.object({ objectId: z.string().min(1), text: z.string().min(1).max(500), authorType: z.enum(['visitor','volunteer','staff']).default('visitor') });

commentsRouter.get('/', (req, res) => {
  const objectId = String(req.query.objectId || '');
  res.json({ ok: true, comments: objectId ? comments.filter((c) => c.objectId === objectId) : comments });
});

commentsRouter.post('/', (req, res) => {
  const input = schema.parse(req.body || {});
  const comment = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString(), status: 'pending_moderation' };
  comments.unshift(comment);
  res.status(201).json({ ok: true, comment });
});
