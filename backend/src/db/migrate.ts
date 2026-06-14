import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';

const sqlite = new Database(config.databasePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
console.log('✅ Database migrated successfully');
