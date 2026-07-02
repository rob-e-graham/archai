#!/usr/bin/env node
/**
 * generic-harvester.js — config-driven onboarding harvester for JSON collection APIs.
 *
 * Turns a Connect-Collection config (from the ARCHAI app's Connect tab, extended
 * with a `mapping` block) into a real harvest — so simple REST sources don't need
 * a hand-written harvester script.
 *
 *   node generic-harvester.js --config archai-connector-<id>.json [--limit 25] [--dry-run]
 *   node generic-harvester.js --config archai-connector-<id>.json --limit 100 --apply
 *
 * Safety posture (same as every ARCHAI harvester):
 *  - dry-run is the default; nothing is written without --apply
 *  - raw source records are preserved verbatim in the payload (`_raw`)
 *  - rights are normalised but the source string is kept
 *  - public display requires an explicit open licence match; unknown => held
 *  - poster/print reuse is ALWAYS off for new sources until human legal review
 *  - culturally sensitive flags (if mapped) exclude records by default
 *
 * Config `mapping` block:
 *   {
 *     "records_path": "data.records",       // dot-path to the record array
 *     "page_param": "page",                 // optional ?page= pagination
 *     "query_extra": { "q": "*" },          // optional fixed query params
 *     "auth_header": "X-Api-Key",           // optional; key read from env
 *     "api_key_env": "MYSOURCE_API_KEY",    // optional env var (via Keytec)
 *     "fields": {
 *       "source_record_id": "id",
 *       "title": "title",
 *       "description": "description",
 *       "creator": "people.0.name",
 *       "date_range": "production_date",
 *       "object_type": "type",
 *       "medium": "medium",
 *       "image": "images.0.url",
 *       "rights": "rights_statement",
 *       "record_url": "links.self",
 *       "sensitive": "cultural_sensitivity" // truthy => excluded
 *     },
 *     "open_licence_values": ["cc0", "public domain", "cc by", "pdm"]
 *   }
 */

import fs from 'node:fs';
import path from 'node:path';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const EMBED_MODEL = 'nomic-embed-text';

const args = process.argv.slice(2);
function argValue(flag, fallback = null) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const CONFIG_PATH = argValue('--config');
const LIMIT = Number(argValue('--limit', 25));
const APPLY = args.includes('--apply');
const DRY = !APPLY;

if (!CONFIG_PATH) {
  console.error('Usage: node generic-harvester.js --config <connector.json> [--limit N] [--dry-run|--apply]');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.resolve(CONFIG_PATH), 'utf8'));
const map = cfg.mapping || {};
const fieldsMap = map.fields || {};
const COLLECTION = `archai_${cfg.id}`;
const openValues = (map.open_licence_values || ['cc0', 'public domain', 'pdm', 'cc by', 'cc-by', 'no known copyright']).map((v) => v.toLowerCase());

function dig(obj, dotPath) {
  if (!dotPath) return undefined;
  return String(dotPath).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function normaliseRights(raw) {
  const value = String(raw || '').toLowerCase();
  if (!value) return { status: 'unknown', open: false };
  const open = openValues.some((v) => value.includes(v));
  return { status: open ? 'open' : 'check-source', open };
}

async function fetchPage(page) {
  const url = new URL(cfg.api_base_url);
  for (const [k, v] of Object.entries(map.query_extra || {})) url.searchParams.set(k, v);
  if (map.page_param) url.searchParams.set(map.page_param, String(page));
  const headers = { Accept: 'application/json' };
  if (map.auth_header && map.api_key_env) {
    const key = process.env[map.api_key_env];
    if (!key) {
      console.error(`Missing env ${map.api_key_env} — run through Keytec: famtec.js run <profile> -- node generic-harvester.js ...`);
      process.exit(1);
    }
    headers[map.auth_header] = key;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

function mapRecord(raw) {
  const get = (name) => dig(raw, fieldsMap[name]);
  const rights = normaliseRights(get('rights'));
  const image = get('image');
  const sensitive = Boolean(get('sensitive'));
  const id = get('source_record_id');
  return {
    ok: Boolean(id && get('title')),
    sensitive,
    payload: {
      canonical_id: `${cfg.id}:${id}`,
      source: cfg.id,
      source_institution: cfg.name,
      source_record_id: String(id ?? ''),
      title: String(get('title') ?? '').trim(),
      description: String(get('description') ?? '').trim(),
      creator: String(get('creator') ?? '').trim(),
      date_range: String(get('date_range') ?? '').trim(),
      object_type: String(get('object_type') ?? '').trim() || 'Heritage Object',
      medium: String(get('medium') ?? '').trim(),
      record_url: String(get('record_url') ?? '').trim(),
      licence: String(get('rights') ?? '').trim() || 'Not stated — check source',
      legal_status_normalised: rights.status,
      media_thumbnail: image || null,
      media_medium: image || null,
      media_available: Boolean(image),
      media_public_display_allowed: Boolean(image) && rights.open,
      // Print reuse stays closed for every new source until a human legal review
      // flips it deliberately (see SOURCE_LEGAL_RANKING + onboarding blueprint).
      poster_download_allowed: false,
      cultural_sensitivity_flag: sensitive,
      harvested_at: new Date().toISOString(),
      harvester: 'generic-harvester.js',
      _raw: raw,
    },
  };
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: String(text).substring(0, 2000) }),
  });
  const data = await res.json();
  if (!Array.isArray(data.embedding)) throw new Error('Embedding failed — is Ollama running with nomic-embed-text?');
  return data.embedding;
}

