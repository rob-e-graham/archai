#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Getty Museum Open Content Harvester
// Fetches CC0-cleared works from the J. Paul Getty Museum, Los Angeles.
// ~140,000 open-content images: Greek/Roman antiquities, European
// painting, illuminated manuscripts, photography, drawings.
//
// No API key required.
//
// Usage:
//   node getty-harvester.js
//   node getty-harvester.js --limit 200
//   node getty-harvester.js --dry-run
//   node getty-harvester.js --department "Antiquities" --limit 100
//
// API docs:  https://data.getty.edu/museum/collection/
//            https://www.getty.edu/art/collection/
// Licence:   CC0 1.0 Universal — public domain, no restrictions.
//            https://www.getty.edu/about/whatwedo/opencontent.html
// ══════════════════════════════════════════════════════════════════

// collectionapi.getty.edu was retired — new endpoints are at data.getty.edu
const SPARQL_ENDPOINT = 'https://data.getty.edu/museum/collection/sparql';
const OBJECT_BASE     = 'https://data.getty.edu/museum/collection/object/';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_getty';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET  = 10_000_000;

// Getty Open Content: searches that reliably yield CC0-cleared objects
// with strong image coverage across the museum's key holdings.
const SEARCH_QUERIES = [
  // Antiquities (largest CC0 holding)
  'Greek vase',
  'Roman sculpture',
  'ancient Greek',
  'Greek amphora',
  'Roman portrait',
  'terracotta figure',
  'ancient bronze',
  'Greek kylix',
  'Etruscan',
  // European painting
  'oil painting Dutch',
  'Italian Renaissance',
  'Flemish painting',
  'French painting',
  'landscape painting',
  'portrait painting',
  'religious painting',
  // Drawings and manuscripts
  'illuminated manuscript',
  'drawing chalk',
  'pen ink drawing',
  'watercolor',
  // Photography (Getty holds major photo collections)
  'photograph 19th century',
  'daguerreotype',
  'photogravure',
  'albumen print',
  // Decorative arts
  'French furniture',
  'tapestry',
  'decorative arts',
  'silver',
  'ceramic majolica',
  'glass Venetian',
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT      = parseInt(getArg('limit', '200'), 10);
const DEPT_FILTER = getArg('department', '');
const DRY_RUN    = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── SPARQL HELPERS ───────────────────────────────────────────────

// GET a batch of Getty object URIs via SPARQL pagination
async function sparqlBatch(offset, batchSize, retries = 3) {
  const query = `
SELECT ?object WHERE {
  ?object a <http://www.cidoc-crm.org/cidoc-crm/E22_Human-Made_Object> .
  FILTER(STRSTARTS(STR(?object), "${OBJECT_BASE}"))
} LIMIT ${batchSize} OFFSET ${offset}`.trim();

  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=application/sparql-results%2Bjson`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept': 'application/sparql-results+json',
        },
      });
      if (res.status === 429) { await sleep(8000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
      const data = await res.json();
      return (data.results?.bindings || []).map(b => b.object.value);
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(3000 * (i + 1));
    }
  }
  return [];
}

// Fetch a single Getty Linked Art object record (JSON-LD)
async function fetchGettyObject(uri, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(uri, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept': 'application/ld+json, application/json',
        },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) return null;
      await sleep(2000 * (i + 1));
    }
  }
  return null;
}

// ── LINKED ART PARSER ────────────────────────────────────────────

// Parse a Getty Linked Art JSON-LD object record into a clean payload.
// Returns null if the object is not open content or lacks a title.
function parseGettyLinkedArt(obj, uri) {
  if (!obj) return null;

  // Title — top-level _label is the primary display name
  const title = obj._label
    || obj.identified_by?.find(x => x.type === 'Name' || x.type === 'Appellation')?.content
    || '';
  if (!title || title === 'Unknown') return null;

  // Extract UUID from object URI for building image URLs
  const uuid = uri.replace(OBJECT_BASE, '').replace(/\/$/, '');

  // Creator — from Production/Creation carried_out_by
  const production = obj.produced_by || obj.created_by || {};
  const creatorNode = production.carried_out_by?.[0];
  const creator = creatorNode?._label || creatorNode?.identified_by?.[0]?.content || '';

  // Date — from Production timespan
  const date = production.timespan?._label
             || production.timespan?.begin_of_the_begin?.slice(0, 4)
             || '';

  // Medium/material — from made_of or classified_as
  const medium = obj.made_of?.[0]?._label
               || obj.classified_as?.find(x => x.type === 'Type' && x._label && !x._label.match(/^(Object|Art)/i))?._label
               || '';

  // Department — from member_of
  const dept = obj.member_of?.find(x => x._label)?._label || '';

  // Credit line — from referred_to_by
  const credit = obj.referred_to_by?.find(x =>
    x.classified_as?.some(c => String(c.id || '').includes('300435424') || String(c._label || '').toLowerCase().includes('credit'))
  )?.content || '';

  // Dimensions
  const dims = obj.dimension?.map(d => `${d.value}${d.unit?._label || ''}`).join(' × ') || '';

  // Culture / nationality
  const culture = obj.about?.find(x => x.type === 'Place')?._label || '';

  // Open content detection — look for CC0 or "Open Content" in rights/subject_to
  let isOpenContent = false;
  const rights = obj.subject_to || obj.referred_to_by || [];
  for (const r of rights) {
    const content = String(r.content || r._label || '').toLowerCase();
    if (content.includes('cc0') || content.includes('open content') || content.includes('public domain')) {
      isOpenContent = true; break;
    }
    // Check classified_as for CC0 AAT term (300435656)
    if (r.classified_as?.some(c => String(c.id || '').includes('300435656'))) {
      isOpenContent = true; break;
    }
  }

  // Image URLs — navigate Linked Art digitally_shown_by chain
  let imageUrl = null;
  const showsArr = Array.isArray(obj.shows) ? obj.shows : [];
  outer: for (const s of showsArr) {
    const dsb = Array.isArray(s.digitally_shown_by) ? s.digitally_shown_by : [];
    for (const d of dsb) {
      const aps = Array.isArray(d.access_point) ? d.access_point : [];
      for (const ap of aps) {
        const apUrl = typeof ap === 'string' ? ap : ap?.id || '';
        if (apUrl.includes('media.getty.edu')) { imageUrl = apUrl; break outer; }
      }
    }
  }

  // Fallback: try thumbnail
  if (!imageUrl) {
    const thumb = obj.thumbnail?.[0];
    const thumbUrl = typeof thumb === 'string' ? thumb : thumb?.id || '';
    if (thumbUrl.includes('http')) imageUrl = thumbUrl;
  }

  if (!imageUrl) return null;
  if (!isOpenContent) return null;

  const thumbUrl = imageUrl.replace(/\/full\/[^/]+\//, '/full/!400,400/');

  return { uuid, title, creator, date, medium, dept, credit, dims, culture, imageUrl, thumbUrl };
}

// Getty IIIF image URL — retained for reference
function gettyImageUrl(imageId, size = '!800,800') {
  return `https://media.getty.edu/iiif/image/${imageId}/full/${size}/0/default.jpg`;
}

function gettyThumbUrl(imageId) {
  return gettyImageUrl(imageId, '!400,400');
}

// ── EMBEDDING ────────────────────────────────────────────────────
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) }),
  });
  return (await res.json()).embedding;
}

