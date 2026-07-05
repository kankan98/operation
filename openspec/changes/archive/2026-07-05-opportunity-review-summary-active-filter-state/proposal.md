## Why

复盘汇总卡片已经可以应用现有筛选，但点击后用户仍需要查看顶部筛选控件才能确认当前处理的是哪一个复盘队列。给匹配当前筛选的卡片增加 active/pressed 状态，可以让复盘入口更像一个可操作的运营队列导航。

## What Changes

- 复盘汇总卡片在当前工作台筛选匹配该卡片时显示 active state。
- active 卡片暴露 `aria-pressed`，让键盘和辅助技术用户能识别当前队列。
- active state 只从当前 UI 筛选状态派生，不新增持久化、后端字段、API、自动化或评分输入。
- 当当前筛选不是复盘汇总卡片的纯队列视图时，不错误标记任何卡片为 active。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opportunity-research-workspace`: 复盘汇总 UI 需要显示当前 active review summary filter state。

## Impact

- Affected frontend: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected specs/docs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, database, OpenAPI, dependency, persistence, scoring, automation, reminder, analytics, or task-system changes.
