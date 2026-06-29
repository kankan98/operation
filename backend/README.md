# E-commerce Price Monitor Backend

电商价格监控系统后端服务 - 提供产品管理、价格跟踪和报警功能。

## 功能特性

- 📦 产品管理 - 添加、查询、更新和删除电商产品
- 💰 价格监控 - 跟踪产品价格变化
- 🔔 智能报警 - 价格变动、库存和排名变化提醒
- 🤖 AI 对话助手 - 基于 Claude 的智能问答和数据分析
- 🗄️ SQLite 数据库 - 轻量级本地存储
- 📊 RESTful API - 标准化接口设计
- ✅ 完整测试 - 单元测试和集成测试覆盖

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite + Drizzle ORM
- **语言**: TypeScript
- **日志**: Pino
- **测试**: Vitest + Supertest
- **开发工具**: tsx (TypeScript 执行器)

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 运行数据库迁移
npm run db:migrate
```

### 开发

```bash
# 启动开发服务器（热重载）
npm run dev

# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 生成数据库迁移
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

### 生产构建

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
backend/
├── src/
│   ├── config/         # 配置管理
│   ├── db/             # 数据库配置和 schema
│   ├── middleware/     # Express 中间件
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑层
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── app.ts          # Express 应用配置
│   └── index.ts        # 应用入口
├── tests/              # 测试文件
├── data/               # SQLite 数据库文件
├── drizzle/            # 数据库迁移文件
└── drizzle.config.ts   # Drizzle ORM 配置
```

## API 文档

### 产品相关

#### 创建产品
```http
POST /api/products
Content-Type: application/json

{
  "platform": "amazon",
  "productUrl": "https://amazon.com/dp/B08N5WRWNW",
  "asin": "B08N5WRWNW",
  "title": "Product Name",
  "currency": "USD",
  "isMonitoring": true,
  "checkInterval": 24
}
```

#### 查询产品列表
```http
GET /api/products?platform=amazon&monitoring=true&page=1&limit=20
```

#### 获取产品详情
```http
GET /api/products/:id
```

#### 更新产品
```http
PATCH /api/products/:id
Content-Type: application/json

{
  "title": "Updated Name",
  "currentPrice": 99.99
}
```

#### 删除产品
```http
DELETE /api/products/:id
```

### 报警相关

#### 创建报警
```http
POST /api/alerts
Content-Type: application/json

{
  "productId": "uuid",
  "alertType": "price_drop",
  "severity": "warning",
  "title": "Price dropped by 20%"
}
```

#### 查询报警列表
```http
GET /api/alerts?productId=uuid&severity=critical&unreadOnly=true
```

#### 获取报警详情
```http
GET /api/alerts/:id
```

#### 标记报警为已读
```http
PATCH /api/alerts/:id/read
```

#### 标记报警为已归档
```http
PATCH /api/alerts/:id/archive
```

#### 删除报警
```http
DELETE /api/alerts/:id
```

### 健康检查
```http
GET /health
```

### Chat API (AI 对话助手)

#### 创建会话
```http
POST /api/chat/sessions
Content-Type: application/json

{
  "title": "Product Analysis Session"  // 可选，会自动生成
}
```

#### 获取会话列表
```http
GET /api/chat/sessions?page=1&limit=20
```

#### 获取会话详情
```http
GET /api/chat/sessions/:id
```

#### 更新会话标题
```http
PATCH /api/chat/sessions/:id
Content-Type: application/json

{
  "title": "Updated Session Title"
}
```

#### 删除会话
```http
DELETE /api/chat/sessions/:id
```

#### 获取会话消息历史
```http
GET /api/chat/sessions/:id/messages?page=1&limit=50
```

#### 发送消息（流式响应）
```http
GET /api/chat/sessions/:id/stream?content=你好

