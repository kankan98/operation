# 自主迭代开发路线

最后更新：2026-05-29

本路线是项目持续开发的工作底稿。它不替代 OpenSpec；所有非平凡产品、
前端、AI、数据、集成和依赖变更仍必须先创建或更新 OpenSpec change。

AI 持续迭代开发的总目标、目标用户、协作边界、研究规则、体验质量门槛和完成证据见
`docs/roadmap/ai-continuous-development-goal.md`。本文件负责路线排序和当前状态；Goal
文档负责解释为什么继续、如何选择下一轮工作、什么时候需要用户配合。

## 目标

把当前项目持续建设成面向羽毛球拍直播电商团队的中文 AI 运营工作台，帮助运营人员：

- 准备直播场次、商品讲解顺序和客户问题。
- 管理球拍规格、卖点、别名、适用人群和对比话术。
- 从公开专业来源和团队经验补充可审核知识库。
- 用 AI 复盘直播内容，产出可编辑的话术、短视频选题和下场任务。
- 通过问答 Agent 快速获得可追溯答案，并用反馈持续提升回答质量。

## 当前基线

公网预览：`http://203.195.161.93:3000/`

技术基线：

- pnpm workspace。
- Next.js App Router、TypeScript、React、Tailwind CSS。
- shadcn/ui-compatible primitives、lucide-react、motion。
- Docker 生产镜像 `operation-web:latest`，公网容器 `operation-web-preview` 映射 3000 端口。
- 技术实施阶段路线见 `docs/architecture/technical-implementation-roadmap.md`。
- 技术蓝图基线要求 runtime work 先确认阶段、已接受/默认/延后技术状态、项目自有
  port/adapter、敏感数据边界、失败模式、回滚和验证。
- Agent 架构规划见 `docs/architecture/agent-architecture.md`。
- 后端/API/AI/RAG 契约草案入口见 `docs/contracts/README.md`。
- 已有契约草案覆盖球拍产品、直播场次、知识生命周期、AI 复盘 run、Q&A Agent answer、
  认证/团队/租户、数据基础、话术资产和下场任务。
- 本地-only 授权守卫基础已部分实现：provider-neutral auth context、role-permission policy、
  server-side guard、safe auth errors、data access context 转换和本地回滚式 smoke check。
- 本地-only auth session runtime 已部分实现：`auth_sessions` ledger、opaque session reference hash、
  server-only session resolver、expired/revoked/invalidated 拒绝、脱敏和本地 `auth:session-check`
  回滚式 smoke check。
- 本地-only auth cookie runtime 已部分实现：server-only session cookie issue/clear header、request
  cookie resolver、logout invalidation、脱敏、secure-by-default cookie policy、显式 internal V0
  HTTP preview cookie policy 和本地 `auth:cookie-check` 回滚式 smoke check。
- 本地-only auth route runtime 已部分实现：`GET /api/auth/session` 安全会话视图、CSRF-checked
  `POST /api/auth/logout`、no-store 响应、脱敏和本地 `auth:route-check` 回滚式 smoke check。
- 本地-only operator V0 bootstrap 已部分实现：`POST /api/auth/operator-v0-session` 在显式启用和
  CSRF header 下创建内部演示 operator/team session，用于本地 `/sessions`、`/rackets`、
  `/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions` 浏览器工作流；它不是生产登录 provider。
- 统一内部试用入口已部分实现：工作区 shell、移动端试用条和 `/` 总览 cockpit 复用现有 V0
  bootstrap、safe session view 和 logout route，集中处理 stored display scope、scoped API URL、
  session verification、退出和安全错误提示，并用本地 `internal-trial:check` 回滚式 smoke check 验证。
- Public trial auth foundation 已部分实现：`/trial` 提供受控试用访问入口，Next.js Proxy 对
  `/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions`
  执行缺 app-owned session cookie 跳转到 `/trial?next=...` 的 route gate，并用
  `public-trial-auth:check` 验证 route decision；最终数据授权仍在受保护 Route Handlers 和 repository。
- Internal trial MVP hardening 已归档：`/trial` ready 后的继续动作、`/` cockpit、六个已实现
  工作面的受保护 list API 可达性、logout 后拒绝和敏感元数据脱敏由 `trial-mvp:check` 聚合验证；
  目标是把现有 V0 工作台收口成可试用版本，而不是引入生产登录或真实敏感数据入口。
- V0 trial demo data 已完成本轮收口：internal V0 bootstrap 已补齐一组 deterministic、tenant/team-scoped、
  脱敏演示场景，覆盖直播场次、球拍产品、知识资料、AI 复盘、话术资产和下场任务；`/trial`
  和 `/` cockpit 会提示已加载样例和建议检查路径，用于减少首次评估前的手工造数成本。
