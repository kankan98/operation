# 自主迭代开发路线

最后更新：2026-05-24

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
- 本地-only 数据基础 runtime 已部分实现：PostgreSQL 开发服务、Drizzle schema/migration、
  Zod 校验、server-only database client、审计/幂等 repository 原语和本地回滚式 smoke check。
- 本地-only 球拍产品库持久化切片已部分实现：产品、别名、来源、审核决策和发布门禁
  schema/migration、server-only repository、输入校验、tenant/team scope、重复型号、别名冲突
  和来源冲突检测、审核状态流转、下游 readiness 和本地回滚式 smoke check。
- 本地-only 直播场次采集持久化切片已部分实现：场次、主播职责、商品顺序、场次笔记、
  客户问题和购买异议 schema/migration、server-only repository、输入校验、tenant/team scope、
  草稿版本冲突、重复标题日期检测、提交 readiness 和本地回滚式 smoke check。
- 本地-only 知识生命周期持久化切片已部分实现：来源、抽取 claim、团队知识笔记、审核决策、
  发布版本和冲突记录 schema/migration、server-only repository、输入校验、tenant/team scope、
  来源去重、审核状态流转、冲突阻断、发布 readiness 和本地回滚式 smoke check。
- 本地-only AI 复盘 run 持久化切片已部分实现：输入快照、知识快照、prompt 版本元数据、
  provider 调用元数据、结构化输出、输出区块、校验结果、人工审核、反馈信号和下游草案引用
  schema/migration、server-only repository、输入校验、tenant/team scope、权限检查、敏感/过期/冲突阻断、
  validation gate、下游门禁和本地回滚式 smoke check。
- 本地-only AI provider gate 已部分实现：server-only `AiProviderPort`、DeepSeek chat-completions
  adapter、环境变量密钥解析、结构化 JSON 输出校验、provider 失败归一化、日志脱敏和
  `ai-provider:check` fake-fetch smoke check；默认不调用真实 DeepSeek。
- 本地-only AI 复盘生成编排切片已部分实现：server-only generation orchestrator、已脱敏输入快照和
  已审核知识快照门禁、prompt fingerprint、结构化输出 schema validation、source grounding /
  sensitive / stale / conflict / long input validation、provider 错误映射和
  `ai-review:generation-check` fake-provider smoke check；默认不调用真实 DeepSeek。
- 本地-only AI 复盘执行服务已部分实现：server-only execution service 串联 AI review run ledger、
  generation orchestrator 和 repository persistence，记录 provider metadata、结构化输出、validation results、
  `review_ready` / `validation_failed` / `provider_failed` 状态，并用
  `ai-review:execution-check` fake-provider 回滚式验证；默认不调用真实 DeepSeek。
- 本地-only 话术资产持久化切片已部分实现：资产、版本、场景、区块、异议回应、来源引用、
  AI 候选、审核决策和复用反馈 schema/migration、server-only repository、输入校验、tenant/team scope、
  权限检查、AI 候选审核阻断、发布门禁、重复场景阻断、readiness 和本地回滚式 smoke check。
- 本地-only 下场任务持久化切片已部分实现：任务、来源证据、负责人、检查项、依赖、
  审核结果和反馈信号 schema/migration、server-only repository、输入校验、tenant/team scope、
  权限检查、负责人活跃校验、状态流转、重复检测、敏感来源阻断、readiness 和本地回滚式
  smoke check。

已实现页面：

| 路由 | 当前状态 |
| --- | --- |
| `/` | 工作台总览、线路状态、能力边界 |
| `/sessions` | 静态直播场次采集工作台 |
| `/rackets` | 静态球拍产品库工作台 |
| `/knowledge` | 静态知识库学习中枢 |
| `/ai-review` | 静态 AI 复盘工作台 |
| `/talk-tracks` | 话术资产占位页 |
| `/next-actions` | 下场任务占位页 |

当前不包含：

