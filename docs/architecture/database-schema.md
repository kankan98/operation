# 数据库设计

> **TL;DR**: SQLite + Drizzle ORM。主表：products（产品）、price_snapshots（价格快照）、alerts（警报）、alert_rules（规则）、chat_sessions/messages（聊天）。外键关联，索引优化查询。使用 Unix timestamp 存储时间，价格存储为分（cents）。

---

## 数据库选型

### SQLite

**选择原因**：
- ✅ 零配置，单文件存储
- ✅ 轻量级，适合中小规模应用
- ✅ ACID 事务支持
- ✅ 成熟稳定
- ❌ 并发写入受限

详见 [技术选型决策](./tech-stack-decisions.md)

---

## ER 图

```
┌─────────────┐
│  products   │ 1───────┐
│             │         │
│ id          │         │ N
│ platform    │         ▼
│ asin        │   ┌─────────────────┐
│ title       │   │ price_snapshots │
│ price       │   │                 │
│ created_at  │   │ id              │
└─────────────┘   │ product_id (FK) │
       │          │ price           │
       │          │ captured_at     │
       │          └─────────────────┘
       │
       │ 1
       │
       │ N
       ▼
┌─────────────────┐
│  alert_rules    │ 1───────┐
│                 │         │
│ id              │         │ N
│ product_id (FK) │         ▼
│ type            │   ┌──────────┐
│ threshold       │   │  alerts  │
│ priority        │   │          │
└─────────────────┘   │ id       │
                      │ rule_id  │
                      │ message  │
                      │ triggered_at │
                      └──────────┘

┌──────────────────┐
│  chat_sessions   │ 1───────┐
│                  │         │
│ id               │         │ N
│ title            │         ▼
│ created_at       │   ┌────────────────┐
└──────────────────┘   │ chat_messages  │
                       │                │
                       │ id             │
                       │ session_id (FK)│
                       │ role           │
                       │ content        │
                       │ created_at     │
                       └────────────────┘
```

---

## 表结构详解

### products（产品）

存储监控的电商产品信息。

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,                    -- UUID
  platform TEXT NOT NULL,                 -- 'amazon' | 'walmart' | 'ebay' | 'aliexpress'
  asin TEXT NOT NULL UNIQUE,              -- 产品唯一标识（ASIN/SKU）
  product_url TEXT NOT NULL,              -- 产品页面 URL
  title TEXT NOT NULL,                    -- 产品标题
  price INTEGER NOT NULL,                 -- 价格（分/cents）
  currency TEXT NOT NULL,                 -- 货币代码（USD/EUR/CNY）
  image_url TEXT,                         -- 产品图片 URL
  category TEXT,                          -- 产品分类
  is_monitoring INTEGER DEFAULT 1,        -- 是否正在监控（0/1 布尔值）
  check_interval INTEGER DEFAULT 3600,    -- 检查间隔（秒）
  created_at INTEGER NOT NULL,            -- 创建时间（Unix timestamp）
  updated_at INTEGER NOT NULL             -- 更新时间（Unix timestamp）
);

-- 索引
CREATE INDEX platform_idx ON products(platform);
CREATE INDEX asin_idx ON products(asin);
CREATE INDEX created_at_idx ON products(created_at);
CREATE INDEX is_monitoring_idx ON products(is_monitoring);
```

**设计说明**：
- **id**: UUID 作为主键，便于分布式环境
- **price**: 存储为整数（分），避免浮点精度问题
- **is_monitoring**: SQLite 无布尔类型，用 INTEGER（0/1）
- **时间戳**: Unix timestamp（毫秒），便于排序和计算

### price_snapshots（价格快照）

记录产品的历史价格变化。

```sql
CREATE TABLE price_snapshots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,               -- 关联 products.id
  price INTEGER NOT NULL,                 -- 价格（分/cents）
  stock_status TEXT,                      -- 库存状态
  captured_at INTEGER NOT NULL,           -- 抓取时间
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX product_id_idx ON price_snapshots(product_id);
CREATE INDEX captured_at_idx ON price_snapshots(captured_at);
CREATE INDEX product_captured_idx ON price_snapshots(product_id, captured_at);
```

**设计说明**：
- **外键级联删除**: 产品删除时自动删除相关快照
- **复合索引**: `(product_id, captured_at)` 优化时间序列查询
- **保留历史**: 不更新已有快照，只添加新记录

**常见查询**：

```typescript
// 查询产品的价格历史
const snapshots = await db.select()
  .from(priceSnapshots)
  .where(eq(priceSnapshots.productId, productId))
  .orderBy(desc(priceSnapshots.capturedAt))
  .limit(100);

