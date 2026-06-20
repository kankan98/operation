-- ============================================================================
-- Chat UI Redesign - 数据库回滚脚本
-- 迁移编号: 001-chat-redesign-rollback
-- 创建时间: 2026-06-17
-- 描述: 回滚迁移001-chat-redesign的所有变更
-- ============================================================================

-- 确保在事务中执行，支持原子性回滚
BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 警告：数据丢失提醒
-- ----------------------------------------------------------------------------

-- 执行此回滚脚本将会：
-- 1. 删除所有任务概览数据（task_overviews表）
-- 2. 删除会话的置顶、标签、预览等信息
-- 3. 删除相关索引

-- 建议：
-- 在执行回滚前，请确保已备份数据库！
-- 备份命令: sqlite3 your_database.db ".backup backup_before_rollback.db"

-- ----------------------------------------------------------------------------
-- 1. 删除 task_overviews 表及相关索引
-- ----------------------------------------------------------------------------

-- 删除索引
DROP INDEX IF EXISTS idx_tasks_session;
DROP INDEX IF EXISTS idx_tasks_status;

-- 删除表（包含所有任务数据）
DROP TABLE IF EXISTS task_overviews;

-- ----------------------------------------------------------------------------
-- 2. 回滚 chat_sessions 表扩展
-- SQLite 不支持 DROP COLUMN，需要采用重建表的方式
-- ----------------------------------------------------------------------------

-- Step 2.1: 创建临时表（保留原始字段）
CREATE TABLE chat_sessions_backup (
  id TEXT PRIMARY KEY,
  title TEXT,
  userId TEXT,
  messageCount INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER
);

-- Step 2.2: 复制原有数据（不包含新增字段）
INSERT INTO chat_sessions_backup (id, title, userId, messageCount, createdAt, updatedAt)
SELECT id, title, userId, messageCount, createdAt, updatedAt
FROM chat_sessions;

-- Step 2.3: 删除旧表
DROP TABLE chat_sessions;

-- Step 2.4: 重命名临时表为正式表
ALTER TABLE chat_sessions_backup RENAME TO chat_sessions;

-- Step 2.5: 删除新增的索引
DROP INDEX IF EXISTS idx_sessions_pinned_updated;

-- Step 2.6: 重建原有索引（如果有）
-- 根据项目原有设计，可能需要重建一些索引
-- 这里列出常见索引，根据实际情况调整：

-- 会话按更新时间排序的索引
CREATE INDEX IF NOT EXISTS idx_sessions_updated
ON chat_sessions(updatedAt DESC);

-- 会话按用户ID查询的索引
CREATE INDEX IF NOT EXISTS idx_sessions_user
ON chat_sessions(userId);

-- ----------------------------------------------------------------------------
-- 3. 数据验证
-- 验证回滚是否成功
-- ----------------------------------------------------------------------------

-- 验证 task_overviews 表已删除
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ task_overviews 表已删除'
    ELSE '✗ task_overviews 表仍存在'
  END as validation_result
FROM sqlite_master
WHERE type = 'table' AND name = 'task_overviews';

-- 验证 chat_sessions 表恢复到原始状态
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ chat_sessions 新字段已移除'
    ELSE '✗ chat_sessions 新字段仍存在'
  END as validation_result
FROM pragma_table_info('chat_sessions')
WHERE name IN ('is_pinned', 'tags', 'last_message_preview', 'unread_count');

-- 验证新增索引已删除
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ 新增索引已删除'
    ELSE '✗ 新增索引仍存在'
  END as validation_result
FROM sqlite_master
WHERE type = 'index'
AND name IN ('idx_sessions_pinned_updated', 'idx_tasks_session', 'idx_tasks_status');

-- ----------------------------------------------------------------------------
-- 4. 提交事务
-- ----------------------------------------------------------------------------

COMMIT;

-- ============================================================================
-- 回滚完成
-- ============================================================================

-- 执行后验证步骤：
-- 1. 检查 chat_sessions 表结构：PRAGMA table_info(chat_sessions);
-- 2. 确认 task_overviews 表不存在：SELECT * FROM task_overviews; (应报错)
-- 3. 检查所有索引：SELECT * FROM sqlite_master WHERE type = 'index';
-- 4. 验证会话数据完整性：SELECT COUNT(*) FROM chat_sessions;

-- 警告：
-- 回滚后丢失的数据包括：
-- - 所有任务概览记录
-- - 会话的置顶状态
-- - 会话的标签
-- - 会话的消息预览
-- - 会话的未读计数

-- 如果需要恢复这些数据，请从备份中恢复。
