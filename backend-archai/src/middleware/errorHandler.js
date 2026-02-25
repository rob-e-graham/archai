export function notFound(_req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Server error',
    details: err.details,
    requestId: req.archai?.requestId,
  });
}
