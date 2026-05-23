# Agent 架构选型

状态：规划基线，尚未实现运行时代码。

本文件固定未来 Q&A Agent、AI 复盘、RAG 和反馈学习的首选架构。当前项目仍不调用
LLM、不创建向量索引、不接数据库、不搜索公开网页，也不实现后端接口。

## 结论

首选实现栈：

| 层 | 首选方案 | 替换边界 |
| --- | --- | --- |
| Web/BFF | Next.js App Router，Route Handlers 作为可复用 API 边界，Server Actions 只做薄 UI mutation wrapper | `app/api` 和 domain service 分离 |
| 领域编排 | 项目自有 Agent orchestrator，显式状态机 | `AgentOrchestrator` 接口 |
| LLM | OpenAI Responses API 作为首个 provider | `AiProviderPort` |
| RAG 存储 | PostgreSQL + pgvector，结合全文检索和 metadata filter | `RetrievalPort` |
| 权威知识 | PostgreSQL 中的 reviewed knowledge snapshots | `KnowledgeRepository` |
| 公开发现 | 后续通过 `SourceDiscoveryPort` 接允许的 web/source discovery | 不直接写入权威知识 |
| 评测 | 代表性运营问题集 + 检索/引用/失败状态检查 | `EvaluationRunner` |

## 为什么这样选

1. 项目已接受 PostgreSQL 作为权威数据源。MVP 阶段把知识记录、审核状态、版本、向量
   embedding 和租户边界放在同一套数据库里，复杂度最低。
2. Agent 的业务稳定性比“自主性”重要。回答必须经过可解释的状态机，而不是让模型自由决定流程。
3. LLM provider 变化快，所以 UI、domain、data 层都不能直接依赖某个 SDK。
4. OpenAI Responses API 适合作为第一实现目标，因为未来会需要结构化输出、工具调用、
   web/file search 类能力和可追踪响应元数据。
5. Vercel AI SDK 或其它编排库可以在实现阶段评估，但只能放在 adapter 或薄 UI streaming
   层，不能成为业务层唯一抽象。

## 分层

```text
UI / Workbench
  |
  v
Route Handler / Server Action wrapper
  |
  v
Domain Service
  |
  v
AgentOrchestrator
  |-- AiProviderPort
  |-- RetrievalPort
  |-- SourceDiscoveryPort
  |-- EvaluationPort
  |-- AuditRepository
```

职责边界：

- UI：展示问题、答案、引用、反馈和状态，不拼 prompt，不直接调用 provider。
- Route Handler：处理 HTTP 边界、认证、租户、输入校验和响应 shape。
- Domain Service：执行业务用例，例如“回答运营问题”“复盘场次”“记录反馈”。
- AgentOrchestrator：控制状态机、调用检索、调用 LLM、组装结构化输出。
- AiProviderPort：隐藏 OpenAI 或其它 provider 的 SDK/API 细节。
- RetrievalPort：隐藏 Postgres/pgvector 或未来向量库细节。
- SourceDiscoveryPort：隐藏公开来源搜索或抓取能力，返回 review-only finding。
- AuditRepository：保存 run、prompt version、snapshot、feedback 和 reviewer 元数据。

## Agent 状态机

```text
question received
  -> classify intent
  -> validate tenant and scope
  -> retrieve reviewed knowledge snapshots
  -> check freshness / conflict / confidence
  -> if insufficient:
       answer with uncertainty OR request web discovery stage
  -> compose structured answer
  -> validate output schema
  -> render answer with citations
  -> capture feedback
  -> route reusable findings to review queue
```

不允许的行为：

- 模型直接改知识库。
- 未审核网页搜索结果直接成为答案依据。
- UI 组件直接调用 OpenAI、AI SDK、向量库或数据库。
- 没有评测就替换 prompt、模型、检索规则或回答策略。

## RAG 方案

MVP 使用 PostgreSQL + pgvector：

- `knowledge_sources`：来源 URL、类型、允许采集方式、可信等级、刷新策略。
- `knowledge_records`：球拍、规格、卖点、规则、运营经验等规范化记录。
- `knowledge_versions`：审核版本、diff、发布时间、回滚信息。
- `knowledge_chunks`：可检索文本片段、embedding、语言、实体引用、review state。
- `answer_runs`：问题、检索 snapshot、provider/model、prompt version、状态和错误。
- `answer_feedback`：点赞、点踩、编辑、原因、关联 run 和 reviewer/operator。

检索顺序：

1. 按租户、团队、review state、实体类型、更新时间做 metadata filter。
2. 结合关键词/全文检索和向量相似度。
3. 返回带 source/version/chunk ID 的 reviewed snapshot。
4. 只把回答需要的最小字段交给 LLM。
5. 答案必须展示引用和不确定性。

升级到外部向量数据库的条件：

- Postgres 查询延迟或索引维护影响核心业务。
- 知识量、embedding 数量或多租户隔离复杂度超过 PostgreSQL 可维护范围。
- 评测证明外部检索服务能显著提升召回、排序或运维稳定性。

## LLM Provider 策略

首个真实实现默认：

- Provider：OpenAI。
- API：Responses API。
- 输出：结构化 schema，先校验再展示或保存。
- 工具：只通过 adapter 开启，并按 OpenSpec 定义允许范围。
- 错误：拒绝、超时、限流、schema mismatch、部分输出都进入 non-success run state。

Provider 替换要求：

- 新 provider 也必须通过 `AiProviderPort`。
- OpenSpec 说明模型能力、结构化输出、工具调用、成本、延迟、安全、失败模式和回滚。
- 通过同一套代表性运营问题评测后才能替换生产回答策略。

## 评测门槛

每次改变 prompt、模型、检索规则、chunk 策略或答案策略，都要覆盖：

- 球拍规格问答。
- 适合人群/打法推荐。
- 客户异议回应。
- 直播复盘建议。
- 短视频选题建议。
- 知识不足、来源过期、来源冲突。
- 长输入、空输入、恶意输入。
- malformed model output、provider timeout、rate limit。
- 引用正确性、事实和 AI 推断区分、反馈记录。

## 参考来源

- OpenAI platform docs: Responses API、tools、structured outputs。
- AI SDK docs: streaming、structured output、provider abstraction patterns。
- pgvector project docs: PostgreSQL vector similarity search。
- Next.js docs: App Router Route Handlers and Server Actions.
