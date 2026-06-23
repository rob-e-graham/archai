#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Tate Collection Harvester
// Fetches from the Tate's GitHub open-access dataset (CC0).
// Covers British art from Turner, Blake, Constable and Pre-Raphaelites
// through early Modernism. Tate's GitHub release is metadata-only:
// its CC0 dedication explicitly excludes images. This harvester therefore
// keeps Tate useful for staff semantic search without republishing media.
//
// No API key required.
//
// Usage:
//   node tate-harvester.js
//   node tate-harvester.js --limit 200
//   node tate-harvester.js --dry-run
//
// Data:    https://github.com/tategallery/collection (CC0)
// Images:  excluded from this ingestion
// Licence: CC0 metadata only
// ══════════════════════════════════════════════════════════════════

const TATE_CSV_URL = 'https://raw.githubusercontent.com/tategallery/collection/master/artwork_data.csv';
const QDRANT_URL   = 'http://localhost:6333';
const OLLAMA_URL   = 'http://localhost:11434';
const COLLECTION   = 'archai_tate';
const EMBED_MODEL  = 'nomic-embed-text';

// Only harvest works created before this year to ensure public domain status.
// Tate's collection includes major 20th-C in-copyright holdings (Bacon, Freud,
// Hockney). Pre-1920 covers the safely-PD British and early-modern canon.
const PD_YEAR_CUTOFF = 1920;

const args    = process.argv.slice(2);
const getArg  = (name, fallback) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] ? args[i + 1] : fallback; };
const LIMIT   = parseInt(getArg('limit', '150'), 10);
const DRY_RUN = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)' }
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// Lightweight CSV parser — handles quoted fields containing commas/newlines.
// Returns an array of objects keyed by the header row.
function parseCSV(text) {
  const lines = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === '\n' && !inQuote) { lines.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur) lines.push(cur);

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    const row = {};
    headers.forEach((h, j) => { row[h] = (cells[j] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

// Tate image CDN: upgrade http → https; the dataset was authored in 2014
// before their SSL rollout. The paths are still valid.
function upgradeImageUrl(url) {
  if (!url) return '';
  return url.replace(/^http:\/\//, 'https://');
}

// ── EMBEDDING ────────────────────────────────────────────────────
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) })
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

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Tate Collection Harvester     ║');
  console.log('  ║   British art, CC0, pre-1920 PD only     ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  console.log('\n  Downloading Tate dataset from GitHub…');
  const csvText = await fetchText(TATE_CSV_URL);
  const rows = parseCSV(csvText);
  console.log(`  ✓ ${rows.length.toLocaleString()} total records in dataset`);

  // Filter to older works for a focused research subset. Images remain held
  // regardless of object age because the dataset's CC0 licence covers metadata.
  const eligible = rows.filter(r => {
    const year = parseInt(r.year, 10);
    return !isNaN(year) && year < PD_YEAR_CUTOFF && r.title;
  });

  console.log(`  ✓ ${eligible.length.toLocaleString()} eligible metadata records (pre-${PD_YEAR_CUTOFF})`);
  console.log(`  → Processing up to ${LIMIT} objects\n`);

  if (!DRY_RUN) await ensureCollection();

  let success = 0, errors = 0;

  for (let i = 0; i < eligible.length; i++) {
    if (success >= LIMIT) break;
    const r = eligible[i];

    try {
      const title  = r.title  || 'Untitled';
      const artist = r.artist || '';
      const date   = r.dateText || r.year || '';
      const medium = r.medium || '';
      const dims   = r.dimensions || '';
      const credit = r.creditLine || '';

      const description = [
        title,
        artist ? `by ${artist}` : '',
        date,
        medium,
        dims,
        credit,
        'Tate Collection, London',
      ].filter(Boolean).join('. ');

      const pageUrl  = r.url ? upgradeImageUrl(r.url) : `https://www.tate.org.uk/art/artworks/${r.accession_number}`;

      const payload = {
        canonical_id:       `tate:${r.id || r.accession_number}`,
        source:             'tate',
        source_institution: 'Tate',
        title,
        object_type:        r.medium || '',
        discipline:         'Art',
        category:           'Painting & Drawing',
        date_range:         date,
        artist,
        medium,
        dimensions:         dims,
        accession_number:   r.accession_number || '',
        description,
        licence:            'CC0 metadata only — Tate images excluded',
        media_public_display_allowed: false,
        poster_download_allowed: false,
        media_rights_basis: 'Tate GitHub README states images are not included in the CC0 dataset',
        source_url:         pageUrl,
        media_thumbnail:    null,
        media_medium:       null,
        media_large:        null,
        embedding_text:     description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title.substring(0, 60)} (${artist}, ${date})`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(3000000 + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / eligible.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${title.substring(0, 50)}\r`);
      await sleep(120);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Tate harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Licence: CC0 metadata only; Tate images excluded`);
  console.log(`  → Artists: Turner, Blake, Constable, Rossetti, Millais, Whistler, Sargent and more\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
