## Why

构建跨境电商 Agent 系统需要一个稳定可靠的后端基础设施。当前项目缺少数据存储、API 服务和核心业务逻辑层。Phase 1 将建立这些基础设施，为后续的爬虫、AI Agent 和前端功能提供支撑。

## What Changes

- 搭建 Express + TypeScript 后端服务框架
- 实现 SQLite 数据库和 Drizzle ORM 集成
- 创建产品管理和报警管理的完整 API
- 建立日志、错误处理和配置管理系统
- 提供完整的单元测试和集成测试

## Capabilities

### New Capabilities

- `database-schema`: 数据库表结构设计，包括 products、price_snapshots、alerts 等核心表
- `product-api`: 产品 CRUD API，支持创建、查询、更新和删除产品
- `alert-api`: 报警管理 API，支持创建、查询和管理报警记录
- `config-management`: 环境配置和应用配置管理
- `logging-system`: 结构化日志记录和请求追踪
- `error-handling`: 统一的错误处理和错误响应格式
- `data-validation`: 输入数据验证和清洗工具

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

**新增代码：**
- `backend/src/` - 完整的后端服务代码
- `backend/tests/` - 测试套件
- `backend/data/` - SQLite 数据库文件

**依赖项：**
- Node.js 18+
- TypeScript
- Express.js
- SQLite (better-sqlite3)
- Drizzle ORM
- pino (日志)
- vitest (测试)

**后续影响：**
- Phase 2 (Scraper) 将依赖此 API 存储抓取数据
- Phase 4 (AI Agent) 将调用这些 API 获取数据
- Phase 5 (前端) 将使用这些 API 展示数据
