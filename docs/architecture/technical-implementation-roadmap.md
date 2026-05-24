# 技术实施阶段路线

最后更新：2026-05-24

状态：技术大纲，非运行时代码。

本文件定义项目从当前静态工作台走向真实多用户、持久化、AI、RAG、反馈学习和外部集成的
阶段路线。它不替代 OpenSpec、契约或工程标准；后续每个非平凡阶段仍必须先创建或更新
OpenSpec change，并在实现前复核本文件。

目标是先把技术方向、边界和预留点想清楚，避免后续因为临时选型、跨层调用、数据模型混乱
或 AI 输出不可追溯导致返工。

## 如何使用本技术大纲

后续任何 agent 或开发者在写运行时代码前，必须先回答：

1. 当前需求属于哪个阶段。
2. 前置契约是否存在，是否仍正确。
3. 该阶段技术选择是已接受、默认方向，还是仍是延后决策。
4. 是否需要新增 provider、SDK、数据库表、迁移、后台任务、对象存储、部署服务或外部账号。
5. 是否会处理受保护数据、客户数据、prompt、AI output、公开来源或团队业务数据。
6. 是否保留 UI、domain、data、AI、retrieval、integration、ops 的边界。
7. 用户或工程侧能得到什么可验证效果。

如果答案不清楚，先更新 OpenSpec、契约或本文件，再写代码。

技术选择状态：

| 状态 | 含义 | 后续动作 |
| --- | --- | --- |
| 已接受 | 已进入 accepted specs 或本路线基线 | 可按边界实现，偏离时必须新建 OpenSpec 说明原因 |
| 默认方向 | 当前证据支持的首选方向，但仍需实现阶段复核 | 实现前复核官方文档、失败模式、回滚和验证 |
| 延后决策 | 不宜现在锁死 provider 或外部服务 | 先保留 port/adapter，等该阶段 OpenSpec 比较后再选 |
| 禁止提前 | 当前阶段不能做，除非新证据改变路线 | 先更新 OpenSpec 和本路线，说明为什么跨阶段 |

## 依据和可信来源

本路线基于项目已接受规格、当前代码和可靠来源：

- 项目已接受规格：`technical-architecture-foundation`、`agent-architecture-foundation`、
  `continuous-improvement-roadmap`、`racket-product-library-contract`、
  `session-capture-contract`、`knowledge-lifecycle-contract`、`auth-team-tenant-contract`、
  `ai-review-run-contract`、`qa-agent-answer-contract`、`data-foundation-contract`、
  `talk-track-asset-contract`、`next-session-task-contract`。
- 当前代码：`apps/web` 使用 pnpm、Next.js App Router、TypeScript、React、Tailwind CSS、
  shadcn/ui-compatible primitives、lucide-react、motion，并已加入本地-only Drizzle/PostgreSQL
  数据基础 runtime、provider-neutral auth guard foundation、app-owned auth session runtime、
  auth cookie/request runtime、auth route runtime、球拍产品/别名/来源/审核/发布
  repository slice、球拍产品 create/list 受保护 Route Handler runtime、直播场次采集 repository slice、
  直播场次 create/list/detail/autosave/submit 受保护 Route Handler runtime、知识生命周期 repository slice、AI 复盘 run
  repository slice、DeepSeek `AiProviderPort` adapter、AI review generation orchestrator、
  AI review execution service、
  话术资产 repository slice 和下场任务 repository slice。
- Next.js 官方文档：`https://nextjs.org/docs/app`，用于确认 App Router、Route Handlers、
  Server Actions、Backend for Frontend 和 authentication 边界。
- PostgreSQL 官方文档：`https://www.postgresql.org/docs/current/`，用于确认事务、约束、
  索引、Row Level Security、全文检索和数据完整性能力。
- Drizzle ORM 官方文档：`https://orm.drizzle.team/docs`，用于确认未来 PostgreSQL schema
  和 migration 需要通过明确迁移管理。
- Zod 官方文档：`https://zod.dev/`，用于确认 TypeScript schema validation、JSON schema
  和边界校验能力。
- pgvector 官方项目文档：`https://github.com/pgvector/pgvector`，用于确认 PostgreSQL +
  pgvector 可以作为 RAG MVP 的向量检索基础。
- OpenAI 官方文档：`https://platform.openai.com/docs`，用于确认 Responses API、结构化输出、
  tool/response metadata 和 provider adapter 的设计方向。
- DeepSeek 官方文档：`https://api-docs.deepseek.com/zh-cn/`，用于确认用户指定的后续
  AI provider 候选、base URL、模型接入方式和 provider gate 需要查证的失败模式；API key
  只能通过环境变量配置，不能写入仓库或日志。
- NIST AI RMF：`https://www.nist.gov/itl/ai-risk-management-framework`，用于 AI 风险治理、
  人工监督、可追溯和评测边界。
