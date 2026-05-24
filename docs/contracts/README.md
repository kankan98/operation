# 接口契约草案

状态：规划基线，部分本地-only runtime 已实现，尚未实现任何对外后端接口。

本目录用于保存未来 API、Server Action、Repository、AI run、RAG 检索和集成边界的
契约草案。契约草案不是对外可调用接口；当某个契约已有本地-only repository 或 guard
runtime 时，表格中的 Runtime 会单独标注。

## 什么时候必须写契约

以下工作从静态页面进入真实实现前，必须先有契约草案：

- 页面要保存、读取、编辑、删除或导出数据。
- 页面要调用 AI、RAG、Agent、prompt 或结构化输出。
- 页面要导入公开来源、刷新知识、审核版本或回滚。
- 页面要接入登录、团队、租户、权限或审计。
- 页面要接外部平台、文件存储、搜索、队列或分析服务。

## 契约必须覆盖

- 当前实现状态：planned、draft、implemented、deprecated。
- 业务用例：面向哪个操作者，解决什么工作流。
- Domain entities：领域对象和字段，不先写泛化 item/content。
- 输入 shape：request、command、query、filter、pagination、long input。
- 输出 shape：response、view model、error、empty、partial success。
- 状态机：draft、saved、reviewing、published、stale、failed 等。
- 错误场景：validation、auth、tenant、network、timeout、provider、schema mismatch。
- 权限边界：team、tenant、role、reviewer、operator。
- 数据敏感性：客户数据、业务数据、prompt、AI output、来源网页。
- 审计字段：createdBy、updatedBy、reviewedBy、runId、sourceVersion、promptVersion。
- 验证要求：unit、integration、browser、AI schema、RAG recall、public preview。

## 模板

```md
# <Workflow> Contract

Status: planned
Runtime: not implemented

## Use Case

## Domain Entities

## Commands / Queries

## Request Shape

## Response Shape

## State Machine

## Error Cases

## Authorization

## Sensitive Data

## Audit Metadata

## Verification

## Open Questions
```

## 当前优先契约

| 契约 | 状态 | Runtime | 说明 |
| --- | --- | --- | --- |
| [`racket-product-library`](./racket-product-library.md) | draft | partially implemented, local-only | 球拍型号、规格、别名、来源、审核、发布状态和下游 AI/RAG 可用边界；当前产品、别名、来源、审核决策和发布门禁 repository 已本地落地。 |
| [`session-capture`](./session-capture.md) | draft | partially implemented, local-only | 直播场次、草稿、长文本、问题异议、商品顺序和 AI 复盘输入边界；当前 schema、server-only repository、草稿版本、提交 readiness 和 `sessions:check` 已本地落地。 |
| [`knowledge-lifecycle`](./knowledge-lifecycle.md) | draft | partially implemented, local-only | 来源登记、claim、团队笔记、审核决策、发布版本、冲突阻断和下游 readiness 边界；当前 schema、server-only repository、tenant/team scope、权限检查和 `knowledge:check` 已本地落地。 |
| [`ai-review-run`](./ai-review-run.md) | draft | partially implemented, local-only | 复盘输入、prompt version、结构化输出、失败状态、反馈和下游草案边界；当前 schema、server-only repository、tenant/team scope、权限检查、敏感/过期/冲突阻断、人工审核、下游门禁、`AiProviderPort` / DeepSeek adapter、server-only generation orchestrator、server-only execution service、`ai-review:check`、`ai-provider:check`、`ai-review:generation-check` 和 `ai-review:execution-check` 已本地落地。 |
| [`qa-agent-answer`](./qa-agent-answer.md) | draft | not implemented | 运营问题、检索 snapshot、答案引用、反馈、缺失知识和 web discovery 审核流。 |
| [`auth-team-tenant`](./auth-team-tenant.md) | draft | partially implemented, local-only | 登录、团队、租户、角色、成员、邀请、会话、provider 边界和 server-side guard；当前 provider-neutral guard、app-owned session ledger、session hash resolver、cookie/request bridge、`GET /api/auth/session`、CSRF-checked `POST /api/auth/logout`、`auth:check`、`auth:session-check`、`auth:cookie-check` 和 `auth:route-check` 已本地落地，登录 provider、middleware、团队管理和业务 CRUD 仍未实现。 |
| [`data-foundation`](./data-foundation.md) | draft | partially implemented, local-only | PostgreSQL、Drizzle migration、schema validation、repository、tenant/team ownership、事务、幂等和审计边界；当前基础 schema 和 repository 原语已本地落地。 |
| [`talk-track-asset`](./talk-track-asset.md) | draft | partially implemented, local-only | 话术资产、版本、场景、异议回应、来源引用、AI 候选、人工审核、复用反馈和 Q&A/RAG 可用边界；当前 schema、server-only repository、tenant/team scope、权限检查、AI 候选审核阻断、发布门禁、重复场景阻断和 `talk-tracks:check` 已本地落地。 |
| [`next-session-task`](./next-session-task.md) | draft | partially implemented, local-only | 下场任务、来源证据、负责人、截止时间、状态流转、AI 候选、审核关闭、反馈和团队回看边界；当前 schema、server-only repository、tenant/team scope、权限检查、状态流转、重复检测、敏感来源阻断和 `next-actions:check` 已本地落地。 |

下一批优先级：

1. 认证 provider/login runtime：本地 guard、session ledger、cookie/request bridge 和 session/logout
   Route Handler runtime 已落地；下一步在 `auth-team-tenant` 契约约束下确定登录 provider、
   middleware、team switching 或 route-level protection。
2. AI 复盘 MVP：DeepSeek provider gate、server-only generation orchestrator 和 server-only execution service 已本地落地；
   下一步如推进公开保存、UI 触发、RAG snapshot、队列重试或生产发布，先在 `ai-review-run`
   契约下定义认证、输入快照来源、保存流程、评测、审核门禁、失败状态和回滚验证。
