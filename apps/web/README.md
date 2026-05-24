# 羽拍直播运营工作台 Web App

这是仓库的第一个应用，位于 `apps/web`。当前前端基线已经包含 Next.js
应用、Docker 构建、中文运营工作台 shell、真实工作区路由和全局主题
token。

## 本阶段包含

- Next.js App Router + TypeScript + React。
- Tailwind CSS + shadcn/ui-compatible primitives。
- lucide-react 图标。
- 根级 pnpm workspace 脚本。
- 中文内部运营工作台骨架。
- 真实工作区路由：`/sessions`、`/rackets`、`/knowledge`、`/ai-review`、
  `/talk-tracks`、`/next-actions`。
- 基于 `globals.css` CSS 变量的全局主题 token。
- `/sessions` operator V0 直播场次采集工作流、`/rackets` operator V0 球拍产品库工作流、
  `/knowledge` operator V0 资料来源工作流、`/ai-review` operator V0 AI 复盘工作流、
  `/talk-tracks` operator V0 话术资产工作流和 `/next-actions` operator V0 下场任务工作流。
- loading、error、not-found 基线状态。
- 本地-only 授权守卫基础：provider-neutral auth context、role-permission policy、
  server-side guard、safe auth errors、data access context 转换和 `auth:check` 回滚式验证。
- 本地-only auth session runtime：`auth_sessions` ledger、opaque session reference hash、
  server-only session resolver、expired/revoked/invalidated 拒绝、脱敏和 `auth:session-check`
  回滚式验证。
- 本地-only auth cookie runtime：server-only session cookie issue/clear header、request cookie
  resolver、logout invalidation、脱敏和 `auth:cookie-check` 回滚式验证。
- 本地-only auth route runtime：`GET /api/auth/session` 安全会话视图、CSRF-checked
  `POST /api/auth/logout`、no-store 响应、脱敏和 `auth:route-check` 回滚式验证；仍不包含公开登录页、
  provider callback、middleware、团队管理或业务 CRUD。
- 本地-only operator V0 bootstrap：`POST /api/auth/operator-v0-session` 在显式启用和
  CSRF header 下创建内部演示 operator/team session，用于本地 `/sessions`、`/rackets`、
  `/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions` 浏览器工作流；它不是生产登录 provider。
- 本地-only 数据基础 runtime：Drizzle/PostgreSQL schema、首个 migration、Zod 校验、
  server-only database client、数据访问上下文、审计/幂等 repository 原语和 `db:check`
  回滚式验证。
- 本地-only 球拍产品库 repository slice：产品、别名、来源、审核决策和发布门禁
  schema/migration、server-only repository、tenant/team scope、重复型号、别名冲突、来源冲突检测、
  下游 readiness、`rackets:check` 和 `rackets:source-review-check` 回滚式验证。
- `/rackets` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 球拍产品、
  创建人工产品草稿，并显示型号、别名、规格、适合人群、限制、审核状态、来源/发布 gated 状态和下游 readiness。
- 本地-only 直播场次采集 repository slice：场次、主播职责、商品顺序、场次笔记、客户问题、
  购买异议 schema/migration、server-only repository、tenant/team scope、草稿版本冲突、
  重复标题日期检测、提交 readiness 和 `sessions:check` 回滚式验证。
- 本地-only 直播场次采集 API runtime：`GET /api/sessions/captures`、
  `POST /api/sessions/captures`、`GET /api/sessions/captures/[sessionId]`、
  `PATCH /api/sessions/captures/[sessionId]/draft` 和
  `POST /api/sessions/captures/[sessionId]/submit` 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  `sessions:route-check` 回滚式验证工作。
- `/sessions` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 场次、创建草稿、
  保存摘要/问题/异议并提交到 review-ready；转录上传、平台同步、直接 AI 生成和生产登录仍未开放。
- 本地-only 知识生命周期 repository slice：来源登记、抽取 claim、团队知识笔记、审核决策、
  发布版本和冲突记录 schema/migration、server-only repository、tenant/team scope、
  来源去重、冲突阻断、发布 readiness 和 `knowledge:check` 回滚式验证。
- 本地-only 知识生命周期 API runtime：`GET /api/knowledge/sources`、
  `POST /api/knowledge/sources`、`GET /api/knowledge/sources/[sourceId]`、
  `POST /api/knowledge/claims`、`POST /api/knowledge/team-notes`、
  `GET /api/knowledge/review-queue`、`POST /api/knowledge/review-decisions`、
  `POST /api/knowledge/conflicts`、`PATCH /api/knowledge/conflicts/[conflictId]`
  和 `POST /api/knowledge/versions` 通过现有 auth cookie/session runtime、显式
  tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  `knowledge:route-check` 回滚式验证工作。
