## Why

AI 复盘是当前运营闭环里唯一还没有本地 runtime 账本的核心工作流；如果先接模型而没有 run、快照、校验、人工审核和下游引用记录，后续建议很容易和人工事实、已审核知识混在一起。现在产品、场次、知识、话术资产和下场任务都已有本地 repository 切片，补齐 AI review run persistence 是进入 AI 复盘 MVP 前的最小可验证前置。

提案前门禁结论：OpenAI 结构化输出文档、DeepSeek 官方 API 文档、NIST AI RMF、OWASP LLM Top 10、W3C PROV-O、Drizzle/PostgreSQL 官方文档共同支持本轮范围：先做可追溯、可校验、可回滚的本地持久化和人工审核边界，不在同一轮直接调用 provider，不落盘完整 prompt、完整 provider payload、完整转录或用户提供的 API key。

## What Changes

- 新增 AI review run 本地-only PostgreSQL/Drizzle schema 和 migration，覆盖 run、输入快照、知识快照、prompt version metadata、provider invocation metadata、结构化输出、输出区块、校验结果、人工审核决定、反馈信号和下游草案引用。
- 新增 server-only repository，按 `DataAccessContext` 强制 tenant/team scope、`run_ai_review` 权限、输入校验、敏感数据阻断、知识过期/冲突阻断、prompt 版本 active/reviewed 门禁、状态流转、人工审核后下游创建和列表/详情查询。
- 新增本地回滚式 verifier 与 `ai-review:check` 脚本，先以 TDD 观察缺失 repository 的 RED，再实现本地闭环。
- 更新 `docs/contracts/ai-review-run.md`、契约索引、README、路线图和 accepted specs，说明 AI 复盘 run 已有本地 persistence slice，但仍没有公开 API、Server Action、真实 provider 调用、prompt 执行、RAG、队列或 UI 保存流程。
- 记录用户指定的 DeepSeek provider 候选：base URL `https://api.deepseek.com`、模型 `deepseek-v4-pro` 进入后续 provider gate；本轮不保存、不调用、不提交 API key。

## Capabilities

### New Capabilities
- `ai-review-run-persistence`: AI 复盘运行的本地持久化、校验、人工审核、反馈和下游引用门禁。

### Modified Capabilities
- `ai-review-run-contract`: 明确本地 persistence slice 已实现的边界，以及 DeepSeek 作为用户指定后续 provider 候选但不属于本轮运行时调用范围。

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`, `apps/web/src/server/db/migrations/**`, `apps/web/src/server/ai-review/**`, root and web `package.json`.
- Affected docs/specs: `docs/contracts/ai-review-run.md`, `docs/contracts/README.md`, `README.md`, `apps/web/README.md`, `docs/roadmap/ai-continuous-development-goal.md`, `docs/roadmap/autonomous-development-roadmap.md`, `docs/architecture/technical-implementation-roadmap.md`, OpenSpec specs.
- No new npm dependencies, provider SDKs, external services, queue, object storage, RAG, public API, Server Action, or frontend route changes.
- Security impact: user-provided API key is treated as secret and must only be configured later through environment variables; this change must not write the key to repository files, logs, migrations, OpenSpec artifacts, screenshots, or final output.
