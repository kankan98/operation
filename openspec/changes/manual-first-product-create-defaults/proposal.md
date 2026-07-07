## Why

项目已经转向个人自用的手动优先选品研究助手，但线上新增商品表单仍默认勾选“启用监控”，后端创建 schema 也在缺省请求中把 `isMonitoring` 设为 `true`。这会把冷启动用户引回自动采集和监控心智，削弱手动录入、来源透明和准确性优先的主线。

## What Changes

- 新增商品表单默认不启用自动监控，检查间隔字段只在用户主动勾选后显示。
- 将监控开关文案从“默认自动检查”调整为“可选自动检查”，明确手动录入是默认路径。
- 后端产品创建 schema 的 `isMonitoring` 缺省值改为 `false`，与 shared schema 和数据库默认值一致。
- 保留已有商品编辑状态、显式启用监控、检查间隔范围、单品手动检查和现有监控筛选行为。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `product-list-ui`: 新增商品表单必须默认手动优先，不默认启用自动监控。
- `shared-schemas`: 产品创建 schema 的默认监控状态必须是手动优先的 `false`。

## Impact

- 前端产品表单：`frontend/src/components/products/ProductForm.tsx`。
- 前端 i18n 文案和产品表单测试。
- 后端产品创建验证 schema 和 API 测试。
- 不迁移历史商品数据，不改变显式 `isMonitoring=true` 请求，不删除监控能力。
