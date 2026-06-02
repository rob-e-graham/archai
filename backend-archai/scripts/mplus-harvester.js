#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — M+ Harvester
// Asia-focused onboarding pass for the M+ museum collection API.
//
// Terms:
//   - Metadata is published as CC0 open data
//   - API service itself is non-commercial
//   - Public object-page preview image and copyright text are
//     preserved per record for attribution and QA
//
// Official docs:
//   https://api.mplus.org.hk/en/documentation
//   https://api.mplus.org.hk/en/documentation/termsofuse
//
// Usage:
//   node mplus-harvester.js --dry-run
//   node mplus-harvester.js --limit 120
//   MPLUS_API_TOKEN=xxxx node mplus-harvester.js --limit 120
// ══════════════════════════════════════════════════════════════════

import {
  normalizeMultilingualField,
  mergeLanguageMaps,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
} from './lib/multilingual.js';

const MPLUS_API = 'https://api.mplus.org.hk/graphql';
const MPLUS_PUBLIC = 'https://www.mplus.org.hk/en/collection/objects';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_mplus';
const EMBED_MODEL = 'nomic-embed-text';
const POINT_ID_OFFSET = 9000000;
const API_TOKEN = process.env.MPLUS_API_TOKEN || 'null';

const SEARCH_GROUPS = [
  { category: 'Photography', focus: 'photography', perPage: 16, pages: 2 },
  { category: 'Painting', focus: 'painting', perPage: 12, pages: 2 },
  { category: 'Poster', focus: 'poster', perPage: 12, pages: 2 },
  { category: 'Textile', focus: 'textile', perPage: 12, pages: 2 },
  { category: 'Product Design', focus: 'product-design', perPage: 14, pages: 2 },
  { category: 'Design Object', focus: 'design-object', perPage: 12, pages: 2 },
  { category: 'Furniture', focus: 'furniture', perPage: 10, pages: 2 },
  { category: 'Sculpture', focus: 'sculpture', perPage: 10, pages: 2 },
  { category: 'Architectural Model', focus: 'architectural-model', perPage: 10, pages: 2 },
  { category: 'Video', focus: 'video', perPage: 10, pages: 2 },
  { category: 'Ink Art', focus: 'ink-art', perPage: 10, pages: 2 },
  { area: 'Design and Architecture', focus: 'design-architecture', perPage: 10, pages: 2 }
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const LIMIT = parseInt(getArg('limit', '120'), 10);
const MIN_RECORD_SCORE = parseInt(getArg('min-score', '12'), 10);
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstNonEmpty(...value);
      if (nested) return nested;
    } else if (value !== null && value !== undefined && String(value).trim()) {
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

function decodeHtml(value = '') {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function decodeEscaped(value = '') {
  return String(value)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

function buildObjectPageUrl(titleSlug = '') {
  return titleSlug ? `${MPLUS_PUBLIC}/${titleSlug}/` : '';
}

async function fetchGraphQL(query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(MPLUS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${API_TOKEN}`
        },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.errors?.length) {
        throw new Error(data.errors.map(err => err.message).join('; '));
      }
      return data.data;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1200);
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

function buildObjectsQuery({ page, perPage, category, area, ids, lang = 'en' }) {
  const filters = [
    `page: ${page || 1}`,
    `per_page: ${perPage || (ids?.length || 10)}`,
    `sort_field: "popularCount"`,
    `sort: "desc"`
  ];

  if (Array.isArray(ids) && ids.length) filters.push(`ids: [${ids.join(',')}]`);
  if (lang) filters.push(`lang: ${JSON.stringify(lang)}`);
  if (category) filters.push(`category: ${JSON.stringify(category)}`);
  if (area) filters.push(`area: ${JSON.stringify(area)}`);

  return `query {
    objects(${filters.join(', ')}) {
      id
      objectNumber
      title
      titleOther
      titleSlug
      medium
      displayDate
      displayDateOther
      beginDate
      endDate
      dimension
      creditLine
      publicAccess
      classification {
        area
        category
        archivalLevel
      }
      constituents {
        id
        name
        nameOther
        nationality
        roles
      }
      images {
        altText
      }
      color {
        predominant {
          color
          value
        }
        search {
          google {
            color
            value
          }
        }
      }
    }
  }`;
}

async function fetchObjects(params) {
  const data = await fetchGraphQL(buildObjectsQuery(params));
  return data.objects || [];
}

async function fetchLocalizedMap(ids, lang = 'zh-hant') {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const rows = await fetchObjects({ ids: chunk, perPage: chunk.length, lang });
    for (const row of rows) out.set(row.id, row);
    await sleep(180);
  }
  return out;
}

async function fetchPageMeta(titleSlug = '') {
  const sourceUrl = buildObjectPageUrl(titleSlug);
  if (!sourceUrl) return { sourceUrl: '', imageUrl: '', copyrightEn: '', copyrightZh: '' };

  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'ARCHAI MPlus Harvester' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const ogMatch = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
    const secureMatch = html.match(/secure_url:"([^"]+)"/i);
    const rightsMatch = html.match(/mplusRights:\[\{copyright:\{en:\{txt:"([^"]*)"\},zh_hant:\{txt:"([^"]*)"/i);
    const visibleRightsMatch = html.match(/Copyright:<\/div>\s*<div[^>]*>(.*?)<\/div>/i);

    const imageUrl = ogMatch?.[1] || decodeEscaped(secureMatch?.[1] || '');
    const copyrightEn = decodeEscaped(rightsMatch?.[1] || stripHtml(visibleRightsMatch?.[1] || ''));
    const copyrightZh = decodeEscaped(rightsMatch?.[2] || '');

    return {
      sourceUrl,
      imageUrl: decodeHtml(imageUrl),
      copyrightEn: decodeHtml(copyrightEn),
      copyrightZh: decodeHtml(copyrightZh)
    };
  } catch {
    return { sourceUrl, imageUrl: '', copyrightEn: '', copyrightZh: '' };
  }
}

function scoreRecord(item, focus = '') {
  if (!item?.publicAccess) return -100;
  if (!item?.titleSlug) return -100;

  const altText = firstNonEmpty(...(item.images || []).map(img => img?.altText));
  const title = firstNonEmpty(item.title);
  const medium = firstNonEmpty(item.medium);
  const categories = uniq(item.classification?.category || []);
  const areas = uniq(item.classification?.area || []);
  const contributors = uniq((item.constituents || []).map(person => person?.name));
  const hasTranslatedTitle = !!firstNonEmpty(item.titleOther);

  let score = 0;
  if (title) score += 4;
  if (medium) score += 3;
  if (altText) score += 3;
  if (categories.length) score += 3;
  if (areas.length) score += 2;
  if (contributors.length) score += 2;
  if (firstNonEmpty(item.dimension)) score += 1;
  if (firstNonEmpty(item.creditLine)) score += 1;
  if (hasTranslatedTitle) score += 2;
  if (firstNonEmpty(item.displayDate)) score += 1;
  if ((item.color?.predominant || []).length) score += 1;
  if (focus.includes('product') || focus.includes('design') || focus.includes('textile') || focus.includes('video')) score += 1;
  if (!altText && !medium) score -= 3;

  return score;
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

function joinTranslatedContributors(constituents = []) {
  return uniq(constituents.map(person => firstNonEmpty(person?.name)));
}

function normalizeSourceRecord(itemEn, itemZh, pageMeta, focus) {
  const titleTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: itemEn.title }),
    normalizeMultilingualField({ 'zh-hant': itemZh?.title || itemEn.titleOther })
  );
  const descriptionTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: firstNonEmpty(...(itemEn.images || []).map(img => img?.altText)) }),
    normalizeMultilingualField({ 'zh-hant': firstNonEmpty(...((itemZh?.images || []).map(img => img?.altText))) })
  );
  const creatorTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: joinTranslatedContributors(itemEn.constituents || []).join(', ') }),
    normalizeMultilingualField({ 'zh-hant': joinTranslatedContributors(itemZh?.constituents || []).join(', ') })
  );
  const mediumTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: itemEn.medium }),
    normalizeMultilingualField({ 'zh-hant': itemZh?.medium })
  );
  const classificationTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: uniq([...(itemEn.classification?.area || []), ...(itemEn.classification?.category || [])]).join(', ') }),
    normalizeMultilingualField({ 'zh-hant': uniq([...(itemZh?.classification?.area || []), ...(itemZh?.classification?.category || [])]).join(', ') })
  );
  const rightsTranslations = mergeLanguageMaps(
    normalizeMultilingualField({ en: pageMeta.copyrightEn }),
    normalizeMultilingualField({ 'zh-hant': pageMeta.copyrightZh })
  );

  const sourceLanguage = pickPrimaryLanguage(
    [titleTranslations, descriptionTranslations, creatorTranslations, mediumTranslations, classificationTranslations],
    'en'
  );
  const availableLanguages = collectLanguages(
    titleTranslations,
    descriptionTranslations,
    creatorTranslations,
    mediumTranslations,
    classificationTranslations,
    rightsTranslations
  );
  const displayTexts = buildDisplayTexts({
    titleMap: titleTranslations,
    descriptionMap: descriptionTranslations,
    primaryLanguage: sourceLanguage
  });

  const title = pickBestLanguage(titleTranslations) || itemEn.title || 'Untitled';
  const description = pickBestLanguage(descriptionTranslations) || itemEn.medium || '';
  const medium = pickBestLanguage(mediumTranslations) || itemEn.medium || '';
  const makers = joinTranslatedContributors(itemEn.constituents || []);
  const nationalities = uniq((itemEn.constituents || []).map(person => person?.nationality));
  const classificationTerms = uniq([
    ...(itemEn.classification?.area || []),
    ...(itemEn.classification?.category || [])
  ]);
  const categoriesZh = uniq([
    ...(itemZh?.classification?.area || []),
    ...(itemZh?.classification?.category || [])
  ]);
  const colours = uniq((itemEn.color?.search?.google || []).map(entry => entry?.color));
  const rightsText = pickBestLanguage(rightsTranslations) || 'Copyright as noted on M+ object page';
  const objectNumber = itemEn.objectNumber || String(itemEn.id);
  const focusLabel = focus.replace(/-/g, ' ');
  const sourceUrl = pageMeta.sourceUrl || buildObjectPageUrl(itemEn.titleSlug);
  const tombstone = [
    title,
    makers.join(', '),
    itemEn.displayDate,
    'M+, Hong Kong'
  ].filter(Boolean).join('. ');

  const embeddingText = [
    title,
    titleTranslations['zh-hant'],
    medium,
    mediumTranslations['zh-hant'],
    itemEn.displayDate,
    itemZh?.displayDate,
    makers.join(', '),
    joinTranslatedContributors(itemZh?.constituents || []).join(', '),
    classificationTerms.join(', '),
    categoriesZh.join(', '),
    nationalities.join(', '),
    colours.join(', '),
    description,
    descriptionTranslations['zh-hant'],
    rightsText,
    focusLabel
  ].filter(Boolean).join('. ');

  return {
    canonical_id: `mplus:${objectNumber}`,
    source: 'mplus',
    source_record_id: objectNumber,
    source_institution: 'M+, Hong Kong',
    source_country: 'Hong Kong',
    source_language: sourceLanguage,
    available_languages: availableLanguages,
    title,
    object_type: itemEn.classification?.category?.[0] || itemEn.classification?.area?.[0] || 'Museum object',
    discipline: itemEn.classification?.area?.[0] || 'Visual Culture',
    category: itemEn.classification?.category?.[0] || itemEn.classification?.area?.[0] || 'Museum object',
    date_range: itemEn.displayDate || '',
    registration_number: objectNumber,
    museum_location: 'M+, Hong Kong',
    description,
    medium,
    artist: makers.join(', '),
    culture: nationalities.join(', '),
    period: itemEn.displayDate || '',
    place_of_origin: nationalities.join(', '),
    credit_line: itemEn.creditLine || '',
    dimensions: itemEn.dimension || '',
    wall_description: description,
    tombstone,
    licence: `CC0 metadata · M+ API service non-commercial · ${rightsText}`,
    source_url: sourceUrl,
    media_thumbnail: pageMeta.imageUrl || '',
    media_medium: pageMeta.imageUrl || '',
    media_large: pageMeta.imageUrl || '',
    title_translations: titleTranslations,
    description_translations: descriptionTranslations,
    creator_translations: creatorTranslations,
    medium_translations: mediumTranslations,
    classification_translations: classificationTranslations,
    rights_translations: rightsTranslations,
    display_texts: displayTexts,
    translation_status: availableLanguages.length > 1 ? 'source_multilingual' : 'source_single_language',
    translation_ready: availableLanguages.length > 0,
    classification_terms: classificationTerms,
    keyword_terms: uniq([
      ...classificationTerms,
      ...categoriesZh,
      ...nationalities,
      ...colours
    ]),
    rights_notes: uniq([
      'Metadata CC0 via M+ API',
      'API service non-commercial only',
      'Attribution requested: source: M+, Hong Kong + object number + mplus.org.hk link',
      rightsText
    ]),
    source_collection_label: 'M+',
    source_type: itemEn.classification?.area?.join(', ') || '',
    focus_area: focus,
    media_rights_title: rightsText,
    media_rights_mode: 'public_object_page_preview',
    media_permission_type: ['non-commercial', 'attribution-requested'],
    embedding_text: embeddingText
  };
}

async function main() {
  console.log('\n  ╔════════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — M+ Harvester                       ║');
  console.log('  ║   Asia-focused · bilingual · rights-aware     ║');
  console.log('  ╚════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('  ⚙ DRY RUN — no writes to Qdrant');
  console.log(`  ⚙ Limit: ${LIMIT}`);
  console.log(`  ⚙ Min source record score: ${MIN_RECORD_SCORE}`);
  console.log(`  ⚙ API token mode: ${API_TOKEN === 'null' ? 'public null-token flow' : 'registered developer token'}\n`);

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
  let skippedPrivate = 0;
  let skippedLowScore = 0;

  console.log('\n  Searching M+…\n');

  for (const group of SEARCH_GROUPS) {
    for (let page = 1; page <= (group.pages || 1); page++) {
      try {
        const rows = await fetchObjects({
          page,
          perPage: group.perPage,
          category: group.category,
          area: group.area,
          lang: 'en'
        });
        let added = 0;

        for (const item of rows) {
          if (!item?.id || seen.has(item.id)) continue;
          if (!item.publicAccess) {
            skippedPrivate++;
            continue;
          }

          const recordScore = scoreRecord(item, group.focus);
          if (recordScore < MIN_RECORD_SCORE) {
            skippedLowScore++;
            continue;
          }

          seen.set(item.id, { item, focus: group.focus, recordScore });
          added++;
        }

        const label = group.category || group.area;
        process.stdout.write(`  → ${label} · page ${page} — ${rows.length} rows, ${added} kept (total: ${seen.size})\n`);
        await sleep(160);
      } catch (err) {
        const label = group.category || group.area;
        process.stdout.write(`  ⚠ ${label} · page ${page} — ${err.message}\n`);
      }
    }
  }

  const ranked = selectDiverseRecords([...seen.values()], Math.min(seen.size, LIMIT * 2));
  const zhMap = await fetchLocalizedMap(ranked.map(row => row.item.id), 'zh-hant');

  console.log(`\n  ✓ ${seen.size} suitable M+ records found`);
  console.log(`  → Skipped private: ${skippedPrivate}`);
  console.log(`  → Skipped low score: ${skippedLowScore}`);
  console.log(`  → Ranked buffer: ${ranked.length}`);
  console.log(`  → Processing until ${LIMIT} public-safe objects are written\n`);

  let success = 0;
  let errors = 0;
  let skippedNoMedia = 0;

  for (let i = 0; i < ranked.length; i++) {
    if (!DRY_RUN && success >= LIMIT) break;
    const row = ranked[i];

    try {
      const itemEn = row.item;
      const itemZh = zhMap.get(itemEn.id) || null;
      const pageMeta = await fetchPageMeta(itemEn.titleSlug);

      if (!pageMeta.imageUrl) {
        skippedNoMedia++;
        await sleep(140);
        continue;
      }

      const payload = normalizeSourceRecord(itemEn, itemZh, pageMeta, row.focus);

      if (DRY_RUN) {
        success++;
        process.stdout.write(`  [DRY] ${payload.title.substring(0, 56)} — ${payload.category} · ${payload.media_rights_title}\n`);
      } else {
        const vector = await embed(payload.embedding_text);
        if (!vector || !vector.length) {
          errors++;
          continue;
        }
        await upsertPoint(POINT_ID_OFFSET + success, vector, payload);
        success++;
        const pct = Math.round((success / LIMIT) * 100);
        process.stdout.write(`  [${pct}%] ${success}/${LIMIT} · ${payload.title.substring(0, 48)}${payload.title.length > 48 ? '…' : ''}\r`);
      }

      await sleep(180);
    } catch {
      errors++;
      await sleep(260);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ M+ harvest complete`);
  console.log(`  → ${success} objects into '${COLLECTION}'`);
  console.log(`  → ${errors} errors/skipped`);
  console.log(`  → ${skippedNoMedia} objects skipped due to missing public preview image`);
  console.log(`  → Metadata kept CC0; API service kept flagged non-commercial\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