- V0 试用反馈收集和试用运行证据已补齐：`/trial` 和 `/` cockpit 在 verified trial session 后
  提供结构化反馈入口，通过本地-only `v0_trial_feedback` 记录评估角色、工作面、评分、问题类型、
  简短备注和真实工作可用性；本地-only `v0_trial_runs` / `v0_trial_run_steps` 记录评估人员是否跑完
  场次、球拍、资料、AI 复盘、话术和下场任务六步路径，并把反馈可选关联到运行步骤；它不接
  外部 telemetry、analytics SDK 或第三方问卷。
- V0.9 试用就绪 cockpit 已接入试用运行证据：`/trial` 和 `/` 在 verified trial session 后把六个工作面的
  protected readiness、scoped feedback evidence、trial run evidence、下一步动作和六步试用 checklist
  组合为内部试用阶段，明确区分继续收集、先修卡点、V0.9 可试用和生产门禁规划。V0 证据复核已把这些证据
  收口成内部发布结论、完整路径强度、反馈样本可信度、优先动作和生产门禁说明。当前 V1 生产门禁 workflow
  把生产访问、HTTPS 域名、备份恢复、敏感数据治理、AI/RAG 评测和观测脱敏拆成可扫读的阻断项和下一波建议；
  其中生产访问与 HTTPS 已进一步拆成登录方案、公开登录路由、会话生命周期、团队入口、团队切换、
  CSRF/origin、服务端授权、域名、TLS、HTTPS 强制、secure cookie、预览/生产分离和回滚路径。
  它不等于生产登录、HTTPS、备份、敏感数据治理、RAG/Q&A 或生产监控已经完成。
- 本地-only 数据基础 runtime 已部分实现：PostgreSQL 开发服务、Drizzle schema/migration、
  Zod 校验、server-only database client、审计/幂等 repository 原语和本地回滚式 smoke check。
- 本地-only 球拍产品库持久化切片已部分实现：产品、别名、来源、审核决策和发布门禁
  schema/migration、server-only repository、输入校验、tenant/team scope、重复型号、别名冲突
  和来源冲突检测、审核状态流转、下游 readiness 和本地回滚式 smoke check。
- 本地-only 球拍产品库 API runtime 已部分实现：`GET /api/rackets/products`、
  `POST /api/rackets/products`、`GET /api/rackets/review-queue`、source registration、submit、
  review decision 和 publish 受保护 Route Handler 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式 smoke check，提供产品 create/list/source/review/publish 边界。
- `/rackets` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载 scoped
  球拍产品、创建人工产品草稿、登记来源、提交审核、审核来源/产品、发布产品，并显示产品状态、
  审核队列、来源摘要和下游 readiness；产品编辑、公开来源导入/发现和 AI/RAG grounding 仍未开放。
- 本地-only 直播场次采集持久化切片已部分实现：场次、主播职责、商品顺序、场次笔记、
  客户问题和购买异议 schema/migration、server-only repository、输入校验、tenant/team scope、
  草稿版本冲突、重复标题日期检测、提交 readiness 和本地回滚式 smoke check。
- 本地-only 直播场次采集 API runtime 已部分实现：`GET /api/sessions/captures`、
  `POST /api/sessions/captures`、`GET /api/sessions/captures/[sessionId]`、
  `PATCH /api/sessions/captures/[sessionId]/draft` 和
  `POST /api/sessions/captures/[sessionId]/submit` 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式 smoke check，提供场次采集创建、列表、详情、草稿保存和提交边界。
- `/sessions` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载 scoped 场次、
  创建草稿、保存摘要/问题/异议并提交到 review-ready；转录上传、平台同步、直接 AI 生成和
  生产登录仍未开放。auth cookie 默认要求 `Secure`；HTTP 公网 IP 预览只有在显式开启 internal
  V0 preview cookie policy 后才可跑完整 authenticated browser flow，且只能使用演示/内部评估数据。
- 本地-only 知识生命周期持久化切片已部分实现：来源、抽取 claim、团队知识笔记、审核决策、
  发布版本和冲突记录 schema/migration、server-only repository、输入校验、tenant/team scope、
  来源去重、审核状态流转、冲突阻断、发布 readiness 和本地回滚式 smoke check。
