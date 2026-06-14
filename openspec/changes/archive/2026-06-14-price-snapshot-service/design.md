## Context

当前项目处于 Phase 1 完成状态，已建立：
- Express + TypeScript 后端框架
- SQLite 数据库 + Drizzle ORM
- ProductService 和 AlertService 业务逻辑层
- 完整的测试框架（Vitest）
- price_snapshots 表结构已定义但未使用

**约束：**
- 延续 Phase 1 的技术栈和架构模式
- 单用户场景，无需考虑多租户
- 数据量预计不大（<10万条快照/年）

**利益相关方：**
- 开发者（需要清晰的 API 设计）
- 后续 Phase 3 爬虫服务（将调用快照 API）

## Goals / Non-Goals

**Goals:**
- 提供完整的价格快照 CRUD API
- 支持按产品查询历史快照
- 支持获取产品最新快照
- TDD 开发，100% 测试覆盖
- 遵循 Phase 1 的代码规范和架构模式

**Non-Goals:**
- 价格数据分析和可视化（Phase 4）
- 自动化价格采集（Phase 3 爬虫）
- 价格预测算法
- 快照数据归档和清理策略
- 性能优化（当前数据量不需要）

## Decisions

### Decision 1: 服务层方法设计

**选择：** PriceSnapshotService 提供 3 个核心方法
- `createSnapshot(data)` - 创建新快照
- `getSnapshotsByProduct(productId, options)` - 查询产品历史快照
- `getLatestSnapshot(productId)` - 获取最新快照

**理由：**
- 简洁的 API 满足当前需求
- 查询方法支持 limit 参数，避免返回过多数据
- 最新快照是高频查询，单独提供方法提升性能

**替代方案：**
- 更多的过滤方法（按价格区间、按时间范围等）- 暂不需要，可后续扩展
- 批量创建快照 - Phase 3 爬虫可能需要，但当前单次创建足够

### Decision 2: API 路由设计

**选择：** RESTful 风格路由
- `POST /api/price-snapshots` - 创建快照
- `GET /api/price-snapshots/product/:productId` - 查询历史
- `GET /api/price-snapshots/product/:productId/latest` - 获取最新

**理由：**
- 符合 REST 规范
- 路径清晰表达资源层级关系
- 与 Phase 1 的 /api/products 和 /api/alerts 保持一致

**替代方案：**
- `GET /api/products/:id/snapshots` - 更符合资源嵌套，但会让产品路由变复杂
- GraphQL - 过度设计，当前简单 REST 足够

### Decision 3: 数据验证策略

**选择：** 在路由层验证必填字段，服务层不做验证

**理由：**
- 与 Phase 1 保持一致
- 路由层是数据入口，验证失败快速返回 400
- 服务层专注业务逻辑，保持纯净

**权衡：** 服务层可被内部调用绕过验证，但当前所有调用都通过 API，可接受。

### Decision 4: 时间戳存储

**选择：** 使用 Unix timestamp（毫秒）存储在 timestamp 字段

**理由：**
- price_snapshots 表已定义为 integer 类型
- 数值类型便于排序和比较
- JavaScript Date.now() 直接返回毫秒时间戳

**权衡：** 可读性较差，但性能和存储效率更高。

## Risks / Trade-offs

**[风险] 快照数据量增长** → 暂不处理，预计第一年数据量 <10万条，SQLite 性能足够。Phase 4 实现数据归档策略。

**[权衡] 无批量创建接口** → Phase 3 爬虫需要批量创建时，可能需要多次 API 调用。但当前保持简单，未来可扩展 `POST /api/price-snapshots/batch`。

**[权衡] 查询性能** → 按产品 ID 查询依赖数据库索引，price_snapshots.productId 已在 Phase 1 设置为索引，性能可接受。

**[风险] 时区问题** → 使用 Unix timestamp 避免时区问题，前端展示时根据用户时区转换。
