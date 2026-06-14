# Price Snapshot Service Implementation Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现价格快照服务，记录产品价格历史，为价格分析和趋势预测提供数据基础。

**Architecture:** 基于 Phase 1 的基础架构，新增 PriceSnapshotService 服务层和相应 API 端点，使用现有的 price_snapshots 表存储历史数据。

**Tech Stack:** TypeScript, Express, Drizzle ORM, Vitest (继承 Phase 1)

---

## 前置条件

Phase 1 必须完成：
- ✅ 数据库表 `price_snapshots` 已定义
- ✅ ProductService 已实现  
- ✅ 基础测试框架已搭建

## 文件结构

```
backend/
├── src/
│   ├── services/
│   │   └── priceSnapshotService.ts    # 新增：价格快照服务
│   ├── routes/
│   │   └── priceSnapshots.ts          # 新增：价格快照路由
│   └── types/
│       └── index.ts                    # 扩展：添加价格快照类型
├── tests/
│   ├── priceSnapshotService.test.ts   # 新增：服务层测试
│   └── priceSnapshots.api.test.ts     # 新增：API 集成测试
```

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: 添加价格快照类型**

在 `src/types/index.ts` 文件末尾添加：

```typescript
export interface PriceSnapshot {
  id: string;
  productId: string;
  price: number;
  currency: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  timestamp: number;
  metadata?: string;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add price snapshot types"
```

---

## Task 2: 编写 PriceSnapshotService 单元测试

**Files:**
- Create: `backend/tests/priceSnapshotService.test.ts`