// 查询价格变化
const priceChanges = await db.select({
  capturedAt: priceSnapshots.capturedAt,
  price: priceSnapshots.price,
  change: sql`price - LAG(price) OVER (ORDER BY captured_at)`,
})
  .from(priceSnapshots)
  .where(eq(priceSnapshots.productId, productId));
```

### alert_rules（警报规则）

定义产品的警报触发条件。

```sql
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,                     -- 'price_threshold' | 'price_drop' | 'stock_change'
  threshold REAL,                         -- 阈值（价格或百分比）
  priority TEXT NOT NULL,                 -- 'low' | 'medium' | 'high' | 'critical'
  is_active INTEGER DEFAULT 1,            -- 是否激活
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX product_id_idx ON alert_rules(product_id);
CREATE INDEX is_active_idx ON alert_rules(is_active);
```

**警报类型**：

| type | 说明 | threshold 含义 |
|------|------|---------------|
| `price_threshold` | 价格低于阈值 | 目标价格（分） |
| `price_drop` | 价格下降百分比 | 下降百分比（如 0.1 = 10%） |
| `price_increase` | 价格上涨百分比 | 上涨百分比 |
| `stock_change` | 库存变化 | 无 |

### alerts（警报历史）

记录已触发的警报。

```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  product_id TEXT NOT NULL,               -- 冗余字段，便于查询
  message TEXT NOT NULL,                  -- 警报消息
  triggered_at INTEGER NOT NULL,
  acknowledged INTEGER DEFAULT 0,         -- 是否已确认
  acknowledged_at INTEGER,
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX rule_id_idx ON alerts(rule_id);
CREATE INDEX triggered_at_idx ON alerts(triggered_at);
CREATE INDEX product_id_idx ON alerts(product_id);
```

**设计说明**：
- **product_id 冗余**: 虽然可以通过 rule_id JOIN 获取，但冗余可提升查询性能
- **acknowledged**: 用户确认后标记，避免重复通知

### chat_sessions（聊天会话）

存储 AI 聊天会话。

```sql
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,                    -- 会话标题
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX created_at_idx ON chat_sessions(created_at);
```

### chat_messages（聊天消息）

存储会话中的消息。

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,                     -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,                  -- 消息内容
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX session_id_idx ON chat_messages(session_id);
CREATE INDEX created_at_idx ON chat_messages(created_at);
CREATE INDEX session_created_idx ON chat_messages(session_id, created_at);
```

---

## 索引策略

### 何时添加索引

✅ **应该添加索引**：
- 主键（自动索引）
- 外键
- WHERE 条件中的字段
- ORDER BY 排序字段
- JOIN 连接字段
- 频繁查询的字段

❌ **避免过度索引**：
- 很少查询的字段
- 频繁更新的字段
- 小表（< 1000 行）

### 复合索引

```sql
-- ✅ 好 - 覆盖常见查询
CREATE INDEX product_captured_idx ON price_snapshots(product_id, captured_at);

-- 查询受益：
SELECT * FROM price_snapshots 
WHERE product_id = ? AND captured_at > ?
ORDER BY captured_at DESC;
```

### 索引维护

```sql
-- 分析表统计信息（提升查询优化）
ANALYZE;

-- 检查索引使用情况
EXPLAIN QUERY PLAN
SELECT * FROM products WHERE platform = 'amazon';
```

---

## 数据类型约定

### SQLite 类型映射

| 逻辑类型 | SQLite 类型 | Drizzle | 说明 |
|---------|-------------|---------|------|
| ID | TEXT | `text().primaryKey()` | UUID 字符串 |
| 布尔 | INTEGER | `integer({ mode: 'boolean' })` | 0/1 |
| 时间戳 | INTEGER | `integer()` | Unix timestamp（毫秒） |
| 价格 | INTEGER | `integer()` | 存储为分（cents） |
| 枚举 | TEXT | `text()` | 字符串字面量 |

