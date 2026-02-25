import { Router } from 'express';
import { repo } from '../services/objectRepository.js';
import { requireRole } from '../middleware/requireRole.js';

export const adminRouter = Router();

adminRouter.use(requireRole('admin'));

adminRouter.get('/users', (_req, res) => res.json({ ok: true, users: repo.listUsers() }));
adminRouter.get('/audit', (_req, res) => res.json({ ok: true, audit: repo.getAuditLog() }));
adminRouter.get('/sync-batches', (_req, res) => res.json({ ok: true, batches: repo.listSyncBatches() }));
adminRouter.get('/permissions-matrix', (_req, res) => {
  res.json({
    ok: true,
    matrix: {
      admin: ['all'],
      curator: ['search', 'objects:read', 'objects:write', 'nfc:publish', 'export', 'vocab'],
      collections: ['search', 'objects:read', 'objects:write-limited', 'upload', 'vocab'],
      technician: ['nodel', 'objects:read-tech', 'runtime'],
      volunteer: ['objects:read', 'visitor-preview', 'notes:create'],
      visitor: ['nfc:public', 'chat:object', 'comments:create'],
    },
  });
});
