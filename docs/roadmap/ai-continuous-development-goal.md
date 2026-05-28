# AI 持续迭代开发 Goal

最后更新：2026-05-29

本文件把项目开发任务、开发线路、开发规范、当前文档和用户长期目标统筹成一个可执行
Goal。它用于指导 AI 在用户只说“继续”时如何自主推进项目。它不替代 OpenSpec；所有
非平凡产品、前端、AI、数据、接口、依赖、集成和部署变更仍必须先经过 OpenSpec。

## 总目标

把当前系统持续建设成一个面向羽毛球拍直播电商团队的中文 AI 运营工作台，让运营人员
愿意在真实工作中使用它，并且能明显节省准备、讲解、答疑、复盘和跟进成本。

系统最终应帮助团队做到：

- 直播前快速准备球拍商品、讲解顺序、目标人群、客户问题和异议回应。
- 直播中或直播后结构化记录场次、客户问题、商品表现和待补充知识。
- 从专业公开来源和团队经验沉淀可审核知识库，而不是把未经验证内容直接当事实。
- 用 AI 复盘直播内容，形成可编辑的话术、短视频选题和下一场任务。
- 用 Q&A Agent 回答运营问题，并通过点赞、点踩、编辑和缺失知识反馈持续改进。
- 在知识不足时，Agent 能说明不确定性，必要时查找公开来源，把发现送入审核流程。

## 目标用户

优先服务这些角色：

| 用户 | 主要工作 | 产品需要帮他们减少的负担 |
| --- | --- | --- |
| 直播运营 | 准备场次、排商品、记录问题、复盘效果 | 少翻表格和聊天记录，快速形成下场可执行动作 |
| 主播/助播 | 讲解球拍卖点、回应异议、推荐适合人群 | 少背零散知识，能按人群和打法快速讲清楚 |
| 商品负责人 | 维护型号、规格、价格带、适用人群和别名 | 避免型号混乱，保持讲解口径一致 |
| 团队负责人 | 看复盘、发现短板、安排任务和沉淀经验 | 把经验从个人记忆转成团队可复用资产 |

设计判断优先级：

1. 是否减少真实运营工作量。
2. 是否让球拍知识、直播话术和客户问题更容易复用。
3. 是否把 AI 输出和事实来源区分清楚。
4. 是否能在移动和桌面都高效使用。
5. 是否符合中文运营人员的表达习惯，避免过度技术化。
6. 是否能在不花哨、不增加心智负担的前提下，提供超出基础预期的产品亮点。

## 当前项目状态

已具备：

- Next.js App Router Web 基线，入口在 `apps/web`。
- 公开预览：`http://203.195.161.93:3000/`。
- 页面：总览、直播采集、球拍产品库、知识中枢、AI 复盘、话术资产、下场任务；其中
  `/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions`
  已进入 operator V0 浏览器工作流。
- 全局主题 token 和动效规范，集中在 `apps/web/src/app/globals.css` 和
  `apps/web/src/components/workspace-motion.tsx`。
- OpenSpec 能力规格、归档变更、项目规则和验证标准。
- 技术实施阶段路线：`docs/architecture/technical-implementation-roadmap.md`，用于约束认证、
  数据库、AI、RAG、队列、存储、集成和生产化阶段的技术选择与预留点。
- 技术蓝图基线已明确：后续 runtime work 必须先按阶段识别技术状态、前置契约、项目自有
  port/adapter、敏感数据边界、失败模式、回滚和验证，不能临时安装 provider 或跨层调用。
- 契约草案：球拍产品库、直播场次、知识生命周期、AI 复盘 run、Q&A Agent answer、
  认证/团队/租户、数据基础、话术资产和下场任务已形成文档边界，未来 runtime work
  必须先读取并更新对应契约。
- Agent/RAG 首选架构规划：LLM 必须经 `AiProviderPort`，用户指定 DeepSeek 已作为首个本地
  provider gate；PostgreSQL + pgvector 经 `RetrievalPort`，公开来源经 `SourceDiscoveryPort`，
  答案策略需评测。
- 本地-only 授权守卫基础：provider-neutral `AuthContext` 解析、role-permission policy、
  server-side guard、safe auth errors、`DataAccessContext` 转换和本地 `auth:check` 回滚式验证。
- 本地-only auth session runtime：`auth_sessions` ledger、opaque session reference hash、
  server-only session resolver、expired/revoked/invalidated 拒绝、脱敏和本地
  `auth:session-check` 回滚式验证。
- 本地-only auth cookie runtime：server-only session cookie issue/clear header、request cookie
  resolver、logout invalidation、脱敏、secure-by-default cookie policy、显式 internal V0
  HTTP preview cookie policy 和本地 `auth:cookie-check` 回滚式验证；cookie helper 本身仍不创建登录
  provider、middleware、公开登录路由或生产保存流程。
- 本地-only auth route runtime：`GET /api/auth/session` 安全会话视图、CSRF-checked
  `POST /api/auth/logout`、no-store 响应、脱敏和本地 `auth:route-check` 回滚式验证；仍不创建登录
  provider、middleware、公开登录路由、团队管理或业务 CRUD。
