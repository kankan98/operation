## Why

线上空数据状态仍使用“开始监控”“商品监控”等监控优先文案。新增商品默认值已经改为手动优先后，这些冷启动入口会继续把用户引向自动监控心智，和当前产品定位不一致。

## What Changes

- Dashboard 零商品冷启动文案改为“先添加商品建立研究样本”，描述先手动录入关键读数，再由真实信号逐步生成历史、预警和机会。
- 产品列表页数量副标题从“已监控”改为“已添加”，空态描述改为先建立手动研究样本。
- 预警中心无商品空态改为强调商品和读数基础，并说明可通过手动读数或可选监控生成信号。
- 保留监控能力、监控统计、预警逻辑、采集调度和 API 合同不变。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `dashboard-overview`: 零商品冷启动引导必须符合手动优先研究路径。
- `product-list-ui`: 产品列表数量与空态文案不得把“监控”描述为新增商品后的默认目标。
- `alert-center-ui`: 无商品预警空态必须说明预警依赖商品和读数基础，而不是只依赖可监控对象。

## Impact

- 前端 i18n 文案：`frontend/src/i18n/locales/zh.json`、`frontend/src/i18n/locales/en.json`。
- 前端页面测试：Dashboard、ProductsList、AlertsCenter。
- OpenSpec delta specs 与任务清单。
- 不修改后端、数据库、监控调度器或现有数据。
