## Why

项目已确定方向为「手动优先的选品研究助手」，核心承诺是**每个数据点都带来源/新鲜度，缺失或过时数据绝不伪装成已验证事实**。但当前实现有两处缺口直接违背这一承诺，损害单人选品的决策可信度：

1. **手动录入不更新商品事实源**：`PriceSnapshotService.createSnapshot` 只写入 `price_snapshots` 表，**不更新** `products.currentPrice` 与 `products.lastCheckedAt`。而浏览器采集路径（`scraperService`）会更新这两个字段。结果是：用户手动录入今天的新价后，商品列表卡片、机会工作台仍显示旧价，并因 `lastCheckedAt` 不变而**永久挂着"已过时（>24h）"红标**——刚录入的新鲜数据反被系统标记为陈旧。

2. **价格数字不带来源溯源**：已有工具函数 `deriveProvenance`（来源→可信度/新鲜度/中文说明）**仅在测试中被引用，前端零调用**。`getPriceStats` 返回的「当前/最高/最低/平均价」不携带任何来源或时间信息，前端 KPI、历史表也不展示。一条 6 个月前的手动读数或低可信缓存值，会以"当前价格"的权威姿态呈现。

这两个缺口都属于「信任 bug」而非外观问题，直接决定用户在做 go/no-go 决策时能否相信屏幕上的数字。

## What Changes

- **手动/最新读数同步商品事实源**：`createSnapshot` 写入后，若该读数是该商品的最新读数（按 timestamp），同步更新 `products.currentPrice` 与 `products.lastCheckedAt`；补录的历史（更旧）读数**不得**覆盖更新的当前价。
- **前端失效 products 缓存**：`useCreateSnapshot` 成功后追加失效 `['products']`，使列表与机会工作台立即反映新价、清除误报的过时标记。
- **价格统计携带溯源**：`getPriceStats` 在响应中附带最新读数的 `provenance`（source / ageMs / stale / trust / label），由后端 `deriveProvenance` 统一推导，前端直接展示、不重复逻辑。
- **前端展示来源与新鲜度**：商品详情 KPI「当前价格」与价格历史表渲染来源标签与「可能已过时，建议复核」状态，让每个价格数字都可溯源。

不在本次范围：砍除队列/调度死重量（独立的清理变更）、文档纠偏、机会评分推荐门控逻辑。

## Capabilities

### Modified Capabilities
- `price-snapshot-api`: 新增「最新读数同步商品规范价格与新鲜度」要求（delta: 写快照时按最新读数更新 `currentPrice`/`lastCheckedAt`）。
- `price-analysis`: 新增「价格统计携带来源溯源」要求（delta: `getPriceStats` 返回 `provenance`）。
- `product-detail-ui`: 新增「价格数字展示来源与新鲜度」要求（delta: KPI 与历史表展示 provenance）。

## Impact

**后端：**
- `backend/src/services/priceSnapshotService.ts` — 写快照后按最新读数更新商品 `currentPrice`/`lastCheckedAt`。
- `backend/src/services/priceAnalysisService.ts` — `getPriceStats` 计算并返回 `provenance`。
- `backend/src/types/index.ts` — `PriceStats` 增加 `provenance` 字段。
- `backend/src/utils/snapshotProvenance.ts` — 复用既有 `deriveProvenance`（无需改动逻辑）。

**共享 schema（注意编译陷阱：`.ts` 与已提交的 `.js` 必须同步）：**
- `shared/schemas/analysis.schema.ts` + `shared/schemas/analysis.schema.js` — `priceStatsResponseSchema` 增加 `provenance` 对象。

**前端：**
- `frontend/src/hooks/usePriceStats.ts` — `useCreateSnapshot` 失效 `['products']`。
- `frontend/src/pages/ProductDetail.tsx` — KPI「当前价格」与价格历史表展示来源/新鲜度。
- `frontend/src/components/products/ProductCard.tsx` — 过时标记随 `lastCheckedAt` 更新自动恢复（无需逻辑改动，由后端修复驱动）。

**数据库：** 无 schema 变更（仅写入既有 `currentPrice`/`lastCheckedAt` 字段）。

**API：** `GET /api/analysis/price-stats/:productId` 响应新增 `provenance`（向后兼容，纯增量字段）。