Response: text/event-stream (Server-Sent Events)
```

**SSE 连接生命周期管理**（2026-06-21 更新）:

- **心跳机制**: 每 15 秒发送一次心跳注释 (`: heartbeat\n\n`)，防止代理超时
- **连接超时**: 最长 10 分钟后自动关闭
- **客户端断开检测**: 监听 `req.on('close')` 立即中止流
- **资源清理**: 连接关闭时自动清理定时器和 AbortController

**请求去重**（2026-06-21 更新）:

- **前端防护**: 500ms 内防止重复提交
- **后端防护**: 5 秒内拒绝相同内容（SHA-256 哈希）
- **响应码**: 429 Too Many Requests

**SSE 事件格式**:

```
data: {"type":"message_start","messageId":"...","timestamp":...}

data: {"type":"content_delta","delta":"你好","timestamp":...}

data: {"type":"message_complete","messageId":"...","timestamp":...}
```
```

**响应格式（Server-Sent Events）**:
```
data: {"type":"message_start","message_id":"msg_123","timestamp":1234567890}

data: {"type":"status","status":"thinking"}

data: {"type":"text_delta","text":"让我"}

data: {"type":"text_delta","text":"帮您"}

data: {"type":"status","status":"tool_calling"}

data: {"type":"tool_call_start","tool_call":{"id":"call_1","name":"searchProducts"}}

data: {"type":"tool_call_end","tool_call":{"id":"call_1","name":"searchProducts","input":{"platform":"amazon","maxPrice":100}}}

data: {"type":"tool_result","tool_result":{"toolCallId":"call_1","output":[...],"isError":false}}

data: {"type":"status","status":"writing"}

data: {"type":"text_delta","text":"找到了"}

data: {"type":"usage","usage":{"input_tokens":150,"output_tokens":80}}

data: {"type":"message_done","message_id":"msg_123"}
```

**SSE 事件类型**:
- `message_start` - 消息开始（包含 message_id 和 timestamp）
- `status` - Agent 状态变化（thinking/tool_calling/writing）
- `text_delta` - 文本增量更新
- `tool_call_start` - 工具调用开始（包含工具 ID 和名称）
- `tool_call_end` - 工具调用完成（包含完整参数）
- `tool_result` - 工具执行结果
- `usage` - Token 使用统计
- `message_done` - 消息完成
- `error` - 错误信息

#### 删除消息
```http
DELETE /api/chat/sessions/:id/messages/:messageId
```

#### 重新生成回复
```http
POST /api/chat/sessions/:id/messages/:messageId/regenerate
```

**响应**:
```json
{
  "stream_url": "/api/chat/sessions/:id/stream?content=..."
}
```

前端需要使用返回的 `stream_url` 重新建立 SSE 连接来接收新的流式响应。

**AI Agent 可用工具**:
- `searchProducts` - 搜索产品（支持关键词、平台、价格范围筛选）
- `getProductDetails` - 获取产品详情（含价格历史）
- `analyzePriceTrend` - 分析价格趋势（最高/最低/平均价格）
- `createAlert` - 创建价格警报规则
- `getAlertsList` - 获取警报列表
- `addProductMonitoring` - 添加产品监控
- `getCompetitorAnalysis` - 获取竞品分析
- `getMarketInsights` - 获取市场洞察
- `getOpportunityResearchStatus` - 只读获取单个商品的机会研究状态、优先级、标签、备注摘要和 caveats
- `listShortlistedOpportunities` - 只读列出短名单候选商品，支持按研究状态和标签过滤
- `queryDatabase` - 执行安全的数据库查询
- `generateReport` - 生成每日或产品报告

## 环境变量

查看 `.env.example` 了解所有可配置项：

- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务器端口 (默认: 3001)
- `DATABASE_PATH` - SQLite 数据库文件路径
- `LOG_LEVEL` - 日志级别 (info/debug/warn/error)
- `CORS_ORIGIN` - CORS 允许的源
- `AI_PROVIDER` - AI 提供商 (anthropic/openai)
- `ANTHROPIC_API_KEY` - Anthropic API 密钥（使用 Claude 时必需）
- `ANTHROPIC_MODEL` - Claude 模型名称（默认: claude-opus-4-8）
- `ANTHROPIC_BASE_URL` - Anthropic API 基础 URL（可选）
- `OPENAI_API_KEY` - OpenAI API 密钥（使用 OpenAI 时必需）
- `OPENAI_MODEL` - OpenAI 模型名称（默认: gpt-4）
- `OPENAI_BASE_URL` - OpenAI API 基础 URL（可选）

### Product Data Acquisition 配置

商品数据采集采用 provider chain：优先使用合规 API 或第三方数据源，浏览器采集只作为 fallback。推荐 provider 顺序是 `rainforest,amazon-browser,ebay-browse`。`rainforest` 用于 Rainforest API 采集 Amazon 当前商品数据；`amazon-browser` 是 Playwright 浏览器 fallback；`ebay-browse` 使用官方 eBay Browse API 采集 eBay 当前 listing 数据。

- `ACQUISITION_PROVIDER_ORDER` - provider 执行顺序，逗号分隔，默认 `rainforest,amazon-browser,ebay-browse`
- `ACQUISITION_BROWSER_FALLBACK_ENABLED` - 是否启用 Playwright 浏览器 fallback
- `ACQUISITION_MAX_ATTEMPTS` - 单个采集任务最大尝试次数
- `ACQUISITION_BASE_BACKOFF_MS` - 首次失败后的基础退避时间
- `ACQUISITION_MAX_BACKOFF_MS` - 最大退避时间
- `ACQUISITION_JOB_LEASE_MS` - running job 的租约时间，过期后允许恢复处理
- `ACQUISITION_CACHE_FRESHNESS_MS` - live provider 失败时允许使用缓存数据的最长新鲜度
- `ACQUISITION_CAPTURE_DIAGNOSTICS` - 是否记录非敏感诊断信息
- `ACQUISITION_PROCESS_LIMIT` - scheduler 每次最多处理的 due jobs 数量
- `RAINFOREST_API_KEY` - Rainforest API key；未配置时 `rainforest` 返回 `provider_unavailable` 并让路给下一个 provider
- `RAINFOREST_MARKETPLACE` - Rainforest marketplace，默认 `amazon.com`
- `RAINFOREST_TIMEOUT_MS` - Rainforest 请求超时时间
- `RAINFOREST_CAPTURE_DIAGNOSTICS` - 是否记录 Rainforest 安全诊断信息
- `EBAY_CLIENT_ID` - eBay developer application client ID
- `EBAY_CLIENT_SECRET` - eBay developer application client secret
- `EBAY_MARKETPLACE` - eBay marketplace ID，默认 `EBAY_US`
- `EBAY_API_BASE_URL` - eBay Browse API base URL，默认 `https://api.ebay.com`
- `EBAY_OAUTH_BASE_URL` - eBay OAuth base URL，默认 `https://api.ebay.com`
- `EBAY_TIMEOUT_MS` - eBay OAuth 和 Browse API 请求超时时间
- `EBAY_CAPTURE_DIAGNOSTICS` - 是否记录 eBay 安全诊断信息
- `KEEPA_MARKET_SIGNAL_ENABLED` - 是否启用 Keepa 市场趋势信号 provider
- `KEEPA_API_KEY` - Keepa API key；未配置时市场趋势刷新返回 `provider_unavailable` 和 `missing_credentials`
- `KEEPA_API_BASE_URL` - Keepa API base URL，默认 `https://api.keepa.com`
- `KEEPA_DOMAIN` - Keepa domain id，默认 `1` 表示 Amazon US
- `KEEPA_MARKETPLACE` - 展示和诊断用 marketplace，默认 `amazon.com`
- `KEEPA_TIMEOUT_MS` - Keepa 请求超时时间
- `KEEPA_REFRESH_WINDOW_DAYS` - Keepa 历史趋势归一化窗口
- `KEEPA_MARKET_SIGNAL_FRESHNESS_MS` - 机会评分中 market signal freshness 的有效窗口
- `KEEPA_CAPTURE_DIAGNOSTICS` - 是否记录 Keepa 安全诊断信息