- `/knowledge` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 来源、
  登记官方或团队来源、创建人工 claim 和团队笔记、查看审核队列、记录审核通过，并通过受保护发布接口
  尝试发布版本；未审核或冲突内容不会自动成为权威知识。
- 本地-only AI 复盘 run repository slice：输入快照、知识快照、prompt 版本元数据、provider 调用
  元数据、结构化输出、输出区块、校验结果、人工审核、反馈信号和下游草案引用 schema/migration、
  server-only repository、tenant/team scope、权限检查、敏感/过期/冲突阻断、下游门禁和
  `ai-review:check` 回滚式验证。
- 本地-only AI provider gate：server-only `AiProviderPort`、DeepSeek chat-completions adapter、
  环境变量密钥解析、结构化 JSON 输出校验、provider 失败归一化、日志脱敏和 `ai-provider:check`
  本地验证。
- 本地-only AI 复盘生成编排切片：server-only generation orchestrator、已脱敏输入快照和已审核知识快照门禁、
  prompt fingerprint、结构化输出 schema validation、source grounding / sensitive / stale / conflict /
  long input validation、provider 错误映射和 `ai-review:generation-check` fake-provider 本地验证。
- 本地-only AI 复盘执行服务：server-only execution service 把已准备的 AI review run、generation
  orchestrator 和 repository ledger 串联起来，持久化 provider 元数据、结构化输出、校验结果和
  review-ready / failure 状态，并用 `ai-review:execution-check` fake-provider 回滚式验证。
- 本地-only AI 复盘 API runtime：受保护 prompt version metadata、run create/list/detail、execute、
  decision、feedback、downstream reference 和 archive Route Handler 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、`x-operation-csrf: ai-review`、execution service、repository business rules、
  no-store 安全响应和 `ai-review:route-check` fake-provider 回滚式验证。
- `/ai-review` operator V0 浏览器工作流：可进入本地 V0 团队上下文，加载已提交场次，
  准备 AI review run，通过本地 V0 fake provider 生成复盘建议，查看校验结果并记录采纳/暂不用；
  已采纳的话术候选、短视频选题和下场动作可先记录下游草稿引用，再进入话术资产或下场任务工作台；
  默认不调用真实 DeepSeek，不接 RAG，也不自动发布话术资产或完成任务。
- 本地-only 话术资产 repository slice：资产、版本、场景、区块、异议回应、来源引用、AI 候选、
  审核决策和复用反馈 schema/migration、server-only repository、tenant/team scope、权限检查、
  AI 候选审核阻断、发布门禁、重复场景阻断、readiness 和 `talk-tracks:check` 回滚式验证。
- 本地-only 话术资产 API runtime：受保护 candidate/asset/review/publish/archive/restore/usage
  Route Handler 通过现有 auth cookie/session runtime、显式 tenant/team scope、
  `x-operation-csrf: talk-track-assets`、repository business rules、no-store 安全响应和
  `talk-tracks:route-check` 回滚式验证。
- `/talk-tracks` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 话术资产、
  从人工输入或已采纳 AI 复盘区块创建可复核草稿，并保留来源和审核状态；不会自动发布。
- 本地-only 下场任务 repository slice：任务、来源证据、负责人、检查项、依赖、审核结果和反馈信号
  schema/migration、server-only repository、tenant/team scope、权限检查、负责人活跃校验、
  状态流转、重复检测、敏感来源阻断、readiness 和 `next-actions:check` 回滚式验证。
- 本地-only 下场任务 API runtime：受保护 task create/list/detail、status、checklist、
  dependency、complete、review-result 和 feedback Route Handler 通过现有 auth cookie/session
  runtime、显式 tenant/team scope、`x-operation-csrf: next-session-tasks`、repository business rules、
  no-store 安全响应和 `next-actions:route-check` 回滚式验证。
- `/next-actions` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 下场任务、
  从人工输入或已采纳 AI 复盘动作创建任务，并通过现有 status/checklist API 推进基础进度。

## 本阶段不包含

