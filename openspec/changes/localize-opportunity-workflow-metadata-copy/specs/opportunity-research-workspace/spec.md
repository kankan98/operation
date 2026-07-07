## ADDED Requirements

### Requirement: 工作流元数据说明中文展示
系统SHALL在中文机会工作台中以中文展示已知工作流元数据说明。

#### Scenario: 复盘汇总 caveat 中文展示
- **WHEN** 复盘汇总 API 返回默认英文 caveat
- **THEN** 机会工作台MUST显示中文说明“复盘汇总只用于工作流队列统计，不会改变机会评分、置信度、推荐动作、门槛或因素贡献”
- **AND** 机会工作台MUST NOT显示该英文 caveat 原文

#### Scenario: 行动练习覆盖 caveat 中文展示
- **WHEN** 行动练习覆盖 API 返回默认英文 caveat
- **THEN** 机会工作台MUST显示中文说明“行动练习覆盖只用于工作流练习统计，不会改变机会评分、置信度、推荐动作、门槛、市场信号、业务指标或因素贡献”
- **AND** 机会工作台MUST NOT显示该英文 caveat 原文

#### Scenario: 今日行动计划 caveat 中文展示
- **WHEN** 今日行动计划 API 返回默认英文 caveat
- **THEN** 机会工作台MUST显示中文说明“今日行动计划只用于工作流练习安排，不会改变机会评分、置信度、推荐动作、门槛、市场信号、业务指标或因素贡献”
- **AND** 机会工作台MUST NOT显示该英文 caveat 原文

#### Scenario: 最近完成空值中文展示
- **WHEN** 行动练习覆盖没有最近完成时间
- **THEN** 最近完成卡片MUST显示“最新行动结果”
- **AND** 最近完成卡片MUST NOT显示“latest outcome”
