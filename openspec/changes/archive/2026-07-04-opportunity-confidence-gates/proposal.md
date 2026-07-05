## Why

手动优先路线已经解决了“数据从哪里来”和“如何快速补录”，但机会评分仍可能因为高分因子而给出过强的 `investigate` 建议，即使利润率、销量、需求、市场趋势或业务假设仍缺失/过时。

下一步需要把评分推荐从“分数高就推进”升级为“分数 + 数据健康门控”：当关键输入不足时，系统必须明确降级为补数据或观察，并解释原因，帮助用户提高选品判断能力。

## What Changes

- 后端机会评分返回 `recommendationGate`，说明推荐是否被数据质量门控、门控等级、原因和下一步动作。
- `OpportunityScoringService` 在推荐动作前应用关键缺失/过时信号门控，避免高分但低证据的商品被标为高置信 `investigate`。
- 共享 schema 与后端类型同步新增 gate 字段，保持 API 契约明确。
- 机会工作台展示门控摘要和原因，让用户知道“为什么现在只能补数据/观察”。
- 不修改数据库 schema，不引入新外部依赖。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-opportunity-scoring`: 推荐动作必须受关键缺失/过时信号门控约束，并返回门控原因。
- `opportunity-research-workspace`: 机会工作台必须展示推荐门控状态、原因和下一步补数动作。

## Impact

**后端：**
- `backend/src/services/opportunityScoringService.ts` — 增加门控推导，推荐动作经过 gate 后输出。
- `backend/src/types/index.ts` — `ProductOpportunity` 增加 `recommendationGate`。
- `backend/tests/opportunityScoringService.test.ts` — 增加高分但缺失关键输入时降级的测试。

**共享 schema：**
- `shared/schemas/opportunity.schema.ts` + `.js` — 新增 `recommendationGate` schema。

**前端：**
- `frontend/src/pages/Opportunities.tsx` — 在候选详情和/或行内展示 gate 状态与原因。
- `frontend/tests/pages/Opportunities.test.tsx` — 覆盖 gate 展示。

**API / 数据库：** API 响应新增字段；无数据库迁移。