浏览器 fallback 会检测 robot check、captcha、blocked、geo restricted、not found、selector drift、price missing 等状态。遇到验证码或 robot check 时系统会记录结构化失败并退避/切换来源，不会尝试自动处理验证码。

### Acquisition Queue Operations

采集执行层默认使用 SQLite job/attempt 表，适合本地开发和单进程部署；需要多 worker 或更高吞吐时，可显式启用 BullMQ/Redis。无论使用哪种队列后端，`scrape_jobs` 和 `scrape_attempts` 仍是业务观测来源，Redis 只负责编排执行。

关键配置：

- `ACQUISITION_QUEUE_BACKEND` - 队列后端，默认 `sqlite`；设置为 `bullmq` 时必须配置 Redis。
- `REDIS_URL` / `ACQUISITION_REDIS_URL` - BullMQ Redis 连接地址。
- `ACQUISITION_WORKER_CONCURRENCY` - worker 并发上限。
- `ACQUISITION_WORKER_HEARTBEAT_INTERVAL_MS` - worker heartbeat 写入间隔。
- `ACQUISITION_STALE_WORKER_THRESHOLD_MS` - worker 多久未 heartbeat 视为 stale。
- `ACQUISITION_MANUAL_REFRESH_THROTTLE_MS` - 手动刷新节流窗口，避免重复 provider work。
- `ACQUISITION_PROVIDER_DEFAULT_CONCURRENCY` - provider 默认并发上限。
- `ACQUISITION_PROVIDER_RATE_LIMIT_RESET_MS` - provider rate-limit 默认恢复窗口。

BullMQ 启用示例：

```bash
ACQUISITION_QUEUE_BACKEND=bullmq
REDIS_URL=redis://localhost:6379
ACQUISITION_WORKER_CONCURRENCY=4
```

队列运维 API：

```http
GET /api/scraper/queue/health?platform=amazon&provider=rainforest
GET /api/scraper/queue/workers?backend=sqlite&status=idle
GET /api/scraper/queue/providers/status?platform=amazon
GET /api/scraper/product/:productId/job-diagnostics
POST /api/scraper/jobs/:jobId/retry
POST /api/scraper/jobs/:jobId/cancel
```

`retry` 只用于 failed/cancelled job；`cancel` 只用于 pending/retry-scheduled job。运行中的 job 如果后端不支持协作取消，会依赖 lease 过期或 worker 完成后落定状态。所有响应都会返回 caveat：队列健康只说明采集运行情况，不是销量、需求、利润率、ROI 或盈利能力证据。

Provider gate 会记录 `rate_limited`、`quota_exhausted`、`unavailable`、`disabled` 等运行状态，并包含 reset time、并发、最近 root causes 和 remediation recommendations。受影响 provider 会延迟 claim，不受影响 provider 可以继续执行。

### eBay Browse API Provider

eBay 当前只走官方 Browse API，不启用未批准的浏览器 crawler fallback。Provider 会优先读取产品 `metadata` 中的 `ebayItemId`、`itemId`、`legacyItemId` 或 `ebayLegacyItemId`，否则解析常见 eBay URL：`/itm/<id>` 或 `/itm/<slug>/<id>`。无法确定 item ID 时返回 `unsupported_url`，不会用标题做宽泛搜索，避免把错误 listing 写入价格监控历史。

成功采集会写入 provider `ebay-browse`、source `official_api`、confidence、attemptId、eBay item ID、legacy item ID 和脱敏 listing URL。失败会映射为有界 root cause，例如 `missing_credentials`、`auth_failed`、`rate_limited`、`quota_exhausted`、`not_found`、`marketplace_mismatch`、`unsupported_url`、`price_missing`、`network_timeout` 或 `unknown`。Diagnostics 不保存 client secret、access token、Authorization header、带凭证 URL 或原始 provider payload。

