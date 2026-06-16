# Session Grouping Specification

## ADDED Requirements

### Requirement: 会话分组显示
系统SHALL将会话列表按"置顶"、"今天"、"昨日"、"更早"四个时间段分组显示。

#### Scenario: 分组标题渲染
- **WHEN** 会话列表加载完成
- **THEN** 按顺序显示四个分组标题："置顶"、"今天"、"昨日"、"更早"

#### Scenario: 空分组隐藏
- **WHEN** 某个分组没有会话
- **THEN** 该分组标题和内容不显示

#### Scenario: 分组内会话排序
- **WHEN** 分组内有多个会话
- **THEN** 会话按updatedAt降序排列（最新的在上方）

### Requirement: 置顶会话识别
系统SHALL识别isPinned为true的会话，将其归入"置顶"分组，不受时间限制。

#### Scenario: 置顶会话分组
- **WHEN** 会话的isPinned字段为true
- **THEN** 该会话归入"置顶"分组，无论其updatedAt时间

#### Scenario: 置顶会话排序
- **WHEN** "置顶"分组有多个会话
- **THEN** 会话按updatedAt降序排列

#### Scenario: 非置顶会话排除
- **WHEN** 会话的isPinned为false或null
- **THEN** 该会话不出现在"置顶"分组，按时间归入其他分组

### Requirement: 今天会话识别
系统SHALL将updatedAt在当天00:00:00之后的非置顶会话归入"今天"分组。

#### Scenario: 今天会话判断
- **WHEN** 会话的updatedAt >= 当天00:00:00时间戳
- **THEN** 该会话归入"今天"分组（前提是isPinned为false）

#### Scenario: 跨时区处理
- **WHEN** 计算"今天"的起始时间
- **THEN** 使用客户端本地时区，而非服务器时区

#### Scenario: 今天会话排序
- **WHEN** "今天"分组有多个会话
- **THEN** 会话按updatedAt降序排列

### Requirement: 昨日会话识别
系统SHALL将updatedAt在昨天00:00:00到今天00:00:00之间的非置顶会话归入"昨日"分组。

#### Scenario: 昨日会话判断
- **WHEN** 昨天00:00:00 <= 会话updatedAt < 今天00:00:00
- **THEN** 该会话归入"昨日"分组（前提是isPinned为false）

#### Scenario: 昨日会话排序
- **WHEN** "昨日"分组有多个会话
- **THEN** 会话按updatedAt降序排列

### Requirement: 更早会话识别
系统SHALL将updatedAt在昨天00:00:00之前的非置顶会话归入"更早"分组。

#### Scenario: 更早会话判断
- **WHEN** 会话updatedAt < 昨天00:00:00
- **THEN** 该会话归入"更早"分组（前提是isPinned为false）

#### Scenario: 更早会话排序
- **WHEN** "更早"分组有多个会话
- **THEN** 会话按updatedAt降序排列

### Requirement: 分组标题样式
系统SHALL使用指定的样式渲染分组标题，区分于会话项。

#### Scenario: 分组标题文字样式
- **WHEN** 渲染分组标题
- **THEN** 字体12px/600，颜色#7b8494，左右margin 16px，上margin 18px，下margin 8px

#### Scenario: 分组标题背景
- **WHEN** 渲染分组标题
- **THEN** 背景透明，无边框

### Requirement: 会话置顶操作
系统SHALL允许用户通过右键菜单或长按将会话设置为置顶或取消置顶。

#### Scenario: 置顶会话
- **WHEN** 用户右键点击非置顶会话，选择"置顶"
- **THEN** 调用PATCH /api/chat/sessions/:id更新isPinned为true，会话立即移动到"置顶"分组

#### Scenario: 取消置顶
- **WHEN** 用户右键点击置顶会话，选择"取消置顶"
- **THEN** 调用PATCH /api/chat/sessions/:id更新isPinned为false，会话移动到对应时间分组

#### Scenario: 置顶状态持久化
- **WHEN** 用户刷新页面
- **THEN** 置顶状态保持不变，会话仍在"置顶"分组

### Requirement: 置顶图标指示
系统SHALL在置顶会话卡片上显示置顶图标，区别于普通会话。

#### Scenario: 置顶图标显示
- **WHEN** 会话在"置顶"分组内
- **THEN** 会话卡片右上角显示Pin图标，颜色#6e54ee，尺寸14px

#### Scenario: 非置顶无图标
- **WHEN** 会话不在"置顶"分组
- **THEN** 不显示置顶图标

### Requirement: 分组计数显示（可选）
系统MAY在分组标题后显示该分组的会话数量。

#### Scenario: 分组计数显示
- **WHEN** 分组标题渲染
- **THEN** 标题后显示"(N)"，N为该分组的会话数量，颜色#a0a7b6

#### Scenario: 空分组无计数
- **WHEN** 分组没有会话
- **THEN** 不显示分组标题和计数

### Requirement: 前端分组逻辑实现
系统SHALL在前端实现会话分组逻辑，基于当前时间和会话updatedAt字段计算分组。

#### Scenario: 分组函数调用时机
- **WHEN** 会话列表数据加载完成或会话数据更新
- **THEN** 调用groupSessions函数重新计算分组

#### Scenario: 分组函数输入
- **WHEN** 调用groupSessions函数
- **THEN** 传入完整的ChatSession[]数组

#### Scenario: 分组函数输出
- **WHEN** groupSessions函数执行完成
- **THEN** 返回包含四个数组的对象：{pinned: [], today: [], yesterday: [], older: []}

### Requirement: 时间计算工具函数
系统SHALL提供startOfDay工具函数，计算指定时间戳所在日期的00:00:00时间戳。

#### Scenario: 今天00:00:00计算
- **WHEN** 调用startOfDay(Date.now())
- **THEN** 返回今天00:00:00的时间戳（本地时区）

#### Scenario: 昨天00:00:00计算
- **WHEN** 调用startOfDay(Date.now() - 86400000)
- **THEN** 返回昨天00:00:00的时间戳（本地时区）

### Requirement: 会话更新后分组刷新
系统SHALL在会话置顶状态变化后立即刷新分组显示。

#### Scenario: 置顶操作后刷新
- **WHEN** 用户将会话设为置顶，API返回成功
- **THEN** 前端立即重新计算分组，会话移动到"置顶"分组顶部

#### Scenario: 取消置顶后刷新
- **WHEN** 用户取消会话置顶，API返回成功
- **THEN** 前端立即重新计算分组，会话移动到对应时间分组

#### Scenario: 新消息后分组更新
- **WHEN** 会话接收到新消息，updatedAt更新
- **THEN** 前端重新计算分组，会话可能从"昨日"移动到"今天"

### Requirement: 分组展开/折叠（可选）
系统MAY支持用户手动折叠/展开分组，隐藏不常用的分组。

#### Scenario: 分组折叠
- **WHEN** 用户点击分组标题右侧的折叠图标
- **THEN** 该分组的会话列表隐藏，图标变为展开状态

#### Scenario: 分组展开
- **WHEN** 用户点击已折叠分组的标题
- **THEN** 该分组的会话列表展开显示

#### Scenario: 折叠状态持久化
- **WHEN** 用户刷新页面
- **THEN** 折叠状态保持不变（存储在localStorage）
