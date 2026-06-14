## Context

当前项目处于初始化阶段，需要构建一个稳定的后端基础设施作为整个跨境电商 Agent 系统的基石。系统将采用前后端分离架构，后端需要提供 RESTful API 供前端消费，并为后续的爬虫服务、AI Agent 和定时任务提供数据存储和业务逻辑支撑。

**当前状态：**
- 项目目录已创建，但无任何实现代码
- 设计文档已完成，明确了技术栈和架构方向

**约束：**
- 个人项目，单用户使用（暂不考虑多用户认证）
- 本地部署，使用 Docker 容器化
- 需要快速迭代，优先功能完整性而非性能优化

**利益相关方：**
- 开发者本人（个人卖家）

## Goals / Non-Goals

**Goals:**
- 提供完整的产品和报警管理 API
- 建立可扩展的数据库 schema，支持未来功能扩展
- 实现健壮的错误处理和日志记录机制
- 完整的测试覆盖（单元测试 + 集成测试）
- 清晰的文档和开发指南

**Non-Goals:**
- 用户认证和授权系统（Phase 1 不做，预留接口）
- 性能优化和缓存（数据量小，暂不需要）
- 数据库分库分表（单机 SQLite 足够）
- 实时通信（WebSocket）（Phase 3 再考虑）
- API 版本管理（v1 即可）

## Decisions

### Decision 1: 使用 SQLite + Drizzle ORM

**选择：** SQLite 作为数据库，Drizzle ORM 作为查询构建器

**理由：**
- **SQLite**: 单文件数据库，零配置，适合个人项目和 Docker 部署。数据量预计不超过百万级，性能足够。
- **Drizzle ORM**: 轻量级、类型安全、SQL-first，比 Prisma 更贴近原生 SQL，迁移简单。

**替代方案考虑：**
- **PostgreSQL + Prisma**: 更强大但需要独立数据库服务，增加部署复杂度。Phase 1 数据量不需要 PostgreSQL 的高级特性。
- **TypeORM**: 功能丰富但较重，装饰器语法不如 Drizzle 的 SQL-first 清晰。

**权衡：** SQLite 不支持并发写入，但 Phase 1 流量极低，不是瓶颈。未来若需迁移到 PostgreSQL，Drizzle 迁移成本较低。

### Decision 2: 分层架构（Routes -> Services -> Database）

**选择：** 采用经典三层架构

```
Routes (HTTP 层)
   ↓
Services (业务逻辑层)
   ↓
Database (数据访问层)
```

**理由：**
- **职责清晰**: 路由处理 HTTP 请求/响应，服务层处理业务逻辑，数据库层负责持久化。
- **可测试性**: 服务层可独立测试，不依赖 HTTP。
- **可复用性**: 服务层可被多个路由或后续的定时任务调用。

**替代方案考虑：**
- **Repository 模式**: 在 Services 和 Database 之间加一层 Repository。对于当前简单的 CRUD 场景，额外的抽象层会增加复杂度。
- **直接在 Routes 中操作数据库**: 快速但不利于测试和复用，违反单一职责原则。

**权衡：** 三层架构略增代码量，但提升可维护性和可测试性，值得。

### Decision 3: 统一错误处理中间件 + AppError 类

**选择：** 使用 Express 错误处理中间件 + 自定义 AppError 类

**理由：**
- **一致性**: 所有错误响应格式统一为 `{ error: { code, message } }`。
- **可追踪**: AppError 包含 statusCode 和 error code，便于客户端处理。
- **集中日志**: 中间件统一记录所有错误，包括堆栈跟踪。

**实现：**
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}
```

**替代方案考虑：**
- **直接在路由中返回错误**: 分散且不一致，难以维护。
- **使用第三方库（如 http-errors）**: 增加依赖，自定义 AppError 足够简单。

### Decision 4: pino 作为日志库

**选择：** pino + pino-pretty（开发环境）

**理由：**
- **性能**: pino 是 Node.js 中最快的日志库之一。
- **结构化日志**: 输出 JSON 格式，便于后续日志分析。
- **开发体验**: pino-pretty 提供彩色、易读的开发环境输出。

**替代方案考虑：**
- **Winston**: 功能丰富但较重，性能不如 pino。
- **console.log**: 简单但缺少结构化、日志级别和持久化能力。

### Decision 5: TDD 优先的测试策略

**选择：** 使用 vitest，每个服务和 API 都先写测试

**理由：**
- **质量保证**: TDD 确保代码符合需求，避免回归错误。
- **文档作用**: 测试用例是最好的使用文档。
- **重构信心**: 有测试覆盖后可放心重构。

**测试覆盖：**
- **单元测试**: 服务层逻辑（ProductService, AlertService）
- **集成测试**: API 端点（使用 supertest）
- **目标覆盖率**: >80%

**替代方案考虑：**
- **Jest**: 成熟但配置复杂，vitest 更快且与 Vite 生态一致。
- **无测试**: 快速但不可持续，后期维护成本高。

## Risks / Trade-offs

### Risk 1: SQLite 并发写入限制
- **风险**: SQLite 不支持高并发写入，可能在多个定时任务同时运行时出现锁竞争。
- **缓解**: Phase 1 并发写入场景少，定时任务串行执行。未来若成为瓶颈，可迁移到 PostgreSQL（Drizzle 支持无缝迁移）。

### Risk 2: 无 API 认证导致安全隐患
- **风险**: API 无认证，任何能访问后端的人都可操作数据。
- **缓解**: Phase 1 仅本地部署，Docker 网络隔离。后续 Phase 若需远程访问，立即加入 JWT 认证。

### Risk 3: 数据验证不完善导致脏数据
- **风险**: API 输入验证可能遗漏某些边界情况，导致无效数据入库。
- **缓解**: 
  - 在路由层使用 validation.ts 验证输入
  - 数据库层使用 schema constraints（UNIQUE, NOT NULL）
  - 测试用例覆盖边界情况

### Risk 4: 日志文件无限增长
- **风险**: pino 持续写日志到文件，可能占满磁盘。
- **缓解**: Phase 1 日志输出到 stdout，Docker 管理日志轮转。生产环境配置 pino 的日志轮转（如 pino-roll）。

## Migration Plan

Phase 1 是全新搭建，无迁移需求。

**部署步骤：**
1. 初始化项目依赖（`npm install`）
2. 配置环境变量（`.env`）
3. 运行数据库迁移（`npm run db:migrate`）
4. 启动开发服务器（`npm run dev`）

**回滚策略：**
- 数据库迁移文件版本化，可通过重新运行迁移回滚
- Docker 容器化，可快速重新部署旧版本

## Open Questions

1. **是否需要 API 限流？**
   - 当前判断：Phase 1 不需要，本地部署无滥用风险。
   - 后续决策点：Phase 5 前端接入后，若发现请求过多可加入 express-rate-limit。

2. **日志保留策略？**
   - 当前判断：Phase 1 输出到 stdout，不持久化。
   - 后续决策点：生产环境可配置日志轮转或发送到日志服务（如 Loki）。

3. **数据库备份策略？**
   - 当前判断：Phase 1 手动备份 SQLite 文件。
   - 后续决策点：编写定时备份脚本（cron），压缩并保留最近 30 天备份。
