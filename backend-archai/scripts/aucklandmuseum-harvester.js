#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Auckland Museum Harvester
// Brings Auckland Museum collection objects into ARCHAI with a
// translation-aware onboarding shape. Focuses on image-backed,
// rights-friendlier records from human history and documentary
// heritage, while excluding sensitive and taonga-marked records
// in the default public-facing pass.
//
// API docs: https://api.aucklandmuseum.com/
// Licence / rights: per-record; filtered conservatively here
//
// Usage:
//   node aucklandmuseum-harvester.js --limit 120
//   node aucklandmuseum-harvester.js --dry-run
//   node aucklandmuseum-harvester.js --include-taonga
// ══════════════════════════════════════════════════════════════════

import {
  normalizeMultilingualField,
  mergeLanguageMaps,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';
import { createHash } from 'node:crypto';

const AUCKLAND_SEARCH_API = 'https://api.aucklandmuseum.com/search/collectionsonline/_search';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_auckland';
const EMBED_MODEL = 'nomic-embed-text';
const POINT_ID_OFFSET = 7000000;
const AUCKLAND_PLACEHOLDER_HASHES = new Set([
  '8824d0781730427b72813fa1678a2b02',
  '53000f8668ef40d519eb97aa73cfdb48'
]);

const SEARCH_QUERIES = [
  { q: 'department:"Applied Arts and Design" AND primaryRepresentation:*', focus: 'design' },
  { q: 'department:"Social History" AND primaryRepresentation:*', focus: 'social-history' },
  { q: 'type:"ecrm:E22_Man-Made_Object" AND technology AND primaryRepresentation:*', focus: 'technology' },
  { q: 'type:"ecrm:E22_Man-Made_Object" AND carving AND primaryRepresentation:*', focus: 'carving' },
  { q: 'type:"ecrm:E22_Man-Made_Object" AND textile AND primaryRepresentation:*', focus: 'textile' },
  { q: 'type:"ecrm:E22_Man-Made_Object" AND taonga AND primaryRepresentation:*', focus: 'taonga' },
  { q: 'department:photography AND pacific AND primaryRepresentation:*', focus: 'pacific-photography' },
  { q: 'department:photography AND maori AND primaryRepresentation:*', focus: 'maori-photography' },
  { q: 'type:"ecrm:E84_Information_Carrier" AND pacific AND primaryRepresentation:*', focus: 'documentary-pacific' },
  { q: 'type:"ecrm:E84_Information_Carrier" AND auckland AND primaryRepresentation:*', focus: 'documentary-auckland' }
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const LIMIT = parseInt(getArg('limit', '120'), 10);
const MIN_RECORD_SCORE = parseInt(getArg('min-score', '18'), 10);
const DRY_RUN = args.includes('--dry-run');
const INCLUDE_TAONGA = args.includes('--include-taonga');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await sleep(3000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
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
  const data = await res.json();
  return data.embedding;
}

async function ensureCollection() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (res.ok) {
      console.log(`  ✓ Collection '${COLLECTION}' exists`);
      return;
    }
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

function uniq(values = []) {
  return [...new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))];
}

function getIdTail(uri = '') {
  return String(uri).split('/').filter(Boolean).pop() || '';
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) {
      const item = firstNonEmpty(...value);
      if (item) return item;
    } else if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function extractArray(source, path, fallback = []) {
  const parts = path.split('.');
  let cursor = source;
  for (const part of parts) {
    cursor = cursor && cursor[part];
  }
  return Array.isArray(cursor) ? cursor : fallback;
}

function extractPeriodText(source, key) {
  const entries = extractArray(source, `period.${key}`);
  return firstNonEmpty(...entries.map(entry => entry?.text || entry?.value || entry?.exact || ''));
}

function extractClassificationTerms(source, bucket) {
  const out = [];
  for (const entry of source.classification || []) {
    const bucketEntries = entry?.[bucket];
    if (!Array.isArray(bucketEntries)) continue;
    for (const item of bucketEntries) {
      if (Array.isArray(item?._all)) out.push(...item._all);
      else {
        for (const value of Object.values(item || {})) {
          if (Array.isArray(value)) out.push(...value);
          else if (value) out.push(value);
        }
      }
    }
  }
  return uniq(out);
}

