# 当前路线计划

> **TL;DR**: Chat 工作台、可靠商品数据采集、Rainforest Amazon provider、产品详情采集观测、Chat 采集解释、选品机会评分 MVP、Amazon provider health observability、business signal enrichment、eBay Browse provider、Keepa market signals 和 opportunity research workspace 已完成一轮落地。当前主线是 P5 `acquisition-queue-operations`：把采集、provider health、重试、限流、worker heartbeat 和队列可观测性从本地开发可用推进到更稳定的运营可用。

---

## 当前状态

### 已完成

- Chat 工作台重构已归档，现有 Chat 命名已替代旧 ChatV2 命名。
- 可靠商品数据采集已归档，主规格已同步到 `openspec/specs/`。
- 后端已经具备 provider chain、SQLite 采集任务、采集尝试记录、结构化失败原因、缓存 fallback 和调度退避能力。
- Amazon 浏览器 fallback 已能识别 robot check、captcha、blocked、geo restricted、not found、selector drift、price missing 等页面状态。
- Rainforest API provider 已接入为 Amazon 当前商品数据源，推荐 provider 顺序为 `rainforest,amazon-browser`。
- 产品详情已经展示手动采集结果、recent attempts、provider/source/status/failureReason/confidence/duration 和安全诊断摘要。
- Chat 已能解释采集状态和 structured failure reasons，并且只在用户明确要求时触发手动采集。
- 选品机会评分 MVP 已提供 score、confidence、factor breakdown、missing signals、recommended action、后端 API、前端工作台和 Chat 工具。
- Amazon provider health 已提供 provider success rate、failure distribution、browser/cache fallback usage、primary provider failure、safe diagnostics 和 remediation recommendations。
- eBay Browse provider 已接入官方 OAuth client-credentials 和 Browse API item detail，复用 provider chain、attempt provenance、cache fallback、provider health、OpenAPI、产品详情、机会工作台和 Chat 解释。
- Keepa market signals 已接入 Amazon 历史价格、sales rank、review velocity、rating movement、freshness 和 confidence，并接入机会评分、产品详情、机会工作台和 Chat 解释。
- 机会研究工作区已支持短名单、研究状态、优先级、标签、备注、候选对比、CSV/JSON 导出和 Chat 只读总结。
- OpenSpec 主规格库已修复历史校验债务；当前主规格库校验为 73 passed / 0 failed。

### 当前限制

- 未配置 `RAINFOREST_API_KEY` 时，Rainforest 会返回 `provider_unavailable` 并退回浏览器 fallback；真实稳定数据仍依赖配置合规数据源。
- 当前机会评分已接入商家假设下的成本、费用、广告、税费缓冲、利润率、ROI、盈亏平衡价和单件贡献利润；销量、真实需求、广告平台事实、FBA 官方费率等外部验证信号仍需后续数据源支持。
- 机会研究工作区已覆盖单人研究流；多人协作、权限、审批、审计历史、外部表格同步和供应链执行仍属于后续增强。
- 采集队列默认仍采用 SQLite job/attempt 表作为业务事实；BullMQ/Redis 已作为可选后端进入 P5 active slice，启用时必须显式配置 Redis。
- 业务信号来自商家假设，后续评分仍必须明确标注缺失信号，不能把假设计算值或代理指标说成平台验证事实。

---

## 当前 OpenSpec 工作

### Completed active changes pending archive

以下已完成任务和验证，后续可按归档流程移动到 `openspec/changes/archive/`：

- `amazon-provider-observability`
- `opportunity-business-signals`
- `ebay-browse-provider`
- `opportunity-research-workspace`

### Active change: `acquisition-queue-operations`

P5 当前正在实现队列和运维升级：

- 默认保留 SQLite 队列适配器，新增可选 BullMQ/Redis 适配器，继续以 `scrape_jobs` 和 `scrape_attempts` 作为业务观测事实。
- 增加 worker heartbeat、stale worker 检测、backlog/running/retry/failed/stale lease 聚合。
- 增加 provider rate-limit、quota exhaustion、fallback concurrency gate 和 unaffected-provider continuation。
- 增加队列健康、worker health、provider queue status、product job diagnostics、retry/cancel API 和 OpenAPI 文档。
- 产品详情、机会工作台和 Chat 只把队列状态作为采集运行上下文展示，不改变机会评分、市场趋势或业务假设语义。

### Recently completed change: `opportunity-research-workspace`

本轮已把评分候选推进成可行动的选品研究工作流：

- 增加持久化 opportunity research entries：短名单状态、优先级、标签、备注和归档状态。
- 在机会工作台和产品详情中展示/编辑研究状态，不改变机会评分本身。
- 支持候选商品对比视图，横向比较价格、采集健康、市场趋势、业务假设、缺失信号和评分因子。
- 支持 CSV/JSON 导出候选商品，并保留市场代理信号和商家假设的 caveats。
- Chat 先支持只读总结短名单和研究状态，不做隐藏状态写入。

