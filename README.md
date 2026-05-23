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

当前尚未接入登录、数据库、真实后端接口、AI provider、RAG、公开网页采集、抖音/电商
平台或真实业务数据。任何上述能力都必须先通过 OpenSpec 定义边界、契约、风险和验证。

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
| [`apps/web/README.md`](./apps/web/README.md) | Web 应用路由、主题、动效和 Docker 细节 |
| [`openspec/specs/`](./openspec/specs) | 已接受能力规格 |

## 开发规范

- 非平凡变更必须先创建或更新 OpenSpec change。
- 静态页面进入真实后端、数据库、AI、RAG 或外部集成前，必须先写接口契约草案。
- UI 风格通过 `apps/web/src/app/globals.css` 的全局 token 管理，不在页面里大量硬编码。
- 动效通过全局 motion token 和 `workspace-motion.tsx` primitives 使用。
- AI 输出不能直接当权威事实；可复用知识必须经过来源、审核、版本和刷新流程。
- Git commit message 使用中文。
- 完成前必须运行与变更相匹配的验证，并在最终说明中写清验证结果和剩余风险。

## 自主迭代方向

当前优先路线：

1. 补齐 `racket-product-library`、`session-capture`、`knowledge-lifecycle`、
   `ai-review-run`、`qa-agent-answer` 契约草案。
2. 再进入认证/团队边界、数据库基础和产品库持久化。
3. 在数据和权限稳定后实现 AI 复盘、话术资产、下场任务和 Q&A Agent。
4. Q&A Agent 必须分阶段支持已审核知识回答、用户反馈、缺失知识检测、公开来源发现和审核入库。

更多细节见持续迭代 Goal 和路线文档。
