# 错误处理规范

> **TL;DR**: 所有 async 操作必须有 try-catch。后端错误用 pino 记录，返回统一格式 `{status, error, message, details}`。前端用 Error Boundary 捕获 React 错误，用户看到友好错误消息（不暴露技术细节）。错误消息必须清晰、可操作。

---

## 后端错误处理

### 1. Try-Catch 是强制的

**所有异步操作必须有错误处理**：

```typescript
// ❌ 差 - 未处理错误
app.get('/api/products/:id', async (req, res) => {
  const product = await productService.getById(req.params.id); // 如果失败会崩溃
  res.json(product);
});

// ✅ 好 - 正确的错误处理
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (error) {
    logger.error('Failed to get product', {
      productId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      status: 500,
      error: 'InternalServerError',
      message: 'Failed to retrieve product',
    });
  }
});
```

### 2. 统一错误响应格式

所有错误响应必须遵循统一格式：

```typescript
interface ErrorResponse {
  status: number;          // HTTP 状态码
  error: string;           // 错误类型（CamelCase）
  message: string;         // 用户友好的错误描述
  details?: any;           // 可选：额外的错误详情（如验证错误）
  requestId?: string;      // 可选：请求 ID（用于追踪）
}
```

**示例**：

```typescript
// 400 - 验证错误
{
  "status": 400,
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "field": "price",
    "value": -10,
    "constraint": "Price must be positive"
  }
}

// 404 - 资源不存在
{
  "status": 404,
  "error": "NotFoundError",
  "message": "Product not found"
}

// 500 - 服务器错误
{
  "status": 500,
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

### 3. 自定义错误类

创建语义化的错误类：

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
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'ValidationError', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NotFoundError', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'UnauthorizedError', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, 'ForbiddenError', message);
  }
}
```

**使用**：

```typescript
// Service 层抛出语义化错误
async getById(id: string) {
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

### 4. 全局错误处理中间件

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 记录所有错误
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // 处理 Zod 验证错误
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      error: 'ValidationError',
      message: 'Invalid request data',
      details: err.errors,
    });
  }

  // 处理自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      error: err.errorType,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // 未知错误 - 不暴露细节
  res.status(500).json({
    status: 500,
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    // 开发环境包含错误详情
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack,
    }),
  });
}

// 在 app.ts 中注册（必须在所有路由之后）
app.use(errorHandler);
```

### 5. 异步错误包装器

简化 try-catch 的包装器：

```typescript
// utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用
app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json(product); // 错误会自动传递给 errorHandler
}));
```

### 6. 错误日志记录

使用结构化日志（pino）：

```typescript
import logger from './utils/logger';

try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'someOperation',
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    // 添加上下文信息
    userId: req.user?.id,
    productId: req.params.id,
  });

  throw error; // 重新抛出让上层处理
}
```

---

## 前端错误处理

### 1. Error Boundary

使用 React Error Boundary 捕获组件错误：

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到日志服务
    console.error('React Error Boundary caught:', error, errorInfo);
    
    // 可以发送到错误追踪服务（如 Sentry）
    // sendToErrorTracking(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>出错了</h2>
          <p>抱歉，页面遇到了问题。请刷新页面重试。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* ... */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 2. API 调用错误处理

使用 React Query 处理 API 错误：

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    retry: 3, // 失败重试 3 次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// 组件中使用
function ProductList() {
  const { data, error, isLoading, isError } = useProducts();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="加载失败"
        message={error instanceof Error ? error.message : '无法加载产品列表'}
        onRetry={() => queryClient.invalidateQueries(['products'])}
      />
    );
  }

  return <ProductGrid products={data} />;
}
```

### 3. Toast 通知错误

对于非关键错误，使用 toast 提示：

```typescript
import { toast } from 'sonner';

async function deleteProduct(id: string) {
  try {
    await api.delete(`/products/${id}`);
    toast.success('产品已删除');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(`删除失败: ${error.message}`);
    } else {
      toast.error('删除失败，请重试');
    }
  }
}
```

### 4. 表单验证错误

使用 React Hook Form + Zod：

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, '产品名称不能为空').max(100, '产品名称过长'),
  price: z.number().positive('价格必须为正数'),
});

type ProductForm = z.infer<typeof productSchema>;

function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductForm) => {
    try {
      await api.post('/products', data);
      toast.success('产品已创建');
    } catch (error) {
      toast.error('创建失败');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span className="error">{errors.name.message}</span>}
      
      <input type="number" {...register('price', { valueAsNumber: true })} />
      {errors.price && <span className="error">{errors.price.message}</span>}
      
      <button type="submit">创建</button>
    </form>
  );
}
```

