# Amazon 爬虫服务实现计划 (Phase 3)

> **状态说明**: 本文档是早期 Amazon 爬虫实现计划的历史记录。当前路线已升级为 provider chain + job/attempt 观测 + 合规数据源优先，后续实施请以 [当前路线计划](../../roadmap.md) 和 OpenSpec 主规格为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Amazon 产品页面爬虫服务，自动采集产品价格和信息，并创建价格快照记录。

**Architecture:** 基于 Phase 1 和 Phase 2 的架构，新增 ScraperService 服务层和定时任务调度器，使用 Playwright 进行网页抓取，集成 PriceSnapshotService 存储数据。

**Tech Stack:** TypeScript, Playwright, node-cron, 继承现有技术栈

---

## 前置条件

Phase 1 和 Phase 2 必须完成：
- ✅ ProductService 已实现
- ✅ PriceSnapshotService 已实现
- ✅ 数据库 schema 已定义
- ✅ 测试框架已搭建

## 文件结构

```
backend/
├── src/
│   ├── services/
│   │   ├── scraperService.ts        # 新增：爬虫服务
│   │   └── schedulerService.ts      # 新增：定时任务调度
│   ├── scrapers/
│   │   ├── baseScraper.ts           # 新增：爬虫基类
│   │   └── amazonScraper.ts         # 新增：Amazon 爬虫
│   └── types/
│       └── index.ts                  # 扩展：添加爬虫类型
├── tests/
│   ├── scraperService.test.ts       # 新增：服务层测试
│   ├── amazonScraper.test.ts        # 新增：爬虫测试
│   └── schedulerService.test.ts     # 新增：调度器测试
```

---

## Task 1: 安装依赖

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: 安装 Playwright**

```bash
cd backend
npm install playwright
npm install -D @playwright/test
```

- [ ] **Step 2: 安装 node-cron**

```bash
npm install node-cron
npm install -D @types/node-cron
```

- [ ] **Step 3: 初始化 Playwright**

```bash
npx playwright install chromium
```

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add playwright and node-cron dependencies"
```

---

## Task 2: 扩展类型定义

**Files:**
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: 添加爬虫相关类型**

在 `src/types/index.ts` 文件末尾添加：

```typescript
// Scraper types
export interface ScrapedProductData {
  price: number;
  currency: string;
  availability: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedProductData;
  error?: string;
  timestamp: number;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add scraper types"
```

---

## Task 3: 实现爬虫基类

**Files:**
- Create: `backend/src/scrapers/baseScraper.ts`

- [ ] **Step 1: 创建基类文件**

```typescript
import { chromium, Browser, Page } from 'playwright';
import { ScrapedProductData, ScrapeResult } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    
    // 设置用户代理
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  abstract scrape(url: string): Promise<ScrapeResult>;

  protected async safeExtractText(
    selector: string,
    defaultValue: string = ''
  ): Promise<string> {
    try {
      if (!this.page) throw new Error('Page not initialized');
      const element = await this.page.$(selector);
      if (!element) return defaultValue;
      const text = await element.textContent();
      return text?.trim() || defaultValue;
    } catch (error) {
      logger.warn({ selector, error }, 'Failed to extract text');
      return defaultValue;
    }
  }

  protected parsePrice(priceText: string): number | null {
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (!match) return null;
    return parseFloat(match[0].replace(/,/g, ''));
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scrapers/baseScraper.ts
git commit -m "feat: implement base scraper class"
```

---

## Task 4: 编写 AmazonScraper 测试

**Files:**
- Create: `backend/tests/amazonScraper.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AmazonScraper } from '../src/scrapers/amazonScraper';

describe('AmazonScraper', () => {
  let scraper: AmazonScraper;

  beforeAll(async () => {
    scraper = new AmazonScraper();
    await scraper.initialize();
  });

  afterAll(async () => {
    await scraper.close();
  });

  it('should extract price from Amazon product page', async () => {
    const result = await scraper.scrape(
      'https://www.amazon.com/dp/B07XJ8C8F5'
    );

    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.price).toBeGreaterThan(0);
      expect(result.data.currency).toBe('USD');
      expect(result.data.availability).toBeDefined();
    }
  }, 30000);

