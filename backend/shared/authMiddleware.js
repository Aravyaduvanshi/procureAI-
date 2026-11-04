import redis from './redis.js';
import db from './db.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';

export async function authenticate(req, res, next) {
  try {
    // 1. Check dev mode override or header
    if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user']) {
      try {
        req.user = JSON.parse(req.headers['x-dev-user']);
        return next();
      } catch (e) {
        // Fall through
      }
    }

    // 2. Check session cookie or Authorization header
    const sessionId = req.cookies?.session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (sessionId) {
      // Check redis session
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        try {
          req.user = JSON.parse(sessionData);
          return next();
        } catch (e) {
          // Fall through
        }
      }
    }

    // 3. In local development or testing mode, default to authenticated buyer if no strict credentials
    const isDevMode = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    if (isDevMode) {
      req.user = {
        id: 'usr_dev_buyer_01',
        name: 'ProcureAI Lead Buyer',
        email: 'buyer@example.com',
        role: req.headers['x-user-role'] || 'buyer'
      };
      return next();
    }

    throw new UnauthorizedError('Valid session or authorization token required');
  } catch (err) {
    next(err);
  }
}

export function requireRole(allowedRoles = ['buyer']) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return next(new ForbiddenError(`Access restricted to: ${roles.join(', ')}`));
    }
    next();
  };
}
