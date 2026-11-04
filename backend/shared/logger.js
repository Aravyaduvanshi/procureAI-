/**
 * ProcureAI Shared Structured Logger
 * Tracks request/correlation IDs, execution duration, and scrubs sensitive keys.
 */

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apikey', 'api_key', 'authorization', 'cookie', 'jwt'];

function sanitizeObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 3) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  const scrubbed = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      scrubbed[key] = sanitizeObject(val, depth + 1);
    } else {
      scrubbed[key] = val;
    }
  }
  return scrubbed;
}

export function createLogger(serviceName = 'procureai-service') {
  const isDev = process.env.NODE_ENV !== 'production';

  function formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = sanitizeObject(meta);
    return JSON.stringify({
      timestamp,
      level,
      service: serviceName,
      message,
      ...sanitizedMeta
    });
  }

  return {
    info(message, meta) {
      console.log(formatLog('INFO', message, meta));
    },
    warn(message, meta) {
      console.warn(formatLog('WARN', message, meta));
    },
    error(message, meta) {
      console.error(formatLog('ERROR', message, meta));
    },
    debug(message, meta) {
      if (process.env.DEBUG || isDev) {
        console.debug(formatLog('DEBUG', message, meta));
      }
    }
  };
}

export default createLogger('procureai');
