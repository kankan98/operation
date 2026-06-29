# chat-error-boundary

## Purpose

为聊天界面提供错误边界保护和异常处理机制，确保单个组件或操作的错误不会导致整个 UI 崩溃，提升系统的容错性和用户体验。

## Requirements

### Requirement: 消息列表包含错误边界
消息渲染区域 SHALL 使用 React Error Boundary 包裹，防止单条消息错误导致整个 UI 崩溃。

#### Scenario: 单条消息渲染错误
- **WHEN** 某条消息包含格式错误的数据导致 EnhancedMessageCard 抛出异常
- **THEN** 错误边界捕获异常，显示该消息渲染失败，其他消息正常显示

#### Scenario: 错误边界显示错误提示
- **WHEN** 消息渲染错误被捕获
- **THEN** 在该消息位置显示友好的错误提示，包含"消息加载失败"文案

#### Scenario: 错误后用户可继续使用
- **WHEN** 消息渲染错误发生后
- **THEN** 用户仍可发送新消息、切换会话等操作，不影响其他功能

### Requirement: 滚动操作的异常保护
滚动相关操作 SHALL 包含 try-catch 保护，防止 DOM 元素不存在时抛出异常。

#### Scenario: 滚动到已卸载的元素
- **WHEN** 用户点击"查看任务详情"但目标元素在滚动前被卸载
- **THEN** 滚动操作静默失败，不抛出 DOMException，不影响 UI 稳定性

#### Scenario: 查看工具详情时元素不存在
- **WHEN** 用户点击"查看工具详情"但目标工具卡片不在 DOM 中
- **THEN** 操作无效果，无异常抛出

### Requirement: 快捷按钮 DOM 查询的空值检查
快捷操作按钮 SHALL 在操作前检查 DOM 元素是否存在。

#### Scenario: 输入框不存在时点击快捷按钮
- **WHEN** 快捷按钮查询不到输入框元素（如表单结构变化）
- **THEN** 操作静默失败，不抛出 TypeError
