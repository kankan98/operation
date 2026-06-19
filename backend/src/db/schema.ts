import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  productUrl: text('product_url').notNull().unique(),
  asin: text('asin'),
  title: text('title').notNull(),
  brand: text('brand'),
  category: text('category'),
  imageUrl: text('image_url'),
  currentPrice: real('current_price'),
  currency: text('currency').notNull().default('USD'),
  isMonitoring: integer('is_monitoring', { mode: 'boolean' }).notNull().default(false),
  monitorType: text('monitor_type'),
  checkInterval: integer('check_interval').notNull().default(24),
  userId: text('user_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at'),
  lastCheckedAt: integer('last_checked_at'),
  metadata: text('metadata'),
});

// Price snapshots table
export const priceSnapshots = sqliteTable('price_snapshots', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  price: real('price').notNull(),
  currency: text('currency').notNull(),
  availability: text('availability').notNull(),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  salesRank: integer('sales_rank'),
  shippingCost: real('shipping_cost'),
  seller: text('seller'),
  condition: text('condition'),
  timestamp: integer('timestamp').notNull(),
  metadata: text('metadata'),
});

// Scrape jobs table
export const scrapeJobs = sqliteTable('scrape_jobs', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  status: text('status').notNull(),
  priority: integer('priority').notNull().default(0),
  nextRunAt: integer('next_run_at').notNull(),
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  lastAttemptId: text('last_attempt_id'),
  lastFailureReason: text('last_failure_reason'),
  leaseOwner: text('lease_owner'),
  leaseExpiresAt: integer('lease_expires_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  completedAt: integer('completed_at'),
  metadata: text('metadata'),
});

// Scrape attempts table
export const scrapeAttempts = sqliteTable('scrape_attempts', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => scrapeJobs.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  provider: text('provider').notNull(),
  source: text('source').notNull(),
  status: text('status').notNull(),
  failureReason: text('failure_reason'),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms').notNull(),
  confidence: real('confidence'),
  httpStatus: integer('http_status'),
  pageTitle: text('page_title'),
  finalUrl: text('final_url'),
  diagnostics: text('diagnostics'),
  timestamp: integer('timestamp').notNull(),
});

// Alerts table
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  ruleId: text('rule_id'),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  dataSnapshot: text('data_snapshot'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  notifiedAt: integer('notified_at'),
  createdAt: integer('created_at').notNull(),
});

// Alert rules table
export const alertRules = sqliteTable('alert_rules', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  ruleType: text('rule_type').notNull(), // 'price_threshold', 'price_change_percent', 'stock_change'
  condition: text('condition').notNull(), // 'below', 'above', 'increase', 'decrease'
  threshold: real('threshold').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  severity: text('severity').notNull(), // 'info', 'warning', 'critical'
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at'),
});

// Chat sessions table
export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title'),
  userId: text('user_id'),
  contextSummary: text('context_summary'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at'),
  // Chat UI Redesign 新增字段
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags'), // JSON array
  lastMessagePreview: text('last_message_preview'),
  unreadCount: integer('unread_count').notNull().default(0),
});

// Chat messages table
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  toolCalls: text('tool_calls'), // JSON array of tool calls
  toolResults: text('tool_results'), // JSON array of tool results
  parts: text('parts'), // JSON 序列化的 MessagePart[]（按时序排列的 text/tool 内容块）
  tokensUsed: integer('tokens_used'),
  timestamp: integer('timestamp').notNull(),
});

// Task overviews table (Chat UI Redesign)
export const taskOverviews = sqliteTable('task_overviews', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  taskName: text('task_name').notNull(),
  status: text('status').notNull(), // 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time'),
  relatedProducts: text('related_products'), // JSON array of ASINs
  platform: text('platform'), // 'amazon' | 'shopify' | 'ebay' | 'walmart'
  metadata: text('metadata'), // JSON object
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
