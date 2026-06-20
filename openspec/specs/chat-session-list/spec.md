# Chat Session List Specification

## Purpose

This capability captures the accepted Chat redesign requirements synced from the chat-ui-redesign-v2 change.

## Requirements

### Requirement: 会话列表分组显示
系统SHALL将会话列表按时间段分组，替代原有的平铺列表。

#### Scenario: 分组标题显示
- **WHEN** 渲染会话列表
- **THEN** 按"置顶"、"今天"、"昨日"、"更早"四个分组显示，每个分组有独立标题

#### Scenario: 原有排序保持
- **WHEN** 分组内会话排序
- **THEN** 继续按updatedAt降序排列（与原有行为一致）

#### Scenario: 空分组隐藏
- **WHEN** 某个分组没有会话
- **THEN** 不显示该分组标题和内容（新增行为）

### Requirement: 会话卡片active状态增强
系统SHALL增强active会话的视觉效果，使用浅紫色背景和阴影。

#### Scenario: active会话背景
- **WHEN** 会话被选中
- **THEN** 背景色从原来的hover色改为#f8f6ff（浅紫色）

#### Scenario: active会话边框
- **WHEN** 会话被选中
- **THEN** 边框颜色从透明改为#a891ff（紫色边框）

#### Scenario: active会话阴影
- **WHEN** 会话被选中
- **THEN** 添加box-shadow: 0 6px 16px rgba(110, 84, 238, 0.08)

#### Scenario: 原有hover保持
- **WHEN** 鼠标悬停在未选中会话
- **THEN** 继续使用#fafafa背景色和#eff0f4边框

### Requirement: 会话卡片布局优化
系统SHALL优化会话卡片的内边距和圆角，提升视觉精致度。

#### Scenario: 卡片内边距
- **WHEN** 渲染会话卡片
- **THEN** padding从原来的值改为12px

#### Scenario: 卡片最小高度
- **WHEN** 渲染会话卡片
- **THEN** min-height设为64px（确保一致性）

#### Scenario: 卡片圆角
- **WHEN** 渲染会话卡片
- **THEN** border-radius改为10px（原为8px）

#### Scenario: 卡片间距
- **WHEN** 会话卡片之间
- **THEN** margin-bottom为8px

### Requirement: 会话图标显示增强
系统SHALL根据会话状态动态调整图标颜色。

#### Scenario: 默认会话图标
- **WHEN** 普通会话图标
- **THEN** 颜色为#7b8494（灰色）

#### Scenario: active会话图标
- **WHEN** 选中会话的图标
- **THEN** 颜色改为#6e54ee（紫色）

#### Scenario: 置顶会话图标
- **WHEN** 置顶会话的图标
- **THEN** 颜色改为#6e54ee（紫色），与active一致

### Requirement: 会话搜索功能新增
系统SHALL在会话列表顶部添加搜索框，支持实时过滤。

#### Scenario: 搜索框位置
- **WHEN** 会话面板加载
- **THEN** 在标题下方显示搜索框，margin 0 16px 18px

#### Scenario: 搜索框样式
- **WHEN** 渲染搜索框
- **THEN** height 36px，border 1px solid #e7e8ee，border-radius 9px，background #fff

#### Scenario: 搜索图标
- **WHEN** 搜索框左侧
- **THEN** 显示Search图标（16px #7b8494）

#### Scenario: placeholder文本
- **WHEN** 搜索框为空
- **THEN** 显示"搜索对话..."placeholder

#### Scenario: 实时搜索过滤
- **WHEN** 用户输入搜索词
- **THEN** 实时过滤会话，匹配标题或最后消息内容

#### Scenario: 搜索结果为空
- **WHEN** 搜索无匹配结果
- **THEN** 显示"未找到匹配的对话"提示

### Requirement: 会话标题显示优化
系统SHALL优化会话标题的显示，增强可读性。

#### Scenario: 标题字体
- **WHEN** 显示会话标题
- **THEN** 字体从原来的值改为13px/600，颜色#111827

#### Scenario: 标题截断
- **WHEN** 标题过长
- **THEN** 单行省略，使用text-overflow: ellipsis

#### Scenario: 未命名会话
- **WHEN** 会话无标题
- **THEN** 显示"新对话"占位文本，颜色#9ca3af

### Requirement: 会话摘要显示增强
系统SHALL显示会话的最后消息预览，提升信息密度。

#### Scenario: 摘要文本
- **WHEN** 标题下方
- **THEN** 显示lastMessagePreview或最后消息的内容摘要，字体12px/400，颜色#7b8494

