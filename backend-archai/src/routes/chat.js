import { Router } from 'express';
import { z } from 'zod';
import { repo } from '../services/objectRepository.js';
import { evaluateHallucinationRisk, buildBoundedSystemPrompt } from '../services/hallucinationGuard.js';
import { chatModelAdapter } from '../adapters/chatModelAdapter.js';
import { buildProvenanceRecord } from '../services/provenanceService.js';

export const chatRouter = Router();

const schema = z.object({
  objectId: z.string().min(1),
  prompt: z.string().min(1).max(1000),
});

chatRouter.post('/object', async (req, res) => {
  const input = schema.parse(req.body || {});
  const objectRecord = repo.getObject(input.objectId);
  if (!objectRecord) return res.status(404).json({ ok: false, error: 'Object not found' });

  const guard = evaluateHallucinationRisk(objectRecord, input.prompt);
  if (!guard.allowed) {
    // When the block comes from a source-community protocol, prefer the
    // community's own decline wording over the generic staff message.
    const safeReply = guard.protocol?.declineMessage
      || 'I cannot answer that from the verified record available. Please ask a staff member or curator.';
    return res.status(422).json({
      ok: false,
      error: guard.protocol?.declineMessage
        ? 'Community cultural protocol blocked response'
        : 'Hallucination prevention blocked response',
      guard,
      safeReply,
    });
  }

  const systemPrompt = buildBoundedSystemPrompt(objectRecord);
  const modelResult = await chatModelAdapter.chat({ systemPrompt, userPrompt: input.prompt, objectRecord });
  const provenance = buildProvenanceRecord({
    objectRecord,
    userPrompt: input.prompt,
    responseText: modelResult.response,
    model: modelResult.model,
  });
  repo.audit({ type: 'chat.object', actor: req.archai.user.email, summary: `Object chat ${objectRecord.id}` });

  res.json({ ok: true, objectId: objectRecord.id, response: modelResult.response, model: modelResult, guard, provenance });
});
