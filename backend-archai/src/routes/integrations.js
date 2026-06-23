import { Router } from 'express';
import { env } from '../config/env.js';
import { collectiveAccessAdapter } from '../adapters/collectiveAccessAdapter.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';
import { eaasiAdapter } from '../adapters/eaasiAdapter.js';

export const integrationsRouter = Router();

async function ollamaHealth() {
  try {
    const resp = await fetch(`${env.ollama.baseUrl}/api/tags`);
    if (!resp.ok) throw new Error(`Ollama responded ${resp.status}`);
    const data = await resp.json();
    return {
      configured: Boolean(env.ollama.baseUrl),
      online: true,
      url: env.ollama.baseUrl,
      chatModel: env.ollama.chatModel,
      embedModel: env.ollama.embedModel,
      models: (data.models || []).map((m) => m.name),
    };
  } catch (error) {
    return {
      configured: Boolean(env.ollama.baseUrl),
      online: false,
      url: env.ollama.baseUrl,
      chatModel: env.ollama.chatModel,
      embedModel: env.ollama.embedModel,
      models: [],
      error: error.message,
    };
  }
}

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
      ollama: await ollamaHealth(),
      eaasi: await eaasiAdapter.health(),
    },
  });
});