- 账号登录、auth provider、middleware、公开登录路由、邀请、团队管理 UI 和生产认证服务。
- 面向用户的完整生产 CRUD、Server Action 保存流程、生产数据库 provider、连接池、备份或恢复；
  当前球拍产品库、直播场次采集、知识生命周期、话术资产和下场任务已有 local-only
  受保护 API runtime，`/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和
  `/next-actions` 已有 operator V0 浏览器闭环，但仍不是公开登录后的生产协作系统。
- AI 复盘生产模型发布、Server Action、RAG 上下文选择、分析任务和自动发布/自动完成的正式下游流程；当前 AI 复盘
  浏览器工作流默认使用本地 V0 fake provider，server-only DeepSeek provider adapter 仍只通过显式验证接入。
- 公开来源采集、种子知识库刷新、自动刷新任务或版本回滚。
- 文件存储、导出、抖音/电商平台集成、分析埋点、支付或部署配置。

## 开发路线

项目级持续迭代路线见
[`docs/roadmap/autonomous-development-roadmap.md`](../../docs/roadmap/autonomous-development-roadmap.md)。
后续新增路由、表单、数据模型、AI 行为、知识库能力、主题风格或动效模式时，先更新
OpenSpec，再让 README、路线文档和公网预览状态保持一致。

路线文档中的 Now/Next/Later 是当前开发顺序参考，不是绕过 OpenSpec 的授权。
主题和动效调整继续通过 `src/app/globals.css` 的全局 token 与
`src/components/workspace-motion.tsx` 的本地 primitives 管理，避免在页面内局部写死。

## 工作区路由

| 路由 | 当前用途 |
| --- | --- |
| `/` | 工作台总览、线路状态和未实现能力边界 |
| `/sessions` | Operator V0 直播场次采集工作流，可本地创建、保存和提交场次 |
| `/rackets` | Operator V0 球拍产品库工作流，可本地创建和加载 scoped 产品草稿 |
| `/knowledge` | Operator V0 资料来源工作流，可本地登记来源、沉淀知识、审核并尝试发布 |
| `/ai-review` | Operator V0 AI 复盘工作流，可本地选择已提交场次、生成建议、记录审核并创建下游引用 |
| `/talk-tracks` | Operator V0 话术资产工作流，可本地查看资产并创建人工/AI 来源草稿 |
| `/next-actions` | Operator V0 下场任务工作流，可本地查看任务、创建任务并推进检查项 |

`/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions`
已升级为 operator V0 浏览器工作流。它们复用本地 V0 bootstrap、auth cookie/session runtime 和
受保护 Route Handlers；HTTP 公网 IP 预览由于 `Secure` cookie 规格，不能当成完整认证浏览器环境。

`/sessions` 当前是 operator V0 手动采集工作流：浏览器可以进入本地 V0 团队上下文，加载 scoped
场次，创建草稿，继续保存摘要、讲解缺口、客户问题和购买异议，并提交到 review-ready。它复用现有
auth cookie/session runtime、`GET /api/auth/session`、本地 V0 bootstrap 和 session capture
Route Handlers，不直接访问数据库或 AI provider。当前仍不会上传转录、解析文本、读取平台数据、
调用 AI 或创建复盘任务；也没有生产登录 provider、provider callback、middleware 或团队管理 UI。
现有 auth cookie 规格要求 `Secure` cookie，因此 HTTP 公网 IP 预览可能只能看到未登录/入口状态；
需要可公开试用的保存闭环时，应先通过单独部署规格引入 HTTPS 或明确的受控预览策略。

`/rackets` 当前是 operator V0 球拍产品库工作流：浏览器可以进入本地 V0 团队上下文，加载 scoped
产品记录，创建人工产品草稿，保留型号、别名、重量级别、平衡点、中杆硬度、推荐磅数、适合人群、
打法、价格带、卖点、限制、审核状态和下游 readiness。它复用现有产品 create/list Route Handlers；
产品来源登记、审核、发布、编辑、别名合并、检索和 AI/RAG grounding 仍保持 gated，不能绕过受保护 API。

`/knowledge` 当前是 operator V0 资料来源工作流：浏览器可以进入本地 V0 团队上下文，加载 scoped
来源，登记官方或团队来源，创建人工 claim 和团队笔记，查看审核队列，记录审核通过，并通过受保护
发布接口尝试发布知识版本。它不会自动抓取网站、调用 AI、创建 RAG snapshot 或生成运营建议；
公开来源发现、刷新任务、Q&A grounding、反馈学习和版本回滚仍需要后续 OpenSpec。

`/ai-review` 当前是 operator V0 AI 复盘工作流：浏览器可以进入本地 V0 团队上下文，
加载已提交或 review-ready 场次，准备 AI review run，通过本地 V0 fake provider 生成结构化复盘建议，
查看校验结果，并对区块记录采纳或暂不用；已采纳的话术候选、短视频选题和下场动作可以先记录
AI 复盘下游引用，再跳转到 `/talk-tracks` 或 `/next-actions` 继续保存草稿/任务。它复用现有 auth cookie/session runtime、
本地 V0 bootstrap、受保护 AI review API runtime 和 server-only execution service；默认不会调用真实
DeepSeek，也不会接 RAG、公开来源发现、队列、Server Action 或自动发布/自动完成下游记录。现有 auth cookie
规格要求 `Secure` cookie，因此 HTTP 公网 IP 预览可能只能看到未登录/入口状态；需要可公开试用的
完整 AI 复盘闭环时，应先通过单独部署规格引入 HTTPS 或明确的受控预览策略。

`/talk-tracks` 当前是 operator V0 话术资产工作流：浏览器可以进入本地 V0 团队上下文，加载 scoped
话术资产，从人工输入或已采纳 AI 复盘区块创建可复核草稿，并显示草稿状态、场景、来源和复核提示。
它复用现有话术资产 Route Handlers，不直接访问数据库或 AI provider；当前不会自动发布、搜索团队话术、
调用 RAG grounding 或开放完整公开 CRUD。现有 auth cookie 规格要求 `Secure` cookie，因此 HTTP 公网 IP
预览可能只能看到未登录/入口状态。

`/next-actions` 当前是 operator V0 下场任务工作流：浏览器可以进入本地 V0 团队上下文，加载 scoped
任务，从人工输入或已采纳 AI 复盘动作创建任务，并通过现有 status/checklist Route Handlers 执行
“开始处理”和检查项完成/阻塞。它不会创建通知、日历、导出、跨团队分派或自动关闭任务。现有 auth
cookie 规格要求 `Secure` cookie，因此 HTTP 公网 IP 预览可能只能看到未登录/入口状态。

## 后续路线：问答 Agent 与自主学习

未来可以新增一个面向运营用户的问答 Agent，用来回答羽毛球拍产品、直播讲解、
客户异议、话术优化、短视频选题和运营复盘相关问题。该能力必须分阶段实现：

1. 先从已审核知识库和团队知识回答问题，并明确区分来源事实、人工经验和 AI 推断。
2. 支持用户对答案点赞、点踩、编辑或补充原因，把反馈作为可审计信号。
3. 当知识库不足或过期时，AI 可以通过允许的公开网络来源寻找答案，展示引用来源和
   不确定性，而不是直接把搜索结果当作权威结论。
4. 有价值的新来源或答案需要进入知识库生命周期：来源元数据、信任等级、抓取/检索时间、
   人工审核、版本记录和刷新策略齐全后，才能用于后续回答。
5. 每次用反馈或新知识改进 agent 前，都要用代表性运营问题做评测，确认答案质量、
   来源可追溯性和安全边界没有退化。

这个路线会涉及 AI provider、网络搜索、知识持久化、审核队列、租户数据隔离、
滥用防护和答案质量评估，不能在没有 OpenSpec 变更的情况下直接接入。

## 主题 token

全局视觉主题位于 `src/app/globals.css`。组件应优先使用 shadcn/Tailwind
语义类，例如 `bg-background`、`bg-card`、`text-muted-foreground`、
`border-border`、`text-primary`、`bg-sidebar`，不要在组件内散落硬编码色值。

当前 token 覆盖：

- shadcn 基础语义：`background`、`foreground`、`card`、`primary`、
  `secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`。
- 侧栏语义：`sidebar`、`sidebar-foreground`、`sidebar-accent` 等。
- 产品扩展：`surface`、`surface-subtle`、`surface-strong`、`success`、
  `warning`、`info`。
- 图表预留：`chart-1` 到 `chart-5`。

视觉方向是现代、冷静、数据密集的运营后台：冷灰表面、青蓝主色、琥珀强调和
混合图表色。后续页面应通过 token 调整整体风格，而不是局部覆盖颜色。

### 主题治理规则

后续如果要替换为新的品牌风格、色彩体系、暗色主题、密度或圆角风格，优先修改
`src/app/globals.css` 中的 token，而不是逐个页面改 class。

必须全局管理的内容：

- 品牌色、文字色、背景、卡片、边框、侧栏、状态色和图表色。
- 工作台面板半径、行半径、图标面尺寸、面板阴影、状态色背景/边框/文字。
- 动效时长、缓动、入场距离、hover 反馈和 reduced-motion 行为。
- focus ring、选中态、禁用态、成功/警告/信息等语义状态。

允许局部保留的内容：

- 页面自己的 grid track、响应式列数、信息排列顺序。
- 与具体内容长度有关的 `min-h-*`、`gap-*`、`px/py`，但不要承载品牌色或状态色。
- 单个业务组件的字段布局和移动端折叠方式。

当前工作台通用 utility：

- `workbench-panel`：主面板/card 的背景、边框、圆角、阴影。
- `workbench-row`：面板内行、子卡片、列表项的背景、边框、圆角。
- `workbench-icon-surface`：状态图标容器尺寸和圆角。
- `workbench-status-default|success|warning|info|muted`：状态色背景、边框、文字。

组件中不要写 `bg-blue-*`、`text-purple-*`、`border-green-*`、hex/rgb/oklch
等局部色值。确实需要新增颜色或视觉语义时，先在 OpenSpec 中说明用途，再加到
`globals.css` 的 token 层。

## 动效标准

工作台动效以“帮助理解结构和状态”为目标，不做营销式大动画。全局动效 token
定义在 `src/app/globals.css`：

- 时长：`--motion-duration-fast`、`--motion-duration-standard`、
  `--motion-duration-slow`。
- 缓动：`--motion-ease-standard`、`--motion-ease-emphasized`、
  `--motion-ease-enter`、`--motion-ease-exit`。
- 距离和模糊：`--motion-distance-sm`、`--motion-distance-md`、
  `--motion-blur-enter`。
- 工具类：`motion-interactive`、`motion-panel`、`motion-row`。

React 级页面和区块编排使用 `motion`，并且只通过
`src/components/workspace-motion.tsx` 里的本地 primitives 使用：

- `WorkspaceMotionProvider`
- `MotionPage`
- `MotionPanel`
- `MotionListItem`

使用规则：

- 页面和区块入场应短、轻、非循环。
- hover/press 反馈优先用 CSS token 和 `motion-interactive`。
- 必须尊重 `prefers-reduced-motion`，不要绕过全局 reduced-motion 规则。
- 不使用视差、滚动劫持、自动播放视频、无限循环装饰动画。
- 占位页面的动画不能暗示真实加载、保存成功、AI 生成中或外部平台已连接。

## 本地命令

从仓库根目录运行：

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

开发服务器默认地址为 `http://localhost:3000`。

