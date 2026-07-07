## Why

生产主链路审计发现，用户添加商品并录入手动读数后，机会工作台候选详情仍直接暴露英文评分因子和解释，例如 `Price position`、`Acquisition health`、`Rating/review count is used only as a proxy signal...`。机会工作台是选品判断的主界面，混合语言会降低用户对评分依据、门控原因和下一步动作的理解。

## What Changes

- 在机会工作台本地化已知机会评分因子名称、评分解释、关键理由、推荐门控原因和推荐下一步。
- 本地化常见原始值展示，例如库存状态和监控状态。
- 保留未知因子、未知解释、provider/source/error 等诊断标识原文，避免隐藏新后端信号。
- 不修改后端评分算法、API schema、权重、贡献、推荐结果、置信度或持久化数据。
- 添加页面测试覆盖已知英文评分文案不再直出、未知诊断仍可见。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `opportunity-research-workspace`: 机会工作台展示评分解释、因子拆解和推荐门控时，已知评分相关文案必须使用面向商家的中文展示。

## Impact

- 前端机会工作台展示逻辑：`frontend/src/pages/Opportunities.tsx`。
- 前端机会工作台测试：`frontend/tests/pages/Opportunities.test.tsx`。
- 不影响后端机会评分服务、数据库、shared schema、Chat 工具或生产数据。
