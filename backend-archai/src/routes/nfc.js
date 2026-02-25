import { Router } from 'express';
import { repo } from '../services/objectRepository.js';
import { buildNfcPageModel } from '../services/nfcService.js';

export const nfcRouter = Router();

nfcRouter.get('/tags', (_req, res) => {
  res.json({ ok: true, tags: repo.listNfcTags() });
});

nfcRouter.get('/tags/:tagId', (req, res) => {
  const tag = repo.listNfcTags().find((t) => t.tagId === req.params.tagId);
  if (!tag) return res.status(404).json({ ok: false, error: 'Tag not found' });
  res.json({ ok: true, tag, pageModel: buildNfcPageModel(tag) });
});

nfcRouter.get('/pages/:tagId', (req, res) => {
  const tag = repo.listNfcTags().find((t) => t.tagId === req.params.tagId);
  if (!tag) return res.status(404).send('Tag not found');
  const page = buildNfcPageModel(tag);
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.title}</title><style>body{margin:0;background:#050607;color:#edf3f0;font-family:Georgia,serif}main{max-width:1100px;margin:0 auto;padding:4vw}h1{font-weight:500;font-size:clamp(2rem,5vw,4rem)}.meta{opacity:.75;letter-spacing:.18em;text-transform:uppercase;font:12px/1.4 ui-monospace,monospace;margin:0 0 18px}.hero{aspect-ratio:16/9;border:1px solid #304040;background:linear-gradient(135deg,#24344b,#596bc4)}.copy{font:clamp(1rem,2vw,1.35rem)/1.65 system-ui,sans-serif;margin-top:20px}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.chip{border:1px solid #40484b;padding:8px 12px;font:12px ui-monospace,monospace;letter-spacing:.12em}</style></head><body><main><div class="meta">NFC conversational object · ${page.tagId}</div><h1>${page.title}</h1><div class="meta">${page.type} · ${page.year ?? 'Unknown date'} · ${page.location}</div><div class="hero"></div><p class="copy">${page.story}</p><div class="chips">${page.chips.map((c)=>`<span class="chip">${c}</span>`).join('')}</div></main></body></html>`);
});
