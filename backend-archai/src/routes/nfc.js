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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

nfcRouter.get('/pages/:tagId', (req, res) => {
  const normalizedTagId = normalizeAuxTagId(req.params.tagId);
  const tag = repo.listNfcTags().find((t) => t.tagId === normalizedTagId || t.tagId === req.params.tagId);
  if (!tag) return res.status(404).send('Tag not found');
  const page = buildNfcPageModel(tag);
  const displayTagId = String(page.tagId).replace(/^NFC-?(\d+)$/i, (_m, num) => `AUX.IO ${num.padStart(3, '0')}`);
  const e = escapeHtml;
  const metaLine = [page.type, page.year || 'Date unknown', page.institution].filter(Boolean).map(e).join(' · ');
  // Obtext-style grounding for the live draft page: the object may only speak
  // from its saved record, and must say so when the record runs out.
  const grounding = [
    `You are "${page.title}", a ${page.type}${page.year ? ` from ${page.year}` : ''}${page.institution ? ` held by ${page.institution}` : ''}. Speak in first person, warmly and briefly (2-4 sentences).`,
    page.story ? `Your record says: ${page.story}` : '',
    page.verifiedFacts && page.verifiedFacts.length ? `Verified facts you may state: ${page.verifiedFacts.join('; ')}.` : '',
    page.rights ? `Rights: ${page.rights}.` : '',
    'STRICT RULE: only state what is in this record. If asked anything not covered by it, say plainly that it is not in your record yet and invite another question. Never invent dates, people, places or events.',
  ].filter(Boolean).join('\n');
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(page.title)} — AUX.IO</title><style>
body{margin:0;background:#050607;color:#edf3f0;font-family:Georgia,serif}
main{max-width:820px;margin:0 auto;padding:5vw 5vw 12vw}
h1{font-weight:500;font-size:clamp(1.6rem,4.5vw,3rem);margin:10px 0 8px}
.meta{opacity:.72;letter-spacing:.16em;text-transform:uppercase;font:11px/1.6 ui-monospace,monospace;margin:0 0 10px}
.brand{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #223;padding-bottom:10px;margin-bottom:22px}
.brand b{font-weight:500;letter-spacing:.4em;font-size:.85rem}.brand span{color:#5fbfae;font:11px ui-monospace,monospace;letter-spacing:.14em}
.hero{border:1px solid #2c4a44;outline:6px solid rgba(95,191,174,.12);margin:14px 0}
.hero img{display:block;width:100%;height:auto}
.hero-empty{aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:#5a6a68;font:11px ui-monospace,monospace;letter-spacing:.2em}
.copy{font:clamp(1rem,2vw,1.2rem)/1.7 system-ui,sans-serif;margin-top:18px;color:#cfdad6}
.rights{font:10px/1.8 ui-monospace,monospace;color:#8b9a96;letter-spacing:.08em;margin-top:14px}
.chat{margin-top:30px;border:1px solid #223;padding:16px}
.chat h2{font:12px ui-monospace,monospace;letter-spacing:.2em;color:#5fbfae;font-weight:400;margin:0 0 12px;text-transform:uppercase}
.log{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.msg{font:.95rem/1.6 system-ui,sans-serif;padding:10px 12px;border:1px solid #223;max-width:88%}
.msg.you{align-self:flex-end;color:#a8c6bf;border-color:#2c4a44}
.msg.obj{align-self:flex-start;color:#edf3f0}
.row{display:flex;gap:8px}
input{flex:1;background:#0b0f0e;border:1px solid #2c4a44;color:#edf3f0;padding:11px 12px;font:.95rem system-ui,sans-serif}
button{background:#5fbfae;color:#04110e;border:0;padding:11px 16px;font:600 .8rem ui-monospace,monospace;letter-spacing:.1em;cursor:pointer}
button:disabled{opacity:.5}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.chip{border:1px solid #2c4a44;color:#8fb5ac;padding:6px 10px;font:10.5px ui-monospace,monospace;letter-spacing:.1em;cursor:pointer}
.foot{margin-top:34px;border-top:1px solid #223;padding-top:12px;font:10px ui-monospace,monospace;color:#68777a;letter-spacing:.12em;line-height:2}
.foot a{color:#5fbfae;text-decoration:none}
</style></head><body><main>
<div class="brand"><b>ARC<span style="color:#c8a96e;font-style:italic">H</span>AI</b><span>AUX.IO · ${e(displayTagId)}</span></div>
<div class="meta">Conversational object · live staff draft</div>
<h1>${e(page.title)}</h1>
<div class="meta">${metaLine}</div>
<div class="hero">${page.heroImage ? `<img src="${e(page.heroImage)}" alt="${e(page.title)}">` : '<div class="hero-empty">NO IMAGE PUBLISHED YET</div>'}</div>
<p class="copy">${e(page.story)}</p>
${page.rights ? `<div class="rights">RIGHTS · ${e(page.rights)}${page.accession ? ` · ${e(page.accession)}` : ''}</div>` : ''}
<div class="chat">
  <h2>Ask this object</h2>
  <div class="log" id="log"><div class="msg obj">Hello — I'm ${e(page.title)}. I answer only from my record, so ask me anything and I'll tell you what I actually know.</div></div>
  <div class="row"><input id="q" placeholder="Ask a question…" onkeydown="if(event.key==='Enter')ask()"><button id="send" onclick="ask()">ASK</button></div>
  <div class="chips">${page.chips.slice(1).map((c) => `<span class="chip" onclick="document.getElementById('q').value=${JSON.stringify(String(c))};ask()">${e(c)}</span>`).join('')}</div>
</div>
<div class="foot">ARCHAI · AUX.IO · RIGHTS-AWARE VISITOR ACCESS · GROUNDED IN THE INSTITUTIONAL RECORD<br><a href="https://fineartmedia.tech/archai" rel="noopener">← About ARCHAI · Talk to a Whole Collection</a></div>
</main><script>
const SYS=${JSON.stringify(grounding)};
const hist=[];
async function ask(){
  const q=document.getElementById('q');const send=document.getElementById('send');const log=document.getElementById('log');
  const text=(q.value||'').trim();if(!text)return;
  q.value='';send.disabled=true;
  const you=document.createElement('div');you.className='msg you';you.textContent=text;log.appendChild(you);
  const obj=document.createElement('div');obj.className='msg obj';obj.textContent='…';log.appendChild(obj);
  try{
    const r=await fetch('/api/proxy/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemPrompt:SYS,userPrompt:text,history:hist.slice(-6)})});
    const d=await r.json();
    const reply=((d.message&&d.message.content)||d.reply||d.response||'That is not in my record yet — ask me something else about what I am.').trim();
    obj.textContent=reply;
    hist.push({role:'user',content:text},{role:'assistant',content:reply});
  }catch(err){obj.textContent='I could not reach my record just now — please try again in a moment.';}
  send.disabled=false;obj.scrollIntoView({behavior:'smooth'});
}
</script></body></html>`);
});

nfcRouter.post('/', (req, res) => {
  const parsed = saveAuxSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid AUX.IO payload', details: parsed.error.flatten() });
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
