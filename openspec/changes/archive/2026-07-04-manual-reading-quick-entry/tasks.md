# 任务清单：manual-reading-quick-entry

## 1. 复用手动读数表单

- [x] 1.1 抽取 `ManualReadingForm` 组件，保留 price / availability / salesRank / rating / reviewCount / recordedAt 字段与 `source='manual'` payload
- [x] 1.2 更新 `ProductDetail.tsx` 复用新组件，并保持详情页卡片文案、成功/失败反馈不退化
- [x] 1.3 运行现有 `ProductDetail` 前端测试，确认抽取后行为稳定

## 2. 产品列表快速录入

- [x] 2.1 先写失败测试：产品卡片渲染紧凑的“记录手动读数”入口，并触发列表页弹窗
- [x] 2.2 实现：`ProductCard` 增加 icon action + `ProductsList` 管理 quick-reading modal 状态
- [x] 2.3 先写失败测试：从产品列表提交有效读数时调用 `useCreateSnapshot(product.id)`，payload 含 `source='manual'` 与 product currency
- [x] 2.4 实现：列表弹窗接入 `ManualReadingForm` 与 `useCreateSnapshot`

## 3. 机会工作台快速录入

- [x] 3.1 先写失败测试：选中机会详情提供“记录读数”入口，且不触发 provider check
- [x] 3.2 实现：`Opportunities` 在选中候选详情中打开 quick-reading modal，并接入 `useCreateSnapshot(selected.product.id)`
- [x] 3.3 先写失败测试：机会页提交读数后使用 selected product currency 和 `source='manual'` payload

## 4. 验收门禁

- [x] 4.1 前端相关测试通过：`ProductDetail`、`ProductsList`、`Opportunities`
- [x] 4.2 `openspec validate manual-reading-quick-entry --strict` 通过
- [x] 4.3 前端 build 或类型检查通过
