# 当前路线计划

> **TL;DR（2026-06-30 方向调整）**: 本项目定位明确为**个人自用的选品研究工具，准确性 > 规模，且无付费数据源预算**。在没有任何付费 API key 的前提下，自动采集管道长期"空跑"（浏览器抓取被 Amazon 封 + 缓存兜底），数据缺失过时。因此放弃"全自动采集"幻觉，转向**手动录入优先的研究助手**：每个数据点标来源/新鲜度、手动录入做成一等流程、评分透明可否决、砍掉自动采集/队列/调度等运维型死重量。
>
> **原 P5 `acquisition-queue-operations`（BullMQ/Redis、worker heartbeat、stale lease）与 Phase 7-9（多平台扩展、Docker、用户认证/多租户）对个人自用属于过度工程，已降级/搁置。** 设计文档见 [`docs/superpowers/specs/2026-06-29-manual-first-research-assistant-design.md`](./superpowers/specs/2026-06-29-manual-first-research-assistant-design.md)。

---

## 当前方向（手动优先研究助手）

按价值顺序推进：

1. **数据来源模型（已完成）**: `price_snapshots` 带 `source`（manual/browser/cache/keepa/rainforest/ebay-browse/unknown），下游按来源+新鲜度推导可信度，缺失/过时绝不伪装成已验证事实。
2. **手动录入一等流程（已完成）**: 产品详情可手动录入价格/BSR/评分/评论数，标记 `source=manual`，支持补录历史读数指定日期；按需单品浏览器抓取保留为便利。
3. **透明评分（已完成）**: 机会评分各因子的贡献/权重/原始值/解释全部在 UI 展开，并明确权重是未经真实结果校准的启发式，使用者据此判断、可否决。
4. **砍掉死重量（进行中）**: 定时调度器默认关闭（`ACQUISITION_SCHEDULER_ENABLED=false`），队列默认不启动；自动采集管道/队列运维/provider health/相关表与 OpenSpec 规格将分批标记 deprecated 后移除（破坏性删除前需确认）。
5. **将来（可选）**: 若哪天愿意付费，内置的 Keepa provider 可一键从"市场信号"提升为主数据源，替代手动录入主力。

> 以下"当前状态/历史变更"为方向调整前的记录，保留作为背景；其中 P5/Phase7-9 相关项不再作为主线推进。

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
- 机会研究工作区已支持短名单、研究状态、优先级、标签、备注、当前决策、决策复盘队列、复盘汇总、每日行动计划、行动指导、候选对比、CSV/JSON 导出和 Chat 只读总结。
- OpenSpec 主规格库已修复历史校验债务；当前主规格库校验为 90 passed / 0 failed。

### 当前限制

- 未配置 `RAINFOREST_API_KEY` 时，Rainforest 会返回 `provider_unavailable` 并退回浏览器 fallback；真实稳定数据仍依赖配置合规数据源。
- 当前机会评分已接入商家假设下的成本、费用、广告、税费缓冲、利润率、ROI、盈亏平衡价和单件贡献利润；销量、真实需求、广告平台事实、FBA 官方费率等外部验证信号仍需后续数据源支持。
- 机会研究工作区已覆盖单人研究流和当前决策复盘；多人协作、权限、审批、历史决策时间线、外部表格同步和供应链执行仍属于后续增强。
- 采集队列默认仅保留 SQLite job/attempt 表作为手动检查的兼容记录和诊断来源；批量 `/api/scraper/all` 默认关闭，队列操作默认不作为主工作流展示。
- 业务信号来自商家假设，后续评分仍必须明确标注缺失信号，不能把假设计算值或代理指标说成平台验证事实。

---

## 当前 OpenSpec 工作

### Active change: None

当前没有未归档的 OpenSpec 变更。

### Recently completed change: `opportunity-decision-evidence-template-fill`

本轮已给机会决策依据输入区补 `填入决策框架`，让用户能从空白判断依据快速开始结构化运营判断记录：

- 空白 `decisionReason` 可按当前 go/hold/no_go 决策状态填入可编辑的静态证据框架。
- 用户切换决策状态后，填入的是新状态对应的框架。
- 已有手写判断依据时控件禁用，避免覆盖；填入框架不会自动保存，也不改变决策快照、评分、推荐、门控、市场信号、业务指标、AI coaching、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-outcome-template-fill`

本轮已给行动结果输入区补 `填入记录框架`，让用户能从空白输入快速开始结构化运营复盘：

- 空白 outcome 可按当前 action 填入可编辑的静态记录框架。
- 用户切换行动类型后，填入的是新 action 对应的框架。
- 已有手写 outcome 时控件禁用，避免覆盖；填入框架不会自动保存，也不做语义校验、AI coaching、评分输入、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-evidence-examples`

本轮已给行动结果输入区补 action-specific `证据样例 · ...`，让用户更容易把每日行动转成可复盘的执行记录：

