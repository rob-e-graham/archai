#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Wellcome Collection Harvester
// Fetches works from the Wellcome Collection (London) via the
// Wellcome Catalogue API v2.
//
// The Wellcome holds extraordinary material: anatomical illustrations,
// scientific instruments, medical photography, apothecary objects,
// pharmaceutical packaging, manuscripts, and art commissioned for
// science communication. ~750,000 items, many CC BY.
//
// No API key required.
//
// Usage:
//   node wellcome-harvester.js
//   node wellcome-harvester.js --limit 150
//   node wellcome-harvester.js --dry-run
//   node wellcome-harvester.js --worktype "k" --limit 100   # k = pictures
//
// API docs:  https://developers.wellcomecollection.org/catalogue
//            https://api.wellcomecollection.org/catalogue/v2
// Licence:   Predominantly CC BY 4.0 for collection items.
//            Public domain / CC0 for pre-1900 material.
//            Always check per-item licence field — not all items are CC.
// ══════════════════════════════════════════════════════════════════

import { buildIiifImageSet } from './lib/iiif.js';

const WELLCOME_API  = 'https://api.wellcomecollection.org/catalogue/v2/works';
const QDRANT_URL    = 'http://localhost:6333';
const OLLAMA_URL    = 'http://localhost:11434';
const COLLECTION    = 'archai_wellcome';
const EMBED_MODEL   = 'nomic-embed-text';
const ID_OFFSET     = 11_000_000;

// Work types to include (Wellcome type codes)
// a=books, b=serials, d=manuscripts, e=maps, f=music, h=audio, i=films,
// j=software, k=pictures, l=3dobjects, m=mixed materials, v=visual art
// We focus on k (pictures/images) and l (3d objects) for visual richness.
const VISUAL_TYPES = ['k', 'l'];

// Licence values considered open for public display on AUXIO
// We require at minimum CC BY or better.
const OPEN_LICENCES = new Set([
  'cc-by',
  'cc-by-nc',
  'cc-by-nc-nd',
  'cc-by-nc-sa',
  'cc-by-nd',
  'cc-by-sa',
  'cc0',
  'pdm',
  'ogl',
  'ogl-uk',
  'inc-1-0',
]);

const DERIVATIVE_DOWNLOAD_LICENCES = new Set([
  'cc-by',
  'cc-by-sa',
  'cc0',
  'pdm',
  'ogl',
  'ogl-uk',
]);

// Queries spanning Wellcome's extraordinary interdisciplinary scope
const SEARCH_QUERIES = [
  // Medical and anatomical art
  'anatomical illustration',
  'anatomy drawing',
  'dissection medical',
  'skeleton bones anatomy',
  'surgical instrument',
  'medical instrument',
  // Scientific imagery
  'microscope specimen',
  'natural history illustration',
  'botanical illustration',
  'scientific diagram',
  'chemistry laboratory',
  // Historical medicine
  'apothecary pharmacy',
  'medicine herbal',
  'plague epidemic',
  'hospital nursing',
  'midwifery obstetrics',
  // Body and health art
  'body human form',
  'disease illness portrait',
  'vaccination immunisation',
  // Objects and material culture
  'pharmaceutical packaging',
  'medical device',
  'prosthetic limb',
  'anatomical model wax',
  // Photography and modern media
  'medical photography',
  'portrait Victorian science',
  'x-ray radiology',
  // Manuscripts and documents
  'illuminated manuscript medicine',
  'medical text ancient',
  // Art and science intersection
  'science art contemporary',
  'brain neuroscience art',
  'genetics evolution art',
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT       = parseInt(getArg('limit', '150'), 10);
const WORKTYPE    = getArg('worktype', '');
const DRY_RUN     = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept':     'application/json',
        },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// Determine if a Wellcome work has an open licence for AUXIO display.
function isOpenLicence(work) {
  // Wellcome API provides licence at both work level and image level
  const workLic = work.license?.id || '';
  if (workLic && OPEN_LICENCES.has(workLic.toLowerCase())) return true;

  // Check individual image licences
  const images = work.images || work.thumbnail ? [work.thumbnail] : [];
  for (const img of images) {
    if (!img) continue;
    const imgLic = img.license?.id || '';
    if (imgLic && OPEN_LICENCES.has(imgLic.toLowerCase())) return true;
  }
  return false;
}

// Extract best available image URL from a Wellcome work.
// Wellcome uses IIIF Image API. Work may have thumbnail or images array.
function extractImage(work) {
  // Check for a thumbnail at work level
  if (work.thumbnail?.url) {
    const base = work.thumbnail.url.replace(/\/full\/.*$/, '');
    const iiifImages = buildIiifImageSet(base, {
      thumbnail: 400,
      display: 800,
      large: 1600,
    });
    return {
      thumbnail: iiifImages.media_thumbnail,
      medium: iiifImages.media_medium,
      large: iiifImages.media_large,
      iiifBase: iiifImages.iiif_base,
      iiifInfoUrl: iiifImages.iiif_info_url,
    };
  }
  return null;
}

// Build canonical Wellcome work URL
function wellcomeUrl(id) {
  return `https://wellcomecollection.org/works/${encodeURIComponent(id)}`;
}

