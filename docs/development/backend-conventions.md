# 后端代码约定

> **TL;DR**: Express + TypeScript。2 空格缩进、单引号、分号。Service 返回数据不返回响应。异步用 async/await 不用回调。错误用自定义错误类。文件按功能分层（routes/services/db），命名遵循 camelCase。

---

## 代码格式规范

### 基础格式

```typescript
// ✅ 正确格式
const productService = {
  async getById(id: string): Promise<Product> {
    const product = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .get();
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    return product;
  },
};
```

### 格式规则

| 规则 | 要求 | 示例 |
|------|------|------|
| **缩进** | 2 空格（不是 tab） | `  const x = 1;` |
| **引号** | 单引号 | `'hello'` 不是 `"hello"` |
| **分号** | 必须 | `const x = 1;` |
| **尾随逗号** | 多行时使用 | `{ a: 1, b: 2, }` |
| **行宽** | ≤ 100 字符 | 超过换行 |
| **空行** | 逻辑块之间 | 函数间空一行 |

### Prettier 配置

项目已配置 `.prettierrc`：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

运行格式化：
```bash
npm run format        # 格式化所有文件
npm run format:check  # 检查格式但不修改
```

---

## 分层架构约定

### Routes 层

**职责**：
- 定义 HTTP 端点和方法
- 请求参数验证（Zod）
- 调用 Service 层
- 构造 HTTP 响应
- 错误处理

**禁止**：
- ❌ 业务逻辑
- ❌ 直接数据库操作
- ❌ 复杂计算

**示例**：

```typescript
// routes/products.ts
import { Router } from 'express';
import { z } from 'zod';
import { productService } from '../services/productService';

const router = Router();

// Schema 定义
const CreateProductSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'ebay', 'aliexpress']),
  asin: z.string().length(10),
  title: z.string().min(1).max(500),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CNY']),
});

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    // 1. 验证输入
    const validated = CreateProductSchema.parse(req.body);
    
    // 2. 调用 Service
    const product = await productService.create(validated);
    
    // 3. 返回响应
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Service 层

**职责**：
- 业务逻辑实现
- 数据验证和转换
- 编排多个数据库操作
- 调用外部 API
- 返回纯数据（不返回 HTTP 响应）

**禁止**：
- ❌ 接收 `req`/`res` 参数
- ❌ 直接返回 HTTP 响应
- ❌ 处理 HTTP 状态码

**示例**：

```typescript
// services/productService.ts
import { db } from '../db';
import { products, priceSnapshots } from '../db/schema';
import { NotFoundError, ValidationError } from '../utils/errors';

export const productService = {
  /**
   * 获取所有产品
   */
  async getAll(): Promise<Product[]> {
    return await db.select().from(products).all();
  },

  /**
   * 根据 ID 获取产品
   */
  async getById(id: string): Promise<Product> {
    const product = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .get();

    if (!product) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    return product;
  },

  /**
   * 创建产品
   */
  async create(data: CreateProductInput): Promise<Product> {
    // 业务验证
    const existing = await this.findByAsin(data.asin);
    if (existing) {
      throw new ValidationError('Product with this ASIN already exists');
    }

    // 数据转换
    const product = {
      id: crypto.randomUUID(),
      ...data,
      isMonitoring: data.isMonitoring ?? true,
      createdAt: Date.now(),
    };

    // 数据库操作
    await db.insert(products).values(product);

    // 创建首次价格快照
    await this.createPriceSnapshot(product.id, product.price);

    return product;
  },

  /**
   * 更新产品
   */
  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const existing = await this.getById(id);

    const updated = { ...existing, ...data };
    
    await db.update(products)
      .set(updated)
      .where(eq(products.id, id));

    return updated;
  },

  /**
   * 删除产品
   */
  async delete(id: string): Promise<void> {
    const result = await db.delete(products)
      .where(eq(products.id, id));

    if (result.rowsAffected === 0) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }
  },

  /**
   * 私有辅助方法
   */
  async findByAsin(asin: string): Promise<Product | null> {
    return await db.select()
      .from(products)
      .where(eq(products.asin, asin))
      .get();
  },

  async createPriceSnapshot(productId: string, price: number): Promise<void> {
    await db.insert(priceSnapshots).values({
      id: crypto.randomUUID(),
      productId,
      price,
      capturedAt: Date.now(),
    });
  },
};
```

### Database 层

**职责**：
- Schema 定义（Drizzle）
- 数据库连接配置
- 类型导出

**禁止**：
- ❌ 业务逻辑
- ❌ 数据验证（应在 Service 层）

**示例**：

```typescript
// db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  asin: text('asin').notNull(),
  productUrl: text('product_url').notNull(),
  title: text('title').notNull(),
  price: integer('price').notNull(), // 存储为分（cents）
  currency: text('currency').notNull(),
  isMonitoring: integer('is_monitoring', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  platformIdx: index('platform_idx').on(table.platform),
  asinIdx: index('asin_idx').on(table.asin),
}));

