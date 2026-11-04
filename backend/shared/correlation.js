import crypto from 'crypto';

/**
 * Middleware that extracts or assigns request and correlation IDs
 */
export function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);
  next();
}
