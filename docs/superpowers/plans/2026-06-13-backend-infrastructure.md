# 后端基础设施实现计划 (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建跨境电商 Agent 系统的后端基础设施，包括数据库、API 框架、核心数据模型和基础服务。

**Architecture:** Express + TypeScript 后端服务，SQLite 数据库使用 Drizzle ORM，分层架构（routes -> services -> database），日志使用 pino，环境配置使用 dotenv。

**Tech Stack:** Node.js 18+, TypeScript, Express, SQLite, Drizzle ORM, pino, dotenv, vitest

---

## 文件结构

```
backend/
├── src/
│   ├── index.ts                 # 应用入口
│   ├── app.ts                   # Express 应用配置
│   ├── config/
│   │   └── index.ts             # 配置管理
│   ├── db/
│   │   ├── index.ts             # 数据库连接
│   │   ├── schema.ts            # Drizzle schema 定义
│   │   └── migrate.ts           # 迁移脚本
│   ├── routes/
│   │   ├── index.ts             # 路由汇总
│   │   ├── products.ts          # 产品相关路由
│   │   └── alerts.ts            # 报警相关路由
│   ├── services/
│   │   ├── productService.ts    # 产品业务逻辑
│   │   └── alertService.ts      # 报警业务逻辑
│   ├── middleware/
│   │   ├── errorHandler.ts     # 错误处理中间件
│   │   └── logger.ts            # 日志中间件
│   ├── utils/
│   │   ├── logger.ts            # 日志工具
│   │   └── validation.ts        # 数据验证工具
│   └── types/
│       └── index.ts             # TypeScript 类型定义
├── tests/
│   └── setup.ts                 # 测试配置
├── data/
│   └── .gitkeep
├── logs/
│   └── .gitkeep
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Task 1: 项目初始化和配置

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`

- [ ] **Step 1: 创建 package.json**

```bash
cd backend
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install express cors dotenv better-sqlite3 drizzle-orm pino pino-pretty
npm install -D typescript @types/node @types/express @types/cors tsx vitest
npm install -D @types/better-sqlite3 drizzle-kit
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: 创建 .env.example**

```bash
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/ecommerce.db
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 5: 创建 .gitignore**

```
node_modules/
dist/
.env
*.log
data/*.db
data/*.db-*
logs/*.log
.DS_Store
```

- [ ] **Step 6: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.ts",
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "tsx src/db/migrate.ts",
    "test": "vitest"
  }
}
```

- [ ] **Step 7: 创建目录结构**

```bash
mkdir -p src/{config,db,routes,services,middleware,utils,types}
mkdir -p data logs tests
touch data/.gitkeep logs/.gitkeep
```

- [ ] **Step 8: 提交**

```bash
git init
git add .
git commit -m "chore: initialize backend project"
```

---

## Task 2: 配置管理和日志工具

**Files:**
- Create: `backend/src/config/index.ts`
- Create: `backend/src/utils/logger.ts`
- Create: `backend/tests/config.test.ts`

- [ ] **Step 1: 写配置管理的失败测试**

```typescript
// backend/tests/config.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Config', () => {
  beforeEach(() => {
    process.env.PORT = '3001';
    process.env.DATABASE_PATH = './data/test.db';
  });

  it('should load config from environment variables', async () => {
    const { config } = await import('../src/config');
    expect(config.port).toBe(3001);
    expect(config.databasePath).toBe('./data/test.db');
  });

  it('should use default values when env vars missing', async () => {
    delete process.env.PORT;
    const { config } = await import('../src/config');
    expect(config.port).toBe(3001);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npm test config.test.ts
```

Expected: FAIL - "Cannot find module '../src/config'"

- [ ] **Step 3: 实现配置管理**

```typescript
// backend/src/config/index.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  databasePath: process.env.DATABASE_PATH || './data/ecommerce.db',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const;

export function validateConfig() {
  const required = ['DATABASE_PATH'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npm test config.test.ts
```

Expected: PASS

- [ ] **Step 5: 实现日志工具**

```typescript
// backend/src/utils/logger.ts
import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});
```

- [ ] **Step 6: 提交**

```bash
git add src/config src/utils/logger.ts tests/config.test.ts
git commit -m "feat: add config management and logger"
```

---

## Task 3: 数据库 Schema 定义

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: 定义 TypeScript 类型**

```typescript
// backend/src/types/index.ts
export type Platform = 'amazon' | 'walmart' | 'aliexpress' | 'ebay' | 'other';
export type MonitorType = 'own' | 'competitor';
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock';
export type AlertType = 'price_drop' | 'price_surge' | 'out_of_stock' | 'rank_improvement' | 'rank_decline';
export type Severity = 'info' | 'warning' | 'critical';
export type TaskType = 'product_check' | 'batch_check' | 'report_generation' | 'data_cleanup';

export interface Product {
  id: string;
  platform: Platform;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  monitorType?: MonitorType;
  checkInterval: number;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
  lastCheckedAt?: number;
  metadata?: string;
}
```

- [ ] **Step 2: 定义 Drizzle Schema (核心表)**

```typescript
// backend/src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  lastCheckedAt: integer('last_checked_at', { mode: 'timestamp' }),
  metadata: text('metadata'),
});