- 默认、手动切换 action、每日行动/练习分桶 context 和 saved latest outcome 都显示与当前 action 对齐的样例。
- `编辑行动执行结果` textarea 同时引用可见 `证据提示` 和 `证据样例` 作为辅助描述。
- 样例只作为人工写作参考，不作为必填模板、语义校验、AI coaching、评分输入、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-save-scope-describedby`

本轮已把行动结果保存按钮与可见保存说明建立可访问性描述关系：

- `保存行动结果` 按钮通过 `aria-describedby` 指向“行动结果只作为复盘练习证据，不改变评分或市场/业务信号”。
- 保存不可用且有本地提示时，按钮也引用当前 `行动结果保存提示`，让禁用原因和保存范围一起可读。
- 该关联只说明保存影响边界，不做语义校验、AI coaching、评分输入、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-evidence-prompt-describedby`

本轮已把行动结果输入框与可见 evidence prompt 建立可访问性描述关系：

- `编辑行动执行结果` textarea 通过 `aria-describedby` 指向可见 `证据提示 · ...`。
- 用户切换行动类型时，可见提示继续跟随当前 action，输入框描述关系不分叉。
- 该关联只改善人工证据记录的可读性，不做语义校验、AI coaching、评分输入、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-visible-action-evidence-prompt`

本轮已把行动结果 evidence prompt 从只在 textarea placeholder 中显示，推进为持续可见的中性写作提示：

- 行动结果输入区显示 `证据提示 · ...`。
- 用户切换行动类型、从每日行动/练习分桶带入 action context、或查看 saved latest outcome 时，可见提示与当前 action 同步。
- 该提示只辅助人工写证据，不做语义校验、AI coaching、评分输入、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-criteria-action-label`

本轮已给行动结果表单的完成定义区补适用行动标签，减少用户写执行证据时在选择器、摘要和 criteria 之间来回确认：

- 完成定义区显示 `适用行动 · ...`。
- 用户切换行动类型、或从每日行动/练习分桶带入 action context 时，适用行动标签随当前 action 同步更新。
- 已有 saved latest outcome 的候选显示 saved action 对应的适用行动；该展示不改变评分、持久化、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-selection-summary`

本轮已给行动结果表单补当前选择摘要，让用户在没有或已有 transient action context 的情况下都能看到当前将保存的 action 类型：

- 没有 saved latest outcome 时，表单显示 `当前将保存 · ...`。
- 用户切换行动类型、或从每日行动/练习分桶带入 action context 时，该摘要同步跟随当前选择。
- 已有 saved latest outcome 的候选继续显示保存结果，不显示单独的未保存 action 摘要；该展示不改变评分、持久化、提醒、analytics 或训练等级。

### Recently completed change: `opportunity-action-context-semantic-label`

本轮已给行动结果表单的 transient action context 补整体语义标签，方便把当前来源、预选 action 和手动改选目标作为一个状态读取：

- 从每日行动进入候选时，context chip 暴露包含 `来自每日行动` 和预选行动类型的语义标签。
- 从练习分桶进入候选时，context chip 暴露包含 `来自练习分桶` 和预选行动类型的语义标签。
- 手动改选后，语义标签同步包含原始预选 action 和 `将保存` 的当前 action；已有 saved latest outcome 的候选不暴露 transient context 语义。

### Recently completed change: `opportunity-action-context-manual-override`

本轮已给行动结果表单补手动改选提示，降低从工作流上下文进入后保存错 action id 的风险：

- 当每日行动或练习分桶预选了行动类型，而用户手动选择另一个行动类型时，表单显示 `已手动改选`。
- 表单同时显示 `预选 · ...` 和 `将保存 · ...`，明确区分原始上下文 action 和当前将提交的 action。
- 完成定义、证据 prompt 和保存 payload 继续跟随当前选中的行动类型；已有 saved latest outcome 的候选不显示 transient override 提示。

### Recently completed change: `opportunity-action-context-source-labels`

本轮已给行动结果表单的 transient action context 补来源标签，帮助用户知道行动类型为什么被预选：

- 从每日行动计划进入候选时，行动结果表单显示 `来自每日行动`。
- 从练习覆盖 action bucket 进入候选时，行动结果表单显示 `来自练习分桶`。
- 已有 saved latest outcome 的候选继续以保存结果为准，不显示 transient context 来源标签；该展示不新增后端状态、提醒、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-daily-action-active-state`

本轮已给每日行动计划卡片补 active/pressed 状态，帮助用户确认当前处理的是哪一个工作流行动队列：

- 当前 UI 筛选正好匹配从每日行动卡片进入的 action item 时，对应卡片显示 `当前行动` 并设置 `aria-pressed=true`。
- 非当前 daily action item 保持 `aria-pressed=false`。
- 若额外 discovery、research、review、practice、shortlist、operations 或 decision-status 筛选窄化候选列表，或 transient action context 缺失/不是 daily action 来源，则不把每日行动卡片标为 active，避免误表达成完整行动队列。

### Recently completed change: `opportunity-practice-summary-active-filter-state`

本轮已给练习覆盖 summary 控件补 active/pressed 状态，帮助用户确认当前处理的是哪一个执行证据练习筛选：

- 当前 UI 筛选正好匹配练习覆盖、未记录结果或 action bucket 时，对应控件显示 `当前练习筛选` 并设置 `aria-pressed=true`。
- 非当前练习筛选控件保持 `aria-pressed=false`。
- 若额外 discovery、research、review、shortlist 或 operations 筛选窄化候选列表，则不把 practice summary 控件标为 active，避免误表达成完整练习覆盖队列。

### Recently completed change: `opportunity-review-summary-active-filter-state`

