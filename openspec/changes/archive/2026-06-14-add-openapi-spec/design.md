## Context

当前项目是一个价格监控系统，采用前后端分离架构：
- **Backend**: Express 5 + TypeScript 6 + Drizzle ORM + SQLite
- **Frontend**: React 19 + TypeScript 6 + Axios + Zod 4.4.3 + TanStack Query

**现状**：
- Backend 使用手工编写的验证逻辑（`utils/validation.ts`）
- Frontend 使用手写的 TypeScript interface 定义类型（`types/index.ts`）
- 前后端类型定义存在不一致（如 `reviewCount` vs `reviewsCount`）
- API 文档缺失，前端开发依赖阅读后端代码或口头沟通
- 修改 API 后容易忘记同步更新前端类型定义

**约束**：
- 不能破坏现有 API 路径和请求/响应格式
- 需要保持现有的 AppError 和 errorHandler 机制
- 前端已经在使用 Zod（用于表单验证），团队熟悉该工具
- 需要最小化迁移成本，支持逐步迁移

## Goals / Non-Goals

**Goals:**
- 建立单一数据源（Single Source of Truth）的 schema 定义机制
- 自动生成并维护最新的 OpenAPI 3.0 规范文档
- 提供交互式 API 文档界面（Swagger UI）供前端团队使用和测试
- 实现前后端类型自动同步，消除手动维护类型定义的负担
- 在运行时自动验证请求/响应，确保实现与文档一致
- 支持逐步迁移，不需要一次性重写所有代码

**Non-Goals:**
- 不改变现有的 API 路径、HTTP 方法或响应格式
- 不引入 API 版本控制（v1, v2）机制
- 不实现 API 认证/授权系统（留待后续）
- 不生成客户端 SDK（暂时通过类型共享实现类型安全）
- 不迁移到其他 Web 框架（如 tRPC, NestJS）

## Decisions

### Decision 1: Zod 作为 Schema 定义工具

**选择**: 使用 Zod 定义所有数据 schemas

**理由**:
- ✅ 前端已有 Zod 依赖，团队熟悉，零学习成本
- ✅ TypeScript-first 设计，完美的类型推导
- ✅ 运行时验证 + 编译时类型安全
- ✅ 与 React Hook Form 无缝集成（已在使用 `@hookform/resolvers`）
- ✅ `@asteasolutions/zod-to-openapi` 提供成熟的 OpenAPI 生成方案

**替代方案**:
- **TypeScript interfaces + JSON Schema**: 需要手动维护两套定义，容易不同步
- **class-validator**: 基于装饰器，需要重构现有代码结构，学习成本高
- **Joi**: 纯运行时验证，缺少编译时类型推导
- **手写 OpenAPI YAML**: 需要手动同步代码和文档，维护成本高

### Decision 2: Monorepo 结构与 Shared Package

**选择**: 在项目根目录创建 `shared/` 目录存放共享 schemas

**结构**:
```
project-root/
  ├─ shared/
  │   ├─ package.json          (name: "@shared/schemas")
  │   ├─ schemas/
  │   │   ├─ product.schema.ts
  │   │   ├─ alert.schema.ts
  │   │   ├─ alertRule.schema.ts
  │   │   ├─ priceSnapshot.schema.ts
  │   │   └─ index.ts
  │   └─ tsconfig.json
  ├─ backend/
  └─ frontend/
```

**理由**:
- ✅ TypeScript path mapping (`@shared/*`) 实现零配置引用
- ✅ 前后端导入相同的 schema 源代码，保证 100% 一致
- ✅ 轻量级方案，无需配置 pnpm workspaces 或 Lerna
- ✅ 支持未来扩展为独立 npm 包

**替代方案**:
- **Backend 导出 schemas 给 Frontend**: 违反依赖方向，前端不应依赖后端
- **Frontend 和 Backend 各自维护**: 又回到类型不同步的问题
- **独立 npm 包**: 初期 overhead 过大，发布流程复杂

### Decision 3: 代码生成 vs 手写 OpenAPI

**选择**: 从 Zod schemas 自动生成 OpenAPI 规范

**方案**: `@asteasolutions/zod-to-openapi` + 运行时注册

**理由**:
- ✅ Schema 即文档，修改 schema 自动更新 OpenAPI
- ✅ 消除文档与实现不同步的可能性
- ✅ TypeScript 编译时检查确保注册的 schemas 存在

**实现方式**:
```typescript
// backend/src/openapi/registry.ts
const registry = new OpenAPIRegistry();

registry.register('Product', productResponseSchema);

registry.registerPath({
  method: 'post',
  path: '/api/products',
  request: { body: { content: { 'application/json': { schema: createProductSchema } } } },
  responses: { 201: { schema: productResponseSchema } }
});

export const spec = generator.generateDocument({...});
```

**替代方案**:
- **手写 openapi.yaml**: 需要手动同步，容易遗忘
- **swagger-jsdoc**: 基于 JSDoc 注释，文档分散在代码中，难以维护
- **tsoa**: 需要装饰器重构所有路由，改动量大

