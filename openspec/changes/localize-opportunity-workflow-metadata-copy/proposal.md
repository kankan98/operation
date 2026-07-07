## Why

线上“选品机会”页面仍显示多段英文工作流元数据说明，例如 review/practice/action plan caveat 和 `latest outcome` fallback。该页面面向中文运营用户，英文解释会降低复盘、行动练习和候选筛选的理解效率，也违反项目中文优先规范。

## What Changes

- 将机会页复盘汇总、行动练习覆盖、今日行动计划的已知英文 caveat 映射为中文展示。
- 将行动练习覆盖中无最近完成结果时的 `latest outcome` fallback 本地化为中文。
- 保留 API 数据语义、评分、推荐、筛选、队列和导出行为不变。
- 增加前端回归测试，确保已知英文 caveat 不直接出现在机会工作台。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `opportunity-research-workspace`: 工作流元数据说明在中文机会工作台中必须以中文展示。

## Impact

- 影响前端机会工作台页面：`frontend/src/pages/Opportunities.tsx`。
- 影响机会页测试：`frontend/tests/pages/Opportunities.test.tsx`。
- 不改变后端 API、共享 schema 常量、数据库、评分算法或导出内容。