本轮已给复盘汇总卡片补 active/pressed 状态，帮助用户确认当前处理的是哪一个复盘队列：

- 当前 UI 筛选正好匹配某个复盘汇总队列时，对应卡片显示 `当前队列` 并设置 `aria-pressed=true`。
- 非当前队列卡片保持 `aria-pressed=false`。
- 若额外 discovery、research、decision-status 或 practice 筛选窄化候选列表，则不把复盘汇总卡片标为 active，避免误表达成完整队列。

### Recently completed change: `opportunity-review-summary-filter-actions`

本轮已把复盘汇总卡片推进成可操作筛选入口，帮助用户从队列计数直接进入对应候选集合：

- `活跃研究`、`未决策`、`待下一步`、`需复盘` 卡片复用已有 review filter state。
- 点击卡片只改变当前机会工作台筛选和候选列表，不新增后端 API、持久任务、提醒、自动化、analytics 或评分输入。
- 切换复盘汇总筛选时清除 transient action context，避免每日行动或练习分桶上下文污染新的候选集合。

### Recently completed change: `opportunity-review-summary-generated-at`

本轮已把复盘汇总卡片补上 read model 生成时间，帮助用户确认当前复盘队列计数来自哪一次汇总：

- 有 loaded `summary.generatedAt` 时，在复盘汇总卡片区域显示中性 `汇总时间 · ...`。
- loading、missing summary 或缺少 generated time 时不从 render time、daily action plan、practice summary、action outcomes、decision metadata、score/recommendation、market signals 或 business metrics 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、自动化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-practice-summary-generated-at`

本轮已把练习覆盖汇总 strip 补上 read model 生成时间，帮助用户确认当前练习覆盖数字来自哪一次汇总：

- 有 loaded `summary.generatedAt` 时，在练习覆盖汇总 strip 显示中性 `汇总时间 · ...`。
- loading、missing summary 或缺少 generated time 时不从 render time、daily action plan、review summary、action outcomes、decision metadata、score/recommendation、market signals 或 business metrics 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、自动化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-action-plan-generated-at`

本轮已把每日行动计划 panel 补上 read model 生成时间，帮助用户确认当前工作流行动指导来自哪一次计划：

- 有 loaded `plan.generatedAt` 时，在每日行动计划 panel 显示中性 `计划时间 · ...`。
- loading、missing plan 或缺少 generated time 时不从 render time、review summary、practice summary、action outcomes、decision metadata、score/recommendation、market signals 或 business metrics 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、自动化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-row-action-outcome-completed-at`

本轮已把候选列表行的 latest action outcome 展示补上保存完成时间，方便用户不打开详情也能审计执行证据记录时间：

- 有 saved `research.lastActionOutcome.completedAt` 的候选列表行，在研究摘要中显示中性 `完成时间 · ...`。
- 缺少 latest outcome 或 completion time 的候选行继续依赖现有 `待补行动结果` 状态，不从 notes、decision、decision review metadata、daily action plan metadata、practice summary counts、score/recommendation、action outcome update time 或 render time 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、自动化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-action-outcome-completed-at`

本轮已把候选对比表的 latest action outcome 展示补上保存完成时间，方便用户横向审计执行证据记录时间：

- 有 saved `research.lastActionOutcome.completedAt` 的对比候选，在行动结果列显示中性 `完成时间 · ...`。
- 缺少 latest outcome 或 completion time 的对比候选继续只显示 `未记录`，不从 notes、decision、decision review metadata、daily action plan metadata、practice summary counts、score/recommendation、action outcome update time 或 render time 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、自动化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-review-context`

本轮已把当前决策复盘上下文展示到候选对比表，帮助横向比较哪些候选更需要先处理：

- 有 current `research.decisionReview.needsNextAction` 或 `stale` 的对比候选，在决策列显示中性 `待下一步` 或 `需复盘` badge。
- 有 current `research.decisionReview.daysSinceDecision` 的对比候选，在决策列显示 `今天决策`、`昨天决策` 或 `N 天前决策`。
- 缺少 current decisionReview metadata 时，对比表不从 decision 时间、saved snapshot、notes、action outcomes、daily action plan metadata、practice summary counts 或 render time 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-gate-details`

本轮已把保存决策时的门控详情展示到候选对比表，帮助横向比较当时推荐被门控的具体原因、触发信号和补充动作：

- 有 saved `decision.snapshot.recommendationGate.reasons` 的对比候选，在决策列显示中性 `快照门控原因 · ...`。
- 有 saved `decision.snapshot.recommendationGate.signals` 或 `nextActions` 的对比候选，在决策列显示 `快照门控信号` 和 `快照门控下一步`。
- 当保存快照门控为空白 clear 或没有详情时，对比表不从当前 opportunity recommendation gate 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-market-factors`

本轮已把保存决策时的市场因子快照展示到候选对比表，帮助横向比较当时具体 Keepa/provider 代理趋势证据是否支撑人工判断：

- 有 saved `decision.snapshot.marketSignals.factors` 的对比候选，在决策列显示中性 `快照市场因子 · ...`。
- 快照市场因子展示保存时的 factor label、raw value 和 explanation。
- 当保存快照 `marketSignals` 为 `null` 或 `factors` 为空时，对比表不从当前 opportunity market factors 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-market-summary`

