import { Router } from 'express';
import { env } from '../config/env.js';
import { collectiveAccessAdapter } from '../adapters/collectiveAccessAdapter.js';
import { resourceSpaceAdapter } from '../adapters/resourceSpaceAdapter.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';
import { repo } from '../services/objectRepository.js';
import db from '../data/db.js';

export const healthRouter = Router();

const commentCount = db.prepare(`SELECT COUNT(*) AS count FROM comments`);
const flaggedCount = db.prepare(`SELECT COUNT(*) AS count FROM comments WHERE status = 'hidden'`);

async function ollamaHealth() {
  try {
    const resp = await fetch(`${env.ollama.baseUrl}/api/tags`);
    if (!resp.ok) throw new Error(`Ollama responded ${resp.status}`);
    const data = await resp.json();
    const models = (data.models || []).map((m) => m.name);
    return {
      configured: Boolean(env.ollama.baseUrl),
      online: true,
      url: env.ollama.baseUrl,
      chatModel: env.ollama.chatModel,
      embedModel: env.ollama.embedModel,
      models,
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

healthRouter.get('/', async (_req, res) => {
  const qdrant = await qdrantAdapter.health();
  const ollama = await ollamaHealth();
  const comments = commentCount.get();
  const flagged = flaggedCount.get();
  const liveCounts = qdrant.liveCounts || {};
  const sourceCounts = Object.fromEntries(Object.entries(liveCounts).filter(([name]) => name !== 'archai_curator'));
  const sourcePoints = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
  const curatorVectors = liveCounts.archai_curator || 0;
  res.json({
    ok: true,
    service: 'ARCHAI backend',
    version: '0.1.0',
    mode: env.allowMocks ? 'hybrid-ready' : 'strict',
    counts: {
      collectionObjects: sourcePoints,
      qdrantCollections: Object.keys(sourceCounts).length,
      curatorVectors,
      totalVectors: qdrant.points,
      comments: comments?.count || 0,
      flaggedComments: flagged?.count || 0,
      legacyObjects: repo.state.objects.length,
      auxTags: repo.state.nfcTags.length,
      uploads: repo.state.uploads.length,
      syncBatches: repo.state.vectorSyncBatches.length,
    },
    runtime: {
      allowMocks: env.allowMocks,
      qdrantCollection: env.qdrant.collection,
      chatModel: env.ollama.chatModel,
      embedModel: env.ollama.embedModel,
    },
    integrations: {
      collectiveAccess: await collectiveAccessAdapter.health(),
      resourceSpace: await resourceSpaceAdapter.health(),
      qdrant,
      ollama,
    },
    timestamp: new Date().toISOString(),
  });
});