- 本地-only 知识生命周期 API runtime 已部分实现：`GET /api/knowledge/sources`、
  `POST /api/knowledge/sources`、`GET /api/knowledge/sources/[sourceId]`、
  `POST /api/knowledge/claims`、`POST /api/knowledge/team-notes`、
  `GET /api/knowledge/review-queue`、`POST /api/knowledge/review-decisions`、
  `POST /api/knowledge/conflicts`、`PATCH /api/knowledge/conflicts/[conflictId]`
  和 `POST /api/knowledge/versions` 通过现有 auth cookie/session runtime、显式
  tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式 smoke check，提供来源登记、claim、团队笔记、审核、冲突处理和发布版本边界。
- `/knowledge` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载 scoped 来源、
  登记官方或团队来源、创建人工 claim 和团队笔记、查看审核队列、记录审核通过，并通过受保护发布接口
  尝试发布版本；公开抓取、刷新任务、RAG snapshot、Q&A 生成和版本回滚仍未开放。
- 本地-only AI 复盘 run 持久化切片已部分实现：输入快照、知识快照、prompt 版本元数据、
  provider 调用元数据、结构化输出、输出区块、校验结果、人工审核、反馈信号和下游草案引用
  schema/migration、server-only repository、输入校验、tenant/team scope、权限检查、敏感/过期/冲突阻断、
  validation gate、下游门禁和本地回滚式 smoke check。
- 本地-only AI provider gate 已部分实现：server-only `AiProviderPort`、DeepSeek chat-completions
  adapter、环境变量密钥解析、结构化 JSON 输出校验、provider 失败归一化、日志脱敏和
  `ai-provider:check` fake-fetch smoke check；默认不调用真实 DeepSeek。
- AI review live-model gate 已部分实现：`OPERATION_ENABLE_LIVE_AI_REVIEW=1` 加有效 DeepSeek
  环境变量才允许 `/ai-review` 选择真实模型生成；浏览器只读取 safe readiness，默认仍可使用
  本地 V0 fake provider；`ai-review:live-gate-check` 默认不调用真实 DeepSeek。
- 本地-only AI 复盘生成编排切片已部分实现：server-only generation orchestrator、已脱敏输入快照和
  已审核知识快照门禁、prompt fingerprint、结构化输出 schema validation、source grounding /
  sensitive / stale / conflict / long input validation、provider 错误映射和
  `ai-review:generation-check` fake-provider smoke check；默认不调用真实 DeepSeek。
- 本地-only AI 复盘执行服务已部分实现：server-only execution service 串联 AI review run ledger、
  generation orchestrator 和 repository persistence，记录 provider metadata、结构化输出、validation results、
  `review_ready` / `validation_failed` / `provider_failed` 状态，并用
  `ai-review:execution-check` fake-provider 回滚式验证；默认不调用真实 DeepSeek。
- 本地-only AI 复盘 API runtime 已部分实现：`POST /api/ai-review/prompt-versions`、
  `GET/POST /api/ai-review/runs`、`GET /api/ai-review/runs/[runId]`、
  execute、decisions、feedback-signals、downstream-artifacts 和 archive 受保护 Route Handler
  通过现有 auth cookie/session runtime、显式 tenant/team scope、`x-operation-csrf: ai-review`、
  execution service、repository business rules、safe JSON、no-store 响应和
  `ai-review:route-check` fake-provider 回滚式验证。
- `/ai-review` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载已提交场次、
  准备 AI review run、通过本地 V0 fake provider 生成复盘建议、查看校验结果、记录人工采纳/暂不用，
  标记缺知识、来源不准、证据弱等反馈信号，并对已采纳的话术候选、短视频选题和下场动作创建下游草稿引用；
  下游使用会保留为后续评测信号。默认不调用真实 DeepSeek，不接 RAG，也不自动发布话术或完成任务；
  当 live-model gate ready 时可显式选择真实模型生成。
  当前证据可信度波次把已有 output confidence、source refs、validation results、decisions 和
  feedback signals 聚合为运行级 cockpit、区块级复核提示和修复优先级，帮助运营先判断可用性、
  证据缺口、处理顺序和下游门槛。
- 本地-only 话术资产持久化切片已部分实现：资产、版本、场景、区块、异议回应、来源引用、
  AI 候选、审核决策和复用反馈 schema/migration、server-only repository、输入校验、tenant/team scope、
  权限检查、AI 候选审核阻断、发布门禁、重复场景阻断、readiness 和本地回滚式 smoke check。
- 本地-only 话术资产 API runtime 已部分实现：`GET /api/talk-tracks/assets`、
  `POST /api/talk-tracks/assets`、`GET /api/talk-tracks/assets/[assetId]`、candidate/review/
  publish/archive/restore/usage 受保护 Route Handler 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式 smoke check。
