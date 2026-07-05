# 设计说明：可信手动读数（trustworthy-manual-readings）

## 背景与约束

- 方向：手动优先研究助手，准确性 > 规模，无付费数据源预算。
- 既有资产：`deriveProvenance(source, timestamp, now)` 已实现且测试覆盖，返回 `{ source, ageMs, stale, trust, label }`，按来源设定差异化新鲜度阈值（manual 7 天、API 源 24h、browser 12h、cache 6h、unknown 立即过时）。本次直接复用，不改其逻辑。
- 类型拓扑：`PriceStats` 同时存在于 `backend/src/types/index.ts`（后端接口）与 `shared/schemas/analysis.schema.ts`（zod，前端经此复用）。两处需同步增加 `provenance`。`shared/schemas/*.js` 是已提交的编译产物，改 `.ts` 必须同步改 `.js`，否则后端运行时取旧 schema。

## 决策 1：最新读数同步商品规范价格

**问题**：补录历史读数（back-date）不应把当前价改成旧值。

**方案**：`createSnapshot` 插入后，查询该商品最新一条快照（`getLatestSnapshot`，按 timestamp desc）。当新插入读数的 `timestamp >= 最新读数 timestamp`（即它就是/并列最新）时，才更新 `products.currentPrice = price`、`products.lastCheckedAt = timestamp`。补录的更旧读数因不是最新，跳过更新。

**实现位置**：在 `PriceSnapshotService` 内复用 `ProductService.updateProduct`（已含缓存失效与 `updatedAt` 维护）。`productService` 不 import 快照/分析服务，无循环依赖。商品不存在时（理论上外键已约束）`updateProduct` 抛 404，本流程仅在确有商品时触发，不额外吞错。

**不采用**：直接 `db.update(products)` 绕过 service——会漏掉既有平台级缓存失效逻辑。

## 决策 2：价格统计携带 provenance（后端推导，前端只渲染）

**问题**：前端不应重复实现新鲜度阈值逻辑（易与后端漂移）。

**方案**：`getPriceStats` 取最新快照的 `source` 与 `timestamp`，调用 `deriveProvenance` 得到 `provenance`，放入 `PriceStats.provenance`。前端直接展示 `label`、按 `stale`/`trust` 决定徽标颜色。

**契约**：`provenance` 为纯增量字段，旧前端忽略即可，向后兼容。`source` 取自快照行的 `source` 列（默认 `unknown`）。

## 决策 3：前端展示策略（最小侵入）

- `ProductCard` 过时红标已 key 于 `product.lastCheckedAt`——决策 1 修复后，手动录入即更新该字段，红标**自动**消除，无需改组件。
- `ProductDetail` KPI「当前价格」追加来源标签 + 过时提示（来自 `priceStats.provenance`）。
- 价格历史表每行按该行 `source` + `timestamp` 展示来源；过时行加「建议复核」提示，避免一律绿色 success 徽标掩盖陈旧数据。
- `useCreateSnapshot` 追加失效 `['products']`（列表/机会工作台用），保留既有 `['snapshots']`/`['priceStats']` 失效。

## 测试策略（TDD）

1. 后端单测先行：
   - `createSnapshot` 最新读数 → 商品 `currentPrice`/`lastCheckedAt` 更新；补录旧读数 → 商品字段不变。
   - `getPriceStats` 返回 `provenance`，新鲜 manual 为 high/非 stale；超 7 天 manual 为 stale/low。
2. 前端单测：`useCreateSnapshot` 成功后失效 `['products']`；KPI/历史表渲染来源标签与过时提示。
3. 全量门禁：backend lint/build/test、frontend vitest/build、`openspec validate --strict`。

## 风险

- 共享 schema 双产物（.ts/.js）漏同步 → 运行时校验取旧 schema。缓解：本设计显式列入 tasks，验收含后端 build + 单测。
- `getLatestSnapshot` 在 timestamp 并列时排序非确定 → 极端边界，取并列任一最新价均可接受，不影响正确性。
