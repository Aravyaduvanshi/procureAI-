import Redis from 'ioredis';

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.isMock = true;
  }

  async get(key) {
    if (this.ttls.has(key) && this.ttls.get(key) < Date.now()) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) ?? null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, String(value));
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000);
    } else if (mode === 'PX' && duration) {
      this.ttls.set(key, Date.now() + duration);
    }
    return 'OK';
  }

  async del(key) {
    const deleted = this.store.delete(key);
    this.ttls.delete(key);
    return deleted ? 1 : 0;
  }

  async ping() {
    return 'PONG';
  }

  on() {
    return this;
  }
}

let redisClient;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

try {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) {
        return null; // Stop retrying to avoid spamming logs when Redis is offline
      }
      return 500;
    },
    lazyConnect: true
  });

  client.on('connect', () => {
    console.log(`[Shared:Redis] Connected to Redis at ${redisUrl.replace(/:[^:@]+@/, ':***@')}`);
  });

  client.on('error', (err) => {
    // Prevent unhandled errors crashing Node
    console.warn(`[Shared:Redis] Warning: Redis error (${err.message}). In-memory fallback will handle requests.`);
  });

  // Attempt non-blocking connection
  client.connect().catch((err) => {
    console.warn(`[Shared:Redis] Could not connect to external Redis (${err.message}). Using resilient in-memory fallback.`);
  });

  redisClient = client;
} catch (err) {
  console.warn(`[Shared:Redis] Falling back to in-memory cache: ${err.message}`);
  redisClient = new InMemoryCache();
}

export { InMemoryCache };
export default redisClient;