// 导出类型
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

---

## 异步编程规范

### 使用 async/await

```typescript
// ✅ 正确：使用 async/await
async function fetchUserData(userId: string) {
  const user = await userService.getById(userId);
  const orders = await orderService.getByUserId(userId);
  return { user, orders };
}

// ❌ 错误：手动 Promise
function fetchUserData(userId: string) {
  return new Promise((resolve, reject) => {
    userService.getById(userId)
      .then(user => orderService.getByUserId(userId)
        .then(orders => resolve({ user, orders })))
      .catch(reject);
  });
}
```

### 并行执行

```typescript
// ✅ 正确：并行执行独立操作
async function fetchDashboardData() {
  const [products, alerts, stats] = await Promise.all([
    productService.getAll(),
    alertService.getRecent(),
    analyticsService.getStats(),
  ]);
  return { products, alerts, stats };
}

// ❌ 错误：串行执行（慢）
async function fetchDashboardData() {
  const products = await productService.getAll();  // 等待
  const alerts = await alertService.getRecent();    // 等待
  const stats = await analyticsService.getStats();  // 等待
  return { products, alerts, stats };
}
```

### Generator 迭代

⚠️ **重要**：在 tsx watch 环境下，`for-await-of` 无法正常工作。

```typescript
// ❌ 不要使用 for-await-of（tsx 环境问题）
async function* generateData() {
  yield 1;
  yield 2;
}

for await (const item of generateData()) { // 不工作
  console.log(item);
}

// ✅ 使用手动迭代
const generator = generateData();
let result = await generator.next();

while (!result.done) {
  console.log(result.value);
  result = await generator.next();
}
```

详见 [STREAMING_FIX.md](../../backend/STREAMING_FIX.md)

---

## 错误处理

### 使用自定义错误类

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorType: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NotFoundError', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'ValidationError', message, details);
  }
}
```

### Service 层抛出错误

```typescript
// services/productService.ts
async getById(id: string): Promise<Product> {
  const product = await db.select()
    .from(products)
    .where(eq(products.id, id))
    .get();

  if (!product) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }

  return product;
}
```

### Routes 层捕获错误

```typescript
// routes/products.ts
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error); // 传递给全局错误处理中间件
  }
});
```

详见 [错误处理规范](./error-handling.md)

---

## 命名约定

### 变量和函数

```typescript
// ✅ camelCase
const userName = 'John';
const productList = [];

function getUserData() {}
async function fetchProducts() {}

// 布尔值用 is/has/can 前缀
const isActive = true;
const hasPermission = false;
const canEdit = true;
```

### 类和接口

```typescript
// ✅ PascalCase
class ProductService {}
interface ProductData {}
type UserRole = 'admin' | 'user';
```

### 常量

```typescript
// ✅ UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_TIMEOUT = 5000;
const DEFAULT_PAGE_SIZE = 20;
```

### 文件名

```typescript
// ✅ kebab-case（功能文件）
product-service.ts
error-handler.ts
database-utils.ts

