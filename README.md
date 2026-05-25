# 羽拍直播运营 AI 工作台

面向羽毛球拍直播电商团队的中文 AI 运营工作台。目标是帮助运营、主播、商品负责人和
团队负责人准备直播、维护球拍知识、复盘内容、沉淀话术、规划下场任务，并逐步构建可
审核、可追溯、可持续改进的 AI 问答与知识库能力。

公网预览：<http://203.195.161.93:3000/>

## 当前状态

当前仓库已经包含第一个 Web 应用基线：

- pnpm workspace。
- Next.js App Router、TypeScript、React、Tailwind CSS。
- shadcn/ui-compatible primitives、lucide-react、motion。
- Docker 生产镜像和 3000 端口公网预览。
- 本地-only 授权守卫基础：provider-neutral auth context、role-permission policy、
  server-side guard、safe auth errors、data access context 转换和本地验证脚本。
- 本地-only auth session runtime：`auth_sessions` ledger、opaque session reference hash、
  server-only session resolver、expired/revoked/invalidated 拒绝、脱敏和 `auth:session-check`
  回滚式验证。
- 本地-only auth cookie runtime：server-only session cookie issue/clear header、request cookie
  resolver、logout invalidation、脱敏、secure-by-default cookie policy、显式 internal V0
  HTTP preview cookie policy 和 `auth:cookie-check` 回滚式验证。
- 本地-only auth route runtime：`GET /api/auth/session` 安全会话视图、CSRF-checked
  `POST /api/auth/logout`、no-store 响应、脱敏和 `auth:route-check` 回滚式验证；仍不包含生产登录页、
  provider callback、团队管理或完整生产业务 CRUD。
- 本地-only operator V0 bootstrap：`POST /api/auth/operator-v0-session` 在显式启用和
  CSRF header 下创建内部演示 operator/team session，用于本地 `/sessions`、`/rackets`、
  `/knowledge`、`/ai-review`、`/talk-tracks` 和 `/next-actions` 浏览器工作流验证；它不是生产登录 provider。
  HTTP 公网预览如需完整 V0 认证流程，必须同时显式开启 V0 bootstrap 和 internal preview cookie
  flag；该模式只允许演示/内部评估数据，不允许录入真实客户、订单、私信、供应商或定价敏感信息。
- 统一内部试用入口：工作区侧栏、移动端试用条和 `/` 总览 cockpit 复用现有 V0 bootstrap、
  `GET /api/auth/session` 与 `POST /api/auth/logout`，一次进入演示团队后可继续访问六个 V0 工作面；
  浏览器只保存安全的 tenant/team/actor 展示 scope，不保存 raw cookie、session reference 或 provider token。
- Public trial auth foundation：`/trial` 提供受控试用访问入口，Next.js Proxy 会在缺少 app-owned
  session cookie 时把 `/sessions`、`/rackets`、`/knowledge`、`/ai-review`、`/talk-tracks`
  和 `/next-actions` 跳转到 `/trial?next=...`；该 route gate 只做进入试用前的路由预过滤，
  最终数据授权仍由服务端 Route Handler、session resolver、tenant/team scope 和 repository rule 执行。
- Internal trial MVP hardening 已归档：`/trial` ready 后的继续动作、`/` cockpit、六个 V0
  工作面可达性和试用边界由 `trial-mvp:check` 聚合验证；它仍只适用于演示/脱敏数据，不等于生产登录。
- 本地-only 数据基础 runtime：PostgreSQL 开发服务、Drizzle schema/migration、Zod 校验、
  server-only database client、审计/幂等 repository 原语和本地验证脚本。
- 本地-only 球拍产品库 repository slice：产品、别名、来源、审核决策和发布门禁
  schema/migration、server-only repository、tenant/team scope、重复型号、别名冲突、来源冲突检测、
  下游 readiness 和本地验证脚本。
- 本地-only 直播场次采集 repository slice：场次、主播职责、商品顺序、场次笔记、客户问题、
  购买异议 schema/migration、server-only repository、tenant/team scope、草稿版本冲突、
  重复标题日期检测、提交 readiness 和本地验证脚本。
- 本地-only 直播场次采集 API runtime：`GET /api/sessions/captures`、
  `POST /api/sessions/captures`、`GET /api/sessions/captures/[sessionId]`、
  `PATCH /api/sessions/captures/[sessionId]/draft` 和
  `POST /api/sessions/captures/[sessionId]/submit` 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式验证工作。
- `/sessions` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 场次、创建草稿、
  保存复盘输入并提交到 review-ready；转录上传、平台同步、直接 AI 生成和生产登录仍未开放。