- OWASP Top 10 for LLM Applications：`https://owasp.org/www-project-top-10-for-large-language-model-applications/`，
  用于 prompt injection、敏感信息泄露、供应链和过度代理风险。
- W3C PROV-O：`https://www.w3.org/TR/prov-o/`，用于来源、版本、派生关系和审核证据建模。
- Docker 官方 restart policy 文档：
  `https://docs.docker.com/engine/containers/start-containers-automatically/`，用于公网预览容器
  在服务器或 Docker daemon 重启后的自恢复策略。

## 总原则

- 先契约，后运行时：页面要保存数据、调用 AI、接 RAG、导入来源或创建任务前，必须先有契约。
- 先租户和权限，后真实业务数据：没有 server-side tenant/team authorization，不保存受保护数据。
- 先领域模型，后数据库表：球拍、场次、知识、复盘、话术、任务都使用领域语言，不泛化成
  `item` 或 `content`。
- 先稳定边界，后 provider：AI、RAG、来源发现、对象存储、队列、认证和外部平台都通过项目
  port/adapter 边界接入。
- 先可审核，后自动化：AI 结果、公开来源发现和反馈学习不能直接改权威知识或下游资产。
- 先评测和失败状态，后优化：prompt、检索、模型、chunk 策略变化必须有代表性样本和失败场景。
- 先小闭环，后集成：每个阶段要产生可验证效果，而不是只安装依赖或创建目录。

## 分层架构和边界

未来运行时按这条依赖方向推进：

```text
Browser UI
  -> App Router pages/components
  -> Route Handlers / thin Server Actions
  -> Domain services
  -> Ports
       AuthPort
       Repository interfaces
       AiProviderPort
       RetrievalPort
       SourceDiscoveryPort
       QueuePort
       ObjectStoragePort
       ObservabilityPort
       ExternalIntegrationPort
  -> Adapters / providers
       Auth provider
       PostgreSQL / Drizzle
       OpenAI or later LLM provider
       PostgreSQL full-text search / pgvector
       Official source APIs
       Queue / storage / monitoring providers
```

边界规则：

- UI 只渲染视图、交互和本地状态，不直接调用数据库、LLM、向量库、搜索服务或外部平台。
- Route Handlers 是可复用 HTTP/API 边界；Server Actions 只做薄 UI mutation wrapper。
- Domain services 表达球拍、场次、知识、复盘、话术和任务规则，不处理 provider SDK shape。
- Repository 负责 SQL/ORM、事务、约束、分页、幂等和审计。
- AI 层负责 prompt 版本、provider 调用、结构化输出、校验、重试和 run 状态。
- Retrieval 层负责 reviewed snapshot、metadata filter、全文检索、向量检索和引用。
- Integration 层负责官方平台、公开来源、文件、通知和外部 API，不直接改权威知识。

## 技术决策台账

| 主题 | 当前选择 | 状态 | 原因 | 延后/预留点 |
| --- | --- | --- | --- | --- |
| Web framework | Next.js App Router | 已接受 | 当前代码已采用，适合页面、BFF 和 Route Handlers 一体推进 | 若拆后端，需独立 OpenSpec |
| 包管理 | pnpm workspace | 已接受 | 当前根脚本和 app scripts 已采用 | 不切换包管理器 |
| UI | Tailwind CSS、shadcn-compatible primitives、lucide-react、motion | 已接受 | 已形成中文运营工作台基线 | 继续通过全局 token 管理视觉 |
| API/BFF | Next.js Route Handlers | 默认方向 | 可复用、适合 App Router 项目 | Server Actions 仅做薄 wrapper |
| Auth | `AuthPort` + app-owned tenant/team/membership/session ledger + provider-neutral guard + server-only cookie/request bridge + local auth Route Handlers | 已接受边界，本地 guard、session resolver、cookie runtime、`GET /api/auth/session` 和 CSRF-checked `POST /api/auth/logout` 已部分实现，provider 延后 | 避免 provider SDK 泄漏到业务层，先支持可撤销/可过期 session 到 `AuthContext` 的服务端映射，并给未来 protected Route Handler / Server Action 预留 session/logout HTTP 边界 | 登录 provider、公开登录路由、middleware、team switching 和 route-level protection 在后续阶段 2 OpenSpec 比较 |
| 数据库 | PostgreSQL | 已接受，本地-only 已实现 | 多用户、事务、约束、全文检索、pgvector 和审计需求匹配 | 托管服务、连接池、备份和生产凭据延后 |
| ORM/migration | Drizzle ORM migrations | 已接受，本地首个 migration 已生成 | 已在 accepted spec 中选定 | 后续领域表按各自 OpenSpec 增量迁移 |
| Schema validation | Zod | 已接受用于本地数据边界 | TS 生态成熟，适合 API/AI 输出边界 | 后续 API/AI schema 仍需各自 OpenSpec |
| Repository | 项目 repository layer | 已接受，本地原语和部分领域 repository 已实现 | 隔离 SQL/ORM，便于测试和权限 | 每个领域按契约落地 |
| AI provider | `AiProviderPort`，用户指定 DeepSeek (`https://api.deepseek.com`, `deepseek-v4-pro`) 作为首个本地 adapter；AI 复盘 generation orchestrator 和 execution service 已作为本地 consumer；OpenAI Responses API 保留为已研究参考方向 | 已接受边界，本地 adapter、本地 generation consumer 和本地 execution consumer 已实现，公开工作流接入延后 | 结构化输出和失败处理已隔离在 adapter/orchestrator/execution service 后；不把 provider SDK 泄漏到 UI/domain/data | 后续 RAG、重试/队列、公开 API/UI 保存和生产 AI 发布仍需独立 OpenSpec |
| RAG | PostgreSQL + pgvector + 全文检索 | 默认方向 | 先复用权威库和 reviewed snapshot | 外部向量库延后 |
| Source discovery | `SourceDiscoveryPort` + allowlist + review-only finding | 默认方向 | 防止公开来源直接污染权威知识 | 具体搜索/抓取/API provider 延后 |
| Queue | `QueuePort` | 延后决策 | 先确认 AI run、刷新、导出是否需要异步 | 不提前加 Redis/队列服务 |
| Object storage | `ObjectStoragePort` | 延后决策 | 只有转录、截图、导出、文件需要时才引入 | S3-compatible 作为可移植方向 |
| Observability | requestId、runId、脱敏日志、audit event 先行 | 默认方向，provider 延后 | 先定义事件和敏感数据规则 | 监控/错误追踪 provider 延后 |
| Deployment | Docker preview 已接受，生产 provider 延后 | 当前只作预览 | 服务器预览可用，但不是生产架构 | 域名、SSL、备份、监控后再选生产 |
| Docker preview restart | named container + `--restart unless-stopped` | 已接受为预览策略 | 解决服务器重启后容器不自动恢复 | 需 Docker daemon 开机自启 |

