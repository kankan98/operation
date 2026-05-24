## Why

直播运营目前只能在 `/sessions` 看到静态采集结构，无法把场次主题、主播分工、商品顺序、客户问题、购买异议和复盘缺口保存成可恢复的团队记录。下一步应先补一个本地-only、server-only 的直播场次 repository 小闭环，让后续 AI 复盘、话术资产和下场任务有稳定、可授权、可审计的输入基础。

本轮继续遵循阶段 4“核心运营持久化”：不做公开 UI 保存、Route Handler、Server Action、登录 provider、AI provider、转录上传、对象存储、队列或外部平台同步，只落地可验证的数据模型、repository、状态流转和回滚式本地检查。

## What Changes

- Add local PostgreSQL/Drizzle schema for live session captures, host roles, product order, session notes, customer questions, and customer objections.
- Add a server-only session capture repository with create, autosave, submit, list, detail/readiness and stale draft conflict behavior.
- Preserve tenant/team scope, `capture_session` permission checks, audit fields, draft versioning, duplicate session label detection, long input limits and sensitive-redaction state.
- Add a rollback-style local verifier script and package command for the session capture workflow.
- Update session capture contract, README/contract index and roadmap notes to mark local repository persistence as partially implemented while keeping UI/API/AI/transcript import out of scope.

## Capabilities

### New Capabilities

- `session-capture-persistence`: Local-only persistence and repository behavior for live-session capture records, draft autosave, structured notes/questions/objections, submission readiness and tenant/team isolation.

### Modified Capabilities

- `session-capture-contract`: Clarify that the contract now has a partial local repository runtime while public API, Server Action, browser save flow, transcript import, AI review input and external platform sync remain unimplemented.

## Impact

- Affected code: `apps/web/src/server/db/schema.ts`, new `apps/web/src/server/sessions/*`, `apps/web/package.json`, root package script delegation if needed.
- Affected docs/specs: `docs/contracts/session-capture.md`, `docs/contracts/README.md`, `docs/roadmap/ai-continuous-development-goal.md`, `docs/roadmap/autonomous-development-roadmap.md`, `docs/architecture/technical-implementation-roadmap.md`, accepted OpenSpec specs after archive.
- Data/runtime: local PostgreSQL development database and Drizzle migrations only. No production database provider, public API, UI mutation, AI provider, transcript storage, queue, object storage or new npm dependency.
- Verification: `openspec validate implement-session-capture-persistence`, Drizzle generate/migrate, local rollback verifier, existing data/auth/racket checks, lint/typecheck/build and `openspec validate --all`.

## Source Notes

- PostgreSQL official character type documentation supports using `text` for variable-length long notes rather than narrow `varchar` fields when no fixed business maximum is required: https://www.postgresql.org/docs/current/datatype-character.html
- PostgreSQL official JSON documentation supports `jsonb` for structured JSON values; this change uses it only for bounded arrays/metadata, while core lifecycle fields remain relational columns: https://www.postgresql.org/docs/current/datatype-json.html
- OWASP Logging Cheat Sheet guidance on excluding sensitive data from logs reinforces that customer questions, private messages, transcripts, phone numbers, addresses and prompt-like payloads must not be logged raw: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- W3C WebVTT is useful future context for timestamped transcript cues, but this slice intentionally does not implement transcript upload or parsing: https://www.w3.org/TR/webvtt1/

## Skill-Backed Value Check

- `openspec-explore`: confirmed the smallest coherent wave is a contract-governed repository slice, not a UI/API/AI jump.
- `roadmap-planning`: mapped the work to the roadmap's Now stage 4 sequence after product library persistence and before AI review runtime.
- `jobs-to-be-done`: target roles are live operators and host/assistant roles who need to recover drafts, avoid losing live notes, and turn questions/objections into reviewable session inputs.
- Product highlight boundary: the useful highlight is reliable draft version conflict detection and downstream readiness blockers, not extra visual treatment or broad automation.