- `/rackets` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 球拍产品、
  创建人工产品草稿，登记来源，提交审核，审核来源/产品，发布产品，并保留型号、别名、规格、
  适合人群、限制、审核队列、来源摘要和下游 readiness；产品编辑、公开来源发现和 AI/RAG
  grounding 仍未开放。
- 本地-only 知识生命周期 repository slice：来源登记、抽取 claim、团队知识笔记、审核决策、
  发布版本和冲突记录 schema/migration、server-only repository、tenant/team scope、
  来源去重、冲突阻断、发布 readiness 和本地验证脚本。
- 本地-only 知识生命周期 API runtime：`GET /api/knowledge/sources`、
  `POST /api/knowledge/sources`、`GET /api/knowledge/sources/[sourceId]`、
  `POST /api/knowledge/claims`、`POST /api/knowledge/team-notes`、
  `GET /api/knowledge/review-queue`、`POST /api/knowledge/review-decisions`、
  `POST /api/knowledge/conflicts`、`PATCH /api/knowledge/conflicts/[conflictId]`
  和 `POST /api/knowledge/versions` 通过现有 auth cookie/session runtime、显式
  tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式验证工作。
- `/knowledge` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 来源、
  登记官方或团队来源、创建人工 claim 和团队笔记、查看审核队列、记录审核通过，并通过受保护发布接口
  尝试发布版本；未审核或冲突内容不会自动成为权威知识。
- 本地-only AI 复盘 run repository slice：输入快照、知识快照、prompt 版本元数据、provider
  调用元数据、结构化输出、校验结果、人工审核、反馈信号和下游草案引用 schema/migration、
  server-only repository、tenant/team scope、权限检查、敏感/过期/冲突阻断、人工审核下游门禁和本地验证脚本。
- 本地-only AI provider gate：server-only `AiProviderPort`、DeepSeek chat-completions adapter、
  环境变量密钥解析、结构化 JSON 输出校验、provider 失败归一化、日志脱敏和本地验证脚本。
- AI review live-model gate：`OPERATION_ENABLE_LIVE_AI_REVIEW=1` 加有效 DeepSeek 环境变量后，
  `/ai-review` 可在默认本地 V0 fake provider 之外选择真实模型生成；状态接口只返回 safe readiness，
  `ai-review:live-gate-check` 默认不调用真实 DeepSeek。
- 本地-only AI 复盘生成编排切片：server-only generation orchestrator、已脱敏输入快照和已审核知识快照门禁、
  prompt fingerprint、结构化输出 schema validation、source grounding / sensitive / stale / conflict /
  long input validation、provider 错误映射和本地 fake-provider 验证脚本。
- 本地-only AI 复盘执行服务：server-only execution service 把已准备的 AI review run、generation
  orchestrator 和 repository ledger 串联起来，持久化 provider 元数据、结构化输出、校验结果和
  review-ready / failure 状态，并用 fake provider 本地验证。
- 本地-only AI 复盘 API runtime：`POST /api/ai-review/prompt-versions`、
  `GET/POST /api/ai-review/runs`、`GET /api/ai-review/runs/[runId]`、
  execute/decisions/feedback/downstream/archive run actions 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、`x-operation-csrf: ai-review`、execution service、fake-provider 验证路径、
  repository business rules、no-store 安全响应和本地回滚式验证工作。
- `/ai-review` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载已提交场次、
  准备 AI review run、通过本地 V0 fake provider 生成复盘建议、查看校验结果并记录人工采纳/暂不用；
  已采纳的话术候选、短视频选题和下场动作可先记录下游草稿引用，再进入话术资产或下场任务工作台；
  默认不调用真实 DeepSeek；当 live-model gate ready 时可显式选择真实模型生成。两种模式输出都需要
  人工审核，不接 RAG，也不自动发布话术或完成任务。
- 本地-only 话术资产 repository slice：资产、版本、场景、区块、异议回应、来源引用、AI 候选、
  审核决策和复用反馈 schema/migration、server-only repository、tenant/team scope、权限检查、
  AI 候选审核阻断、发布门禁、重复场景阻断、readiness 和本地验证脚本。
- 本地-only 话术资产 API runtime：`GET /api/talk-tracks/assets`、
  `POST /api/talk-tracks/assets`、`GET /api/talk-tracks/assets/[assetId]`、
  `POST /api/talk-tracks/candidates`、`POST /api/talk-tracks/candidate-reviews`、
  `POST /api/talk-tracks/review-decisions`、submit/publish/archive/restore asset
  actions 和 `POST /api/talk-tracks/usage-signals` 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式验证工作。