eBay Browse 数据代表当前 listing 状态，不能当作销量、需求、利润、ROI 或广告表现事实。机会评分和 Chat 解释必须继续显示缺失信号和商家假设来源。

### Keepa Market Signal Provider

Keepa 用于 Amazon 商品的历史市场趋势信号，和当前 listing acquisition provider 分开配置、刷新和落表。它不会写入 `price_snapshots`，而是写入 market signal snapshots，保留 provider/source/window/confidence/freshness provenance，避免把第三方历史数组误认为本系统实时监控点。

支持的标识符必须是确定 ASIN：优先读取产品 `asin`，其次读取安全 metadata 字段 `asin`、`amazonAsin` 或 `keepaAsin`。缺少确定 ASIN 时返回 `unsupported_product`，不会用标题做宽泛搜索。

常用接口：

```http
POST /api/products/:id/market-signals/refresh
GET /api/products/:id/market-signals/latest
GET /api/products/:id/market-signals/history?limit=20
GET /api/market-signals/providers/keepa/health?windowHours=24&productId=<product-id>
```

刷新成功会归一化并保存价格趋势、sales rank 趋势、review velocity、rating movement、freshness、confidence、missing signals 和安全 metadata。失败会映射为有界原因，例如 `provider_unavailable`、`rate_limited`、`quota_exhausted`、`unsupported_product`、`not_found`、`insufficient_history`、`network_timeout` 或 `unknown`，并给出 `missing_credentials`、`auth_failed`、`quota_exhausted`、`rate_limited`、`unsupported_product`、`insufficient_history` 等 root cause。

Diagnostics 只允许保存 provider error code、HTTP status、marketplace、domain、tokens left、脱敏 provider message 和安全请求摘要。系统不会保存 `KEEPA_API_KEY`、Authorization header、带 key 的 URL、原始 Keepa payload 或大数组历史数据。

Keepa rank/review/price history 是外部历史趋势和代理证据，不是已验证销量、真实需求、margin、ROI 或 profitability facts。机会评分和 Chat 解释必须把这些 market signals 与当前 listing acquisition health、商家输入的成本/费用假设分开展示。

### Opportunity Research Workspace

机会研究工作区用于把机会评分候选商品保存为可继续跟进的短名单。研究状态、优先级、标签和备注都是用户工作流元数据，不参与 `score`、`confidence`、`factors` 或推荐动作计算。

常用接口：

```http
GET /api/opportunities/research?status=researching&tag=launch&page=1&limit=20
GET /api/opportunities/products/:productId/research
PUT /api/opportunities/products/:productId/research
PATCH /api/opportunities/products/:productId/research
POST /api/opportunities/products/:productId/research/archive
DELETE /api/opportunities/products/:productId/research
POST /api/opportunities/research/compare
POST /api/opportunities/research/export
```

创建或覆盖研究条目：

```http
PUT /api/opportunities/products/:productId/research
Content-Type: application/json

{
  "status": "researching",
  "priority": "medium",
  "tags": ["Launch", " supplier-check "],
  "notes": "Check landed cost and supplier MOQ.",
  "archived": false
}
```

支持的状态为 `researching`、`watching`、`ready`、`rejected`；优先级为 `low`、`medium`、`high`。标签会 trim、小写化、去重，最多 10 个，每个最长 32 字符；备注最长 2000 字符。每个商品最多一条研究记录，重复 `PUT` 会更新现有条目。

机会列表也支持研究筛选：

```http
GET /api/opportunities/products?shortlisted=true&researchStatus=ready&researchTag=launch
```

对比最多支持 6 个商品：

```http
POST /api/opportunities/research/compare
Content-Type: application/json

{
  "productIds": ["product-a", "product-b"]
}
```

