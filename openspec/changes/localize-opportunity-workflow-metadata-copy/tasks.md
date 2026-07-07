## 1. 回归测试

- [x] 1.1 更新机会页测试，要求复盘汇总、行动练习覆盖、今日行动计划默认英文 caveat 在 UI 中显示为中文。
- [x] 1.2 更新最近完成空值测试，要求显示“最新行动结果”且不显示 `latest outcome`。
- [x] 1.3 运行目标机会页测试，确认新增/更新断言在当前实现下失败且失败原因符合预期。

## 2. 前端实现

- [x] 2.1 在 `Opportunities.tsx` 中增加已知工作流 caveat 的中文展示映射函数。
- [x] 2.2 将复盘汇总、行动练习覆盖、今日行动计划的 caveat 渲染改为使用中文展示映射。
- [x] 2.3 将行动练习覆盖“最近完成”空值 fallback 从 `latest outcome` 改为“最新行动结果”。

## 3. 验证

- [x] 3.1 运行目标机会页测试并确认通过。
- [x] 3.2 运行 `openspec validate localize-opportunity-workflow-metadata-copy --strict`。
- [x] 3.3 运行前端 lint、完整测试和 build。

## 4. 发布复测

- [x] 4.1 提交并推送本次变更，不包含未跟踪截图文件。
- [x] 4.2 部署到服务器并确认健康检查通过。
- [x] 4.3 用 Playwright 在线上 `/opportunities` 复测默认工作流说明和最近完成空值均为中文。
