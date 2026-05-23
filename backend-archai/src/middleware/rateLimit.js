// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// Copyright (c) 2026 Rob Graham / FAMTEC
const buckets = new Map();
const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL = 300_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS * 2) buckets.delete(key);
  }
}, CLEANUP_INTERVAL);

export function rateLimit({ maxPerMinute = 20, keyFn } = {}) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : (req.ip || 'unknown');
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
      bucket = { windowStart: now, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count++;
    res.set('X-RateLimit-Limit', String(maxPerMinute));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxPerMinute - bucket.count)));
    if (bucket.count > maxPerMinute) {
      return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Try again in a minute.' });
    }
    next();
  };
}
