## Why

Phase 1 建立了产品和报警管理的基础架构，但缺少价格历史记录功能。为了实现价格趋势分析、价格预测和智能报警，需要系统性地记录产品价格快照。price_snapshots 表已在 Phase 1 中定义，现在需要实现相应的服务层和 API 来操作这些数据。

## What Changes

- 新增 PriceSnapshotService 服务层，提供价格快照的 CRUD 操作
- 新增 3 个 REST API 端点用于创建、查询和获取最新价格快照
- 扩展 TypeScript 类型定义以支持价格快照数据结构
- 完整的单元测试和集成测试覆盖

## Capabilities

### New Capabilities
- `price-snapshot-api`: 价格快照 API 端点，支持创建快照、查询产品历史快照、获取最新快照

### Modified Capabilities
<!-- 无需修改现有规格，仅新增功能 -->

## Impact

**新增文件：**
- `backend/src/services/priceSnapshotService.ts` - 价格快照服务层
- `backend/src/routes/priceSnapshots.ts` - 价格快照 API 路由
- `backend/tests/priceSnapshotService.test.ts` - 服务层单元测试
- `backend/tests/priceSnapshots.api.test.ts` - API 集成测试

**修改文件：**
- `backend/src/types/index.ts` - 添加 PriceSnapshot 类型定义
- `backend/src/routes/index.ts` - 注册价格快照路由

**依赖：**
- 无新增依赖，使用 Phase 1 现有技术栈

**数据库：**
- 使用现有 price_snapshots 表，无需新建迁移
