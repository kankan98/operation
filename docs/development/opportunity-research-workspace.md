# Opportunity Research Workspace

> **TL;DR**: opportunity research workspace 把机会评分候选商品转成可保存、标注、决策、复盘、每日行动、行动指导、行动结果、练习覆盖汇总、对比和导出的研究工作流。它保存用户研究状态、决策跟进状态和最近一次行动执行证据，并派生练习覆盖 read model，但不改变机会评分；导出、行动计划、练习覆盖和 Chat 解释必须保留市场代理信号、业务假设和非评分元数据的 caveats。

---

## 适用范围

研究工作区用于人工选品决策过程中的状态管理：

- 将商品加入短名单。
- 保存研究状态、优先级、标签和备注。
- 保存当前 go/hold/no-go 决策、判断依据、下一步行动和当时的评分快照。
- 从机会工作台按短名单、研究状态、标签、决策状态或复盘状态过滤候选商品。
- 复盘缺少下一步行动或超过 14 天未回看的决策。
- 在候选列表行显示已保存的决策依据，方便复盘时快速看到人工判断证据。
- 在候选列表行显示已保存的决策下一步行动，方便把复盘队列当成操作清单扫描。
- 在候选对比表的决策列显示已保存的决策下一步行动，方便横向比较候选跟进承诺。
- 在候选对比表的决策列显示已保存的快照分数和建议，方便区分决策当时证据和当前评分。
- 在候选对比表的决策列显示已保存的快照置信度，方便横向比较保存决策时的证据可靠度。
- 在候选对比表的决策列显示已保存的快照时间，方便横向比较决策证据快照的新旧。
- 在候选对比表的决策列显示已保存的快照门控、门控原因、信号和下一步，方便横向比较保存决策时推荐是否被门控降级或拦截。
- 在候选对比表的决策列显示已保存的快照依据和快照缺口，方便横向比较保存决策时的评分证据和缺失信号。
- 在候选对比表的决策列显示已保存的快照业务完整度和快照业务缺口，方便横向比较保存决策时业务假设是否完整。
- 在候选对比表的决策列显示已保存的快照业务指标，方便横向比较保存决策时的假设单位经济性。
- 在候选对比表的决策列显示已保存的快照市场状态、来源、置信度、新鲜度和缺口，方便横向比较保存决策时市场代理信号是否可用。
- 在候选对比表的决策列显示已保存的快照市场因子，方便横向比较保存决策时具体市场代理趋势证据。
- 在候选对比表的决策列显示当前决策复盘 badge 和决策距今天数，方便横向比较候选处理优先级。
- 在候选列表行显示当前决策距今天数，方便扫描决策新鲜度。
- 在选中候选的决策详情中用 `决策依据 · ...` 和 `下一步 · ...` 标注已保存决策证据，保持和候选列表行一致。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照时间`，帮助区分证据快照时间和决策记录时间。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照置信度`，帮助回看当时评分证据可靠度。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照依据 · ...` 和 `快照缺口 · ...`，帮助回看当时评分证据和缺口。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照业务完整度` 和 `快照业务缺口`，帮助回看当时业务假设是否完整。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照业务指标`，帮助回看当时假设净利率、ROI、盈亏平衡价和单件贡献。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照市场状态`、来源、置信度、新鲜度和缺口，帮助回看当时市场代理信号是否可用。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照市场因子`，帮助回看当时具体市场代理趋势证据。
- 在选中候选的决策详情中显示已保存决策快照里的 `快照门控`、门控原因、信号和下一步，帮助区分保存时门控与当前门控。
- 在选中候选的决策详情中对 `needsNextAction` 显示中性“待补下一步”提示，帮助在决策证据块内看到跟进缺口。
- 在选中候选的决策详情中显示同一套 `今天决策`、`昨天决策` 或 `N 天前决策` 标签，保持复盘上下文一致。
- 查看活跃研究队列汇总，快速知道未决策、缺下一步和需复盘的工作量。
- 查看每日行动计划，按缺下一步、过期决策、未决策候选和调研中候选排序处理工作流。
- 查看每日行动计划生成时间，确认当前行动指导来自哪一次 read model。
- 查看每个每日行动的练习目标、执行步骤和完成定义。
- 记录每个研究条目的最近一次每日行动结果，形成指导、执行、记录的轻量闭环。
- 阻止把未来日期保存为最近一次行动完成证据，避免练习覆盖提前显示为已完成。
- 在行动结果表单中显示当前行动类型的完成定义，帮助记录更一致的执行证据。
- 行动结果输入框按当前行动类型显示静态证据记录提示，帮助写出可复盘的结果文本。
- 决策依据、决策下一步和行动结果输入框显示当前字数和保存上限，超出上限时阻止提交。
- 决策或行动结果暂不可保存时，表单显示一条本地可修复原因，减少用户猜测。
- 对最近一次行动结果显示 `今天完成`、`昨天完成` 或 `N 天前完成` 的中性新鲜度标签，便于扫描执行证据。
- 候选列表行在已有最近一次行动结果时显示保存的完成时间，便于扫描时审计执行证据记录时间。
- 候选列表行对已加入研究、未归档且缺少最近一次行动结果的候选显示中性“待补行动结果”提示，便于扫描执行证据缺口。
- 选中候选的行动结果详情对 active research 缺少 latest outcome 的状态显示同一中性“待补行动结果”提示，便于在记录入口处看到证据缺口。
- 候选对比表显示已保存的最近一次行动结果和完成时间，方便横向比较候选执行证据。
- 查看练习覆盖汇总，知道活跃研究条目中哪些已有最近一次行动结果、哪些还缺执行证据。
- 查看练习覆盖汇总生成时间，确认当前练习覆盖数字来自哪一次 read model。
- 从练习覆盖汇总筛选未记录行动结果或指定 action bucket 的候选，集中补执行证据。
- 从每日行动或练习分桶进入候选后，行动结果表单会带入当前 action context，减少记录错 action id。
- 横向对比多个候选商品的评分、采集健康、市场趋势、业务假设和缺失信号。
- 导出 CSV/JSON 供后续供应链核查或人工评审。
- 允许 Chat 只读总结单个商品研究状态或短名单列表。

它不用于：

- 改变 opportunity score、factor contribution、confidence 或 recommendation。
- 替代销量、需求、利润、ROI 或广告事实验证。
- 通过 Chat 静默新增、打标签、改状态或归档研究条目。
- 管理多人协作、权限、审批或长期审计历史。
- 记录完整行动历史、提醒、打卡 streak、习惯分析或 AI 生成教练文案。

---

## 数据模型

`opportunity_research_entries` 以 `productId` 为唯一键，每个商品最多一条研究记录：

- `status`: `researching`、`watching`、`ready`、`rejected`
- `priority`: `low`、`medium`、`high`
- `tagsJson`: 归一化后的标签数组 JSON
- `notes`: 可为空，最长 2000 字符
- `archived`: 归档标记，默认列表不返回归档项
- `decisionStatus`: `go`、`hold`、`no_go`，为空表示当前未决策
- `decisionReason`: 当前决策的人工判断依据，最长 1200 字符
- `decisionNextAction`: 可为空的下一步行动，最长 400 字符
- `decisionSnapshotJson`: 保存决策时的机会评分证据快照
- `decidedAt` / `decisionUpdatedAt`: 决策记录和更新的毫秒时间戳
- `lastActionId`: 最近一次行动结果对应的 daily action id，可为空
- `lastActionOutcome`: 最近一次行动执行结果，可为空，最长 600 字符
- `lastActionCompletedAt` / `lastActionUpdatedAt`: 最近一次行动完成和更新的毫秒时间戳
- `createdAt` / `updatedAt`: 毫秒时间戳

商品删除时必须同步删除研究记录，避免 orphaned shortlist rows。研究记录与商品、价格快照、market signals 和 business signals 分表保存，避免把用户工作流状态混进产品身份或评分输入。

---

## 决策复盘规则

`decisionReview` 是 read model 派生字段，不新增复盘表，也不改变评分输入。它从当前 `decisionStatus`、`decisionNextAction` 和 `decidedAt` 推导：

- `hasDecision`: 是否存在当前决策。
- `status`: 当前决策状态，未决策为 `null`。
- `daysSinceDecision`: 从 `decidedAt` 到当前时间的天数，未决策为 `null`。
- `hasNextAction`: 是否填写下一步行动。
- `needsNextAction`: `go` 或 `hold` 决策缺少下一步行动时为 `true`。
- `stale`: 决策达到或超过 14 天时为 `true`。

复盘状态只用于工作流筛选和 UI badge。候选列表行和选中候选决策详情可以显示已保存的 `decisionReason` 作为 `决策依据 · ...` 用户手写判断证据摘要，也可以显示已保存的 `decisionNextAction` 作为 `下一步 · ...` 中性工作流跟进摘要；候选对比表的决策列也可以显示已保存 `decisionNextAction` 作为 `下一步 · ...`，用于横向比较候选跟进承诺；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.score` 和 `decisionSnapshotJson.recommendation` 作为 `快照 ...`，用于区分决策当时的评分证据和当前 score/recommendation；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.confidence` 作为 `快照置信度`，用于横向比较保存决策时的评分证据可靠度，且不能从当前 opportunity confidence、score/recommendation 或渲染时间回填；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.capturedAt` 作为 `快照时间`，用于横向比较决策证据快照的新旧，且不能从 decision `decidedAt`、`updatedAt` 或渲染时间回填；若已保存 `decisionSnapshotJson.recommendationGate` 不是空白 clear 状态，候选对比表的决策列也可以显示 `快照门控` 和已保存推荐转化，用于横向比较保存决策时推荐是否被门控降级或拦截，且不能从当前 opportunity recommendation gate 回填；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.keyReasons` 和 `decisionSnapshotJson.missingSignals` 作为 `快照依据 · ...` 和 `快照缺口 · ...`，用于横向比较保存决策时的评分证据和缺口，且不能从当前 opportunity keyReasons、missingSignals、factor explanations 或备注回填；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.businessSignals.completeness` 与 `decisionSnapshotJson.businessSignals.missingSignals` 作为 `快照业务完整度` 和 `快照业务缺口`，用于横向比较保存决策时成本、费用等业务假设是否完整，且不能从当前 opportunity business signals 或 business metrics 回填；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.businessSignals.metrics` 的 netMargin、ROI、breakevenSellPrice 和 contributionProfitPerUnit 作为 `快照业务指标`，用于横向比较保存决策时的假设单位经济性，且不能从当前 opportunity business metrics 回填或重算；候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.marketSignals` 的 status、provider/source、confidence、freshnessMs 和 missingSignals 作为 `快照市场状态`、`快照市场来源`、`快照市场置信度`、`快照市场新鲜度` 和 `快照市场缺口`，用于横向比较保存决策时市场代理趋势证据是否新鲜和完整，且不能从当前 opportunity market signals 或 market factors 回填；选中候选决策详情还可以显示已保存 `decisionSnapshotJson.capturedAt` 作为 `快照时间`，用于区分保存决策时的证据快照时间和决策记录时间；也可以显示已保存 `decisionSnapshotJson.confidence` 作为 `快照置信度`，用于回看保存决策时的评分证据可靠度；也可以显示已保存 `decisionSnapshotJson.keyReasons` 和 `decisionSnapshotJson.missingSignals` 作为 `快照依据 · ...` 与 `快照缺口 · ...`，用于回看保存决策时的评分证据和缺口；也可以显示已保存 `decisionSnapshotJson.businessSignals.completeness` 与 `decisionSnapshotJson.businessSignals.missingSignals` 作为 `快照业务完整度` 和 `快照业务缺口`，用于回看保存决策时成本、费用等业务假设是否完整；也可以显示已保存 `decisionSnapshotJson.businessSignals.metrics` 的 netMargin、ROI、breakevenSellPrice 和 contributionProfitPerUnit 作为 `快照业务指标`，用于回看保存决策时的假设单位经济性；也可以显示已保存 `decisionSnapshotJson.marketSignals` 的 status、provider/source、confidence、freshnessMs 和 missingSignals 作为 `快照市场状态`、`快照市场来源`、`快照市场置信度`、`快照市场新鲜度` 和 `快照市场缺口`，用于回看保存决策时市场代理趋势证据是否新鲜和完整；也可以显示已保存 `decisionSnapshotJson.marketSignals.factors` 的 label、rawValue 和 explanation 作为 `快照市场因子`，用于回看保存决策时具体市场代理趋势证据。若已保存 `decisionSnapshotJson.recommendationGate` 不是空白 clear 状态，选中候选决策详情也可以显示 `快照门控`、`快照门控原因`、`快照门控信号` 和 `快照门控下一步`，用于回看保存决策时推荐是否被门控拦截或降级。当 `needsNextAction` 为真时，选中候选决策详情也可以显示中性“待补下一步”提示，把缺口放在保存决策证据附近。有当前决策且 `daysSinceDecision` 不为空时，候选列表行和选中候选决策详情都可以显示 `今天决策`、`昨天决策` 或 `N 天前决策` 的中性决策时间摘要，帮助扫描复盘新鲜度。缺少决策、缺少决策下一步、缺少决策时间 metadata、缺少 decision review metadata、快照证据数组为空、快照业务信号为 null 或缺失、快照业务指标为 null 或缺失、快照市场信号为 null 或缺失、快照市场因子为空或快照门控为空白 clear 状态时，不能根据评分、推荐、当前 score/recommendation、当前置信度、当前门控、当前业务信号、当前 business metrics、当前 market signals、当前 market factors、备注、当前机会 reasons/missing signals、行动结果、决策记录时间、决策更新时间、daily action plan metadata 或当前渲染时间自动生成决策依据、快照时间、快照依据、快照置信度、快照业务摘要、快照业务指标、快照市场摘要、快照市场因子、快照门控、决策时间、快照分数建议或下一步，缺少下一步时继续依赖 `needsNextAction` badge 和详情缺口提示，不自动生成或推断下一步。即使 `daysSinceDecision` 随时间变化，或用户补充了 `decisionReason` / `decisionNextAction`，也不能改变 `score`、`confidence`、`recommendation`、`recommendationGate` 或任何 factor contribution。