async function ensureCollection(dim) {
  const existing = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
  if (existing.ok) return;
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: dim, distance: 'Cosine' } }),
  });
  console.log(`  ✓ created collection ${COLLECTION} (dim ${dim})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
}

(async () => {
  console.log(`\nGENERIC HARVESTER — ${cfg.name} (${cfg.id})`);
  console.log(`mode: ${DRY ? 'DRY-RUN (nothing written)' : 'APPLY'} · limit ${LIMIT} · target ${COLLECTION}\n`);

  if (!cfg.api_base_url) { console.error('Config has no api_base_url.'); process.exit(1); }
  if (!fieldsMap.source_record_id || !fieldsMap.title) {
    console.error('Config mapping.fields needs at least source_record_id and title.');
    process.exit(1);
  }

  const stats = { fetched: 0, mapped: 0, skippedNoCore: 0, sensitiveExcluded: 0, imageBacked: 0, openRights: 0, publicDisplay: 0 };
  const admitted = [];
  let page = 1;
  while (admitted.length < LIMIT) {
    const data = await fetchPage(page);
    const records = dig(data, map.records_path) || (Array.isArray(data) ? data : []);
    if (!Array.isArray(records) || records.length === 0) break;
    for (const raw of records) {
      if (admitted.length >= LIMIT) break;
      stats.fetched++;
      const rec = mapRecord(raw);
      if (!rec.ok) { stats.skippedNoCore++; continue; }
      if (rec.sensitive) { stats.sensitiveExcluded++; continue; }
      stats.mapped++;
      if (rec.payload.media_available) stats.imageBacked++;
      if (rec.payload.legal_status_normalised === 'open') stats.openRights++;
      if (rec.payload.media_public_display_allowed) stats.publicDisplay++;
      admitted.push(rec.payload);
    }
    if (!map.page_param) break;
    page++;
    if (page > 50) break;
  }

  console.log('── report ──');
  console.table ? console.table([stats]) : console.log(stats);
  console.log(`admitted (post-gates): ${admitted.length}`);
  console.log('\nsample mapped records:');
  for (const s of admitted.slice(0, 3)) {
    console.log(` · ${s.canonical_id} — ${s.title.slice(0, 60)} — rights: ${s.legal_status_normalised} — image: ${s.media_available} — public display: ${s.media_public_display_allowed}`);
  }

  if (DRY) {
    console.log('\nDRY-RUN complete. Review the report, complete the legal check, then re-run with --apply.');
    return;
  }

  console.log('\nembedding + upserting…');
  const first = await embed('dimension probe');
  await ensureCollection(first.length);
  // Stable point IDs from canonical_id so re-harvests update rather than duplicate.
  const stableId = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 90000000 + (h >>> 0) % 900000000;
  };
  let n = 0;
  for (const payloadRecord of admitted) {
    const vector = await embed(`${payloadRecord.title}. ${payloadRecord.description}`.trim());
    await upsertPoint(stableId(payloadRecord.canonical_id), vector, payloadRecord);
    n++;
    if (n % 10 === 0) console.log(`  ${n}/${admitted.length}`);
  }
  console.log(`\n✓ APPLY complete: ${n} records in ${COLLECTION}.`);
  console.log('Next: rebuild archai_curator, run the public media audit, then regenerate AUX.IO. Public print reuse stays OFF until the legal ranking review.');
})().catch((e) => { console.error('\nHARVEST FAILED:', e.message); process.exit(1); });
