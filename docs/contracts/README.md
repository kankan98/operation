# 接口契约草案

状态：规划基线，尚未实现任何后端接口。

本目录用于保存未来 API、Server Action、Repository、AI run、RAG 检索和集成边界的
契约草案。契约草案不是可调用接口，也不代表数据库、模型、搜索或持久化已经接入。

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

1. `racket-product-library`：球拍型号、规格、别名、卖点、审核状态。
2. `session-capture`：直播场次、草稿、长文本、问题异议、商品顺序。
3. `knowledge-lifecycle`：来源登记、版本、审核、刷新、冲突。
4. `ai-review-run`：复盘输入、prompt version、结构化输出、失败状态、反馈。
5. `qa-agent-answer`：问题、检索 snapshot、答案引用、反馈、web discovery 草案。
