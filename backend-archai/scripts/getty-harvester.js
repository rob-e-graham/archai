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

const GETTY_API  = 'https://collectionapi.getty.edu/api/gci/objects';
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

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept': 'application/json',
        },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// Getty IIIF image URL — full IIIF Image API endpoint
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

// ── OBJECT PROCESSING ────────────────────────────────────────────

// Check if an object from the Getty API has an open-content image.
// The Getty API returns `open_content_status` or `has_images` fields.
// We accept objects where open_content is explicitly true.
function isOpenContent(obj) {
  // Various field names used across different Getty API versions
  if (obj.is_open_content === true)    return true;
  if (obj.open_content === true)       return true;
  if (obj.hasOpenContent === true)     return true;
  // Licence field check
  const lic = String(obj.object_end_date || '').toLowerCase();
  const rights = String(obj.rights || obj.creditLine || '').toLowerCase();
  if (rights.includes('cc0') || rights.includes('public domain')) return true;
  return false;
}

// Extract primary image ID from a Getty object.
// Getty IIIF image IDs are typically UUIDs or numeric IDs.
function extractImageId(obj) {
  // Primary image field options across Getty API versions
  if (obj.primaryImage)             return obj.primaryImage;
  if (obj.primaryImageId)           return obj.primaryImageId;
  if (obj.images?.web?.url)         return obj.images.web.url;    // full URL — use as-is
  if (Array.isArray(obj.images) && obj.images[0]?.id)
                                    return obj.images[0].id;
  return null;
}

// Build the canonical Getty object URL
function gettyObjectUrl(id) {
  return `https://www.getty.edu/art/collection/object/${encodeURIComponent(id)}`;
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

  const seen = new Set();
  const candidates = [];

  console.log('  → Searching Getty Open Content collections…\n');

  for (const q of SEARCH_QUERIES) {
    if (candidates.length >= LIMIT * 3) break;
    try {
      // Getty collection search: q param, open_content filter
      let url = `${GETTY_API}?q=${encodeURIComponent(q)}&open_content=true&limit=100&page=1`;
      if (DEPT_FILTER) url += `&department=${encodeURIComponent(DEPT_FILTER)}`;

      const data = await fetchJSON(url);
      if (!data) { console.warn(`  ⚠ No response for "${q}"`); continue; }

      // API may return results in data.data, data.results, data.objects, or root array
      const rows = data.data || data.results || data.objects || (Array.isArray(data) ? data : []);

      let added = 0;
      for (const obj of rows) {
        const id = String(obj.id || obj.objectId || obj.object_id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        candidates.push(obj);
        added++;
      }
      console.log(`  → "${q}" — ${rows.length} results, ${added} new (total: ${candidates.length})`);
      await sleep(350);
    } catch (e) {
      console.warn(`  ⚠ "${q}" — ${e.message}`);
      await sleep(500);
    }
  }

  if (!candidates.length) {
    console.error('\n  ✗ No candidates found — possible API endpoint change.');
    console.error('  → Check API at: https://data.getty.edu/museum/collection/');
    console.error('  → Collection browser: https://www.getty.edu/art/collection/\n');
    process.exit(1);
  }

  console.log(`\n  ✓ ${candidates.length} candidate records`);
  console.log(`  → Processing up to ${LIMIT} open-content objects…\n`);

  let success = 0, skipped = 0, errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (success >= LIMIT) break;
    const obj = candidates[i];

    try {
      // Attempt to fetch detailed record if the search result is a stub
      let detail = obj;
      const objId = String(obj.id || obj.objectId || obj.object_id || '');
      if (!objId) { skipped++; continue; }

      // Check open content flag
      if (!isOpenContent(detail)) {
        // Try fetching the detail record for authoritative open content flag
        const detailUrl = `${GETTY_API}/${encodeURIComponent(objId)}`;
        const d = await fetchJSON(detailUrl);
        if (!d) { skipped++; continue; }
        detail = d.data || d.object || d;
        if (!isOpenContent(detail)) { skipped++; continue; }
        await sleep(120);
      }

      const imageId = extractImageId(detail);
      if (!imageId) { skipped++; continue; }

      // Build image URLs — if imageId is already a full URL, use it directly
      const isFullUrl = imageId.startsWith('http');
      const thumb  = isFullUrl ? imageId : gettyThumbUrl(imageId);
      const medium = isFullUrl ? imageId : gettyImageUrl(imageId);

      const title   = detail.title?.value || detail.title || 'Untitled';
      const artist  = detail.primaryArtistMakerOrCulture || detail.maker?.label
                   || detail.artistDisplayName || detail.culture || '';
      const date    = detail.primaryDateForSorting?.toString()
                   || detail.date?.displayDate || detail.objectDate || '';
      const medium_ = detail.primaryMedium || detail.medium || '';
      const dept    = detail.department?.label || detail.departmentName || '';
      const classif = detail.primaryClassification || detail.classifications?.[0]?.label || '';
      const culture = detail.culture || '';
      const dims    = detail.dimensions || '';
      const credit  = detail.creditLine || '';
      const place   = detail.placeOfOrigin || detail.geography?.label || '';
      const notes   = detail.description || detail.inscriptions || '';

      const description = [
        title,
        artist   ? `by ${artist}` : '',
        culture  ? `(${culture})` : '',
        date,
        medium_,
        classif,
        dept,
        place    ? `Origin: ${place}` : '',
        notes,
        credit   ? `Credit: ${credit}` : '',
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:        `getty:${objId}`,
        source:              'getty',
        source_institution:  'J. Paul Getty Museum',
        title,
        artist,
        date_range:          String(date),
        medium:              medium_,
        classification:      classif,
        department:          dept,
        culture,
        place_of_origin:     place,
        dimensions:          dims,
        credit_line:         credit,
        description,
        licence:             'CC0 1.0 Universal — Public Domain',
        source_url:          gettyObjectUrl(objId),
        media_thumbnail:     thumb,
        media_medium:        medium,
        media_large:         medium,
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title.substring(0, 60)} — ${artist}`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(ID_OFFSET + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / candidates.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${candidates.length} · ${title.substring(0, 50)}\r`);
      await sleep(150);
    } catch (e) {
      errors++;
      await sleep(300);
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
