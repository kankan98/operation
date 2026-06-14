# 性能标准

> **TL;DR**: API 响应时间目标：简单查询 ≤200ms、复杂查询 ≤1s、数据处理 ≤3s。前端 Core Web Vitals：LCP ≤2.5s、FID ≤100ms、CLS ≤0.1。数据库查询必须使用索引，避免 N+1 问题。

---

## API 性能目标

### 响应时间标准

| 操作类型 | 目标时间 | 说明 | 示例 |
|---------|---------|------|------|
| 简单查询 | ≤ 200ms | 单表查询，带索引 | GET /api/products/:id |
| 复杂查询 | ≤ 1s | 多表 JOIN，聚合计算 | GET /api/analysis/price-stats/:id |
| 数据处理 | ≤ 3s | 批量操作，外部 API 调用 | POST /api/scraper/product/:id |
| 流式响应 | 首字节 ≤ 500ms | SSE/WebSocket 初始响应 | GET /api/chat/sessions/:id/stream |

### 性能分级

- **优秀** (Good): 在目标时间内
- **需要改进** (Needs Improvement): 超过目标 50%（如简单查询 300ms）
- **差** (Poor): 超过目标 100%（如简单查询 400ms+）

**原则**: 90% 的请求应该在"优秀"范围内。

---

## 前端性能指标

### Core Web Vitals

遵循 Google Core Web Vitals 标准：

#### 1. LCP (Largest Contentful Paint) - 最大内容绘制

**目标**: ≤ 2.5 秒

**含义**: 页面主要内容加载完成的时间

**优化方法**:
- 优化图片（WebP 格式、懒加载）
- 减少阻塞渲染的资源
- 使用 CDN 加速静态资源

#### 2. FID (First Input Delay) - 首次输入延迟

**目标**: ≤ 100 毫秒

**含义**: 用户首次交互到浏览器响应的时间

**优化方法**:
- 减少主线程长任务
- 代码拆分（Code Splitting）
- 使用 Web Worker 处理计算密集任务

#### 3. CLS (Cumulative Layout Shift) - 累积布局偏移

**目标**: ≤ 0.1

**含义**: 页面视觉稳定性（是否突然移动）

**优化方法**:
- 为图片/视频设置尺寸属性
- 避免在已有内容上方插入内容
- 使用骨架屏（Skeleton）

### 其他关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| FCP (First Contentful Paint) | ≤ 1.5s | 首次内容绘制 |
| TTI (Time to Interactive) | ≤ 3.5s | 可交互时间 |
| Bundle Size (Initial) | ≤ 200KB (gzipped) | 初始 JS 包大小 |
| Total Bundle Size | ≤ 500KB (gzipped) | 总 JS 包大小 |

---

## 数据库性能优化

### 1. 使用索引

**必须添加索引的字段**:
- 主键（自动索引）
- 外键
- 频繁查询的字段（WHERE 条件）
- 排序字段（ORDER BY）
- JOIN 字段

**示例**:
```typescript
// Drizzle schema
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(), // 频繁查询 - 添加索引
  createdAt: integer('created_at').notNull(), // 排序字段 - 添加索引
}, (table) => ({
  platformIdx: index('platform_idx').on(table.platform),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));
```

### 2. 避免 N+1 查询

**❌ 差的做法**:
```typescript
// N+1 问题：1 次查询产品 + N 次查询价格快照
const products = await db.select().from(products).all();
for (const product of products) {
  const snapshots = await db.select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.productId, product.id))
    .all(); // 这里每次循环都查询一次数据库！
}
```

**✅ 好的做法**:
```typescript
// 1 次查询获取所有数据
const productsWithSnapshots = await db.select()
  .from(products)
  .leftJoin(priceSnapshots, eq(products.id, priceSnapshots.productId))
  .all();
```

或使用 Drizzle 的关系查询：
```typescript
const productsWithSnapshots = await db.query.products.findMany({
  with: {
    snapshots: true,
  },
});
```

### 3. 使用分页

**❌ 不要一次性查询所有数据**:
```typescript
const allProducts = await db.select().from(products).all(); // 可能返回 10,000 条
```

**✅ 使用分页**:
```typescript
const page = 1;
const limit = 20;
const products = await db.select()
  .from(products)
  .limit(limit)
  .offset((page - 1) * limit)
  .all();
```

### 4. 选择需要的字段

**❌ 不要 SELECT ***:
```typescript
const products = await db.select().from(products).all(); // 返回所有字段
```

**✅ 只选择需要的字段**:
```typescript
const products = await db.select({
  id: products.id,
  name: products.name,
  price: products.price,
}).from(products).all();
```

---

## 前端优化最佳实践

### 1. 代码拆分（Code Splitting）

使用 React 懒加载：

