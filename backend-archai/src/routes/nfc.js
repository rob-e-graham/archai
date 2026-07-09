import { Router } from 'express';
import { z } from 'zod';
import { repo } from '../services/objectRepository.js';
import { buildNfcPageModel } from '../services/nfcService.js';

export const nfcRouter = Router();

const objectDraftSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.string().optional().default('Object'),
  year: z.union([z.string(), z.number()]).optional().nullable(),
  location: z.string().optional().default(''),
  status: z.string().optional().default('draft'),
  dataset: z.string().optional().default('institution_draft'),
  media: z.array(z.record(z.any())).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  materials: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(''),
  aiInterpretation: z.string().optional().default(''),
  verifiedFacts: z.array(z.string()).optional().default([]),
  unknownFields: z.array(z.string()).optional().default([]),
  curatorApproved: z.array(z.string()).optional().default([]),
  prohibitedStatements: z.array(z.string()).optional().default([]),
  restrictions: z.array(z.string()).optional().default([]),
  source: z.record(z.any()).optional().default({}),
  workflow: z.record(z.any()).optional().default({ state: 'draft' }),
}).passthrough();

const saveAuxSchema = z.object({
  code: z.string().min(1),
  status: z.enum(['new', 'draft', 'live', 'unassigned', 'archived']).default('draft'),
  objectId: z.string().nullable().optional(),
  location: z.string().optional().default('Unassigned'),
  visibility: z.record(z.boolean()).optional().default({}),
  objectDraft: objectDraftSchema.nullable().optional(),
});

function normalizeAuxTagId(code) {
  return String(code).replace(/^NFC-?(\d+)$/i, (_m, num) => `NFC-${num.padStart(3, '0')}`);
}

nfcRouter.get('/tags', (_req, res) => {
  res.json({ ok: true, tags: repo.listNfcTags() });
});

nfcRouter.get('/tags/:tagId', (req, res) => {
  const normalizedTagId = normalizeAuxTagId(req.params.tagId);
  const tag = repo.listNfcTags().find((t) => t.tagId === normalizedTagId || t.tagId === req.params.tagId);
  if (!tag) return res.status(404).json({ ok: false, error: 'Tag not found' });
  res.json({ ok: true, tag, pageModel: buildNfcPageModel(tag) });
});

nfcRouter.get('/pages/:tagId', (req, res) => {
  const normalizedTagId = normalizeAuxTagId(req.params.tagId);
  const tag = repo.listNfcTags().find((t) => t.tagId === normalizedTagId || t.tagId === req.params.tagId);
  if (!tag) return res.status(404).send('Tag not found');
  const page = buildNfcPageModel(tag);
  const displayTagId = String(page.tagId).replace(/^NFC-?(\d+)$/i, (_m, num) => `AUXIO ${num.padStart(3, '0')}`);
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.title}</title><style>body{margin:0;background:#050607;color:#edf3f0;font-family:Georgia,serif}main{max-width:1100px;margin:0 auto;padding:4vw}h1{font-weight:500;font-size:clamp(2rem,5vw,4rem)}.meta{opacity:.75;letter-spacing:.18em;text-transform:uppercase;font:12px/1.4 ui-monospace,monospace;margin:0 0 18px}.hero{aspect-ratio:16/9;border:1px solid #304040;background:linear-gradient(135deg,#24344b,#596bc4)}.copy{font:clamp(1rem,2vw,1.35rem)/1.65 system-ui,sans-serif;margin-top:20px}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.chip{border:1px solid #40484b;padding:8px 12px;font:12px ui-monospace,monospace;letter-spacing:.12em}</style></head><body><main><div class="meta">AUXIO conversational object · ${displayTagId}</div><h1>${page.title}</h1><div class="meta">${page.type} · ${page.year ?? 'Unknown date'} · ${page.location}</div><div class="hero"></div><p class="copy">${page.story}</p><div class="chips">${page.chips.map((c)=>`<span class="chip">${c}</span>`).join('')}</div></main></body></html>`);
});

nfcRouter.post('/', (req, res) => {
  const parsed = saveAuxSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid AUXIO payload', details: parsed.error.flatten() });
  }
  const input = parsed.data;
  let object = null;
  if (input.objectDraft) {
    object = repo.saveObject({
      ...input.objectDraft,
      workflow: {
        state: input.status === 'live' ? 'published' : 'draft',
        updatedBy: req.archai?.user?.email || 'archai-runtime',
        updatedAt: new Date().toISOString(),
        ...(input.objectDraft.workflow || {}),
      },
    });
  }

  const objectId = input.objectDraft?.id || input.objectId || null;
  const tag = repo.upsertNfcTag({
    tagId: normalizeAuxTagId(input.code),
    objectId,
    status: input.status,
    location: input.location,
    template: 'conversational-object',
    scansToday: 0,
    visibility: input.visibility,
  });

  repo.audit({
    type: 'auxio.save',
    actor: req.archai?.user?.email || 'archai-runtime',
    summary: `Saved ${tag.tagId}${object ? ` with draft object ${object.id}` : ''}`,
  });

  res.json({ ok: true, tag, object, mode: 'runtime-session' });
});