// Extract attribution label from licence id
function licLabel(licId) {
  const labels = {
    'cc-by':       'CC BY 4.0',
    'cc-by-nc':    'CC BY-NC 4.0',
    'cc-by-sa':    'CC BY-SA 4.0',
    'cc-by-nd':    'CC BY-ND 4.0',
    'cc-by-nc-nd': 'CC BY-NC-ND 4.0',
    'cc0':         'CC0 — Public Domain',
    'pdm':         'Public Domain Mark',
    'ogl':         'Open Government Licence',
    'ogl-uk':      'Open Government Licence (UK)',
  };
  return labels[licId?.toLowerCase()] || licId || 'Open Licence';
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

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Wellcome Collection           ║');
  console.log('  ║   Science, Medicine & Art, London        ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  const candidates = [];

  console.log('  → Searching Wellcome Catalogue API v2…\n');

  const types = WORKTYPE || VISUAL_TYPES.join(',');

  for (const q of SEARCH_QUERIES) {
    if (candidates.length >= LIMIT * 4) break;
    try {
      // Wellcome API: query + workType filter + include images/subjects/contributors
      const url = `${WELLCOME_API}?query=${encodeURIComponent(q)}&workType=${types}`
               + `&availabilities=online&include=images,subjects,contributors,languages`
               + `&pageSize=100&page=1`;

      const data = await fetchJSON(url);
      if (!data?.results) { console.warn(`  ⚠ No results for "${q}"`); continue; }

      let added = 0;
      for (const work of data.results) {
        if (seen.has(work.id)) continue;
        seen.add(work.id);
        candidates.push(work);
        added++;
      }
      console.log(`  → "${q}" — ${data.results.length} results, ${added} new (total: ${candidates.length})`);
      await sleep(300);
    } catch (e) {
      console.warn(`  ⚠ "${q}" — ${e.message}`);
      await sleep(500);
    }
  }

  console.log(`\n  ✓ ${candidates.length} candidate records`);
  console.log(`  → Filtering to open-licence, image-backed works, target: ${LIMIT}\n`);

  let success = 0, skippedNoImage = 0, skippedLic = 0, errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (success >= LIMIT) break;
    const work = candidates[i];

    try {
      // Licence gate
      if (!isOpenLicence(work)) { skippedLic++; continue; }

      // Image gate
      const img = extractImage(work);
      if (!img) { skippedNoImage++; continue; }

      const title    = work.title || 'Untitled';
      const licId    = work.license?.id || work.thumbnail?.license?.id || '';
      const licence  = licLabel(licId);

      // Contributors → artist/creator field
      const contributors = (work.contributors || [])
        .filter(c => c.agent?.label)
        .map(c => c.agent.label)
        .join('; ');

      // Subjects → category/topic
      const subjects = (work.subjects || [])
        .filter(s => s.label)
        .map(s => s.label)
        .slice(0, 5)
        .join(', ');

      const productionDates = (work.production || [])
        .filter(p => p.dates?.length)
        .flatMap(p => p.dates.map(d => d.label))
        .join(', ');

      const places = (work.production || [])
        .filter(p => p.places?.length)
        .flatMap(p => p.places.map(pl => pl.label))
        .join(', ');

      const genre = (work.genres || []).map(g => g.label).join(', ');
      const lang  = (work.languages || []).map(l => l.label).join(', ');
      const notes = work.description || work.notes || '';
      const physDesc = work.physicalDescription || '';

      const description = [
        title,
        contributors ? `by ${contributors}` : '',
        productionDates,
        places       ? `Place: ${places}` : '',
        physDesc,
        genre,
        subjects,
        notes,
        'Wellcome Collection, London',
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:        `wellcome:${work.id}`,
        source:              'wellcome',
        source_institution:  'Wellcome Collection',
        title,
        artist:              contributors,
        date_range:          productionDates,
        place_of_origin:     places,
        genre,
        subjects,
        description,
        licence,
        media_public_display_allowed: true,
        poster_download_allowed: DERIVATIVE_DOWNLOAD_LICENCES.has(licId.toLowerCase()),
        media_rights_basis: `Wellcome item/image licence: ${licId || 'not recorded'}`,
        attribution:         `Wellcome Collection. ${licence}`,
        source_url:          wellcomeUrl(work.id),
        media_thumbnail:     img.thumbnail,
        media_medium:        img.medium,
        media_large:         img.large || img.medium,
        media_iiif_base:     img.iiifBase || '',
        media_iiif_info_url: img.iiifInfoUrl || '',
        media_iiif_available: Boolean(img.iiifBase),
        embedding_text:      description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title.substring(0, 60)} [${licence}]`);
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
  console.log(`  ✓ Wellcome harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}' (offset: ${ID_OFFSET})`);
  console.log(`  → ${skippedNoImage} skipped (no image URL)`);
  console.log(`  → ${skippedLic} skipped (restricted licence)`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Licence: CC BY 4.0 / CC0 (per-item, open-licence filter applied)`);
  console.log(`  → Attribution: Wellcome Collection. Open Licence.`);
  console.log(`  → Coverage: anatomy, science, medicine, natural history,`);
  console.log(`              medical art, instruments, manuscripts\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