```typescript
// ❌ 所有组件都打包在一起
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Alerts from './pages/Alerts';

// ✅ 按需加载
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Alerts = lazy(() => import('./pages/Alerts'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. 图片优化

```typescript
// ✅ 使用 WebP 格式
<img src="/images/product.webp" alt="Product" />

// ✅ 懒加载
<img src="/images/product.webp" loading="lazy" alt="Product" />

// ✅ 响应式图片
<img
  srcSet="/images/product-320w.webp 320w,
          /images/product-640w.webp 640w,
          /images/product-1280w.webp 1280w"
  sizes="(max-width: 600px) 320px,
         (max-width: 1200px) 640px,
         1280px"
  src="/images/product-640w.webp"
  alt="Product"
/>
```

### 3. 虚拟化长列表

对于超过 100 条的列表，使用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function ProductList({ products }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 每行高度
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. 防抖和节流

对于频繁触发的事件（搜索、滚动），使用防抖或节流：

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      // 执行搜索
      searchProducts(value);
    },
    500 // 500ms 防抖
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search products..."
    />
  );
}
```

### 5. 缓存策略

使用 React Query 的智能缓存：

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['products', page],
  queryFn: () => fetchProducts(page),
  staleTime: 5 * 60 * 1000, // 5 分钟内认为数据新鲜
  cacheTime: 10 * 60 * 1000, // 10 分钟后从缓存中移除
});
```

---

## 性能监控

### 后端监控

#### 1. API 响应时间

使用中间件记录每个请求的响应时间：

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
    
    // 警告慢请求
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
      });
    }
  });
  
  next();
});
```

#### 2. 数据库慢查询日志

```typescript
// 记录执行时间超过 500ms 的查询
const slowQueryThreshold = 500;

db.$on('query', (e) => {
  if (e.duration > slowQueryThreshold) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});
```

### 前端监控

#### 1. Web Vitals 监控

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // 发送到分析服务
  console.log(metric);
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

#### 2. Bundle Size 分析

```bash
# Vite 构建分析
npm run build -- --analyze

# 查看 bundle 组成
npx vite-bundle-visualizer
```

---

## 性能测试

### 后端性能测试

使用 Apache Bench 或 k6 进行负载测试：

```bash
# 简单负载测试
ab -n 1000 -c 10 http://localhost:3001/api/products

# k6 负载测试
k6 run loadtest.js
```

loadtest.js:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10, // 10 个虚拟用户
  duration: '30s',
};

export default function () {
  let response = http.get('http://localhost:3001/api/products');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

### 前端性能测试

使用 Lighthouse 进行性能审计：

```bash
# 安装 Lighthouse CI
npm install -g @lhci/cli

# 运行审计
lhci autorun --collect.url=http://localhost:3000
```

---

## 性能优化 Checklist

### 后端 ✅

- [ ] 所有数据库查询使用索引
- [ ] 避免 N+1 查询问题
- [ ] API 返回使用分页
- [ ] 慢查询日志监控（> 500ms）
- [ ] 使用缓存（Redis/In-memory）
- [ ] 压缩响应（gzip）
- [ ] 异步处理耗时操作

### 前端 ✅

- [ ] 代码拆分（懒加载路由）
- [ ] 图片优化（WebP + 懒加载）
- [ ] 长列表虚拟化（> 100 条）
- [ ] 防抖/节流频繁事件
- [ ] React Query 缓存
- [ ] Bundle size < 200KB (initial)
- [ ] Core Web Vitals 达标

### 数据库 ✅

- [ ] 频繁查询字段有索引
- [ ] 外键有索引
- [ ] 查询只返回需要的字段
- [ ] 使用 EXPLAIN 分析查询计划

---

## 常见性能问题

### 问题 1: API 响应慢

**症状**: 某些端点响应时间 > 1s

**排查步骤**:
1. 查看日志，确定慢在哪里（数据库？外部 API？）
2. 如果是数据库，使用 EXPLAIN 分析查询
3. 检查是否有 N+1 问题
4. 检查是否缺少索引

### 问题 2: 前端加载慢

**症状**: 页面首屏加载 > 3s

**排查步骤**:
1. 运行 Lighthouse 审计
2. 检查 Bundle Size（> 500KB 需要拆分）
3. 检查是否有大图片（> 200KB 需要压缩）
4. 检查是否有阻塞渲染的资源

### 问题 3: 内存泄漏

**症状**: 应用运行一段时间后变慢或崩溃

**排查步骤**:
1. 使用 Chrome DevTools Memory Profiler
2. 检查是否有未清理的事件监听器
3. 检查是否有未取消的定时器
4. 检查 React Query 缓存是否过大

---

## 参考资源

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [React Performance 优化](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [SQLite 性能优化](https://www.sqlite.org/optoverview.html)