### 价格存储

```typescript
// ✅ 正确 - 存储为分
const priceInCents = 9999;  // $99.99
await db.insert(products).values({
  price: priceInCents,
});

// 显示时转换
const displayPrice = priceInCents / 100; // 99.99

// ❌ 错误 - 直接存储浮点数
const price = 99.99; // 可能有精度问题
```

### 时间戳存储

```typescript
// ✅ 正确 - Unix timestamp（毫秒）
const createdAt = Date.now(); // 1718363130000

// 显示时转换
const date = new Date(createdAt);
const formatted = date.toISOString(); // "2024-06-14T13:45:30.000Z"
```

---

## Drizzle ORM Schema

### Schema 定义

```typescript
// db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  asin: text('asin').notNull(),
  productUrl: text('product_url').notNull(),
  title: text('title').notNull(),
  price: integer('price').notNull(),
  currency: text('currency').notNull(),
  isMonitoring: integer('is_monitoring', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  platformIdx: index('platform_idx').on(table.platform),
  asinIdx: index('asin_idx').on(table.asin),
}));

export const priceSnapshots = sqliteTable('price_snapshots', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  price: integer('price').notNull(),
  capturedAt: integer('captured_at').notNull(),
}, (table) => ({
  productIdIdx: index('product_id_idx').on(table.productId),
  capturedAtIdx: index('captured_at_idx').on(table.capturedAt),
}));

// 导出类型
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

### 关系定义

```typescript
// db/relations.ts
import { relations } from 'drizzle-orm';
import { products, priceSnapshots, alertRules } from './schema';

export const productsRelations = relations(products, ({ many }) => ({
  snapshots: many(priceSnapshots),
  alertRules: many(alertRules),
}));

export const priceSnapshotsRelations = relations(priceSnapshots, ({ one }) => ({
  product: one(products, {
    fields: [priceSnapshots.productId],
    references: [products.id],
  }),
}));
```

---

## 迁移管理

### 生成迁移

```bash
# 修改 schema.ts 后生成迁移
npm run db:generate
```

### 运行迁移

```bash
# 应用迁移到数据库
npm run db:migrate
```

### 迁移文件示例

```sql
-- db/migrations/0001_create_products.sql
CREATE TABLE `products` (
  `id` text PRIMARY KEY NOT NULL,
  `platform` text NOT NULL,
  `asin` text NOT NULL,
  `title` text NOT NULL,
  `price` integer NOT NULL,
  `created_at` integer NOT NULL
);

CREATE INDEX `platform_idx` ON `products` (`platform`);
CREATE INDEX `asin_idx` ON `products` (`asin`);
```

---

## 数据完整性

### 外键约束

```sql
-- 启用外键约束（SQLite 默认关闭）
PRAGMA foreign_keys = ON;
```

在 Drizzle 中自动启用：

```typescript
import Database from 'better-sqlite3';
const sqlite = new Database('./data/ecommerce.db');
sqlite.pragma('foreign_keys = ON');
```

### 唯一约束

```typescript
export const products = sqliteTable('products', {
  // ...
  asin: text('asin').notNull().unique(), // UNIQUE 约束
});
```

---

## 性能优化

### 1. 使用事务

```typescript
await db.transaction(async (tx) => {
  await tx.insert(products).values(product);
  await tx.insert(priceSnapshots).values(snapshot);
});
```

### 2. 批量插入

```typescript
// ✅ 好 - 批量插入
await db.insert(priceSnapshots).values([
  { id: '1', productId: 'p1', price: 9999, capturedAt: Date.now() },
  { id: '2', productId: 'p2', price: 8888, capturedAt: Date.now() },
]);

// ❌ 差 - 循环插入
for (const snapshot of snapshots) {
  await db.insert(priceSnapshots).values(snapshot);
}
```

### 3. 只查询需要的字段

```typescript
// ✅ 好
const products = await db.select({
  id: products.id,
  title: products.title,
  price: products.price,
}).from(products);

// ❌ 差
const products = await db.select().from(products); // 返回所有字段
```

---

## 参考资源

- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [后端架构](./backend-architecture.md)
- [性能标准](../quality/performance-standards.md)

