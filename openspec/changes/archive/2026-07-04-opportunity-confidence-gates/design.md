## Context

`OpportunityScoringService` 已经返回 score、confidence、missingSignals、businessSignals 和 marketSignals，也会把利润、销量、需求等缺失信号暴露出来。但当前 `recommend()` 逻辑仍有一个问题：只要 score 达到 72，就可能返回 `investigate`，即使业务假设不完整或市场信号过时。

手动优先路线要求“评分透明可否决”，并按来源/新鲜度调低可信度。本变更把这种调低从隐含 confidence 扩展为显式 `recommendationGate`，让 API 和 UI 都能解释推荐为什么被降级。

## Goals / Non-Goals

**Goals:**
- 让推荐动作经过数据健康门控，避免高分但缺关键输入的商品被标为高置信 `investigate`。
- 在 `ProductOpportunity` 响应中返回门控状态、原因、阻断信号和下一步建议。
- 在机会工作台展示 gate，让用户知道应该补价格、补利润假设、刷新市场趋势，还是继续研究。

**Non-Goals:**
- 不重新设计评分权重或 factor 公式。
- 不新增数据库表或持久化 gate；gate 由当前输入实时推导。
- 不把 Keepa/销量/需求缺失作为全局硬阻断，因为当前项目明确支持无付费数据源运行。
- 不把推荐动作改成 buy/sell 决策。

## Decisions

### Decision 1: 新增 `recommendationGate` 响应字段

结构：

- `status`: `clear` | `caution` | `blocked`
- `applied`: boolean，表示 gate 是否改变最终推荐
- `originalRecommendation`: gate 前推荐动作
- `finalRecommendation`: gate 后推荐动作
- `reasons`: 用户可读原因
- `signals`: 触发 gate 的信号名
- `nextActions`: 建议下一步操作

这样 UI 不需要重复推导规则，Chat 工具和导出也能复用相同解释。

### Decision 2: 先算 base recommendation，再应用 gate

保持原评分和原推荐逻辑可理解：先基于 score/confidence/business metrics 得到 `originalRecommendation`，再用 `applyRecommendationGate()` 生成最终推荐和 gate 说明。这样测试能明确看到“原本会 investigate，但因为利润假设缺失被降级”。

### Decision 3: 门控分级

- `blocked` → 最终推荐 `check_data`
  - price history 缺失
  - acquisition history 缺失
  - confidence < 0.45
  - base recommendation 为 `investigate` 但 business assumptions 不完整 / profit margin 缺失
- `caution` → 当 base 为 `investigate` 时最终降为 `watch`
  - market signals stale
  - review proxy missing
  - confidence < 0.65
- `clear` → 不改变推荐

完全缺少 market trend 不作为硬阻断，只作为 missing signal 显示，因为路线允许没有付费 Keepa 的手动研究模式。

### Decision 4: UI 做成紧凑状态块

机会详情页在推荐徽标附近显示 gate 摘要；详细原因放到一个小的“推荐门控”区块，列出 reasons / nextActions / signals。列表行只保留现有缺失信号，避免排行列表过密。

## Risks / Trade-offs

- [Risk] 过度门控导致几乎没有 `investigate`。→ 不把长期缺失的 `sales_volume`/`demand` 或缺 Keepa 作为硬阻断；只对利润假设、价格历史、采集历史、过时市场信号等更直接影响结论的输入门控。
- [Risk] schema TS/JS 不同步导致运行时校验漂移。→ tasks 明确要求同步 `shared/schemas/opportunity.schema.ts` 和 `.js`。
- [Risk] 前端重复门控逻辑。→ 前端只渲染 `recommendationGate`，不推导 gate。
- [Risk] 旧客户端没有 gate 字段。→ 字段为新增响应字段；当前仓库客户端同步更新，外部旧客户端可忽略。