- 登录 provider、middleware、cookie 写入/删除、邀请、团队管理 UI 和生产认证服务。
- 面向用户的真实持久化、受保护 CRUD、API/Server Action 保存流程、生产数据库 provider、
  连接池、备份和恢复；当前产品库、直播场次、知识生命周期、AI 复盘 run、话术资产和下场任务持久化仅限本地
  repository 验证。
- AI 复盘公开触发/API/UI 保存、RAG 上下文选择、Q&A 模型调用和任何面向用户的生成流程；当前只有
  server-only DeepSeek provider adapter、AI 复盘 generation orchestrator 和 execution service 本地
  fake-provider 验证。
- 公开来源采集、网页搜索、审核队列、刷新任务。
- 抖音、电商后台、订单、私信、支付、结算或公开商城能力。
- Auth provider、对象存储、队列、分析、监控和生产部署 provider 尚未最终选定。

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
7. 写契约草案：如果后续要接后端、数据库、AI、RAG 或外部集成，先定义领域对象、
   输入输出、状态机、错误、权限、敏感数据和验证。
8. 实现最小闭环：优先做一个能验证价值的能力切片。
9. 验证并按节奏部署：运行相关检查；需要浏览器或公网体验验证时，Playwright 必须在归档前的
   测试阶段执行。每次 OpenSpec 归档后必须同步 git remote 并部署公网 Docker。未归档开发中
   小改动仍避免频繁部署，除非用户要求、预览故障修复或必须公开验证的前端变化。
10. 开发中修正：如果实现、验证、来源查证或 UX 检查发现业务偏离、用户价值不足、
    规范冲突、不符合常理或有更小更好的路径，先调整 OpenSpec、契约、规则、路线或任务。
11. 每轮结束先整体复盘：查看项目进度、当前现状、已接受规格、工作树、验证结果、预览状态、
    阻塞项和路线匹配度，再分析下一轮应该做什么。
12. 沉淀路线：把新发现的缺口、下一步、协作需求和文档更新写回 Goal、路线或规格。

## Now

当前优先把静态工作台升级成能承载真实工作流的基础能力：

1. AI 持续迭代 Goal：保持开发目标、用户价值、协作边界、研究规则和完成证据可追踪。
2. 接口契约基线：球拍产品、直播场次、知识生命周期、AI run、Q&A Agent、认证/团队/租户、
   数据基础、话术资产和下场任务契约草案已建立。
3. `/rackets` 产品库工作台：先以静态字段结构验证型号、别名、规格、审核和下游准备。
4. Agent 架构基线：按 `AiProviderPort`、`RetrievalPort`、PostgreSQL + pgvector、
   provider adapter gate 的方案推进规划；用户已指定 DeepSeek/base URL/model，且本地
   `AiProviderPort` / DeepSeek adapter / `ai-provider:check` 已落地；AI 复盘已有 server-only
   generation orchestrator / `ai-review:generation-check` 和 execution service / `ai-review:execution-check`
   本地验证，但接入公开 UI/API、RAG 或 Q&A
   工作流仍需单独 OpenSpec。
5. 技术实施阶段路线和技术蓝图基线：已建立；后续 runtime work 必须从阶段路线、技术状态、
   项目自有 port/adapter 和对应契约开始。
6. 认证与团队边界：`auth-team-tenant` 契约已起草，且本地-only 授权守卫基础和 app-owned
   session runtime 已部分实现；后续实现登录、cookie 写入/删除、middleware、团队、角色、
   租户隔离、受保护路由、成员邀请、provider adapter 或 guard/session 行为变化时必须从该契约开始，
   并同步更新偏离处。
7. 数据基础：`data-foundation` 契约已起草，且本地-only runtime 已部分实现；后续
   workflow-specific schema、repository、事务、幂等和审计字段必须在认证/团队契约约束下设计
   tenant/team ownership，并同步更新偏离处。
8. 球拍产品库持久化：`racket-product-library` 契约已起草，且本地-only 产品、别名、来源、
   审核决策和发布门禁 repository 已部分实现；后续实现编辑、公开来源导入/发现、API、
   Server Action、UI 保存、AI/RAG grounding、版本化 snapshot 或更完整筛选时必须从该契约开始，
   并同步更新偏离处。