## 本地数据基础

本地 PostgreSQL 仅用于阶段 3 数据基础验证，不等于公网预览或生产数据库。连接串示例见根目录
`.env.example`；不要提交生产凭据。Compose 只把开发库绑定到 `127.0.0.1:5433`，避免默认
开发凭据暴露到公网接口。

启动本地数据库：

```bash
docker compose --profile db up -d postgres
```

常用数据库命令从仓库根目录运行：

```bash
DATABASE_URL="postgres://..." pnpm db:generate
DATABASE_URL="postgres://..." pnpm db:migrate
DATABASE_URL="postgres://..." pnpm db:check
DATABASE_URL="postgres://..." pnpm auth:check
DATABASE_URL="postgres://..." pnpm auth:session-check
DATABASE_URL="postgres://..." pnpm auth:cookie-check
DATABASE_URL="postgres://..." pnpm auth:route-check
DATABASE_URL="postgres://..." pnpm operator-v0:check
DATABASE_URL="postgres://..." pnpm reference-data:v0-check
DATABASE_URL="postgres://..." pnpm downstream:v0-check
DATABASE_URL="postgres://..." pnpm sessions:check
DATABASE_URL="postgres://..." pnpm sessions:route-check
DATABASE_URL="postgres://..." pnpm rackets:check
DATABASE_URL="postgres://..." pnpm rackets:source-review-check
DATABASE_URL="postgres://..." pnpm knowledge:check
DATABASE_URL="postgres://..." pnpm knowledge:route-check
DATABASE_URL="postgres://..." pnpm ai-review:check
DATABASE_URL="postgres://..." pnpm ai-review:execution-check
DATABASE_URL="postgres://..." pnpm ai-review:route-check
DATABASE_URL="postgres://..." pnpm ai-review:v0-check
pnpm ai-review:generation-check
pnpm ai-provider:check
DATABASE_URL="postgres://..." pnpm talk-tracks:check
DATABASE_URL="postgres://..." pnpm talk-tracks:route-check
DATABASE_URL="postgres://..." pnpm next-actions:check
DATABASE_URL="postgres://..." pnpm next-actions:route-check
```

