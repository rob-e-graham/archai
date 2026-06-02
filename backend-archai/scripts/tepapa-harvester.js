#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Te Papa Harvester
// Museum of New Zealand Te Papa Tongarewa collections API
//
// Metadata rights: CC BY 4.0
// Image rights: per-item / mixed
// Public demo rule:
//   - prefer preview/thumbnail media
//   - for All Rights Reserved media, use API-served preview URLs only
//   - keep caption attribution and link back to the public collection page
//
// Usage:
//   node tepapa-harvester.js --dry-run
//   node tepapa-harvester.js --limit 120
//   TEPAPA_API_KEY=xxxx node tepapa-harvester.js --limit 120
//   node tepapa-harvester.js --include-cultural
// ══════════════════════════════════════════════════════════════════

import {
  normalizeMultilingualField,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';

const TEPAPA_API = 'https://data.tepapa.govt.nz/collection';
const TEPAPA_PUBLIC = 'https://collections.tepapa.govt.nz/object';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_tepapa';
const EMBED_MODEL = 'nomic-embed-text';
const POINT_ID_OFFSET = 8000000;
const REGISTERED_API_KEY = process.env.TEPAPA_API_KEY || '';

const SEARCH_QUERIES = [
  { q: 'collection:History AND additionalType:PhysicalObject AND textile', focus: 'history-textiles' },
  { q: 'collection:History AND additionalType:PhysicalObject AND jewellery', focus: 'history-jewellery' },
  { q: 'collection:History AND additionalType:PhysicalObject AND photograph', focus: 'history-photography' },
  { q: 'collection:History AND additionalType:PhysicalObject AND technology', focus: 'history-technology' },
  { q: 'collection:History AND additionalType:PhysicalObject AND "musical instrument"', focus: 'history-instruments' },
  { q: 'collection:RareBooks AND additionalType:PhysicalObject AND map', focus: 'rarebooks-maps' },
  { q: 'collection:Art AND additionalType:PhysicalObject AND sculpture', focus: 'art-sculpture' },
  { q: 'collection:Art AND additionalType:PhysicalObject AND ceramic', focus: 'art-ceramics' },
  { q: 'collection:PacificCultures AND additionalType:PhysicalObject AND textile', focus: 'pacific-textiles' },
  { q: 'collection:History AND additionalType:PhysicalObject AND Japan', focus: 'history-japan' },
  { q: 'collection:History AND additionalType:PhysicalObject AND India', focus: 'history-india' },
  { q: 'collection:History AND additionalType:PhysicalObject AND Egypt', focus: 'history-egypt' },
  { q: 'collection:History AND additionalType:PhysicalObject AND Persia', focus: 'history-persia' },
  { q: 'collection:History AND additionalType:PhysicalObject AND "South America"', focus: 'history-south-america' }
];

const GENERIC_TITLES = new Set([
  'textile',
  'photograph',
  'coin',
  'vase',
  'bottle',
  'cup',
  'collar',
  'water jug',
  'musical instrument',
  'map',
  'jewellery set'
]);

const SENSITIVE_PATTERNS = [
  /\btoi moko\b/i,
  /\bmokomokai\b/i,
  /\bk[ōo]iwi\b/i,
  /\bt[ūu]puna\b/i,
  /\bhuman remains\b/i,
  /\bancestral remains\b/i,
  /\bburial\b/i,
  /\burup[āa]\b/i,
  /\bsacred\b/i
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const LIMIT = parseInt(getArg('limit', '120'), 10);
const QUERY_SIZE = parseInt(getArg('query-size', '60'), 10);
const PAGES = parseInt(getArg('pages', '1'), 10);
const MIN_RECORD_SCORE = parseInt(getArg('min-score', '10'), 10);
const DRY_RUN = args.includes('--dry-run');
const INCLUDE_CULTURAL = args.includes('--include-cultural');

let guestToken = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

function uniq(values = []) {
  return [...new Set(values.flatMap(value => toArray(value)).map(v => String(v || '').trim()).filter(Boolean))];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstNonEmpty(...value);
      if (nested) return nested;
    } else if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titlesOf(values = []) {
  return uniq(
    toArray(values).map(entry => {
      if (typeof entry === 'string') return entry;
      return firstNonEmpty(
        entry?.title,
        entry?.prefLabel,
        entry?.identifier,
        entry?.scopeNote
      );
    })
  );
}

function bestRightsTitle(representation) {
  return firstNonEmpty(
    representation?.rights?.title,
    ...(representation?.facetPermissionType || [])
  ) || 'Per-item rights';
}

function isOpenRights(rightsTitle = '') {
  const value = String(rightsTitle).toLowerCase();
  return (
    value.includes('no known copyright restrictions') ||
    value.includes('creative commons 0') ||
    value.includes('cc0') ||
    value.includes('cc by')
  );
}

function chooseBestRepresentation(item) {
  const representations = (item.hasRepresentation || []).filter(rep => rep?.previewUrl || rep?.thumbnailUrl || rep?.contentUrl);
  if (!representations.length) return null;

  const ranked = representations
    .map(rep => {
      const rightsTitle = bestRightsTitle(rep);
      const permission = uniq(rep?.facetPermissionType || []);
      const allowsDownload = rep?.rights?.allowsDownload === true;
      const openRights = isOpenRights(rightsTitle) || allowsDownload;
      const restricted = permission.some(flag => String(flag).toLowerCase().includes('restricted')) || /all rights reserved/i.test(rightsTitle);
      const imageScore =
        (rep.previewUrl ? 5 : 0) +
        (rep.thumbnailUrl ? 2 : 0) +
        (openRights ? 6 : 0) +
        (restricted ? 1 : 3) +
        Math.min(Math.round((rep.width || 0) / 1000), 5);

      return { rep, rightsTitle, permission, allowsDownload, openRights, restricted, imageScore };
    })
    .sort((a, b) => b.imageScore - a.imageScore);

  return ranked[0];
}

function isSensitiveRecord(item) {
  const collectionLabel = firstNonEmpty(item.collectionLabel, item.collection);
  if (!INCLUDE_CULTURAL && collectionLabel === 'Taonga Māori') return true;

  const text = [
    item.title,
    item.caption,
    stripHtml(item.captionFormatted),
    stripHtml(item.description),
    item.acknowledgement
  ].filter(Boolean).join(' \n ');

  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

function getFocusWeight(focus = '') {
  if (focus.includes('pacific') || focus.includes('south-america') || focus.includes('persia') || focus.includes('egypt')) return 2;
  if (focus.includes('japan') || focus.includes('india')) return 1.5;
  return 1;
}

function scoreRecord(item, media, focus) {
  if (!media?.rep?.previewUrl && !media?.rep?.thumbnailUrl) return -100;
  if (isSensitiveRecord(item)) return -100;

  const title = String(item.title || '').trim();
  const description = stripHtml(item.description);
  const caption = firstNonEmpty(item.caption, stripHtml(item.captionFormatted));
  const makers = uniq((item.production || []).map(prod => prod?.contributor?.title)).join(', ');
  const createdDates = uniq((item.production || []).map(prod => firstNonEmpty(prod?.verbatimCreatedDate, prod?.createdDate, prod?.facetCreatedDate?.temporal)));
  const places = uniq((item.production || []).flatMap(prod => [
    prod?.spatial?.title,
    ...(prod?.spatial?.nation || [])
  ]));
  const materials = firstNonEmpty(item.isMadeOfSummary, titlesOf(item.isMadeOf).join(', '));
  const technique = titlesOf(item.productionUsedTechnique).join(', ');
  const dimensions = titlesOf(item.observedDimension).join(', ');
  const categoryTerms = uniq([
    ...titlesOf(item.isTypeOf),
    ...titlesOf(item.depicts),
    ...titlesOf(item.influencedBy)
  ]);

  let score = 0;
  score += media.imageScore;
  if (description) score += 4;
  if (caption) score += 3;
  if (makers) score += 2;
  if (createdDates.length) score += 2;
  if (places.length) score += 2;
  if (materials) score += 2;
  if (technique) score += 1;
  if (dimensions) score += 1;
  if (categoryTerms.length >= 2) score += 2;
  if (GENERIC_TITLES.has(title.toLowerCase())) score -= 2;
  if (!description && !caption) score -= 4;
  score += getFocusWeight(focus);

  return score;
}

async function getGuestToken() {
  const res = await fetch(`${TEPAPA_API}/search/`, {
    headers: { Accept: 'application/json', 'User-Agent': 'ARCHAI TePapa Harvester' }
  });

  let json = {};
  try {
    json = await res.json();
  } catch {}

  if (json?.guestToken) return json.guestToken;
  throw new Error(`Could not retrieve Te Papa guest token (HTTP ${res.status})`);
}

async function authHeaders(forceRefresh = false) {
  if (REGISTERED_API_KEY) {
    return {
      Accept: 'application/json',
      'User-Agent': 'ARCHAI TePapa Harvester',
      'x-api-key': REGISTERED_API_KEY
    };
  }

  if (!guestToken || forceRefresh) {
    guestToken = await getGuestToken();
  }

  return {
    Accept: 'application/json',
    'User-Agent': 'ARCHAI TePapa Harvester',
    Authorization: `Bearer ${guestToken}`
  };
}

async function fetchTePapaJSON(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: await authHeaders(attempt > 0) });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid JSON response from Te Papa (${res.status})`);
      }

      if (res.ok) return data;

      if (res.status === 401 && !REGISTERED_API_KEY && data?.guestToken) {
        guestToken = data.guestToken;
        await sleep(200);
        continue;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(1000);
    }
  }
}

async function searchTePapa(query, size = QUERY_SIZE, from = 0) {
  const url = `${TEPAPA_API}/search/?size=${size}&from=${from}&q=${encodeURIComponent(query)}`;
  return fetchTePapaJSON(url);
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

function normalizeSourceRecord(item, media, focus) {
  const collectionLabel = firstNonEmpty(item.collectionLabel, item.collection) || 'Te Papa';
  const title = firstNonEmpty(item.title) || 'Untitled';
  const description = firstNonEmpty(
    stripHtml(item.description),
    stripHtml(item.narrativeSummary),
    stripHtml(item.captionFormatted),
    item.caption
  );
  const tombstone = firstNonEmpty(item.caption, stripHtml(item.captionFormatted));
  const creditLine = firstNonEmpty(item.creditLine, item.acknowledgement);
  const makers = uniq((item.production || []).map(prod => prod?.contributor?.title));
  const makerRoles = uniq((item.production || []).map(prod => prod?.role));
  const dates = uniq((item.production || []).map(prod => firstNonEmpty(prod?.verbatimCreatedDate, prod?.createdDate, prod?.facetCreatedDate?.temporal)));
  const places = uniq((item.production || []).flatMap(prod => [
    prod?.spatial?.prefLabel,
    prod?.spatial?.title,
    ...(prod?.spatial?.nation || [])
  ]));
  const period = uniq((item.production || []).map(prod => prod?.facetCreatedDate?.century)).join(', ');
  const dimensions = titlesOf(item.observedDimension).join(' · ');
  const typeTerms = titlesOf(item.isTypeOf);
  const depictTerms = titlesOf(item.depicts);
  const influenceTerms = titlesOf(item.influencedBy);
  const subjectTerms = uniq([...typeTerms, ...depictTerms, ...influenceTerms, ...titlesOf(item.refersTo)]).slice(0, 12);
  const materials = firstNonEmpty(item.isMadeOfSummary, titlesOf(item.isMadeOf).join(', '));
  const techniques = titlesOf(item.productionUsedTechnique).join(', ');
  const collectionTerms = uniq(toArray(item.collectionLabel || item.collection));
  const rightsTitle = media.rightsTitle;
  const rightsMode = media.openRights ? 'source_reusable' : 'api_preview_only';
  const sourceUrl = `${TEPAPA_PUBLIC}/${item.id}`;

  const titleTranslations = normalizeMultilingualField(title);
  const descriptionTranslations = normalizeMultilingualField(description);
  const creatorTranslations = normalizeMultilingualField(makers.join(', '));
  const mediumTranslations = normalizeMultilingualField(materials);
  const subjectTranslations = normalizeMultilingualField(subjectTerms.join(', '));
  const sourceLanguage = pickPrimaryLanguage(
    [titleTranslations, descriptionTranslations, creatorTranslations, mediumTranslations, subjectTranslations],
    'en'
  );
  const availableLanguages = collectLanguages(
    titleTranslations,
    descriptionTranslations,
    creatorTranslations,
    mediumTranslations,
    subjectTranslations
  );
  const displayTexts = buildDisplayTexts({
    titleMap: titleTranslations,
    descriptionMap: descriptionTranslations,
    primaryLanguage: sourceLanguage
  });

  const embeddingText = [
    title,
    description,
    tombstone,
    materials,
    techniques,
    makers.join(', '),
    makerRoles.join(', '),
    dates.join(', '),
    places.join(', '),
    typeTerms.join(', '),
    depictTerms.join(', '),
    influenceTerms.join(', '),
    collectionLabel,
    focus
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `tepapa:${item.id}`,
    source: 'tepapa',
    source_record_id: String(item.id),
    source_institution: 'Museum of New Zealand Te Papa Tongarewa',
    source_country: 'New Zealand',
    source_language: sourceLanguage,
    available_languages: availableLanguages,
    title,
    object_type: typeTerms[0] || item.type || 'Object',
    discipline: collectionLabel,
    category: typeTerms[0] || collectionLabel,
    date_range: dates.join(' · '),
    registration_number: firstNonEmpty(item.identifier, item.pid, item.id),
    museum_location: 'Te Papa Tongarewa, Wellington',
    description,
    medium: materials,
    artist: makers.join(', '),
    culture: influenceTerms.join(', '),
    period,
    place_of_origin: places.join(', '),
    credit_line: creditLine,
    dimensions,
    wall_description: stripHtml(item.description),
    tombstone,
    licence: `${rightsTitle} · metadata CC BY 4.0`,
    source_url: sourceUrl,
    media_thumbnail: media.rep.thumbnailUrl || media.rep.previewUrl || '',
    media_medium: media.rep.previewUrl || media.rep.thumbnailUrl || media.rep.contentUrl || '',
    media_large: media.openRights
      ? (media.rep.contentUrl || media.rep.previewUrl || media.rep.thumbnailUrl || '')
      : (media.rep.previewUrl || media.rep.thumbnailUrl || ''),
    title_translations: titleTranslations,
    description_translations: descriptionTranslations,
    creator_translations: creatorTranslations,
    medium_translations: mediumTranslations,
    subject_translations: subjectTranslations,
    display_texts: displayTexts,
    translation_status: availableLanguages.length > 1 ? 'source_multilingual' : 'source_single_language',
    translation_ready: availableLanguages.length > 0,
    classification_terms: typeTerms,
    keyword_terms: subjectTerms,
    rights_notes: uniq([
      rightsTitle,
      item.accessRights,
      media.openRights ? 'Media reusable per item-level rights metadata' : 'Media served via Te Papa API preview URL only'
    ]),
    source_collection_label: collectionLabel,
    source_type: item.type || '',
    focus_area: focus,
    media_rights_title: rightsTitle,
    media_rights_mode: rightsMode,
    media_permission_type: media.permission,
    embedding_text: embeddingText
  };
}

function selectDiverseRecords(rows, limit) {
  const buckets = new Map();
  for (const row of rows) {
    const focus = row.focus || 'misc';
    if (!buckets.has(focus)) buckets.set(focus, []);
    buckets.get(focus).push(row);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => b.recordScore - a.recordScore);
  }

  const orderedFocuses = [...buckets.keys()].sort((a, b) => {
    const aTop = buckets.get(a)?.[0]?.recordScore || 0;
    const bTop = buckets.get(b)?.[0]?.recordScore || 0;
    return bTop - aTop;
  });

  const selected = [];
  while (selected.length < limit) {
    let addedThisRound = 0;
    for (const focus of orderedFocuses) {
      const bucket = buckets.get(focus);
      if (!bucket?.length) continue;
      selected.push(bucket.shift());
      addedThisRound++;
      if (selected.length >= limit) break;
    }
    if (!addedThisRound) break;
  }

  return selected;
}

async function main() {
  console.log('\n  ╔════════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Te Papa Harvester                  ║');
  console.log('  ║   Southern Hemisphere · rights-aware ingest   ║');
  console.log('  ╚════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Limit: ${LIMIT}`);
  console.log(`  ⚙ Query size: ${QUERY_SIZE}`);
  console.log(`  ⚙ Pages per query: ${PAGES}`);
  console.log(`  ⚙ Min source record score: ${MIN_RECORD_SCORE}`);
  console.log(`  ⚙ Cultural collections opt-in: ${INCLUDE_CULTURAL ? 'yes' : 'no (Taonga Māori excluded)'}\n`);

  if (REGISTERED_API_KEY) {
    console.log('  ✓ Using registered Te Papa API key');
  } else {
    console.log('  ✓ Using Te Papa guest token flow');
  }

  if (!DRY_RUN) {
    try {
      await fetch(`${OLLAMA_URL}/api/tags`);
      console.log('  ✓ Ollama online');
    } catch {
      console.error('  ✗ Ollama not reachable');
      process.exit(1);
    }

    try {
      await fetch(`${QDRANT_URL}/collections`);
      console.log('  ✓ Qdrant online');
    } catch {
      console.error('  ✗ Qdrant not reachable');
      process.exit(1);
    }

    await ensureCollection();
  }

  const seen = new Map();
  let skippedNoMedia = 0;
  let skippedSensitive = 0;
  let skippedLowScore = 0;

  console.log('\n  Searching Te Papa API…\n');

  for (const search of SEARCH_QUERIES) {
    try {
      let added = 0;

      for (let page = 0; page < PAGES; page++) {
        const from = page * QUERY_SIZE;
        const data = await searchTePapa(search.q, QUERY_SIZE, from);
        const results = data?.results || [];

        for (const item of results) {
          const id = item?.id;
          if (!id || seen.has(id)) continue;

          const media = chooseBestRepresentation(item);
          if (!media?.rep?.previewUrl && !media?.rep?.thumbnailUrl) {
            skippedNoMedia++;
            continue;
          }

          if (isSensitiveRecord(item)) {
            skippedSensitive++;
            continue;
          }

          const recordScore = scoreRecord(item, media, search.focus);
          if (recordScore < MIN_RECORD_SCORE) {
            skippedLowScore++;
            continue;
          }

          seen.set(id, { item, media, focus: search.focus, recordScore });
          added++;
        }

        await sleep(250);
        if (results.length < QUERY_SIZE) break;
      }

      process.stdout.write(`  → ${search.focus} — ${added} added (total: ${seen.size})\n`);
    } catch (err) {
      process.stdout.write(`  ⚠ ${search.focus} — ${err.message}\n`);
    }
  }

  const ranked = selectDiverseRecords([...seen.values()], LIMIT);

  console.log(`\n  ✓ ${seen.size} suitable Te Papa records found`);
  console.log(`  → Skipped no media: ${skippedNoMedia}`);
  console.log(`  → Skipped sensitive: ${skippedSensitive}`);
  console.log(`  → Skipped low score: ${skippedLowScore}`);
  console.log(`  → Processing ${ranked.length}\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < ranked.length; i++) {
    const row = ranked[i];
    try {
      const payload = normalizeSourceRecord(row.item, row.media, row.focus);

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${payload.title.substring(0, 56)} — ${payload.source_collection_label} · ${payload.media_rights_title}\n`);
      } else {
        const vector = await embed(payload.embedding_text);
        if (!vector || !vector.length) {
          errors++;
          continue;
        }
        await upsertPoint(POINT_ID_OFFSET + i, vector, payload);
        success++;
        const pct = Math.round(((i + 1) / ranked.length) * 100);
        process.stdout.write(`  [${pct}%] ${success}/${i + 1} · ${payload.title.substring(0, 48)}${payload.title.length > 48 ? '…' : ''}\r`);
      }

      await sleep(180);
    } catch {
      errors++;
      await sleep(300);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Te Papa harvest complete`);
  console.log(`  → ${success} objects into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → Rights-aware preview media preserved\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
