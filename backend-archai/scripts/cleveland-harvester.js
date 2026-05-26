#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Cleveland Museum of Art Harvester
// The richest conversational data of any museum API: wall descriptions,
// fun facts, "did you know" fields, full provenance.
// Objects speak with personality here.
//
// Usage:
//   node cleveland-harvester.js
//   node cleveland-harvester.js --limit 150 --min-richness 6
//   node cleveland-harvester.js --dry-run
//
// API docs: https://openaccess-api.clevelandart.org/
// Licence: CC0 (public domain)
// ══════════════════════════════════════════════════════════════════

const CMA_API = 'https://openaccess-api.clevelandart.org/api/artworks';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_cma';
const EMBED_MODEL = 'nomic-embed-text';

// Data richness fields — scored to find the most conversational objects
const RICHNESS_FIELDS = [
  'title', 'creation_date', 'culture', 'technique', 'measurements',
  'description', 'wall_description', 'fun_fact', 'did_you_know',
  'provenance', 'tombstone', 'creators'
];

// Departments that yield the most interesting tech/art/science objects
const SEARCH_QUERIES = [
  'technology',
  'electronic',
  'photography',
  'sculpture modern',
  'textile',
  'ceramic',
  'glass',
  'metalwork',
  'armor weapon',
  'musical instrument',
  'clock watch',
  'scientific instrument',
  'Japanese',
  'Chinese',
  'Indian',
  'African',
  'Pre-Columbian',
  'Egyptian',
  'Greek Roman',
  'Medieval',
  'contemporary art',
  'installation'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const MIN_RICHNESS = parseInt(getArg('min-richness', '5'), 10);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await sleep(3000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000);
    }
  }
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
  });
  return (await res.json()).embedding;
}

async function ensureCollection() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (res.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } })
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] })
  });
}

function scoreRichness(obj) {
  return RICHNESS_FIELDS.reduce((n, f) => {
    const v = obj[f];
    if (!v) return n;
    if (typeof v === 'string' && v.length < 3) return n;
    if (Array.isArray(v) && v.length === 0) return n;
    return n + 1;
  }, 0);
}

// Strip HTML tags from CMA descriptions
function stripHTML(s) {
  return s ? s.replace(/<[^>]+>/g, '') : '';
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════════════╗');
  console.log('  ║  ARCHAI — Cleveland Museum of Art Harvester       ║');
  console.log('  ║  (richest conversational data of any museum API)  ║');
  console.log('  ╚══════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Min richness: ${MIN_RICHNESS}/${RICHNESS_FIELDS.length} fields\n`);

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch { console.error('  ✗ Ollama not reachable'); process.exit(1); }

  if (!DRY_RUN) {
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant not reachable'); process.exit(1); }
    await ensureCollection();
  }

  // Phase 1: Collect objects with images, score richness, keep the best
  const seen = new Map();
  console.log(`\n  Searching CMA API for data-rich objects…\n`);

  for (const query of SEARCH_QUERIES) {
    try {
      const url = `${CMA_API}/?limit=100&has_image=1&q=${encodeURIComponent(query)}`;
      const data = await fetchJSON(url);
      const artworks = data.data || [];
      let added = 0;
      for (const a of artworks) {
        if (seen.has(a.id)) continue;
        const richness = scoreRichness(a);
        if (richness >= MIN_RICHNESS) {
          seen.set(a.id, { ...a, _richness: richness });
          added++;
        }
      }
      process.stdout.write(`  → "${query}" — ${artworks.length} results, ${added} rich enough (total: ${seen.size})\n`);
      await sleep(300);
    } catch (e) {
      process.stdout.write(`  ⚠ "${query}" — ${e.message}\n`);
    }
  }

  // Also grab objects currently on view (likely to have wall descriptions)
  try {
    const url = `${CMA_API}/?limit=100&has_image=1&currently_on_view=1`;
    const data = await fetchJSON(url);
    let added = 0;
    for (const a of (data.data || [])) {
      if (seen.has(a.id)) continue;
      const richness = scoreRichness(a);
      if (richness >= MIN_RICHNESS) {
        seen.set(a.id, { ...a, _richness: richness });
        added++;
      }
    }
    console.log(`  → "currently on view" — ${added} new rich objects\n`);
  } catch {}

  // Sort by richness, take top LIMIT
  const ranked = [...seen.values()].sort((a, b) => b._richness - a._richness).slice(0, LIMIT);
  console.log(`  ✓ ${seen.size} rich objects found, processing top ${ranked.length}\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < ranked.length; i++) {
    const a = ranked[i];
    try {
      const title = a.title || 'Untitled';
      const desc = stripHTML(a.description || '');
      const wall = stripHTML(a.wall_description || '');
      const funFact = stripHTML(a.fun_fact || '');
      const didYouKnow = stripHTML(a.did_you_know || '');
      const creators = (a.creators || []).map(c => c.description || '').filter(Boolean);

      // Build rich embedding text — this is what makes conversations great
      const embeddingParts = [
        title,
        a.tombstone,
        desc,
        wall,
        funFact ? `Fun fact: ${funFact}` : '',
        didYouKnow ? `Did you know: ${didYouKnow}` : '',
        a.technique,
        creators.join('; '),
        a.culture ? `Culture: ${Array.isArray(a.culture) ? a.culture.join(', ') : a.culture}` : '',
        a.creation_date
      ].filter(Boolean).join('. ');

      const imgs = a.images || {};
      const webImg = imgs.web || {};
      const printImg = imgs.print || {};

      const payload = {
        canonical_id: `cma:${a.id}`,
        source: 'cma',
        source_institution: 'Cleveland Museum of Art',
        title,
        object_type: a.type || '',
        discipline: a.department || '',
        category: a.type || '',
        date_range: a.creation_date || '',
        registration_number: a.accession_number || String(a.id),
        museum_location: a.current_location || 'Cleveland Museum of Art',
        description: desc,
        wall_description: wall,
        fun_fact: funFact,
        did_you_know: didYouKnow,
        medium: a.technique || '',
        artist: creators.join('; '),
        culture: Array.isArray(a.culture) ? a.culture.join(', ') : (a.culture || ''),
        dimensions: a.measurements || '',
        provenance: JSON.stringify(a.provenance || []),
        tombstone: a.tombstone || '',
        licence: 'CC0 — Public Domain',
        source_url: a.url || `https://www.clevelandart.org/art/${a.id}`,
        media_thumbnail: webImg.url || '',
        media_medium: webImg.url || '',
        media_large: printImg.url || webImg.url || '',
        richness_score: a._richness,
        embedding_text: embeddingParts
      };

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] [${a._richness}/11] ${title.substring(0, 50)}\n`);
      } else {
        const vector = await embed(embeddingParts);
        if (!vector || !vector.length) { errors++; continue; }
        const pointId = 4000000 + i;
        await upsertPoint(pointId, vector, payload);
        success++;
        const pct = Math.round((i + 1) / ranked.length * 100);
        process.stdout.write(`  [${pct}%] [${a._richness}★] ${success}/${i + 1} · ${title.substring(0, 45)}\r`);
      }

      await sleep(200);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Cleveland Museum harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Data includes: wall descriptions, fun facts, did-you-know`);
  console.log(`  → These objects will have the richest conversations\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