9. 直播场次保存：`session-capture` 契约已起草，且本地-only 场次、主播职责、商品顺序、
   笔记、客户问题、购买异议、草稿 autosave、提交 readiness repository 已部分实现；后续实现
   浏览器保存、Route Handler、Server Action、转录导入或 AI 复盘输入时必须从该契约开始，
   并同步更新偏离处。
10. 知识库持久化：`knowledge-lifecycle` 契约已起草，且本地-only 来源登记、claim、团队笔记、
   审核决策、发布版本、冲突阻断和 readiness repository 已部分实现；后续实现浏览器保存、
   公开 API、公开来源发现、刷新任务、RAG snapshot、Q&A grounding 或反馈学习时必须从该契约开始，
   并同步更新偏离处。
11. AI 复盘 run：`ai-review-run` 契约已起草，且本地-only run、输入快照、知识快照、
    prompt 版本元数据、provider 元数据、结构化输出、校验、人工审核、反馈和下游引用 repository
    已部分实现；本地 DeepSeek provider adapter、server-only generation orchestrator 和 server-only execution service 已落地；
    后续实现 RAG snapshot、公开 API、Server Action、UI 保存、队列、生产发布或评测时必须从该契约开始，并同步更新偏离处。
12. Q&A Agent answer：`qa-agent-answer` 契约已起草，后续实现 provider 调用、RAG 检索、
    答案持久化、引用、反馈、缺失知识、web discovery 审核流或评测时必须从该契约开始，
    并同步更新偏离处。
13. 话术资产：`talk-track-asset` 契约已起草，且本地-only 资产、版本、场景、区块、来源引用、
    AI 候选、审核发布和复用反馈 repository 已部分实现；后续实现浏览器保存、公开 API、
    Server Action、AI 复盘下游候选、Q&A/RAG grounding、短视频 hook 复用或团队搜索时必须从该契约开始，
    并同步更新偏离处。
14. 下场任务：`next-session-task` 契约已起草，且本地-only 任务、来源证据、负责人、检查项、
    依赖、审核结果、反馈信号、状态流转、重复检测、敏感来源阻断和 readiness repository
    已部分实现；后续浏览器保存、公开 API、Server Action、AI 复盘下游任务候选、通知、
    日历、导出或团队回看时必须从该契约开始，并同步更新偏离处。

## Next

在基础数据和权限稳定后，开始做可用的 AI 与运营闭环：

1. 认证 provider/login/cookie runtime：本地 session ledger 和 resolver 已完成；下一步按
   `auth-team-tenant` 契约选择并实现最小登录、cookie issuance、middleware 或 route-level protection，
   不能只靠本地 guard/session resolver 或前端隐藏控件。
2. AI provider gate：用户已提供 DeepSeek base URL 和 `deepseek-v4-pro`，且本地
   `AiProviderPort` / DeepSeek adapter 已完成；不要把 key 写入仓库，live smoke 只能显式启用。
3. AI 复盘 MVP：server-only generation orchestrator 和 execution service 已完成本地 fake-provider 验证；下一步按
   `ai-review-run` 契约推进公开触发/API/UI 保存、评测样例、RAG snapshot 或队列前置设计，
   面向用户的公开 CRUD 仍需先解决 provider/login/cookie runtime。
4. 反馈学习：记录接受、编辑、拒绝、再生成等信号，用于评测和知识刷新优先级。
5. Q&A Agent 第一阶段：按 `qa-agent-answer` 契约只基于已审核知识和团队知识回答，
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
docker run -d --name operation-web-preview --restart unless-stopped -p 3000:3000 operation-web:latest
docker ps --filter name=operation-web-preview --format '{{.ID}} {{.Image}} {{.Status}} {{.Ports}}'
curl -I --max-time 10 http://203.195.161.93:3000/
```

关键路由至少检查 `/`、`/sessions`、`/knowledge`、`/ai-review`。新增页面或修改页面时，
Playwright 浏览器级验证应在归档前完成；归档后部署阶段重点确认容器和公网健康状态。