  it('should handle invalid product URL', async () => {
    const result = await scraper.scrape(
      'https://www.amazon.com/dp/INVALID'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 30000);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test amazonScraper.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 提交测试**

```bash
git add tests/amazonScraper.test.ts
git commit -m "test: add AmazonScraper tests"
```

---

## Task 5: 实现 AmazonScraper

**Files:**
- Create: `backend/src/scrapers/amazonScraper.ts`

- [ ] **Step 1: 创建 AmazonScraper 文件**

```typescript
import { BaseScraper } from './baseScraper';
import { ScrapeResult, ScrapedProductData } from '../types';
import { logger } from '../utils/logger';

export class AmazonScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      logger.info({ url }, 'Starting Amazon scrape');

      // 访问页面
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(2000);

      // 提取价格
      const priceText = await this.safeExtractText(
        '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice'
      );
      const price = this.parsePrice(priceText);

      if (!price) {
        throw new Error('Price not found');
      }

      // 提取其他信息
      const title = await this.safeExtractText('#productTitle');
      const availability = await this.safeExtractText('#availability span');
      
      // 提取评分
      const ratingText = await this.safeExtractText('.a-icon-star .a-icon-alt');
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      // 提取评论数
      const reviewText = await this.safeExtractText('#acrCustomerReviewText');
      const reviewMatch = reviewText.match(/(\d+)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : undefined;

      // 提取图片
      const imageUrl = await this.page.$eval(
        '#landingImage, #imgBlkFront',
        (img: any) => img.src
      ).catch(() => undefined);

      const data: ScrapedProductData = {
        price,
        currency: 'USD',
        availability: availability || 'unknown',
        title: title || undefined,
        rating,
        reviewCount,
        imageUrl,
      };

      logger.info(
        { url, duration: Date.now() - startTime },
        'Amazon scrape successful'
      );

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      logger.error(
        { url, error: error.message, duration: Date.now() - startTime },
        'Amazon scrape failed'
      );

      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }
}
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test amazonScraper.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 3: 提交**

```bash
git add src/scrapers/amazonScraper.ts
git commit -m "feat: implement AmazonScraper"
```

---

## Task 6: 编写 ScraperService 测试

**Files:**
- Create: `backend/tests/scraperService.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScraperService } from '../src/services/scraperService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('ScraperService', () => {
  const scraperService = new ScraperService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B07XJ8C8F5',
      asin: 'B07XJ8C8F5',
      title: 'Test Product',
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

  describe('scrapeProduct', () => {
    it('should scrape product and create snapshot', async () => {
      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(true);
      if (result.snapshotId) {
        const snapshots = await snapshotService.getSnapshotsByProduct(
          testProductId
        );
        expect(snapshots.length).toBe(1);
        expect(snapshots[0].price).toBeGreaterThan(0);
      }
    }, 30000);

    it('should handle product not found', async () => {
      const result = await scraperService.scrapeProduct('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('scrapeAllMonitoringProducts', () => {
    it('should scrape all monitoring products', async () => {
      const results = await scraperService.scrapeAllMonitoringProducts();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].productId).toBe(testProductId);
    }, 60000);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test scraperService.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 提交测试**

```bash
git add tests/scraperService.test.ts
git commit -m "test: add ScraperService tests"
```

---

## Task 7: 实现 ScraperService

**Files:**
- Create: `backend/src/services/scraperService.ts`

- [ ] **Step 1: 创建服务文件**

```typescript
import { AmazonScraper } from '../scrapers/amazonScraper';
import { ProductService } from './productService';
import { PriceSnapshotService } from './priceSnapshotService';
import { logger } from '../utils/logger';

interface ScrapeProductResult {
  success: boolean;
  productId: string;
  snapshotId?: string;
  error?: string;
}

export class ScraperService {
  private productService = new ProductService();
  private snapshotService = new PriceSnapshotService();

  async scrapeProduct(productId: string): Promise<ScrapeProductResult> {
    try {
      // 获取产品信息
      const product = await this.productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          productId,
          error: 'Product not found',
        };
      }

      // 初始化爬虫
      let scraper;
      if (product.platform === 'amazon') {
        scraper = new AmazonScraper();
      } else {
        return {
          success: false,
          productId,
          error: `Unsupported platform: ${product.platform}`,
        };
      }

      await scraper.initialize();

      try {
        // 爬取数据
        const scrapeResult = await scraper.scrape(product.productUrl);

        if (!scrapeResult.success || !scrapeResult.data) {
          return {
            success: false,
            productId,
            error: scrapeResult.error || 'Scrape failed',
          };
        }

        // 创建价格快照
        const snapshot = await this.snapshotService.createSnapshot({
          productId: product.id,
          price: scrapeResult.data.price,
          currency: scrapeResult.data.currency,
          availability: scrapeResult.data.availability,
          rating: scrapeResult.data.rating,
          reviewCount: scrapeResult.data.reviewCount,
        });

        // 更新产品信息
        await this.productService.updateProduct(product.id, {
          currentPrice: scrapeResult.data.price,
          lastCheckedAt: Date.now(),
          ...(scrapeResult.data.title && { title: scrapeResult.data.title }),
          ...(scrapeResult.data.imageUrl && { imageUrl: scrapeResult.data.imageUrl }),
        });

        logger.info(
          { productId, snapshotId: snapshot.id },
          'Product scraped successfully'
        );

        return {
          success: true,
          productId,
          snapshotId: snapshot.id,
        };
      } finally {
        await scraper.close();
      }
    } catch (error: any) {
      logger.error({ productId, error: error.message }, 'Scrape product failed');
      return {
        success: false,
        productId,
        error: error.message,
      };
    }
  }

  async scrapeAllMonitoringProducts(): Promise<ScrapeProductResult[]> {
    logger.info('Starting scrape all monitoring products');

    // 获取所有监控中的产品
    const products = await this.productService.listProducts({
      monitoring: true,
    });

    logger.info({ count: products.length }, 'Found monitoring products');

    // 串行爬取（避免并发过多）
    const results: ScrapeProductResult[] = [];
    for (const product of products) {
      const result = await this.scrapeProduct(product.id);
      results.push(result);

      // 添加延迟避免被封
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      { total: results.length, success: successCount },
      'Scrape all completed'
    );

    return results;
  }
}
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test scraperService.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 3: 提交**

```bash
git add src/services/scraperService.ts
git commit -m "feat: implement ScraperService"
```

---

## Task 8: 编写 SchedulerService 测试

**Files:**
- Create: `backend/tests/schedulerService.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchedulerService } from '../src/services/schedulerService';

describe('SchedulerService', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    scheduler = new SchedulerService();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should start scheduler', () => {
    scheduler.start();
    expect(scheduler.isRunning()).toBe(true);
  });

  it('should stop scheduler', () => {
    scheduler.start();
    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
  });

  it('should not start twice', () => {
    scheduler.start();
    expect(() => scheduler.start()).toThrow('already running');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test schedulerService.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 提交测试**

```bash
git add tests/schedulerService.test.ts
git commit -m "test: add SchedulerService tests"
```

---

## Task 9: 实现 SchedulerService

**Files:**
- Create: `backend/src/services/schedulerService.ts`

- [ ] **Step 1: 创建服务文件**

```typescript
import cron from 'node-cron';
import { ScraperService } from './scraperService';
import { logger } from '../utils/logger';

export class SchedulerService {
  private task: cron.ScheduledTask | null = null;
  private scraperService = new ScraperService();

  start(): void {
    if (this.task) {
      throw new Error('Scheduler already running');
    }

    // 每小时执行一次
    this.task = cron.schedule('0 * * * *', async () => {
      logger.info('Scheduler: Starting scheduled scrape');
      try {
        await this.scraperService.scrapeAllMonitoringProducts();
      } catch (error: any) {
        logger.error({ error: error.message }, 'Scheduler: Scrape failed');
      }
    });

    logger.info('Scheduler started (runs every hour)');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Scheduler stopped');
    }
  }

  isRunning(): boolean {
    return this.task !== null;
  }

  // 手动触发一次
  async triggerNow(): Promise<void> {
    logger.info('Scheduler: Manual trigger');
    await this.scraperService.scrapeAllMonitoringProducts();
  }
}
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test schedulerService.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 3: 提交**

```bash
git add src/services/schedulerService.ts
git commit -m "feat: implement SchedulerService"
```

---

## Task 10: 集成调度器到应用

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: 修改应用入口**

在 `src/index.ts` 中添加调度器启动：

```typescript
import { SchedulerService } from './services/schedulerService';

// 在服务器启动后添加
const scheduler = new SchedulerService();

if (config.nodeEnv === 'production') {
  scheduler.start();
  logger.info('Scheduler enabled in production mode');
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  scheduler.stop();
  process.exit(0);
});
```

- [ ] **Step 2: 提交**

```bash
git add src/index.ts
git commit -m "feat: integrate scheduler into application"
```

---

## Task 11: 添加手动触发 API 端点

**Files:**
- Create: `backend/src/routes/scraper.ts`
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { ScraperService } from '../services/scraperService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const scraperService = new ScraperService();

// POST /api/scraper/product/:productId - 手动爬取单个产品
router.post(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const result = await scraperService.scrapeProduct(productId);

      if (!result.success) {
        throw new AppError(500, result.error || 'Scrape failed', 'SCRAPE_FAILED');
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/scraper/all - 手动爬取所有监控产品
router.post('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await scraperService.scrapeAllMonitoringProducts();

    const successCount = results.filter((r) => r.success).length;

    res.json({
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 2: 注册路由**

在 `src/routes/index.ts` 中添加：

```typescript
import scraperRouter from './scraper';

router.use('/scraper', scraperRouter);
```

- [ ] **Step 3: 提交**

```bash
git add src/routes/scraper.ts src/routes/index.ts
git commit -m "feat: add manual scraper API endpoints"
```

---

## Task 12: 编写 API 集成测试

**Files:**
- Create: `backend/tests/scraper.api.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('Scraper API', () => {
  const app = createApp();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const response = await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B07XJ8C8F5',
      asin: 'B07XJ8C8F5',
      title: 'API Test Product',
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

  describe('POST /api/scraper/product/:productId', () => {
    it('should scrape single product', async () => {
      const response = await request(app)
        .post(`/api/scraper/product/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.snapshotId).toBeDefined();
    }, 30000);

    it('should return error for non-existent product', async () => {
      await request(app)
        .post('/api/scraper/product/non-existent')
        .expect(500);
    });
  });

  describe('POST /api/scraper/all', () => {
    it('should scrape all monitoring products', async () => {
      const response = await request(app)
        .post('/api/scraper/all')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.success).toBeGreaterThan(0);
    }, 60000);
  });
});
```

- [ ] **Step 2: 运行测试验证通过**

```bash
npm test scraper.api.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 3: 提交**

```bash
git add tests/scraper.api.test.ts
git commit -m "test: add scraper API integration tests"
```

---

## Task 13: 运行所有测试验证

**Files:**
- N/A

- [ ] **Step 1: 运行所有测试**

```bash
npm test
```

Expected: ALL PASS (包括新增的 9 个爬虫测试)

- [ ] **Step 2: 手动测试爬虫功能**

启动服务器：
```bash
npm run dev
```

手动触发爬取：
```bash
curl -X POST http://localhost:3001/api/scraper/product/<product-id>
```

- [ ] **Step 3: 验证数据库**

检查 price_snapshots 表是否有新记录，product 表的 lastCheckedAt 是否更新。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete Amazon scraper service (Phase 3)"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Amazon 产品页面爬虫
- ✅ 自动创建价格快照
- ✅ 定时任务调度
- ✅ 手动触发 API
- ✅ 错误处理和日志

**Placeholder Scan:**
- ✅ 无 TBD/TODO
- ✅ 所有代码块完整
- ✅ 所有测试用例具体
- ✅ 所有命令带预期输出

**Type Consistency:**
- ✅ ScrapedProductData 在所有地方使用一致
- ✅ ScrapeResult 接口匹配
- ✅ 方法签名在测试和实现中一致

---

## Summary

**Phase 3 完成后将交付：**

1. **爬虫服务**
   - BaseScraper 基类
   - AmazonScraper 实现
   - ScraperService 业务逻辑

2. **定时调度**
   - SchedulerService 调度器
   - 每小时自动爬取

3. **API 端点**
   - POST /api/scraper/product/:productId - 手动爬取单个产品
   - POST /api/scraper/all - 手动爬取所有监控产品

4. **测试覆盖**
   - 9 个新测试（3 爬虫 + 3 服务 + 3 API）
   - 与 Phase 1/2 测试集成

**估计时间：** 2-3 小时（13 个任务）

**前置条件：** Phase 1 和 Phase 2 必须完成

**后续工作：** Phase 4 将实现价格分析、趋势预测和智能报警
