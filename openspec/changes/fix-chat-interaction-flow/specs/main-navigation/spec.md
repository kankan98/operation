## ADDED Requirements

### Requirement: 移动端不显示持久主导航
系统 SHALL 在移动视口下隐藏持久主导航栏，并通过移动导航入口按需打开导航抽屉。

#### Scenario: 小于 768px 时隐藏持久侧边栏
- **WHEN** 视口宽度小于 768px
- **THEN** 主导航栏不以持久左侧栏形式占用页面空间

#### Scenario: Chat 页面不显示收起侧边栏按钮
- **WHEN** 用户在移动视口访问 Chat 页面
- **THEN** 系统不显示用于持久侧边栏的“收起侧边栏”按钮

#### Scenario: 移动导航入口可打开导航
- **WHEN** 用户在移动视口点击应用导航入口
- **THEN** 系统以 overlay drawer 形式显示主导航项
