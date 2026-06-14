# Price Analysis and Alert Service Implementation Plan (Phase 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement price trend analysis and intelligent alert service that transforms collected price snapshot data into valuable insights and timely notifications.

**Architecture:** Build on existing Express + TypeScript + SQLite stack. Add PriceAnalysisService for statistics calculation, AlertRuleService for rule management, and AlertTriggerService for rule evaluation. Integrate with ScraperService to auto-trigger alerts after each scrape.

**Tech Stack:** Node.js 18+, TypeScript, Express, SQLite, Drizzle ORM, Vitest

---

## File Structure

**New Files:**
- `backend/src/db/migrations/001_add_alert_rules.sql` - Add alert_rules table
- `backend/src/services/priceAnalysisService.ts` - Price statistics and trend analysis
- `backend/src/services/alertRuleService.ts` - Alert rule CRUD operations
- `backend/src/services/alertTriggerService.ts` - Rule evaluation and alert generation
- `backend/src/routes/alertRules.ts` - Alert rule API endpoints
- `backend/src/routes/analysis.ts` - Price analysis API endpoints
- `backend/tests/priceAnalysisService.test.ts` - Unit tests
- `backend/tests/alertRuleService.test.ts` - Unit tests
- `backend/tests/alertTriggerService.test.ts` - Unit tests
- `backend/tests/alertRules.api.test.ts` - API integration tests
- `backend/tests/analysis.api.test.ts` - API integration tests

**Modified Files:**
- `backend/src/db/schema.ts` - Add alert_rules table definition
- `backend/src/types/index.ts` - Add new types
- `backend/src/routes/index.ts` - Register new routes
- `backend/src/services/scraperService.ts` - Integrate alert trigger

---

## Task 1: Add Alert Rules Schema

**Files:**
- Modify: `backend/src/db/schema.ts`
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: Add alert_rules table to schema**

In `backend/src/db/schema.ts`, add after alerts table:

```typescript
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
```

- [ ] **Step 2: Add types to types/index.ts**

In `backend/src/types/index.ts`, add after Alert interface:

```typescript
export interface AlertRule {
  id: string;
  productId: string;
  ruleType: 'price_threshold' | 'price_change_percent' | 'stock_change';
  condition: 'below' | 'above' | 'increase' | 'decrease';
  threshold: number;
  enabled: boolean;
  severity: Severity;
  createdAt: number;
  updatedAt?: number;
}

export interface PriceStats {
  productId: string;
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataPoints: number;
  firstRecordedAt: number;
  lastRecordedAt: number;
}
```

- [ ] **Step 3: Run database migration**

```bash
cd backend
npm run db:push
```

Expected: Schema updated successfully

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/types/index.ts
git commit -m "feat: add alert rules schema and types"
```

---

## Task 2: Create PriceAnalysisService Tests

**Files:**
- Create: `backend/tests/priceAnalysisService.test.ts`

- [ ] **Step 1: Create test file**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PriceAnalysisService } from '../src/services/priceAnalysisService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('PriceAnalysisService', () => {
  const analysisService = new PriceAnalysisService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/ANALYSIS_TEST',
      asin: 'ANALYSIS_TEST',
      title: 'Analysis Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
  });
});
```

// __CONTINUE_HERE__
