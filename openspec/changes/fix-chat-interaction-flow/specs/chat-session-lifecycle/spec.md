## ADDED Requirements

### Requirement: 新会话流式状态在 URL 同步时保持
系统 SHALL 在后端生成新会话 ID 并同步到 URL 时保留当前内存中的用户消息和 assistant 占位消息。

#### Scenario: 新会话 ID 返回后不覆盖流式消息
- **WHEN** 用户从 `/chat` 发送首条消息且后端通过 `message_start` 返回 sessionId
- **THEN** 前端导航到 `/chat/:sessionId`，并保留内存中的 user 消息和 assistant 流式消息

#### Scenario: 流式期间不加载仅含用户消息的历史覆盖内存
- **WHEN** 新会话仍在流式生成且数据库历史暂时只包含 user 消息
- **THEN** 前端不调用会覆盖当前消息列表的历史加载逻辑

#### Scenario: 流式完成后会话可重新加载
- **WHEN** 用户刷新或重新进入该会话 URL
- **THEN** 系统从后端加载完整 user 和 assistant 历史消息

### Requirement: 流式创建会话具备初始标题
后端 SHALL 为通过 `/api/chat/sessions/new/stream` 自动创建的会话写入可读初始标题。

#### Scenario: 首条消息生成初始标题
- **WHEN** 用户从空状态发送首条消息创建新会话
- **THEN** 新会话 title 使用首条用户消息的修剪摘要

#### Scenario: 初始标题长度受限
- **WHEN** 首条用户消息超过标题长度限制
- **THEN** 系统截断标题并追加省略标记

#### Scenario: 已有会话不重写标题
- **WHEN** 用户在已有会话中继续发送消息
- **THEN** 系统不使用新消息覆盖现有会话标题
