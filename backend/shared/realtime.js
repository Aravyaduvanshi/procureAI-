import { EventEmitter } from 'events';
import redisClient from './redis.js';
import Redis from 'ioredis';

const localBus = new EventEmitter();
localBus.setMaxListeners(100);

const REDIS_CHANNEL = 'procureai:realtime_events';

let subscriber = null;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// In automated test mode, skip persistent Redis subscriber connection to allow tests to exit cleanly
if (process.env.NODE_ENV !== 'test') {
  try {
    subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : 500),
      lazyConnect: true
    });

    subscriber.on('message', (channel, message) => {
      if (channel === REDIS_CHANNEL) {
        try {
          const payload = JSON.parse(message);
          localBus.emit('event', payload);
        } catch (e) {}
      }
    });

    subscriber.connect().then(() => {
      subscriber.subscribe(REDIS_CHANNEL).catch(() => {});
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Emit a standardized ProcureAI realtime event
 */
export async function emitRealtimeEvent(event, entityType, entityId, data = {}) {
  const payload = {
    event,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    data
  };

  // Always emit on local process bus
  localBus.emit('event', payload);

  // Publish to Redis for multi-service fan-out
  if (process.env.NODE_ENV !== 'test') {
    try {
      if (redisClient && typeof redisClient.publish === 'function') {
        await redisClient.publish(REDIS_CHANNEL, JSON.stringify(payload)).catch(() => {});
      }
    } catch (err) {}
  }

  console.log(`[REALTIME] ${event} emitted for ${entityType} ${entityId}`);
  return payload;
}

/**
 * Subscribe to realtime events
 */
export function subscribeToRealtimeEvents(handler) {
  localBus.on('event', handler);
  return () => {
    localBus.off('event', handler);
  };
}

export default {
  emitRealtimeEvent,
  subscribeToRealtimeEvents
};