function mediaUrl(primaryRepresentation, rendering = 'standard.jpg') {
  if (!primaryRepresentation) return '';
  // Force https — the Auckland API serves http by default, which is blocked
  // as mixed content on the https site. The API fully supports https.
  const secure = String(primaryRepresentation).replace(/^http:\/\//, 'https://');
  return `${secure}?rendering=${rendering}`;
}

const mediaValidationCache = new Map();

async function isKnownPlaceholderMedia(primaryRepresentation) {
  if (!primaryRepresentation) return true;
  const url = mediaUrl(primaryRepresentation, 'standard.jpg');
  if (mediaValidationCache.has(url)) return mediaValidationCache.get(url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      mediaValidationCache.set(url, true);
      return true;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash('md5').update(buffer).digest('hex');
    const isPlaceholder = AUCKLAND_PLACEHOLDER_HASHES.has(hash);
    mediaValidationCache.set(url, isPlaceholder);
    return isPlaceholder;
  } catch {
    mediaValidationCache.set(url, true);
    return true;
  }
}

function isRightsFriendly(copyrights = []) {
  const rights = copyrights.map(v => String(v).toLowerCase());
  const blocked = ['all rights reserved', 'restricted', 'cultural permissions apply', 'access by appointment', 'fragile - assisted viewing only'];
  if (rights.some(entry => blocked.some(flag => entry.includes(flag)))) return false;

  const allowed = ['cc by', 'no known copyright restrictions', 'public domain', 'open access'];
  return rights.some(entry => allowed.some(flag => entry.includes(flag)));
}

function normalizeSourceRecord(id, source, focus) {
  const sourceId = getIdTail(id);
  const title = firstNonEmpty(
    ...extractArray(source, 'appellation.Primary Title'),
    ...extractArray(source, 'dc_title')
  ) || 'Untitled';
  const maoriTitle = firstNonEmpty(...extractArray(source, 'appellation.Maori Name'));
  const description = firstNonEmpty(...extractArray(source, 'dc_description'), ...extractArray(source, 'content'));
  const department = firstNonEmpty(...(source.department || []));
  const objectType = firstNonEmpty(
    ...extractArray(source, 'appellation.Classification Value'),
    ...extractArray(source, 'appellation.Classification Display Value'),
    source.type
  );
  const dateRange = firstNonEmpty(
    extractPeriodText(source, 'made'),
    firstNonEmpty(...(source.dc_date || [])),
    extractPeriodText(source, 'time_period')
  );
  const registration = firstNonEmpty(...(source.dc_identifier || []), sourceId);
  const mediumTerms = extractClassificationTerms(source, 'material').slice(0, 6);
  const objectTerms = extractClassificationTerms(source, 'object').slice(0, 8);
  const culture = firstNonEmpty(...(source.culturalOrigin || []));
  const place = uniq([
    ...extractArray(source, 'place.made._all'),
    ...extractArray(source, 'place.associated._all'),
    ...extractArray(source, 'place.captured._all')
  ]).slice(0, 4);
  const periodText = extractPeriodText(source, 'time_period');
  const creditLine = firstNonEmpty(...(source.acquisitionStatement || []));
  const contributors = uniq(source.dc_contributor || []);
  const tags = uniq([
    ...(source.keyword || []),
    ...((source.tags && source.tags.official) || []),
    ...((source.tags && source.tags.user) || [])
  ]).slice(0, 10);
  const rights = uniq(source.copyright || []);
  const primaryRepresentation = source.primaryRepresentation || '';

  const titleTranslations = normalizeMultilingualField(title);
  if (maoriTitle) titleTranslations.mi = maoriTitle;

  const descriptionTranslations = normalizeMultilingualField(description);
  const sourceLanguage = pickPrimaryLanguage([titleTranslations, descriptionTranslations], maoriTitle && !title ? 'mi' : 'en');
  const availableLanguages = collectLanguages(titleTranslations, descriptionTranslations);
  const displayTexts = buildDisplayTexts({
    titleMap: titleTranslations,
    descriptionMap: descriptionTranslations,
    primaryLanguage: sourceLanguage
  });

  const medium = mediumTerms.join(', ');
  const location = 'Auckland Museum';
  const sourceUrl = id.replace('http://', 'https://');

  const embeddingParts = [
    title,
    description,
    objectType,
    department,
    culture,
    medium,
    place.join(', '),
    periodText,
    contributors.join(', '),
    tags.join(', '),
    focus
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `auckland:${sourceId}`,
    source: 'auckland',
    source_record_id: sourceId,
    source_institution: 'Auckland Museum',
    source_country: 'New Zealand',
    source_language: sourceLanguage,
    available_languages: availableLanguages,
    title,
    object_type: objectType,
    discipline: department,
    category: objectTerms[0] || objectType,
    date_range: dateRange,
    registration_number: registration,
    museum_location: location,
    description,
    medium,
    artist: contributors.join(', '),
    culture,
    period: periodText,
    place_of_origin: place.join(', '),
    credit_line: creditLine,
    licence: rights.join(' · ') || 'Per-record rights',
    source_url: sourceUrl,
    media_thumbnail: mediaUrl(primaryRepresentation, 'thumbnail.jpg'),
    media_medium: mediaUrl(primaryRepresentation, 'standard.jpg'),
    media_large: mediaUrl(primaryRepresentation, 'original.jpg'),
    title_translations: titleTranslations,
    description_translations: descriptionTranslations,
    creator_translations: normalizeMultilingualField(contributors.join(', ')),
    medium_translations: normalizeMultilingualField(medium),
    subject_translations: normalizeMultilingualField(objectTerms.join(', ')),
    display_texts: displayTexts,
    translation_status: availableLanguages.length > 1 ? 'source_multilingual' : 'source_single_language',
    translation_ready: availableLanguages.length > 0,
    classification_terms: objectTerms,
    keyword_terms: tags,
    rights_notes: rights,
    source_type: source.type || '',
    source_record_score: source.recordScore || 0,
    is_taonga: !!source.isTaonga,
    is_sensitive: !!source.isSensitive,
    focus_area: focus,
    embedding_text: embeddingParts
  };
}

async function main() {
  console.log('\n  ╔════════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Auckland Museum Harvester          ║');
  console.log('  ║   Southern Hemisphere · objects + images      ║');
  console.log('  ╚════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Min source record score: ${MIN_RECORD_SCORE}`);
  console.log(`  ⚙ Include taonga-marked records: ${INCLUDE_TAONGA ? 'yes' : 'no'}\n`);

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch { console.error('  ✗ Ollama not reachable'); process.exit(1); }

  if (!DRY_RUN) {
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch { console.error('  ✗ Qdrant not reachable'); process.exit(1); }
    await ensureCollection();
  }

  const seen = new Map();
  let skippedRights = 0;
  let skippedSensitive = 0;
  let skippedScore = 0;
  let skippedPlaceholder = 0;

  console.log('\n  Searching Auckland Museum API…\n');

  for (const search of SEARCH_QUERIES) {
    try {
      const url = `${AUCKLAND_SEARCH_API}?q=${encodeURIComponent(search.q)}&size=60`;
      const data = await fetchJSON(url);
      const hits = data?.hits?.hits || [];
      let added = 0;

      for (const hit of hits) {
        const source = hit._source || {};
        const id = hit._id;
        if (!id || seen.has(id)) continue;
        if (!source.primaryRepresentation) continue;
        if ((source.recordScore || 0) < MIN_RECORD_SCORE) { skippedScore++; continue; }
        if (!INCLUDE_TAONGA && (source.isTaonga || source.isSensitive)) { skippedSensitive++; continue; }
        if (!isRightsFriendly(source.copyright || [])) { skippedRights++; continue; }
        if (await isKnownPlaceholderMedia(source.primaryRepresentation)) { skippedPlaceholder++; continue; }

        seen.set(id, { id, source, focus: search.focus });
        added++;
      }

      process.stdout.write(`  → ${search.focus} — ${hits.length} hits, ${added} added (total: ${seen.size})\n`);
      await sleep(300);
    } catch (err) {
      process.stdout.write(`  ⚠ ${search.focus} — ${err.message}\n`);
    }
  }

  const ranked = [...seen.values()]
    .sort((a, b) => (b.source.recordScore || 0) - (a.source.recordScore || 0))
    .slice(0, LIMIT);

  console.log(`\n  ✓ ${seen.size} suitable Auckland Museum records found`);
  console.log(`  → Skipped low score: ${skippedScore}`);
  console.log(`  → Skipped rights filter: ${skippedRights}`);
  console.log(`  → Skipped sensitive / taonga filter: ${skippedSensitive}`);
  console.log(`  → Skipped placeholder media: ${skippedPlaceholder}`);
  console.log(`  → Processing ${ranked.length}\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < ranked.length; i++) {
    const item = ranked[i];
    try {
      const payload = normalizeSourceRecord(item.id, item.source, item.focus);

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${payload.title.substring(0, 56)} — ${payload.discipline}\n`);
      } else {
        const vector = await embed(payload.embedding_text);
        if (!vector || !vector.length) { errors++; continue; }
        await upsertPoint(POINT_ID_OFFSET + i, vector, payload);
        success++;
        const pct = Math.round(((i + 1) / ranked.length) * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${payload.title.substring(0, 48)}${payload.title.length > 48 ? '…' : ''}\r`);
      }

      await sleep(200);
    } catch (err) {
      errors++;
      await sleep(400);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Auckland Museum harvest complete`);
  console.log(`  → ${success} objects into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Translation-aware onboarding preserved\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