- [ ] **Step 1: 创建测试文件框架**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { ProductService } from '../src/services/productService';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('PriceSnapshotService', () => {
  const snapshotService = new PriceSnapshotService();
  const productService = new ProductService();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/SNAP_TEST',
      asin: 'SNAP_TEST',
      title: 'Snapshot Test Product',
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

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshotService.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 提交测试框架**

```bash
git add tests/priceSnapshotService.test.ts
git commit -m "test: add PriceSnapshotService test framework"
```

---


## Task 3: 添加 createSnapshot 测试用例

**Files:**
- Modify: `backend/tests/priceSnapshotService.test.ts`

- [ ] **Step 1: 添加 createSnapshot 测试**

在 `describe('PriceSnapshotService')` 块内添加：

```typescript
describe('createSnapshot', () => {
  it('should create a price snapshot', async () => {
    const snapshotData = {
      productId: testProductId,
      price: 99.99,
      currency: 'USD',
      availability: 'in_stock',
      rating: 4.5,
      reviewCount: 1234,
    };

    const snapshot = await snapshotService.createSnapshot(snapshotData);

    expect(snapshot.id).toBeDefined();
    expect(snapshot.price).toBe(99.99);
    expect(snapshot.productId).toBe(testProductId);
    expect(snapshot.timestamp).toBeDefined();
  });

  it('should create snapshot with all optional fields', async () => {
    const snapshotData = {
      productId: testProductId,
      price: 149.99,
      currency: 'USD',
      availability: 'in_stock',
      rating: 4.8,
      reviewCount: 5678,
      salesRank: 100,
      shippingCost: 5.99,
      seller: 'Amazon',
      condition: 'new',
      metadata: JSON.stringify({ source: 'test' }),
    };

    const snapshot = await snapshotService.createSnapshot(snapshotData);

    expect(snapshot.salesRank).toBe(100);
    expect(snapshot.shippingCost).toBe(5.99);
    expect(snapshot.seller).toBe('Amazon');
    expect(snapshot.condition).toBe('new');
    expect(snapshot.metadata).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshotService.test.ts
```

Expected: FAIL with "snapshotService.createSnapshot is not a function"

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshotService.test.ts
git commit -m "test: add createSnapshot test cases"
```

---


## Task 4: 实现 PriceSnapshotService - createSnapshot 方法

**Files:**
- Create: `backend/src/services/priceSnapshotService.ts`

- [ ] **Step 1: 创建服务文件**

```typescript
import { db } from '../db';
import { priceSnapshots } from '../db/schema';
import { PriceSnapshot } from '../types';
import { randomUUID } from 'crypto';

interface CreateSnapshotData {
  productId: string;
  price: number;
  currency: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  metadata?: string;
}

export class PriceSnapshotService {
  async createSnapshot(data: CreateSnapshotData): Promise<PriceSnapshot> {
    const id = randomUUID();
    const timestamp = Date.now();

    const [snapshot] = await db
      .insert(priceSnapshots)
      .values({
        id,
        ...data,
        timestamp,
      })
      .returning();

    return snapshot as PriceSnapshot;
  }
}
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test priceSnapshotService.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 3: 提交**

```bash
git add src/services/priceSnapshotService.ts
git commit -m "feat: implement createSnapshot method"
```

---


## Task 5: 添加查询快照测试用例

**Files:**
- Modify: `backend/tests/priceSnapshotService.test.ts`

- [ ] **Step 1: 添加 getSnapshotsByProduct 测试**

在 `describe('PriceSnapshotService')` 块内添加：

```typescript
describe('getSnapshotsByProduct', () => {
  beforeEach(async () => {
    // 创建多个快照
    await snapshotService.createSnapshot({
      productId: testProductId,
      price: 100,
      currency: 'USD',
      availability: 'in_stock',
    });

    await snapshotService.createSnapshot({
      productId: testProductId,
      price: 90,
      currency: 'USD',
      availability: 'in_stock',
    });

    await snapshotService.createSnapshot({
      productId: testProductId,
      price: 85,
      currency: 'USD',
      availability: 'in_stock',
    });
  });

  it('should return all snapshots for a product', async () => {
    const snapshots = await snapshotService.getSnapshotsByProduct(
      testProductId
    );

    expect(snapshots.length).toBe(3);
    expect(snapshots[0].productId).toBe(testProductId);
  });

  it('should return snapshots in descending order by timestamp', async () => {
    const snapshots = await snapshotService.getSnapshotsByProduct(
      testProductId
    );

    expect(snapshots[0].timestamp).toBeGreaterThanOrEqual(
      snapshots[1].timestamp
    );
    expect(snapshots[1].timestamp).toBeGreaterThanOrEqual(
      snapshots[2].timestamp
    );
  });

  it('should support limit parameter', async () => {
    const snapshots = await snapshotService.getSnapshotsByProduct(
      testProductId,
      { limit: 2 }
    );

    expect(snapshots.length).toBe(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshotService.test.ts
```

Expected: FAIL with "getSnapshotsByProduct is not a function"

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshotService.test.ts
git commit -m "test: add getSnapshotsByProduct test cases"
```

---


## Task 6: 实现 getSnapshotsByProduct 方法

**Files:**
- Modify: `backend/src/services/priceSnapshotService.ts`

- [ ] **Step 1: 添加查询方法**

在 `PriceSnapshotService` 类中添加：

```typescript
async getSnapshotsByProduct(
  productId: string,
  options: { limit?: number } = {}
): Promise<PriceSnapshot[]> {
  const { limit = 100 } = options;

  const snapshots = await db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.productId, productId))
    .orderBy(desc(priceSnapshots.timestamp))
    .limit(limit);

  return snapshots as PriceSnapshot[];
}
```

- [ ] **Step 2: 添加必要的导入**

在文件顶部添加：

```typescript
import { eq, desc } from 'drizzle-orm';
```

- [ ] **Step 3: 运行测试验证通过**

```bash
npm test priceSnapshotService.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 4: 提交**

```bash
git add src/services/priceSnapshotService.ts
git commit -m "feat: implement getSnapshotsByProduct method"
```

---


## Task 7: 添加获取最新快照测试用例

**Files:**
- Modify: `backend/tests/priceSnapshotService.test.ts`

- [ ] **Step 1: 添加 getLatestSnapshot 测试**

