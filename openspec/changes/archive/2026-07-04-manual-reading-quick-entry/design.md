## Context

当前手动录入读数的完整表单定义在 `ProductDetail.tsx` 内部。它已经调用 `useCreateSnapshot`，并在后端配合 `trustworthy-manual-readings` 变更后实现了“最新 manual 读数更新商品当前价/新鲜度”的闭环。

问题是入口位置不匹配用户工作流：用户通常在产品列表发现过时价格，在机会工作台看到 `check_data` 或缺失信号，然后才需要补数。此时跳转详情页会增加操作成本，也会打断筛选和比较上下文。

## Goals / Non-Goals

**Goals:**
- 在产品列表卡片和机会工作台候选详情中提供快速手动读数入口。
- 复用同一套手动录入表单逻辑，保持字段、payload 和反馈一致。
- 成功保存后依赖 `useCreateSnapshot` 失效 `products` / `opportunities` / `snapshots` / `priceStats` 缓存。
- 保持列表和机会页的扫描密度，不在卡片内展开复杂表单。

**Non-Goals:**
- 不新增后端接口、数据库字段或价格统计契约。
- 不改变机会评分算法。
- 不在本切片实现批量导入、多行历史录入或 CSV 导入。
- 不重新设计产品列表或机会工作台整体布局。

## Decisions

### Decision 1: 抽取 `ManualReadingForm`，用外层容器决定展示形态

将 `ProductDetail.tsx` 内部的手动录入表单逻辑抽到 `frontend/src/components/products/ManualReadingForm.tsx`。组件只负责字段状态、输入校验、提交 payload、成功/失败提示；是否放在详情页 card 或 modal 中由调用方决定。

这样可以避免三处页面复制字段和转换逻辑。详情页继续用 card 容器，列表/机会页用 modal 容器。

### Decision 2: 产品卡片只增加图标入口

`ProductCard` 增加一个带 `PencilLine` 或等价 lucide 图标的 icon action，aria-label 为“记录手动读数”。卡片不直接展开表单，因为表单字段较多，会破坏网格高度和列表扫描。

`ProductsList` 负责持有 `selectedForReading` 状态，打开 modal 后调用 `useCreateSnapshot(selected.id)`。保存成功后保留 modal 内成功反馈；用户可关闭 modal 回到列表，列表数据由缓存失效刷新。

### Decision 3: 机会工作台在候选详情提供补数入口

`OpportunityDetail` 的操作区加入“记录读数”按钮，尤其与 `check_data` 推荐和缺失信号语境配合。按钮打开 modal，而不是触发浏览器采集；这是 manual-first 路线中更可靠的数据入口。

`Opportunities` 顶层持有选中商品的快速录入状态，调用 `useCreateSnapshot(productId)`，成功后让机会列表和详情通过既有缓存失效刷新。

### Decision 4: 表单 payload 继续使用 `source=manual`

提交字段保持：
- `price`
- `currency`
- `availability`
- `source: 'manual'`
- 可选 `salesRank` / `rating` / `reviewCount` / `recordedAt`

日期输入仍转换为毫秒时间戳。空数字字段转换为 `undefined`，避免发送无效数字。

## Risks / Trade-offs

- [Risk] 多处调用同一个 mutation hook 时，productId 为空或变化可能导致缓存 key 错误。→ 只在选中商品存在时渲染 modal，并把 productId 从选中商品对象传入。
- [Risk] modal 成功后立即关闭会隐藏反馈，用户不确定是否保存。→ 默认保留成功提示，用户手动关闭；后续可按反馈再决定是否自动关闭。
- [Risk] 机会页已经较复杂，新增状态容易扩大组件体积。→ 快速录入状态集中在顶层，只向详情组件传递 `onRecordReading` 回调。
- [Risk] 抽取表单可能让详情页快照测试回归。→ 先补产品列表/机会页测试，再跑现有详情页测试确认行为不退化。
