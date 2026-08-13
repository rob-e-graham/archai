#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Wikimedia Commons Harvester
// Freely-licensed cultural-heritage media (CC0 / CC BY / CC BY-SA / PD)
// from Wikimedia Commons, with per-file licence read from extmetadata.
//
// No API key required.
//
// Usage:
//   node wikimedia-harvester.js                 # dry-run by default
//   node wikimedia-harvester.js --apply --limit 200
//   node wikimedia-harvester.js --apply --query "vintage camera"
//
// API docs: https://commons.wikimedia.org/w/api.php?action=help&modules=query
// Licence:  per-file. Only records whose extmetadata licence matches the
//           open allow-list are marked public-display; everything else is held.
// ══════════════════════════════════════════════════════════════════

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_wikimedia';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET = 3100000; // keep this collection's point IDs in its own range

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY;
const SINGLE_QUERY = getArg('query', '');

// Open-licence allow-list (matched case-insensitively against extmetadata licence).
const OPEN_LICENCES = ['cc0', 'public domain', 'pdm', 'cc-by', 'cc by', 'cc-by-sa', 'cc by-sa', 'no restrictions'];

// Records whose title/description match any of these are excluded. Keeps a
// former-employer institution out of the system during legal resolution.
const EXCLUDE_PATTERNS = [/national communication museum/i];

// Wikimedia ObjectName/caption values often carry structured-data markup like
// `label QS:Lit,"..."` or `title QS:P1476,en:"..."`. Strip it to the plain title.
function cleanCommonsTitle(raw) {
  let t = String(raw || '');
  t = t.replace(/\s*(?:label|title)\s+QS:.*$/is, '');
  const quoted = t.match(/"([^"]{3,})"/);
  if (/QS:/i.test(String(raw)) && quoted) t = quoted[1];
  return t.replace(/\s+/g, ' ').trim();
}

// Heritage-leaning search terms; each is a Commons full-text file search.
const SEARCH_QUERIES = SINGLE_QUERY ? [SINGLE_QUERY] : [
  'museum object collection', 'historical photograph', 'painting oil canvas',
  'sculpture bronze marble', 'ceramic vessel pottery', 'textile costume dress',
  'scientific instrument', 'vintage poster design', 'manuscript illuminated',
  'archaeological artifact', 'furniture decorative arts', 'jewellery ornament',
  'printmaking engraving', 'photograph portrait 19th century', 'map antique',
  'aircraft aviation history', 'natural history specimen', 'coin medal numismatic',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)', 'Accept': 'application/json' },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// extmetadata values are HTML fragments; strip tags and collapse whitespace.
function stripHtml(v) {
  return String(v || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}
function meta(extmeta, key) {
  return extmeta && extmeta[key] && extmeta[key].value !== undefined ? stripHtml(extmeta[key].value) : '';
}

function normaliseRights(licenceStr) {
  const v = String(licenceStr || '').toLowerCase();
  if (!v) return { open: false, status: 'unknown' };
  const open = OPEN_LICENCES.some((l) => v.includes(l));
  return { open, status: open ? 'open' : 'check-source' };
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: String(text).substring(0, 2000) }),
  });
  return (await res.json()).embedding;
}

async function ensureCollection() {
  try { const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`); if (r.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; } } catch (_) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } }),
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
}

function mapPage(page) {
  const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
  if (!info || !info.url) return null;
  const ext = info.extmetadata || {};
  const licence = meta(ext, 'LicenseShortName') || meta(ext, 'License') || meta(ext, 'UsageTerms');
  const rights = normaliseRights(licence + ' ' + meta(ext, 'License'));
  const rawTitle = meta(ext, 'ObjectName') || String(page.title || '').replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
  const title = cleanCommonsTitle(stripHtml(rawTitle)) || 'Untitled';
  const description = meta(ext, 'ImageDescription');
  const creator = meta(ext, 'Artist');
  const date = meta(ext, 'DateTimeOriginal') || meta(ext, 'DateTime');
  const credit = meta(ext, 'Credit');
  const thumb = info.thumburl || info.url;
  const embedding_text = [title, creator ? `by ${creator}` : '', date, description, credit, 'Wikimedia Commons']
    .filter(Boolean).join('. ');
  return {
    ok: Boolean(title && info.url),
    payload: {
      canonical_id: `wikimedia:${page.pageid}`,
      source: 'wikimedia',
      source_institution: 'Wikimedia Commons',
      source_record_id: String(page.pageid),
      title,
      object_type: meta(ext, 'ObjectName') ? 'Cultural object' : 'Media',
      category: '',
      date_range: date,
      artist: creator,
      description,
      credit_line: credit,
      licence: licence || 'See file page',
      legal_status_normalised: rights.status,
      media_thumbnail: thumb,
      media_medium: thumb,
      media_large: info.url,
      media_available: true,
      media_public_display_allowed: rights.open,
      poster_download_allowed: false,
      source_url: info.descriptionurl || `https://commons.wikimedia.org/?curid=${page.pageid}`,
      harvested_at: new Date().toISOString(),
      harvester: 'wikimedia-harvester.js',
      embedding_text,
    },
  };
}

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Wikimedia Commons             ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes; pass --apply to write]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }
  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }
  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  let success = 0, skippedNoOpen = 0, excluded = 0, errors = 0;

  for (const q of SEARCH_QUERIES) {
    if (success >= LIMIT) break;
    try {
      const url = `${COMMONS_API}?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=800&origin=*`;
      const data = await fetchJSON(url);
      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
      let added = 0;
      for (const page of pages) {
        if (success >= LIMIT) break;
        if (seen.has(page.pageid)) continue;
        seen.add(page.pageid);
        const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
        if (info && info.mime && !/^image\//.test(info.mime)) continue;
        const rec = mapPage(page);
        if (!rec || !rec.ok) continue;
        const haystack = `${rec.payload.title} ${rec.payload.description}`;
        if (EXCLUDE_PATTERNS.some((re) => re.test(haystack))) { excluded++; continue; }
        if (!rec.payload.media_public_display_allowed) { skippedNoOpen++; continue; }
        if (DRY_RUN) { console.log(`  [dry] ${rec.payload.title.substring(0, 55)} — ${rec.payload.licence}`); success++; added++; continue; }
        try {
          const vector = await embed(rec.payload.embedding_text);
          if (!vector?.length) { errors++; continue; }
          await upsertPoint(ID_OFFSET + success, vector, rec.payload);
          success++; added++;
          await sleep(120);
        } catch (_) { errors++; await sleep(300); }
      }
      console.log(`  → "${q}" — ${pages.length} files, ${added} admitted (total: ${success})`);
      await sleep(400);
    } catch (e) { console.warn(`  ⚠ "${q}" — ${e.message}`); }
  }

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Wikimedia harvest ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} open-licensed image-backed records ${DRY_RUN ? 'would be' : ''} embedded into '${COLLECTION}'`);
  console.log(`  → ${skippedNoOpen} skipped (licence not on the open allow-list)`);
  console.log(`  → ${excluded} excluded (matched exclusion list)`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Register: add 'archai_wikimedia' to ALLOWED_COLLECTIONS + COLLECTION_LABELS (already done in this branch)\n`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
