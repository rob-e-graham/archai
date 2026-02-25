import { HttpError } from '../utils/httpError.js';

const roleOrder = ['visitor', 'volunteer', 'technician', 'collections', 'curator', 'admin'];

export function requireRole(minRole) {
  return (req, _res, next) => {
    const current = req.archai?.role || 'visitor';
    if (roleOrder.indexOf(current) < roleOrder.indexOf(minRole)) {
      return next(new HttpError(403, `Requires role: ${minRole}`));
    }
    next();
  };
}
