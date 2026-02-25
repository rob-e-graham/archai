import { mockUsers } from '../data/mockObjects.js';

export function requestContext(req, _res, next) {
  const role = String(req.header('x-archai-role') || 'admin').toLowerCase();
  const user = mockUsers.find((u) => u.role === role) || mockUsers[0];
  req.archai = {
    requestId: crypto.randomUUID(),
    user: { ...user, role },
    role,
    startedAt: Date.now(),
  };
  next();
}
