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

// Product business signals table
export const productBusinessSignals = sqliteTable('product_business_signals', {
  productId: text('product_id')
    .primaryKey()
    .references(() => products.id, { onDelete: 'cascade' }),
  currency: text('currency').notNull(),
  costBasis: real('cost_basis'),
  inboundShipping: real('inbound_shipping'),
  outboundShipping: real('outbound_shipping'),
  fulfillmentFee: real('fulfillment_fee'),
  platformFee: real('platform_fee'),
  referralFeeRate: real('referral_fee_rate'),
  advertisingCost: real('advertising_cost'),
  taxCustomsBuffer: real('tax_customs_buffer'),
  targetSellPrice: real('target_sell_price'),
  targetUnits: integer('target_units'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Opportunity research workspace entries table
export const opportunityResearchEntries = sqliteTable('opportunity_research_entries', {
  productId: text('product_id')
    .primaryKey()
    .references(() => products.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('researching'),
  priority: text('priority').notNull().default('medium'),
  tagsJson: text('tags_json').notNull().default('[]'),
  notes: text('notes'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
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
  source: text('source').notNull().default('unknown'),
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

// Acquisition worker heartbeat table
export const acquisitionQueueWorkers = sqliteTable('acquisition_queue_workers', {
  workerId: text('worker_id').primaryKey(),
  backend: text('backend').notNull(),
  status: text('status').notNull(),
  concurrency: integer('concurrency').notNull(),
  activeJobCount: integer('active_job_count').notNull().default(0),
  queuesJson: text('queues_json').notNull().default('[]'),
  startedAt: integer('started_at').notNull(),
  lastHeartbeatAt: integer('last_heartbeat_at').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Acquisition provider gate and queue limit state table
export const acquisitionProviderLimits = sqliteTable('acquisition_provider_limits', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  resetAt: integer('reset_at'),
  currentConcurrency: integer('current_concurrency').notNull().default(0),
  maxConcurrency: integer('max_concurrency').notNull().default(1),
  activeCount: integer('active_count').notNull().default(0),
  recentRootCausesJson: text('recent_root_causes_json').notNull().default('[]'),
  recommendationsJson: text('recommendations_json').notNull().default('[]'),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Bounded operational audit events for queue controls and worker decisions.
export const acquisitionQueueEvents = sqliteTable('acquisition_queue_events', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => scrapeJobs.id),
  productId: text('product_id').references(() => products.id),
  action: text('action').notNull(),
  status: text('status').notNull(),
  workerId: text('worker_id'),
  platform: text('platform'),
  provider: text('provider'),
  message: text('message'),
  metadata: text('metadata'),
  timestamp: integer('timestamp').notNull(),
});

// Market signal snapshots table
export const marketSignalSnapshots = sqliteTable('market_signal_snapshots', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  platform: text('platform').notNull(),
  provider: text('provider').notNull(),
  source: text('source').notNull(),
  asin: text('asin').notNull(),
  marketplace: text('marketplace').notNull(),
  windowDays: integer('window_days').notNull(),
  confidence: real('confidence').notNull(),
  freshnessMs: integer('freshness_ms'),
  priceTrend: text('price_trend'),
  salesRankTrend: text('sales_rank_trend'),
  reviewVelocity: real('review_velocity'),
  ratingMovement: real('rating_movement'),
  missingSignals: text('missing_signals').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
});

// Market signal provider attempts table
export const marketSignalAttempts = sqliteTable('market_signal_attempts', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  provider: text('provider').notNull(),
  source: text('source').notNull(),
  platform: text('platform').notNull(),
  status: text('status').notNull(),
  failureReason: text('failure_reason'),
  rootCause: text('root_cause'),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms').notNull(),
  confidence: real('confidence'),
  httpStatus: integer('http_status'),
  diagnostics: text('diagnostics'),
  snapshotId: text('snapshot_id').references(() => marketSignalSnapshots.id),
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