本轮已把保存决策时的市场代理信号摘要展示到候选对比表，帮助横向比较当时 Keepa/provider 趋势证据是否新鲜、完整且可用于人工判断：

- 有 saved `decision.snapshot.marketSignals` 的对比候选，在决策列显示中性 `快照市场状态 · ...`。
- 快照市场存在 provider/source、confidence、freshness 或 missing signals 时，决策列显示 `快照市场来源`、`快照市场置信度`、`快照市场新鲜度` 和 `快照市场缺口`。
- 当保存快照 `marketSignals` 为 `null` 或缺失时，对比表不从当前 market signals、market factors、score/recommendation、notes、action outcomes、review metadata、daily action plan metadata 或 render time 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-business-metrics`

本轮已把保存决策时的业务指标展示到候选对比表，帮助横向比较当时假设单位经济性是否支撑人工判断：

- 有 saved `decision.snapshot.businessSignals.metrics` 的对比候选，在决策列显示中性 `快照业务指标 · ...`。
- 快照业务指标展示保存时的 net margin、ROI、breakeven sell price 和 contribution profit per unit。
- 当保存快照 `businessSignals.metrics` 为 `null` 或缺失时，对比表不从当前 business metrics 回填或重算；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-business-summary`

本轮已把保存决策时的业务完整度和业务缺口展示到候选对比表，帮助横向比较当时成本、费用等业务假设是否完整：

- 有 saved `decision.snapshot.businessSignals.completeness` 的对比候选，在决策列显示中性 `快照业务完整度 · ...`。
- 有 saved `decision.snapshot.businessSignals.missingSignals` 的对比候选，在决策列显示中性 `快照业务缺口 · ...`。
- 对比表快照业务摘要只使用 saved snapshot business signals，不从当前 business signals、business metrics、score/recommendation、notes、action outcomes、review metadata、daily action plan metadata 或 render time 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-evidence`

本轮已把保存决策时的快照依据和缺口展示到候选对比表，帮助横向比较当时评分证据是否扎实：

- 有 saved `decision.snapshot.keyReasons` 的对比候选，在决策列显示中性 `快照依据 · ...`。
- 有 saved `decision.snapshot.missingSignals` 的对比候选，在决策列显示中性 `快照缺口 · ...`。
- 对比表快照依据/缺口只使用 saved snapshot arrays，不从当前 key reasons、missing signals、factor explanations、notes 或 render time 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-gate`

本轮已把保存决策时的推荐门控快照展示到候选对比表，帮助横向比较当时推荐是否被门控降级或拦截：

- 有非 clear `research.decision.snapshot.recommendationGate` 的对比候选，在决策列显示中性 `快照门控 ...`。
- 对比表 `快照门控` 使用 saved `decision.snapshot.recommendationGate`，不从当前 opportunity recommendation gate、score/recommendation 或 render time 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-captured-at`

本轮已把保存决策时的快照时间展示到候选对比表，帮助横向比较决策证据快照的新旧：

- 有 `research.decision.snapshot` 的对比候选，在决策列显示中性 `快照时间 · ...`。
- 对比表 `快照时间` 使用 saved `decision.snapshot.capturedAt`，不从 decision decidedAt、updatedAt、当前 opportunity 或 render time 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、stale filter、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-confidence`

本轮已把保存决策时的快照置信度展示到候选对比表，帮助横向比较决策当时证据可靠度：

- 有 `research.decision.snapshot` 的对比候选，在决策列显示中性 `快照置信度 NN%`。
- 对比表 `快照置信度` 使用 saved `decision.snapshot.confidence`，不从当前 opportunity confidence、score/recommendation 或 render time 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-decision-snapshot-summary`

本轮已把已保存的决策快照分数和建议展示到候选对比表，帮助区分决策当时证据和当前评分：

- 有 `research.decision.snapshot` 的对比候选，在决策列显示中性 `快照 ...`。
- 对比表快照使用 saved `decision.snapshot.score` 和 `decision.snapshot.recommendation`，不从当前 score/recommendation 回填。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-action-outcome-summary`

本轮已把已保存的最近行动结果展示到候选对比表，帮助横向比较候选执行证据：

- 有 `research.lastActionOutcome` 的对比候选，在 `行动结果` 列显示 action label、完成新鲜度和 outcome text。
- 缺少 latest outcome 的对比候选不从 notes、decisions、review metadata、daily action plan、practice summary 或评分/市场/业务信号回填行动结果。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-comparison-next-action-summary`

本轮已把已保存的决策下一步行动展示到候选对比表，帮助横向比较候选跟进承诺：

- 有 `research.decision.nextAction` 的对比候选，在决策列显示中性 `下一步 · ...`。
- 缺少下一步的对比候选不从 notes、action outcomes、review metadata、daily action plan 或其它当前信号回填下一步。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-captured-at`

本轮已把保存决策时的证据快照捕获时间展示到选中候选决策详情，帮助回看当时证据与决策记录时间是否一致：