- 本地-only 数据基础 runtime：PostgreSQL 开发服务、Drizzle 配置和首个 migration、Zod
  校验、server-only database client、数据访问上下文、审计/幂等 repository 原语和本地
  `db:check` 回滚式验证。
- 本地-only 球拍产品库持久化切片：`racket_products`、`racket_product_aliases`、
  `racket_product_sources`、`racket_review_decisions`、Drizzle migration、server-only repository、
  输入校验、tenant/team scope、重复型号、别名冲突和来源冲突检测、来源登记、审核决策、
  发布门禁、下游 readiness 计算和本地 `rackets:check`、`rackets:source-review-check` 回滚式验证。
- 本地-only 球拍产品库 API runtime：`GET /api/rackets/products`、`POST /api/rackets/products`、
  `GET /api/rackets/review-queue`、source registration、submit、review decision 和 publish
  受保护 Route Handler 通过现有 auth cookie/session runtime、显式 tenant/team scope、
  CSRF mutation header、repository business rules、no-store 安全响应和本地 `rackets:route-check`
  回滚式验证，提供产品 create/list/source/review/publish 边界；仍不创建登录 provider、
  Server Action、产品编辑、公开来源导入/发现、AI/RAG snapshot 或生产保存流程。
- 本地-only operator V0 racket product workflow：`/rackets` 可进入本地 V0 团队上下文、
  加载 scoped 球拍产品、创建人工产品草稿、登记来源、提交审核、审核来源/产品、发布产品，
  并显示产品状态、审核队列、来源摘要和下游 readiness；不接 RAG，也不调用 AI。
- 本地-only 直播场次采集持久化切片：`live_session_captures`、`session_host_roles`、
  `session_product_order`、`session_notes`、`customer_questions`、`customer_objections`、
  Drizzle migration、server-only repository、输入校验、tenant/team scope、草稿版本冲突、
  重复标题日期检测、提交 readiness 计算和本地 `sessions:check` 回滚式验证。
- 本地-only 直播场次采集 API runtime：`GET /api/sessions/captures`、
  `POST /api/sessions/captures`、`GET /api/sessions/captures/[sessionId]`、
  `PATCH /api/sessions/captures/[sessionId]/draft` 和
  `POST /api/sessions/captures/[sessionId]/submit` 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地 `sessions:route-check` 回滚式验证，提供场次采集创建、列表、详情、草稿保存和提交边界；仍不创建登录
  provider、UI 保存流程、Server Action、转录导入、AI review trigger 或生产保存流程。
- 本地-only 知识生命周期持久化切片：`knowledge_sources`、`extracted_knowledge_claims`、
  `team_knowledge_notes`、`knowledge_review_decisions`、`published_knowledge_versions`、
  `knowledge_conflicts`、Drizzle migration、server-only repository、输入校验、tenant/team scope、
  来源去重、审核状态流转、冲突阻断、发布 readiness 计算和本地 `knowledge:check` 回滚式验证。
- 本地-only 知识生命周期 API runtime：`GET /api/knowledge/sources`、
  `POST /api/knowledge/sources`、`GET /api/knowledge/sources/[sourceId]`、
  `POST /api/knowledge/claims`、`POST /api/knowledge/team-notes`、
  `GET /api/knowledge/review-queue`、`POST /api/knowledge/review-decisions`、
  `POST /api/knowledge/conflicts`、`PATCH /api/knowledge/conflicts/[conflictId]`
  和 `POST /api/knowledge/versions` 通过现有 auth cookie/session runtime、显式
  tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和本地
  `knowledge:route-check` 回滚式验证，提供来源登记、claim、团队笔记、审核队列、审核决策、
  冲突处理和发布版本边界；仍不创建登录 provider、Server Action、公开来源抓取、
  RAG snapshot、Q&A 生成、AI 调用、刷新任务或生产保存流程。
- 本地-only operator V0 knowledge workflow：`/knowledge` 可进入本地 V0 团队上下文、
  加载 scoped 来源、登记官方或团队来源、创建人工 claim 和团队笔记、查看审核队列、记录审核通过，
  并通过受保护发布接口尝试发布版本；未审核或冲突内容不会自动成为权威知识。
- 本地-only AI 复盘 run 持久化切片：`ai_review_runs`、`ai_review_input_snapshots`、
  `ai_review_knowledge_snapshots`、`ai_review_prompt_versions`、`ai_provider_invocations`、
  `ai_review_outputs`、`ai_review_sections`、`ai_review_validation_results`、`ai_review_decisions`、
  `ai_review_feedback_signals`、`ai_review_downstream_artifacts`、Drizzle migration、
  server-only repository、输入校验、tenant/team scope、权限检查、敏感输入阻断、过期/冲突知识阻断、
  prompt 版本门禁、validation gate、人工审核下游门禁、反馈记录和本地 `ai-review:check`
  回滚式验证。
- 本地-only AI provider gate：server-only `AiProviderPort`、DeepSeek chat-completions adapter、
  环境变量密钥解析、结构化 JSON 输出校验、timeout / rate limit / auth / unavailable /
  malformed output / partial output 归一化错误、日志脱敏、fake-fetch verifier 和本地
  `ai-provider:check` 验证；默认不调用真实 DeepSeek。
