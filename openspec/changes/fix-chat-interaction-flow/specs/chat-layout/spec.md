## ADDED Requirements

### Requirement: 移动端 Chat 使用单栏体验
系统 SHALL 在移动视口中隐藏持久桌面导航和侧栏，只显示聊天主区域以及必要的抽屉入口。

#### Scenario: 移动端隐藏持久导航
- **WHEN** 视口宽度小于 768px 且用户访问 Chat 页面
- **THEN** 系统不显示持久左侧应用导航栏

#### Scenario: 移动端保留聊天标题和抽屉入口
- **WHEN** 用户在移动端访问 Chat 页面
- **THEN** 顶部显示当前会话标题、会话入口和任务入口

#### Scenario: 移动端无水平溢出
- **WHEN** 视口宽度为 390px
- **THEN** 页面不产生 document 级水平滚动

### Requirement: Chat 抽屉可可靠关闭
会话抽屉和任务抽屉 SHALL 提供可靠的关闭方式，并且遮罩点击不会被抽屉内容拦截。

#### Scenario: 点击会话抽屉遮罩关闭
- **WHEN** 会话抽屉打开且用户点击抽屉外遮罩区域
- **THEN** 会话抽屉关闭

#### Scenario: 点击任务抽屉遮罩关闭
- **WHEN** 任务抽屉打开且用户点击抽屉外遮罩区域
- **THEN** 任务抽屉关闭

#### Scenario: Escape 关闭抽屉
- **WHEN** 任一 Chat 抽屉打开且用户按 Escape
- **THEN** 当前抽屉关闭并将焦点返回触发按钮

#### Scenario: 抽屉内有明确关闭按钮
- **WHEN** 任一 Chat 抽屉打开
- **THEN** 抽屉内显示带可访问名称的关闭按钮
