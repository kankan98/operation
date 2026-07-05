## Why

项目路线已经确认“手动优先的选品研究助手”，但当前手动录入读数主要藏在商品详情页。用户在产品列表或机会工作台发现价格缺失、过时、建议补充数据时，仍要跳转详情页才能录入，补数路径过长。

现在后端已能把最新 manual 读数同步为商品事实源，并且价格统计已携带来源/新鲜度；下一步应把“记录一次读数”放到用户做筛选和决策的主工作流里。

## What Changes

- 产品列表卡片增加快速“记录读数”入口，打开轻量弹窗录入 price / availability / salesRank / rating / reviewCount / recordedAt。
- 机会工作台在选中候选详情中增加同样的手动读数入口，尤其服务 `check_data`/缺失信号场景。
- 抽取商品详情页现有手动录入表单为可复用组件，保持字段、校验、成功/失败反馈和 `source=manual` 语义一致。
- 成功保存后复用现有 `useCreateSnapshot` 缓存失效逻辑，刷新商品列表、机会工作台、快照和价格统计。
- 不新增后端 API，不修改数据库 schema。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-list-ui`: 产品卡片需要支持从列表直接记录一次手动读数，并在保存后刷新卡片当前价和新鲜度状态。
- `opportunity-research-workspace`: 机会工作台需要支持从候选详情直接补充手动读数，并在保存后刷新机会评分/缺失信号上下文。

## Impact

**前端：**
- `frontend/src/pages/ProductDetail.tsx` — 抽离或复用现有手动录入表单，避免详情页和弹窗实现分叉。
- `frontend/src/components/products/ProductCard.tsx` — 增加图标入口和回调。
- `frontend/src/pages/ProductsList.tsx` — 管理快速录入弹窗状态，调用 `useCreateSnapshot`。
- `frontend/src/pages/Opportunities.tsx` — 在选中候选详情中提供快速录入入口，调用 `useCreateSnapshot`。
- `frontend/src/hooks/usePriceStats.ts` — 复用既有 hook；如发现产品维度不足，再做最小调整。

**测试：**
- 产品列表测试覆盖快速入口、提交 payload 和弹窗关闭/反馈。
- 机会工作台测试覆盖选中候选的快速补数入口。
- 保留商品详情页手动录入测试，确认抽取组件后行为不退化。

**API / 数据库：** 无新增接口或迁移。
