## Why

练习覆盖汇总已经可以按行动结果覆盖和 action bucket 应用筛选，但用户点击后仍需要从顶部练习筛选 badge 或候选列表推断当前练习视图。给匹配当前练习筛选的 summary 控件增加 active/pressed 状态，可以让执行证据补齐入口更清晰。

## What Changes

- 练习覆盖 summary 的可点击卡片和 action bucket 在匹配当前练习筛选时显示 active state。
- active 控件暴露 `aria-pressed`，帮助键盘和辅助技术用户识别当前练习筛选。
- active state 只从当前 UI 筛选状态派生，不新增后端字段、API、持久化、自动化、训练评分或评分输入。
- 当当前筛选被其他 discovery/research/review 条件窄化时，不错误标记练习覆盖控件为 active。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opportunity-research-workspace`: 练习覆盖 summary UI 需要显示当前 active practice filter state。

## Impact

- Affected frontend: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected specs/docs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, database, OpenAPI, dependency, persistence, scoring, automation, reminder, analytics, AI coaching, training grade, or task-system changes.