## 预留接口

这些接口名是技术边界；已实现状态以“状态”和各阶段说明为准，未标注本地落地的边界不代表已有运行时代码：

| Port / Boundary | 负责 | 不负责 | 首次落地阶段 |
| --- | --- | --- | --- |
| `AuthPort` | 解析 session、映射用户、生成 `AuthContext`；本地 session resolver 已能从 opaque reference hash 映射到现有 guard，本地 cookie runtime 已能生成/清理 session cookie header 并从 request cookie 解析上下文，本地 auth route runtime 已能提供 safe session view 和 CSRF-checked logout | 业务权限最终判断、暴露 provider token、公开登录 UI、provider callback、team switching | 阶段 2 |
| `AuthorizationGuard` | actor/team/role/record ownership 判定 | 前端隐藏按钮 | 阶段 2 |
| `Repository` | CRUD、事务、幂等、审计、分页 | UI 展示、prompt 拼接 | 阶段 3 |
| `AiProviderPort` | LLM 调用、结构化输出、失败状态 | 直接保存权威事实 | 阶段 5，DeepSeek adapter 已本地落地 |
| `RetrievalPort` | reviewed snapshot 检索、引用、过滤 | 审核公开来源、生成答案文案 | 阶段 6 |
| `SourceDiscoveryPort` | 允许来源发现、抓取/搜索结果记录 | 自动发布知识 | 阶段 7 |
| `EvaluationRunner` | 样例集、prompt/retrieval 版本对比 | 代替人工审核 | 阶段 8 |
| `QueuePort` | 异步任务、重试、死信、幂等 | 同步请求里的业务规则 | 阶段 9 |
| `ObjectStoragePort` | 文件、转录、截图、导出 | 结构化业务记录权威存储 | 阶段 9 |
| `ObservabilityPort` | 脱敏日志、metrics、traces、error events | 保存完整敏感 payload | 阶段 9 |
| `ExternalIntegrationPort` | 抖音/电商/订单/私信官方 API 边界 | 违规抓取或绕过登录 | 阶段 9 |

## 阶段总览