#### Scenario: 摘要截断
- **WHEN** 摘要过长
- **THEN** 单行省略，最多显示约40个字符

#### Scenario: 无摘要时
- **WHEN** 会话无消息
- **THEN** 不显示摘要行，只显示标题

### Requirement: 会话时间显示优化
系统SHALL优化时间显示的位置和格式。

#### Scenario: 时间显示位置
- **WHEN** 会话卡片右上角
- **THEN** 显示相对时间，字体12px，颜色#7b8494

#### Scenario: 时间格式
- **WHEN** 渲染时间
- **THEN** 使用相对格式（"刚刚"、"5分钟前"、"昨天"、"3天前"）

#### Scenario: 时间更新
- **WHEN** 会话有新消息
- **THEN** 时间实时更新（每分钟检查一次）

### Requirement: 未读指示器新增
系统SHALL在会话卡片上显示未读消息数量指示器。

#### Scenario: 未读点显示
- **WHEN** 会话有未读消息
- **THEN** 标题左侧显示6px紫色圆点

#### Scenario: 未读数量显示（可选）
- **WHEN** 未读消息超过1条
- **THEN** 右上角显示未读数量徽章，背景#6e54ee，文字#fff

#### Scenario: 已读状态
- **WHEN** 会话被选中并查看
- **THEN** 未读指示器消失，调用API更新isRead状态

### Requirement: 会话hover效果优化
系统SHALL优化会话卡片的hover交互反馈。

#### Scenario: hover背景
- **WHEN** 鼠标悬停在非active会话
- **THEN** 背景改为#fafafa，边框改为#eff0f4

#### Scenario: hover过渡
- **WHEN** hover状态变化
- **THEN** 背景和边框以160ms ease过渡

#### Scenario: active会话无hover
- **WHEN** 鼠标悬停在active会话
- **THEN** 保持active样式，不再变化

### Requirement: 会话操作菜单新增
系统SHALL在会话卡片hover时显示操作按钮或右键菜单。

#### Scenario: 操作按钮显示
- **WHEN** 鼠标悬停在会话卡片
- **THEN** 右侧显示MoreVertical图标按钮（16px）

#### Scenario: 操作菜单内容
- **WHEN** 点击操作按钮或右键点击会话
- **THEN** 显示下拉菜单，包含"置顶/取消置顶"、"删除"、"重命名"选项

#### Scenario: 置顶操作
- **WHEN** 选择"置顶"菜单项
- **THEN** 调用PATCH /api/chat/sessions/:id更新isPinned为true

#### Scenario: 删除操作
- **WHEN** 选择"删除"菜单项
- **THEN** 显示确认对话框，确认后调用DELETE API删除会话

### Requirement: 会话加载状态
系统SHALL在会话列表加载时显示骨架屏。

#### Scenario: 加载中骨架屏
- **WHEN** 会话列表数据加载中
- **THEN** 显示3-5个会话卡片骨架屏，带shimmer动画

#### Scenario: 加载失败提示
- **WHEN** 会话列表加载失败
- **THEN** 显示"加载失败"提示和"重试"按钮

### Requirement: 分组标题样式规范
系统SHALL使用统一的分组标题样式。

#### Scenario: 分组标题文字
- **WHEN** 渲染分组标题
- **THEN** 字体12px/600，颜色#7b8494

#### Scenario: 分组标题间距
- **WHEN** 分组标题位置
- **THEN** margin: 18px 16px 8px 16px

#### Scenario: 分组标题背景
- **WHEN** 分组标题渲染
- **THEN** 背景透明，无边框


### Requirement: 置顶功能支持
系统SHALL支持会话置顶功能，置顶会话显示在"置顶"分组。

#### Scenario: 置顶会话识别
- **WHEN** 会话isPinned为true
- **THEN** 归入"置顶"分组，显示在列表最顶部

#### Scenario: 置顶图标显示
- **WHEN** 会话在"置顶"分组
- **THEN** 右上角显示Pin图标（14px #6e54ee）

### Requirement: 会话分组前端计算
系统SHALL在前端实现会话分组逻辑。

#### Scenario: 分组函数调用
- **WHEN** 会话数据加载完成
- **THEN** 调用groupSessions函数计算分组

#### Scenario: 分组结果渲染
- **WHEN** 分组计算完成
- **THEN** 按"置顶"→"今天"→"昨日"→"更早"顺序渲染各分组
