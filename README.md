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
- 本地-only 数据基础 runtime：PostgreSQL 开发服务、Drizzle schema/migration、Zod 校验、
  server-only database client、审计/幂等 repository 原语和本地验证脚本。
- 本地-only 球拍产品库 repository slice：产品、别名、来源、审核决策和发布门禁
  schema/migration、server-only repository、tenant/team scope、重复型号、别名冲突、来源冲突检测、
  下游 readiness 和本地验证脚本。
- 本地-only 直播场次采集 repository slice：场次、主播职责、商品顺序、场次笔记、客户问题、
  购买异议 schema/migration、server-only repository、tenant/team scope、草稿版本冲突、
  重复标题日期检测、提交 readiness 和本地验证脚本。
- 本地-only 知识生命周期 repository slice：来源登记、抽取 claim、团队知识笔记、审核决策、
  发布版本和冲突记录 schema/migration、server-only repository、tenant/team scope、
  来源去重、冲突阻断、发布 readiness 和本地验证脚本。
- 本地-only AI 复盘 run repository slice：输入快照、知识快照、prompt 版本元数据、provider
  调用元数据、结构化输出、校验结果、人工审核、反馈信号和下游草案引用 schema/migration、
  server-only repository、tenant/team scope、权限检查、敏感/过期/冲突阻断、人工审核下游门禁和本地验证脚本。
- 本地-only AI provider gate：server-only `AiProviderPort`、DeepSeek chat-completions adapter、
  环境变量密钥解析、结构化 JSON 输出校验、provider 失败归一化、日志脱敏和本地验证脚本。
- 本地-only AI 复盘生成编排切片：server-only generation orchestrator、已脱敏输入快照和已审核知识快照门禁、
  prompt fingerprint、结构化输出 schema validation、source grounding / sensitive / stale / conflict /
  long input validation、provider 错误映射和本地 fake-provider 验证脚本。
- 本地-only AI 复盘执行服务：server-only execution service 把已准备的 AI review run、generation
  orchestrator 和 repository ledger 串联起来，持久化 provider 元数据、结构化输出、校验结果和
  review-ready / failure 状态，并用 fake provider 本地验证。
- 本地-only 话术资产 repository slice：资产、版本、场景、区块、异议回应、来源引用、AI 候选、
  审核决策和复用反馈 schema/migration、server-only repository、tenant/team scope、权限检查、
  AI 候选审核阻断、发布门禁、重复场景阻断、readiness 和本地验证脚本。
- 本地-only 下场任务 repository slice：任务、来源证据、负责人、检查项、依赖、审核结果和反馈信号
  schema/migration、server-only repository、tenant/team scope、权限检查、状态流转、重复检测、
  敏感来源阻断、readiness 和本地验证脚本。
- OpenSpec 规格、项目 AI 开发规则、持续迭代 Goal 和路线文档。

已实现的前端路由：

| 路由 | 当前用途 |
| --- | --- |
| `/` | 工作台总览、线路状态和能力边界 |
| `/sessions` | 静态直播场次采集工作台 |
| `/rackets` | 静态球拍产品库工作台 |
| `/knowledge` | 静态知识库学习中枢 |
| `/ai-review` | 静态 AI 复盘工作台 |
| `/talk-tracks` | 话术资产占位页 |
| `/next-actions` | 下场任务占位页 |

当前尚未接入登录 provider、middleware、cookie 写入/删除、面向用户的业务 CRUD、
真实后端接口、AI 复盘公开触发/API/UI 保存、RAG、公开网页采集、抖音/电商平台或真实业务数据。任何上述能力都必须
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
DATABASE_URL="postgres://..." pnpm sessions:check
DATABASE_URL="postgres://..." pnpm rackets:check
DATABASE_URL="postgres://..." pnpm rackets:source-review-check
DATABASE_URL="postgres://..." pnpm knowledge:check
DATABASE_URL="postgres://..." pnpm ai-review:check
DATABASE_URL="postgres://..." pnpm ai-review:execution-check
pnpm ai-review:generation-check
pnpm ai-provider:check
DATABASE_URL="postgres://..." pnpm talk-tracks:check
DATABASE_URL="postgres://..." pnpm next-actions:check
```

本地 `.env.example` 提供开发库示例连接串。`auth:check` 和 `auth:session-check` 使用同一开发库，
在事务内创建并回滚授权守卫与 session runtime 测试数据。Compose 只把开发库绑定到
`127.0.0.1:5433`；不要把生产数据库凭据写入仓库。

生产镜像：

```bash
pnpm docker:build
pnpm docker:run
```

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
- 静态页面进入真实后端、数据库、AI、RAG 或外部集成前，必须先写接口契约草案。
- UI 风格通过 `apps/web/src/app/globals.css` 的全局 token 管理，不在页面里大量硬编码。
- 动效通过全局 motion token 和 `workspace-motion.tsx` primitives 使用。
- 用户界面文案必须面向运营人员的使用动作和状态，不展示开发说明、需求说明、
  OpenSpec、后端/AI/数据库计划或内部架构逻辑。
- AI 输出不能直接当权威事实；可复用知识必须经过来源、审核、版本和刷新流程。
- Git commit message 使用中文。
- 完成前必须运行与变更相匹配的验证，并在最终说明中写清验证结果和剩余风险。

## 自主迭代方向

当前优先路线：

1. 继续从已建立的产品、场次、知识、AI、Q&A、认证、数据、话术和下场任务契约推进。
2. 继续用本地 guard 和 session resolver 推进必要的运营持久化小闭环，同时避免把它们误认为公开 CRUD。
3. DeepSeek provider gate、AI 复盘 generation orchestrator 和 server-only execution service
   已本地落地；后续 AI 复盘 MVP 需要单独 OpenSpec 定义公开触发/API/UI 保存、输入来源、
   RAG snapshot、评测、审核和失败状态。
4. 真实认证 provider/login/cookie runtime 仍是受保护业务数据进入公开保存流程前的关键前置项。
5. Q&A Agent 必须分阶段支持已审核知识回答、用户反馈、缺失知识检测、公开来源发现和审核入库。

更多细节见持续迭代 Goal 和路线文档。
