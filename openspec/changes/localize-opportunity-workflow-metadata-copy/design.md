## Context

机会工作台已经大部分中文化，但线上 `/opportunities` 仍直接展示 API 返回的英文 caveat：

- `Review summary counts are workflow queue metadata...`
- `Practice summary counts are workflow practice coverage metadata...`
- `Daily action plan items are workflow practice metadata...`

行动练习覆盖中无最近完成结果时还显示 `latest outcome`。这些都是工作流元数据说明，不参与机会评分、置信度、推荐、筛选或导出业务计算。

## Goals / Non-Goals

**Goals:**

- 在机会工作台中把已知英文工作流 caveat 展示为中文。
- 把 `latest outcome` fallback 改为中文。
- 保留未知 caveat 原文，避免吞掉后端新增说明。
- 用前端测试和线上 Playwright 验证英文残留不再出现。

**Non-Goals:**

- 不修改共享 schema 的英文常量或后端 API 响应。
- 不改变机会评分、工作流队列、行动计划生成、筛选、导出或研究状态。
- 不处理平台名称、`ROI`、`CSV` 等业务术语。

## Decisions

- 在 `Opportunities.tsx` 增加已知 caveat 到中文的展示映射。
  - 推荐原因：问题发生在中文 UI 展示层；后端 schema/openapi/tests 仍可继续表达 API 元数据语义。
  - 替代方案 A：修改 shared schema 常量为中文。该方案会牵动后端测试、OpenAPI 示例和可能的 API 消费者，不适合本轮小修复。
  - 替代方案 B：忽略 API caveat，只写死中文。该方案会丢失未知 caveat，不利于后续扩展。
- 映射函数只处理精确匹配的已知英文 caveat。
  - 原因：避免误翻译包含相似英文词的真实后端动态说明。
- `latest outcome` fallback 改为“最新行动结果”。
  - 原因：该卡片标题是“最近完成”，fallback 用“最新行动结果”说明空值含义，和行动结果上下文一致。

## Risks / Trade-offs

- API 仍返回英文 caveat -> 线上 UI 已通过映射解决；API 层国际化可作为后续更大范围设计。
- 测试夹具继续使用英文 caveat -> 这是有意覆盖前端映射，确保线上 API 英文响应不会泄露到中文 UI。
- 未知 caveat 会原样显示 -> 保留信息完整性，后续发现新的英文默认文案再加入映射。
