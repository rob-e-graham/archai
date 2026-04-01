#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — V&A (London) Harvester (FIXED)
// Fetches modern/contemporary art + technology objects from the V&A
// API v2, embeds via Ollama, stores in Qdrant.
//
// Usage:
//   node va-harvester.js
//   node va-harvester.js --limit 100
//
// API: https://api.vam.ac.uk/v2/objects/search?q=TERM&page_size=45
// Docs: https://developers.vam.ac.uk/guide/v2/search/introduction.html
// Licence: V&A Open Access — non-commercial
// ══════════════════════════════════════════════════════════════════

const VA_API = 'https://api.vam.ac.uk/v2';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_va';
const EMBED_MODEL = 'nomic-embed-text';

const SEARCH_QUERIES = [
  'electronic', 'digital art', 'video art', 'computer',
  'television', 'radio', 'telephone', 'camera',
  'synthesizer', 'kinetic', 'neon', 'light art',
  'installation', 'projection', 'contemporary sculpture',
  'circuit', 'film projector', 'robot', 'scientific instrument',
  'typewriter', 'record player', 'gramophone', 'tape recorder',
  'calculator', 'monitor', 'printer', 'microphone'
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { console.log('    Rate limited, waiting…'); await sleep(3000); continue; }
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
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
  });
  const data = await res.json();
  return data.embedding;
}

async function ensureCollection() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (res.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch (e) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } })
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] })
  });
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — V&A London Harvester (v2)     ║');
  console.log('  ╚══════════════════════════════════════════╝\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (e) { console.error('  ✗ Ollama offline'); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (e) { console.error('  ✗ Qdrant offline'); process.exit(1); }

  await ensureCollection();

  const seenIds = new Set();
  const allObjects = [];
  console.log(`\n  Searching V&A API…\n`);

  for (const query of SEARCH_QUERIES) {
    try {
      // V&A API v2: simple q parameter, page_size up to 100
      const url = `${VA_API}/objects/search?q=${encodeURIComponent(query)}&page_size=45`;
      const data = await fetchJSON(url);
      const records = data.records || [];
      let added = 0;
      for (const rec of records) {
        if (!rec.systemNumber || seenIds.has(rec.systemNumber)) continue;
        // Only keep records with images
        if (!rec._primaryImageId && !(rec._images && rec._images._primary_thumbnail)) continue;
        seenIds.add(rec.systemNumber);
        allObjects.push(rec);
        added++;
      }
      process.stdout.write(`  → "${query}" — ${records.length} results, ${added} new (total: ${allObjects.length})\n`);
      await sleep(400);
    } catch (e) {
      process.stdout.write(`  ⚠ "${query}" — ${e.message}\n`);
    }
  }

  console.log(`\n  ✓ ${allObjects.length} unique objects with images`);
  const toProcess = allObjects.slice(0, LIMIT);
  console.log(`  → Processing ${toProcess.length} (limit ${LIMIT})\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const rec = toProcess[i];
    try {
      const sysNum = rec.systemNumber;
      const title = rec._primaryTitle || rec.objectType || 'Untitled';
      const dateStr = rec._primaryDate || '';
      const maker = rec._primaryMaker && rec._primaryMaker.name ? rec._primaryMaker.name : '';
      const place = rec._primaryPlace || '';
      const objType = rec.objectType || '';
      const accNum = rec.accessionNumber || sysNum;
      const imageId = rec._primaryImageId || '';

      // Image URLs from V&A IIIF
      const thumbUrl = (rec._images && rec._images._primary_thumbnail) ||
        (imageId ? `https://framemark.vam.ac.uk/collections/${imageId}/full/!200,200/0/default.jpg` : '');
      const mediumUrl = imageId ? `https://framemark.vam.ac.uk/collections/${imageId}/full/!600,600/0/default.jpg` : '';
      const largeUrl = imageId ? `https://framemark.vam.ac.uk/collections/${imageId}/full/!1200,1200/0/default.jpg` : '';

      const location = rec._currentLocation && rec._currentLocation.displayName
        ? rec._currentLocation.displayName : 'V&A, London';

      const descParts = [title, objType, maker ? `Made by ${maker}` : '', dateStr,
        place ? `Made in ${place}` : '', location].filter(Boolean);
      const description = descParts.join('. ');

      const payload = {
        canonical_id: `va:${sysNum}`,
        source: 'va',
        source_institution: 'Victoria and Albert Museum, London',
        title, object_type: objType, discipline: objType,
        category: objType, date_range: dateStr,
        registration_number: accNum,
        museum_location: location,
        description, medium: '', artist: maker,
        place_of_origin: place,
        licence: 'V&A Open Access',
        source_url: `https://collections.vam.ac.uk/item/${sysNum}/`,
        media_thumbnail: thumbUrl,
        media_medium: mediumUrl,
        media_large: largeUrl,
        embedding_text: description
      };

      const vector = await embed(description);
      if (!vector || !vector.length) { errors++; continue; }

      await upsertPoint(2000000 + i, vector, payload);
      success++;
      const pct = Math.round((i + 1) / toProcess.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${title.substring(0, 50)}${title.length > 50 ? '…' : ''}\r`);
      await sleep(200);
    } catch (e) { errors++; await sleep(400); }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ V&A harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Licence: V&A Open Access\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
