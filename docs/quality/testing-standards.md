# 测试标准

> **TL;DR**: 后端覆盖率≥85%（分支≥75%），前端≥80%（分支≥70%）。遵循测试金字塔（60% 单元、30% 集成、10% E2E）。核心业务逻辑必须 100% 覆盖。使用 `describe('[Module] [Function]')` 和 `it('should [action] when [condition]')` 命名规范。

---

## 覆盖率标准

### 后端目标

| 指标 | 最低要求 |
|------|----------|
| 语句覆盖率 (Statement) | ≥ 85% |
| 分支覆盖率 (Branch) | ≥ 75% |
| 函数覆盖率 (Function) | ≥ 85% |
| 行覆盖率 (Line) | ≥ 85% |

### 前端目标

| 指标 | 最低要求 |
|------|----------|
| 语句覆盖率 (Statement) | ≥ 80% |
| 分支覆盖率 (Branch) | ≥ 70% |
| 函数覆盖率 (Function) | ≥ 80% |
| 行覆盖率 (Line) | ≥ 80% |

**注意**: 这些是最低标准。新代码应该力争更高覆盖率，特别是关键路径代码。

---

## 测试金字塔

遵循测试金字塔原则，保持合理的测试分布：

```
                    ┌──────┐
                    │  E2E │  10%
                    │ Tests│  慢、脆弱、昂贵
                    └──────┘
                ┌──────────────┐
                │ Integration  │  30%
                │    Tests     │  中速、中等成本
                └──────────────┘
            ┌──────────────────────┐
            │     Unit Tests       │  60%
            │    快速、稳定、便宜    │
            └──────────────────────┘
```

### 各层级测试职责

**单元测试 (Unit Tests) - 60%**
- 测试单个函数/方法的逻辑
- 隔离外部依赖（使用 mock/stub）
- 快速执行（毫秒级）
- 示例：`productService.calculateDiscount()` 的各种输入场景

**集成测试 (Integration Tests) - 30%**
- 测试多个模块协作
- 使用真实数据库（测试环境）
- 测试 API 端点（含完整请求/响应）
- 示例：`POST /api/products` → 数据库插入 → 返回 201

**端到端测试 (E2E Tests) - 10%**
- 测试完整用户流程
- 使用真实浏览器（Playwright/Cypress）
- 测试关键业务路径
- 示例：用户添加产品 → 设置警报 → 触发通知

---

## 必须测试的场景

以下场景必须有 **100% 覆盖率**：

### 1. 核心业务逻辑
- 价格计算、折扣逻辑
- 警报触发规则
- 数据验证和转换

### 2. 所有 API 端点
- 成功场景（200/201/204）
- 错误场景（400/404/500）
- 输入验证失败（400）
- 认证/授权失败（401/403）

### 3. 数据验证逻辑
- Schema 验证（Zod）
- 边界条件（最小值、最大值、空值）
- 类型错误

### 4. 错误处理路径
- Try-catch 块
- 错误恢复逻辑
- 错误消息正确性

### 5. 边界条件
- 空数组/对象
- null/undefined
- 极大/极小数值
- 特殊字符

---

## 测试命名规范

### Describe 块命名

格式：`[Module] [Function/Component]`

```typescript
describe('ProductService calculateDiscount', () => {
  // 测试用例
});

describe('ChatPage', () => {
  // 组件测试
});
```

### It 块命名

格式：`should [expected behavior] when [condition]`

```typescript
it('should return 10% discount when product is on sale', () => {
  // 测试实现
});

it('should throw ValidationError when price is negative', () => {
  // 测试实现
});
```

### 反例（避免）

❌ 模糊描述：
```typescript
it('works correctly', () => {});
it('test discount', () => {});
```

✅ 清晰描述：
```typescript
it('should calculate correct discount amount', () => {});
it('should return zero discount for regular products', () => {});
```

---

## 测试组织结构

### 后端测试

```
backend/
├── src/
│   ├── services/
│   │   └── productService.ts
│   └── routes/
│       └── products.ts
└── tests/
    ├── unit/
    │   └── services/
    │       └── productService.test.ts
    └── integration/
        └── routes/
            └── products.test.ts
```

### 前端测试