- `/talk-tracks` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 话术资产、
  从人工输入或已采纳 AI 复盘区块创建可复核草稿，并保留来源和审核状态；不会自动发布。
- 本地-only 下场任务 repository slice：任务、来源证据、负责人、检查项、依赖、审核结果和反馈信号
  schema/migration、server-only repository、tenant/team scope、权限检查、状态流转、重复检测、
  敏感来源阻断、readiness 和本地验证脚本。
- 本地-only 下场任务 API runtime：`GET /api/next-actions/tasks`、
  `POST /api/next-actions/tasks`、`GET /api/next-actions/tasks/[taskId]`、status/checklist/
  dependency/complete/review-result/feedback task actions 通过现有 auth cookie/session runtime、
  显式 tenant/team scope、CSRF mutation header、repository business rules、no-store 安全响应和
  本地回滚式验证工作。
- `/next-actions` operator V0 浏览器工作流：可进入本地 V0 团队上下文、加载 scoped 下场任务、
  从人工输入或已采纳 AI 复盘动作创建任务，并通过现有 status/checklist API 推进基础进度。
- OpenSpec 规格、项目 AI 开发规则、持续迭代 Goal 和路线文档。

已实现的前端路由：

| 路由 | 当前用途 |
| --- | --- |
| `/` | 工作台总览、内部试用 cockpit、线路状态和能力边界 |
| `/trial` | 受控试用访问入口，进入演示团队后继续到目标工作面 |
| `/sessions` | Operator V0 直播场次采集工作流，可本地创建、保存和提交场次 |
| `/rackets` | Operator V0 球拍产品库工作流，可本地创建产品、登记来源、审核并发布 |
| `/knowledge` | Operator V0 资料来源工作流，可本地登记来源、沉淀知识、审核并尝试发布 |
| `/ai-review` | Operator V0 AI 复盘工作流，可本地选择已提交场次、用本地演示或 gated 真实模型生成建议、记录审核并创建下游引用 |
| `/talk-tracks` | Operator V0 话术资产工作流，可本地查看资产并创建人工/AI 来源草稿 |
| `/next-actions` | Operator V0 下场任务工作流，可本地查看任务、创建任务并推进检查项 |

当前尚未接入生产登录 provider、公开登录路由、团队管理、面向用户的完整生产 CRUD、
AI 复盘完整生产模型发布/Server Action/RAG、公开网页采集、抖音/电商平台或真实业务数据。当前 gated
live-model MVP 不等于生产 AI 发布或真实敏感数据入口。任何上述能力都必须
先通过 OpenSpec 定义边界、契约、风险和验证。

## 快速开始

要求：

- Node.js `>=24`
- pnpm `11.2.2`
- Docker（仅构建或运行生产容器时需要）

从仓库根目录运行：

```bash
pnpm install
pnpm dev
```

常用检查：

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
openspec validate --all
```

本地数据基础验证：

```bash
docker compose --profile db up -d postgres
DATABASE_URL="postgres://..." pnpm db:generate
DATABASE_URL="postgres://..." pnpm db:migrate
DATABASE_URL="postgres://..." pnpm db:check
DATABASE_URL="postgres://..." pnpm auth:check
DATABASE_URL="postgres://..." pnpm auth:session-check
DATABASE_URL="postgres://..." pnpm auth:cookie-check
DATABASE_URL="postgres://..." pnpm auth:route-check
DATABASE_URL="postgres://..." pnpm operator-v0:check
DATABASE_URL="postgres://..." pnpm internal-trial:check
DATABASE_URL="postgres://..." pnpm trial-mvp:check
pnpm public-trial-auth:check
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

本地 `.env.example` 提供开发库示例连接串。`auth:check`、`auth:session-check`、
`auth:cookie-check` 和 `auth:route-check` 使用同一开发库，在事务内创建并回滚授权守卫、
session runtime、cookie runtime 与 auth route runtime 测试数据。Compose 只把开发库绑定到
`127.0.0.1:5433`；不要把生产数据库凭据写入仓库。

生产镜像：

```bash
pnpm docker:build
pnpm docker:run
```

内部 V0 HTTP 预览必须显式开启，且不等同于生产登录：

```bash
docker compose --profile db up -d postgres
DATABASE_URL="postgres://operation:operation_dev_password@127.0.0.1:5433/operation_dev" pnpm db:migrate
pnpm docker:build
docker rm -f operation-web-preview || true
pnpm docker:preview
```

