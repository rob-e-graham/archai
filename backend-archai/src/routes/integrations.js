import { Router } from 'express';
import { env } from '../config/env.js';
import { collectiveAccessAdapter } from '../adapters/collectiveAccessAdapter.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';

export const integrationsRouter = Router();

integrationsRouter.get('/', async (_req, res) => {
  res.json({
    ok: true,
    githubUrl: env.githubUrl,
    famtecUrl: env.famtecUrl,
    headlessCms: env.headlessCms,
    adapters: {
      collectiveAccess: await collectiveAccessAdapter.health(),
      resourceSpace: await resourceSpaceAdapter.health(),
      qdrant: await qdrantAdapter.health(),
    },
  });
});