| 阶段 | 技术主题 | 主要技术选择 | 达到的效果 | 禁止提前 |
| --- | --- | --- | --- | --- |
| 0 | 静态工作台和治理 | Next.js App Router、Tailwind、OpenSpec、Docker 预览 | 验证工作流和页面信息架构，不处理真实数据 | 保存真实业务数据、真实 AI 调用 |
| 1 | 契约和领域模型 | `docs/contracts/*`、OpenSpec specs、TypeScript domain types | 固定输入输出、状态机、错误、权限和审计语义 | 从 UI 状态反推数据库表 |
| 2 | 认证、团队和租户 | `AuthPort`、`auth-team-tenant`、server-side guard、app-owned session ledger、server-only cookie/request bridge、local auth Route Handlers、provider 待选 | 本地可解析 app-owned auth context、app-owned session reference、request cookie、安全 session view 和 CSRF-checked logout，并执行 permission/scope guard；后续允许设计受保护 API/Server Action | 只靠前端隐藏控件做权限、把本地 guard/session/cookie/route runtime 当完整登录 |
| 3 | 数据基础 | PostgreSQL、Drizzle migrations、Zod schema、repository layer | 本地支持 schema、migration、审计、幂等和 repository smoke check；后续支持可靠 CRUD、草稿和迁移 | UI 直连 DB、跳过 tenant/team、把本地 DB 当生产 DB |
| 4 | 核心运营持久化 | Route Handlers、薄 Server Action wrapper、domain services | 产品库、场次、知识生命周期、话术资产和下场任务可真实保存、审核和跟进 | 业务规则塞进页面组件 |
| 5 | AI 复盘 MVP | `AiProviderPort`、DeepSeek/OpenAI provider adapter gate、结构化输出、run audit | 生成可审核复盘建议，不自动改事实或任务 | 模型输出直接发布为事实 |
| 6 | RAG 和 Q&A 第一阶段 | PostgreSQL + pgvector、全文检索、`RetrievalPort`、reviewed snapshot | 只基于已审核知识回答并展示来源 | 联网搜索直接回答或入库 |
| 7 | 来源发现和刷新 | `SourceDiscoveryPort`、allowlist、review-only finding、刷新任务 | 发现缺失/过期知识，但先进入审核 | 未授权抓取、绕过条款 |
| 8 | 反馈学习和评测 | feedback tables、EvaluationRunner、prompt/schema versioning | 用采纳/编辑/拒绝改进质量而不是自修改 | 反馈直接改权威知识 |
| 9 | 生产化和外部集成 | 队列、对象存储、监控、备份、官方平台 API、部署 provider 待选 | 支撑真实团队使用、恢复、审计和集成 | 无备份/监控/脱敏就上真实生产 |

## 阶段 0：静态工作台和治理

当前状态：已在进行中。

技术：

- pnpm workspace。
- Next.js App Router、TypeScript、React。
- Tailwind CSS、shadcn/ui-compatible primitives、lucide-react、motion。
- OpenSpec 作为需求、设计、规格和任务入口。
- Docker 生产镜像和 `operation-web-preview` 公网预览。
- 公网预览容器使用稳定名称和 restart policy，避免服务器重启后需要人工重新启动容器。

效果：

- 用静态数据验证中文运营工作台的信息结构、导航、状态和视觉密度。
- 不保存真实业务数据，不接 AI，不接数据库。
- 为后续契约和真实实现提供用户工作流样板。

公网预览运行约定：

```bash
pnpm docker:build
docker rm -f operation-web-preview || true
docker run -d \
  --name operation-web-preview \
  --restart unless-stopped \
  -p 3000:3000 \
  operation-web:latest
```

该策略依赖服务器上的 Docker daemon 自身开机自启。正式生产部署仍需在阶段 9 定义域名、SSL、
备份、监控、日志脱敏、发布和回滚策略。

验证：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 页面变更时用 Playwright 检查桌面/移动和控制台。
- 影响预览时构建 Docker 并检查公网关键路由。
- 公网预览容器应显示 restart policy，且 `docker ps` 能看到 `operation-web-preview`。

## 阶段 1：契约和领域模型

当前状态：正在补齐。

技术：

- `docs/contracts/` 保存未来 API、Server Action、Repository、AI/RAG、反馈和集成契约。
- OpenSpec specs 固化每个契约是后续实现前置条件。
- TypeScript domain type 后续从契约落地到 `src/lib` 或 domain modules。

效果：

- 明确每个工作流的领域对象、输入输出、状态机、错误、权限、敏感数据和验证。
- 避免后续直接从页面状态或 prompt 字符串推导数据库结构。

已建契约：

- `racket-product-library`
- `session-capture`
- `knowledge-lifecycle`
- `ai-review-run`
- `qa-agent-answer`
- `auth-team-tenant`
- `data-foundation`
- `talk-track-asset`
- `next-session-task`

下一批契约：

- 数据基础 runtime work 前如发现新跨领域边界，再按 OpenSpec 补充对应契约。

验证：

- `openspec validate <change>`
- `openspec validate --all`
- Markdown 未完成标记、行尾空格和链接检查。

## 阶段 2：认证、团队和租户

状态：本地-only 部分实现。`implement-auth-guard-foundation` 已加入 provider-neutral
`AuthContext` 解析、role-permission policy、server-side authorization guard、safe auth
errors、`DataAccessContext` 转换和本地 PostgreSQL 回滚式 smoke check；`implement-auth-session-runtime`
已加入 app-owned `auth_sessions` ledger、opaque session reference hash、server-only session
resolver、expired/revoked/invalidated denial、脱敏和 `auth:session-check` 回滚式 smoke check。
`implement-auth-cookie-runtime` 已加入 server-only cookie issue/clear header、request cookie
resolver、logout invalidation、脱敏和 `auth:cookie-check` 回滚式 smoke check。
`implement-auth-route-runtime` 已加入 local-only `GET /api/auth/session` safe JSON view、
CSRF-checked `POST /api/auth/logout`、no-store 响应、脱敏和 `auth:route-check` 回滚式 smoke check。
登录 provider、middleware、公开登录路由、邀请、团队管理 UI 和生产 auth provider 仍未实现，
必须单独 OpenSpec。

