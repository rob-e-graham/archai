#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — ResourceSpace Read Connector / POC Harvester
// ResourceSpace remains the DAM. ARCHAI/AUXIO becomes the read-only
// visitor-facing Obtext layer for selected, approved records.
//
// Usage:
//   RESOURCE_SPACE_URL=https://demo.example.org \
//   RESOURCE_SPACE_USER=admin \
//   RESOURCE_SPACE_API_KEY=... \
//     node resourcespace-harvester.js --query "museum" --limit 20
//
//   ... node resourcespace-harvester.js --apply --limit 20
//
// API docs: https://www.resourcespace.com/knowledge-base/api/
// Notes: dry-run by default; no writes back to ResourceSpace.
// ══════════════════════════════════════════════════════════════════

import crypto from 'node:crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COLLECTION = 'archai_resourcespace';
const EMBED_MODEL = process.env.ARCHAI_EMBED_MODEL || 'nomic-embed-text';
const ID_OFFSET = 18000000;

const args = process.argv.slice(2);
const hasArg = (name) => args.includes('--' + name);
const getArg = (name, fallback = '') => {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

if (hasArg('help')) {
  console.log(`
ARCHAI ResourceSpace read connector

Required env:
  RESOURCE_SPACE_URL       Base URL, e.g. https://my.resourcespace.system
  RESOURCE_SPACE_USER      API user
  RESOURCE_SPACE_API_KEY   User private API key

Options:
  --query "painting"       ResourceSpace search string (default: museum)
  --limit 20               Number of ResourceSpace results to inspect
  --restypes "1,2"         Optional ResourceSpace resource type IDs
  --archive 0              ResourceSpace archive status, default live assets
  --preview-size scr       ResourceSpace derivative size, default scr
  --apply                  Write admitted records to Qdrant
  --skip-media-paths       Do not request temporary derivative URLs
`);
  process.exit(0);
}

const BASE_URL = String(process.env.RESOURCE_SPACE_URL || getArg('base-url', '')).replace(/\/+$/, '');
const USER = process.env.RESOURCE_SPACE_USER || getArg('user', '');
const API_KEY = process.env.RESOURCE_SPACE_API_KEY || getArg('api-key', '');
const API_URL = `${BASE_URL}/api/`;
const INSTITUTION = process.env.RESOURCE_SPACE_INSTITUTION || getArg('institution', 'ResourceSpace POC');
const QUERY = getArg('query', process.env.RESOURCE_SPACE_QUERY || 'museum');
const LIMIT = parseInt(getArg('limit', '20'), 10);
const RESTYPES = getArg('restypes', process.env.RESOURCE_SPACE_RESTYPES || '');
const ARCHIVE = getArg('archive', process.env.RESOURCE_SPACE_ARCHIVE || '0');
const PREVIEW_SIZE = getArg('preview-size', process.env.RESOURCE_SPACE_PREVIEW_SIZE || 'scr');
const APPLY = hasArg('apply');
const DRY_RUN = !APPLY;
const SKIP_MEDIA_PATHS = hasArg('skip-media-paths');

const OPEN_RIGHTS = [
  'cc0', 'public domain', 'publicdomain', 'pdm', 'no known copyright',
  'cc-by', 'cc by', 'creativecommons.org/licenses/by', 'open access',
];

function requireConfig() {
  const missing = [];
  if (!BASE_URL) missing.push('RESOURCE_SPACE_URL');
  if (!USER) missing.push('RESOURCE_SPACE_USER');
  if (!API_KEY) missing.push('RESOURCE_SPACE_API_KEY');
  if (missing.length) {
    console.error(`\n  ✗ Missing ${missing.join(', ')}`);
    console.error('  → Run with --help for the ResourceSpace connector setup.\n');
    process.exit(1);
  }
}

function buildQuery(functionName, params = {}) {
  const search = new URLSearchParams();
  search.set('user', USER);
  search.set('function', functionName);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  const sign = crypto.createHash('sha256').update(API_KEY + query).digest('hex');
  return `${query}&sign=${sign}`;
}

async function callResourceSpace(functionName, params = {}) {
  const query = buildQuery(functionName, params);
  const res = await fetch(`${API_URL}?${query}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ARCHAI/1.0 ResourceSpace connector POC (rob@fineartmedia.tech)',
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${functionName} HTTP ${res.status}: ${text.slice(0, 160)}`);
  try {
    return JSON.parse(text);
  } catch (_) {
    if (/^false$/i.test(text.trim())) return false;
    return text;
  }
}

function normaliseSearchResult(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function strip(v) {
  return String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fieldValue(field) {
  return strip(
    field?.value ||
    field?.value_filter ||
    field?.display ||
    field?.translated_name ||
    field?.name ||
    ''
  );
}

function fieldLabel(field) {
  return strip(field?.shortname || field?.title || field?.name || field?.ref || '');
}

function fieldsToSnapshot(fields) {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => ({ label: fieldLabel(field), value: fieldValue(field), ref: field?.ref || field?.resource_type_field || '' }))
    .filter((field) => field.label || field.value);
}

function findField(snapshot, patterns) {
  const rx = patterns.map((p) => new RegExp(p, 'i'));
  const direct = snapshot.find((field) => rx.some((re) => re.test(field.label)));
  if (direct?.value) return direct.value;
  const loose = snapshot.find((field) => rx.some((re) => re.test(`${field.label} ${field.value}`)));
  return loose?.value || '';
}

function titleFrom(row, snapshot) {
  return (
    findField(snapshot, ['^title$', 'object title', 'caption', 'headline', 'name']) ||
    strip(row.title || row.field8 || row.field12 || row.ref) ||
    `Resource ${row.ref}`
  );
}

function normaliseRights(raw) {
  const v = strip(raw).toLowerCase();
  if (!v) return { open: false, status: 'unknown' };
  const open = OPEN_RIGHTS.some((token) => v.includes(token));
  return { open, status: open ? 'open' : 'check-source' };
}

async function getMediaUrl(row) {
  if (SKIP_MEDIA_PATHS) return '';
  if (String(row.has_image || '') === '0') return '';
  try {
    const extension = row.preview_extension || row.file_extension || 'jpg';
    const url = await callResourceSpace('get_resource_path', {
      ref: row.ref,
      size: PREVIEW_SIZE,
      generate: 1,
      extension,
    });
    return typeof url === 'string' ? url : '';
  } catch (e) {
    console.warn(`  ⚠ media path unavailable for ResourceSpace #${row.ref}: ${e.message}`);
    return '';
  }
}

function mapResource({ row, data, fields, mediaUrl }) {
  const snapshot = fieldsToSnapshot(fields);
  const title = titleFrom(row, snapshot);
  const creator = findField(snapshot, ['artist', 'creator', 'maker', 'author', 'photographer', 'contributor']);
  const description = findField(snapshot, ['description', 'summary', 'interpretation', 'caption', 'abstract', 'notes']);
  const date = findField(snapshot, ['date', 'period', 'created', 'creation']);
  const objectType = findField(snapshot, ['object type', 'type', 'resource type', 'classification', 'medium']) || String(data.resource_type || row.resource_type || 'Resource');
  const rightsText = findField(snapshot, ['rights', 'licen[cs]e', 'copyright', 'usage', 'permission', 'access']);
  const provenance = findField(snapshot, ['provenance', 'credit', 'source', 'collection']);
  const subjects = findField(snapshot, ['subject', 'keyword', 'tag', 'theme', 'category']);
  const rights = normaliseRights(rightsText);
  const sourceUrl = `${BASE_URL}/pages/view.php?ref=${encodeURIComponent(row.ref)}`;
  const verifiedFacts = [
    title ? `Title: ${title}` : '',
    creator ? `Creator: ${creator}` : '',
    date ? `Date: ${date}` : '',
    objectType ? `Type: ${objectType}` : '',
    description ? `Description: ${description}` : '',
    rightsText ? `Rights: ${rightsText}` : '',
  ].filter(Boolean);
  const embeddingText = [title, creator, date, objectType, description, subjects, provenance, rightsText]
    .filter(Boolean).join('. ');

  return {
    ok: Boolean(row.ref && title),
    payload: {
      canonical_id: `resourcespace:${row.ref}`,
      source: 'resourcespace',
      _source_collection: COLLECTION,
      source_collection_label: 'ResourceSpace',
      source_institution: INSTITUTION,
      source_record_id: String(row.ref),
      resourcespace_ref: String(row.ref),
      resourcespace_access: String(row.access ?? ''),
      resourcespace_archive: String(row.archive ?? ''),
      title,
      object_type: objectType,
      category: subjects,
      date_range: date,
      artist: creator,
      description,
      credit_line: provenance,
      licence: rightsText || 'Check source ResourceSpace record',
      legal_status_normalised: rights.status,
      media_thumbnail: mediaUrl,
      media_medium: mediaUrl,
      media_large: mediaUrl,
      media_available: Boolean(mediaUrl),
      media_public_display_allowed: rights.open && Boolean(mediaUrl),
      poster_download_allowed: false,
      source_url: sourceUrl,
      harvested_at: new Date().toISOString(),
      harvester: 'resourcespace-harvester.js',
      obtext_layer: 'resourcespace-to-auxio-poc',
      auxio_candidate: true,
      verified_facts: verifiedFacts,
      unknown_fields: rightsText ? [] : ['rights/licence status'],
      prohibited_statements: ['Do not claim rights, provenance, artist intent, or cultural authority beyond the ResourceSpace-derived record.'],
      resourcespace_fields: snapshot.slice(0, 80),
      embedding_text: embeddingText || title,
    },
  };
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: String(text).substring(0, 2000) }),
  });
  if (!res.ok) throw new Error(`Ollama embeddings HTTP ${res.status}`);
  return (await res.json()).embedding;
}