// ── QDRANT ───────────────────────────────────────────────────────
async function ensureCollection() {
  try {
    const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (r.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch (_) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } }),
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
}

// Build the canonical Getty object URL
function gettyObjectUrl(uuid) {
  return `https://www.getty.edu/art/collection/object/${encodeURIComponent(uuid)}`;
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Getty Museum Open Content     ║');
  console.log('  ║   J. Paul Getty Museum, Los Angeles      ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  // ── SPARQL PAGINATION ──────────────────────────────────────────
  // Get object URIs in batches from the Linked Art SPARQL endpoint,
  // then fetch each object's JSON-LD for full metadata and image URLs.

  console.log('  → Querying Getty Linked Art SPARQL endpoint…\n');
  console.log(`  → Endpoint: ${SPARQL_ENDPOINT}`);
  console.log(`  → Strategy: SPARQL pagination → per-object JSON-LD fetch\n`);

  const uris = [];
  const BATCH = 200;
  let offset = 0;
  let batchFails = 0;

  // Collect enough URIs to fill LIMIT (allow for some skips due to no image/no open content)
  while (uris.length < LIMIT * 4 && batchFails < 3) {
    try {
      const batch = await sparqlBatch(offset, BATCH);
      if (!batch.length) break;
      uris.push(...batch);
      console.log(`  → Collected ${uris.length} object URIs (offset ${offset})…`);
      offset += BATCH;
      await sleep(800);
    } catch (e) {
      batchFails++;
      console.warn(`  ⚠ SPARQL batch failed (attempt ${batchFails}): ${e.message}`);
      await sleep(3000);
    }
  }

  if (!uris.length) {
    console.error('\n  ✗ SPARQL returned no results.');
    console.error('  → Endpoint: ' + SPARQL_ENDPOINT);
    console.error('  → Try: curl -sI "https://data.getty.edu/museum/collection/sparql"\n');
    process.exit(1);
  }

  // Shuffle for variety across collection areas
  uris.sort(() => Math.random() - 0.5);

  console.log(`\n  ✓ ${uris.length} object URIs collected`);
  console.log(`  → Fetching JSON-LD for up to ${LIMIT} open-content objects…\n`);

  let success = 0, skipped = 0, errors = 0;

  for (let i = 0; i < uris.length; i++) {
    if (success >= LIMIT) break;
    const uri = uris[i];

    try {
      const raw = await fetchGettyObject(uri);
      const parsed = parseGettyLinkedArt(raw, uri);

      if (!parsed) { skipped++; await sleep(80); continue; }

      const { uuid, title, creator, date, medium, dept, credit, dims, culture, imageUrl, thumbUrl } = parsed;

      const description = [
        title,
        creator ? `by ${creator}` : '',
        culture ? `(${culture})` : '',
        date,
        medium,
        dept,
        dims    ? `Dimensions: ${dims}` : '',
        credit  ? `Credit: ${credit}` : '',
        'J. Paul Getty Museum, Los Angeles',
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:        `getty:${uuid}`,
        source:              'getty',
        source_institution:  'J. Paul Getty Museum',
        title,
        artist:              creator,
        date_range:          String(date),
        medium,
        department:          dept,
        culture,
        dimensions:          dims,
        credit_line:         credit,
        description,
        licence:             'CC0 1.0 Universal — Public Domain',
        media_public_display_allowed: true,
        poster_download_allowed: true,
        media_rights_basis:  'Explicit Getty Linked Art Open Content / CC0 statement',
        source_url:          gettyObjectUrl(uuid),
        media_thumbnail:     thumbUrl,
        media_medium:        imageUrl,
        media_large:         imageUrl,
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title.substring(0, 60)}${creator ? ` — ${creator}` : ''}`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(ID_OFFSET + success, vector, payload);
      success++;

      const pct = Math.round(success / LIMIT * 100);
      process.stdout.write(`  [${pct}%] ${success}/${LIMIT} · ${title.substring(0, 50)}\r`);
      await sleep(200);
    } catch (e) {
      errors++;
      await sleep(400);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Getty harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}' (offset: ${ID_OFFSET})`);
  console.log(`  → ${skipped} skipped (no open content image)`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Licence: CC0 1.0 Universal (Getty Open Content Program)`);
  console.log(`  → Coverage: Greek/Roman antiquities, European paintings, manuscripts,`);
  console.log(`              photography, drawings, decorative arts\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