### Decision 4: 验证中间件设计

**选择**: 创建轻量级 Zod 验证中间件

**接口**:
```typescript
// backend/src/middleware/zodValidator.ts
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors);
      }
      next(error);
    }
  };
}
```

**使用方式**:
```typescript
router.post('/', validateRequest(createProductSchema), async (req, res) => {
  // req.body 已经是类型安全且验证过的
});
```

**理由**:
- ✅ 遵循 Express 中间件模式，与现有架构一致
- ✅ 集成现有的 AppError 错误处理机制
- ✅ 支持异步验证（如数据库唯一性检查）
- ✅ TypeScript 自动推导 req.body 类型

**替代方案**:
- **express-validator**: API 设计过时，链式调用不如 Zod 简洁
- **express-openapi-validator**: 依赖 YAML 文件，不是代码优先

### Decision 5: 前端类型安全策略

**选择**: 前端直接导入 shared schemas，使用 `z.infer` 获取类型

**实现**:
```typescript
// frontend/src/types/index.ts
export type { Product, CreateProduct } from '@shared/schemas/product.schema';

// frontend/src/services/api.ts
import type { Product, CreateProduct } from '@shared/schemas/product.schema';

export const productsApi = {
  create: (data: CreateProduct) => api.post<Product>('/products', data),
};
```

**理由**:
- ✅ 类型定义来源于 schemas，保证与后端完全一致
- ✅ Schema 修改后，前端 TypeScript 编译失败会立即发现不兼容
- ✅ 可选择性地在前端使用 schema 进行预验证（减少无效请求）

**表单验证**:
```typescript
// frontend/src/components/products/ProductForm.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@shared/schemas/product.schema';

const { handleSubmit } = useForm({
  resolver: zodResolver(createProductSchema), // 前后端相同的验证逻辑
});
```

### Decision 6: 响应验证策略

**选择**: 仅在开发环境启用响应验证，生产环境禁用

**理由**:
- ✅ 开发时捕获 API 实现与 schema 不一致的问题
- ✅ 生产环境避免验证开销，保持性能
- ⚠️ 响应验证失败时记录警告但不阻断响应（避免影响用户）

**实现**:
```typescript
if (process.env.NODE_ENV === 'development') {
  app.use(responseValidationMiddleware);
}
```

### Decision 7: 迁移策略

**选择**: 逐步迁移，优先级从高到低

**阶段 1: 基础设施（Phase 1）**
1. 创建 `shared/` 目录和 package.json
2. 配置 TypeScript path mapping
3. 安装必要依赖

**阶段 2: 核心 schemas（Phase 2）**
1. 迁移 Product schema（最常用的 API）
2. 创建验证中间件
3. 改造 Products 路由
4. 配置 OpenAPI 生成器和 Swagger UI
5. **验证点**: 访问 `/api-docs`，测试 Product API

**阶段 3: 其他 schemas（Phase 3）**
1. 迁移 Alert, AlertRule, PriceSnapshot schemas
2. 改造对应路由
3. 更新 OpenAPI 注册

**阶段 4: 前端集成（Phase 4）**
1. 更新前端类型定义
2. 改造 API client
3. 迁移表单验证（从手写验证到 Zod）

## Risks / Trade-offs

### Risk 1: Shared Package 的依赖管理
**Risk**: Frontend 和 Backend 使用的 Zod 版本不一致可能导致类型不匹配

**Mitigation**:
- 在 `shared/package.json` 中指定 Zod 版本为 `peerDependency`
- 在根目录添加脚本检查 Frontend/Backend 的 Zod 版本一致性
- 使用 `npm list zod` 定期检查

### Risk 2: TypeScript Path Mapping 在运行时不生效
**Risk**: `@shared/*` 在编译时正常，运行时找不到模块

**Mitigation**:
- Backend: 使用 `tsx` 或 `ts-node` 运行时支持 path mapping
- 生产构建: 使用 `tsc-alias` 或在 `tsconfig.json` 中配置正确的 `outDir` 和相对路径
- 或者使用符号链接：`ln -s ../shared backend/node_modules/@shared`

### Risk 3: Zod 验证错误格式与现有错误处理不兼容
**Risk**: 前端期望特定的错误格式，Zod 错误可能导致前端解析失败

**Mitigation**:
- 在 `zodValidator` 中间件中将 Zod 错误转换为 AppError 格式
- 保持 `{ code, message, details }` 结构不变
- 将 `error.errors` 数组映射到 `details` 字段

### Risk 4: OpenAPI 生成器覆盖不完整
**Risk**: 某些复杂的 Zod schema 可能无法正确转换为 OpenAPI

**Mitigation**:
- 优先使用 `@asteasolutions/zod-to-openapi` 支持的 schema 类型
- 对于复杂场景（如 discriminated unions），使用 `.openapi()` 方法手动指定 OpenAPI 属性
- 保留手写 OpenAPI 的能力作为后备方案