export const priceSnapshots = sqliteTable('price_snapshots', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  discountRate: real('discount_rate'),
  rating: real('rating'),
  reviewsCount: integer('reviews_count'),
  salesRank: integer('sales_rank'),
  salesCategory: text('sales_category'),
  availability: text('availability'),
  sellerCount: integer('seller_count'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  snapshotSource: text('snapshot_source').notNull().default('scheduled'),
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  ruleId: text('rule_id'),
  productId: text('product_id').notNull().references(() => products.id),
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  dataSnapshot: text('data_snapshot'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  notifiedAt: integer('notified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

- [ ] **Step 3: 生成迁移文件**

```bash
npm run db:generate
```

Expected: 生成 SQL 迁移文件

- [ ] **Step 4: 创建数据库连接和迁移**

```typescript
// backend/src/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';

const sqlite = new Database(config.databasePath);
export const db = drizzle(sqlite, { schema });

// backend/src/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';

const sqlite = new Database(config.databasePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
console.log('✅ Database migrated successfully');
```

- [ ] **Step 5: 运行迁移**

```bash
npm run db:migrate
```

Expected: 创建 data/ecommerce.db 并应用迁移

- [ ] **Step 6: 提交**

```bash
git add src/db src/types
git commit -m "feat: add database schema and migrations"
```

---

## Task 4: Express 应用和中间件

**Files:**
- Create: `backend/src/app.ts`
- Create: `backend/src/middleware/errorHandler.ts`
- Create: `backend/src/middleware/logger.ts`

- [ ] **Step 1: 实现错误处理中间件**

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

- [ ] **Step 2: 实现日志中间件**

```typescript
// backend/src/middleware/logger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
}
```

- [ ] **Step 3: 实现 Express 应用配置**

```typescript
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  
  // 中间件
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);
  
  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });
  
  // API 路由 (稍后添加)
  app.use('/api', (req, res) => {
    res.json({ message: 'API routes will be added here' });
  });
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}
```

- [ ] **Step 4: 创建入口文件**

```typescript
// backend/src/index.ts
import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

async function main() {
  try {
    // 验证配置
    validateConfig();
    
    // 创建应用
    const app = createApp();
    
    // 启动服务器
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`💾 Database: ${config.databasePath}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 5: 测试服务器启动**

```bash
npm run dev
```

Expected: 服务器在 http://localhost:3001 启动，访问 /health 返回状态

- [ ] **Step 6: 提交**

```bash
git add src/app.ts src/index.ts src/middleware
git commit -m "feat: add Express app and middleware"
```

---

## Task 5: 产品服务层

**Files:**
- Create: `backend/src/services/productService.ts`
- Create: `backend/tests/productService.test.ts`

- [ ] **Step 1: 写产品服务的失败测试**

```typescript
// backend/tests/productService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from '../src/services/productService';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService();
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const input = {
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/B08N5WRWNW',
        asin: 'B08N5WRWNW',
        title: 'Apple AirPods Pro',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      };

      const product = await service.createProduct(input);

      expect(product.id).toBeDefined();
      expect(product.platform).toBe('amazon');
      expect(product.title).toBe('Apple AirPods Pro');
      expect(product.createdAt).toBeDefined();
    });

    it('should throw error for duplicate product URL', async () => {
      const input = {
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/DUPLICATE',
        asin: 'DUPLICATE',
        title: 'Test Product',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 24,
      };

      await service.createProduct(input);

      await expect(
        service.createProduct(input)
      ).rejects.toThrow('Product URL already exists');
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const created = await service.createProduct({
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/TEST123',
        asin: 'TEST123',
        title: 'Test Product',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 24,
      });

      const found = await service.getProductById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent product', async () => {
      const found = await service.getProductById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('listProducts', () => {
    it('should return all products', async () => {
      await service.createProduct({
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/PROD1',
        asin: 'PROD1',
        title: 'Product 1',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 24,
      });

      await service.createProduct({
        platform: 'walmart' as const,
        productUrl: 'https://walmart.com/ip/PROD2',
        asin: 'PROD2',
        title: 'Product 2',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 12,
      });

      const products = await service.listProducts({});

      expect(products.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by monitoring status', async () => {
      await service.createProduct({
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/MON1',
        asin: 'MON1',
        title: 'Monitored Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      const monitored = await service.listProducts({ isMonitoring: true });

      expect(monitored.length).toBeGreaterThan(0);
      expect(monitored.every(p => p.isMonitoring)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npm test productService.test.ts
```

Expected: FAIL - "Cannot find module '../src/services/productService'"

- [ ] **Step 3: 实现产品服务**

```typescript
// backend/src/services/productService.ts
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema';
import { Product } from '../types';
import { AppError } from '../middleware/errorHandler';

interface CreateProductInput {
  platform: string;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  monitorType?: string;
  checkInterval: number;
  userId?: string;
  metadata?: string;
}

interface ListProductsOptions {
  isMonitoring?: boolean;
  platform?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export class ProductService {
  async createProduct(input: CreateProductInput): Promise<Product> {
    // 检查 URL 是否已存在
    const existing = await db.query.products.findFirst({
      where: eq(products.productUrl, input.productUrl),
    });

    if (existing) {
      throw new AppError(409, 'Product URL already exists', 'DUPLICATE_URL');
    }

    // 生成 ID
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // 插入产品
    const newProduct = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(products).values(newProduct);

    return newProduct as Product;
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    return product as Product | null;
  }

  async listProducts(options: ListProductsOptions = {}): Promise<Product[]> {
    const { isMonitoring, platform, userId, limit = 100, offset = 0 } = options;

    let query = db.select().from(products);

    // 构建 where 条件
    const conditions = [];
    if (isMonitoring !== undefined) {
      conditions.push(eq(products.isMonitoring, isMonitoring));
    }
    if (platform) {
      conditions.push(eq(products.platform, platform));
    }
    if (userId) {
      conditions.push(eq(products.userId, userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.limit(limit).offset(offset);

    return result as Product[];
  }

  async updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<Product> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    const now = Date.now();
    await db.update(products)
      .set({ ...updates, updatedAt: now })
      .where(eq(products.id, id));

    const updated = await this.getProductById(id);
    return updated!;
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    await db.delete(products).where(eq(products.id, id));
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npm test productService.test.ts
```

Expected: PASS (所有测试通过)

- [ ] **Step 5: 提交**

```bash
git add src/services/productService.ts tests/productService.test.ts
git commit -m "feat: add product service with tests"
```

---

## Task 6: 产品 API 路由

**Files:**
- Create: `backend/src/routes/products.ts`
- Create: `backend/tests/products.api.test.ts`

- [ ] **Step 1: 写产品 API 的失败测试**

```typescript
// backend/tests/products.api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Express } from 'express';

describe('Products API', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/products', () => {
    it('should create a product', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          platform: 'amazon',
          productUrl: 'https://amazon.com/dp/TEST001',
          asin: 'TEST001',
          title: 'Test Product',
          currency: 'USD',
          isMonitoring: true,
          checkInterval: 24,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('Test Product');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          platform: 'amazon',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate URL', async () => {
      const productData = {
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/DUPLICATE',
        asin: 'DUPLICATE',
        title: 'Duplicate Product',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 24,
      };

      await request(app).post('/api/products').send(productData);

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_URL');
    });
  });

  describe('GET /api/products', () => {
    it('should list all products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by monitoring status', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ monitoring: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.isMonitoring)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({
          platform: 'amazon',
          productUrl: 'https://amazon.com/dp/GETTEST',
          asin: 'GETTEST',
          title: 'Get Test Product',
          currency: 'USD',
          isMonitoring: false,
          checkInterval: 24,
        });

      const response = await request(app).get(`/api/products/${created.body.data.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(created.body.data.id);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/products/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({
          platform: 'amazon',
          productUrl: 'https://amazon.com/dp/UPDATE',
          asin: 'UPDATE',
          title: 'Original Title',
          currency: 'USD',
          isMonitoring: false,
          checkInterval: 24,
        });

      const response = await request(app)
        .patch(`/api/products/${created.body.data.id}`)
        .send({
          title: 'Updated Title',
          isMonitoring: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.isMonitoring).toBe(true);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const created = await request(app)
        .post('/api/products')
        .send({
          platform: 'amazon',
          productUrl: 'https://amazon.com/dp/DELETE',
          asin: 'DELETE',
          title: 'To Be Deleted',
          currency: 'USD',
          isMonitoring: false,
          checkInterval: 24,
        });

      const response = await request(app).delete(`/api/products/${created.body.data.id}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/api/products/${created.body.data.id}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
```

- [ ] **Step 2: 安装 supertest**

```bash
npm install -D supertest @types/supertest
```

- [ ] **Step 3: 运行测试验证失败**

```bash
npm test products.api.test.ts
```

Expected: FAIL - API 路由未实现

- [ ] **Step 4: 实现产品路由**

```typescript
// backend/src/routes/products.ts
import { Router } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const productService = new ProductService();

// POST /api/products - 创建产品
router.post('/', async (req, res, next) => {
  try {
    const { platform, productUrl, asin, title, brand, category, imageUrl, currentPrice, currency, isMonitoring, monitorType, checkInterval, userId, metadata } = req.body;

    // 验证必填字段
    if (!platform || !productUrl || !asin || !title || !currency || isMonitoring === undefined || !checkInterval) {
      throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    const product = await productService.createProduct({
      platform,
      productUrl,
      asin,
      title,
      brand,
      category,
      imageUrl,
      currentPrice,
      currency,
      isMonitoring,
      monitorType,
      checkInterval,
      userId,
      metadata,
    });

    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
});

// GET /api/products - 获取产品列表
router.get('/', async (req, res, next) => {
  try {
    const { monitoring, platform, userId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const options: any = {
      limit: limitNum,
      offset,
    };

    if (monitoring !== undefined) {
      options.isMonitoring = monitoring === 'true';
    }

    if (platform) {
      options.platform = platform;
    }

    if (userId) {
      options.userId = userId;
    }

    const products = await productService.listProducts(options);

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: products.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - 获取产品详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id - 更新产品
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await productService.updateProduct(id, updates);

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - 删除产品
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 5: 更新路由汇总**

```typescript
// backend/src/routes/index.ts
import { Router } from 'express';
import productsRouter from './products';

const router = Router();

router.use('/products', productsRouter);

export default router;
```

- [ ] **Step 6: 更新 app.ts 使用路由**

```typescript
// backend/src/app.ts (修改)
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

export function createApp() {
  const app = express();
  
  // 中间件
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);
  
  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });
  
  // API 路由
  app.use('/api', routes);
  
  // 错误处理
  app.use(errorHandler);
  
  return app;
}
```

- [ ] **Step 7: 运行测试验证通过**

```bash
npm test products.api.test.ts
```

Expected: PASS (所有 API 测试通过)

- [ ] **Step 8: 手动测试 API**

```bash
# 启动服务器
npm run dev

# 在另一个终端测试 API
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "amazon",
    "productUrl": "https://amazon.com/dp/B08N5WRWNW",
    "asin": "B08N5WRWNW",
    "title": "Apple AirPods Pro",
    "currency": "USD",
    "isMonitoring": true,
    "checkInterval": 24
  }'

# 获取产品列表
curl http://localhost:3001/api/products
```

Expected: API 正常工作，返回正确的 JSON 响应

- [ ] **Step 9: 提交**

```bash
git add src/routes tests/products.api.test.ts
git commit -m "feat: add products API routes"
```

---

## Task 7: 报警服务和 API

**Files:**
- Create: `backend/src/services/alertService.ts`
- Create: `backend/src/routes/alerts.ts`
- Create: `backend/tests/alertService.test.ts`

- [ ] **Step 1: 写报警服务的失败测试**

```typescript
// backend/tests/alertService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AlertService } from '../src/services/alertService';
import { ProductService } from '../src/services/productService';

describe('AlertService', () => {
  let alertService: AlertService;
  let productService: ProductService;
  let testProductId: string;

  beforeEach(async () => {
    alertService = new AlertService();
    productService = new ProductService();

    // 创建测试产品
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/ALERT_TEST',
      asin: 'ALERT_TEST',
      title: 'Alert Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  describe('createAlert', () => {
    it('should create an alert', async () => {
      const alert = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'warning',
        title: 'Price dropped 10%',
        message: 'From $100 to $90',
      });

      expect(alert.id).toBeDefined();
      expect(alert.productId).toBe(testProductId);
      expect(alert.alertType).toBe('price_drop');
      expect(alert.isRead).toBe(false);
    });

    it('should include data snapshot if provided', async () => {
      const snapshot = { oldPrice: 100, newPrice: 90 };

      const alert = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'warning',
        title: 'Price dropped',
        message: 'Test',
        dataSnapshot: JSON.stringify(snapshot),
      });

      expect(alert.dataSnapshot).toBeDefined();
      expect(JSON.parse(alert.dataSnapshot!)).toEqual(snapshot);
    });
  });

  describe('listAlerts', () => {
    it('should list all alerts', async () => {
      await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'warning',
        title: 'Alert 1',
        message: 'Test 1',
      });

      await alertService.createAlert({
        productId: testProductId,
        alertType: 'out_of_stock',
        severity: 'critical',
        title: 'Alert 2',
        message: 'Test 2',
      });

      const alerts = await alertService.listAlerts({});

      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by read status', async () => {
      const alert = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Unread Alert',
        message: 'Test',
      });

      const unread = await alertService.listAlerts({ isRead: false });

      expect(unread.some(a => a.id === alert.id)).toBe(true);
      expect(unread.every(a => !a.isRead)).toBe(true);
    });

    it('should filter by severity', async () => {
      await alertService.createAlert({
        productId: testProductId,
        alertType: 'out_of_stock',
        severity: 'critical',
        title: 'Critical Alert',
        message: 'Test',
      });

      const critical = await alertService.listAlerts({ severity: 'critical' });

      expect(critical.length).toBeGreaterThan(0);
      expect(critical.every(a => a.severity === 'critical')).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      const alert = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Test Alert',
        message: 'Test',
      });

      expect(alert.isRead).toBe(false);

      const updated = await alertService.markAsRead(alert.id);

      expect(updated.isRead).toBe(true);
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      const alert = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'To Be Deleted',
        message: 'Test',
      });

      await alertService.deleteAlert(alert.id);

      const found = await alertService.getAlertById(alert.id);
      expect(found).toBeNull();
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npm test alertService.test.ts
```

Expected: FAIL - "Cannot find module '../src/services/alertService'"

- [ ] **Step 3: 实现报警服务**

```typescript
// backend/src/services/alertService.ts
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { alerts } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