### Next recommended slice after P5

P5 完成并归档后，再评估是否进入更细的 provider 扩展或运维告警：

- 如果真实采集吞吐仍不足，优先部署 BullMQ worker、Redis 监控和告警，而不是直接增加新 crawler。
- 如果 Amazon 数据仍不稳定，优先补齐合规 provider 配置、quota 管理和 provider fallback 证据链。
- 如果团队需要运营值守，再扩展 queue alerting、worker dashboard、审计历史和人工确认式 job control。

### Latest archived change: `keepa-market-signals`

本轮已接入合法历史市场信号：

- 新增 Keepa-backed market signal provider，和当前 listing acquisition provider 分开配置和落表。
- 持久化价格趋势、sales rank 趋势、review velocity、rating movement、freshness、confidence 和 missing signals。
- 将趋势信号接入机会评分、产品详情、机会工作台和 Chat 解释，但继续明确它们是代理趋势证据，不是已验证销量、需求或利润事实。
- 暴露 market signal refresh/history/latest/provider health API，并补齐 OpenAPI、shared schemas、fixture 测试和验证文档。

### Recently completed change: `opportunity-business-signals`

当前变更已实现并通过验证，目标是把机会评分从“候选优先级”推进到“业务可判断”：

- 增加商家可输入的商品成本、头程/尾程、FBA/履约、平台/佣金、广告、税费缓冲、目标售价等业务假设。
- 计算 gross margin、net margin、ROI、breakeven sell price、contribution profit 和 assumption completeness。
- 在机会评分、产品详情、机会工作台和 Chat 解释中使用这些指标，同时明确它们是基于商家假设的计算，不是平台验证的销量或需求事实。
- 修复产品删除和测试清理中的外键依赖顺序，使全量后端测试恢复稳定。

### Recently completed change: `ebay-browse-provider`

本轮已接入 eBay Browse API provider：

- 复用 Amazon 已验证的 provider router、scrape attempts、job retry、cache fallback 和 provider health 模型。
- 已定义 eBay provider 能力、失败原因映射、OpenAPI 合同、fixture 测试和产品字段归一化。
- 实现使用官方 OAuth client-credentials 和 Browse API item detail，不做未批准的 eBay browser fallback。
- eBay 只接受 metadata 或支持 URL 中可确定的 item ID，不能确定时返回 `unsupported_url`，避免宽泛搜索污染价格历史。
- 前端继续通过现有产品详情、机会工作台和 Chat 解释展示平台来源、健康状态和缺失信号。

### Previously archived change: `amazon-provider-health-observability`

本轮已把 Amazon provider 的运维可观测性补齐，让系统能回答“为什么 Amazon 数据没回来/变慢/退回 fallback”：

- 后端聚合 `scrape_attempts`，输出 provider success rate、failure distribution、latency、fallback/cache usage 和 last success freshness。
- Rainforest diagnostics 归一化缺少 API key、auth/quota/rate-limit、timeout、not found、price missing、unknown 等原因。
- API 和产品详情/Chat 明确区分 data-source health 与销量、需求、利润等选品信号。
- OpenSpec 主规格库继续保持零失败和无已知 warning 债务。

---

## 商品数据采集路线

### 推荐主路线

1. **合规 API 或数据供应商优先**
   - Amazon 当前已接入 Rainforest API。
   - 后续如果需要价格历史和市场深度信号，可评估 Keepa。
   - 如果已有联盟资质，可接入 Amazon Product Advertising API。
   - 如果需要卖家自有运营数据，再评估 Amazon SP-API。
   - eBay 后续优先接入 eBay Browse API。

2. **缓存 fallback 兜底**
   - live provider 失败时，如果已有产品数据仍在 `ACQUISITION_CACHE_FRESHNESS_MS` 窗口内，可返回低风险缓存结果。
   - 缓存结果必须保留 `source`、`provider`、`confidence` 和 `freshnessMs`，避免把旧数据误判为新鲜采集。

3. **浏览器 fallback 最后执行**
   - Playwright 浏览器采集只作为补充路径，用于无 API 覆盖或低频人工验证场景。
   - captcha、robot check、blocked、geo restricted 等状态只记录诊断并退避或切换来源，不自动处理验证码。

### 不推荐路线

- 不把“代理池 + 验证码绕过”作为主方案。它不稳定、不可解释，也会让调度和告警系统进入盲目重试。
- 不为每个平台单独堆一套爬虫逻辑。后续平台都应复用 provider router、attempt 记录、失败分类和退避机制。
- 不在当前阶段引入过重队列组件。先用 SQLite job 表完成可观测性和稳定性，再根据吞吐量决定是否升级。