```
frontend/
└── src/
    ├── components/
    │   ├── ProductCard.tsx
    │   └── ProductCard.test.tsx
    └── pages/
        ├── Dashboard.tsx
        └── Dashboard.test.tsx
```

---

## 测试最佳实践

### 1. AAA 模式

每个测试遵循 Arrange-Act-Assert：

```typescript
it('should create product with valid data', async () => {
  // Arrange - 准备测试数据
  const productData = { name: 'Test Product', price: 100 };
  
  // Act - 执行被测试的操作
  const result = await productService.create(productData);
  
  // Assert - 验证结果
  expect(result.name).toBe('Test Product');
  expect(result.price).toBe(100);
});
```

### 2. 测试隔离

每个测试应该独立，不依赖其他测试：

```typescript
// ✅ 好 - 每个测试独立准备数据
describe('ProductService', () => {
  beforeEach(() => {
    // 每个测试前清理数据库
    cleanDatabase();
  });

  it('should create product', () => {
    // 测试 A
  });

  it('should update product', () => {
    // 测试 B - 不依赖测试 A
  });
});
```

### 3. 使用有意义的测试数据

```typescript
// ❌ 差 - 数据没有意义
const user = { name: 'aaa', age: 1 };

// ✅ 好 - 数据有语义
const user = { name: 'John Doe', age: 25 };
```

### 4. 一个测试一个断言（概念）

每个测试应该验证一个概念，但可以有多个 assert：

```typescript
// ✅ 好 - 验证"用户创建"这一个概念
it('should create user with correct properties', () => {
  const user = createUser({ name: 'John', email: 'john@example.com' });
  
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

---

## 运行测试

### 后端

```bash
# 运行所有测试
npm test

# 监听模式（开发时）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- productService.test.ts
```

### 前端

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# UI 模式（Vitest）
npm run test:ui
```

---

## 测试覆盖率报告

覆盖率报告会自动生成在：
- 后端：`backend/coverage/`
- 前端：`frontend/coverage/`

打开 `coverage/index.html` 查看详细报告。

### 阅读覆盖率报告

- **绿色**：覆盖的代码
- **红色**：未覆盖的代码
- **黄色**：部分覆盖（分支未完全覆盖）

**优先修复红色部分**，特别是核心业务逻辑。

---

## Mock 和 Stub 指南

### 何时使用 Mock

- 外部 API 调用（AI provider、爬虫服务）
- 数据库操作（单元测试时）
- 文件系统操作
- 时间相关操作（`Date.now()`）

### Mock 示例

```typescript
import { vi } from 'vitest';

describe('ChatService', () => {
  it('should call AI provider with correct params', async () => {
    // Mock AI provider
    const mockProvider = {
      streamMessage: vi.fn().mockResolvedValue(mockResponse),
    };

    const service = new ChatService(mockProvider);
    await service.sendMessage('Hello');

    expect(mockProvider.streamMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Hello' })
    );
  });
});
```

---

## CI/CD 集成

测试会在 CI/CD 流程中自动运行：

1. **Pull Request 阶段**
   - 运行所有测试
   - 检查覆盖率是否达标
   - 未达标则 PR 无法合并

2. **合并到 main 后**
   - 再次运行测试
   - 生成覆盖率徽章
   - 更新 README 状态

详见 [质量门禁](./quality-gates.md)。

---

## 常见问题

### Q: 某些代码难以测试怎么办？

**A**: 重构代码使其更易测试。通常难以测试的代码是设计问题的信号：
- 函数职责太多 → 拆分
- 依赖太紧耦合 → 注入依赖
- 副作用太多 → 隔离副作用

### Q: 测试运行太慢怎么办？

**A**: 
1. 使用 `.only()` 运行单个测试
2. 检查是否有不必要的 E2E 测试（改为集成测试）
3. 并行运行测试（Vitest 默认并行）
4. Mock 慢速操作（数据库、网络）

### Q: 如何测试异步代码？

**A**: 使用 `async/await`：

```typescript
it('should fetch data successfully', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Q: 如何测试错误场景？

**A**: 使用 `expect().rejects` 或 try-catch：

```typescript
it('should throw error when data is invalid', async () => {
  await expect(service.create(invalidData)).rejects.toThrow('Validation failed');
});
```

---

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [测试金字塔原理](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Jest Mock 指南](https://jestjs.io/docs/mock-functions)
