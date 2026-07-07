## Context

当前生产环境没有商品时，用户从产品页点击“添加商品”会看到已勾选的“启用监控”，并提示“按设定间隔自动检查价格”。这和手动优先设计文档中的“手动录入一等流程、自动采集管道降级”不一致。代码层面也存在默认值不一致：shared schema 和数据库默认 `isMonitoring=false`，但前端表单和后端路由 schema 默认 `true`。

## Goals / Non-Goals

**Goals:**

- 让新增商品的默认路径是手动研究，而不是自动监控。
- 保证前端表单、后端 POST 默认值和 shared schema 对 `isMonitoring` 的默认解释一致。
- 保留用户主动启用监控时的现有能力。
- 用测试覆盖默认未勾选、检查间隔隐藏、显式启用后仍可提交。

**Non-Goals:**

- 不删除 `isMonitoring`、`checkInterval`、调度器或采集队列相关字段。
- 不迁移或改写已有商品的监控状态。
- 不重命名 Chat 工具 `addProductMonitoring`，也不在本轮修改 AI 工具语义。
- 不调整 Dashboard 的监控统计模型。

## Decisions

1. **只改变创建默认值，不改变编辑行为。**
   - 原因：已有商品的 `isMonitoring` 是用户或历史流程形成的状态，编辑时必须原样展示，避免无意关闭监控。
   - 替代方案：打开编辑表单也默认关闭监控。该方案会破坏现有商品状态，不可接受。

2. **前端仍提交 `isMonitoring` 和 `checkInterval`。**
   - 原因：React Hook Form 会保留默认值；显式提交 `false` 能让旧后端也接收到手动优先意图。后端默认修改用于保护 API 调用方省略字段时的语义。
   - 替代方案：前端省略未启用监控的字段。该方案会让不同后端默认值影响结果，风险更高。

3. **后端 schema 默认 `isMonitoring=false`，暂不改 Chat 工具显式 `true`。**
   - 原因：Chat 工具当前名称和规格仍是 addProductMonitoring，显式传 true 属于现有能力；本轮修复的是“默认创建”而非工具重命名。
   - 替代方案：同时改 Chat 工具默认 false。该方案会牵动 prompt、工具返回文案和现有规格，适合单独变更。

4. **文案强调“可选自动检查”。**
   - 原因：用户仍可以启用监控，但默认体验必须告诉用户可以先手动录入读数。

## Risks / Trade-offs

- 旧文档和部分 specs 仍使用“monitoring system”叙述 → 本轮只修正创建默认路径，后续可逐步归档或更新更大的产品定位文档。
- Chat 工具仍显式创建监控商品 → 保持兼容；后续可单独设计“添加研究商品”工具。
- 未启用监控时仍保留 `checkInterval=24` → 该字段是后端合同的一部分，保留默认值避免不必要的 schema 分支。
