## ADDED Requirements

### Requirement: 复制消息操作具备降级路径
系统 SHALL 在复制 assistant 消息时处理 Clipboard API 不可用或失败的情况，不得抛出未捕获异常。

#### Scenario: Clipboard API 可用时复制成功
- **WHEN** 用户点击 assistant 消息的复制按钮且 `navigator.clipboard.writeText` 可用
- **THEN** 系统复制消息文本并显示成功反馈

#### Scenario: Clipboard API 不可用时使用降级复制
- **WHEN** 用户点击复制按钮但 `navigator.clipboard.writeText` 不可用
- **THEN** 系统使用安全降级路径尝试复制消息文本

#### Scenario: 复制失败显示反馈
- **WHEN** 所有复制路径均失败
- **THEN** 系统显示失败反馈且不产生未捕获 JavaScript 错误

#### Scenario: HTTP 部署复制不崩溃
- **WHEN** 用户在 HTTP 生产部署中点击复制按钮
- **THEN** 页面不抛出 `TypeError`，Chat 仍可继续交互
