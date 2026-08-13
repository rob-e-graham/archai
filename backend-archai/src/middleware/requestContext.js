import { mockUsers } from '../data/mockObjects.js';

// Hosts that mean "this request arrived from the public internet" (the Cloudflare
// tunnel that fronts the demo). Overridable via env for other deployments.
const PUBLIC_HOSTS = String(process.env.ARCHAI_PUBLIC_HOSTS || 'archai-api.fineartmedia.tech')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

// Master switch. Lockdown is ON by default so a fresh/public deployment is safe
// without extra config. Set ARCHAI_PUBLIC_LOCKDOWN=off only for an all-trusted
// private network where every caller is staff.
const LOCKDOWN_ON = String(process.env.ARCHAI_PUBLIC_LOCKDOWN || 'on').toLowerCase() !== 'off';

// Optional shared secret so a trusted operator can still reach staff routes
// through the public tunnel (e.g. remote admin). Absent by default.
const STAFF_KEY = process.env.ARCHAI_STAFF_KEY || '';

// A request is "public" when it reached us through Cloudflare (the only public
// ingress) or hit a known public hostname. Direct localhost / Tailscale traffic
// from staff carries none of these signals.
function isPublicRequest(req) {
  const viaCloudflare = Boolean(req.headers['cf-connecting-ip'] || req.headers['cf-ray']);
  const host = String(req.headers.host || '').toLowerCase();
  const hostIsPublic = PUBLIC_HOSTS.some((h) => host.includes(h));
  return viaCloudflare || hostIsPublic;
}

export function requestContext(req, _res, next) {
  const requestedRole = String(req.header('x-archai-role') || 'admin').toLowerCase();

  const staffOverride = Boolean(STAFF_KEY) && req.header('x-archai-staff-key') === STAFF_KEY;
  const publicDemo = LOCKDOWN_ON && isPublicRequest(req) && !staffOverride;

  // Public traffic is pinned to the read-only demo role regardless of the header
  // it sends — the header is a convenience for staff, never an authorisation grant.
  const role = publicDemo ? 'demo' : requestedRole;
  const user = mockUsers.find((u) => u.role === role) || mockUsers[0];

  req.archai = {
    requestId: crypto.randomUUID(),
    user: { ...user, role },
    role,
    isPublicDemo: publicDemo,
    startedAt: Date.now(),
  };
  next();
}