`db:generate` 生成 Drizzle migration，`db:migrate` 应用本地 migration，`db:check` 会创建基础
tenant/team/user、审计事件和幂等记录，并在事务内回滚。`db:check` 使用 `react-server` 条件运行，
以保留 `server-only` 数据库模块边界。

`auth:check` 会创建临时 tenant/team/user/membership fixture，验证 active member 允许访问、
缺权限拒绝、inactive membership 拒绝、cross-team target 拒绝，并在事务内回滚。它不是登录
provider，也不会创建 cookie、session、middleware 或团队管理 UI。

`auth:session-check` 会创建临时 auth session fixture，验证 active session 解析、expired /
revoked / invalidated 拒绝、inactive membership 拒绝、缺权限拒绝、cross-team target 拒绝、
脱敏和事务回滚。它只保存 session reference hash，不会创建浏览器登录、cookie route 或 provider callback。

`auth:cookie-check` 会创建临时 auth cookie fixture，验证 `Set-Cookie` 安全属性、request cookie
解析、missing cookie 拒绝、expired / revoked / invalidated cookie 拒绝、logout invalidation、
clear-cookie、脱敏和事务回滚。它只验证 server-only cookie/request bridge，不会创建公开登录页、
provider callback、middleware 或受保护业务 CRUD。

