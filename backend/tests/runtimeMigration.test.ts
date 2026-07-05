import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, describe, expect, it } from 'vitest';

describe('Runtime Drizzle migrations', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('should bootstrap all runtime tables and research trace columns when database is empty', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'aiops-migration-'));
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, 'fresh.db'));

    try {
      migrate(drizzle(sqlite), { migrationsFolder: path.resolve('drizzle') });

      const tableNames = sqlite
        .prepare(
          "select name from sqlite_master where type = 'table' order by name"
        )
        .all()
        .map((row) => (row as { name: string }).name);

      expect(tableNames).toEqual(
        expect.arrayContaining([
          'products',
          'product_business_signals',
          'opportunity_research_entries',
          'acquisition_queue_workers',
          'acquisition_provider_limits',
          'acquisition_queue_events',
          'market_signal_snapshots',
          'market_signal_attempts',
          'scrape_jobs',
          'scrape_attempts',
          'alerts',
          'alert_rules',
          'chat_sessions',
          'chat_messages',
          'task_overviews',
        ])
      );

      const researchColumns = sqlite
        .prepare('pragma table_info(opportunity_research_entries)')
        .all()
        .map((row) => (row as { name: string }).name);

      expect(researchColumns).toEqual(
        expect.arrayContaining([
          'decision_status',
          'decision_reason',
          'decision_next_action',
          'decision_snapshot_json',
          'decided_at',
          'decision_updated_at',
          'last_action_id',
          'last_action_outcome',
          'last_action_completed_at',
          'last_action_updated_at',
        ])
      );
    } finally {
      sqlite.close();
    }
  });
});
