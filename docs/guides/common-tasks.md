# 常见任务指南

> **TL;DR**: 添加 API 端点按 Schema→Service→Route 顺序。添加 React 组件放 components/ 或 pages/。数据库变更用 drizzle-kit generate + migrate。集成外部 API 在 services/ 封装。

---

## 添加 API 端点

### 示例：添加产品分类功能

#### 1. 定义数据表

```typescript
// backend/src/db/schema.ts
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  slugIdx: index('slug_idx').on(table.slug),
}));
```

生成并运行迁移：
```bash
cd backend
npm run db:generate
npm run db:migrate
```

#### 2. 创建 Service

```typescript
// backend/src/services/categoryService.ts
import { db } from '../db';
import { categories } from '../db/schema';

export const categoryService = {
  async getAll() {
    return db.select().from(categories).all();
  },
  
  async create(data: { name: string; slug: string }) {
    const category = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now(),
    };
    await db.insert(categories).values(category);
    return category;
  },
};
```

#### 3. 创建 Routes

```typescript
// backend/src/routes/categories.ts
import { Router } from 'express';
import { z } from 'zod';
import { categoryService } from '../services/categoryService';

const router = Router();

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

router.get('/', async (req, res) => {
  const categories = await categoryService.getAll();
  res.json(categories);
});

router.post('/', async (req, res) => {
  const validated = CreateCategorySchema.parse(req.body);
  const category = await categoryService.create(validated);
  res.status(201).json(category);
});

export default router;
```

#### 4. 注册路由

```typescript
// backend/src/app.ts
import categoryRoutes from './routes/categories';

app.use('/api/categories', categoryRoutes);
```

#### 5. 编写测试

```typescript
// backend/tests/integration/categories.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/categories', () => {
  it('should create a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Electronics', slug: 'electronics' });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Electronics');
  });
});
```

---

## 添加 React 组件

### 示例：创建产品卡片组件

#### 1. 创建组件文件

```tsx
// frontend/src/components/ProductCard.tsx
interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    platform: string;
  };
  onDelete?: (id: string) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-lg">{product.title}</h3>
      <p className="text-gray-600">
        {product.currency} {product.price}
      </p>
      <span className="text-sm text-gray-500">{product.platform}</span>
      {onDelete && (
        <button
          onClick={() => onDelete(product.id)}
          className="mt-2 text-red-500 hover:text-red-700"
        >
          删除
        </button>
      )}
    </div>
  );
}
```

#### 2. 添加测试

```tsx
// frontend/src/components/ProductCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    price: 99.99,
    currency: 'USD',
    platform: 'amazon',
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('USD 99.99')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<ProductCard product={mockProduct} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByText('删除'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

#### 3. 在页面中使用

```tsx
// frontend/src/pages/Products.tsx
import ProductCard from '../components/ProductCard';

export default function Products() {
  const { data: products } = useProducts();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 数据库 Schema 变更

### 添加新字段

```typescript
// 1. 修改 schema
export const products = sqliteTable('products', {
  // 现有字段...
  description: text('description'),  // 新增
  imageUrl: text('image_url'),       // 新增
});

// 2. 生成迁移
npm run db:generate

// 3. 运行迁移
npm run db:migrate
```

### 修改现有字段

```typescript
// 如果要修改字段类型或约束，需要：
// 1. 创建新字段
// 2. 迁移数据
// 3. 删除旧字段

// 详细步骤参考 Drizzle 文档
```

---

## 集成外部 API

### 示例：集成新的 AI Provider

#### 1. 创建 Provider 接口

```typescript
// backend/src/services/ai/types.ts
export interface AIProvider {
  streamMessage(messages: Message[]): AsyncGenerator<Chunk>;
}
```

#### 2. 实现 Provider

```typescript
// backend/src/services/ai/openaiProvider.ts
import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async *streamMessage(messages: Message[]): AsyncGenerator<Chunk> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      yield {
        type: 'text',
        text: chunk.choices[0]?.delta?.content || '',
      };
    }
  }
}
```

#### 3. 注册 Provider

```typescript
// backend/src/services/ai/index.ts
import { AnthropicProvider } from './anthropicProvider';
import { OpenAIProvider } from './openaiProvider';

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
```

---

## 添加环境变量

```bash
# 1. 在 .env.example 添加说明
OPENAI_API_KEY=your-openai-key-here

# 2. 在 .env 添加实际值
OPENAI_API_KEY=sk-xxx

# 3. 在 config 中验证
// backend/src/config/index.ts
if (process.env.AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}
```

---

## 添加新的 npm 脚本

```json
// package.json
{
  "scripts": {
    "db:reset": "rm -f data/ecommerce.db && npm run db:migrate",
    "db:seed": "tsx src/scripts/seed.ts",
    "lint:fix": "eslint . --fix"
  }
}
```

---

## 常用命令参考

### 后端

```bash
npm run dev           # 启动开发服务器
npm test              # 运行测试
npm run test:watch    # 监听模式测试
npm run db:generate   # 生成数据库迁移
npm run db:migrate    # 运行迁移
npm run db:studio     # 打开 Drizzle Studio
npm run lint          # 检查代码规范
npm run build         # 构建生产版本
```

### 前端

```bash
npm run dev           # 启动开发服务器
npm test              # 运行测试
npm run build         # 构建生产版本
npm run preview       # 预览生产构建
npm run lint          # 检查代码规范
```

