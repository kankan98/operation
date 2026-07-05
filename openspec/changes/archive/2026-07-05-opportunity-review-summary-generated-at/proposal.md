## Why

复盘汇总卡片已经把活跃研究、未决策、待下一步和需复盘数量变成每日入口，但用户还看不出这些计数来自哪一次 read model 生成。补上返回的生成时间可以降低误读风险，帮助用户判断当前复盘队列是否足够新鲜。

## What Changes

- 在机会研究工作台的复盘汇总卡片区域显示后端返回的 `summary.generatedAt`。
- 使用中性的 `汇总时间` 标签，只表达 read model 生成时间。
- loading、missing summary 或缺少 `generatedAt` 时不从 render time、daily action plan、practice summary、action outcomes、decision metadata、score/recommendation、market signals 或 business metrics 推断或回填。
- 不新增 API、后端 schema、自动化、提醒、任务系统、训练评分、analytics 或评分输入。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opportunity-research-workspace`: 复盘汇总 UI 需要展示 returned review summary generated time，并明确缺失时不能推断。

## Impact

- Affected frontend: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected specs/docs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No dependency, database, OpenAPI, API contract, scoring, automation, or backend behavior changes.
