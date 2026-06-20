#!/usr/bin/env node

/**
 * 执行数据库迁移脚本
 * 用于 Chat UI Redesign 项目
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/ecommerce.db');
const migrationPath = path.resolve(__dirname, '../migrations/001-chat-redesign.sql');

console.log('🔧 开始执行数据库迁移...\n');
console.log(`📁 数据库路径: ${dbPath}`);
console.log(`📄 迁移脚本: ${migrationPath}\n`);

function runMigration() {
  let db;

  try {
    // 1. 打开数据库连接
    db = new Database(dbPath);

    console.log('✅ 数据库连接成功\n');

    // 2. 读取迁移脚本
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // 3. 执行迁移脚本
    db.exec(migrationSQL);

    console.log('✅ 迁移脚本执行成功\n');

    // 4. 验证迁移结果
    console.log('📊 验证迁移结果:\n');

    // 4.1 检查 chat_sessions 新增字段
    const sessionFields = db.prepare(`PRAGMA table_info(chat_sessions)`).all();
    const newFields = sessionFields.filter(f =>
      ['is_pinned', 'tags', 'last_message_preview', 'unread_count'].includes(f.name)
    );
    console.log(`✓ chat_sessions 新增字段: ${newFields.length}/4`);
    newFields.forEach(f => console.log(`  - ${f.name} (${f.type})`));
    console.log();

    // 4.2 检查 task_overviews 表
    const taskFields = db.prepare(`PRAGMA table_info(task_overviews)`).all();
    console.log(`✓ task_overviews 表字段: ${taskFields.length}`);
    taskFields.forEach(f => console.log(`  - ${f.name} (${f.type})`));
    console.log();

    // 4.3 检查索引
    const indexes = db.prepare(`
      SELECT name, tbl_name
      FROM sqlite_master
      WHERE type = 'index'
      AND name IN ('idx_sessions_pinned_updated', 'idx_tasks_session', 'idx_tasks_status')
    `).all();
    console.log(`✓ 新增索引: ${indexes.length}/3`);
    indexes.forEach(idx => console.log(`  - ${idx.name} on ${idx.tbl_name}`));
    console.log();

    // 4.4 测试外键约束
    console.log('🧪 测试数据库约束...\n');

    // 测试会话插入
    const testSessionId = `test_session_${Date.now()}`;
    db.prepare(`
      INSERT INTO chat_sessions (id, title, created_at, updated_at, is_pinned, unread_count)
      VALUES (?, '测试会话', ?, ?, 0, 0)
    `).run(testSessionId, Date.now(), Date.now());
    console.log('✓ 会话插入测试通过');

    // 测试任务插入
    const testTaskId = `test_task_${Date.now()}`;
    db.prepare(`
      INSERT INTO task_overviews (
        id, session_id, task_name, status, start_time, created_at, updated_at
      ) VALUES (?, ?, '测试任务', 'pending', ?, ?, ?)
    `).run(testTaskId, testSessionId, Date.now(), Date.now(), Date.now());
    console.log('✓ 任务插入测试通过');

    // 测试级联删除
    db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(testSessionId);
    const remainingTasks = db.prepare(
      'SELECT COUNT(*) as count FROM task_overviews WHERE id = ?'
    ).get(testTaskId);
    if (remainingTasks.count === 0) {
      console.log('✓ 级联删除测试通过（任务随会话删除）');
    } else {
      console.log('✗ 级联删除测试失败');
    }

    console.log('\n✅ 所有验证通过！\n');
    console.log('🎉 数据库迁移完成！');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error('堆栈:', error.stack);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

runMigration();
