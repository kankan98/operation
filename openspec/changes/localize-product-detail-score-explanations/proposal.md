## Why

生产主链路审计发现，中文界面的商品详情页“评分构成（透明）”仍显示英文因子和英文解释，例如 `Review proxy`、`Price position`、`Product is not actively monitored yet.`。评分构成是用户判断选品机会的核心依据，混合语言会降低可读性和信任感。

## What Changes

- 在商品详情页本地化机会评分因子名称、解释文本和常见原始值展示。
- 保留后端评分算法、API 字段、因子贡献、权重、推荐结果和缺失信号不变。
- 对未知因子或未知解释保留原文，避免错误翻译或隐藏诊断信息。
- 添加页面测试，覆盖已知英文因子/解释不再直接出现在中文详情页评分构成中。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `product-detail-ui`: 商品详情页展示机会评分构成时，已知评分因子和解释必须使用面向商家的中文文案。

## Impact

- 前端商品详情页评分构成展示逻辑：`frontend/src/pages/ProductDetail.tsx`。
- 前端商品详情页测试：`frontend/tests/pages/ProductDetail.test.tsx`。
- 不修改后端评分服务、数据库、API schema 或生产数据。
