#!/usr/bin/env node
// ARCHAI — Auckland media placeholder audit
// Marks Auckland records as metadata-only when the API returns its
// "Digital image not yet created" placeholder through the public IIIF route.

import { createHash } from 'node:crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = 'archai_auckland';
const DRY_RUN = process.argv.includes('--dry-run');

const PLACEHOLDER_HASHES = new Set([
  '8824d0781730427b72813fa1678a2b02',
  '53000f8668ef40d519eb97aa73cfdb48',
  '3af9d4afa5fe4cc79ccbe168ad66e978',
]);

async function qdrant(path, options = {}) {
  const res = await fetch(`${QDRANT_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
}

async function scrollAll() {
  const points = [];
  let offset = null;
  do {
    const body = { limit: 256, with_payload: true };
    if (offset !== null) body.offset = offset;
    const data = await qdrant(`/collections/${COLLECTION}/points/scroll`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    points.push(...(data.result?.points || []));
    offset = data.result?.next_page_offset ?? null;
  } while (offset !== null);
  return points;
}

function imageUrl(payload = {}) {
  return payload.media_medium || payload.media_large || payload.media_thumbnail || payload.image_url || '';
}

async function md5Url(url) {
  const res = await fetch(url);
  if (!res.ok) return '';
  const buffer = Buffer.from(await res.arrayBuffer());
  return createHash('md5').update(buffer).digest('hex');
}

async function setPayload(pointId, payload) {
  if (DRY_RUN) return;
  await qdrant(`/collections/${COLLECTION}/points/payload?wait=true`, {
    method: 'POST',
    body: JSON.stringify({ points: [pointId], payload }),
  });
}

const points = await scrollAll();
let checked = 0;
let held = 0;
let restored = 0;

for (const point of points) {
  const payload = point.payload || {};
  const url = imageUrl(payload);
  if (!url) continue;
  checked++;
  let hash = '';
  try {
    hash = await md5Url(url);
  } catch (err) {
    hash = '';
  }

  if (PLACEHOLDER_HASHES.has(hash)) {
    held++;
    await setPayload(point.id, {
      media_available: false,
      media_placeholder: true,
      media_placeholder_reason: 'Auckland API returned the "Digital image not yet created" placeholder.',
      media_placeholder_hash: hash,
    });
    console.log(`  held ${payload.canonical_id || point.id} · ${payload.title || payload.object_name || 'Untitled'}`);
  } else if (payload.media_placeholder === true || payload.media_available === false) {
    restored++;
    await setPayload(point.id, {
      media_available: true,
      media_placeholder: false,
      media_placeholder_reason: '',
      media_placeholder_hash: hash || '',
    });
    console.log(`  restored ${payload.canonical_id || point.id} · ${payload.title || payload.object_name || 'Untitled'}`);
  }
}

console.log(`\nAuckland media audit ${DRY_RUN ? '(dry-run) ' : ''}complete`);
console.log(`  checked: ${checked}`);
console.log(`  held placeholders: ${held}`);
console.log(`  restored real media: ${restored}`);
