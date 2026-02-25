import { Router } from 'express';
import { z } from 'zod';
import { searchObjects } from '../services/searchService.js';
import { qdrantAdapter } from '../adapters/qdrantAdapter.js';

export const searchRouter = Router();

const schema = z.object({
  q: z.string().optional().default(''),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  dataSource: z.enum(['local_mock', 'the_met_test', 'vector']).optional().default('local_mock'),
});

searchRouter.post('/', async (req, res) => {
  const input = schema.parse(req.body || {});
  if (input.dataSource === 'vector') {
    const vectorResults = await qdrantAdapter.searchByVector([], { limit: input.limit });
    return res.json({ ok: true, query: input.q, dataSource: 'vector', total: vectorResults.length, results: vectorResults });
  }
  const result = await searchObjects(input);
  res.json({ ok: true, ...result });
});