技术选择：

- 认证 provider 尚未确定，阶段 2 OpenSpec 必须比较后再选。
- 已接受边界：`AuthPort`、`AuthContext`、`AuthorizationGuard`、应用自有 user/tenant/team/
  membership/role/session/audit 记录；当前本地 guard 已从应用自有 membership 记录生成 auth
  context，本地 session resolver 已从 hashed session reference 映射到同一 guard，本地 cookie
  runtime 已能把 request cookie 映射到 session resolver 并执行 logout invalidation，本地 auth
  route runtime 已能把 request cookie 映射为 safe session JSON view 并执行带 CSRF header 的 logout。
- 默认方向：优先评估 Next.js 兼容、能和 PostgreSQL 应用记录协作的 server-side session 或
  adapter 方案；托管 provider 必须明确数据边界、成本、退出路径和中国网络可用性。
- 必须避免 UI、domain、repository、AI 或 integration 层直接依赖 provider SDK。
- PostgreSQL 保存用户、团队、角色、成员关系、应用 session ledger、邀请、审计和最小 profile。
- 所有 protected query/mutation 必须服务端校验 `tenantId`、`teamId`、actor 和 role。

待选 provider 方向：

- 自托管/数据库会话方案：控制强，运维责任更大。
- 托管身份方案：接入快，供应商绑定、费用和数据边界要评估。

进入条件：

- 已有 `auth-team-tenant` 契约。
- 已确认真实数据需要保存。
- OpenSpec design 比较 provider、数据流、失败模式、退出路径和安全影响。
- 后续 runtime 实现必须先读取 `docs/contracts/auth-team-tenant.md`，并在 provider、session、
  membership、role、tenant/team ownership 或授权假设变化时同步更新契约和 OpenSpec。

效果：

- 当前支持本地解析 active user/tenant/team membership、角色权限、target scope 和 request cookie，
  并在失败时返回安全授权错误；当前也支持 local-only session view 和 CSRF-checked logout Route Handler。
- 后续 provider runtime 落地后，运营、主播、审核人员和管理员能被真实登录会话区分。
- 不同团队数据不可互相访问。
- 后续产品库、场次、知识、复盘和任务都能带租户边界。

验证：

- 当前已验证 active member allowed、missing permission denied、inactive membership denied、
  cross-team target denied、active/expired/revoked/invalidated session、missing/invalid cookie、
  logout invalidation、clear-cookie、safe session view、missing scope、logout CSRF header、
  no-store response、redaction 和 transaction rollback。
- 后续 provider runtime 增加未登录、过期 session、callback 失败和 logout 验证。
- 跨 team/tenant 访问失败。
- 角色权限覆盖创建、编辑、审核、归档。
- 日志不泄露 token、cookie、客户数据或内部业务数据。

## 阶段 3：数据基础

状态：本地-only 部分实现。`implement-data-foundation-runtime` 已加入 PostgreSQL/Drizzle
配置、首个 migration、Zod 环境和输入校验、server-only 数据库连接、数据访问上下文、
审计/幂等 repository 原语、本地 PostgreSQL compose profile 和回滚式 smoke check。后续
workflow-specific schema/repository/API 仍必须单独 OpenSpec。

技术选择：

- PostgreSQL 作为权威关系型数据源。
- Drizzle ORM 管理 schema 和 migration。
- Zod 校验用于环境、repository input、数据访问上下文和后续 API/AI 边界。
- Repository layer 隔离 SQL/ORM 细节。
- 受保护业务表默认包含 tenant/team、审计时间、actor、软删除或归档策略；当前本地基础表
  已覆盖 tenant/team/user/membership、audit events 和 idempotency records。
- 约束、唯一性、事务和索引是数据模型的一部分，不能只靠前端或 domain 检查。
- Row Level Security 可作为 defense-in-depth 评估，但不能替代应用层 server-side guard 和
  repository tenant/team 过滤。

进入条件：

- 已有 `auth-team-tenant` 契约和 `data-foundation` 契约。
- 已确认要保存的首个 workflow，例如产品库、场次、知识或 auth/team core。
- OpenSpec design 明确 schema、migration、validation、repository、transaction、idempotency、
  audit、tenant/team isolation、敏感日志和 rollback。
- 后续 runtime 实现必须先读取 `docs/contracts/data-foundation.md`，并在 schema、migration、
  validation、repository、audit、RLS、idempotency 或长文本假设变化时同步更新契约和 OpenSpec。

预留点：

