# 任务清单：opportunity-confidence-gates

## 1. 后端推荐门控

- [x] 1.1 先写失败单测：高分但业务假设/利润信号缺失时，最终 recommendation 为 `check_data`，`recommendationGate.status='blocked'`
- [x] 1.2 先写失败单测：base `investigate` 但 market signal stale 时，最终 recommendation 不强于 `watch`，gate 原因包含 market freshness
- [x] 1.3 实现 `RecommendationGate` 类型与 `OpportunityScoringService` 门控逻辑，保留 original/final recommendation
- [x] 1.4 更新 `ProductOpportunity` 后端类型
- [x] 1.5 后端相关测试通过

## 2. 共享 API schema

- [x] 2.1 更新 `shared/schemas/opportunity.schema.ts`，为 `productOpportunitySchema` 增加 `recommendationGate`
- [x] 2.2 同步更新已提交编译产物 `shared/schemas/opportunity.schema.js`
- [x] 2.3 确认前端/后端类型引用新字段无类型错误

## 3. 机会工作台展示

- [x] 3.1 先写失败测试：机会详情展示 blocked/caution gate 的标题、原因和 next actions
- [x] 3.2 实现 `Opportunities.tsx` 使用后端 `recommendationGate` 渲染紧凑门控区块
- [x] 3.3 更新机会页测试 fixture，默认 gate 为 clear，覆盖 gated 场景

## 4. 验收门禁

- [x] 4.1 后端相关测试通过：`opportunityScoringService`
- [x] 4.2 前端相关测试通过：`Opportunities`
- [x] 4.3 `openspec validate opportunity-confidence-gates --strict` 通过
- [x] 4.4 前端 build 或类型检查通过
