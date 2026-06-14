## Why

前后端团队反馈 API 文档与实现不同步的问题频繁发生：后端修改 API 后忘记更新文档，导致前端调用失败。需要一个自动化机制确保 API 文档始终与实现保持一致，并提供交互式文档供前端开发人员使用和测试。

## What Changes

- 引入 Zod 作为统一的 schema 定义工具，替换当前的手工验证逻辑
- 创建 `shared/` 目录存放前后端共享的 Zod schemas 和类型定义
- 从 Zod schemas 自动生成 OpenAPI 3.0 规范文档
- 集成 Swagger UI 提供交互式 API 文档界面（`/api-docs`）
- 添加运行时请求/响应验证中间件，确保 API 实现符合 schema 定义
- 迁移前端类型定义到共享 schemas，实现前后端类型一致性
- 重构现有路由使用 Zod 验证中间件

## Capabilities

### New Capabilities
- `shared-schemas`: 前后端共享的 Zod schema 定义，包含所有 API 实体（Product, Alert, PriceSnapshot, AlertRule）的 request/response schemas
- `openapi-generation`: 从 Zod schemas 自动生成 OpenAPI 规范文档的机制
- `swagger-ui`: 基于 OpenAPI spec 的交互式 API 文档界面
- `request-validation`: 使用 Zod 的运行时请求验证中间件
- `response-validation`: 使用 Zod 的运行时响应验证机制（可选，用于开发环境）
- `frontend-type-safety`: 前端直接引用共享 schemas，确保类型安全和前后端一致性

### Modified Capabilities
- `product-api`: 替换手工验证逻辑为 Zod 验证中间件
- `alert-api`: 替换手工验证逻辑为 Zod 验证中间件
- `alert-rule-api`: 添加 Zod schemas 和验证中间件
- `price-snapshot-api`: 添加 Zod schemas 和验证中间件
- `scraper-api`: 添加 Zod schemas 和验证中间件
- `analysis-api`: 添加 Zod schemas 和验证中间件

## Impact

**Backend**:
- 新增依赖：`zod`, `@asteasolutions/zod-to-openapi`, `swagger-ui-express`
- 新增目录：`shared/schemas/`（monorepo 根目录）, `backend/src/openapi/`, `backend/src/middleware/zodValidator.ts`
- 修改文件：`backend/src/routes/*.ts`（6 个路由文件）, `backend/src/app.ts`, `backend/tsconfig.json`
- 删除逻辑：`backend/src/utils/validation.ts` 中的部分手工验证函数将被 Zod 替代

**Frontend**:
- 修改依赖：无新增（已有 `zod`）
- 修改文件：`frontend/src/types/index.ts`, `frontend/src/services/api.ts`, `frontend/tsconfig.json`
- 新增引用：从 `@shared/schemas` 导入类型和 schemas

**API**:
- **无破坏性变更**：API 路径、请求/响应格式保持不变
- **行为变化**：验证错误的错误响应格式将标准化（Zod 错误格式）
- **新增端点**：`GET /api-docs`（Swagger UI）, `GET /api-docs.json`（OpenAPI JSON spec）

**开发流程**:
- 修改 API 时，必须先更新 `shared/schemas/` 中的 Zod schema
- TypeScript 编译时会强制前端代码与 schemas 一致
- 运行时验证会拒绝不符合 schema 的请求
