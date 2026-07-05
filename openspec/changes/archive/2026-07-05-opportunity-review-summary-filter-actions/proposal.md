## Why

复盘汇总卡片已经把活跃研究、未决策、待下一步和需复盘数量展示出来，但用户还需要手动切换复盘筛选才能处理对应队列。把这些卡片变成现有筛选入口，可以让复盘汇总从只读看板变成可操作的运营练习入口。

## What Changes

- 复盘汇总卡片支持点击应用已有机会工作台筛选。
- 四个入口复用既有筛选状态：活跃研究、未决策、待下一步、需复盘。
- 点击卡片只改变当前 UI 筛选和候选列表，不新增后端 API、持久任务、提醒、自动化或评分输入。
- 切换复盘汇总筛选时清除 transient action context，避免之前从每日行动或练习分桶带入的 action context 污染新的候选集合。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opportunity-research-workspace`: 复盘汇总 UI 需要允许用户从 summary cards 应用现有复盘筛选。

## Impact

- Affected frontend: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected specs/docs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, database, OpenAPI, dependency, scoring, automation, reminder, analytics, or task-system changes.