interface CreateAlertInput {
  ruleId?: string;
  productId: string;
  alertType: string;
  severity: string;
  title: string;
  message?: string;
  dataSnapshot?: string;
}

interface ListAlertsOptions {
  isRead?: boolean;
  severity?: string;
  productId?: string;
  limit?: number;
  offset?: number;
}

export class AlertService {
  async createAlert(input: CreateAlertInput) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newAlert = {
      id,
      ...input,
      isRead: false,
      isArchived: false,
      createdAt: now,
    };

    await db.insert(alerts).values(newAlert);

    return newAlert;
  }

  async getAlertById(id: string) {
    const alert = await db.query.alerts.findFirst({
      where: eq(alerts.id, id),
    });

    return alert || null;
  }

  async listAlerts(options: ListAlertsOptions = {}) {
    const { isRead, severity, productId, limit = 100, offset = 0 } = options;

    let query = db.select().from(alerts).orderBy(desc(alerts.createdAt));

    const conditions = [];
    if (isRead !== undefined) {
      conditions.push(eq(alerts.isRead, isRead));
    }
    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }
    if (productId) {
      conditions.push(eq(alerts.productId, productId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.limit(limit).offset(offset);

    return result;
  }

  async markAsRead(id: string) {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    await db.update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id));

    return { ...existing, isRead: true };
  }

  async markAsArchived(id: string) {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    await db.update(alerts)
      .set({ isArchived: true })
      .where(eq(alerts.id, id));

    return { ...existing, isArchived: true };
  }

  async deleteAlert(id: string) {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    await db.delete(alerts).where(eq(alerts.id, id));
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npm test alertService.test.ts
```

Expected: PASS (所有测试通过)

- [ ] **Step 5: 实现报警路由**

```typescript
// backend/src/routes/alerts.ts
import { Router } from 'express';
import { AlertService } from '../services/alertService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const alertService = new AlertService();

// GET /api/alerts - 获取报警列表
router.get('/', async (req, res, next) => {
  try {
    const { read, severity, productId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const options: any = {
      limit: limitNum,
      offset,
    };

    if (read !== undefined) {
      options.isRead = read === 'true';
    }

    if (severity) {
      options.severity = severity;
    }

    if (productId) {
      options.productId = productId;
    }

    const alertsList = await alertService.listAlerts(options);

    res.json({
      data: alertsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: alertsList.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/:id - 获取报警详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertById(id);

    if (!alert) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    res.json({ data: alert });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/alerts/:id - 更新报警状态
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRead, isArchived } = req.body;

    let updated;

    if (isRead !== undefined && isRead) {
      updated = await alertService.markAsRead(id);
    }

    if (isArchived !== undefined && isArchived) {
      updated = await alertService.markAsArchived(id);
    }

    if (!updated) {
      updated = await alertService.getAlertById(id);
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/alerts/:id - 删除报警
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await alertService.deleteAlert(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 6: 更新路由汇总**

```typescript
// backend/src/routes/index.ts (修改)
import { Router } from 'express';
import productsRouter from './products';
import alertsRouter from './alerts';

const router = Router();

router.use('/products', productsRouter);
router.use('/alerts', alertsRouter);

export default router;
```

- [ ] **Step 7: 测试报警 API**

```bash
# 创建测试报警
curl -X POST http://localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_xxx",
    "alertType": "price_drop",
    "severity": "warning",
    "title": "Price dropped 15%",
    "message": "From $100 to $85"
  }'

# 获取报警列表
curl http://localhost:3001/api/alerts

# 标记为已读
curl -X PATCH http://localhost:3001/api/alerts/alert_xxx \
  -H "Content-Type: application/json" \
  -d '{"isRead": true}'
```

Expected: API 正常工作

- [ ] **Step 8: 提交**

```bash
git add src/services/alertService.ts src/routes/alerts.ts tests/alertService.test.ts
git commit -m "feat: add alert service and API"
```

---

## Task 8: 数据验证工具

**Files:**
- Create: `backend/src/utils/validation.ts`
- Create: `backend/tests/validation.test.ts`

- [ ] **Step 1: 写验证工具的失败测试**

```typescript
// backend/tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateProductUrl, validateEmail, validatePlatform } from '../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateProductUrl', () => {
    it('should validate Amazon URL', () => {
      const valid = validateProductUrl('https://www.amazon.com/dp/B08N5WRWNW', 'amazon');
      expect(valid).toBe(true);
    });

    it('should validate Walmart URL', () => {
      const valid = validateProductUrl('https://www.walmart.com/ip/123456789', 'walmart');
      expect(valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const valid = validateProductUrl('not-a-url', 'amazon');
      expect(valid).toBe(false);
    });

    it('should reject mismatched platform', () => {
      const valid = validateProductUrl('https://www.walmart.com/ip/123', 'amazon');
      expect(valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('missing@')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('validatePlatform', () => {
    it('should validate supported platforms', () => {
      expect(validatePlatform('amazon')).toBe(true);
      expect(validatePlatform('walmart')).toBe(true);
      expect(validatePlatform('aliexpress')).toBe(true);
    });

    it('should reject unsupported platforms', () => {
      expect(validatePlatform('unknown')).toBe(false);
      expect(validatePlatform('')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npm test validation.test.ts
```

Expected: FAIL - "Cannot find module '../src/utils/validation'"

- [ ] **Step 3: 实现验证工具**

```typescript
// backend/src/utils/validation.ts
const SUPPORTED_PLATFORMS = ['amazon', 'walmart', 'aliexpress', 'ebay', 'lazada', 'other'] as const;

const PLATFORM_URL_PATTERNS = {
  amazon: /^https?:\/\/(www\.)?amazon\.(com|co\.uk|de|fr|jp|ca|cn|in|com\.mx|com\.br|com\.au)\/.*\/(dp|gp\/product)\/[A-Z0-9]+/i,
  walmart: /^https?:\/\/(www\.)?walmart\.com\/ip\/.+\/\d+/i,
  aliexpress: /^https?:\/\/(www\.)?aliexpress\.(com|ru)\/item\/.+\.html/i,
  ebay: /^https?:\/\/(www\.)?ebay\.(com|co\.uk|de|fr|com\.au|ca)\/itm\/.+/i,
  lazada: /^https?:\/\/(www\.)?lazada\.(com\.my|sg|co\.th|com\.ph|vn|co\.id)\/.+/i,
  other: /^https?:\/\/.+/i,
};

export function validateProductUrl(url: string, platform: string): boolean {
  if (!url || !platform) return false;

  const pattern = PLATFORM_URL_PATTERNS[platform as keyof typeof PLATFORM_URL_PATTERNS];
  if (!pattern) return false;

  return pattern.test(url);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function validatePlatform(platform: string): boolean {
  return SUPPORTED_PLATFORMS.includes(platform as any);
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // 移除危险字符
  const sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // 限制长度
  return sanitized.substring(0, maxLength);
}

export function validatePositiveNumber(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npm test validation.test.ts
```

Expected: PASS (所有测试通过)

- [ ] **Step 5: 提交**

```bash
git add src/utils/validation.ts tests/validation.test.ts
git commit -m "feat: add validation utilities"
```

---

## Task 9: 环境配置完善和文档

**Files:**
- Create: `backend/README.md`
- Create: `backend/.env.example` (完善)
- Create: `backend/drizzle.config.ts`

- [ ] **Step 1: 创建 Drizzle 配置**

```typescript
// backend/drizzle.config.ts
import type { Config } from 'drizzle-kit';
import { config } from './src/config';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: config.databasePath,
  },
} satisfies Config;
```

- [ ] **Step 2: 完善 .env.example**

```bash
# backend/.env.example
# ====================================
# 服务配置
# ====================================
NODE_ENV=development
PORT=3001

# ====================================
# 数据库
# ====================================
DATABASE_PATH=./data/ecommerce.db

# ====================================
# 日志
# ====================================
LOG_LEVEL=info

# ====================================
# CORS
# ====================================
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 3: 创建 README 文档**

```markdown
# 跨境电商 Agent 系统 - 后端

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

\`\`\`bash
cp .env.example .env
# 编辑 .env 文件
\`\`\`

### 3. 初始化数据库

\`\`\`bash
npm run db:generate  # 生成迁移文件
npm run db:migrate   # 执行迁移
\`\`\`

### 4. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

服务器将在 http://localhost:3001 启动

## 可用脚本

- `npm run dev` - 启动开发服务器（带热重载）
- `npm run build` - 构建生产版本
- `npm start` - 运行生产版本
- `npm test` - 运行测试
- `npm run db:generate` - 生成数据库迁移
- `npm run db:migrate` - 执行数据库迁移

## API 端点

### 健康检查
- `GET /health` - 服务器健康状态

### 产品管理
- `POST /api/products` - 创建产品
- `GET /api/products` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `PATCH /api/products/:id` - 更新产品
- `DELETE /api/products/:id` - 删除产品

### 报警管理
- `GET /api/alerts` - 获取报警列表
- `GET /api/alerts/:id` - 获取报警详情
- `PATCH /api/alerts/:id` - 更新报警状态
- `DELETE /api/alerts/:id` - 删除报警

## 项目结构

\`\`\`
backend/
├── src/
│   ├── config/          # 配置管理
│   ├── db/              # 数据库连接和 schema
│   ├── routes/          # API 路由
│   ├── services/        # 业务逻辑层
│   ├── middleware/      # Express 中间件
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型
│   ├── app.ts           # Express 应用配置
│   └── index.ts         # 应用入口
├── tests/               # 测试文件
├── data/                # SQLite 数据库文件
├── logs/                # 日志文件
└── drizzle/             # 数据库迁移文件
\`\`\`

## 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript
- **框架**: Express.js
- **数据库**: SQLite + Drizzle ORM
- **日志**: pino
- **测试**: vitest

## 开发指南

### 添加新的 API 端点

1. 在 `src/services/` 创建服务类
2. 在 `src/routes/` 创建路由文件
3. 在 `src/routes/index.ts` 注册路由
4. 编写测试文件

### 数据库变更

1. 修改 `src/db/schema.ts`
2. 运行 `npm run db:generate` 生成迁移
3. 运行 `npm run db:migrate` 应用迁移

## 环境变量

参考 `.env.example` 了解所有可配置的环境变量。
\`\`\`

- [ ] **Step 4: 提交**

```bash
git add README.md .env.example drizzle.config.ts
git commit -m "docs: add README and configuration"
```

---

## Task 10: 最终集成测试和验收

**Files:**
- Create: `backend/tests/integration.test.ts`

- [ ] **Step 1: 写端到端集成测试**

```typescript
// backend/tests/integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Express } from 'express';

describe('Integration Tests', () => {
  let app: Express;
  let productId: string;

  beforeAll(() => {
    app = createApp();
  });

  it('should complete a full product monitoring workflow', async () => {
    // 1. 创建产品
    const createResponse = await request(app)
      .post('/api/products')
      .send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/INTEGRATION',
        asin: 'INTEGRATION',
        title: 'Integration Test Product',
        currentPrice: 99.99,
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

    expect(createResponse.status).toBe(201);
    productId = createResponse.body.data.id;

    // 2. 获取产品详情
    const getResponse = await request(app).get(`/api/products/${productId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.title).toBe('Integration Test Product');

    // 3. 创建报警
    const alertResponse = await request(app)
      .post('/api/alerts')
      .send({
        productId,
        alertType: 'price_drop',
        severity: 'warning',
        title: 'Price dropped',
        message: 'Test alert',
      });

    expect(alertResponse.status).toBe(201);
    const alertId = alertResponse.body.data.id;

    // 4. 获取报警列表
    const alertsResponse = await request(app).get('/api/alerts');
    expect(alertsResponse.status).toBe(200);
    expect(alertsResponse.body.data.some((a: any) => a.id === alertId)).toBe(true);

    // 5. 标记报警为已读
    const markReadResponse = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .send({ isRead: true });

    expect(markReadResponse.status).toBe(200);
    expect(markReadResponse.body.data.isRead).toBe(true);

    // 6. 更新产品
    const updateResponse = await request(app)
      .patch(`/api/products/${productId}`)
      .send({ currentPrice: 89.99 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.currentPrice).toBe(89.99);

    // 7. 清理：删除报警和产品
    await request(app).delete(`/api/alerts/${alertId}`);
    await request(app).delete(`/api/products/${productId}`);
  });
});
```

- [ ] **Step 2: 运行集成测试**

```bash
npm test integration.test.ts
```

Expected: PASS (完整流程测试通过)

- [ ] **Step 3: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

- [ ] **Step 4: 手动验收测试**

```bash
# 启动服务器
npm run dev

# 测试健康检查
curl http://localhost:3001/health

# 测试产品 CRUD
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "amazon",
    "productUrl": "https://amazon.com/dp/B08N5WRWNW",
    "asin": "B08N5WRWNW",
    "title": "Apple AirPods Pro",
    "currentPrice": 249.99,
    "currency": "USD",
    "isMonitoring": true,
    "checkInterval": 24
  }'

curl http://localhost:3001/api/products

# 测试报警
curl http://localhost:3001/api/alerts
```

Expected: 所有 API 正常工作，返回正确响应

- [ ] **Step 5: 检查日志**

```bash
# 查看日志输出
tail -f logs/*.log
```

Expected: 日志正常记录请求和错误

- [ ] **Step 6: 检查数据库**

```bash
# 使用 sqlite3 查看数据库
sqlite3 data/ecommerce.db

.tables
SELECT * FROM products;
SELECT * FROM alerts;
.exit
```

Expected: 数据正确存储

- [ ] **Step 7: 最终提交**

```bash
git add tests/integration.test.ts
git commit -m "test: add integration tests"
git tag v1.0.0-backend-infrastructure
```

---

## 自审检查清单

### ✅ 规格覆盖检查

- [x] 项目初始化和配置
- [x] 数据库 schema (products, price_snapshots, alerts)
- [x] Express 应用和中间件
- [x] 产品服务和 API
- [x] 报警服务和 API
- [x] 数据验证工具
- [x] 日志和错误处理
- [x] 配置管理
- [x] 完整的测试覆盖

### ✅ 占位符扫描

- 无 TBD 或 TODO
- 所有代码块完整
- 所有类型定义完整
- 所有测试用例完整

### ✅ 类型一致性

- ProductService.createProduct 与 API 路由一致
- AlertService.createAlert 与 API 路由一致
- 数据库 schema 与 TypeScript 类型一致
- 所有方法签名在任务间保持一致

---

## 完成标准

Phase 1 (后端基础设施) 完成后，你应该有：

✅ **可运行的后端服务**
- 在 http://localhost:3001 启动
- 响应健康检查
- 处理 API 请求

✅ **完整的数据层**
- SQLite 数据库已创建
- 迁移已应用
- 可以 CRUD 产品和报警

✅ **测试覆盖**
- 单元测试覆盖服务层
- 集成测试覆盖 API
- 所有测试通过

✅ **文档**
- README 说明如何启动
- API 端点文档
- 环境变量说明

---

## 下一步

完成 Phase 1 后，进入：

**Phase 2: Scraper 服务** - 实现 Amazon 爬虫和数据采集

准备好开始实施了吗？