- 对象存储只在转录、文件、截图或导出需求明确后引入。
- 缓存只在实际性能问题出现后引入，不提前加 Redis。
- 多库、分库、外部向量库先不做。

效果：

- 当前支持本地 schema/migration、基础 identity/ownership 表、审计/幂等写入和 repository
  smoke check。
- 后续在 auth runtime 和领域表落地后，支持真实草稿保存、列表查询、详情读取、审核和审计。
- 后续 AI run 和反馈可以引用稳定 record ID。

验证：

- 当前已验证本地 migration 可应用、schema generate 无变化、repository smoke check 可回滚。
- 后续领域 repository 增加单元/集成测试。
- tenant/team 查询隔离。
- 长文本、空字段、重复型号、别名冲突、状态流转测试。

## 阶段 4：核心运营持久化

状态：本地-only 部分实现。`implement-racket-product-persistence` 已加入球拍产品和别名
Drizzle schema/migration、server-only repository、Zod 输入校验、tenant/team scope、权限检查、
重复型号和别名冲突检测、下游 readiness 计算和本地 PostgreSQL 回滚式 smoke check。
`implement-racket-source-review-publish` 已加入产品来源、审核决策和发布门禁 schema/migration、
server-only repository、状态流转、来源冲突检测、review queue 和本地 PostgreSQL 回滚式
smoke check。`implement-session-capture-persistence` 已加入直播场次、主播职责、商品顺序、
笔记、客户问题和购买异议 schema/migration、server-only repository、草稿版本冲突、提交
readiness、重复标题日期检测、tenant/team scope 和本地 PostgreSQL 回滚式 smoke check。
`implement-session-capture-api-runtime` 已加入场次 create/list/detail/autosave/submit local-only
受保护 Route Handler、mutation CSRF、safe JSON、no-store 响应、tenant/team scope 和本地
PostgreSQL 回滚式 smoke check。
`implement-knowledge-lifecycle-persistence` 已加入知识来源、抽取 claim、团队知识笔记、
审核决策、发布版本和冲突记录 schema/migration、server-only repository、来源去重、审核状态流转、
冲突阻断、发布 readiness、tenant/team scope 和本地 PostgreSQL 回滚式 smoke check。
`implement-ai-review-run-persistence` 已加入 AI 复盘 run、输入快照、知识快照、prompt 版本元数据、
provider 调用元数据、结构化输出、输出区块、校验结果、人工审核决定、反馈信号和下游草案引用
schema/migration、server-only repository、敏感输入阻断、过期/冲突知识阻断、prompt 版本门禁、
validation gate、人工审核下游门禁、tenant/team scope 和本地 PostgreSQL 回滚式 smoke check。
`implement-talk-track-asset-persistence` 已加入话术资产、版本、场景、区块、异议回应、
来源引用、审核决策、AI/人工候选和复用反馈 schema/migration、server-only repository、
AI 候选审核阻断、来源发布门禁、重复场景阻断、readiness、tenant/team scope 和本地 PostgreSQL
回滚式 smoke check。
`implement-next-session-task-persistence` 已加入下场任务、来源证据、负责人、检查项、依赖、
审核结果和反馈信号 schema/migration、server-only repository、权限检查、负责人活跃校验、
状态流转、重复检测、敏感来源阻断、readiness、tenant/team scope 和本地 PostgreSQL 回滚式
smoke check。
除 local-only `GET /api/rackets/products` / `POST /api/rackets/products` 产品 create/list 和
local-only `GET /api/sessions/captures` / `POST /api/sessions/captures` /
`GET /api/sessions/captures/[sessionId]` /
`PATCH /api/sessions/captures/[sessionId]/draft` /
`POST /api/sessions/captures/[sessionId]/submit` 场次采集工作流
受保护 Route Handler 外，公开 UI、其他业务 Route Handler、Server Action、AI/RAG snapshot、
公开来源发现/导入 provider、转录上传和生产持久化仍未实现。

技术选择：

- Next.js Route Handlers 作为可复用 HTTP/API 边界。
- Server Actions 只作为薄 UI mutation wrapper，不能承载业务规则。
- Domain services 处理球拍、场次、知识、话术和任务业务流程。
- Repository 处理查询、事务、幂等键和审计。

顺序：

1. 球拍产品库持久化/API：产品、别名、来源、审核决策和发布门禁 repository 已本地部分实现，
   产品 create/list 受保护 Route Handler 已本地部分实现；后续补编辑、来源/审核/发布 API、
   版本化 snapshot、Server Action 和 UI 保存。
2. 直播场次保存和草稿恢复 repository 与 create/list/detail/autosave/submit 受保护 Route Handler
   已本地部分实现，后续补浏览器 UI 保存和 Server Action wrapper 前需先解决真实登录会话、
   表单状态、冲突恢复和用户可操作保存体验。