### Risk 5: 前端构建体积增加
**Risk**: 引入 shared schemas 可能增加前端 bundle 大小（特别是 Zod）

**Mitigation**:
- Zod 本身很轻量（~8KB gzipped），前端已有该依赖
- 只导入需要的 schemas，避免 `import * as schemas`
- 使用 Tree-shaking 确保未使用的 schemas 不被打包
- 如果未来需要，可以只导出类型（`export type`），不导出 Zod validators

### Risk 6: 逐步迁移期间的不一致性
**Risk**: 迁移期间部分路由使用 Zod，部分使用旧验证，可能造成混乱

**Mitigation**:
- 按照路由组逐个迁移（Products → Alerts → ...），不跨组混合
- 迁移完成的路由在代码注释中标记 `// Zod validated`
- 创建 checklist 跟踪迁移进度
- 保留旧的 `validation.ts` 直到所有路由迁移完成

### Trade-off 1: 响应验证的成本
**Trade-off**: 响应验证增加开发时的性能开销

**Decision**: 仅在开发环境启用，且只记录警告不阻断响应

**Rationale**:
- 开发环境性能不敏感
- 早期发现实现与 schema 不一致的问题，避免 bug 流入生产
- 生产环境完全禁用，无性能影响

### Trade-off 2: Monorepo 复杂度 vs 类型一致性
**Trade-off**: 引入 shared package 增加了项目结构复杂度

**Decision**: 接受轻量级的 monorepo 结构

**Rationale**:
- 复杂度增加有限（只是一个额外目录 + TypeScript path mapping）
- 收益巨大（前后端类型 100% 同步，消除手动维护）
- 未来可以平滑过渡到 pnpm workspaces 或独立 npm 包

## Migration Plan

### Phase 1: Infrastructure Setup
1. 创建 `shared/` 目录结构
2. 配置 `shared/package.json` 和 `shared/tsconfig.json`
3. 在 `backend/tsconfig.json` 和 `frontend/tsconfig.json` 中添加 path mapping
4. 安装依赖：
   - Backend: `npm install zod @asteasolutions/zod-to-openapi swagger-ui-express`
   - Frontend: 无需新增（已有 Zod）

### Phase 2: Backend Core Implementation
1. 创建 `backend/src/middleware/zodValidator.ts`
2. 创建 `shared/schemas/product.schema.ts`（第一个示例）
3. 改造 `backend/src/routes/products.ts` 使用 Zod 验证
4. 创建 `backend/src/openapi/registry.ts` 注册 Product schemas
5. 创建 `backend/src/openapi/swagger.ts` 配置 Swagger UI
6. 在 `backend/src/app.ts` 中启用 Swagger UI
7. **验证**: 访问 `http://localhost:3000/api-docs`，测试 Product API

### Phase 3: Remaining Schemas
1. 创建其余 schemas（Alert, AlertRule, PriceSnapshot, Analysis）
2. 改造对应路由文件
3. 更新 OpenAPI registry
4. **验证**: 所有 API 端点在 Swagger UI 中正确显示

### Phase 4: Frontend Integration
1. 更新 `frontend/tsconfig.json` path mapping
2. 修改 `frontend/src/types/index.ts` 引用 shared types
3. 更新 `frontend/src/services/api.ts` 使用 shared types
4. 迁移 `ProductForm` 使用 `zodResolver`
5. **验证**: 前端编译通过，类型检查正确

### Phase 5: Cleanup
1. 删除 `backend/src/utils/validation.ts` 中已被替代的函数
2. 删除 `frontend/src/types/index.ts` 中已被替代的 interface
3. 更新文档和 README

### Rollback Strategy
如果迁移过程中发现严重问题：
1. **Phase 1-2**: 删除 `shared/` 目录，恢复 `tsconfig.json`
2. **Phase 3-4**: 使用 git revert 恢复修改的路由文件
3. **关键点**: 在每个 Phase 结束后创建 git tag，便于回滚

### Testing Strategy
- **单元测试**: 为每个 schema 编写测试，验证验证规则
- **集成测试**: 使用 supertest 测试 API 端点的验证行为
- **E2E 测试**: 前端表单提交测试，确保前后端验证一致

## Open Questions

1. **是否需要 API 版本控制？**
   - 当前方案不引入版本控制，所有 API 保持在 `/api/*`
   - 未来如果需要破坏性变更，可以引入 `/api/v2/*`

2. **响应验证是否需要更强的执行？**
   - 当前设计：开发环境记录警告，生产环境禁用
   - 可选：开发环境验证失败时抛出错误，强制修复

3. **是否需要自动生成前端 API Client？**
   - 当前：手写 API client + 共享类型
   - 未来：可以考虑使用 `openapi-typescript-codegen` 生成 Axios client

4. **是否需要 Schema 版本控制？**
   - 当前：单一 schema 文件，所有代码引用同一版本
   - 未来：如果需要支持多版本 API，可以使用 `schemas/v1/`, `schemas/v2/` 结构