- 当前决策快照有 `capturedAt` 时，详情显示中性 `快照时间 · ...`。
- `快照时间` 使用保存的 `decision.snapshot.capturedAt`，不从 decision `decidedAt`、`updatedAt`、当前 opportunity 或当前渲染时间推断。
- 该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-market-factors`

本轮已把保存决策时的市场因子快照展示到选中候选决策详情，帮助回看当时具体 Keepa/provider 代理趋势证据是否支撑人工判断：

- 当前决策快照 `marketSignals.factors` 有保存因子时，详情显示中性 `快照市场因子 · ...`。
- 快照市场因子展示保存时的 factor label、raw value 和 explanation。
- 当保存快照 `marketSignals` 为 `null` 或 `factors` 为空时，详情不从当前 opportunity market factors 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-business-metrics`

本轮已把保存决策时的业务指标快照展示到选中候选决策详情，帮助回看当时假设净利率、ROI、盈亏平衡价和单件贡献是否支撑人工判断：

- 当前决策快照有 `businessSignals.metrics` 时，详情显示中性 `快照业务指标 · ...`。
- 快照业务指标展示保存时的 net margin、ROI、breakeven sell price 和 contribution profit per unit。
- 当保存快照 `businessSignals.metrics` 为 `null` 时，详情不从当前 opportunity business metrics 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-market-summary`

本轮已把保存决策时的市场代理信号摘要展示到选中候选决策详情，帮助回看当时 Keepa/provider 趋势证据是否新鲜、完整且可用于人工判断：

- 当前决策快照有 `marketSignals` 时，详情显示中性 `快照市场状态 · ...`。
- 快照市场存在 provider/source、confidence、freshness 或 missing signals 时，详情显示 `快照市场来源`、`快照市场置信度`、`快照市场新鲜度` 和 `快照市场缺口`。
- 当保存快照 `marketSignals` 为 `null` 时，详情不从当前 opportunity market signals 回填；该展示不改变评分、推荐、门控、市场信号、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-business-summary`

本轮已把保存决策时的业务假设完整度展示到选中候选决策详情，帮助回看当时是否缺成本、费用等关键业务假设：

- 当前决策有保存快照时，详情显示中性 `快照业务完整度 · ...`。
- 保存快照存在业务缺口时，详情显示 `快照业务缺口 · ...`。
- 当当前 opportunity business signals 与保存快照 business signals 不一致时，详情使用保存快照值；该展示不改变评分、推荐、门控、业务指标、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-confidence`

本轮已把保存决策时的快照置信度展示到选中候选决策详情，帮助回看当时证据可靠度：

- 当前决策有保存快照时，详情显示中性 `快照置信度 NN%`。
- 当当前 opportunity confidence 与保存快照 confidence 不一致时，`快照置信度` 使用保存快照值。
- 该展示不改变评分、推荐、门控、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-gate`

本轮已把保存决策时的推荐门控快照展示到选中候选决策详情，帮助区分当时门控和当前 live 门控：

- 保存快照门控有 applied、blocked、caution、原因、信号或下一步时，详情显示中性 `快照门控`。
- 快照门控原因、信号和下一步分别显示为 `快照门控原因 · ...`、`快照门控信号 · ...` 和 `快照门控下一步 · ...`。
- 快照门控为空白 clear 时不从当前机会 recommendation gate 回填；该展示不改变评分、推荐、门控、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-snapshot-evidence`

本轮已把保存决策时的评分快照证据展示到选中候选决策详情，帮助回看当时支撑判断的原因和缺口：

- 决策快照包含 `keyReasons` 时，详情显示中性 `快照依据 · ...`。
- 决策快照包含 `missingSignals` 时，详情显示中性 `快照缺口 · ...`。
- 快照数组为空时不从当前机会 reasons/missing signals、推荐门控、市场信号、业务指标、备注或行动结果回填；该展示不改变评分、推荐、门控、持久化、提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-next-action-gap-label`

本轮已把 go/hold 决策缺少下一步的缺口提示放进选中候选决策详情，减少只靠 badge 扫描的上下文切换：

- `decisionReview.needsNextAction` 为真时，详情的决策证据块显示中性 `待补下一步`。
- 已有 next action 时继续显示 `下一步 · ...`，不显示缺口提示。
- no-go、未决策或缺少 review metadata 的候选不推断下一步缺口；该提示不生成下一步、不新增提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-decision-evidence-labels`

本轮已把选中候选决策详情中的已保存证据改成和候选列表行一致的中性标签，增强人工判断证据的可扫描性：

- 详情中的当前决策依据显示为 `决策依据 · ...`。
- 详情中的当前决策下一步显示为 `下一步 · ...`；缺少 next action 时不推断下一步，继续依赖既有 `待下一步` 复盘状态。
- 该标签只是 user-authored workflow evidence，不新增提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-detail-outcome-gap-label`

本轮已把 active research 缺少 latest action outcome 的证据缺口同步到选中候选详情，减少从列表进入记录入口后的上下文断层：

- active、未归档且缺少 latest outcome 的研究候选，在行动结果详情中显示中性 `待补行动结果`。
- 已有 latest outcome 的候选继续显示 action label、完成时间、recency label 和 outcome text。
- 未加入研究或已归档的候选不显示 active outcome gap；该提示不新增提醒、alert、streak、training grade、AI coaching、analytics、历史记录或评分输入。

### Recently completed change: `opportunity-detail-decision-age-label`

本轮已把选中候选决策详情里的决策时长改成和候选列表行一致的中性标签，减少复盘上下文切换成本：

