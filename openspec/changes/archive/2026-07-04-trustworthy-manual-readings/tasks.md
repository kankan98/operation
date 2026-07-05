# 任务清单：trustworthy-manual-readings

> 注：工作区无 pnpm workspace `packages:` 字段，`--filter` 不解析；实际用 `pnpm -C backend exec vitest run` 等在包目录内执行（CI 同此）。

## 1. 后端：最新读数同步商品规范价格（TDD）

- [x] 1.1 先写失败单测：`createSnapshot` 写入最新读数后，`products.currentPrice`/`lastCheckedAt` 更新为该读数的 price/timestamp
- [x] 1.2 先写失败单测：补录的历史（更旧）读数**不**覆盖更新的 `currentPrice`/`lastCheckedAt`
- [x] 1.3 实现：`PriceSnapshotService.createSnapshot` 插入后判定是否最新读数，是则经 `ProductService.updateProduct` 更新商品 `currentPrice`+`lastCheckedAt`
- [x] 1.4 运行后端单测通过

## 2. 后端：价格统计携带来源溯源（TDD）

- [x] 2.1 先写失败单测：`getPriceStats` 返回 `provenance`，新鲜 manual 读数 → `stale=false, trust='high', source='manual'`
- [x] 2.2 先写失败单测：超过 7 天的 manual 读数 → `stale=true, trust='low'`，`label` 含「建议复核」
- [x] 2.3 共享 schema：`shared/schemas/analysis.schema.ts` 的 `priceStatsResponseSchema` 增加 `provenance` 对象；**同步**修改已编译的 `shared/schemas/analysis.schema.js`
- [x] 2.4 后端类型：`backend/src/types/index.ts` 的 `PriceStats` 增加 `provenance` 字段
- [x] 2.5 实现：`PriceAnalysisService.getPriceStats` 取最新快照 source+timestamp，调用 `deriveProvenance` 填充 `provenance`
- [x] 2.6 运行后端单测通过

## 3. 前端：缓存失效与来源展示（TDD）

- [x] 3.1 先写失败单测：`useCreateSnapshot` 成功后失效 `['products']`（保留 `['snapshots']`/`['priceStats']`）
- [x] 3.2 实现：`usePriceStats.ts` 的 `useCreateSnapshot.onSuccess` 追加失效 `['products']` + `['opportunities']`
- [x] 3.3 实现：`ProductDetail.tsx` KPI「当前价格」展示 `priceStats.provenance.label` 与过时提示徽标（stale→warning）
- [x] 3.4 历史表：经核查已存在 `timestamp`(日期) + `source`(来源徽标) 两列，每行已体现来源与时间；新鲜度强调放在后端推导的当前价 provenance 上，避免前端重复阈值逻辑（spec 场景已同步措辞）。同步更新测试 fixture `createMockPriceStats` 增加 provenance
- [x] 3.5 运行前端单测通过

## 4. 验收门禁

- [x] 4.1 backend lint（0 error，1 处既有 warning 与本变更无关）
- [x] 4.2 backend build（tsc 通过）
- [x] 4.3 backend 全量测试：47 文件 / 400 passed
- [x] 4.4 frontend 全量测试：23 文件 / 104 passed + 6 skipped
- [x] 4.5 frontend build（vite 通过）
- [x] 4.6 `openspec validate trustworthy-manual-readings --strict` valid；主规格库 90 passed / 0 failed
- [x] 4.7 真实 HTTP 冒烟：建品 currentPrice=null → POST manual 79.99 → 商品 currentPrice=79.99/lastCheckedAt 更新；price-stats 返回 provenance（source=manual, stale=false, trust=high, label=手动录入）