3. 知识来源登记、审核、发布和冲突 repository 已本地部分实现；后续补公开 API/Server Action、
   UI 保存、刷新任务、web discovery 和 RAG snapshot。
4. AI 复盘 run 持久化与生成：run、输入快照、知识快照、prompt/provider 元数据、输出、校验、人工审核、
   反馈和下游引用 repository 已本地部分实现；DeepSeek provider adapter、server-only generation
   orchestrator 和 server-only execution service 已本地部分实现；后续补 RAG snapshot、公开 API/Server Action、
   UI 保存、队列和生产发布。
5. 话术资产持久化：资产、版本、场景、区块、来源引用、AI 候选、审核发布和复用反馈
   repository 已本地部分实现；后续补公开 API/Server Action/UI 保存、AI 复盘下游候选、
   Q&A/RAG grounding、团队搜索和短视频 hook 复用前必须继续从 `docs/contracts/talk-track-asset.md` 开始。
6. 下场任务持久化：任务、来源证据、负责人、检查项、依赖、审核结果和反馈信号 repository
   已本地部分实现；后续补公开 API/Server Action/UI 保存、AI 复盘下游候选、通知、日历、
   导出和团队看板前必须继续从 `docs/contracts/next-session-task.md` 开始。

效果：

- 静态工作台变成可保存、可审核、可恢复的真实运营工具。
- AI 前置输入变得稳定、脱敏且可追溯。

验证：

- API/Server Action 集成测试。
- 浏览器 empty/loading/error/saved/disabled 状态。
- 移动端长文本和表格密度。
- 公网预览关键路由。

## 阶段 5：AI 复盘 MVP

状态：契约、本地 run ledger、server-only DeepSeek `AiProviderPort` adapter、server-only
AI review generation orchestrator 和 server-only AI review execution service 已部分实现；RAG、队列、
公开 API/Server Action、UI 保存和生产 AI 发布仍未实现。

技术选择：

- `AiProviderPort` 隔离 provider。
- 用户已指定 DeepSeek API、base URL `https://api.deepseek.com` 和模型 `deepseek-v4-pro`；
  当前已本地实现 DeepSeek chat-completions adapter、环境变量密钥解析、JSON output schema
  validation、timeout / rate limit / auth / unavailable / malformed output / partial output 归一化错误、
  fake-fetch verifier 和可选 live smoke gate。
- 当前已本地实现 AI review generation orchestrator：接收已脱敏输入快照和已审核知识快照，经
  `AiProviderPort` 生成结构化复盘建议，执行 prompt fingerprint、output schema validation、
  source grounding / sensitive / stale / conflict / long input validation，并用 fake-provider 验证。
- 当前已本地实现 AI review execution service：加载已准备的 run ledger，使用 repository state gate
  启动 run，调用 generation orchestrator，记录 provider metadata、结构化输出、validation results，
  并只在无 failed/blocked 校验时标记 `review_ready`；provider/validation 失败会写入安全失败状态。
- 后续把 generation 接入公开 API、浏览器保存、真实输入快照来源、RAG、队列或生产发布前，仍必须单独
  OpenSpec 定义认证、数据最小化、评测、审核、重试/降级和回滚。
- OpenAI Responses API 保留为已研究参考方向；任何 provider 都不得在 UI 或 domain 里直接绑定 SDK。
- 结构化输出 schema 必须先校验再展示或保存。
- Prompt 版本、模型、provider、input snapshot、knowledge snapshot、validation results 和 human
  review decision 必须可审计。
- AI 复盘先处理已保存或已确认的输入 snapshot；不把长原始记录、客户个人信息或完整内部资料
  无差别送给 provider。

效果：

- 运营可以从一场直播生成可审核复盘建议。
- 建议覆盖直播摘要、商品讲解诊断、问题聚类、异议模式、话术候选、短视频选题和下场任务草案。
- AI 输出不会覆盖人工事实，不会自动发布知识。

验证：

- 真实样例输入、空输入、长输入。
- malformed output、provider timeout、rate limit、refusal、partial output。
- schema 校验、来源引用、敏感数据检查。
- `pnpm ai-review:generation-check` 验证本地 orchestrator 成功、输入门禁、provider 错误映射、
  source-grounding warning、sensitive output block 和 prompt/secret 脱敏。
- `pnpm ai-review:execution-check` 验证本地 execution service 成功、review-ready persistence、
  validation-blocked output、provider failure state、cross-team isolation、transaction rollback 和
  prompt/secret 脱敏。
- 接受、编辑、拒绝、重生成和反馈记录。

## 阶段 6：RAG 和 Q&A 第一阶段

状态：未实现。

技术选择：

- PostgreSQL + pgvector 作为 RAG MVP。
- 结合全文检索、metadata filter、reviewed snapshot 和向量相似度。
- `RetrievalPort` 隔离检索实现。
- 只检索 `published`、未过期、未冲突、同 tenant/team 可见知识。
- 检索输入使用最小必要字段；答案展示引用、版本、不确定性和知识不足状态。

