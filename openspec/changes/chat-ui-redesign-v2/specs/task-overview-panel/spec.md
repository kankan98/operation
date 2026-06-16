# Task Overview Panel Specification

## ADDED Requirements

### Requirement: 任务概览卡片布局
系统SHALL在右侧面板顶部显示任务概览卡片，包含当前任务状态、相关信息和操作按钮。

#### Scenario: 卡片渲染位置
- **WHEN** 聊天页面加载完成
- **THEN** 右侧面板314px宽度区域顶部显示任务概览卡片

#### Scenario: 卡片样式规范
- **WHEN** 任务概览卡片渲染
- **THEN** padding 16px，border 1px solid #e7e8ee，border-radius 10px，background #ffffff，shadow xs级别

### Requirement: 任务概览标题
系统SHALL在卡片顶部显示"任务概览"标题，字体15px/700，颜色#111827。

#### Scenario: 标题渲染
- **WHEN** 任务概览卡片加载
- **THEN** 顶部显示"任务概览"文本，字体15px/700，颜色#111827

#### Scenario: 标题间距
- **WHEN** 标题下方
- **THEN** 与内容区域间距16px

### Requirement: 当前任务显示
系统SHALL显示当前会话正在执行的任务名称和状态。

#### Scenario: 任务名称显示
- **WHEN** 存在进行中的任务
- **THEN** 显示字段标签"当前任务"（12px #8b93a3）和任务名称（13px/500 #111827）

#### Scenario: 无任务时显示
- **WHEN** 当前会话没有任务
- **THEN** 显示"暂无任务"，颜色#9aa3b2，居中对齐

#### Scenario: 任务名称过长处理
- **WHEN** 任务名称超过卡片宽度
- **THEN** 使用省略号截断，鼠标悬停显示完整名称tooltip

### Requirement: 任务状态指示
系统SHALL显示任务的当前状态（进行中/已完成/失败），使用颜色和图标区分。

#### Scenario: 进行中状态
- **WHEN** 任务状态为in_progress
- **THEN** 显示紫色圆点（6px直径）+ "进行中"文本，颜色#6e54ee

#### Scenario: 已完成状态
- **WHEN** 任务状态为completed
- **THEN** 显示绿色勾选图标（16px）+ "已完成"文本，颜色#22c55e

#### Scenario: 失败状态
- **WHEN** 任务状态为failed
- **THEN** 显示红色叉号图标（16px）+ "失败"文本，颜色#ef4444

#### Scenario: 等待状态
- **WHEN** 任务状态为pending
- **THEN** 显示灰色时钟图标（16px）+ "等待中"文本，颜色#7b8494

### Requirement: 开始时间显示
系统SHALL显示任务的开始时间，使用易读的相对时间格式。

#### Scenario: 开始时间字段
- **WHEN** 任务有startTime
- **THEN** 显示字段标签"开始时间"（12px #8b93a3）和时间值（13px/500 #111827）

#### Scenario: 相对时间格式
- **WHEN** 渲染开始时间
- **THEN** 显示相对时间（如"5分钟前"、"1小时前"、"今天 14:30"）

#### Scenario: 时间更新
- **WHEN** 任务正在进行中
- **THEN** 每分钟更新一次相对时间显示

### Requirement: 关联产品显示
系统SHALL显示任务关联的产品ASIN或产品列表。

#### Scenario: 单个产品显示
- **WHEN** 任务关联1个产品
- **THEN** 显示字段标签"关联产品"和产品ASIN（13px/500 #111827）

#### Scenario: 多个产品显示
- **WHEN** 任务关联多个产品
- **THEN** 显示字段标签"关联产品"和产品数量（如"3个产品"），点击展开列表

#### Scenario: 无关联产品
- **WHEN** 任务没有关联产品
- **THEN** 不显示"关联产品"字段

#### Scenario: 产品链接跳转
- **WHEN** 用户点击产品ASIN
- **THEN** 跳转到产品详情页面

### Requirement: 平台标识显示
系统SHALL显示任务关联的电商平台（Amazon/Shopify等）。

#### Scenario: 平台图标显示
- **WHEN** 任务有platform字段
- **THEN** 显示平台名称和对应的品牌图标（16px）