`auth:route-check` 会创建临时 auth route fixture，验证 `GET /api/auth/session` 的安全会话视图、
tenant/team scope required、`POST /api/auth/logout` 的 `x-operation-csrf: logout` header、logout
clear-cookie、logged-out cookie reuse、no-store 响应、脱敏和事务回滚。它只验证 local-only
session/logout Route Handler runtime，不会创建登录 provider、middleware、团队管理 UI 或业务保存流程。

`operator-v0:check` 会验证 local-only operator V0 bootstrap：关闭状态、CSRF 阻断、成功创建内部
operator/team session、`capture_session` / `run_ai_review` / `manage_products` / `review_knowledge`
等 V0 权限、安全 session view、no-store 响应、敏感元数据脱敏和幂等 seed 行为。它用于本地
operator V0 浏览器闭环，不是生产登录 provider、邀请流程或团队管理 UI。

`reference-data:v0-check` 会验证 local-only operator V0 参考数据闭环：V0 产品/知识权限、CSRF 阻断、
auth/scope 阻断、产品创建/列表、知识来源创建/列表、安全脱敏和事务回滚。它用于 `/rackets` 和
`/knowledge` 的 V0 浏览器工作流，不会抓取网页、调用 AI、创建 RAG snapshot 或自动发布未审核内容。

`downstream:v0-check` 会验证 local-only operator V0 下游闭环：V0 downstream 权限、CSRF 阻断、
auth/scope 阻断、已采纳 AI 复盘区块的下游引用、话术草稿创建、下场任务创建、列表读取、安全脱敏和
事务回滚。它用于 `/ai-review`、`/talk-tracks` 和 `/next-actions` 的 V0 浏览器工作流，不会调用真实
DeepSeek、RAG 或外部平台。

`sessions:check` 会创建临时直播运营 fixture，验证场次创建、重复标题日期拒绝、缺权限拒绝、
跨团队隔离、草稿 autosave、旧草稿版本拒绝、提交 readiness，并在事务内回滚。它不是
完整 `/sessions` 浏览器流程，也不会上传转录、调用 AI 或同步外部平台。

`sessions:route-check` 会创建临时 auth/session route fixture，验证
`GET /api/sessions/captures`、`POST /api/sessions/captures`、
`GET /api/sessions/captures/[sessionId]`、`PATCH /api/sessions/captures/[sessionId]/draft`
和 `POST /api/sessions/captures/[sessionId]/submit` 的 cookie auth、tenant/team scope、
mutation CSRF、草稿版本冲突、跨团队隔离、no-store 响应、脱敏和事务回滚。它仍不是
登录 provider、转录导入或 AI 复盘触发流程。

`knowledge:check` 会创建临时知识审核 fixture，验证来源登记、重复来源拒绝、缺权限拒绝、
claim/team note 创建、审核队列、审核通过、冲突阻断发布、解决冲突、发布 readiness、
跨团队隔离，并在事务内回滚。它不会抓取网页、
调用 AI、创建 RAG snapshot 或启动刷新任务。