- 有 current decision 且 `decisionReview.daysSinceDecision` 可用时，详情显示 `今天决策`、`昨天决策` 或 `N 天前决策`。
- 未决策或缺少 decision age metadata 时，详情继续显示无当前决策状态，不推断决策时间。
- 该标签只是 workflow review metadata，不新增 stale filter、提醒、alert、streak、training grade、AI coaching、analytics、历史记录或评分输入。

### Recently completed change: `opportunity-row-decision-age-summary`

本轮已把当前决策距今天数提升到候选列表行，增强复盘队列的时间新鲜度扫描：

- 有 current decision 且 `decisionReview.daysSinceDecision` 可用的研究候选行显示 `今天决策`、`昨天决策` 或 `N 天前决策`。
- 未决策或缺少 decision age metadata 的候选不会推断决策时间。
- 该摘要只是 workflow review metadata，不新增 stale filter、提醒、alert、streak、training grade、AI coaching、analytics、历史记录或评分输入。

### Recently completed change: `opportunity-evidence-save-blocker-hints`

本轮已给机会工作台的证据保存按钮补上本地禁用原因，降低人工记录时的猜测成本：

- 决策保存不可用时显示一条中性原因，例如缺少判断依据或文本超出上限。
- 行动结果保存不可用时显示一条中性原因，例如未加入研究、缺少执行结果、文本超限、完成日期无效或未来日期。
- 提示只复用现有前端保存条件，不新增语义校验、提醒、alert、streak、training grade、AI coaching、analytics、历史记录或评分输入。

### Recently completed change: `opportunity-evidence-text-length-guidance`

本轮已把已有证据文本上限前置到机会工作台表单，减少人工记录到保存时才发现超限的摩擦：

- 决策依据、决策下一步和行动结果输入框显示当前字数与配置上限。
- 决策或行动结果文本超过既有 schema 上限时，对应保存按钮保持禁用，不提交明显不可保存的证据文本。
- 该提示只是 manual workflow evidence writing guidance，不新增语义校验、提醒、alert、streak、training grade、AI coaching、analytics、历史记录或评分输入。

### Recently completed change: `opportunity-row-decision-reason-summary`

本轮已把已保存的决策依据提升到候选列表行，增强复盘队列的判断证据可扫描性：

- 有 current decision 的研究候选行显示中性 `决策依据 · ...` 摘要。
- 没有 current decision 的候选不会根据评分、推荐、门控、market signals、business metrics、备注或行动结果自动生成决策依据。
- 该摘要只是 user-authored workflow evidence，不新增提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-row-next-action-summary`

本轮已把已保存的决策下一步提升到候选列表行，增强复盘队列的可扫描性：

- 有 current decision 且包含 `nextAction` 的研究候选行显示中性 `下一步 · ...` 摘要。
- 缺少 next action 的候选继续依赖既有 `待下一步` 复盘 badge，不自动生成或推断下一步。
- 该摘要只是 workflow follow-up metadata，不新增提醒、alert、scheduled action、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-clear-stale-action-context`

本轮已收紧行动结果表单的 transient action context 生命周期，降低记录错 action id 的风险：

- 从 daily action 或 practice bucket 显式进入候选时，仍会预填对应 action id。
- 用户手动修改工作台模式、排序、只看工作台、发现筛选、研究筛选或复盘筛选时，会清除 transient action context。
- 没有 saved latest outcome 的候选会回到默认行动类型；已有 saved latest outcome 的候选仍优先显示自己的 action id 和 outcome text。
- 该清理只影响前端瞬时 UI 状态，不新增提醒、alert、streak、training grade、AI coaching、analytics、历史任务或评分输入。

### Recently completed change: `opportunity-row-outcome-gap-badge`

本轮已把候选列表行补成更容易扫描执行证据缺口：

- 已加入研究、未归档且缺少 latest action outcome 的候选行显示中性 `待补行动结果` 提示。
- 已有 latest action outcome 的候选行继续显示 action label、recency label 和 outcome text，不显示缺口提示。
- 该提示只是 workflow practice evidence metadata，不新增 stale filter、提醒、alert、streak、training grade、AI coaching、analytics、持久任务或评分输入。

### Recently completed change: `opportunity-practice-summary-recency-labels`

本轮已把 practice summary 的“最近完成”卡片补成更易扫描的新鲜度展示：

- 有 `latestCompletedAt` 时，主值显示 `今天完成`、`昨天完成` 或 `N 天前完成`。
- 绝对完成时间保留为 secondary detail；无 latest completion 时继续显示 `暂无`。
- 该标签只是 workflow practice coverage metadata，不新增 stale filter、提醒、alert、streak、training grade、AI coaching、analytics、持久任务或评分输入。

### Recently completed change: `opportunity-outcome-recency-labels`

本轮已把 latest action outcome 展示补上中性新鲜度标签：

- selected detail 的行动结果显示绝对完成时间，同时显示 `今天完成`、`昨天完成` 或 `N 天前完成`。
- compact research summary 的行动结果行显示同样的 recency label，便于扫描执行证据是否近期。
- recency label 只是 workflow evidence metadata，不新增 stale filter、提醒、alert、streak、training grade、AI coaching、analytics、持久任务或评分输入。

