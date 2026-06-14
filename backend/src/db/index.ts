import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';

const sqlite = new Database(config.databasePath);
export const db = drizzle(sqlite, { schema });