`knowledge:route-check` 会创建临时 auth/knowledge route fixture，验证
`GET /api/knowledge/sources`、`POST /api/knowledge/sources`、
`GET /api/knowledge/sources/[sourceId]`、`POST /api/knowledge/claims`、
`POST /api/knowledge/team-notes`、`GET /api/knowledge/review-queue`、
`POST /api/knowledge/review-decisions`、`POST /api/knowledge/conflicts`、
`PATCH /api/knowledge/conflicts/[conflictId]` 和 `POST /api/knowledge/versions`
的 cookie auth、tenant/team scope、CSRF mutation header、来源登记、claim/note 创建、
审核、冲突阻断/解决、发布、跨团队隔离、no-store 响应和敏感元数据脱敏。它不会执行
公开来源抓取、RAG snapshot 或 AI 调用。

`ai-review:check` 会创建临时 AI 复盘 fixture，验证输入快照、知识快照、prompt 版本门禁、
provider 元数据、结构化输出、校验结果、人工审核、下游草案引用、反馈信号、敏感/过期阻断和
跨团队隔离，并在事务内回滚。它不是 `/ai-review` 页面保存流程，也不会执行 prompt、
调用 DeepSeek 或其它模型、创建 RAG snapshot、写入话术/任务权威记录或保存任何 API key。

`ai-review:generation-check` 使用 fake provider 验证 server-only AI 复盘 generation orchestrator：
成功生成、blocked redaction、blocked long input、insufficient evidence、weak session input、
provider timeout/rate limit/refusal/partial output、malformed output、schema mismatch、sensitive
output block、source-grounding warning、prompt fingerprint 和无 prompt/secret 泄露。它默认不会调用
真实 DeepSeek，也不会读取或打印任何 API key。

`ai-review:execution-check` 使用 fake provider 验证 server-only AI 复盘 execution service：准备 run、
启动生成、记录 provider metadata、持久化结构化输出、记录校验结果、review-ready 门禁、
validation_failed / provider_failed 失败状态、跨团队隔离和无 prompt/secret 泄漏。它默认不会调用
真实 DeepSeek，也不会读取或打印任何 API key。

`ai-review:route-check` 使用 fake provider 验证 local-only 受保护 AI 复盘 API runtime：prompt
metadata、run prepare/list/detail、execute、review decision、feedback、downstream reference、archive、
缺 cookie、缺 CSRF、缺 scope、cross-team isolation、provider failure、no-store、redaction 和事务回滚。
默认不会调用真实 DeepSeek，也不会读取或打印任何 API key。

`ai-review:v0-check` 使用本地 V0 bootstrap 和 fake provider 验证 `/ai-review` 浏览器工作流所需的
服务端边界：V0 execute 禁用态、缺 CSRF、缺 auth/scope、V0 权限、run prepare、fake-provider
execute、review-ready 输出、人工 decision、no-store、redaction 和事务回滚。它默认不会调用真实
DeepSeek，也不会读取或打印任何 API key。

`ai-provider:check` 使用 fake fetch 验证 server-only `AiProviderPort` 和 DeepSeek adapter：
缺 key、成功 JSON、超时、限流、鉴权失败、provider 不可用、空输出、malformed JSON、partial
output 和 schema mismatch。它默认不会调用真实 DeepSeek；只有同时配置 `DEEPSEEK_API_KEY` 和
`DEEPSEEK_LIVE_SMOKE=1` 时才执行最小 live smoke，且不会打印密钥、完整 prompt 或 provider payload。

`talk-tracks:check` 会创建临时话术资产 fixture，验证候选创建、缺权限拒绝、敏感候选阻断、
来源/AI 候选发布阻断、人工审核后发布、重复场景拒绝、跨团队隔离、复用反馈记录，并在事务内
回滚。它不是 `/talk-tracks` 页面保存流程，也不会调用 AI、创建 RAG grounding 或开放搜索。

`talk-tracks:route-check` 会创建临时 auth/talk-track route fixture，验证
`GET /api/talk-tracks/assets`、`POST /api/talk-tracks/assets`、
`GET /api/talk-tracks/assets/[assetId]`、candidate/review/publish/archive/restore/usage
routes 的 cookie auth、tenant/team scope、CSRF mutation header、AI 候选审核阻断、发布、
跨团队隔离、no-store 响应和敏感元数据脱敏。它仍不是浏览器保存 UI、AI 调用或 RAG 检索。