在 `describe('PriceSnapshotService')` 块内添加：

```typescript
describe('getLatestSnapshot', () => {
  it('should return the latest snapshot for a product', async () => {
    await snapshotService.createSnapshot({
      productId: testProductId,
      price: 100,
      currency: 'USD',
      availability: 'in_stock',
    });

    await snapshotService.createSnapshot({
      productId: testProductId,
      price: 90,
      currency: 'USD',
      availability: 'in_stock',
    });

    const latest = await snapshotService.getLatestSnapshot(testProductId);

    expect(latest).toBeDefined();
    expect(latest!.price).toBe(90);
  });

  it('should return null if no snapshots exist', async () => {
    const latest = await snapshotService.getLatestSnapshot('non-existent');

    expect(latest).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshotService.test.ts
```

Expected: FAIL with "getLatestSnapshot is not a function"

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshotService.test.ts
git commit -m "test: add getLatestSnapshot test cases"
```

---


## Task 8: 实现 getLatestSnapshot 方法

**Files:**
- Modify: `backend/src/services/priceSnapshotService.ts`

- [ ] **Step 1: 添加方法**

在 `PriceSnapshotService` 类中添加：

```typescript
async getLatestSnapshot(
  productId: string
): Promise<PriceSnapshot | null> {
  const [snapshot] = await db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.productId, productId))
    .orderBy(desc(priceSnapshots.timestamp))
    .limit(1);

  return snapshot ? (snapshot as PriceSnapshot) : null;
}
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test priceSnapshotService.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 3: 提交**

```bash
git add src/services/priceSnapshotService.ts
git commit -m "feat: implement getLatestSnapshot method"
```

---

## Task 9: 编写价格快照 API 集成测试

**Files:**
- Create: `backend/tests/priceSnapshots.api.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('Price Snapshots API', () => {
  const app = createApp();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const response = await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/SNAP_API_TEST',
      asin: 'SNAP_API_TEST',
      title: 'Snapshot API Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = response.body.id;
  });

  afterEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
  });
});
```

- [ ] **Step 2: 提交测试框架**

```bash
git add tests/priceSnapshots.api.test.ts
git commit -m "test: add price snapshots API test framework"
```

---


## Task 10: 添加 POST /api/price-snapshots 测试

**Files:**
- Modify: `backend/tests/priceSnapshots.api.test.ts`

- [ ] **Step 1: 添加创建快照测试**

在 `describe('Price Snapshots API')` 块内添加：

```typescript
describe('POST /api/price-snapshots', () => {
  it('should create a price snapshot', async () => {
    const snapshotData = {
      productId: testProductId,
      price: 99.99,
      currency: 'USD',
      availability: 'in_stock',
      rating: 4.5,
      reviewCount: 1234,
    };

    const response = await request(app)
      .post('/api/price-snapshots')
      .send(snapshotData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.price).toBe(99.99);
    expect(response.body.productId).toBe(testProductId);
  });

  it('should reject missing required fields', async () => {
    const response = await request(app)
      .post('/api/price-snapshots')
      .send({ price: 99.99 })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: FAIL with 404 (route not found)

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshots.api.test.ts
git commit -m "test: add POST /api/price-snapshots tests"
```

---


## Task 11: 实现价格快照路由 - POST 端点

**Files:**
- Create: `backend/src/routes/priceSnapshots.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { PriceSnapshotService } from '../services/priceSnapshotService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const snapshotService = new PriceSnapshotService();

// POST /api/price-snapshots - 创建价格快照
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      productId,
      price,
      currency,
      availability,
      rating,
      reviewCount,
      salesRank,
      shippingCost,
      seller,
      condition,
      metadata,
    } = req.body;

    // 验证必填字段
    if (!productId || price === undefined || !currency || !availability) {
      throw new AppError(
        400,
        'Missing required fields: productId, price, currency, availability',
        'VALIDATION_ERROR'
      );
    }

    const snapshot = await snapshotService.createSnapshot({
      productId,
      price,
      currency,
      availability,
      rating,
      reviewCount,
      salesRank,
      shippingCost,
      seller,
      condition,
      metadata,
    });

    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 2: 注册路由到 routes/index.ts**

在 `src/routes/index.ts` 中添加：

```typescript
import priceSnapshotsRouter from './priceSnapshots';