效果：

- Q&A Agent 只基于已审核知识和团队已审核经验回答。
- 答案展示来源、版本、不确定性和人工/AI 区分。
- 知识不足时明确说明不足，而不是编造。
- 运行时实现必须先读取 `docs/contracts/qa-agent-answer.md`，并在检索 snapshot、回答状态、
  反馈、缺失知识或授权假设变化时同步更新契约和 OpenSpec。

验证：

- 代表性运营问题集。
- 检索召回、引用正确性、来源过期、来源冲突。
- 空问题、恶意输入、混合中英文型号。
- prompt/model/retrieval 变化前后评测对比。

## 阶段 7：来源发现和刷新

状态：未实现。

技术选择：

- `SourceDiscoveryPort` 隔离公开来源搜索、抓取或人工登记。
- 只允许官方、授权、标准组织、平台文档、专业来源或用户批准来源进入登记。
- Web discovery 只能生成 review-only finding。
- 刷新任务可先手动触发；定时/队列在阶段 9 评估。
- 来源发现必须记录来源类型、抓取/查询时间、使用许可判断、信任等级、字段差异和审核状态。

效果：

- 系统能发现缺失知识、过期来源和冲突来源。
- 审核通过前不影响 AI 答案或复盘依据。

验证：

- 允许来源、禁止来源、失效链接、内容变化、冲突字段、重复来源。
- robots/条款/权限不清时阻断。
- 日志不包含敏感业务数据或完整抓取内容。

## 阶段 8：反馈学习和评测

状态：未实现。

技术选择：

- Feedback records 关联 run、section、knowledge snapshot、prompt version、reviewer 和 downstream use。
- `EvaluationRunner` 管理代表性运营问题、复盘样例和失败样例。
- Prompt、schema、retrieval、chunk、ranking、model 变化必须版本化。

效果：

- 采纳、编辑、拒绝、重生成、知识缺失和下游复用能变成质量信号。
- 系统能判断是知识不足、prompt 不好、检索不准、模型输出差，还是用户偏好问题。
- 不做隐藏自学习，不让 AI 自己修改权威知识。

验证：

- 反馈写入和权限。
- 反馈到评测集/知识 review priority 的路由。
- prompt 或检索规则变更前后评测。
- 回滚到旧 prompt/schema/retrieval 策略。

## 阶段 9：生产化和外部集成

状态：未实现，最后推进。

技术选择：

- 队列 provider 未定；仅当 AI run、刷新任务、转录解析或导出确实需要异步处理时引入。
- 对象存储 provider 未定；仅当文件、转录、截图、导出或大文本需要持久保存时引入。
- 生产部署 provider 未定；当前 Docker 公网预览不是最终生产架构。
- 观测方案未定；先定义日志脱敏、request ID、run ID、错误分类和审计，再选工具。
- 外部平台只走官方 API、用户授权和明确数据范围，不做违规抓取或登录绕过。
- 生产化前必须明确 Docker 预览和正式生产的差异：预览可以用 restart policy 自恢复；生产还需要
  域名、SSL、备份恢复、监控告警、发布/回滚和安全更新流程。

效果：

- 支撑真实团队稳定使用、失败恢复、审计追踪、备份和外部数据接入。
- 外部平台失败不会破坏核心产品库、场次、知识和 AI review 数据。

验证：

- 队列重试、死信、幂等。
- 对象存储上传、删除、权限、生命周期。
- 备份恢复演练。
- 监控告警、脱敏日志、错误追踪。
- 第三方 API 限流、授权失效、权限不足、字段变化。

## Provider 和依赖决策门

引入以下任一技术前，必须创建或更新 OpenSpec design：

- Auth provider。
- PostgreSQL 托管服务。
- 对象存储。
- 队列/定时任务。
- AI provider 或 AI SDK。
- 外部向量数据库。
- Web/source discovery 服务。
- 分析、监控、日志、错误追踪。
- 部署平台和域名/SSL。
- 抖音、电商、订单、私信、支付或其他外部平台集成。

设计必须记录：

- 为什么现在需要。
- 官方/专业来源和 source reliability。
- 至少一个替代方案。
- 数据流和 runtime boundary。
- 租户、权限、敏感数据和日志策略。
- 失败模式、降级和回滚路径。
- 成本、维护、许可证或供应商绑定风险。
- 验证命令和成功标准。

## 后续开发遵循方式

未来 agent 在开始技术实现前必须检查：

1. 当前需求属于哪个阶段。
2. 前置契约是否已存在且仍正确。
3. 该阶段技术选择是否已接受，还是仍需 OpenSpec 比较。
4. 是否会跨越 UI、domain、data、AI、integration 边界。
5. 是否会处理受保护数据、客户数据、prompt、AI 输出或外部来源。
6. 完成后能给用户或工程带来什么可验证效果。

如果答案不清楚，先补 OpenSpec、契约或本路线，再写代码。