### 5. 全局 Error Handler

```typescript
// App.tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // 捕获未处理的 Promise rejection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      toast.error('发生了意外错误');
      event.preventDefault();
    };

    // 捕获全局错误
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      toast.error('发生了意外错误');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      {/* app content */}
    </ErrorBoundary>
  );
}
```

---

## 错误消息规范

### 用户友好的错误消息

**原则**：
1. **清晰**：用户能理解发生了什么
2. **有帮助**：提示用户如何解决
3. **友好**：不要责怪用户
4. **不暴露技术细节**：不要显示堆栈跟踪、SQL 错误等

### ❌ 差的错误消息

```
"Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: products.asin"
"null is not an object (evaluating 'product.price.toFixed')"
"Request failed with status code 500"
"Something went wrong"
```

### ✅ 好的错误消息

```
"这个产品已经存在，请使用不同的 ASIN"
"产品价格信息缺失，请重新添加产品"
"无法连接到服务器，请检查网络连接"
"保存失败，请稍后重试"
```

### 错误消息模板

| 场景 | 消息模板 |
|------|----------|
| 验证错误 | "{{字段}} {{问题描述}}，{{如何修复}}" |
| 网络错误 | "无法连接到服务器，请检查网络连接后重试" |
| 权限错误 | "您没有权限执行此操作，请联系管理员" |
| 资源不存在 | "{{资源名称}}不存在或已被删除" |
| 服务器错误 | "操作失败，我们已记录此问题，请稍后重试" |

---

## 错误分类与处理策略

### 1. 用户错误（4xx）

**原因**：用户输入错误或违反业务规则

**处理**：
- 显示清晰的错误消息
- 指出具体哪里错了
- 提供修复建议
- 不记录为 ERROR 级别（记录为 WARN）

**示例**：
```typescript
throw new ValidationError('产品价格必须大于 0', {
  field: 'price',
  value: -10,
  suggestion: '请输入有效的价格（大于 0）',
});
```

### 2. 系统错误（5xx）

**原因**：服务器内部错误、数据库故障、外部服务不可用

**处理**：
- 记录完整错误信息（ERROR 级别）
- 向用户显示通用错误消息
- 不暴露技术细节
- 如果可能，提供备用方案

**示例**：
```typescript
try {
  await externalApi.call();
} catch (error) {
  logger.error('External API call failed', { error });
  throw new AppError(
    503,
    'ServiceUnavailable',
    '服务暂时不可用，请稍后重试'
  );
}
```

### 3. 业务逻辑错误

**原因**：违反业务规则（但不是验证错误）

**处理**：
- 使用自定义错误类
- 提供业务上下文
- 帮助用户理解为什么不能执行操作

**示例**：
```typescript
class InsufficientStockError extends AppError {
  constructor(requested: number, available: number) {
    super(
      409,
      'InsufficientStock',
      `库存不足，请求 ${requested} 件，仅剩 ${available} 件`,
      { requested, available }
    );
  }
}
```

---

## 错误处理 Checklist

### 后端 ✅

- [ ] 所有 async 操作有 try-catch
- [ ] 使用统一的错误响应格式
- [ ] 使用自定义错误类
- [ ] 全局错误处理中间件已注册
- [ ] 错误日志包含上下文信息
- [ ] 生产环境不暴露堆栈跟踪
- [ ] 验证错误返回 400 + 详细信息

### 前端 ✅

- [ ] 使用 Error Boundary 捕获 React 错误
- [ ] API 错误使用 React Query 处理
- [ ] 表单验证使用 React Hook Form + Zod
- [ ] 非关键错误使用 Toast 提示
- [ ] 全局错误处理已配置
- [ ] 错误消息用户友好
- [ ] Loading 和 Error 状态有 UI 反馈

---

## 常见问题

### Q: 何时应该记录 ERROR 级别日志？

**A**: 只有系统错误（5xx）记录为 ERROR：
- 数据库连接失败
- 外部 API 调用失败
- 未预期的异常
- 代码 bug

用户错误（4xx）记录为 WARN 或 INFO。

### Q: 错误消息应该多详细？

**A**: 
- **用户看到的消息**：简洁、友好、可操作
- **日志中的消息**：详细、包含所有上下文

### Q: 如何处理第三方库的错误？

**A**: 包装成自定义错误：

```typescript
try {
  await anthropic.messages.create(...);
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    throw new AppError(
      503,
      'AIServiceUnavailable',
      'AI 服务暂时不可用，请稍后重试'
    );
  }
  throw error;
}
```

---

## 参考资源

- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