- AI review live-model gate：`OPERATION_ENABLE_LIVE_AI_REVIEW=1` 加有效 DeepSeek 环境变量才允许
  `/ai-review` 选择真实模型生成；浏览器可读取 safe readiness，但不会看到密钥、完整 prompt、
  provider payload、cookie 或数据库连接串。`ai-review:live-gate-check` 默认不调用真实 DeepSeek，
  可选 live smoke 需要显式 `AI_REVIEW_LIVE_SMOKE=1`。
- 本地-only AI 复盘生成编排切片：server-only generation orchestrator、已脱敏输入快照和已审核知识快照
  门禁、prompt fingerprint、结构化输出 schema validation、source grounding / sensitive / stale /
  conflict / long input validation、provider 错误映射、fake-provider `ai-review:generation-check`；
  默认不调用真实 DeepSeek，不保存完整 prompt 或 provider payload。
- 本地-only AI 复盘执行服务：server-only execution service 串联 AI review run ledger、
  generation orchestrator 和 repository persistence，记录 provider metadata、结构化输出、validation results、
  `review_ready` / `validation_failed` / `provider_failed` 状态，并用 fake-provider
  `ai-review:execution-check` 回滚式验证；默认不调用真实 DeepSeek。
- 本地-only AI 复盘 API runtime：`POST /api/ai-review/prompt-versions`、
  `GET/POST /api/ai-review/runs`、`GET /api/ai-review/runs/[runId]`、
  execute、decisions、feedback-signals、downstream-artifacts 和 archive 受保护 Route Handler
  通过现有 auth cookie/session runtime、显式 tenant/team scope、`x-operation-csrf: ai-review`、
  execution service、repository business rules、safe JSON、no-store 响应和 fake-provider
  `ai-review:route-check` 回滚式验证，提供本地 prompt metadata、run prepare/list/detail、
  execution、人工审核、反馈、下游草案引用和归档边界；仍不创建浏览器保存 UI、Server Action、
  RAG snapshot、队列、生产 AI 发布或自动下游记录。
- 本地-only operator V0 AI review workflow：`/ai-review` 可进入本地 V0 团队上下文、加载已提交场次、
  准备 AI review run、通过本地 V0 fake provider 生成复盘建议、查看校验结果、记录人工采纳/暂不用，
  标记缺知识/来源不准/证据弱等反馈信号，并对已采纳的话术候选、短视频选题和下场动作创建下游草稿引用；
  下游使用也会保留为评测信号。默认不调用真实 DeepSeek，不接 RAG，也不自动发布话术或完成任务。
  当前可在 live-model gate ready 时显式选择真实模型生成，但输出仍只是待审核建议。
  当前证据可信度波次正在把整体置信、来源覆盖、校验提醒、反馈热点、人工审核进度和下游门槛汇总到
  `/ai-review`，并把这些信号派生成修复优先级，帮助运营判断哪段建议可用、先处理校验阻断、
  补知识、核来源、补证据、人工审核，还是把已采纳内容带到下游草稿。
- 本地-only operator V0 session workflow：`POST /api/auth/operator-v0-session` 在显式启用和
  CSRF header 下创建内部演示 operator/team session；`/sessions` 可进入本地 V0 团队上下文、
  加载 scoped 场次、创建草稿、保存摘要/问题/异议并提交到 review-ready；`/ai-review` 可复用该
  V0 context 进入本地 AI 复盘闭环，`/rackets`、`/knowledge`、`/talk-tracks` 和 `/next-actions`
  可复用该 V0 context 进入参考数据和下游草稿/任务闭环。它仍不是生产登录
  provider。默认 `Secure` cookie 规格意味着 HTTP 公网 IP 预览不应被当成完整 authenticated browser
  环境；如需内部 V0 HTTP 预览，必须同时显式开启 `OPERATION_ENABLE_V0_BOOTSTRAP=1` 和
  `OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE=1`，且只能使用演示/内部评估数据。