候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.marketSignals.factors` 的 label、rawValue 和 explanation 作为 `快照市场因子`，用于横向比较保存决策时具体市场代理趋势证据；该展示只能读取 saved snapshot factors，不能从当前 opportunity market factors、market signals、score/recommendation、notes、action outcomes、review metadata、daily action plan metadata 或渲染时间回填。

候选对比表的决策列也可以显示已保存 `decisionSnapshotJson.recommendationGate` 的 reasons、signals 和 nextActions 作为 `快照门控原因`、`快照门控信号` 和 `快照门控下一步`，用于横向比较保存决策时推荐被门控的具体原因、触发信号和补充动作；该展示只能读取 saved snapshot gate details，不能从当前 opportunity recommendation gate、score/recommendation、missing signals、market signals、business metrics、notes、action outcomes、review metadata、daily action plan metadata 或渲染时间回填。

候选对比表的决策列也可以显示当前 `research.decisionReview` 的 `待下一步`、`需复盘` badge 和 `daysSinceDecision` 派生的 `今天决策`、`昨天决策` 或 `N 天前决策`，用于横向比较候选处理优先级；该展示只能读取 current decisionReview metadata，不能从 decision `decidedAt`、`updatedAt`、saved snapshot、notes、action outcomes、daily action plan metadata、practice summary counts 或当前渲染时间回填。

前端决策表单会显示 `decisionReason` 和 `decisionNextAction` 的当前字数与配置上限，并提供 `填入决策框架` 控件：当 `decisionReason` 为空时，可按当前选择的 go/hold/no_go 决策状态填入可编辑的静态证据框架；用户切换决策状态后，填入框架同步使用新状态；已有判断依据文本时控件不可用，避免覆盖手写证据。缺少必填判断依据或文本超出上限时，保存按钮保持禁用，并在保存控件附近显示一条本地可修复原因，避免把明显不可保存的人工证据提交给 API；填入框架不会自动保存，也不会改变决策快照、评分、推荐、门控、市场信号、业务指标或 factor contribution；这些提示和框架不是语义评分、AI coaching、提醒、streak、training grade、analytics、持久任务系统或评分输入。

---

## 标签和备注规则

标签保存前统一执行：

1. `trim`
2. 转小写
3. 删除空标签
4. 按首次出现顺序去重
5. 最多 10 个标签
6. 每个标签最长 32 字符

备注允许 `null`，最长 2000 字符。对外列表和 Chat 工具使用 `notesSummary`，最长 240 字符，避免在列表和对话里泄露过长自由文本。

---

## API 语义

研究条目 CRUD：

```http
GET /api/opportunities/research?status=researching&priority=high&tag=launch&page=1&limit=20
GET /api/opportunities/research?decisionStatus=go&decisionReview=needs_action
GET /api/opportunities/research?actionOutcome=without
GET /api/opportunities/research?actionId=add_next_action
GET /api/opportunities/products/:productId/research
PUT /api/opportunities/products/:productId/research
PATCH /api/opportunities/products/:productId/research
PUT /api/opportunities/products/:productId/research/decision
DELETE /api/opportunities/products/:productId/research/decision
PUT /api/opportunities/products/:productId/research/action-outcome
DELETE /api/opportunities/products/:productId/research/action-outcome
POST /api/opportunities/products/:productId/research/archive
DELETE /api/opportunities/products/:productId/research
```

机会列表研究筛选：

```http
GET /api/opportunities/products?shortlisted=true&researchStatus=ready&researchTag=launch
GET /api/opportunities/products?decisionStatus=hold&decisionReview=stale
GET /api/opportunities/products?actionOutcome=with
GET /api/opportunities/products?actionId=decide_candidates
```

`decisionReview` 支持 `all`、`decided`、`undecided`、`needs_action`、`stale`。`actionOutcome` 支持 `with` 和 `without`，分别筛选已有或缺少最近行动结果的非归档研究条目；`actionId` 支持固定 daily action id，用于筛选最近行动结果来自某个 action bucket 的条目。这些筛选只改变列表返回行，不改变 score、confidence、recommendation、market signal、business metric 或 factor contribution。

复盘汇总：

```http
GET /api/opportunities/research/summary
```

summary 默认只统计未归档研究条目，返回 `totalActive`、`decided`、`undecided`、`needsNextAction`、`stale`、`byStatus`、`byPriority`、`generatedAt` 和 `caveat`。前端显示 returned `generatedAt` 作为中性 `汇总时间`，只用于说明当前复盘汇总 read model 的生成时间；加载中或缺少 summary/generated time 时不从 render time、daily action plan、practice summary、action outcome、decision metadata 或评分/市场/业务信号回填。复盘汇总卡片也可以直接应用现有复盘筛选：`活跃研究` 对应 `workspaceMode=review&shortlisted=true&decisionReview=all`，`未决策` 对应 `decisionReview=undecided`，`待下一步` 对应 `decisionReview=needs_action`，`需复盘` 对应 `decisionReview=stale`。当当前 UI 筛选正好匹配某个复盘汇总队列时，对应卡片显示 `当前队列` 并设置 `aria-pressed=true`；如果额外 discovery/research/decision-status/practice 筛选继续窄化候选列表，则不把任何复盘汇总卡片标为 active，避免把窄化视图误表达成完整队列。切换复盘汇总筛选时会清除 transient action context，避免每日行动或练习分桶上下文污染新的候选集合。这些数字、标签、active state 和筛选入口是工作流队列计数与导航，不是销量、需求、利润、ROI、评分证据、提醒、alert、streak 或 training grade。

练习覆盖汇总：

```http
GET /api/opportunities/research/practice-summary
```

practice summary 默认只统计未归档研究条目，返回 `totalActive`、`withOutcome`、`withoutOutcome`、`byActionId`、`latestCompletedAt`、`generatedAt` 和 `caveat`。`byActionId` 固定包含 `add_next_action`、`review_stale_decisions`、`decide_candidates` 和 `continue_research`，没有记录时也返回 `0`。前端的最近完成卡片用 `latestCompletedAt` 显示 `今天完成`、`昨天完成` 或 `N 天前完成` 的中性 recency label，并保留绝对完成时间作为细节；没有最新完成时间时仍显示 `暂无`。前端也显示 returned `generatedAt` 作为中性 `汇总时间`，只用于说明当前练习覆盖 read model 的生成时间；加载中或缺少 summary 时不从 render time、daily action plan、review summary、action outcome、decision metadata 或评分/市场/业务信号回填。这些数字和标签只表示 workflow practice coverage，不是销量、需求、利润、ROI、score、market signal、business metric、提醒、alert、streak 或 training grade。

前端 practice summary 卡片可以直接应用练习筛选：`练习覆盖` 对应 `actionOutcome=with`，`未记录结果` 对应 `actionOutcome=without`，action bucket 对应 `actionId=<daily action id>`。当当前 UI 筛选正好匹配某个练习覆盖筛选入口时，对应控件显示 `当前练习筛选` 并设置 `aria-pressed=true`；如果额外 discovery/research/review/shortlist/operations 筛选继续窄化候选列表，则不把任何 practice summary 控件标为 active，避免把窄化视图误表达成完整练习覆盖队列。筛选标签必须显示为工作流练习筛选，不能表达为市场证据、评分提升或训练等级。

每日行动计划：

```http
GET /api/opportunities/research/action-plan
```

action plan 默认只统计未归档研究条目，返回按固定优先级排序的 `items`、`generatedAt` 和 `caveat`。每个 item 包含 `id`、`label`、`reason`、`learningGoal`、`steps`、`completionCriteria`、`priority`、`count` 和 `filters`。当前 action id 包括：

- `add_next_action`: go/hold 决策缺少下一步行动。
- `review_stale_decisions`: 决策达到 14 天复盘阈值。
- `decide_candidates`: 活跃但尚未决策的候选。
- `continue_research`: `researching` 状态的候选。

`filters` 只指向已有机会工作台筛选状态，例如 `workspaceMode=review&decisionReview=needs_action`。前端在 daily action plan panel 中显示 returned `generatedAt` 作为中性 `计划时间`，只用于说明当前行动指导 read model 的生成时间；加载中或缺少 plan 时不从 render time、review summary、practice summary、action outcome、decision metadata 或评分/市场/业务信号回填。当当前 UI 筛选正好匹配从每日行动卡片进入的某个 action item 时，该卡片显示 `当前行动` 并设置 `aria-pressed=true`；若额外 discovery、research、review、practice、shortlist、operations 或 decision-status 筛选继续窄化候选列表，或 transient action context 缺失/不是 daily action 来源，则不把任何 daily action item 标为 active，避免把窄化视图误表达成完整行动队列。`learningGoal`、`steps` 和 `completionCriteria` 是按 action id 派生的固定 playbook 文案，用于训练操作习惯；它们不是 AI 生成建议，不新增持久任务、提醒、日历或自动决策，也不改变评分。

行动结果：

```http
PUT /api/opportunities/products/:productId/research/action-outcome
DELETE /api/opportunities/products/:productId/research/action-outcome
```

action outcome 只记录 research entry 上的最近一次执行结果，字段包括 `actionId`、`outcome`、`completedAt` 和 `updatedAt`。保存时必须使用 daily action id，`outcome` 会 trim 并限制到最长 600 字符；`completedAt` 必须小于或等于当前服务端时间，未来完成时间会被请求校验拒绝。前端允许用户选择完成日期，默认是当前本地日期，日期控件限制到当前本地日期，保存前也会阻止未来日期提交；表单会随当前 action id 显示固定 completion criteria，并在完成定义区显示 `适用行动 · ...`，在 outcome 输入框提供静态 evidence prompt、同内容的可见 `证据提示 · ...`、按 action id 派生的 `证据样例 · ...`（提示和样例同时作为输入框的辅助描述）和当前字数/上限提示，帮助用户按同一完成定义记录可复盘且可保存的执行证据。表单还提供 `填入记录框架` 控件：当 outcome 为空时，可按当前 action id 填入可编辑的静态记录框架；已有 outcome 文本时该控件不可用，避免覆盖用户手写内容；填入框架不会自动保存，用户仍需检查并点击保存。没有 saved latest outcome 时，表单也显示 `当前将保存 · ...` 的中性摘要，明确当前选择的 action id；用户切换行动类型或 transient context 预选行动类型时，该摘要、完成定义适用行动、可见证据提示、证据样例和记录框架同步更新，已有 saved latest outcome 时不显示单独的未保存摘要。缺少研究条目、缺少 outcome、outcome 超出上限、完成日期无效或未来日期时，保存按钮保持禁用，并在保存控件附近显示一条本地可修复原因；保存按钮引用可见保存范围说明，禁用且有本地可修复原因时也引用该保存提示；这些提示、样例和记录框架不做语义校验、AI coaching、提醒、streak、training grade、analytics、历史记录或评分输入。latest outcome 展示会附带基于本地日期的中性 recency label，例如 `今天完成`、`昨天完成` 或 `N 天前完成`，用于扫描证据新鲜度；候选列表行、候选对比表和选中候选行动结果详情在已有 latest outcome 时显示 action label、recency label、outcome text 和保存的 completion time；候选列表行和选中候选行动结果详情在 active research 缺少 latest outcome 时显示中性“待补行动结果”提示，候选对比表缺少 latest outcome 时只显示中性“未记录”状态，不从 notes、决策、review metadata、daily action plan 或 practice summary 回填完成时间或行动结果；未加入研究或已归档的候选不显示 active outcome gap。清除时只清除 latest outcome 字段，不改研究状态、备注、标签、当前决策或评分输入。它是复盘练习证据，不是销量、需求、利润、ROI、market signal、business metric、提醒、alert、streak、training grade 或 score evidence。

前端的 action context 是瞬时 UI 状态：从每日行动卡片或 practice summary action bucket 进入候选时，会在没有保存过 latest outcome 的情况下预选对应 action id，并显示该 action id 的完成定义和 outcome prompt。行动结果表单会把来源标成 `来自每日行动` 或 `来自练习分桶`，帮助用户理解为什么行动类型被预选；该来源标签只在 transient context 生效且没有 saved latest outcome 时显示。同一个 context chip 也会暴露包含来源、预选 action 和手动改选保存目标的整体语义标签，便于把当前 transient context 状态作为一个整体读取；saved latest outcome 生效时不暴露 transient context 语义。它不会自动保存，不新增任务状态、提醒、历史或训练评分；用户仍可在保存前手动切换 action id，完成定义和提示也随选择同步切换。如果用户把行动类型改成不同于 transient context 的 action id，表单会显示 `已手动改选`、`预选 · ...` 和 `将保存 · ...`，明确区分进入队列的原始 action 和本次保存将提交的 action id。用户手动修改工作台模式、排序、只看工作台、发现筛选、研究筛选或复盘筛选时，前端会清除 transient action context，让没有保存 latest outcome 的候选回到默认行动类型，避免旧 action context 污染新的候选集合；已保存的 latest outcome 仍优先显示自己的 action id 和 outcome 文本，且不显示 transient context 来源标签或手动改选提示。

对比和导出：

```http
POST /api/opportunities/research/compare
POST /api/opportunities/research/export
```

对比最多 6 个商品。导出最多 100 行，支持 `format: "csv"` 或 `format: "json"`，请求必须提供 `productIds` 或 `filters`。使用 `filters` 导出时复用机会列表 read model，因此导出内容与当前评分、采集健康、market signals 和 business signals 保持一致。导出 filters 支持 `actionOutcome=with|without` 和 `actionId=<daily action id>`，用于把当前练习覆盖视图导出到 CSV/JSON；这些筛选仍只影响导出行，不改变评分、置信度、推荐、门控、market signals、business metrics 或 factor contributions。

前端导出规则：

- 如果用户勾选了候选商品，导出优先使用显式 `productIds`，不再被当前练习筛选缩窄。
- 如果用户没有勾选候选商品，而当前存在 shortlist、研究、复盘或练习筛选，则导出使用当前 filter state。
- 练习筛选导出必须保留 action outcome 字段和 caveat，不能表达为评分证据或训练等级。

---

## 导出安全

CSV 和 JSON 每行都必须包含：

- product identity: `productId`、`title`、`platform`、`category`
- price context: `currentPrice`、`currency`
- scoring context: `score`、`confidence`、`recommendation`、`topReasons`、`missingSignals`
- research state: `researchStatus`、`researchPriority`、`researchTags`、`researchNotesSummary`
- decision state: `decisionStatus`、`decisionReason`、`decisionNextAction`、`decidedAt`、`decisionSnapshotScore`、`decisionSnapshotRecommendation`
- action outcome: `lastActionId`、`lastActionOutcome`、`lastActionCompletedAt`
- caveats: `marketSignalCaveat`、`businessSignalCaveat`、`scoreCaveat`

固定 caveat 语义：

- market signals: rank/review/price trends 是代理证据，不是已验证销量或需求事实。
- business signals: margin、ROI、盈亏平衡价等依赖商家输入假设，不是平台验证利润事实。
- score: 研究状态、优先级、标签、备注、决策复盘元数据、复盘汇总计数、每日行动计划、行动指导和行动结果不改变机会评分或因子贡献。
- practice summary: 练习覆盖只来自 active research entries 的最近一次行动结果，不能作为销量、需求、利润、ROI、market signal、business metric、score evidence 或训练评分。

不要为了让导出更“好看”删除 caveat 列。导出文件经常离开系统 UI，caveat 字段是防止误用代理信号的最后一道解释边界。

---

## Chat 只读行为

Chat 当前只能读取研究状态：

- `getOpportunityResearchStatus`: 读取单个商品的研究状态、优先级、标签、备注摘要、机会评分和 caveats。
- `listShortlistedOpportunities`: 读取非归档短名单，支持按 status/tag 过滤。

当用户要求“把这个商品加入短名单”“给它打标签”“改成 ready”“保存决策”“归档这个机会”时，Chat 应解释当前对话工具不能静默修改研究工作区，需要用户在机会研究工作台 UI 中完成。未来如果加入写工具，必须先设计显式确认、审计和冲突处理流程。

---

## 前端缓存规则

研究状态、决策或行动结果 mutation 成功后需要失效：

- `opportunities`
- `opportunity`
- `opportunity-research`
- `opportunity-research-list`
- `opportunity-research-summary`
- `opportunity-practice-summary`
- `opportunity-daily-action-plan`
- `product`

这样机会工作台、产品详情和研究列表不会出现一个页面已更新、另一个页面仍显示旧状态的漂移。

---

## 验证命令

```bash
pnpm --filter backend lint
pnpm --filter backend build
pnpm --filter backend test -- opportunityResearchSchema opportunityResearch.api opportunityScoringService opportunities.api openapi.opportunityResearch
pnpm --filter backend test
pnpm --filter frontend test -- Opportunities ProductDetail
pnpm --filter frontend build
openspec validate opportunity-practice-export-filters --strict
openspec validate --specs --json
```
