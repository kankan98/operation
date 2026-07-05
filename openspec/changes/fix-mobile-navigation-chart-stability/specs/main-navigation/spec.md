## ADDED Requirements

### Requirement: 移动端非 Chat 页面提供全局导航入口
系统 SHALL 在移动视口访问非 Chat 页面时提供可见、可访问的全局导航入口，并以 overlay drawer 展示主导航项。

#### Scenario: 移动端非 Chat 顶栏显示导航入口
- **WHEN** 用户在小于 768px 的视口访问 Dashboard、Products、Opportunities、Alerts 或 Settings 页面
- **THEN** 页面顶栏显示一个带有可访问名称的导航菜单按钮

#### Scenario: 移动端导航入口打开 drawer
- **WHEN** 用户点击移动端导航菜单按钮
- **THEN** 系统以 overlay drawer 展示 Dashboard、Products、Opportunities、Alerts、Chat 和 Settings 导航项
- **AND** 当前路由对应的导航项显示 active 状态

#### Scenario: 移动端导航 drawer 支持关闭
- **WHEN** 移动端导航 drawer 已打开
- **THEN** 用户可以通过关闭按钮、Escape 键或点击遮罩关闭 drawer
- **AND** 焦点返回导航菜单按钮

#### Scenario: 移动端导航跳转后关闭 drawer
- **WHEN** 用户点击 drawer 中的任一导航项
- **THEN** 系统跳转到对应路由
- **AND** drawer 自动关闭

#### Scenario: Chat 页面保留专用移动布局
- **WHEN** 用户在小于 768px 的视口访问 `/chat` 或 `/chat/:sessionId`
- **THEN** AppLayout 不显示非 Chat 全局移动导航 drawer 入口
- **AND** Chat 页面继续使用自己的会话和任务 drawer 控件
