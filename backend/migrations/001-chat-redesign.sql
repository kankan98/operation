-- ============================================================================
-- Chat UI Redesign v2 - 数据库迁移脚本
-- 迁移编号: 001-chat-redesign
-- 创建时间: 2026-06-17
-- 描述: 添加会话管理增强功能和任务概览系统
-- ============================================================================

-- 确保在事务中执行，支持原子性回滚
BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. 扩展 chat_sessions 表
-- 添加会话分组、置顶、标签等功能所需的字段
-- ----------------------------------------------------------------------------

-- 添加置顶标记
ALTER TABLE chat_sessions
ADD COLUMN is_pinned INTEGER DEFAULT 0 CHECK(is_pinned IN (0, 1));

-- 添加标签数组（存储为JSON字符串）
ALTER TABLE chat_sessions
ADD COLUMN tags TEXT;

-- 添加最后消息预览
ALTER TABLE chat_sessions
ADD COLUMN last_message_preview TEXT;

-- 添加未读消息计数
ALTER TABLE chat_sessions
ADD COLUMN unread_count INTEGER DEFAULT 0 CHECK(unread_count >= 0);

-- 创建复合索引：置顶状态 + 更新时间（用于会话列表排序）
CREATE INDEX IF NOT EXISTS idx_sessions_pinned_updated
ON chat_sessions(is_pinned DESC, updated_at DESC);

-- 添加注释说明
-- SQLite 不支持 COMMENT，但可以在迁移日志中记录：
-- is_pinned: 0=未置顶, 1=已置顶
-- tags: JSON数组字符串，如 ["重要","待办"]
-- last_message_preview: 最后一条消息的前100字符预览
-- unread_count: 未读消息数量

-- ----------------------------------------------------------------------------
-- 2. 创建 task_overviews 表
-- 用于存储任务概览信息，支持右侧任务面板显示
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS task_overviews (
  -- 主键
  id TEXT PRIMARY KEY,

  -- 外键：所属会话ID（级联删除）
  session_id TEXT NOT NULL,

  -- 任务基本信息
  task_name TEXT NOT NULL CHECK(length(task_name) <= 200),
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),

  -- 时间戳（毫秒）
  start_time INTEGER NOT NULL,
  end_time INTEGER,

  -- 关联信息（存储为JSON字符串）
  related_products TEXT,  -- JSON数组: ["B0D1234567", "B0D7654321"]
  platform TEXT,          -- 平台标识: amazon, shopify, ebay, walmart

  -- 扩展元数据（JSON对象）
  metadata TEXT,          -- 如: {"progress": 65, "currentStep": "数据收集"}

  -- 审计字段
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  -- 外键约束
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 创建索引：按会话ID和创建时间查询（用于任务列表）
CREATE INDEX IF NOT EXISTS idx_tasks_session
ON task_overviews(session_id, created_at DESC);

-- 创建索引：按状态和创建时间查询（用于过滤）
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON task_overviews(status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. 数据验证
-- 验证表结构是否正确创建
-- ----------------------------------------------------------------------------

-- 验证 chat_sessions 新增字段
SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✓ chat_sessions 扩展成功'
    ELSE '✗ chat_sessions 扩展失败'
  END as validation_result
FROM pragma_table_info('chat_sessions')
WHERE name IN ('is_pinned', 'tags', 'last_message_preview', 'unread_count');

-- 验证 task_overviews 表创建
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✓ task_overviews 创建成功'
    ELSE '✗ task_overviews 创建失败'
  END as validation_result
FROM sqlite_master
WHERE type = 'table' AND name = 'task_overviews';

-- 验证索引创建
SELECT
  CASE
    WHEN COUNT(*) = 3 THEN '✓ 所有索引创建成功'
    ELSE '✗ 索引创建不完整'
  END as validation_result
FROM sqlite_master
WHERE type = 'index'
AND name IN ('idx_sessions_pinned_updated', 'idx_tasks_session', 'idx_tasks_status');

-- ----------------------------------------------------------------------------
-- 4. 提交事务
-- ----------------------------------------------------------------------------

COMMIT;

-- ============================================================================
-- 迁移完成
-- ============================================================================

-- 执行后验证步骤：
-- 1. 检查 chat_sessions 表结构：PRAGMA table_info(chat_sessions);
-- 2. 检查 task_overviews 表结构：PRAGMA table_info(task_overviews);
-- 3. 检查所有索引：SELECT * FROM sqlite_master WHERE type = 'index';
-- 4. 测试插入数据以验证约束