### Recently completed change: `opportunity-outcome-evidence-prompts`

本轮已把行动结果记录继续推进成更容易复盘的手写证据：

- 行动结果 textarea 会按当前 daily action 显示静态 evidence prompt。
- 用户切换行动类型、或从 daily action / practice bucket 带入 action context 时，prompt 会同步切换。
- prompt 只是人工记录提示，不作为语义校验、提醒、streak、training grade、AI coaching、analytics、持久任务或评分输入。

### Recently completed change: `opportunity-outcome-completion-criteria`

本轮已把行动结果表单和每日行动 playbook 进一步对齐：

- 行动结果表单会显示当前 daily action 的固定 completion criteria。
- 用户切换行动类型、或从 daily action / practice bucket 带入 action context 时，完成定义会同步切换。
- 完成定义只是 workflow practice guidance，不作为保存校验、提醒、streak、training grade、AI coaching、analytics、持久任务或评分输入。

### Recently completed change: `opportunity-action-outcome-date-guard`

本轮已把行动结果完成日期加上证据真实性守卫：

- 后端共享 action outcome 请求 schema 拒绝未来 `completedAt`，API 校验不会保存未来完成证据。
- 机会工作台完成日期控件限制到当前本地日期，保存前也会阻止未来日期提交。
- 主 spec 和开发文档明确 future date guard 只保护 workflow practice evidence。
- 该守卫不新增提醒、streak、training grade、AI coaching、历史任务系统或评分输入。

### Recently completed change: `opportunity-action-outcome-completed-at`

本轮已把行动结果记录推进为更准确的工作流证据：

- 机会工作台的行动结果表单新增完成日期控件。
- 新建行动结果默认使用当前本地日期，已保存结果从 `completedAt` 初始化日期。
- 保存行动结果时通过既有 API 提交 `completedAt`，不新增后端表、历史记录、提醒、streak、训练评分或 AI coaching。
- 完成日期仍是 workflow practice evidence，不改变 score、confidence、recommendation、gates、market signals、business metrics 或 factor contributions。

### Recently completed change: `opportunity-practice-export-filters`

本轮已把练习覆盖筛选接入机会研究导出：

- 导出 filters 支持 `actionOutcome=with|without` 和 `actionId=<daily action id>`。
- 后端 filtered export 复用机会列表 read model，因此导出行能匹配当前练习覆盖视图。
- 前端在没有显式勾选候选时，会把当前 practice filters 带入导出请求；显式勾选的候选仍优先按 `productIds` 导出。
- practice export filters 仍是 workflow evidence，不改变 score、confidence、recommendation、gates、market signals、business metrics 或 factor contributions。

### Recently completed change: `opportunity-action-context`

本轮已把每日行动和练习分桶带入行动结果记录表单：

- 从 daily action 或 practice bucket 进入候选时，前端保留 transient action context。
- 对没有 latest outcome 的候选，行动结果表单默认选中该 action id。
- 已保存的 latest outcome 优先展示，不被 transient context 覆盖。
- context 只作为 workflow UI 辅助，不新增后端字段、历史、提醒、streak、AI coaching、training grade 或评分输入。

### Recently completed change: `opportunity-practice-filters`

本轮已把练习覆盖汇总推进成可操作筛选入口：

- 新增 workflow-only practice filters：按已有/缺少最近行动结果筛选，按 latest action id 筛选。
- 机会列表和研究列表都支持筛选，但筛选只改变返回行，不改变 score、confidence、recommendation、market signals、business metrics 或 factor contributions。
- 机会工作台的 practice summary 卡片和 action bucket 可以直接应用筛选，用于集中补执行证据。
- 不新增行动历史表、提醒、streak、习惯分析、AI coaching、training grade 或持久任务系统。

### Recently completed change: `opportunity-practice-summary`

本轮已把行动结果继续推进成可浏览的练习覆盖汇总：

- 从活跃 research entries 派生 practice summary：活跃数、已记录 outcome、未记录 outcome、按 action id 分桶、最近完成时间。
- 新增只读 summary API，并在机会工作台靠近复盘汇总和每日行动计划处展示。
- summary 只作为工作流练习覆盖证据，不新增历史表、提醒、streak、习惯分析、AI coaching 或评分输入。

### Recently completed change: `opportunity-action-outcomes`

本轮已把每日行动指导继续推进成可记录的执行闭环：

- 在 research entry 上记录最近一次 daily action outcome：action id、执行结果、完成时间和更新时间。
- 增加保存/清除 outcome 的显式 API，并在 read model、列表、对比和导出中暴露。
- 机会工作台在复盘流中展示并手动记录最近行动结果。
- outcome 只作为工作流练习证据，不新增任务历史、提醒、习惯分析、AI 文案或评分输入。

### Recently completed change: `opportunity-action-playbook`

本轮已把每日行动入口继续推进成运营练习清单：

- 在 daily action item 中增加 `learningGoal`、`steps` 和 `completionCriteria`。
- 每类 action 使用固定 playbook 文案：补下一步、复盘过期决策、判断未决策候选、继续调研中候选。
- 机会工作台在“今日行动计划”卡片内展示练习目标、执行步骤和完成定义。
- playbook 只训练工作流习惯，不新增任务表、提醒系统、AI 文案或评分输入。

### Recently completed change: `opportunity-daily-action-plan`