async function ensureCollection() {
  try {
    const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (r.ok) {
      console.log(`  ✓ Collection '${COLLECTION}' exists`);
      return;
    }
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

async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — ResourceSpace → AUXIO POC     ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  requireConfig();
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes; pass --apply to write]\n');
  console.log(`  → ResourceSpace: ${BASE_URL}`);
  console.log(`  → Query: ${QUERY}`);
  console.log(`  → Limit: ${LIMIT}`);
  console.log(`  → Visitor layer target: AUXIO / Obtext\n`);

  if (!DRY_RUN) {
    try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
    catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }
    try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
    catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }
    await ensureCollection();
  }

  const searchParams = {
    search: QUERY,
    restypes: RESTYPES,
    order_by: 'relevance',
    archive: ARCHIVE,
    fetchrows: `0,${LIMIT}`,
  };
  const search = await callResourceSpace('do_search', searchParams);
  const rows = normaliseSearchResult(search).slice(0, LIMIT);
  console.log(`  ✓ ResourceSpace returned ${rows.length} candidate records\n`);

  let success = 0;
  let held = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const data = await callResourceSpace('get_resource_data', { resource: row.ref });
      const fields = await callResourceSpace('get_resource_field_data', { resource: row.ref });
      const mediaUrl = await getMediaUrl(row);
      const rec = mapResource({ row, data: data || row, fields, mediaUrl });
      if (!rec.ok) { held++; continue; }
      const status = rec.payload.media_public_display_allowed ? 'public-media' : 'metadata/rights-check';
      if (DRY_RUN) {
        console.log(`  [dry] #${row.ref} ${rec.payload.title.substring(0, 62)} — ${status}`);
        success++;
        continue;
      }
      const vector = await embed(rec.payload.embedding_text);
      if (!vector?.length) { held++; continue; }
      await upsertPoint(ID_OFFSET + success, vector, rec.payload);
      console.log(`  ✓ #${row.ref} ${rec.payload.title.substring(0, 56)} — ${status}`);
      success++;
    } catch (e) {
      errors++;
      console.warn(`  ⚠ #${row.ref || 'unknown'} ${e.message}`);
    }
  }

  console.log('\n  ════════════════════════════════════════════');
  console.log(`  ✓ ResourceSpace → AUXIO POC ${DRY_RUN ? '(dry-run) ' : ''}complete`);
  console.log(`  → ${success} records ${DRY_RUN ? 'mapped' : `written to '${COLLECTION}'`}`);
  console.log(`  → ${held} held/skipped`);
  console.log(`  → ${errors} errors`);
  console.log('  → Next: generate AUXIO pages from admitted image-backed, rights-cleared records.\n');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