- `/talk-tracks` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载 scoped
  话术资产，从人工输入或已采纳 AI 复盘区块创建可复核草稿，并保留来源和审核状态；不会自动发布。
- 本地-only 下场任务持久化切片已部分实现：任务、来源证据、负责人、检查项、依赖、
  审核结果和反馈信号 schema/migration、server-only repository、输入校验、tenant/team scope、
  权限检查、负责人活跃校验、状态流转、重复检测、敏感来源阻断、readiness 和本地回滚式
  smoke check。
- 本地-only 下场任务 API runtime 已部分实现：`GET /api/next-actions/tasks`、
  `POST /api/next-actions/tasks`、`GET /api/next-actions/tasks/[taskId]`、status/checklist/
  dependency/complete/review-result/feedback 受保护 Route Handler 通过现有 auth cookie/session
  runtime、显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式 smoke check。
- `/next-actions` operator V0 浏览器工作流已部分实现：可进入本地 V0 团队上下文、加载 scoped
  下场任务，从人工输入或已采纳 AI 复盘动作创建任务，并通过现有 status/checklist API 推进基础进度。

已实现页面：

| 路由 | 当前状态 |
| --- | --- |
| `/` | 工作台总览、线路状态、能力边界 |
| `/trial` | 受控试用访问入口，进入演示团队后继续到目标工作面 |
| `/sessions` | Operator V0 直播场次采集工作流 |
| `/rackets` | Operator V0 球拍产品库工作流 |
| `/knowledge` | Operator V0 资料来源工作流 |
| `/ai-review` | Operator V0 AI 复盘工作流，可创建下游引用 |
| `/talk-tracks` | Operator V0 话术资产工作流 |
| `/next-actions` | Operator V0 下场任务工作流 |

当前不包含：

- 登录 provider、公开登录路由、邀请、团队管理 UI 和生产认证服务；当前已有 public trial route gate，
  但它不是生产登录或最终授权层。
- 面向用户的登录后真实持久化、完整受保护 CRUD、Server Action 保存流程、生产数据库 provider、
  连接池、备份和恢复；当前产品库 create/list/source/review/publish、直播场次 create/list/detail/autosave/submit 和
  知识生命周期 source/claim/note/review/conflict/publish、话术资产 candidate/asset/review/publish/usage
  和下场任务 task/status/checklist/dependency/complete/review/feedback 具备 local-only
  受保护 Route Handler 验证，`/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks`
  和 `/next-actions` 具备 operator V0 浏览器闭环；它们仍不是公开登录后的生产协作系统。
- AI 复盘完整生产模型发布、Server Action、RAG 上下文选择、Q&A 模型调用和自动发布/自动完成的正式下游流程；
  当前已有 gated live-model MVP，但它不等于生产 AI 发布、评测体系或真实敏感数据入口。当前已有
  server-only DeepSeek provider adapter、AI 复盘 generation orchestrator、execution service、受保护
  API runtime、live-model gate 和 `/ai-review` 到下游工作台的本地 V0 fake-provider 浏览器工作流验证。
- 公开来源采集、网页搜索、审核队列、刷新任务。
- 抖音、电商后台、订单、私信、支付、结算或公开商城能力。
- Auth provider、对象存储、队列、分析、监控和生产部署 provider 尚未最终选定。
- Internal V0 HTTP preview cookie policy 只解决公网预览内部评估访问，不代表生产登录、HTTPS、
  备份/恢复或真实敏感数据入口。

## 全局标准

开发标准：

- `AGENTS.md` 是项目级入口。
- `.codex/rules/` 是 AI 协作、质量、安全、验证和前端 AI 产品规则。
- `openspec/specs/` 是已接受能力的真实合同。
- `openspec/changes/<change>/` 是当前变更的 proposal、design、spec 和 tasks。

视觉与动效标准：

- 全局主题 token 统一在 `apps/web/src/app/globals.css` 管理。
- 组件优先使用语义类和 `workbench-*` utility，不在局部硬编码色值。
- 动效 token 统一在 `globals.css`，React 动效只通过
  `apps/web/src/components/workspace-motion.tsx` primitives 使用。
- 未来换品牌色、密度、圆角、状态色、hover、focus 或动效节奏，优先改全局 token。

验证标准：