- 统一内部试用入口：工作区 shell、移动端试用条和 `/` 总览 cockpit 复用现有 V0 bootstrap、
  safe session view 和 logout route；浏览器只保存 tenant/team/actor 展示 scope，进入一次演示团队后
  可按建议路径访问 `/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和
  `/next-actions`，并通过本地 `internal-trial:check` 验证连续访问、退出失效和脱敏边界。
- Public trial auth foundation：`/trial` 提供受控试用访问入口，Next.js Proxy 对已实现工作面执行
  缺 app-owned session cookie 跳转到 `/trial?next=...` 的 route gate，并通过
  `public-trial-auth:check` 验证 route decision、unsafe next fallback、no-store 和脱敏；它不是生产登录
  provider，也不是最终授权层，业务数据仍由服务端 Route Handler、session resolver、tenant/team scope
  和 repository rule 授权。
- Internal trial MVP hardening 已归档：`/trial` ready 后的继续动作、`/` cockpit、六个已实现
  V0 工作面的受保护 list API 可达性、logout 后拒绝和敏感元数据脱敏由 `trial-mvp:check` 聚合验证；
  它用于可用版本收口，仍只允许演示/脱敏数据。
- V0 usable trial workflow 已完成 demo-data 和试用证据收口：`/` 和 `/trial` 在试用会话 ready 后汇总六个已实现工作面的
  scoped list API 结果，显示 V0 进度、每步记录数、已加载演示场景和下一步建议；本轮已通过
  deterministic V0 bootstrap 补齐一组脱敏演示数据，覆盖场次、球拍、资料、AI 复盘、话术和下场任务。
  当前 cockpit 已把工作面进度、反馈证据和本次六步试用运行证据组合为 V0.9 试用就绪判断，
  用 `继续收集`、`先修卡点`、`V0.9 可试用` 和 `准备生产门禁` 四个阶段引导下一步评估；
  V0 证据复核已把该阶段判断收口为内部 V0 发布结论、完整路径强度、反馈样本可信度、
  优先处理动作和生产门禁说明，帮助团队判断是否扩大内部试用、冻结 V0 或单独进入 V1 门禁规划；
  当前 V1 生产门禁 workflow 在 `/` 和 `/trial` 上把生产访问、HTTPS 域名、备份恢复、
  敏感数据治理、AI/RAG 评测和观测脱敏拆成可扫读的阻断项与下一波建议；生产访问与 HTTPS 已进一步
  拆成登录方案、公开登录路由、会话生命周期、团队入口、团队切换、CSRF/origin、服务端授权、
  域名、TLS、HTTPS 强制、secure cookie、预览/生产分离和回滚路径。它只用于内部/演示试用导航，
  不替代工作面自己的权限、审核、保存或生产 readiness 判断。
- V0 试用反馈收集和试用运行证据已补齐：`/` 和 `/trial` 在试用会话 ready 后提供
  低摩擦反馈入口，记录评估角色、工作面、有用程度、清晰程度、问题类型、简短备注和能否用于
  真实工作的信号；本次试用运行面板会按场次、球拍、资料、AI 复盘、话术和下场任务六步记录
  `通过`、`有卡点` 或 `跳过`，并把反馈可选关联到对应运行步骤。反馈和运行证据使用现有
  app-owned session、tenant/team/actor scope、CSRF、no-store 和本地 PostgreSQL 持久化，只用于
  演示/内部评估证据，不接外部 analytics 或第三方问卷。
- 本地-only 话术资产持久化切片：`talk_track_assets`、`talk_track_versions`、
  `talk_track_scenarios`、`talk_track_segments`、`talk_track_objection_patterns`、
  `talk_track_source_groundings`、`talk_track_review_decisions`、`talk_track_candidates`、
  `talk_track_usage_signals`、Drizzle migration、server-only repository、输入校验、tenant/team scope、
  权限检查、AI 候选审核阻断、来源发布门禁、重复场景阻断、readiness 计算和本地
  `talk-tracks:check` 回滚式验证。
- 本地-only 话术资产 API runtime：`GET /api/talk-tracks/assets`、
  `POST /api/talk-tracks/assets`、`GET /api/talk-tracks/assets/[assetId]`、candidate/review/
  publish/archive/restore/usage 受保护 Route Handler 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  `talk-tracks:route-check` 回滚式验证。
- 本地-only operator V0 talk-track workflow：`/talk-tracks` 可进入本地 V0 团队上下文、加载 scoped
  话术资产，从人工输入或已采纳 AI 复盘区块创建可复核草稿，并保留来源和审核状态；不会自动发布。
- 本地-only 下场任务持久化切片：`next_session_tasks`、`next_session_task_sources`、
  `next_session_task_assignees`、`next_session_task_checklist_items`、
  `next_session_task_dependencies`、`next_session_task_review_results`、
  `next_session_task_feedback_signals`、Drizzle migration、server-only repository、输入校验、
  tenant/team scope、权限检查、负责人活跃校验、状态流转、重复检测、敏感来源阻断、
  readiness 计算和本地 `next-actions:check` 回滚式验证。
- 本地-only 下场任务 API runtime：`GET /api/next-actions/tasks`、
  `POST /api/next-actions/tasks`、`GET /api/next-actions/tasks/[taskId]`、status/checklist/
  dependency/complete/review-result/feedback 受保护 Route Handler 通过现有 auth cookie/session
  runtime、显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  `next-actions:route-check` 回滚式验证。
- 本地-only operator V0 next-action workflow：`/next-actions` 可进入本地 V0 团队上下文、加载 scoped
  下场任务，从人工输入或已采纳 AI 复盘动作创建任务，并通过现有 status/checklist API 推进基础进度。

尚未具备：

- 登录 provider、公开登录路由、邀请、团队管理 UI 和生产认证服务；当前 public trial route gate
  只解决试用入口前的路由预过滤，不等同于生产登录。
- 面向用户的登录后完整 CRUD、Server Action、生产数据库 provider、连接池、备份和恢复；
  当前产品库 create/list、直播场次 create/list/detail/autosave/submit、知识生命周期
  source/claim/note/review/conflict/publish、话术资产 candidate/asset/review/publish/usage 和下场任务
  task/status/checklist/dependency/complete/review/feedback 具备 local-only 受保护 Route Handler 验证；
  `/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions`
  具备 operator V0 浏览器闭环；它们仍不是公开登录后的生产协作系统。
- AI 复盘完整生产模型发布、Server Action、RAG、Q&A 模型调用、Web discovery、公开审核队列 UI；
  当前已有 gated live-model MVP，但它不等于生产 AI 发布或评测体系。当前已有
  server-only DeepSeek provider adapter、AI 复盘 generation orchestrator、execution service、受保护
  API runtime、live-model gate 和 `/ai-review` 到下游工作台的本地 V0 fake-provider 浏览器 workflow 验证。
- 真实业务数据、抖音/电商平台集成、订单或私信接入。
- HTTP 公网 internal V0 preview cookie policy 不等于生产登录；正式试用仍需要 HTTPS、生产登录、
  备份/恢复和敏感数据治理。

## 可用版本完成口径

当前开发分成两个完成层级：

- 内部可试用 V0：目标是让运营或评估人员可以从 `/trial` 进入演示团队，按“场次 → 球拍 →
  资料 → AI 复盘 → 话术 → 下场任务”完整走一遍演示数据闭环，并通过 Playwright、本地检查、
  Docker 预览和公网 smoke 验证。按已实现工作面、API、权限、Docker、验证覆盖、演示数据和
  V0.9 试用就绪 cockpit、试用运行、反馈证据和 V0 证据复核收口估算，当前约 99%。
  剩余主要是真实评估中的操作卡点、公开试用说明、少量跨工作面细节打磨，以及根据反馈证据选择下一轮优先级。
- 生产可用版：需要生产登录/邀请/团队管理、HTTPS 域名、备份恢复、真实敏感数据治理、生产
  数据库运维、RAG/Q&A、公开来源发现、评测体系、监控和外部平台集成。它不能和内部 V0 使用
  同一个百分比口径，后续按 V1/V2 分阶段推进。当前 V1 门禁规划已把生产访问、HTTPS、
  备份、敏感数据、AI/RAG 评测和观测脱敏拆成可验证前置项，并已把生产访问与 HTTPS 细化为下一轮
  runtime 实施边界；下一轮优先推进生产登录与 HTTPS 实施，而不是继续做泛化门禁说明。

提效策略：先把内部 V0 做成可演示、可试用、可收集反馈的版本；提案按完整工作流或技术阶段
打包，不再按一两个接口拆小提案。生产能力只在验证 V0 价值和风险边界后逐步接入。
V0 试用反馈将作为下一轮 V0/V1 排序依据，但必须结合完整路径证据一起看：优先处理真实评估中
出现的体验卡点、AI 质量问题、来源信任问题和下游动作断点；只有完整路径、运行记录和反馈样本
都足够时，才把下一轮切到生产登录、HTTPS、备份、敏感数据治理、生产 AI 发布、RAG、正式评测
或复核队列。

## AI 自主迭代循环

当用户只说“继续”时，AI 按以下顺序推进：

1. 读取 `AGENTS.md`、`.codex/rules/README.md`、本文件、当前路线、
   accepted OpenSpec specs、当前工作树和公网预览状态。
2. 识别最能帮助目标用户的缺口，而不是优先做炫技功能。
3. 在需求分析或提案前，使用可靠专业来源、官方文档、标准组织资料、平台文档、
   行业资料或网络查询查证外部、不确定、专业或可能过期的信息，并记录来源为什么可信。
4. 在需求分析或提案前，按问题类型调用相关 skill 做价值探索，例如 OpenSpec 探索、
   产品发现、机会树、优先级、UI/UX、安全、AI、架构或代码审查类 skill。
5. 明确目标用户是谁、哪段直播电商工作流被改善、用户能获得什么结果、是否偏离初衷、
   是否有克制但能超出预期的产品亮点，以及如何验证。
6. 对非平凡变更创建或更新 OpenSpec change，明确为什么做、怎么做、风险、验收和任务。
   提案粒度按完整工作流或技术阶段规划，不按一两个接口拆分；优先把同一用户目标、
   数据边界、权限模型和验证路径下的相邻需求统筹进同一轮。
7. 如未来要接数据库、API、AI、RAG 或外部平台，先读取技术实施阶段路线和对应契约草案，
   再实现运行时代码。
8. 实现最小可验证的工作流或阶段闭环，避免一次性做过大系统，也避免把有共同价值链路的
   需求拆成过碎提案。
9. 运行对应验证；需要浏览器或公网体验验证时，Playwright 必须在归档前的测试阶段执行。每次
   OpenSpec 归档后必须同步 git 并部署 Docker 预览。
10. 开发中如果发现当前计划不符合业务常理、偏离用户需求、与规范冲突、价值不足或有更小更好的切片，
    先调整 OpenSpec、契约、规则、路线或任务，再继续实现。
11. 把新发现的路线、风险、协作需求或后续任务写回本文件、路线或 OpenSpec。

## 开发线路

当前按四条主线推进。每轮开发只选一个最小闭环，完成后再推进下一项。

### 1. 产品运营工作流

目标：让页面从展示型工作台逐步变成真实运营工具。

当前优先级：

1. 内部 V0 demo-data 和试用路径已完成本轮收口：进入 `/trial` 后应自动拥有一组脱敏演示样例，
   可直接检查场次、球拍、资料、AI 复盘、话术和下场任务，不再要求评估者先手工造完整数据。
   下一步不重复做 demo seed，而是用 2-3 条完整试用路径收集卡点和反馈证据。
2. 球拍产品库已进入本地 V0 浏览器 source/review/publish 阶段，产品、别名、来源、审核和发布门禁
   repository 已落地，create/list/source/review/publish 已有 local-only 受保护 Route Handler，
   `/rackets` 可本地创建和加载 scoped 产品草稿、登记来源、审核并发布；下一步避免重复，应转向
   产品编辑、版本化 snapshot、公开来源发现、RAG 前置契约或生产登录前置能力。
3. 直播场次草稿、长文本、问题异议和提交 readiness 已进入本地 repository 与受保护 API runtime
   验证阶段；下一步若做公开保存流程，应基于已有 Route Handler 补浏览器表单状态、薄 Server Action
   或 fetch wrapper、真实登录会话和冲突恢复体验。
4. 知识生命周期来源、claim、团队笔记、审核队列、审核决策、发布版本和冲突处理已进入本地
   repository、受保护 API runtime 和 `/knowledge` operator V0 浏览器保存/审核/发布尝试阶段；下一步若开放
   刷新任务、web discovery、AI/RAG grounding、反馈学习、版本回滚或公开审核 UI，
   必须先更新 `docs/contracts/knowledge-lifecycle.md` 和对应 OpenSpec。
5. AI 复盘输入快照、知识快照、输出、失败状态、人工审核、server-only generation orchestrator、
   server-only execution service、受保护 API runtime 和 `/ai-review` operator V0 浏览器 workflow
   已进入本地验证阶段；已采纳区块可记录下游引用并进入话术/任务 V0 工作台，反馈学习闭环会把
   采纳、拒绝、缺知识、来源不准、证据弱和下游使用沉淀为后续评测/复核信号。下一步若接
   RAG snapshot、生产 provider 发布、Server Action、队列、公开试用登录、正式反馈队列 UI 或自动发布/自动完成的正式下游流程，
   必须先更新 `docs/contracts/ai-review-run.md` 并创建对应 OpenSpec。
6. 话术资产和下场任务闭环；话术资产和下场任务均已具备本地 repository、受保护 API runtime 和
   operator V0 浏览器工作流验证，后续发布审核 UI、团队搜索、通知、日历、导出、公开 CRUD 或生产团队协作
   仍需真实认证和单独 OpenSpec。

### 2. Agent 和知识库

目标：让 AI 回答越来越准，但不牺牲可追溯性和审核。

阶段顺序：

1. 只基于已审核知识回答。
2. 支持用户点赞、点踩、编辑原因和代表性问题评测。
3. 识别缺失知识、过期知识、冲突来源和低置信答案。
4. 允许查找公开来源，但结果只能进入 review-only finding。
5. 审核通过后，知识才进入可用于回答的版本化知识库。

### 3. 技术基础

目标：为真实数据、AI、RAG 和多用户使用预留稳定边界。

当前策略：

- 后端、认证、数据库、AI、RAG、队列、存储、集成和生产化必须遵循
  `docs/architecture/technical-implementation-roadmap.md` 的阶段路线；如果发现路线不对，
  先更新路线和 OpenSpec，再实现。
- 技术预留优先通过契约、stage gate、port/adapter、验证计划和 provider decision gate 完成；
  不为了“以后可能会用”提前装 SDK、建表、接 AI、接队列、接对象存储或绑定部署平台。
- Route Handler / Server Action 之前先定义契约。
- 数据模型保留羽毛球拍领域语言，例如型号、重量、平衡点、杆硬度、磅数、打法、人群、
  价格带、卖点和异议。
- 认证、数据库、AI provider、RAG、外部平台都必须独立 OpenSpec。
- UI 不直接调用数据库、向量库、搜索服务或 LLM。

### 4. 体验和设计系统

目标：保持现代、美观、统一、密集但不压迫的中文运营工具体验。

规则：

- 风格通过全局 token 管理，避免页面局部硬编码大量颜色、圆角、阴影和状态色。
- 工作台优先使用清晰的信息结构、可扫读列表、状态标签、行动按钮和稳定布局。
- 动效用于帮助理解结构和状态，不做营销式大动画。
- 每个真实功能都要考虑 loading、empty、error、success、disabled、移动端和桌面端。
- AI 输出必须明显区别于人工录入事实。

## 研究、skill 和依赖策略

AI 可以自主查资料、使用 skill、安装合适的 skill 或提出新依赖，但必须遵守：

- 每次开始非平凡需求分析或创建提案前，都要先做可靠来源查证和相关 skill 价值探索。
  这不是形式要求，必须影响或确认范围、用户价值、风险、验证或优先级。
- 当前资料可能过期、涉及官方 API、库版本、平台规则、法律、安全或市场实践时，必须查证。
- 技术决策优先看官方文档、标准组织或上游项目资料；产品和行业判断记录来源类型、
  可信度、时间和局限，不把假消息、营销材料或不可验证信息当数据源。
- skill 选择要跟任务匹配：需求不清时用 OpenSpec 或产品发现类 skill，界面和体验工作用
  UI/UX 类 skill，AI/安全/数据工作用相应风险类 skill，架构和代码质量工作用工程审查类
  skill。不要固定套用一个 skill 走形式。
- 提案必须写清用户视角：哪个角色受益、什么工作更容易、当前摩擦减少了什么、用户通过
  功能能得到什么结果和收获。
- 提案必须先做全盘相邻需求梳理：不要因为只有一两个接口就单独开提案；同一工作流、
  同一权限/数据边界、同一验证路径的能力应合并为一个明确阶段，只有遇到架构决策、
  provider/依赖边界、风险显著不同或单轮无法可靠验证时才拆分。
- 允许追求高于基础预期的体验，但亮点必须服务操作效率、清晰度、信任感、复用和决策质量；
  不能为了新奇、动画、装饰或大段文案牺牲工作台效率和代码基准。
- 开发过程中要持续校验方向：如果发现需求偏离业务、规范互相冲突、实现不符合常理、
  用户不会觉得有价值，或当前方案无法满足预期，应及时更新 OpenSpec、契约、规则、路线或任务，
  再继续写代码。
- 新 npm 依赖必须先在 OpenSpec design 中说明问题、替代方案、维护风险、许可证风险、
  运行影响、失败模式、回滚路径和验证命令。
- 研究得到的行业知识不能直接成为 AI 权威答案，必须进入来源元数据、信任等级、审核、
  版本和刷新流程。

## 用户需要如何配合

默认情况下，AI 应自主推进，不反复等待确认。需要用户配合的情况只限于：

- 外部账号或权限：GitHub deploy key、云平台、防火墙、域名、SSL、第三方平台账号。
- 真实业务判断：哪些商品、价格、供应链、话术或团队流程是事实。
- 敏感数据授权：客户聊天、订单、直播录屏、内部销售数据、供应商信息。
- 高风险上线决策：接真实 AI provider、数据库、登录、付费服务或外部平台。
- 无法从公开资料判断的业务优先级。

当前已知协作项：

- GitHub 推送需要用户把服务器公钥加入 `kankan98/operation` 仓库 Deploy keys，并勾选
  `Allow write access`。在完成前，本地提交和开发可以继续，但无法推送到远程。

## 每轮完成证据

每个开发波次结束前，AI 必须提供或保留这些证据：

- 改了什么：文件、规格、页面、契约或文档。
- 为什么改：对应的用户工作流、路线项或 OpenSpec requirement。
- 提案前证据：可靠来源、source reliability、使用过的相关 skill、用户价值判断和是否偏离初衷。
- 开发中修正：如调整过规范、契约、路线或任务，说明触发原因和新决策。
- 验证结果：`openspec validate`、lint、typecheck、build、Playwright、curl、Docker 或手动检查。
- 跳过了什么：未跑的验证和原因。
- 公网状态：影响预览时说明容器和关键路由状态。
- 整体复盘：每轮结束先看当前项目进度、已接受规格、路线、阻塞项、预览状态和用户价值，
  再判断下一轮做什么，避免盲目连续开发。
- Docker / git / Playwright 节奏：Playwright 属于归档前测试阶段；每次 OpenSpec change
  归档后必须同步 git remote 并部署公网 Docker 预览。未归档的开发中小改动仍避免频繁部署，
  除非用户要求、预览故障修复或必须公开验证的前端变化。
- Git 提交规范：提交消息必须使用 Conventional Commits 格式 `type(scope): subject`；
  type 必须是 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`perf`、`build`、
  `ci`、`revert` 等专业前缀，不能使用“update”“sync”或无前缀中文描述。
- 剩余风险：外部权限、真实数据、AI 质量、未接后端、未做评测等。
- 下一候选任务：继续时应该从哪里接上。

## 当前最佳下一步

在 GitHub 凭据尚未完成前，继续推进本地可验证工作：

1. `racket-product-library` 契约草案已建立，且本地-only 产品、别名、来源、审核决策、发布门禁
   repository、产品 create/list/source/review/publish 受保护 Route Handler 和 `/rackets` operator V0
   浏览器 source/review/publish 入口已部分实现；后续产品库编辑、公开来源导入/发现、Server Action、
   AI/RAG grounding 或版本化 snapshot 必须先读取并更新
   `docs/contracts/racket-product-library.md`。
2. `session-capture` 契约草案已建立，且本地-only 场次、主播职责、商品顺序、笔记、
   客户问题、购买异议、草稿 autosave、提交 readiness repository 和 create/list/detail/autosave/submit
   受保护 Route Handler 已部分实现，`/sessions` operator V0 浏览器保存闭环已打通；后续多商品编辑、
   Server Action wrapper、转录导入、AI 复盘输入或外部平台同步必须先读取并更新
   `docs/contracts/session-capture.md`。
3. `knowledge-lifecycle` 契约草案已建立，且本地-only 来源登记、claim、团队笔记、审核队列、
   审核决策、冲突处理、发布版本、readiness repository/API runtime 和 `/knowledge` operator V0
   浏览器保存/审核/发布尝试入口已部分实现；后续刷新任务、web discovery、RAG snapshot、Q&A grounding 或版本回滚必须先读取并更新
   `docs/contracts/knowledge-lifecycle.md`。
4. `ai-review-run` 契约草案已建立，且本地-only run、输入快照、知识快照、prompt 版本元数据、
   provider 元数据、结构化输出、校验结果、人工审核、反馈和下游引用 repository 已部分实现；
   本地 DeepSeek `AiProviderPort` adapter、server-only generation orchestrator、server-only execution service、
   受保护 AI 复盘 API runtime、`/ai-review` operator V0 浏览器 workflow、`ai-provider:check`、
   `ai-review:generation-check`、`ai-review:execution-check`、`ai-review:route-check` 和
   `ai-review:v0-check` 已落地，且已采纳区块可进入 `/talk-tracks` 和 `/next-actions` V0 工作台；
   当前反馈学习波次把质量信号显式展示并路由到评测、知识复核或提示词复核，但不自动改知识；
   后续 RAG snapshot、Server Action、生产模型发布、自动发布/自动完成的正式下游流程、队列、正式评测工作台或 Q&A
   必须先读取并更新 `docs/contracts/ai-review-run.md`。
5. `qa-agent-answer` 契约草案已建立；后续 Q&A Agent provider 调用、RAG 检索、答案持久化、
   引用展示、反馈、缺失知识、web discovery 审核流或评测必须先读取并更新
   `docs/contracts/qa-agent-answer.md`。
6. `auth-team-tenant` 契约草案已建立，且本地-only 授权守卫基础、app-owned session runtime、
   server-only cookie/request runtime、session/logout auth route runtime、统一内部试用入口和 public trial
   route gate 已部分实现；后续认证 provider 选择、公开登录路由、团队、租户、角色、
   成员、邀请、受保护路由/API/Server Action、tenant-scoped repository 或导出必须先读取并更新
   `docs/contracts/auth-team-tenant.md`。
7. `data-foundation` 契约草案已建立，且本地-only 数据基础 runtime 已部分实现；后续
   workflow-specific schema、repository、transaction、idempotency、审计字段、tenant/team-scoped
   persistence 或长文本保存必须先读取并更新 `docs/contracts/data-foundation.md`。
8. 技术实施阶段路线和技术蓝图基线已建立；后续认证、数据库、AI、RAG、队列、存储、集成和
   部署必须先读取 `docs/architecture/technical-implementation-roadmap.md`，明确阶段、技术状态、
   port/adapter、敏感数据、回滚和验证。
9. `talk-track-asset` 契约草案已建立，且本地-only 资产、版本、场景、区块、来源引用、
   AI 候选、审核发布和复用反馈 repository/API runtime 已部分实现；`/talk-tracks` operator V0 浏览器
   workflow 已支持人工或已采纳 AI 复盘来源创建可复核草稿。后续 Server Action、发布审核 UI、
   Q&A/RAG grounding、团队搜索或短视频 hook 专属模型必须先读取并更新 `docs/contracts/talk-track-asset.md`。
10. `next-session-task` 契约草案已建立，且本地-only 任务、来源证据、负责人、检查项、
    依赖、审核结果、反馈信号、状态流转、重复检测、敏感来源阻断和 readiness repository/API runtime
    已部分实现；`/next-actions` operator V0 浏览器 workflow 已支持人工或已采纳 AI 复盘来源创建任务，
    并通过 status/checklist API 推进基础进度。后续 Server Action、通知、日历、导出、团队回看或跨团队指派
    必须先读取并更新 `docs/contracts/next-session-task.md`。
11. 下一步不应再重复做数据基础、授权守卫基础、auth session runtime、auth cookie runtime、auth route runtime、
    产品/别名 repository 基础、产品库 create/list/source/review/publish Route Handler、产品库 V0 浏览器 source/review/publish 入口、产品库
    来源/审核/发布门禁、直播场次 repository/API/browser V0 基础、知识生命周期 repository/API runtime 基础、知识库 V0 浏览器保存入口、AI 复盘 run
    repository 基础、话术资产 repository/API runtime 基础、下场任务 repository/API runtime 基础、DeepSeek provider gate、
    AI 复盘 generation orchestrator 基础、AI 复盘 execution service 基础、AI 复盘受保护 API runtime 基础或
    `/sessions` 到 `/ai-review` 再到 `/talk-tracks` / `/next-actions` 的 V0 浏览器闭环、AI 复盘反馈学习基础或 public trial route gate；
    更合理的候选是阶段 2 provider/login 选择、team switching、产品库编辑、知识库刷新/版本回滚、
    正式 AI 复盘评测工作台、RAG 前置切片或队列设计。
    Q&A runtime、web discovery 和自动知识改写仍按技术实施阶段路线后置推进。

这些契约前置项优先于真实后端实现，因为它们能减少后续接数据库、AI 和 RAG 时的返工。
