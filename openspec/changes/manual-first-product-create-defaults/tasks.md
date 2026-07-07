## 1. 回归测试

- [x] 1.1 更新产品表单测试，要求新建模式默认不勾选“启用监控”且不显示检查间隔。
- [x] 1.2 更新产品表单提交测试，要求默认提交 `isMonitoring: false`，显式勾选后提交 `isMonitoring: true`。
- [x] 1.3 更新后端产品 API/schema 测试，要求省略 `isMonitoring` 时创建结果为 `false`。
- [x] 1.4 运行目标测试，确认新增断言在当前实现下失败且失败原因符合预期。

## 2. 实现

- [x] 2.1 将 `ProductForm` 新建默认值改为 `isMonitoring: false`，并保留编辑模式原值。
- [x] 2.2 调整产品表单中监控开关的中英文文案，强调可选自动检查和手动优先。
- [x] 2.3 将后端产品创建 schema 的 `isMonitoring` 默认值改为 `false`。

## 3. 验证

- [x] 3.1 运行目标前端产品表单测试并确认通过。
- [x] 3.2 运行目标后端产品 API/schema 测试并确认通过。
- [x] 3.3 运行 `openspec validate manual-first-product-create-defaults --strict`。
- [x] 3.4 运行前端 lint、完整测试和 build。
- [x] 3.5 运行后端 lint、完整测试和 build。

## 4. 发布复测

- [ ] 4.1 提交并推送本次变更，不包含未跟踪截图文件。
- [ ] 4.2 部署到服务器并确认健康检查通过。
- [ ] 4.3 用 Playwright 在线上 `/products` 复测新增商品表单默认手动优先、显式启用监控仍可展开检查间隔。