- OpenSpec 变更必须运行 `openspec validate <change>`。
- 前端代码变更通常运行 `pnpm lint`、`pnpm typecheck`、`pnpm build`。
- 有页面变化时使用 Playwright 检查桌面/移动、溢出、控制台错误和关键交互。
- 影响公网预览时运行 `pnpm docker:build`，重启 `operation-web-preview`，并检查公网 URL。
- 静态工作台进入真实后端、数据库、AI 或 RAG 实现前，必须先写接口契约草案。
- 后端、认证、数据库、AI、RAG、队列、存储、外部集成、部署或观测实现前，必须先检查
  `docs/architecture/technical-implementation-roadmap.md`，明确阶段和技术状态，并在偏离时先更新
  OpenSpec 和路线。

## 自主迭代循环

每轮开发按这个顺序推进：

1. 先读取 AI 持续迭代 Goal，确认目标用户、用户价值、协作边界和完成证据。
2. 观察当前系统：路由、代码、规格、文档、验证输出和公网预览。
3. 识别缺口：用户工作流、UX 状态、数据边界、AI 风险、知识缺口、验证缺口。
4. 在需求或提案前查证不确定项：优先用项目文档、已安装 skill、官方文档、标准组织资料、
   专业平台、公开来源和可靠行业资料，并记录来源可信度。
5. 在需求或提案前调用相关 skill 做价值探索：确认用户角色、工作流摩擦、预期结果、
   是否偏离初衷、是否值得现在做，以及能否形成克制但高于基础预期的产品亮点。
6. 更新 OpenSpec：把来源依据、skill 探索结论、目标、取舍、风险、验收和任务写清楚。
   提案按完整工作流或技术阶段统筹，不按一两个接口拆分；同一用户目标、数据边界、
   权限模型和验证路径下的相邻需求应合并进同一轮。
7. 写契约草案：如果后续要接后端、数据库、AI、RAG 或外部集成，先定义领域对象、
   输入输出、状态机、错误、权限、敏感数据和验证。
8. 实现最小闭环：优先做一个能验证价值的工作流或阶段切片，避免过大系统，也避免
   把同一价值链路拆成过碎提案。
9. 验证并按节奏部署：运行相关检查；需要浏览器或公网体验验证时，Playwright 必须在归档前的
   测试阶段执行。每次 OpenSpec 归档后必须同步 git remote 并部署公网 Docker。未归档开发中
   小改动仍避免频繁部署，除非用户要求、预览故障修复或必须公开验证的前端变化。
10. 开发中修正：如果实现、验证、来源查证或 UX 检查发现业务偏离、用户价值不足、
    规范冲突、不符合常理或有更小更好的路径，先调整 OpenSpec、契约、规则、路线或任务。
11. 每轮结束先整体复盘：查看项目进度、当前现状、已接受规格、工作树、验证结果、预览状态、
    阻塞项和路线匹配度，再分析下一轮应该做什么。
12. 沉淀路线：把新发现的缺口、下一步、协作需求和文档更新写回 Goal、路线或规格。

## Now

当前优先把本地 V0 工作台收口成能支撑内部试用的基础能力：

1. AI 持续迭代 Goal：保持开发目标、用户价值、协作边界、研究规则和完成证据可追踪。
2. 接口契约基线：球拍产品、直播场次、知识生命周期、AI run、Q&A Agent、认证/团队/租户、
   数据基础、话术资产和下场任务契约草案已建立。
3. V0.9 trial readiness cockpit：`/trial` 与 `/` 的可用版本已接入六个已实现工作面的 scoped list API、
   反馈证据、试用运行证据、阶段判断、下一步动作和六步 checklist。V0 证据复核已完成发布结论、完整路径强度、
   反馈样本可信度、卡点和生产门禁说明；当前重点转为 V1 生产门禁 workflow，让内部评估人员能看到生产访问、
   HTTPS 域名、备份恢复、敏感数据治理、AI/RAG 评测和观测脱敏的真实阻断项与下一波建议；当前已把生产访问
   与 HTTPS 拆成下一轮 runtime 实施边界，但仍不直接引入生产登录、RAG、公开来源发现或外部平台集成。
4. V0 trial feedback and run evidence review：已收集的 V0 反馈和本次试用运行会继续转成 scoped 证据摘要、
   主要热点、代表备注、步骤卡点和下一步建议，并作为 V0.9 readiness 的输入。下一轮选择必须先看完整路径是否通过、
   反馈是否足够、是否有阻断卡点，再判断应优先做体验打磨、示例数据、AI 质量、来源信任、下游承接、生产准备，
   还是继续收集反馈；不引入外部 analytics
   或生产反馈系统。
5. `/rackets` 产品库工作台：已能进入 V0 团队上下文、创建/加载 scoped 产品草稿、登记来源、
   提交审核、审核来源/产品、发布产品，并显示审核队列和下游准备；下一步是产品编辑、版本化
   snapshot、公开来源发现或与知识版本/RAG 的连接。
