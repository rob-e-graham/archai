#!/usr/bin/env node
/**
 * acmi-harvester.js — Australian Centre for the Moving Image (ACMI).
 *
 * ACMI publishes its entire collection through an open Public API with CC BY 4.0
 * metadata (no key required): https://api.acmi.net.au/  ·  github.com/ACMILabs/acmi-api
 *
 * Default harvest is a themed, rights-clean set: the pre-history of the moving
 * image — zoetropes, praxinoscopes, magic lanterns and other optical apparatus.
 * These are physical objects (great for object-voice), overwhelmingly 19th/early
 * 20th century, and squarely ACMI's origin story.
 *
 *   node acmi-harvester.js --dry-run                 # default: preview only, nothing written
 *   node acmi-harvester.js --dry-run --query "camera"
 *   node acmi-harvester.js --ids 99476,99651         # specific works
 *   node acmi-harvester.js --apply --limit 40        # embed + upsert into Qdrant
 *
 * Safety posture (same as every ARCHAI harvester):
 *   - dry-run is the DEFAULT; nothing is written without --apply
 *   - raw source record preserved verbatim in the payload (_raw)
 *   - metadata licence recorded (CC BY 4.0); attribution kept
 *   - poster/print reuse is OFF for this source pending human legal review
 *   - Indigenous-context works (is_context_indigenous) are HELD by default,
 *     excluded from embedding until protocols are co-designed with communities
 */

const ACMI_API = 'https://api.acmi.net.au';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_acmi';
const EMBED_MODEL = 'nomic-embed-text';

// Themed default harvest: the pre-history of the moving image (open, iconic, object-voice friendly)
const DEFAULT_QUERIES = [
  'zoetrope', 'praxinoscope', 'magic lantern', 'phenakistoscope',
  'thaumatrope', 'kinetoscope', 'stereoscope', 'optical toy', 'flip book'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY; // dry-run unless explicitly applied
const LIMIT = parseInt(getArg('limit', '40'), 10);
const QUERY = getArg('query', null);
const IDS = getArg('ids', null);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stripHTML = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchJSON(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch { /* retry */ }
    await sleep(400 * (attempt + 1));
  }
  return null;
}

// ACMI's API is imageless, but each work's public page carries an og:image
// (the object photo ACMI displays publicly). Grab it for the AUXIO hero.
async function fetchOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, { headers: { 'Accept': 'text/html' } });
    if (!res.ok) return '';
    const html = await res.text();
    const m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const url = m ? m[1].replace(/&amp;/g, '&') : '';
    // ACMI serves its default logo as og:image when a work has no photo of its
    // own. Reject it so the object falls back to a clean text-first hero.
    if (/acmi_logo|default_seo|logo_black/i.test(url)) return '';
    return url;
  } catch { return ''; }
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
  });
  return (await res.json()).embedding;
}

async function ensureCollection() {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
  if (res.ok) return;
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } })
  });
  console.log(`  ✓ created Qdrant collection '${COLLECTION}'`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] })
  });
}

// Map an ACMI work record -> ARCHAI payload + Obtext, or null if it must be held/skipped.
async function toPayload(w) {
  if (!w || w.unpublished || w.external) return { skip: 'unpublished/external' };
  if (w.is_context_indigenous) return { held: 'indigenous-context — protocol pending' };

  const title = stripHTML(w.title) || 'Untitled';
  const desc = stripHTML(w.brief_description || w.description || '');
  const creator = (w.creators_primary && w.creators_primary[0] && w.creators_primary[0].name) || w.creator_credit || '';
  const creatorReal = creator && !/not documented/i.test(creator) ? creator : '';
  const date = w.first_production_date || '';
  const type = w.type || '';
  const material = stripHTML(w.material_description || '');
  const slug = w.slug ? `${w.id}--${w.slug}` : String(w.id);
  const sourceUrl = `https://www.acmi.net.au/works/${slug}/`;

  // The object photo comes from the work's public og:image (API is imageless).
  const thumb = await fetchOgImage(sourceUrl);

  const embedding_text = [
    title,
    desc,
    type ? `Type: ${type}` : '',
    creatorReal ? `Maker: ${creatorReal}` : '',
    date ? `Date: ${date}` : '',
    material ? `Materials: ${material}` : '',
    w.is_on_display ? `On display at ${w.last_on_display_place || 'ACMI'}` : ''
  ].filter(Boolean).join('. ');

  const payload = {
    canonical_id: `acmi:${w.id}`,
    source: 'acmi',
    source_institution: 'Australian Centre for the Moving Image (ACMI)',
    title,
    object_type: type,
    category: type,
    date_range: date,
    registration_number: w.acmi_id || String(w.id),
    museum_location: w.is_on_display ? (w.last_on_display_place || 'ACMI') : 'ACMI collection store',
    description: desc,
    medium: material,
    artist: creatorReal,
    licence: 'CC BY 4.0 (metadata)',
    attribution: 'Australian Centre for the Moving Image (ACMI), CC BY 4.0',
    poster_download_allowed: false,     // print/reuse OFF for new source (legal review pending)
    is_indigenous_context: false,       // held ones never reach here
    source_url: sourceUrl,
    media_thumbnail: thumb,
    media_medium: thumb,
    media_available: !!thumb,
    embedding_text,
    _raw: w
  };
  return { payload, embedding_text };
}