`next-actions:check` 会创建临时下场任务 fixture，验证创建、列表/详情、重复任务拒绝、非活跃
负责人拒绝、缺权限拒绝、负责人进度、检查项/依赖阻断、审核关闭、反馈记录、敏感来源阻断、
跨团队隔离，并在事务内回滚。它不是 `/next-actions` 页面保存流程，也不会创建通知、日历或导出。

`next-actions:route-check` 会创建临时 auth/next-action route fixture，验证
`GET /api/next-actions/tasks`、`POST /api/next-actions/tasks`、
`GET /api/next-actions/tasks/[taskId]`、status/checklist/dependency/complete/review-result/
feedback routes 的 cookie auth、tenant/team scope、CSRF mutation header、状态/检查项/依赖门禁、
跨团队隔离、no-store 响应和敏感元数据脱敏。它仍不是浏览器任务看板、通知、日历或外部集成。

Compose 的 PostgreSQL 18 volume 挂载到 `/var/lib/postgresql`，让镜像使用版本化 PGDATA
目录。不要改回 `/var/lib/postgresql/data`，否则 18+ 镜像会因数据目录布局不匹配而退出。

## Docker 部署

### 前提

本地需要安装 Docker。不支持在 Docker 内嵌套运行 Docker（DooD），
但 CI 环境下可以使用 Docker-in-Docker。

### 构建生产镜像

```bash
# 从仓库根目录运行
pnpm docker:build
# 或直接使用 docker
# docker build -t operation-web .
```

构建使用三阶段多阶段构建：
1. `deps` — 安装依赖
2. `builder` — 编译应用
3. `runner` — 只包含生产产物和运行时依赖

默认基础镜像为 ECR Public 上的 Docker Official `node:24-alpine`
镜像，以避免当前服务器网络下 Docker Hub 拉取超时。需要改回 Docker Hub
时可以覆盖 build arg：

```bash
docker build --build-arg NODE_IMAGE=node:24-alpine -t operation-web .
```

### 运行生产容器

```bash
pnpm docker:run
# 或
# docker run --rm -p 3000:3000 operation-web
```

应用将在 `http://localhost:3000` 可用。这个命令用于本地一次性验证，容器退出后会被删除，不适合
公网预览或服务器重启后的自恢复。

### 运行公网预览容器

服务器上的长驻预览容器使用稳定名称和 Docker restart policy：

```bash
pnpm docker:build
docker rm -f operation-web-preview || true
pnpm docker:preview
```

等价 Docker 命令：

```bash
docker run -d \
  --name operation-web-preview \
  --restart unless-stopped \
  -p 3000:3000 \
  operation-web
```

`--restart unless-stopped` 让容器在 Docker daemon 或服务器重启后自动恢复，前提是服务器上的 Docker
服务本身已设置为开机启动。不要把这个预览容器当成正式生产部署；域名、SSL、备份、监控、日志脱敏
和发布回滚仍需要单独 OpenSpec。

### 环境变量

| 变量 | 必需 | 说明 | 默认值 |
|----------|----------|-------------|---------|
| `PORT` | 否 | 服务监听端口 | `3000` |
| `HOSTNAME` | 否 | 服务监听地址 | `0.0.0.0` |
| `NODE_ENV` | 否 | 运行模式 | `production` |

示例：

```bash
docker run --rm -p 8080:8080 -e PORT=8080 operation-web
```

### 本地开发 Compose

```bash
docker compose up
```

这会启用 Turbopack 热重载，源代码通过 bind-mount 映射到容器内。

停止：

```bash
docker compose down
```

### 生产 Compose 验证

```bash
docker compose --profile prod up web-prod
```

该命令会构建生产镜像并用 production runner 启动容器。停止：

```bash
docker compose --profile prod down
```

### 健康检查

生产镜像内置 Docker HEALTHCHECK，每 30 秒检查 `/` 路由。
可以在 `Dockerfile` 中调整间隔和超时参数。

### 镜像大小

基于 `node:24-alpine`，最终镜像约 300–500 MB。
未来加入数据库驱动、AI SDK 后可能增长。

## 浏览器验证

启动开发服务器后，使用 Playwright helper 检查桌面和移动端视口：

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" --session bootstrap open http://localhost:3000
"$PWCLI" --session bootstrap snapshot
"$PWCLI" --session bootstrap close
```

验证重点：

- 根页面能加载。
- 控制台无错误。
- 中文文本不溢出、不重叠。
- 移动端导航按钮可打开。
- 页面清楚标注未实现能力，不展示真实业务数据。