6. Agent 架构基线：按 `AiProviderPort`、`RetrievalPort`、PostgreSQL + pgvector、
   provider adapter gate 的方案推进规划；用户已指定 DeepSeek/base URL/model，且本地
   `AiProviderPort` / DeepSeek adapter / `ai-provider:check` 已落地；AI 复盘已有 server-only
   generation orchestrator / `ai-review:generation-check` 和 execution service / `ai-review:execution-check`
   以及受保护 API runtime / `ai-review:route-check` 本地验证，但接入浏览器 UI、Server Action、
   RAG、队列、生产发布或 Q&A 工作流仍需单独 OpenSpec。
7. 技术实施阶段路线和技术蓝图基线：已建立；后续 runtime work 必须从阶段路线、技术状态、
   项目自有 port/adapter 和对应契约开始。
8. 认证与团队边界：`auth-team-tenant` 契约已起草，且本地-only 授权守卫基础、app-owned
   session runtime、server-only cookie/request runtime、session/logout auth route runtime 和统一内部试用入口已部分实现；后续实现登录、公开登录路由、
   middleware、团队、角色、
   租户隔离、受保护路由、成员邀请、provider adapter 或 guard/session 行为变化时必须从该契约开始，
   并同步更新偏离处。
9. 数据基础：`data-foundation` 契约已起草，且本地-only runtime 已部分实现；后续
   workflow-specific schema、repository、事务、幂等和审计字段必须在认证/团队契约约束下设计
   tenant/team ownership，并同步更新偏离处。
10. 球拍产品库持久化/API：`racket-product-library` 契约已起草，且本地-only 产品、别名、来源、
   审核决策、发布门禁 repository、create/list/source/review/publish 受保护 Route Handler 和
   `/rackets` operator V0 浏览器 source/review/publish 入口已部分实现；后续实现编辑、公开来源导入/发现、Server Action、
   AI/RAG grounding、版本化 snapshot 或更完整筛选时必须从该契约开始，并同步更新偏离处。
11. 直播场次保存：`session-capture` 契约已起草，且本地-only 场次、主播职责、商品顺序、
   笔记、客户问题、购买异议、草稿 autosave、提交 readiness repository 和
   create/list/detail/autosave/submit 受保护 Route Handler 已部分实现，`/sessions` operator V0
   浏览器保存闭环已打通；后续实现多商品编辑、Server Action wrapper、转录导入或 AI 复盘输入时
   必须从该契约开始，并同步更新偏离处。
12. 知识库持久化：`knowledge-lifecycle` 契约已起草，且本地-only 来源登记、claim、团队笔记、
   审核队列、审核决策、冲突处理、发布版本、readiness repository/API runtime 和 `/knowledge`
   operator V0 浏览器保存/审核/发布尝试入口已部分实现；后续实现公开来源发现、刷新任务、
   RAG snapshot、Q&A grounding、反馈学习或版本回滚时必须从该契约开始，并同步更新偏离处。
13. AI 复盘 run：`ai-review-run` 契约已起草，且本地-only run、输入快照、知识快照、
    prompt 版本元数据、provider 元数据、结构化输出、校验、人工审核、反馈和下游引用 repository
    已部分实现；本地 DeepSeek provider adapter、server-only generation orchestrator、server-only execution service、
    受保护 API runtime 和 `/ai-review` operator V0 浏览器 workflow 已落地；已采纳区块可记录下游引用并
    进入话术/任务 V0 工作台。后续实现 RAG snapshot、Server Action、生产模型发布、队列、自动发布/自动完成的
    正式下游流程或评测时必须从该契约开始，并同步更新偏离处。
14. Q&A Agent answer：`qa-agent-answer` 契约已起草，后续实现 provider 调用、RAG 检索、
    答案持久化、引用、反馈、缺失知识、web discovery 审核流或评测时必须从该契约开始，
    并同步更新偏离处。
15. 话术资产：`talk-track-asset` 契约已起草，且本地-only 资产、版本、场景、区块、来源引用、
    AI 候选、审核发布和复用反馈 repository/API runtime 已部分实现；`/talk-tracks` operator V0 浏览器
    workflow 已支持人工或已采纳 AI 复盘来源创建可复核草稿。后续实现 Server Action、发布审核 UI、
    Q&A/RAG grounding、短视频 hook 专属模型、团队搜索或公开 CRUD 时必须从该契约开始，并同步更新偏离处。