async function collectIds() {
  if (IDS) return [...new Set(IDS.split(',').map(s => s.trim()).filter(Boolean))];
  const queries = QUERY ? [QUERY] : DEFAULT_QUERIES;
  const ids = new Map();
  for (const q of queries) {
    const data = await fetchJSON(`${ACMI_API}/search/?query=${encodeURIComponent(q)}`);
    const results = (data && (data.results || (Array.isArray(data) ? data : []))) || [];
    for (const r of results) {
      // prefer physical objects for the pre-cinema theme; still record others
      if (r.id && !ids.has(r.id)) ids.set(r.id, r.type || '');
    }
    process.stdout.write(`  · "${q}" → ${results.length} results (running unique: ${ids.size})\n`);
    await sleep(250);
  }
  // Objects first, then the rest, capped at LIMIT
  const objectFirst = [...ids.entries()].sort((a, b) => (a[1] === 'Object' ? -1 : 1) - (b[1] === 'Object' ? -1 : 1));
  return objectFirst.map(([id]) => id).slice(0, LIMIT);
}

async function main() {
  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ACMI harvester — ${DRY_RUN ? 'DRY RUN (nothing written)' : 'APPLY (embedding into Qdrant)'}`);
  console.log(`  Collection: ${COLLECTION}  ·  metadata CC BY 4.0`);
  console.log(`  ════════════════════════════════════════════\n`);

  if (!DRY_RUN) {
    try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
    catch { console.error('  ✗ Ollama offline — start it or use --dry-run'); process.exit(1); }
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant offline — start it or use --dry-run'); process.exit(1); }
    await ensureCollection();
  }

  console.log('\n  Gathering candidate works…');
  const ids = await collectIds();
  console.log(`\n  ✓ ${ids.length} works to process\n`);

  let success = 0, held = 0, skipped = 0, errors = 0;
  for (let i = 0; i < ids.length; i++) {
    try {
      const w = await fetchJSON(`${ACMI_API}/works/${ids[i]}/`);
      const mapped = await toPayload(w);
      if (mapped.held) { held++; process.stdout.write(`  [HELD] ${ids[i]} — ${mapped.held}\n`); await sleep(120); continue; }
      if (mapped.skip) { skipped++; await sleep(120); continue; }

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${mapped.payload.object_type || '—'} · ${mapped.payload.title.substring(0, 52)}\n`);
      } else {
        const vector = await embed(mapped.embedding_text);
        if (!vector || !vector.length) { errors++; continue; }
        await upsertPoint(Number(ids[i]), vector, mapped.payload);
        success++;
        const pct = Math.round((i + 1) / ids.length * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${mapped.payload.title.substring(0, 45)}\r`);
      }
      await sleep(200);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ ACMI harvest ${DRY_RUN ? 'preview' : 'complete'}`);
  console.log(`  → ${success} works ${DRY_RUN ? 'ready' : `embedded into '${COLLECTION}'`}`);
  console.log(`  → ${held} held (Indigenous-context, protocol pending)`);
  console.log(`  → ${skipped} skipped (unpublished/external)  ·  ${errors} errors`);
  if (DRY_RUN) console.log(`  → Re-run with --apply once Ollama + Qdrant are up to embed.\n`);
  else console.log(`  → Poster/print reuse OFF; metadata CC BY 4.0, attribution kept.\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