#### Scenario: Amazon平台
- **WHEN** platform为amazon
- **THEN** 显示Amazon图标和"Amazon"文本

#### Scenario: Shopify平台
- **WHEN** platform为shopify
- **THEN** 显示Shopify图标和"Shopify"文本

#### Scenario: 无平台信息
- **WHEN** 任务没有platform字段
- **THEN** 不显示平台标识

### Requirement: 任务进度显示（可选）
系统MAY显示任务的完成进度百分比和进度条。

#### Scenario: 进度条渲染
- **WHEN** 任务metadata包含progress字段
- **THEN** 显示进度条（高度4px，圆角2px），填充百分比对应的宽度

#### Scenario: 进度百分比显示
- **WHEN** 显示进度条
- **THEN** 进度条上方显示百分比文本（如"65%"），颜色#7b8494

#### Scenario: 进度更新
- **WHEN** 任务进度变化
- **THEN** 进度条平滑过渡到新的百分比（动画200ms）

### Requirement: 任务操作按钮
系统SHALL提供任务相关的操作按钮（查看详情/取消任务等）。

#### Scenario: 查看详情按钮
- **WHEN** 任务概览卡片底部
- **THEN** 显示"查看详情"按钮，紫色描边样式，高度32px

#### Scenario: 查看详情点击
- **WHEN** 用户点击"查看详情"
- **THEN** 滚动到对话区对应的任务消息位置

#### Scenario: 取消任务按钮
- **WHEN** 任务状态为in_progress或pending
- **THEN** 显示"取消任务"按钮，灰色描边样式

#### Scenario: 取消任务点击
- **WHEN** 用户点击"取消任务"并确认
- **THEN** 调用PATCH /api/tasks/:id更新状态为cancelled，任务停止执行

### Requirement: 任务数据加载
系统SHALL在会话切换时加载对应的任务数据。

#### Scenario: 会话切换加载任务
- **WHEN** 用户切换到另一个会话
- **THEN** 调用GET /api/tasks/:sessionId加载该会话的任务列表

#### Scenario: 加载中状态
- **WHEN** 任务数据加载中
- **THEN** 任务概览卡片显示骨架屏或loading指示器

#### Scenario: 加载失败处理
- **WHEN** 任务数据加载失败
- **THEN** 显示"加载失败"提示和重试按钮

### Requirement: 任务实时更新
系统SHALL通过SSE事件实时更新任务状态和进度。

#### Scenario: 任务状态更新
- **WHEN** 收到task_update SSE事件
- **THEN** 更新任务概览卡片的状态显示（进行中→已完成）

#### Scenario: 任务进度更新
- **WHEN** 收到task_progress SSE事件
- **THEN** 更新进度条和百分比显示

#### Scenario: 新任务创建
- **WHEN** 收到task_created SSE事件
- **THEN** 任务概览卡片显示新创建的任务信息

### Requirement: 空状态显示
系统SHALL在会话没有任务时显示友好的空状态提示。

#### Scenario: 空状态内容
- **WHEN** 当前会话没有任务
- **THEN** 显示"暂无任务"文本和简单的图标，颜色#9aa3b2，居中对齐

#### Scenario: 空状态样式
- **WHEN** 渲染空状态
- **THEN** 图标尺寸48px，文本14px，上下padding 32px

### Requirement: 任务卡片交互动画
系统SHALL为任务概览卡片添加平滑的过渡动画。

#### Scenario: 状态变化动画
- **WHEN** 任务状态从in_progress变为completed
- **THEN** 状态指示器以200ms ease-out过渡，伴随轻微的缩放动画（scale 1.0 → 1.05 → 1.0）

#### Scenario: 数据刷新动画
- **WHEN** 任务数据更新
- **THEN** 内容以150ms fade过渡

### Requirement: 任务详情字段布局
系统SHALL使用两列布局显示任务详情字段，提高信息密度。

#### Scenario: 字段两列布局
- **WHEN** 任务详情字段超过3个
- **THEN** 使用grid布局，两列显示，列间距24px

#### Scenario: 字段单列布局
- **WHEN** 任务详情字段少于4个
- **THEN** 使用单列垂直布局，字段间距12px
