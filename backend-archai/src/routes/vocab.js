import { Router } from 'express';
import { z } from 'zod';
import { searchVocabFederated, listVocabProviders } from '../services/vocabProviderService.js';

export const vocabRouter = Router();

const schema = z.object({
  q: z.string().optional().default(''),
  type: z.string().optional(),
  category: z.string().optional(),
  profile: z.enum(['default', 'chin']).optional().default('default'),
});

vocabRouter.get('/search', (req, res) => {
  const input = schema.parse(req.query);
  searchVocabFederated(input).then((results) => {
    res.json({ ok: true, profile: input.profile, total: results.length, results });
  });
});

vocabRouter.get('/providers', (req, res) => {
  const profile = String(req.query.profile || 'default');
  res.json({ ok: true, profile, providers: listVocabProviders(profile) });
});
