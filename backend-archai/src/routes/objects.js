import { Router } from 'express';
import { repo } from '../services/objectRepository.js';
import { requireRole } from '../middleware/requireRole.js';

export const objectsRouter = Router();

objectsRouter.get('/', (req, res) => {
  const q = String(req.query.q || '');
  res.json({ ok: true, total: repo.listObjects(q).length, results: repo.listObjects(q) });
});

objectsRouter.get('/:id', (req, res) => {
  const record = repo.getObject(req.params.id);
  if (!record) return res.status(404).json({ ok: false, error: 'Object not found' });
  res.json({ ok: true, object: record });
});

objectsRouter.patch('/:id', requireRole('collections'), (req, res) => {
  const updated = repo.updateObject(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ ok: false, error: 'Object not found' });
  repo.audit({ type: 'object.update', actor: req.archai.user.email, summary: `Updated ${updated.id}` });
  res.json({ ok: true, object: updated });
});
