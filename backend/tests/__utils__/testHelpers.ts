import { Database } from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import SQLite from 'better-sqlite3';
import * as schema from '../../src/db/schema';

/**
 * Creates an in-memory SQLite database for testing.
 * Each test should create its own isolated database instance.
 */
export function createTestDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new SQLite(':memory:');
  const db = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      product_url TEXT NOT NULL UNIQUE,
      asin TEXT,
      title TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      image_url TEXT,
      current_price REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      is_monitoring INTEGER NOT NULL DEFAULT 0,
      monitor_type TEXT,
      check_interval INTEGER NOT NULL DEFAULT 24,
      user_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      last_checked_at INTEGER,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS product_business_signals (
      product_id TEXT PRIMARY KEY,
      currency TEXT NOT NULL,
      cost_basis REAL,
      inbound_shipping REAL,
      outbound_shipping REAL,
      fulfillment_fee REAL,
      platform_fee REAL,
      referral_fee_rate REAL CHECK(referral_fee_rate IS NULL OR (referral_fee_rate >= 0 AND referral_fee_rate <= 1)),
      advertising_cost REAL,
      tax_customs_buffer REAL,
      target_sell_price REAL,
      target_units INTEGER CHECK(target_units IS NULL OR target_units >= 0),
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_product_business_signals_updated_at
    ON product_business_signals(updated_at DESC);

    CREATE TABLE IF NOT EXISTS price_snapshots (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      availability TEXT NOT NULL,
      rating REAL,
      review_count INTEGER,
      sales_rank INTEGER,
      shipping_cost REAL,
      seller TEXT,
      condition TEXT,
      timestamp INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      status TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      next_run_at INTEGER NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      last_attempt_id TEXT,
      last_failure_reason TEXT,
      lease_owner TEXT,
      lease_expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      metadata TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status_next_run
    ON scrape_jobs(status, next_run_at);

    CREATE INDEX IF NOT EXISTS idx_scrape_jobs_product_active
    ON scrape_jobs(product_id, status);

    CREATE TABLE IF NOT EXISTS scrape_attempts (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      product_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      error_message TEXT,
      duration_ms INTEGER NOT NULL,
      confidence REAL,
      http_status INTEGER,
      page_title TEXT,
      final_url TEXT,
      diagnostics TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES scrape_jobs(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scrape_attempts_product_timestamp
    ON scrape_attempts(product_id, timestamp DESC);

    CREATE INDEX IF NOT EXISTS idx_scrape_attempts_job
    ON scrape_attempts(job_id);

    CREATE TABLE IF NOT EXISTS acquisition_queue_workers (
      worker_id TEXT PRIMARY KEY,
      backend TEXT NOT NULL,
      status TEXT NOT NULL,
      concurrency INTEGER NOT NULL,
      active_job_count INTEGER NOT NULL DEFAULT 0,
      queues_json TEXT NOT NULL DEFAULT '[]',
      started_at INTEGER NOT NULL,
      last_heartbeat_at INTEGER NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS acquisition_provider_limits (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      reset_at INTEGER,
      current_concurrency INTEGER NOT NULL DEFAULT 0,
      max_concurrency INTEGER NOT NULL DEFAULT 1,
      active_count INTEGER NOT NULL DEFAULT 0,
      recent_root_causes_json TEXT NOT NULL DEFAULT '[]',
      recommendations_json TEXT NOT NULL DEFAULT '[]',
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(platform, provider)
    );

    CREATE TABLE IF NOT EXISTS acquisition_queue_events (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      product_id TEXT,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      worker_id TEXT,
      platform TEXT,
      provider TEXT,
      message TEXT,
      metadata TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES scrape_jobs(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      rule_id TEXT,
      product_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      data_snapshot TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      notified_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      condition TEXT NOT NULL,
      threshold REAL NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      severity TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  return db;
}

/**
 * Cleans up a test database by closing the connection.
 */
export function cleanupTestDb(db: BetterSQLite3Database<typeof schema>): void {
  // Get the underlying SQLite instance and close it
  const sqlite = (db as any).session.client as Database;
  sqlite.close();
}

/**
 * Waits for a specified amount of time (useful for async tests).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock Express request object for testing.
 */
export function createMockRequest(overrides: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
} = {}): any {
  return {
    params: overrides.params || {},
    query: overrides.query || {},
    body: overrides.body || {},
    headers: overrides.headers || {},
  };
}

/**
 * Creates a mock Express response object for testing.
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.data = data;
      return res;
    },
    send(data: any) {
      res.data = data;
      return res;
    },
  };
  return res;
}

/**
 * Creates a mock Express next function for testing middleware.
 */
export function createMockNext(): any {
  return vi.fn();
}

/**
 * Asserts that a value is defined (not null or undefined).
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Generates a timestamp N days ago from now.
 */
export function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Generates a timestamp N hours ago from now.
 */
export function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}
