import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { correlationMiddleware } from '../shared/correlation.js';
import { errorHandler } from '../shared/errors.js';
import { createLogger } from '../shared/logger.js';
import db from '../shared/db.js';
import { subscribeToRealtimeEvents, emitRealtimeEvent } from '../shared/realtime.js';

dotenv.config();

const logger = createLogger('gateway-service');
const app = express();
const PORT = process.env.PORT || 8000;

// Upstream Microservice URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:8001',
  supplier: process.env.SUPPLIER_SERVICE_URL || 'http://127.0.0.1:8002',
  requirement: process.env.REQUIREMENT_SERVICE_URL || 'http://127.0.0.1:8003',
  vendorRating: process.env.VENDOR_RATING_SERVICE_URL || 'http://127.0.0.1:8004',
  matching: process.env.MATCHING_SERVICE_URL || 'http://127.0.0.1:8005',
  approval: process.env.APPROVAL_SERVICE_URL || 'http://127.0.0.1:8006',
  negotiation: process.env.NEGOTIATION_SERVICE_URL || 'http://127.0.0.1:8007',
  communication: process.env.COMMUNICATION_SERVICE_URL || 'http://127.0.0.1:8008',
  billing: process.env.BILLING_SERVICE_URL || 'http://127.0.0.1:8009'
};

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'UPLOAD_RATE_LIMIT_EXCEEDED', message: 'Upload rate limit reached.' } }
});

// Middleware setup
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(correlationMiddleware);

// Gateway Root and Health Checks
app.get('/', (req, res) => {
  res.json({
    service: 'ProcureAI API Gateway',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Real-Time Server-Sent Events (SSE) Stream for Frontend
app.get(['/api/events', '/events'], (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true'
  });

  res.write(`:connected ${new Date().toISOString()}\n\n`);

  const unsubscribe = subscribeToRealtimeEvents((eventPayload) => {
    res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
  });

  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
  });
});

async function checkServiceHealth(name, url) {
  return new Promise((resolve) => {
    const healthUrl = `${url}/health`;
    http.get(healthUrl, { timeout: 1500 }, (res) => {
      resolve({ service: name, url, status: res.statusCode === 200 ? 'healthy' : 'degraded', code: res.statusCode });
    }).on('error', (err) => {
      resolve({ service: name, url, status: 'unreachable', error: err.message });
    });
  });
}

app.get('/health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(SERVICES).map(([name, url]) => checkServiceHealth(name, url))
  );

  const allHealthy = checks.every(c => c.status === 'healthy');

  res.status(allHealthy ? 200 : 207).json({
    gateway: 'healthy',
    timestamp: new Date().toISOString(),
    overall: allHealthy ? 'all_services_healthy' : 'some_services_unavailable',
    services: checks
  });
});

// Development-Only Data Reset Endpoint
app.post(['/api/dev/reset', '/dev/reset'], async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Development reset is prohibited in production.' }
    });
  }

  try {
    const stats = await db.resetDevelopmentData();
    await emitRealtimeEvent('DEV_RESET_COMPLETED', 'system', 'system', stats);
    res.json({
      success: true,
      message: 'Development database wiped successfully. Master supplier catalog preserved.',
      stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'DEV_RESET_FAILED', message: err.message }
    });
  }
});

// Proxy helper with correlation ID header decoration
function createServiceProxy(targetUrl, options = {}) {
  return proxy(targetUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['X-Correlation-ID'] = srcReq.correlationId || 'unknown';
      proxyReqOpts.headers['X-Request-ID'] = srcReq.correlationId || 'unknown';
      if (srcReq.cookies?.session) {
        proxyReqOpts.headers['Cookie'] = `session=${srcReq.cookies.session}`;
      }
      return proxyReqOpts;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy failure connecting to ${targetUrl}:`, { error: err.message });
      res.status(502).json({
        success: false,
        error: {
          code: 'BAD_GATEWAY',
          message: `Downstream microservice at ${targetUrl} is unavailable or failed to respond.`,
          details: err.message
        }
      });
    },
    ...options
  });
}

// Microservice Route Proxies
app.use(generalLimiter);
app.use('/auth', createServiceProxy(SERVICES.auth));
app.use('/api/suppliers', createServiceProxy(SERVICES.supplier));
app.use('/api/requirements/upload', uploadLimiter, createServiceProxy(SERVICES.requirement, { parseReqBody: false }));
app.use('/api/requirements', createServiceProxy(SERVICES.requirement));
app.use('/api/ratings', createServiceProxy(SERVICES.vendorRating));
app.use('/api/matching', createServiceProxy(SERVICES.matching));
app.use('/api/approvals', createServiceProxy(SERVICES.approval));
app.use('/api/negotiations', createServiceProxy(SERVICES.negotiation));
app.use('/api/communications', createServiceProxy(SERVICES.communication));
app.use('/webhooks/email/inbound', createServiceProxy(SERVICES.communication, {
  proxyReqPathResolver: () => '/webhook'
}));
app.use('/api/billing', createServiceProxy(SERVICES.billing));

app.use(errorHandler(logger));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Gateway service running on port ${PORT}`);
  });
}

export { app };
