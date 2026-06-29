import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';

const sqlite = new Database(config.databasePath);
sqlite.pragma('foreign_keys = ON');

// Task 6.1: 移除重复的索引创建代码
// 索引已在 migration 008-products-query-optimization.sql 中定义
// 这是架构的单一真相源

export const db = drizzle(sqlite, { schema });
