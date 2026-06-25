#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Rijksmuseum (Amsterdam) Harvester
// 800,000+ objects from the Netherlands' national museum.
// Uses OAI-PMH endpoint — NO API KEY REQUIRED.
// IIIF images via Micrio CDN.
//
// Usage:
//   node rijksmuseum-harvester.js
//   node rijksmuseum-harvester.js --limit 200
//   node rijksmuseum-harvester.js --dry-run
//
// API: OAI-PMH at data.rijksmuseum.nl/oai (Dublin Core)
// Images: IIIF via iiif.micr.io
// Licence: CC0 / Public Domain Mark
// ══════════════════════════════════════════════════════════════════

import { buildIiifImageSet } from './lib/iiif.js';

const OAI_URL = 'https://data.rijksmuseum.nl/oai';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_rijks';
const EMBED_MODEL = 'nomic-embed-text';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT = parseInt(getArg('limit', '150'), 10);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── XML PARSING (lightweight, no deps) ────────────────────────────
function extractTag(xml, tag) {
  const re = new RegExp(`<(?:dc:)?${tag}[^>]*>([\\s\\S]*?)</(?:dc:)?${tag}>`, 'g');
  const values = [];
  let m;
  while ((m = re.exec(xml)) !== null) values.push(m[1].trim());
  return values;
}

function extractIdentifier(xml) {
  const m = xml.match(/<identifier>([^<]+)<\/identifier>/);
  return m ? m[1].trim() : '';
}

function parseRecords(xml) {
  const records = [];
  const chunks = xml.split('<record>').slice(1);
  for (const chunk of chunks) {
    const block = chunk.split('</record>')[0];

    // Skip deleted records
    if (block.includes('status="deleted"')) continue;

    const id = extractIdentifier(block);
    const titles = extractTag(block, 'title');
    const creators = extractTag(block, 'creator');
    const dates = extractTag(block, 'date');
    const descriptions = extractTag(block, 'description');
    const formats = extractTag(block, 'format');
    const types = extractTag(block, 'type');
    const relations = extractTag(block, 'relation');
    const rights = extractTag(block, 'rights');
    const subjects = extractTag(block, 'subject');

    // Find IIIF image URL
    const img = relations.find(r => r.includes('iiif.micr.io')) || '';

    // Only keep records with images and titles
    if (!img || !titles.length) continue;

    const iiifImages = buildIiifImageSet(img, {
      thumbnail: 400,
      display: 1000,
      large: 1600,
    });

    records.push({
      id,
      title: titles[0],
      titleAlt: titles.slice(1),
      creator: creators.join('; '),
      date: dates[0] || '',
      description: descriptions.join(' '),
      materials: formats.filter(f => !f.match(/^\d+.*x.*\d+/)), // exclude dimensions
      dimensions: formats.find(f => f.match(/^\d+.*x.*\d+|cm|mm/i)) || '',
      type: types[0] || '',
      subjects: subjects,
      imageUrl: iiifImages.media_medium || img,
      thumbUrl: iiifImages.media_thumbnail || img.replace('/full/max/', '/full/400,/'),
      iiifBase: iiifImages.iiif_base,
      iiifInfoUrl: iiifImages.iiif_info_url,
      rights: rights[0] || 'Public Domain',
    });
  }
  return records;
}

