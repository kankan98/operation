## ADDED Requirements

### Requirement: SSE 连接错误显示
系统 SHALL 正确显示 SSE 连接和流式传输过程中的错误信息。

#### Scenario: useChatSSE 返回 error 属性
- **WHEN** useChatSSE hook 被调用
- **THEN** 返回对象包含 error 属性（string | null 类型）

#### Scenario: SSE 连接失败显示错误
- **WHEN** SSE 连接建立失败
- **THEN** Chat 页面显示错误提示 UI，内容来自 useChatSSE 的 error 属性

#### Scenario: 流式传输错误显示
- **WHEN** 流式传输过程中接收到错误事件
- **THEN** 错误信息更新到 error 状态，显示给用户

#### Scenario: 错误消失后清除 UI
- **WHEN** 错误状态从有值变为 null
- **THEN** 错误提示 UI 隐藏

### Requirement: 网络错误重试机制
系统 SHALL 为 SSE 连接错误提供重试机制。

#### Scenario: 连接失败后显示重试按钮
- **WHEN** SSE 连接失败且显示错误提示
- **THEN** 错误 UI 中包含"重试"按钮

#### Scenario: 点击重试重新发送
- **WHEN** 用户点击重试按钮
- **THEN** 清除错误状态，使用相同内容重新发送消息

### Requirement: 错误信息本地化
系统 SHALL 为常见 SSE 错误提供友好的中文提示。

#### Scenario: 网络超时错误
- **WHEN** SSE 连接超时
- **THEN** 显示"网络连接超时，请检查网络后重试"

#### Scenario: 服务器错误
- **WHEN** 服务器返回 5xx 错误
- **THEN** 显示"服务暂时不可用，请稍后重试"

#### Scenario: 未知错误
- **WHEN** 其他未分类错误
- **THEN** 显示"发送失败：" + 原始错误信息