本轮已把复盘汇总继续推进成每日行动入口：

- 从活跃 opportunity research entries 派生有序 daily action items。
- 行动优先级固定为缺下一步、过期决策、未决策候选、继续调研中候选。
- 新增 `GET /api/opportunities/research/action-plan`，每个 action 返回 count、reason 和可应用到现有工作台的 filter state。
- 机会工作台展示“今日行动计划”，点击 action 后切换到对应复盘/发现筛选。
- action plan 只作为工作流练习和运营习惯提示，不改变机会评分、建议、置信度、门控、market signals、business metrics 或因子。

### Recently completed change: `opportunity-review-summary`

本轮已把复盘队列变成每日运营入口：

- 从活跃 opportunity research entries 派生 `totalActive`、`decided`、`undecided`、`needsNextAction`、`stale`、状态分桶和优先级分桶。
- 新增 `GET /api/opportunities/research/summary`，避免前端用多个列表请求拼装队列概览。
- 机会工作台展示活跃研究、未决策、待下一步和需复盘卡片。
- summary 只作为工作流计数，不改变机会评分、建议、置信度、门控或因子。

### Recently completed change: `opportunity-decision-review-loop`

本轮已把机会研究工作区从“记录一次决策”推进到“可复盘、可跟进”的运营能力训练循环：

- 从现有决策字段派生 `decisionReview`，包含是否已决策、决策状态、距决策天数、是否缺少下一步和是否超过 14 天复盘阈值。
- 机会列表和研究列表支持 `decisionStatus`、`decisionReview` 过滤，用于查看已决策、未决策、缺下一步或需复盘候选。
- 前端机会工作台新增发现/复盘模式、复盘筛选和 stale/action-needed badge。
- 决策复盘状态保持非评分元数据，不改变 score、confidence、recommendation、recommendationGate 或 factor contributions。

### Recently completed change: `manual-acquisition-defaults`

本轮已把采集入口收敛到手动优先默认：

- `POST /api/scraper/product/:productId` 保持为显式单品检查入口。
- `POST /api/scraper/all` 默认返回 `enabled=false` no-op，只有 `ACQUISITION_BULK_ENABLED=true` 时才批量入队。
- 队列健康响应暴露 `operationsVisible`，默认 `false`，用于把队列操作定位为诊断/兼容能力。
- 队列状态继续不改变机会评分、市场趋势或业务假设语义。

### Recently completed change: `opportunity-research-workspace`

本轮已把评分候选推进成可行动的选品研究工作流：

- 增加持久化 opportunity research entries：短名单状态、优先级、标签、备注和归档状态。
- 在机会工作台和产品详情中展示/编辑研究状态，不改变机会评分本身。
- 支持候选商品对比视图，横向比较价格、采集健康、市场趋势、业务假设、缺失信号和评分因子。
- 支持 CSV/JSON 导出候选商品，并保留市场代理信号和商家假设的 caveats。
- Chat 先支持只读总结短名单和研究状态，不做隐藏状态写入。

### Next recommended slice after P5

`manual-acquisition-defaults` 完成后，再评估是否继续做更细的 provider 扩展或低频诊断改进：

- 如果单品检查仍不稳定，优先补齐合规 provider 配置、quota 管理和 provider fallback 证据链。
- 如果 Amazon 数据仍不稳定，优先补齐合规 provider 配置、quota 管理和 provider fallback 证据链。
- 如果以后确实需要运营值守，再评估 queue alerting、worker dashboard、审计历史和人工确认式 job control。

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
- [x] 支持当前 go/hold/no-go 决策、证据快照和显式下一步行动。
- [x] 支持决策复盘模式，按已决策、未决策、缺下一步和 14 天 stale 阈值过滤候选。
- [x] 支持复盘汇总卡片，展示活跃研究、未决策、待下一步和需复盘队列。
- [x] 支持每日行动计划，按缺下一步、过期决策、未决策和调研中候选组织操作入口。
- [x] 支持行动指导，展示每类每日行动的练习目标、执行步骤和完成定义。
- [x] 支持练习覆盖汇总，展示活跃研究中的行动结果覆盖、缺失结果和 action bucket 计数。
- [x] 支持决策依据、决策下一步和行动结果表单显示当前字数/上限并阻止超限提交。
- [x] 支持决策和行动结果表单显示保存不可用的本地可修复原因。
- [x] 支持候选列表行显示当前决策距今天数，辅助复盘新鲜度扫描。
- [x] 支持候选商品对比视图，横向比较评分、采集健康、市场趋势、业务假设和缺失信号。
- [x] 支持 CSV/JSON 导出，导出内容保留代理信号和商家假设 caveats。
- [x] Chat 支持只读总结短名单和研究状态，不做隐藏写入。

### P5: 降低自动采集和队列运维权重 ✅

- [x] 保留现有 `scrape_jobs` 和 `scrape_attempts` 作为手动检查、诊断和审计记录。
- [x] 默认关闭批量监控采集，仅在 `ACQUISITION_BULK_ENABLED=true` 时允许 `/api/scraper/all` 入队。
- [x] 默认隐藏队列操作面，仅通过 `operationsVisible` 暴露诊断可见性。
- [x] 完成验证并归档 `manual-acquisition-defaults`。

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