// 在现有路由后添加
router.use('/price-snapshots', priceSnapshotsRouter);
```

- [ ] **Step 3: 运行测试验证通过**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 4: 提交**

```bash
git add src/routes/priceSnapshots.ts src/routes/index.ts
git commit -m "feat: implement POST /api/price-snapshots endpoint"
```

---


## Task 12: 添加 GET /api/price-snapshots/product/:productId 测试

**Files:**
- Modify: `backend/tests/priceSnapshots.api.test.ts`

- [ ] **Step 1: 添加查询快照测试**

在 `describe('Price Snapshots API')` 块内添加：

```typescript
describe('GET /api/price-snapshots/product/:productId', () => {
  beforeEach(async () => {
    // 创建多个快照
    await request(app).post('/api/price-snapshots').send({
      productId: testProductId,
      price: 100,
      currency: 'USD',
      availability: 'in_stock',
    });

    await request(app).post('/api/price-snapshots').send({
      productId: testProductId,
      price: 90,
      currency: 'USD',
      availability: 'in_stock',
    });

    await request(app).post('/api/price-snapshots').send({
      productId: testProductId,
      price: 85,
      currency: 'USD',
      availability: 'in_stock',
    });
  });

  it('should return all snapshots for a product', async () => {
    const response = await request(app)
      .get(`/api/price-snapshots/product/${testProductId}`)
      .expect(200);

    expect(response.body.length).toBe(3);
    expect(response.body[0].productId).toBe(testProductId);
  });

  it('should return snapshots in descending order', async () => {
    const response = await request(app)
      .get(`/api/price-snapshots/product/${testProductId}`)
      .expect(200);

    expect(response.body[0].timestamp).toBeGreaterThanOrEqual(
      response.body[1].timestamp
    );
  });

  it('should support limit query parameter', async () => {
    const response = await request(app)
      .get(`/api/price-snapshots/product/${testProductId}?limit=2`)
      .expect(200);

    expect(response.body.length).toBe(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: FAIL with 404 (route not found)

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshots.api.test.ts
git commit -m "test: add GET /api/price-snapshots/product/:productId tests"
```

---


## Task 13: 实现 GET /api/price-snapshots/product/:productId

**Files:**
- Modify: `backend/src/routes/priceSnapshots.ts`

- [ ] **Step 1: 添加 GET 端点**

在 `router.post()` 后添加：

```typescript
// GET /api/price-snapshots/product/:productId - 查询产品的价格快照
router.get(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const snapshots = await snapshotService.getSnapshotsByProduct(
        productId,
        { limit: limit ? parseInt(limit as string) : undefined }
      );

      res.json(snapshots);
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 3: 提交**

```bash
git add src/routes/priceSnapshots.ts
git commit -m "feat: implement GET /api/price-snapshots/product/:productId"
```

---

## Task 14: 添加 GET /api/price-snapshots/product/:productId/latest 测试

**Files:**
- Modify: `backend/tests/priceSnapshots.api.test.ts`

- [ ] **Step 1: 添加获取最新快照测试**

在 `describe('Price Snapshots API')` 块内添加：

```typescript
describe('GET /api/price-snapshots/product/:productId/latest', () => {
  it('should return the latest snapshot', async () => {
    await request(app).post('/api/price-snapshots').send({
      productId: testProductId,
      price: 100,
      currency: 'USD',
      availability: 'in_stock',
    });

    await request(app).post('/api/price-snapshots').send({
      productId: testProductId,
      price: 90,
      currency: 'USD',
      availability: 'in_stock',
    });

    const response = await request(app)
      .get(`/api/price-snapshots/product/${testProductId}/latest`)
      .expect(200);

    expect(response.body.price).toBe(90);
  });

  it('should return 404 if no snapshots exist', async () => {
    await request(app)
      .get('/api/price-snapshots/product/non-existent/latest')
      .expect(404);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: FAIL with 404

- [ ] **Step 3: 提交**

```bash
git add tests/priceSnapshots.api.test.ts
git commit -m "test: add GET latest snapshot tests"
```

---


## Task 15: 实现 GET /api/price-snapshots/product/:productId/latest

**Files:**
- Modify: `backend/src/routes/priceSnapshots.ts`

- [ ] **Step 1: 添加 latest 端点**

在 `router.get('/product/:productId')` 后添加：

```typescript
// GET /api/price-snapshots/product/:productId/latest - 获取最新快照
router.get(
  '/product/:productId/latest',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;

      const snapshot = await snapshotService.getLatestSnapshot(productId);

      if (!snapshot) {
        throw new AppError(404, 'No snapshots found', 'NOT_FOUND');
      }

      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test priceSnapshots.api.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 3: 提交**

```bash
git add src/routes/priceSnapshots.ts
git commit -m "feat: implement GET latest snapshot endpoint"
```

---

## Task 16: 运行所有测试验证集成

**Files:**
- N/A

- [ ] **Step 1: 运行所有测试**

```bash
npm test
```

Expected: ALL PASS (包括新增的 7 个 priceSnapshots.api.test.ts 测试)

- [ ] **Step 2: 验证服务器启动**

```bash
npm run dev
```

Expected: Server starts successfully on port 3001

- [ ] **Step 3: 手动测试 API（可选）**

```bash
# 创建快照
curl -X POST http://localhost:3001/api/price-snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product-id>",
    "price": 99.99,
    "currency": "USD",
    "availability": "in_stock"
  }'

# 查询快照
curl http://localhost:3001/api/price-snapshots/product/<product-id>

# 获取最新快照
curl http://localhost:3001/api/price-snapshots/product/<product-id>/latest
```

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete price snapshot service (Phase 2)"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ 价格快照类型定义
- ✅ PriceSnapshotService 服务层
  - ✅ createSnapshot - 创建快照
  - ✅ getSnapshotsByProduct - 查询产品快照
  - ✅ getLatestSnapshot - 获取最新快照
- ✅ API 端点
  - ✅ POST /api/price-snapshots
  - ✅ GET /api/price-snapshots/product/:productId
  - ✅ GET /api/price-snapshots/product/:productId/latest
- ✅ 单元测试覆盖
- ✅ 集成测试覆盖

**Placeholder Scan:**
- ✅ 无 TBD/TODO
- ✅ 所有代码块完整
- ✅ 所有测试用例具体
- ✅ 所有命令带预期输出

**Type Consistency:**
- ✅ PriceSnapshot 接口在所有地方使用一致
- ✅ CreateSnapshotData 与 API 请求匹配
- ✅ 方法签名在测试和实现中一致

---


## Summary

**Phase 2 完成后将交付：**

1. **新服务层**
   - PriceSnapshotService - 价格快照管理服务
   - 3 个核心方法（创建、查询、获取最新）

2. **新 API 端点**
   - POST /api/price-snapshots - 创建价格快照
   - GET /api/price-snapshots/product/:productId - 查询产品快照历史
   - GET /api/price-snapshots/product/:productId/latest - 获取最新快照

3. **测试覆盖**
   - 7 个服务层单元测试
   - 7 个 API 集成测试
   - 100% 测试通过率

4. **类型定义**
   - PriceSnapshot 接口
   - 完整的 TypeScript 类型支持

**估计时间：** 1-2 小时（16 个任务）

**前置条件：** Phase 1 必须完成

**后续工作：** Phase 3 将实现爬虫服务，自动采集价格数据并调用快照服务存储

---

