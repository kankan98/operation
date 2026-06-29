# chat-session-lifecycle

## Purpose

管理聊天会话的生命周期，包括会话切换、组件卸载时的资源清理，以及删除会话时的状态同步，确保不会出现竞态条件和资源泄漏。

## Requirements

### Requirement: 会话切换时取消未完成的请求
当用户切换会话时，系统 SHALL 取消当前会话未完成的 loadMessages 请求。

#### Scenario: 快速切换会话取消旧请求
- **WHEN** 用户从会话 A 切换到会话 B，会话 A 的 loadMessages 仍在进行
- **THEN** 会话 A 的请求被取消，不会在会话 B 中显示会话 A 的消息

#### Scenario: 导航到空状态取消请求
- **WHEN** 用户从会话页导航到新对话页（/chat），消息加载仍在进行
- **THEN** 加载请求被取消，空状态正常显示

### Requirement: SSE 连接在组件卸载时清理
SSE 连接 SHALL 在组件卸载或会话切换时正确清理，防止后台持续运行。

#### Scenario: 组件卸载时关闭 SSE
- **WHEN** 用户离开 Chat 页面（如导航到其他路由）
- **THEN** 进行中的 SSE 连接被关闭，不再接收消息

#### Scenario: 会话切换时清理 SSE
- **WHEN** 用户切换到不同会话
- **THEN** 旧会话的 SSE 连接清理，新会话可建立新连接

### Requirement: effect 依赖数组完整性
会话相关的 useEffect SHALL 包含完整的依赖数组，不使用 eslint-disable 绕过检查。

#### Scenario: setMessages 包含在依赖中
- **WHEN** effect 使用 setMessages 函数
- **THEN** setMessages 出现在依赖数组中，确保使用最新引用

#### Scenario: loadMessages 包含在依赖中
- **WHEN** effect 调用 loadMessages
- **THEN** loadMessages 出现在依赖数组中或使用稳定的函数引用

### Requirement: 删除会话时的状态同步
删除会话操作 SHALL 使用最新的 currentSessionId 判断是否需要导航。

#### Scenario: 删除当前会话后导航
- **WHEN** 用户删除正在查看的会话
- **THEN** 导航到空状态 /chat，清空消息列表

#### Scenario: 删除其他会话不导航
- **WHEN** 用户删除不是当前查看的会话
- **THEN** 保持在当前会话，仅刷新会话列表
