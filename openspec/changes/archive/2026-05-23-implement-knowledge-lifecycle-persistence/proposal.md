## Why

当前 `/knowledge` 只有静态来源和学习闭环展示，系统还不能把品牌规格、平台规则、团队经验或公开资料登记为可审核、可发布的知识资产。产品库和直播场次已经有本地 repository 基础，下一步应补齐知识生命周期的本地-only repository 小闭环，为后续 AI 复盘、Q&A Agent、话术资产和下场任务提供可追溯、可审核的 grounding 前置条件。

本轮继续遵循阶段 4“核心运营持久化”：只实现本地 PostgreSQL/Drizzle schema、server-only repository、状态流转和回滚式本地检查。明确不做公开 UI 保存、Route Handler、Server Action、web discovery、网页抓取、RAG/pgvector 索引、AI provider、刷新队列或生产数据库 provider。

## What Changes

- Add local PostgreSQL/Drizzle schema for knowledge sources, extracted knowledge claims, team knowledge notes, review decisions, published knowledge versions and conflict records.
- Add a server-only knowledge lifecycle repository with register source, add claim, add team note, submit/review, publish version, list review queue and downstream readiness behavior.
- Preserve tenant/team scope, `review_knowledge` permission checks, source de-duplication, state transition guards, stale/conflict blockers, sensitive-level fields and audit metadata.
- Add a rollback-style local verifier script and package command for the knowledge lifecycle workflow.
- Update the knowledge lifecycle contract, contract index, README/app docs and roadmaps to mark local repository persistence as partially implemented while keeping UI/API/AI/RAG/web discovery out of scope.

## Capabilities

### New Capabilities

- `knowledge-lifecycle-persistence`: Local-only persistence and repository behavior for knowledge source registration, claim/team-note review, published versions, conflict blockers, review queue and tenant/team isolation.

### Modified Capabilities

- `knowledge-lifecycle-contract`: Clarify that the contract now has a partial local repository runtime while public API, Server Action, browser save flow, web discovery, crawler, RAG indexing, AI grounding, refresh jobs and production persistence remain unimplemented.

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`, new `apps/web/src/server/knowledge/*`, `apps/web/package.json`, root package script delegation.
- Affected docs/specs: `docs/contracts/knowledge-lifecycle.md`, `docs/contracts/README.md`, `README.md`, `apps/web/README.md`, `docs/roadmap/ai-continuous-development-goal.md`, `docs/roadmap/autonomous-development-roadmap.md`, `docs/architecture/technical-implementation-roadmap.md`, accepted OpenSpec specs after archive.
- Data/runtime: local PostgreSQL development database and Drizzle migrations only. No production database provider, public API, UI mutation, AI provider, RAG index, crawler, scheduled job, queue, object storage or new npm dependency.
- Verification: `openspec validate implement-knowledge-lifecycle-persistence`, Drizzle generate/migrate, local rollback verifier, existing db/auth/racket/session checks, lint/typecheck/build and `openspec validate --all`.

## Source Notes

- W3C PROV-O is a standards-body provenance model and supports keeping source, responsible actor and derivation metadata distinct: https://www.w3.org/TR/prov-o/
- NIST AI RMF is a primary government framework for trustworthy AI risk management; its transparency, accountability and evaluation framing supports keeping AI/RAG grounding limited to reviewed, auditable knowledge: https://www.nist.gov/itl/ai-risk-management-framework
- OWASP Top 10 for LLM Applications is a security reference for LLM/RAG risks; its data-poisoning and prompt-injection concerns reinforce that unreviewed web discovery findings must not directly become authoritative knowledge or AI grounding: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- PostgreSQL official full-text search documentation confirms that future in-database text search can be built with `tsvector` and GIN indexes, but this slice intentionally does not add search ranking or RAG indexes: https://www.postgresql.org/docs/current/textsearch-indexes.html

## Skill-Backed Value Check

- `openspec-explore`: confirmed the next coherent gap is knowledge lifecycle persistence, not another product/session repository or an early AI/RAG jump.
- `roadmap-planning`: mapped this work to stage 4 after product and session persistence, before AI review runtime and Q&A/RAG.
- `jobs-to-be-done`: target users are product owners, reviewers and operators who need to turn scattered public/team knowledge into reviewed assets they can trust during preparation and review.
- `recommendation-canvas`: the AI-related decision is deliberately conservative: build audit and review gates now so later AI/RAG recommendations have defensible inputs.
- Product highlight boundary: the useful highlight is source authority plus review/readiness blockers, not automatic crawling or decorative UI.
