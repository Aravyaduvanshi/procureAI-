import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

/**
 * PostgreSQL-backed shared persistence layer.
 *
 * PostgreSQL is the single source of truth.
 * No in-memory Map or JSON file fallback is used.
 * DATABASE_URL is strictly required; fail fast if missing.
 */

class PgCollection {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id) {
    await this.db.ready();

    const result = await this.db.pool.query(
      `SELECT data
       FROM ${this.tableName}
       WHERE id = $1
       LIMIT 1`,
      [String(id)]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].data;
  }

  async findAll(filterFn = null) {
    await this.db.ready();

    const result = await this.db.pool.query(
      `SELECT data
       FROM ${this.tableName}
       ORDER BY created_at DESC`
    );

    let items = result.rows.map(row => row.data);

    if (typeof filterFn === 'function') {
      items = items.filter(filterFn);
    }

    return items;
  }

  async save(item) {
    await this.db.ready();

    if (!item?.id) {
      throw new Error(`[DB] Item in collection ${this.tableName} must have an id property`);
    }

    const now = new Date().toISOString();
    const record = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: now
    };

    // Extract typed columns depending on collection for indexed search
    const id = String(record.id);
    const dataJson = JSON.stringify(record);
    const createdAt = record.createdAt;
    const updatedAt = record.updatedAt;

    switch (this.tableName) {
      case 'requirements':
        await this.db.pool.query(
          `INSERT INTO requirements (id, title, status, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             status = EXCLUDED.status,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [id, record.title || 'Untitled', record.status || 'DRAFT', dataJson, createdAt, updatedAt]
        );
        break;

      case 'matching_runs':
        await this.db.pool.query(
          `INSERT INTO matching_runs (id, requirement_id, status, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             requirement_id = EXCLUDED.requirement_id,
             status = EXCLUDED.status,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [id, record.requirementId || record.requirement_id || null, record.status || 'PENDING', dataJson, createdAt, updatedAt]
        );
        break;

      case 'negotiations':
        await this.db.pool.query(
          `INSERT INTO negotiations (id, supplier_id, requirement_id, status, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             supplier_id = EXCLUDED.supplier_id,
             requirement_id = EXCLUDED.requirement_id,
             status = EXCLUDED.status,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [
            id,
            record.supplierId || record.supplier_id || null,
            record.requirementId || record.requirement_id || null,
            record.status || 'DRAFT',
            dataJson,
            createdAt,
            updatedAt
          ]
        );
        break;

      case 'negotiation_messages':
        await this.db.pool.query(
          `INSERT INTO negotiation_messages (id, negotiation_id, sender, recipient, subject, body, status, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             negotiation_id = EXCLUDED.negotiation_id,
             sender = EXCLUDED.sender,
             recipient = EXCLUDED.recipient,
             subject = EXCLUDED.subject,
             body = EXCLUDED.body,
             status = EXCLUDED.status,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [
            id,
            record.negotiationId || record.negotiation_id || null,
            record.sender || 'UNKNOWN',
            record.recipient || '',
            record.subject || '',
            record.body || '',
            record.status || 'DRAFT',
            dataJson,
            createdAt,
            updatedAt
          ]
        );
        break;

      case 'approvals':
        await this.db.pool.query(
          `INSERT INTO approvals (id, proposal_id, proposal_version, decision, approver, reason, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             proposal_id = EXCLUDED.proposal_id,
             proposal_version = EXCLUDED.proposal_version,
             decision = EXCLUDED.decision,
             approver = EXCLUDED.approver,
             reason = EXCLUDED.reason,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [
            id,
            record.proposalId || record.proposal_id || null,
            Number(record.proposalVersion || record.proposal_version || 1),
            record.decision || 'PENDING',
            typeof record.approver === 'object' ? (record.approver?.email || 'buyer@example.com') : (record.approver || 'buyer@example.com'),
            record.reason || '',
            dataJson,
            createdAt,
            updatedAt
          ]
        );
        break;

      case 'audit_events':
        await this.db.pool.query(
          `INSERT INTO audit_events (id, entity_type, entity_id, action, actor, details, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             entity_type = EXCLUDED.entity_type,
             entity_id = EXCLUDED.entity_id,
             action = EXCLUDED.action,
             actor = EXCLUDED.actor,
             details = EXCLUDED.details,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [
            id,
            record.entityType || record.entity_type || 'system',
            record.entityId || record.entity_id || 'unknown',
            record.action || 'ACTION',
            record.actor || 'system',
            JSON.stringify(record.details || {}),
            dataJson,
            createdAt,
            updatedAt
          ]
        );
        break;

      case 'users':
        await this.db.pool.query(
          `INSERT INTO users (id, email, name, role, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             role = EXCLUDED.role,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [id, record.email || null, record.name || null, record.role || 'buyer', dataJson, createdAt, updatedAt]
        );
        break;

      default:
        await this.db.pool.query(
          `INSERT INTO ${this.tableName} (id, data, created_at, updated_at)
           VALUES ($1, $2::jsonb, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [id, dataJson, createdAt, updatedAt]
        );
    }

    return record;
  }

  async update(id, updates) {
    await this.db.ready();

    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    return this.save(updated);
  }

  async delete(id) {
    await this.db.ready();

    const result = await this.db.pool.query(
      `DELETE FROM ${this.tableName}
       WHERE id = $1`,
      [String(id)]
    );

    return result.rowCount > 0;
  }
}

class DurableDatabase {
  constructor() {
    this.pool = null;
    this.initializationPromise = this.initPostgres();

    this.collections = {
      users: new PgCollection(this, 'users'),
      requirements: new PgCollection(this, 'requirements'),
      matchingRuns: new PgCollection(this, 'matching_runs'),
      approvals: new PgCollection(this, 'approvals'),
      negotiations: new PgCollection(this, 'negotiations'),
      messages: new PgCollection(this, 'negotiation_messages'),
      auditEvents: new PgCollection(this, 'audit_events')
    };
  }

  async initPostgres() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.error('[DB] DATABASE_URL is missing. Failing fast. PostgreSQL is required.');
      throw new Error(
        '[DB] DATABASE_URL is not configured. PostgreSQL is required.'
      );
    }

    console.log('[DB] Connecting...');

    this.pool = new Pool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true
    });

    try {
      const client = await this.pool.connect();
      client.release();

      console.log('[DB] Connected');

      await this.runMigrations();

      console.log('[DB] Migrations verified');
      console.log('[DB] PostgreSQL persistence enabled');
    } catch (err) {
      console.error('[DB] PostgreSQL connection failed:', err.message);
      throw err;
    }
  }

  async ready() {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  async runMigrations() {
    const migrationSql = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'buyer',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS requirements (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255),
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matching_runs (
        id VARCHAR(100) PRIMARY KEY,
        requirement_id VARCHAR(100),
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id VARCHAR(100) PRIMARY KEY,
        proposal_id VARCHAR(100),
        proposal_version INT,
        decision VARCHAR(50),
        approver VARCHAR(255),
        reason TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS negotiations (
        id VARCHAR(100) PRIMARY KEY,
        supplier_id VARCHAR(100),
        requirement_id VARCHAR(100),
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS negotiation_messages (
        id VARCHAR(100) PRIMARY KEY,
        negotiation_id VARCHAR(100),
        sender VARCHAR(100),
        recipient VARCHAR(255),
        subject VARCHAR(255),
        body TEXT,
        status VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id VARCHAR(100) PRIMARY KEY,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        action VARCHAR(100),
        actor VARCHAR(255),
        details JSONB,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_requirements_status
        ON requirements(status);

      CREATE INDEX IF NOT EXISTS idx_requirements_created
        ON requirements(created_at);

      CREATE INDEX IF NOT EXISTS idx_matching_runs_requirement
        ON matching_runs(requirement_id);

      CREATE INDEX IF NOT EXISTS idx_matching_runs_status
        ON matching_runs(status);

      CREATE INDEX IF NOT EXISTS idx_negotiations_requirement
        ON negotiations(requirement_id);

      CREATE INDEX IF NOT EXISTS idx_negotiations_supplier
        ON negotiations(supplier_id);

      CREATE INDEX IF NOT EXISTS idx_negotiations_status
        ON negotiations(status);

      CREATE INDEX IF NOT EXISTS idx_negotiations_created
        ON negotiations(created_at);

      CREATE INDEX IF NOT EXISTS idx_messages_negotiation
        ON negotiation_messages(negotiation_id);

      CREATE INDEX IF NOT EXISTS idx_messages_status
        ON negotiation_messages(status);

      CREATE INDEX IF NOT EXISTS idx_messages_created
        ON negotiation_messages(created_at);

      CREATE INDEX IF NOT EXISTS idx_audit_events_entity
        ON audit_events(entity_type, entity_id);

      CREATE INDEX IF NOT EXISTS idx_audit_events_created
        ON audit_events(created_at);
    `;

    await this.pool.query(migrationSql);
  }

  get users() {
    return this.collections.users;
  }

  get requirements() {
    return this.collections.requirements;
  }

  get matchingRuns() {
    return this.collections.matchingRuns;
  }

  get approvals() {
    return this.collections.approvals;
  }

  get negotiations() {
    return this.collections.negotiations;
  }

  get messages() {
    return this.collections.messages;
  }

  get auditEvents() {
    return this.collections.auditEvents;
  }

  async logAudit({
    entityType,
    entityId,
    action,
    actor = 'system',
    details = {}
  }) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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

  async resetDevelopmentData() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[DB] Development reset is strictly prohibited in production mode');
    }
    await this.ready();
    await this.pool.query(`
      TRUNCATE TABLE requirements CASCADE;
      TRUNCATE TABLE matching_runs CASCADE;
      TRUNCATE TABLE approvals CASCADE;
      TRUNCATE TABLE negotiations CASCADE;
      TRUNCATE TABLE negotiation_messages CASCADE;
      TRUNCATE TABLE audit_events CASCADE;
    `);
    console.log('[DB] Development tables successfully truncated (suppliers.json preserved)');
    return {
      requirements: 0,
      matchingRuns: 0,
      approvals: 0,
      negotiations: 0,
      messages: 0,
      auditEvents: 0,
      suppliers: 20
    };
  }
}

const db = new DurableDatabase();

export default db;
