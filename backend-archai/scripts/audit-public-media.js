#!/usr/bin/env node
// Audit collection image URLs before they reach ARCHAI cards or AUX.IO pages.
// Report-only by default; pass --apply to persist availability/CORS results.

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const getArg = (name, fallback = '') => {
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const LIMIT = Number.parseInt(getArg('limit', '0'), 10) || Infinity;
const CONCURRENCY = Math.max(1, Number.parseInt(getArg('concurrency', '12'), 10) || 12);
const requested = getArg('collections')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function imageUrl(payload = {}) {
  return payload.media_medium
    || payload.media_large
    || payload.media_thumbnail
    || payload.image_url
    || payload.primaryImageSmall
    || '';
}

function looksLikePlaceholder(value) {
  return /digital.image.not.yet.created|no[\s_-]?image|placeholder|image-unavailable|default[_-]?image/i.test(value);
}

function hasImageMagic(bytes) {
  if (bytes.length < 12) return false;
  return (
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    || String.fromCharCode(...bytes.slice(0, 3)) === 'GIF'
    || (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP')
  );
}

async function inspectUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return { available: false, canvasSafe: false, status: 'non_http_url', httpStatus: null, contentType: '' };
  }
  if (looksLikePlaceholder(url)) {
    return { available: false, canvasSafe: false, status: 'placeholder', httpStatus: null, contentType: '' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Range: 'bytes=0-4095',
        'User-Agent': 'ARCHAI-Media-Audit/1.0 (research; rob@fineartmedia.tech)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') || '';
    const cors = response.headers.get('access-control-allow-origin') || '';
    const bytes = new Uint8Array(await response.arrayBuffer());
    const imageResponse = /^image\//i.test(contentType) || hasImageMagic(bytes);
    const available = response.ok && imageResponse && bytes.length > 0;
    return {
      available,
      canvasSafe: available && Boolean(cors),
      status: available ? 'ok' : (response.ok ? 'not_an_image' : `http_${response.status}`),
      httpStatus: response.status,
      contentType,
      cors,
    };
  } catch (error) {
    return {
      available: false,
      canvasSafe: false,
      status: error.name === 'AbortError' ? 'timeout' : 'request_failed',
      httpStatus: null,
      contentType: '',
      error: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function listCollections() {
  const response = await fetch(`${QDRANT_URL}/collections`);
  if (!response.ok) throw new Error(`Qdrant collection list failed (${response.status})`);
  const data = await response.json();
  return (data.result?.collections || [])
    .map((row) => row.name)
    .filter((name) => name.startsWith('archai_') && name !== 'archai_curator');
}

async function scrollCollection(collection) {
  const points = [];
  let offset = null;
  do {
    const body = { limit: 256, with_payload: true };
    if (offset !== null) body.offset = offset;
    const response = await fetch(`${QDRANT_URL}/collections/${collection}/points/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`${collection} scroll failed (${response.status})`);
    const data = await response.json();
    points.push(...(data.result?.points || []));
    offset = data.result?.next_page_offset ?? null;
  } while (offset !== null && points.length < LIMIT);
  return points.slice(0, LIMIT);
}

async function setPayload(collection, pointId, payload) {
  const response = await fetch(`${QDRANT_URL}/collections/${collection}/points/payload?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [pointId], payload }),
  });
  if (!response.ok) throw new Error(`${collection} payload update failed (${response.status})`);
}

async function mapConcurrent(values, worker) {
  let cursor = 0;
  const output = new Array(values.length);
  async function run() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, values.length) }, run));
  return output;
}

async function main() {
  const availableCollections = await listCollections();
  const collections = requested.length ? requested : availableCollections;
  const missing = collections.filter((name) => !availableCollections.includes(name));
  if (missing.length) throw new Error(`Unknown Qdrant collections: ${missing.join(', ')}`);

  console.log(`ARCHAI media audit — ${APPLY ? 'APPLY' : 'REPORT ONLY'}`);
  console.log(`Collections: ${collections.join(', ')}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const totals = { checked: 0, ok: 0, broken: 0, canvasSafe: 0, noImage: 0 };
  for (const collection of collections) {
    const points = await scrollCollection(collection);
    const candidates = points
      .map((point) => ({ point, url: imageUrl(point.payload) }))
      .filter((row) => {
        if (row.url) return true;
        totals.noImage++;
        return false;
      });

    const audited = await mapConcurrent(candidates, async ({ point, url }) => ({
      point,
      url,
      result: await inspectUrl(url),
    }));

    const summary = { ok: 0, broken: 0, canvasSafe: 0 };
    for (const row of audited) {
      totals.checked++;
      if (row.result.available) { totals.ok++; summary.ok++; }
      else { totals.broken++; summary.broken++; }
      if (row.result.canvasSafe) { totals.canvasSafe++; summary.canvasSafe++; }

      if (APPLY) {
        await setPayload(collection, row.point.id, {
          media_available: row.result.available,
          media_canvas_safe: row.result.canvasSafe,
          media_audit_status: row.result.status,
          media_audit_http_status: row.result.httpStatus,
          media_audit_content_type: row.result.contentType,
          media_audited_at: new Date().toISOString(),
        });
      }
    }
    console.log(`${collection}: ${candidates.length} checked · ${summary.ok} available · ${summary.broken} hidden · ${summary.canvasSafe} canvas-safe`);
  }

  console.log(`\nTotal: ${totals.checked} checked · ${totals.ok} available · ${totals.broken} hidden · ${totals.canvasSafe} canvas-safe · ${totals.noImage} metadata-only`);
  if (!APPLY) console.log('Run again with --apply to write the audit fields to Qdrant.');
}

main().catch((error) => {
  console.error(`Media audit failed: ${error.message}`);
  process.exit(1);
});
