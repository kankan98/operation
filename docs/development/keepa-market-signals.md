# Keepa Market Signals

> **TL;DR**: Keepa 是 Amazon 历史趋势信号 provider，不替代当前 listing 采集。它只接受确定 ASIN，保存有界趋势摘要和安全诊断，并且所有 rank/review 信号都必须标注为代理证据，而不是销量、需求或利润事实。

---

## 适用范围

Keepa market signals 用于补充选品机会评分中的外部趋势证据：

- 历史价格摘要：当前值、均值、最高/最低、变化百分比、波动率、数据点数量。
- sales rank 趋势：排名变化方向和幅度，用作 rank trend evidence。
- review velocity：评价数量变化速度，用作 review activity evidence。
- rating movement：评分变化，用作外部口碑趋势。
- freshness 和 confidence：用于降低 stale/missing 信号下的评分置信度。

它不用于：

- 当前 listing 价格采集。
- 价格告警实时监控点回填。
- 宽泛标题搜索或自动匹配 ASIN。
- 推断已验证销量、真实需求、margin、ROI 或盈利能力。

---

## 环境配置

在 `backend/.env` 中配置：

```bash
KEEPA_MARKET_SIGNAL_ENABLED=true
KEEPA_API_KEY=<your-keepa-api-key>
KEEPA_API_BASE_URL=https://api.keepa.com
KEEPA_DOMAIN=1
KEEPA_MARKETPLACE=amazon.com
KEEPA_TIMEOUT_MS=15000
KEEPA_REFRESH_WINDOW_DAYS=90
KEEPA_MARKET_SIGNAL_FRESHNESS_MS=86400000
KEEPA_CAPTURE_DIAGNOSTICS=true
```

未配置 `KEEPA_API_KEY` 或关闭 `KEEPA_MARKET_SIGNAL_ENABLED` 时，刷新接口应返回结构化 `provider_unavailable`，不会影响 Rainforest、Amazon browser fallback、eBay Browse 或已有价格监控。

---

## 标识符规则

Keepa refresh 只支持确定 Amazon ASIN：

1. 产品主字段 `asin`。
2. 产品 metadata 中的安全字段：`asin`、`amazonAsin`、`keepaAsin`。

缺少 ASIN 时返回：

- `failureReason`: `unsupported_product`
- `rootCause`: `unsupported_product`
- `missingSignals`: `market_history`

不要使用标题搜索作为自动 fallback。标题搜索可能匹配错误商品，会污染 opportunity scoring 和 market signal history。

---

## API

```http
POST /api/products/:id/market-signals/refresh
GET /api/products/:id/market-signals/latest
GET /api/products/:id/market-signals/history?limit=20
GET /api/market-signals/providers/keepa/health?windowHours=24&productId=<product-id>
```

刷新成功返回 provider `keepa`、source `third_party`、snapshot ID、confidence、duration 和 timestamp。刷新失败返回有界 failure/root cause、safe diagnostics 和 remediation context。

Provider health 独立于 listing acquisition health，按 Keepa market signal attempts 聚合 success rate、latency、failure distribution、root causes、latest failure 和 recommendations。

---

## 诊断安全

允许保存和返回的字段：

- provider error code
- HTTP status
- marketplace/domain
- tokens left 或 quota 摘要
- sanitized provider message
- bounded root cause 和 failure reason
- duration、timestamp、confidence

禁止保存和返回：

- `KEEPA_API_KEY`
- Authorization header
- 带 key/token 的完整 URL
- 原始 Keepa payload
- 大型历史数组
- cookie、HTML、账号或个人敏感信息

测试应覆盖 auth failure、quota exhausted、rate limit、timeout、malformed response 和 raw payload redaction。

---

## 信号语义

Keepa market signals 是 historical trend and proxy evidence：

- sales rank trend 只表示排名趋势证据，不等于销量。
- review velocity 只表示评价活动变化，不等于真实需求、转化率或销售速度。
- price history 只表示外部价格走势，不等于利润率、ROI 或可采购成本。
- rating movement 只表示外部口碑趋势，不等于产品质量结论。

机会评分必须把 market signals、当前 listing acquisition health 和商家输入业务假设分开解释。Chat 回复也必须避免 “销量增长”“需求已验证”“ROI 确定” 这类 unsupported claims。

---

## 排障流程

1. 调用 Keepa health 接口确认最近窗口内是否有 attempts。
2. 如果 `status` 是 `insufficient_history`，先触发单商品 refresh 或检查调度是否运行。
3. 如果 root cause 是 `missing_credentials` 或 `auth_failed`，检查 `.env` 中的 `KEEPA_API_KEY`。
4. 如果 root cause 是 `quota_exhausted` 或 `rate_limited`，等待配额恢复或降低 refresh 频率。
5. 如果 root cause 是 `unsupported_product`，检查商品 `asin` 或 metadata ASIN。
6. 如果 root cause 是 `insufficient_history`，保留缺失信号，不要把该商品直接判为坏机会。
7. 如果 root cause 是 `network_timeout` 或 `unknown`，查看 safe diagnostics 和后端日志，再决定是否重试。

---

## 验证命令

```bash
pnpm --filter backend test -- marketSignals.api openapi.marketSignals marketSignalService marketSignalSchema keepaMarketSignalProvider providerDiagnostics opportunityScoringService opportunities.api chatService
pnpm --filter backend build
pnpm --filter frontend test -- ProductDetail Opportunities
pnpm --filter frontend build
openspec validate --changes keepa-market-signals --json
openspec validate --specs --json
```