16. 下场任务：`next-session-task` 契约已起草，且本地-only 任务、来源证据、负责人、检查项、
    依赖、审核结果、反馈信号、状态流转、重复检测、敏感来源阻断和 readiness repository
    /API runtime 已部分实现；`/next-actions` operator V0 浏览器 workflow 已支持人工或已采纳 AI 复盘来源
    创建任务，并通过 status/checklist API 推进基础进度。后续实现 Server Action、通知、日历、导出、
    团队回看或跨团队指派时必须从该契约开始，并同步更新偏离处。

## Next

在 V0 内部试用闭环稳定后，下一步进入受控真实试用 V1 的生产门禁：

1. 生产登录与 HTTPS 实施：以 production access/transport gate 为输入，下一轮一次性实现或明确拒绝
   生产登录 provider、公开登录路由、团队入口、team switching、邀请或 V1-Lite 单团队入口、
   CSRF/origin、HTTPS 域名、TLS、secure cookie 和预览/生产分离；不把 public trial route gate 当成生产认证，
   也不在没有 HTTPS 和真实数据边界时开放正式试用。
2. V0.9 试用证据运行：继续用演示/脱敏数据跑 2-3 条完整路径，汇总 cockpit 阶段、完整路径强度、
   反馈样本可信度、操作卡点、文案误解、移动端溢出、AI 复盘质量、来源信任和下游话术/任务转化问题；
   它作为 V1 门禁排序依据，不再重复建设基础 demo seed。
3. 认证 provider/login 入口：本地 guard、session ledger、request cookie resolver、logout
   invalidation、safe session route、CSRF-checked logout route、统一内部试用入口和 public trial
   route gate 已完成；生产访问与 HTTPS transport gate 已列出 provider 决策、公开登录路由、会话生命周期、
   团队入口、team switching、CSRF/origin、域名、TLS、secure cookie、预览/生产分离和回滚路径；下一步按该门禁
   与 `auth-team-tenant` 契约实现生产 provider/login 和 HTTPS 入口，而不能把 public trial route gate 当成生产认证。
4. AI provider gate：用户已提供 DeepSeek base URL 和 `deepseek-v4-pro`，且本地
   `AiProviderPort` / DeepSeek adapter 已完成；不要把 key 写入仓库，live smoke 只能显式启用。
5. AI 复盘 MVP：server-only generation orchestrator、execution service、受保护 API runtime、
   `/ai-review` operator V0 浏览器 workflow 以及 AI 复盘到话术/任务的下游 V0 浏览器闭环已完成本地
   fake-provider 方向；当前证据可信度波次把采纳、拒绝、缺知识、来源不准、证据弱、下游使用、
   source refs 和 validation results 汇总为运营可扫读的可信度提示和修复优先级，用作后续评测、
   知识复核、来源复核和提示词复核输入；
   下一步按 `ai-review-run` 契约推进
   生产模型发布策略、正式评测样例、RAG snapshot、Server Action wrapper 或队列前置设计，
   面向用户的正式公开试用仍需先解决 HTTPS/provider login、公开登录路由、team switching 和受保护
   mutation 边界；internal V0 HTTP preview cookie policy 可先用于演示数据评估已有 V0 闭环。
6. 反馈学习：基础浏览器闭环先记录接受、编辑、拒绝、再生成、缺知识、来源不准、证据弱和下游使用等信号；
   后续再建设正式评测集、知识复核队列、提示词复核和 Q&A/RAG 质量分析。
7. Q&A Agent 第一阶段：按 `qa-agent-answer` 契约只基于已审核知识和团队知识回答，
   明确标注事实、经验、AI 措辞和不确定性。

## Later

后续在验证真实使用价值后再推进高风险或集成型能力：

1. Q&A Agent 反馈阶段：点赞、点踩、原因、答案编辑和代表性问题评测集。
2. Q&A Agent Web 发现阶段：允许搜索公开来源，展示引用和不确定性，新增知识进入审核流。
3. 公开来源刷新任务：定时检查变更、冲突、失效链接和过期知识。
4. 外部平台集成：只在官方 API、权限、条款、数据范围和失败模式清楚后推进。
5. 导出、分析、运营报表和团队协作。

## 研究和依赖策略

允许自主使用网络、skill、工具或依赖，但必须满足这些条件：

- 每次开始非平凡需求分析或创建 OpenSpec 提案前，先完成可靠来源查证和相关 skill 价值探索。
- 可靠来源优先级：官方/上游/标准组织/平台文档优先，其次是专业机构、行业平台、公开
  可验证案例；营销稿、匿名帖、过期文章和无法交叉验证的信息不能作为关键依据。