`pnpm docker:preview` 会把 web 预览容器接入 Compose 的 `operation_default` 网络，并默认使用
容器内可访问的 `postgres:5432` 预览数据库地址。非默认预览库用
`OPERATION_PREVIEW_DATABASE_URL` 覆盖，不能提交真实生产凭据：

```bash
docker run -d \
  --name operation-web-preview \
  --restart unless-stopped \
  --network operation_default \
  -p 3000:3000 \
  -e DATABASE_URL="${OPERATION_PREVIEW_DATABASE_URL:-postgres://operation:operation_dev_password@postgres:5432/operation_dev}" \
  -e OPERATION_ENABLE_V0_BOOTSTRAP=1 \
  -e OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE=1 \
  operation-web:latest
```

关闭 `OPERATION_ALLOW_INSECURE_V0_PREVIEW_COOKIE` 后，公网 HTTP 预览会回到 secure-by-default cookie
行为，通常只能验证页面渲染和入口状态。预览库仍是 local-only/内部演示用途，不要录入真实客户、
订单、私信、供应商、定价策略或完整未脱敏转录。正式试用仍需要 HTTPS、生产登录、备份恢复和敏感数据治理。

## 关键文档

| 文档 | 用途 |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | AI agent 进入仓库的项目级规则入口 |
| [`.codex/rules/README.md`](./.codex/rules/README.md) | AI 协作、实现质量、安全、验证和前端规则索引 |
| [`docs/roadmap/ai-continuous-development-goal.md`](./docs/roadmap/ai-continuous-development-goal.md) | 持续迭代开发 Goal、目标用户、协作边界和完成证据 |
| [`docs/roadmap/autonomous-development-roadmap.md`](./docs/roadmap/autonomous-development-roadmap.md) | Now/Next/Later 开发路线 |
| [`docs/contracts/README.md`](./docs/contracts/README.md) | 后续 API、AI、RAG、数据和集成契约草案入口 |
| [`docs/architecture/agent-architecture.md`](./docs/architecture/agent-architecture.md) | Agent、LLM、RAG 和反馈学习架构基线 |
| [`docs/engineering/code-architecture-standards.md`](./docs/engineering/code-architecture-standards.md) | 代码架构、依赖、抽象、反冗余和界面文案标准 |
| [`apps/web/README.md`](./apps/web/README.md) | Web 应用路由、主题、动效和 Docker 细节 |
| [`openspec/specs/`](./openspec/specs) | 已接受能力规格 |

## 开发规范

- 非平凡变更必须先创建或更新 OpenSpec change。
- 页面进入新的后端、数据库、AI、RAG 或外部集成前，必须先写接口契约草案；已有 V0 浏览器工作流也不能绕过
  tenant/team、CSRF、审核和脱敏边界。
- UI 风格通过 `apps/web/src/app/globals.css` 的全局 token 管理，不在页面里大量硬编码。
- 动效通过全局 motion token 和 `workspace-motion.tsx` primitives 使用。
- 用户界面文案必须面向运营人员的使用动作和状态，不展示开发说明、需求说明、
  OpenSpec、后端/AI/数据库计划或内部架构逻辑。
- AI 输出不能直接当权威事实；可复用知识必须经过来源、审核、版本和刷新流程。
- Git commit message 必须使用 Conventional Commits 格式，例如
  `feat(auth): 增加本地会话 cookie runtime`。
- 完成前必须运行与变更相匹配的验证，并在最终说明中写清验证结果和剩余风险。

## 自主迭代方向

当前优先路线：

1. 继续从已建立的产品、场次、知识、AI、Q&A、认证、数据、话术和下场任务契约推进。
2. 继续用本地 guard、session resolver、cookie request bridge、session/logout auth routes 和
   operator V0 工作台推进必要的运营持久化小闭环，同时避免把它们误认为公开 CRUD 或完整登录系统。
3. DeepSeek provider gate、AI 复盘 generation orchestrator、server-only execution service、
   本地受保护 AI 复盘 API runtime 和 `/ai-review` operator V0 浏览器工作流已本地落地；后续
   生产模型发布、Server Action、输入来源自动化、RAG snapshot、评测、审核体验和公开试用仍需要单独 OpenSpec。
4. 真实认证 provider/login、公开登录路由、middleware 和 team switching 仍是受保护业务数据进入
   面向用户公开保存流程前的关键前置项。
5. Q&A Agent 必须分阶段支持已审核知识回答、用户反馈、缺失知识检测、公开来源发现和审核入库。

更多细节见持续迭代 Goal 和路线文档。
