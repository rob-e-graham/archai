import { Router } from 'express';
import { env } from '../config/env.js';
import { collectiveAccessAdapter } from '../adapters/collectiveAccessAdapter.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';
import { repo } from '../services/objectRepository.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  res.json({
    ok: true,
    service: 'ARCHAI backend',
    version: '0.1.0',
    mode: env.allowMocks ? 'mock-ready' : 'strict',
    counts: {
      objects: repo.state.objects.length,
      nfcTags: repo.state.nfcTags.length,
      uploads: repo.state.uploads.length,
      syncBatches: repo.state.vectorSyncBatches.length,
    },
    integrations: {
      collectiveAccess: await collectiveAccessAdapter.health(),
      resourceSpace: await resourceSpaceAdapter.health(),
      qdrant: await qdrantAdapter.health(),
    },
    timestamp: new Date().toISOString(),
  });
});
