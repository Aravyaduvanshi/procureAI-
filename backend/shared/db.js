import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_STORE_DIR = path.resolve(__dirname, '../data/store');

// Ensure local durable store directory exists
if (!fs.existsSync(DATA_STORE_DIR)) {
  fs.mkdirSync(DATA_STORE_DIR, { recursive: true });
}

class FileCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_STORE_DIR, `${collectionName}.json`);
    this.memory = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && item.id) {
              this.memory.set(String(item.id), item);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Shared:DB] Could not read ${this.filePath}, starting clean.`, err.message);
    }
  }

  saveToDisk() {
    try {
      const items = Array.from(this.memory.values());
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error(`[Shared:DB] Failed to save collection to ${this.filePath}:`, err.message);
    }
  }

  async findById(id) {
    return this.memory.get(String(id)) || null;
  }

  async findAll(filterFn = null) {
    const all = Array.from(this.memory.values());
    if (filterFn && typeof filterFn === 'function') {
      return all.filter(filterFn);
    }
    return all;
  }

  async save(item) {
    if (!item.id) {
      throw new Error('Item must have an id property');
    }
    const record = {
      ...item,
      updatedAt: new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.memory.set(String(item.id), record);
    this.saveToDisk();
    return record;
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };
    this.memory.set(String(id), updated);
    this.saveToDisk();
    return updated;
  }

  async delete(id) {
    const existed = this.memory.delete(String(id));
    if (existed) {
      this.saveToDisk();
    }
    return existed;
  }
}

class DurableDatabase {
  constructor() {
    this.isPostgres = false;
    this.pool = null;
    this.collections = {
      users: new FileCollection('users'),
      requirements: new FileCollection('requirements'),
      matchingRuns: new FileCollection('matching_runs'),
      approvals: new FileCollection('approvals'),
      negotiations: new FileCollection('negotiations'),
      messages: new FileCollection('negotiation_messages'),
      auditEvents: new FileCollection('audit_events')
    };

    this.initPostgres();
  }

  async initPostgres() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return;
    }
    try {
      this.pool = new pg.Pool({ connectionString: dbUrl, connectionTimeoutMillis: 2000 });
      const client = await this.pool.connect();
      client.release();
      this.isPostgres = true;
      console.log('[Shared:DB] PostgreSQL connected successfully. Using PostgreSQL persistence.');
      await this.runMigrations();
    } catch (err) {
      console.warn(`[Shared:DB] PostgreSQL not reachable (${err.message}). Using local durable file persistence.`);
      this.isPostgres = false;
    }
  }

  async runMigrations() {
    if (!this.pool) return;
    const migrationSql = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'buyer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS requirements (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255),
        status VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS matching_runs (
        id VARCHAR(100) PRIMARY KEY,
        requirement_id VARCHAR(100),
        status VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS approvals (
        id VARCHAR(100) PRIMARY KEY,
        proposal_id VARCHAR(100),
        proposal_version INT,
        decision VARCHAR(50),
        approver VARCHAR(255),
        reason TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS negotiations (
        id VARCHAR(100) PRIMARY KEY,
        supplier_id VARCHAR(100),
        requirement_id VARCHAR(100),
        status VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS negotiation_messages (
        id VARCHAR(100) PRIMARY KEY,
        negotiation_id VARCHAR(100),
        sender VARCHAR(50),
        recipient VARCHAR(255),
        subject VARCHAR(255),
        body TEXT,
        status VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id VARCHAR(100) PRIMARY KEY,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        action VARCHAR(100),
        actor VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await this.pool.query(migrationSql);
      console.log('[Shared:DB] PostgreSQL migrations verified.');
    } catch (err) {
      console.error('[Shared:DB] Error running PostgreSQL migrations:', err.message);
    }
  }

  get users() { return this.collections.users; }
  get requirements() { return this.collections.requirements; }
  get matchingRuns() { return this.collections.matchingRuns; }
  get approvals() { return this.collections.approvals; }
  get negotiations() { return this.collections.negotiations; }
  get messages() { return this.collections.messages; }
  get auditEvents() { return this.collections.auditEvents; }

  async logAudit({ entityType, entityId, action, actor = 'system', details = {} }) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const event = {
      id,
      entityType,
      entityId,
      action,
      actor,
      details,
      timestamp: new Date().toISOString()
    };
    return this.auditEvents.save(event);
  }
}

const db = new DurableDatabase();
export default db;
