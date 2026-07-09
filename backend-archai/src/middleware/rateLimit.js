// Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
// Proprietary during the doctoral research period — see LICENSE.
const buckets = new Map();
const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL = 300_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS * 2) buckets.delete(key);
  }
}, CLEANUP_INTERVAL);

// Resolve a per-visitor identity. Behind a reverse proxy (Cloudflare, nginx)
// req.ip is often the single upstream IP shared by all visitors, so prefer the
// left-most X-Forwarded-For hop when present. Good enough for demo throttling.
function clientKey(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || 'unknown';
}

export function rateLimit({ maxPerMinute = 20, scope = 'default', keyFn } = {}) {
  return (req, res, next) => {
    // Scope the bucket per limiter so heavy read traffic (collection scroll,
    // search, embeddings on page load) cannot exhaust the separate chat budget.
    const key = `${scope}:${keyFn ? keyFn(req) : clientKey(req)}`;
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