function extractResumptionToken(xml) {
  const m = xml.match(/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/);
  return m ? m[1].trim() : null;
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

async function main() {
  console.log('\n  ╔══════════════════════════════════════════════════╗');
  console.log('  ║  ARCHAI — Rijksmuseum (Amsterdam) Harvester       ║');
  console.log('  ║  OAI-PMH · No API key required · IIIF images     ║');
  console.log('  ╚══════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch { console.error('  ✗ Ollama not reachable'); process.exit(1); }

  if (!DRY_RUN) {
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant not reachable'); process.exit(1); }
    await ensureCollection();
  }

  // Phase 1: Harvest via OAI-PMH with pagination
  const allRecords = [];
  let resumptionToken = null;
  let page = 0;

  console.log(`\n  Harvesting Rijksmuseum via OAI-PMH…\n`);

  do {
    const url = resumptionToken
      ? `${OAI_URL}?verb=ListRecords&resumptionToken=${encodeURIComponent(resumptionToken)}`
      : `${OAI_URL}?verb=ListRecords&metadataPrefix=oai_dc`;

    try {
      const res = await fetch(url);
      const xml = await res.text();
      const records = parseRecords(xml);
      allRecords.push(...records);
      resumptionToken = extractResumptionToken(xml);
      page++;

      process.stdout.write(`  Page ${page}: ${records.length} w/images (total: ${allRecords.length})\r`);

      if (allRecords.length >= LIMIT * 3) {
        // Collected enough candidates — stop pagination
        resumptionToken = null;
      }

      await sleep(500); // Be polite to the OAI endpoint
    } catch (e) {
      console.error(`\n  ⚠ Page ${page} failed: ${e.message}`);
      resumptionToken = null;
    }
  } while (resumptionToken);

  console.log(`\n\n  ✓ ${allRecords.length} objects with images harvested from ${page} pages`);

  // Phase 2: Score richness, sort, keep top LIMIT
  const scored = allRecords.map(r => {
    const richness = [
      r.title, r.creator, r.date, r.description,
      r.materials.length > 0, r.type, r.subjects.length > 0
    ].filter(Boolean).length;
    return { ...r, richness };
  }).sort((a, b) => b.richness - a.richness);

  const toProcess = scored.slice(0, LIMIT);
  console.log(`  → Processing top ${toProcess.length} by richness\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const r = toProcess[i];
    try {
      const embeddingParts = [
        r.title,
        ...r.titleAlt,
        r.description,
        r.creator ? `Made by ${r.creator}` : '',
        r.materials.join(', '),
        r.type,
        r.subjects.join(', '),
        r.date,
        'Rijksmuseum, Amsterdam'
      ].filter(Boolean).join('. ');

      // Extract object number from ID (e.g. https://id.rijksmuseum.nl/200106038 → 200106038)
      const objNum = r.id.split('/').pop() || String(i);

      const payload = {
        canonical_id: `rijks:${objNum}`,
        source: 'rijksmuseum',
        source_institution: 'Rijksmuseum, Amsterdam',
        title: r.title,
        object_type: r.type,
        discipline: r.subjects.join(', '),
        category: r.type,
        date_range: r.date,
        registration_number: objNum,
        museum_location: 'Rijksmuseum, Amsterdam',
        description: r.description,
        medium: r.materials.join(', '),
        artist: r.creator,
        dimensions: r.dimensions,
        licence: r.rights,
        source_url: `https://www.rijksmuseum.nl/en/collection/${objNum}`,
        media_thumbnail: r.thumbUrl,
        media_medium: r.imageUrl,
        media_large: r.iiifBase ? buildIiifImageSet(r.iiifBase, { thumbnail: 400, display: 1000, large: 1600 }).media_large : r.imageUrl,
        media_iiif_base: r.iiifBase || '',
        media_iiif_info_url: r.iiifInfoUrl || '',
        media_iiif_available: Boolean(r.iiifBase),
        richness_score: r.richness,
        embedding_text: embeddingParts
      };

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] [${r.richness}★] ${r.title.substring(0, 50)} — ${r.creator || 'unknown'}\n`);
      } else {
        const vector = await embed(embeddingParts);
        if (!vector || !vector.length) { errors++; continue; }
        const pointId = 5000000 + i;
        await upsertPoint(pointId, vector, payload);
        success++;
        const pct = Math.round((i + 1) / toProcess.length * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${r.title.substring(0, 45)}\r`);
      }

      await sleep(150);
    } catch (e) {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Rijksmuseum harvest complete`);
  console.log(`  → ${success} objects embedded into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → No API key used — OAI-PMH + IIIF`);
  console.log(`  → First European collection in ARCHAI 🇳🇱\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
