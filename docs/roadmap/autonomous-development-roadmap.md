# 自主迭代开发路线

最后更新：2026-05-23

本路线是项目持续开发的工作底稿。它不替代 OpenSpec；所有非平凡产品、
前端、AI、数据、集成和依赖变更仍必须先创建或更新 OpenSpec change。

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
- Agent 架构规划见 `docs/architecture/agent-architecture.md`。
- 后端/API/AI/RAG 契约草案入口见 `docs/contracts/README.md`。

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

- 登录、团队、权限、租户隔离。
- PostgreSQL、Drizzle、迁移、真实持久化。
- AI provider、prompt、结构化输出、模型调用。
- 公开来源采集、网页搜索、审核队列、刷新任务。
- 抖音、电商后台、订单、私信、支付、结算或公开商城能力。

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

## 自主迭代循环

每轮开发按这个顺序推进：

1. 观察当前系统：路由、代码、规格、文档、验证输出和公网预览。
2. 识别缺口：用户工作流、UX 状态、数据边界、AI 风险、知识缺口、验证缺口。
3. 查证不确定项：优先用项目文档、已安装 skill、官方文档、公开来源和可靠行业资料。
4. 更新 OpenSpec：把目标、取舍、风险、验收和任务写清楚。
5. 写契约草案：如果后续要接后端、数据库、AI、RAG 或外部集成，先定义领域对象、
   输入输出、状态机、错误、权限、敏感数据和验证。
6. 实现最小闭环：优先做一个能验证价值的能力切片。
7. 验证并部署：运行相关检查，必要时更新公网容器。
8. 沉淀路线：把新发现的缺口、下一步和文档更新写回路线或规格。

## Now

当前优先把静态工作台升级成能承载真实工作流的基础能力：

1. 接口契约基线：为球拍产品、直播场次、知识生命周期、AI run 和 Q&A Agent 写契约草案。
2. `/rackets` 产品库工作台：先以静态字段结构验证型号、别名、规格、审核和下游准备。
3. Agent 架构基线：按 `AiProviderPort`、`RetrievalPort`、PostgreSQL + pgvector、
   OpenAI Responses API 首选 provider 的方案推进规划。
4. 认证与团队边界：登录、团队、角色、租户隔离、受保护路由。
5. 数据基础：PostgreSQL、Drizzle schema、迁移、Zod 校验、审计字段。
6. 球拍产品库持久化：先补 `racket-product-library` 契约，再实现型号、别名、规格、
   卖点、适用人群、价格带和审核状态。
7. 直播场次保存：手动录入、草稿恢复、长文本边界、问题和异议结构化。
8. 知识库持久化：来源登记、公开数据元信息、审核状态、版本和刷新时间。

## Next

在基础数据和权限稳定后，开始做可用的 AI 与运营闭环：

1. AI 复盘 MVP：prompt 版本、结构化输出、Zod 校验、失败状态、人工审核。
2. 话术资产：从复盘中沉淀讲解结构、异议回应、短视频选题和适用场景。
3. 下场任务：把复盘建议转成可跟进任务，支持状态、负责人和回看。
4. 反馈学习：记录接受、编辑、拒绝、再生成等信号，用于评测和知识刷新优先级。
5. Q&A Agent 第一阶段：只基于已审核知识和团队知识回答，明确标注事实、经验和 AI 推断。

## Later

后续在验证真实使用价值后再推进高风险或集成型能力：

1. Q&A Agent 反馈阶段：点赞、点踩、原因、答案编辑和代表性问题评测集。
2. Q&A Agent Web 发现阶段：允许搜索公开来源，展示引用和不确定性，新增知识进入审核流。
3. 公开来源刷新任务：定时检查变更、冲突、失效链接和过期知识。
4. 外部平台集成：只在官方 API、权限、条款、数据范围和失败模式清楚后推进。
5. 导出、分析、运营报表和团队协作。

## 研究和依赖策略

允许自主使用网络、skill、工具或依赖，但必须满足这些条件：

- 先判断是否真的需要，不能为简单问题引入复杂依赖。
- 当前信息可能过期、涉及库/API/平台规则/法律/市场实践时，必须查证。
- 技术问题优先看官方文档；产品和行业问题记录来源类型、可信度和时间。
- 可复用业务知识不得直接成为权威事实，必须进入来源元数据、信任等级、审核、版本和刷新流程。
- 新 npm 依赖必须在 OpenSpec 设计中写清问题、替代方案、维护和许可证风险、运行影响、失败模式和回滚路径。

## Agent / RAG 选型基线

Agent 不是聊天框，而是一条受控业务流程。当前架构结论：

- 首个 LLM provider 优先 OpenAI Responses API，但必须通过项目自有 `AiProviderPort`。
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

前端或文档声明影响线上体验时，完成后检查：

```bash
pnpm docker:build
docker stop operation-web-preview || true
docker run -d --rm --name operation-web-preview -p 3000:3000 operation-web:latest
docker ps --filter name=operation-web-preview --format '{{.ID}} {{.Image}} {{.Status}} {{.Ports}}'
curl -I --max-time 10 http://203.195.161.93:3000/
```

关键路由至少检查 `/`、`/sessions`、`/knowledge`、`/ai-review`。新增页面或修改页面时，
同步使用 Playwright 做浏览器级验证。