---

## 下一阶段计划

### P0: 选品机会评分 MVP ✅

- [x] 用已有产品、价格快照、采集健康、评分/评论代理信号生成 0-100 opportunity score。
- [x] 同时返回 confidence 和 missing signals，避免把缺失利润、销量、需求数据误表达成事实。
- [x] 在前端提供机会工作台，让用户按 score、confidence、recommendation 快速筛选产品。
- [x] 在 Chat 工具中加入机会排行和单产品评分解释。

### P1: Amazon provider observability ✅

- [x] 设计 provider health contract、Rainforest 安全诊断和 fallback/cache 降级语义。
- [x] 实现 `GET /api/scraper/providers/amazon/health` 和 OpenAPI schema。
- [x] 在产品详情和 Chat 中展示/解释 provider health，不把它误认为需求或利润信号。
- [x] 用 fixture 覆盖 Rainforest 诊断映射、fallback provenance、health aggregation 和 query validation。

### P2: 更强选品信号 ✅

- [x] 落地 `opportunity-business-signals`，支持成本、头程/尾程、平台费用、广告、税费输入。
- [x] 计算并展示利润率、ROI、盈亏平衡价和单件贡献利润。
- [x] 将业务信号接入机会评分、产品详情、机会工作台和 Chat 解释。
- [x] 对缺失业务信号继续降 confidence，并禁止把缺失成本当作零成本优势。

### P3: 扩展平台覆盖

- [x] eBay：接入官方 eBay Browse API provider，覆盖 OAuth、item ID 解析、采集归一化、attempt provenance、provider health、OpenAPI、产品详情、机会工作台和 Chat 解释。
- Walmart、AliExpress：先评估官方或授权数据源，再决定是否只做受控 browser fallback。
- 所有新平台必须先定义 provider 能力、失败原因映射和测试 fixture，再接入 scheduler。

### P4: 深度市场信号 ✅

- [x] 接入 Keepa 历史数据源，增强 Amazon 价格历史、sales rank、review velocity 等趋势信号。
- [x] 将趋势信号保存为可解释的 market signal snapshots，并接入机会评分 confidence、missing signals、产品详情、机会工作台和 Chat 解释。
- [x] 继续区分“平台观测趋势”和“已验证销量/利润事实”，避免把排名变化或评论变化过度解释为确定需求。

### P4.5: 选品研究工作流 ✅

- [x] 支持候选商品短名单、研究状态、优先级、标签和备注。
- [x] 支持候选商品对比视图，横向比较评分、采集健康、市场趋势、业务假设和缺失信号。
- [x] 支持 CSV/JSON 导出，导出内容保留代理信号和商家假设 caveats。
- [x] Chat 支持只读总结短名单和研究状态，不做隐藏写入。

### P5: 队列和运维升级（active）

- [x] 设计队列适配层：SQLite 默认、BullMQ/Redis 可选。
- [x] 保留现有 `scrape_jobs` 和 `scrape_attempts` 作为业务观测表，队列系统只负责执行编排。
- [x] 补充 queue health、worker heartbeat、provider gates、manual refresh throttle、retry/cancel 和 product job diagnostics。
- [ ] 完成全量验证并归档 `acquisition-queue-operations`。

---

## 验证门禁

- 后端变更必须通过 `pnpm --filter backend lint`。
- 后端构建必须通过 `pnpm --filter backend build`。
- 后端测试必须通过 `pnpm --filter backend test`。
- 前端相关变更必须至少通过对应 Vitest 测试和 `pnpm --filter frontend build`。
- Amazon 相关测试必须使用 mock 页面或 fixture，不依赖真实 Amazon 网络。
- OpenSpec 变更归档前必须通过对应 change 校验；主规格库必须保持 `openspec validate --specs --json` 零失败。

---

## 相关文档

- [后端 README: Product Data Acquisition 配置](../backend/README.md#product-data-acquisition-配置)
- [Product Data Acquisition 规格](../openspec/specs/product-data-acquisition/spec.md)
- [Rainforest Amazon Provider 规格](../openspec/specs/rainforest-amazon-provider/spec.md)
- [Product Detail UI 规格](../openspec/specs/product-detail-ui/spec.md)
- [Chat Agent Tools 规格](../openspec/specs/chat-agent-tools/spec.md)
- [Product Opportunity Scoring 提案](../openspec/changes/archive/2026-06-20-product-opportunity-scoring/proposal.md)
- [eBay Browse Provider 开发说明](development/ebay-browse-provider.md)
- [Keepa Market Signals 开发说明](development/keepa-market-signals.md)
- [Opportunity Research Workspace 开发说明](development/opportunity-research-workspace.md)
- [Acquisition Queue Operations 开发说明](development/acquisition-queue-operations.md)