// ✅ camelCase（导出对象）
productService.ts
alertService.ts
```

---

## 类型定义

### 导出类型

```typescript
// types/product.ts
export interface Product {
  id: string;
  platform: 'amazon' | 'walmart' | 'ebay' | 'aliexpress';
  asin: string;
  title: string;
  price: number;
  currency: string;
  isMonitoring: boolean;
  createdAt: number;
}

export interface CreateProductInput {
  platform: Product['platform'];
  asin: string;
  productUrl: string;
  title: string;
  price: number;
  currency: string;
  isMonitoring?: boolean;
}

export type UpdateProductInput = Partial<Omit<Product, 'id' | 'createdAt'>>;
```

### 避免 any

```typescript
// ❌ 不要使用 any
function processData(data: any) {
  return data.value; // 没有类型检查
}

// ✅ 使用具体类型
function processData(data: { value: string }) {
  return data.value; // 类型安全
}

// ✅ 或使用 unknown（需要类型检查）
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

---

## 日志规范

### 使用结构化日志

```typescript
import logger from './utils/logger'; // pino

// ✅ 结构化日志
logger.info('Product created', {
  productId: product.id,
  platform: product.platform,
  price: product.price,
});

logger.error('Failed to fetch data', {
  error: error.message,
  stack: error.stack,
  userId,
  productId,
});

// ❌ 不要使用 console.log
console.log('Product created:', product);
```

### 日志级别

- **ERROR**: 需要立即处理的错误
- **WARN**: 潜在问题，但不影响运行
- **INFO**: 重要事件（用户操作、API 调用）
- **DEBUG**: 调试信息（仅开发环境）

---

## 注释规范

### JSDoc 注释

```typescript
/**
 * 根据 ID 获取产品
 * @param id - 产品 ID
 * @returns 产品对象
 * @throws {NotFoundError} 产品不存在时抛出
 */
async getById(id: string): Promise<Product> {
  // 实现
}
```

### 代码注释

```typescript
// ✅ 好的注释：解释"为什么"
// 使用手动迭代而不是 for-await-of，因为 tsx 环境下 for-await-of 无法正常工作
let result = await generator.next();
while (!result.done) {
  // 处理结果
}

// ❌ 差的注释：重复代码
// 创建产品
const product = await productService.create(data);
```

---

## 测试规范

### 文件组织

```
backend/
├── src/
│   └── services/
│       └── productService.ts
└── tests/
    ├── unit/
    │   └── services/
    │       └── productService.test.ts
    └── integration/
        └── routes/
            └── products.test.ts
```

### 测试命名

```typescript
describe('ProductService getById', () => {
  it('should return product when id exists', async () => {
    // 测试
  });

  it('should throw NotFoundError when id does not exist', async () => {
    // 测试
  });
});
```

详见 [测试标准](../quality/testing-standards.md)

---

## 常见模式

### 分页

```typescript
async list(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const items = await db.select()
    .from(products)
    .limit(limit)
    .offset(offset)
    .all();
  
  const totalResult = await db.select({ count: count() })
    .from(products)
    .get();
  
  return {
    items,
    meta: {
      page,
      limit,
      total: totalResult.count,
      totalPages: Math.ceil(totalResult.count / limit),
    },
  };
}
```

### 事务

```typescript
async createWithSnapshot(data: CreateProductInput) {
  return await db.transaction(async (tx) => {
    const product = await tx.insert(products).values(data);
    
    await tx.insert(priceSnapshots).values({
      id: crypto.randomUUID(),
      productId: product.id,
      price: data.price,
      capturedAt: Date.now(),
    });
    
    return product;
  });
}
```

---

## 参考资源

- [后端架构](../architecture/backend-architecture.md)
- [错误处理规范](./error-handling.md)
- [测试标准](../quality/testing-standards.md)
- [TypeScript 规范](./typescript-guidelines.md)