导出支持 CSV 或 JSON，最多 100 行。可以传入明确的 `productIds`，也可以传入机会列表筛选条件：

```http
POST /api/opportunities/research/export
Content-Type: application/json

{
  "format": "csv",
  "filters": {
    "shortlisted": true,
    "researchStatus": "ready",
    "researchTag": "launch"
  },
  "limit": 100
}
```

导出响应包含 `filename`、`rows`，CSV 格式额外包含 `csv` 字符串。每行都会包含 `marketSignalCaveat`、`businessSignalCaveat` 和 `scoreCaveat`：市场趋势、rank 和 review 只是代理证据；业务指标依赖商家输入假设；研究状态、标签、备注和优先级不会改变机会评分或因子贡献。

### Provider Health

Provider 可观测性通过以下接口查看：

```http
GET /api/scraper/providers/amazon/health?windowHours=24&productId=<product-id>
GET /api/scraper/providers/ebay/health?windowHours=24&productId=<product-id>
```

返回内容包括：

- `providerSummaries` - 按 provider/source 聚合 attempt count、success rate、失败原因分布、平均耗时、最近成功时间和 confidence。
- `chainSummary` - live success/failure、browser fallback、cache fallback 和 primary provider failure 计数。
- `latestAttempts` - 最近尝试记录和安全 diagnostics。
- `recommendations` - 缺少 `RAINFOREST_API_KEY`、缺少 eBay credentials、auth failure、quota/rate-limit、marketplace mismatch、unsupported item URL、频繁 browser/cache fallback、unknown failure 等运维建议。

Diagnostics 只允许保存和返回 provider error code、HTTP status、marketplace、credits、fallback providers、脱敏 provider message 等字段。系统不会保存 API key、cookie、带凭证 query 的完整 URL、原始 HTML 或原始第三方响应 payload。browser fallback 和 cache fallback 会被标记为 degraded data-source path，不能当成 Amazon API provider 健康或销量/需求信号。

下一阶段 provider 接入顺序和采集限制说明见 [当前路线计划](../docs/roadmap.md#商品数据采集路线)。

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test productService.test.ts

# 监听模式
npm run test:watch
```

## 开发指南

### 添加新功能

1. 在 `src/types/index.ts` 定义类型
2. 在 `src/db/schema.ts` 定义数据库表
3. 运行 `npm run db:generate` 生成迁移
4. 在 `src/services/` 实现业务逻辑
5. 在 `src/routes/` 实现 API 端点
6. 编写测试文件
7. 运行测试验证

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 RESTful API 设计原则
- 所有公开 API 必须有对应测试
- 使用 Pino 记录日志
- 错误使用 AppError 类统一处理

## 最近更新

### 2026-06-21 - 代码审查关键修复

修复了代码审查中发现的 10 个关键 bug：

**SSE 连接优化**:
- ✅ 添加 15 秒心跳机制防止代理超时
- ✅ 实现 10 分钟最大流超时保护
- ✅ 客户端断开时立即中止流
- ✅ 完善资源清理（AbortController + 定时器）

**请求去重**:
- ✅ 前端 500ms 本地防重复窗口
- ✅ 后端 5 秒 SHA-256 内容哈希去重
- ✅ 429 响应码 + 自动过期清理

**数据一致性**:
- ✅ 修复 getAllProducts 类型契约（包含 updatedAt, asin, productUrl）
- ✅ 细粒度缓存失效（按平台失效，非全局清除）
- ✅ RAF 定时器清理防止内存泄漏

**代码质量**:
- ✅ 移除重复的数据库索引创建
- ✅ 优化工具过滤逻辑
- ✅ 统一协议签名

**测试覆盖**:
- 新增 35 个单元测试（缓存、去重、类型契约）
- 冒烟测试: 5 个关键路径 < 2 分钟

详见: `openspec/changes/code-review-critical-fixes/`

## 许可证

MIT

## 作者

AI 运营团队
