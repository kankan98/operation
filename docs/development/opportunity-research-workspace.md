# Opportunity Research Workspace

> **TL;DR**: opportunity research workspace 把机会评分候选商品转成可保存、标注、对比和导出的研究工作流。它保存用户研究状态，但不改变机会评分；导出和 Chat 解释必须保留市场代理信号、业务假设和非评分元数据的 caveats。

---

## 适用范围

研究工作区用于人工选品决策过程中的状态管理：

- 将商品加入短名单。
- 保存研究状态、优先级、标签和备注。
- 从机会工作台按短名单、状态或标签过滤候选商品。
- 横向对比多个候选商品的评分、采集健康、市场趋势、业务假设和缺失信号。
- 导出 CSV/JSON 供后续供应链核查或人工评审。
- 允许 Chat 只读总结单个商品研究状态或短名单列表。

它不用于：

- 改变 opportunity score、factor contribution、confidence 或 recommendation。
- 替代销量、需求、利润、ROI 或广告事实验证。
- 通过 Chat 静默新增、打标签、改状态或归档研究条目。
- 管理多人协作、权限、审批或长期审计历史。

---

## 数据模型

`opportunity_research_entries` 以 `productId` 为唯一键，每个商品最多一条研究记录：

- `status`: `researching`、`watching`、`ready`、`rejected`
- `priority`: `low`、`medium`、`high`
- `tagsJson`: 归一化后的标签数组 JSON
- `notes`: 可为空，最长 2000 字符
- `archived`: 归档标记，默认列表不返回归档项
- `createdAt` / `updatedAt`: 毫秒时间戳

商品删除时必须同步删除研究记录，避免 orphaned shortlist rows。研究记录与商品、价格快照、market signals 和 business signals 分表保存，避免把用户工作流状态混进产品身份或评分输入。

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
GET /api/opportunities/products/:productId/research
PUT /api/opportunities/products/:productId/research
PATCH /api/opportunities/products/:productId/research
POST /api/opportunities/products/:productId/research/archive
DELETE /api/opportunities/products/:productId/research
```

机会列表研究筛选：

```http
GET /api/opportunities/products?shortlisted=true&researchStatus=ready&researchTag=launch
```

对比和导出：

```http
POST /api/opportunities/research/compare
POST /api/opportunities/research/export
```

对比最多 6 个商品。导出最多 100 行，支持 `format: "csv"` 或 `format: "json"`，请求必须提供 `productIds` 或 `filters`。使用 `filters` 导出时复用机会列表 read model，因此导出内容与当前评分、采集健康、market signals 和 business signals 保持一致。

---

## 导出安全

CSV 和 JSON 每行都必须包含：

- product identity: `productId`、`title`、`platform`、`category`
- price context: `currentPrice`、`currency`
- scoring context: `score`、`confidence`、`recommendation`、`topReasons`、`missingSignals`
- research state: `researchStatus`、`researchPriority`、`researchTags`、`researchNotesSummary`
- caveats: `marketSignalCaveat`、`businessSignalCaveat`、`scoreCaveat`

固定 caveat 语义：

- market signals: rank/review/price trends 是代理证据，不是已验证销量或需求事实。
- business signals: margin、ROI、盈亏平衡价等依赖商家输入假设，不是平台验证利润事实。
- score: 研究状态、优先级、标签和备注不改变机会评分或因子贡献。

不要为了让导出更“好看”删除 caveat 列。导出文件经常离开系统 UI，caveat 字段是防止误用代理信号的最后一道解释边界。

---

## Chat 只读行为

Chat 当前只能读取研究状态：

- `getOpportunityResearchStatus`: 读取单个商品的研究状态、优先级、标签、备注摘要、机会评分和 caveats。
- `listShortlistedOpportunities`: 读取非归档短名单，支持按 status/tag 过滤。

当用户要求“把这个商品加入短名单”“给它打标签”“改成 ready”“归档这个机会”时，Chat 应解释当前对话工具不能静默修改研究工作区，需要用户在机会研究工作台 UI 中完成。未来如果加入写工具，必须先设计显式确认、审计和冲突处理流程。

---

## 前端缓存规则

研究状态 mutation 成功后需要失效：

- `opportunities`
- `opportunity`
- `opportunity-research`
- `opportunity-research-list`
- `product`

这样机会工作台、产品详情和研究列表不会出现一个页面已更新、另一个页面仍显示旧状态的漂移。

---

## 验证命令

```bash
pnpm --filter backend lint
pnpm --filter backend build
pnpm --filter backend test -- opportunityResearchSchema opportunityResearch.api opportunityScoringService opportunities.api chatService openapi.opportunityResearch
pnpm --filter backend test
pnpm --filter frontend test -- Opportunities ProductDetail
pnpm --filter frontend build
openspec validate --changes opportunity-research-workspace --json
openspec validate --specs --json
```
