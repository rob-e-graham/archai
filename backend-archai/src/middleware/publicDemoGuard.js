// publicDemoGuard — deny-by-default allowlist for the public read-only demo.
//
// requestContext marks tunnel/public traffic as req.archai.isPublicDemo. For
// those requests this guard permits ONLY the specific read endpoints the demo
// needs and rejects everything else (all writes, publishing, ingestion, admin
// data, infrastructure) with 403. Fail-safe: a route that is not explicitly
// listed is blocked, so forgetting to list a new write route cannot expose it.
//
// Staff traffic (isPublicDemo false) is never touched here.
//
// Paths are matched relative to the /api mount (e.g. "/proxy/qdrant/scroll").

const PUBLIC_ALLOWLIST = [
  // Health / status
  { method: 'GET', pattern: /^\/health(\/|$)/ },
  { method: 'GET', pattern: /^\/proxy\/qdrant\/health$/ },
  { method: 'GET', pattern: /^\/proxy\/ollama\/health$/ },

  // Read-only search / conversation / embeddings (POST bodies, no mutation)
  { method: 'POST', pattern: /^\/proxy\/qdrant\/scroll$/ },
  { method: 'POST', pattern: /^\/proxy\/qdrant\/search$/ },
  { method: 'POST', pattern: /^\/proxy\/qdrant\/info$/ },
  { method: 'POST', pattern: /^\/proxy\/curator\/converse$/ },
  { method: 'POST', pattern: /^\/proxy\/curator\/search$/ },
  { method: 'POST', pattern: /^\/proxy\/chat$/ },
  { method: 'POST', pattern: /^\/proxy\/embed$/ },

  // AUXIO visitor pages + their public media (read-only)
  { method: 'GET', pattern: /^\/nfc\/pages\// },
  { method: 'GET', pattern: /^\/nfc\/published\// },

  // Make-AUXIO: the ONE write the public demo may perform. Creates/updates a
  // visitor page from an object's metadata (repo tag + draft object only; never
  // touches the source collections). Content is escaped on render. Needs light
  // moderation/cleanup of demo-created tags. Everything else stays blocked.
  { method: 'POST', pattern: /^\/nfc\/?$/ },

  // Read published social comments for display (posting is blocked)
  { method: 'GET', pattern: /^\/comments(\/|$)/ },
];

export function publicDemoGuard(req, res, next) {
  if (!req.archai || req.archai.isPublicDemo !== true) return next();

  const method = req.method.toUpperCase();
  const path = req.path;
  const allowed = PUBLIC_ALLOWLIST.some((rule) => rule.method === method && rule.pattern.test(path));
  if (allowed) return next();

  return res.status(403).json({
    ok: false,
    code: 'demo_read_only',
    error: 'This is a read-only public demo. Search, conversation, and browsing are available; editing, publishing, and administration are disabled.',
  });
}
