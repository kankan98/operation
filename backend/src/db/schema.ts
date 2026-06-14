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
  tokensUsed: integer('tokens_used'),
  timestamp: integer('timestamp').notNull(),
});