- skill 使用必须服务决策：判断是否有用户价值、是否偏离羽毛球拍直播电商运营初衷、
  是否满足中文运营人员预期、是否可以做出克制但有记忆点的体验，以及是否符合代码基准。
- 开发中允许且必须修正规范：发现当前计划不符合业务常理、偏离用户需求、规范互相冲突、
  或无法达到用户预期时，优先更新对应 OpenSpec、契约、规则、路线或任务，再继续实现。
- 先判断是否真的需要，不能为简单问题引入复杂依赖。
- 当前信息可能过期、涉及库/API/平台规则/法律/市场实践时，必须查证。
- 技术问题优先看官方文档；产品和行业问题记录来源类型、可信度和时间。
- 可复用业务知识不得直接成为权威事实，必须进入来源元数据、信任等级、审核、版本和刷新流程。
- 新 npm 依赖必须在 OpenSpec 设计中写清问题、替代方案、维护和许可证风险、运行影响、失败模式和回滚路径。

价值探索记录至少覆盖：

- 目标用户：直播运营、主播/助播、商品负责人或团队负责人。
- 用户任务：准备、讲解、答疑、复盘、话术沉淀或下场跟进。
- 用户收获：节省时间、减少遗漏、提高讲解一致性、提升信任、沉淀团队知识或降低 AI 风险。
- 亮点边界：可以比基础工具更顺手、更清晰、更有信任感，但不能花哨、堆动画、堆概念或牺牲可维护性。

## Agent / RAG 选型基线

Agent 不是聊天框，而是一条受控业务流程。当前架构结论：

- 首个 LLM provider 当前按用户指定 DeepSeek 方向已通过本地 provider gate；OpenAI Responses API
  保留为已研究参考方向，任何 provider 都必须通过项目自有 `AiProviderPort`。
- RAG MVP 优先 PostgreSQL + pgvector，结合全文检索、metadata filter、reviewed snapshot。
- Web discovery 通过 `SourceDiscoveryPort`，结果只能进入 review-only finding，不能直接写入权威知识。
- UI 不能直接调用 LLM、向量库、数据库或外部搜索。
- Vercel AI SDK 或其它编排库只允许放在 adapter 或薄 streaming wrapper 中，不作为业务层边界。
- Prompt、模型、检索规则、chunk 策略或回答策略变更，都必须通过代表性运营问题评测。

## Q&A Agent 路线

Q&A Agent 不能一次性做成“自动联网学习并改知识库”。必须分阶段：

1. 已审核知识回答：从知识库和团队知识中检索，回答时展示来源和不确定性。
2. 用户反馈：支持点赞、点踩、编辑原因，记录到答案质量和缺失知识分析。
3. 缺知识检测：识别回答置信不足、来源过期、知识冲突和重复被点踩的问题。
4. 公开来源搜索：只搜索允许的公开来源，展示引用，不把搜索结果直接写成权威知识。
5. 知识库补充：有价值内容进入审核、版本、刷新策略，审核后才能用于未来回答。
6. 评测发布：每次 prompt、知识选择或回答策略变化都用代表性运营问题验证。

## 公网预览检查

需要浏览器或公网体验验证时，Playwright 必须在 OpenSpec 归档前的测试阶段执行。每次
OpenSpec change 归档后必须同步 git remote 并更新公网容器。未归档开发中默认不要每轮都更新
公网容器；只有用户要求、预览故障修复或必须在公网验证的前端变化，才提前执行：

```bash
pnpm docker:build
docker rm -f operation-web-preview || true
docker run -d --name operation-web-preview --restart unless-stopped -p 3000:3000 -e OPERATION_ENABLE_V0_BOOTSTRAP=1 -e OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE=1 operation-web:latest
docker ps --filter name=operation-web-preview --format '{{.ID}} {{.Image}} {{.Status}} {{.Ports}}'
curl -I --max-time 10 http://203.195.161.93:3000/
```

关键路由至少检查 `/`、`/sessions`、`/knowledge`、`/ai-review`。新增页面或修改页面时，
Playwright 浏览器级验证应在归档前完成；归档后部署阶段重点确认容器和公网健康状态。
`OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE=1` 只用于 HTTP 公网 IP 的内部 V0 演示/评估数据；
正式生产仍需要 HTTPS、生产登录、备份恢复和日志脱敏。

Git 提交消息必须使用 Conventional Commits 格式 `type(scope): subject`。type 必须是
`feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`perf`、`build`、`ci`、`revert`
等专业前缀；不要使用“update”“sync”或无前缀中文描述。中文可以放在冒号后的 subject
中，前提是能清楚说明变更。
