## MODIFIED Requirements

### Requirement: 工具调用渲染增强
系统SHALL使用新的ToolExecutionCard组件替代原有的ToolCallCard，并确保类型安全。

#### Scenario: 组件替换
- **WHEN** 渲染包含toolCalls的消息
- **THEN** 使用ToolExecutionCard组件，而非旧的ToolCallCard

#### Scenario: 样式升级
- **WHEN** 渲染工具执行卡
- **THEN** 使用淡绿色背景渐变，14px圆角，增强的阴影效果

#### Scenario: 双卡片数据源
- **WHEN** 工具执行状态变化
- **THEN** 从store.toolExecutionState获取状态，而非message.toolCalls直接取值

#### Scenario: 类型安全的工具执行提取
- **WHEN** 从消息中提取工具执行信息
- **THEN** extractToolExecutions 返回符合 ToolCall 类型的数据，不包含 MessagePart 的 type 字段

#### Scenario: toolExecutions 计算优化
- **WHEN** messages 数组未变化时
- **THEN** 使用 useMemo 缓存 toolExecutions 计算结果，避免每次渲染都重新计算

## MODIFIED Requirements

### Requirement: 消息错误状态
系统SHALL在消息加载失败时显示错误提示，并添加错误边界保护。

#### Scenario: 错误提示样式
- **WHEN** 消息加载失败
- **THEN** 红色边框卡片，背景#fef2f2

#### Scenario: 重试按钮
- **WHEN** 错误提示中
- **THEN** 显示"重试"按钮，点击重新加载

#### Scenario: 单条消息渲染错误保护
- **WHEN** 某条消息包含格式错误数据导致渲染异常
- **THEN** 错误边界捕获异常，显示该消息渲染失败，其他消息正常显示

#### Scenario: 错误边界降级 UI
- **WHEN** 消息渲染错误被捕获
- **THEN** 在该消息位置显示友好的错误卡片，包含"消息加载失败"文案和消息ID
