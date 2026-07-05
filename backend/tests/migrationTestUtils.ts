import fs from 'fs';
import path from 'path';

type SqliteDatabase = {
  exec(sql: string): unknown;
  pragma(sql: string): unknown;
};

const OPPORTUNITY_RESEARCH_TRACE_MIGRATION = 'drizzle/0006_lively_magneto.sql';
const ADD_COLUMN_PATTERN = /ADD `([^`]+)`/;

export function applyOpportunityResearchTraceRuntimeMigration(
  sqlite: SqliteDatabase
) {
  const columns = sqlite.pragma(
    'table_info(opportunity_research_entries)'
  ) as Array<{ name: string }>;
  const existingColumns = new Set(columns.map((column) => column.name));
  const migration = fs.readFileSync(
    path.resolve(OPPORTUNITY_RESEARCH_TRACE_MIGRATION),
    'utf-8'
  );

  for (const statement of migration
    .split('--> statement-breakpoint')
    .map((part) => part.trim())
    .filter(Boolean)) {
    const columnName = ADD_COLUMN_PATTERN.exec(statement)?.[1];
    if (columnName && existingColumns.has(columnName)) {
      continue;
    }
    sqlite.exec(statement);
    if (columnName) {
      existingColumns.add(columnName);
    }
  }
}
