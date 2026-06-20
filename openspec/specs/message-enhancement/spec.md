# Message Enhancement Specification

## Purpose

This capability captures the accepted Chat redesign requirements synced from the chat-ui-redesign-v2 change.

## Requirements

### Requirement: 任务摘要引用块
系统SHALL在assistant消息中支持渲染任务摘要引用块，使用浅紫色渐变背景，左上角带Sparkle图标。

#### Scenario: 引用块渲染
- **WHEN** 消息内容包含任务摘要标记
- **THEN** 渲染独立的引用块，margin 16px 0，padding 14px 16px，border-radius 10px

#### Scenario: 引用块背景
- **WHEN** 渲染任务摘要引用块
- **THEN** 使用线性渐变背景 linear-gradient(90deg, #f4f1ff, #faf9ff)

#### Scenario: Sparkle图标显示
- **WHEN** 引用块左上角
- **THEN** 显示Sparkles图标，尺寸16px，颜色#6e54ee

#### Scenario: 引用块标题
- **WHEN** 图标右侧
- **THEN** 显示标题文本，字体13px/700，颜色#6e54ee

#### Scenario: 引用块正文
- **WHEN** 标题下方
- **THEN** 显示正文内容，字体13px/400，line-height 1.6，颜色#37304f

### Requirement: 编号问题列表
系统SHALL支持渲染编号问题列表，使用16x16px紫色方块作为序号标记。

#### Scenario: 问题列表容器
- **WHEN** 消息包含问题列表标记
- **THEN** 渲染grid布局容器，gap 8px

#### Scenario: 序号方块样式
- **WHEN** 每个问题项渲染
- **THEN** 左侧显示16x16px紫色方块，background #6e54ee，border-radius 4px，居中显示白色数字

#### Scenario: 序号数字显示
- **WHEN** 方块内渲染数字
- **THEN** 字体11px/700，颜色#ffffff，居中对齐

#### Scenario: 问题内容布局
- **WHEN** 序号方块右侧
- **THEN** 显示问题内容，左侧margin 12px，字体14px/400，line-height 1.55

#### Scenario: 问题标题加粗
- **WHEN** 问题内容包含标题部分
- **THEN** 标题使用600字重，区别于补充说明

### Requirement: 勾选清单
系统SHALL支持渲染勾选清单，使用绿色勾选图标标记已完成项。

#### Scenario: 清单容器
- **WHEN** 消息包含清单标记
- **THEN** 渲染垂直列表，清单项间距8px

#### Scenario: 勾选图标显示
- **WHEN** 清单项已完成
- **THEN** 显示绿色Check图标，尺寸16px，颜色#22c55e，圆角背景可选

#### Scenario: 未勾选图标显示
- **WHEN** 清单项未完成
- **THEN** 显示灰色Circle图标，尺寸16px，颜色#d1d5db

#### Scenario: 清单文字样式
- **WHEN** 图标右侧
- **THEN** 显示清单文字，字体13px/400，颜色#374151，左侧margin 10px

#### Scenario: 已完成项样式
- **WHEN** 清单项已勾选
- **THEN** 文字添加删除线效果，颜色变为#9ca3af

### Requirement: 分割线渲染
系统SHALL在消息段落之间支持渲染分割线，使用细线样式。

#### Scenario: 分割线样式
- **WHEN** 渲染分割线
- **THEN** 1px solid #edf0f5，上下margin 14px

#### Scenario: 分割线语义
- **WHEN** Markdown包含`---`或`***`
- **THEN** 渲染为分割线组件

### Requirement: 段落间距优化
系统SHALL优化消息正文的段落间距，提升可读性。

#### Scenario: 首段与标题间距
- **WHEN** 消息标题下方的首段
- **THEN** 上方margin 8px（紧凑）

#### Scenario: 段落之间间距
- **WHEN** 正文段落之间
- **THEN** margin 10-12px

#### Scenario: 正文行高
- **WHEN** 渲染正文文本
- **THEN** line-height 1.65

### Requirement: 代码块增强
系统SHALL为代码块添加语法高亮、行号和复制按钮。

#### Scenario: 代码块背景
- **WHEN** 渲染代码块
- **THEN** 背景色#f7f7fb，border 1px solid #e7e8ee，border-radius 10px，padding 16px

#### Scenario: 语言标签显示
- **WHEN** 代码块指定语言
- **THEN** 右上角显示语言标签（如"TypeScript"），字体11px，颜色#7b8494

#### Scenario: 复制按钮
- **WHEN** 代码块hover
- **THEN** 右上角显示复制按钮，点击复制代码到剪贴板

#### Scenario: 行号显示（可选）
- **WHEN** 代码块超过10行
- **THEN** 左侧显示灰色行号，字体12px mono，颜色#9ca3af

### Requirement: 链接样式增强
系统SHALL为消息中的链接添加紫色下划线和hover效果。

#### Scenario: 链接默认样式
- **WHEN** 渲染链接
- **THEN** 颜色#6e54ee，下划线1px solid #a891ff，字重500

#### Scenario: 链接hover样式
- **WHEN** 鼠标悬停在链接上
- **THEN** 颜色变为#5f46df，下划线变为2px solid #6e54ee

#### Scenario: 外部链接图标
- **WHEN** 链接指向外部网站
- **THEN** 链接后显示ExternalLink图标，尺寸14px，颜色继承

### Requirement: 表格渲染
系统SHALL支持渲染Markdown表格，使用细线边框和斑马纹。

#### Scenario: 表格边框
- **WHEN** 渲染表格
- **THEN** border 1px solid #e7e8ee，border-radius 10px，overflow hidden

#### Scenario: 表头样式
- **WHEN** 渲染表头行
- **THEN** 背景#fafafa，字体13px/600，颜色#111827，padding 12px

#### Scenario: 表格单元格
- **WHEN** 渲染表格数据行
- **THEN** padding 10px 12px，字体13px/400，颜色#374151

#### Scenario: 斑马纹效果
- **WHEN** 表格有多行数据
- **THEN** 偶数行背景#fcfcfd，奇数行背景#ffffff

### Requirement: 引用文本样式
系统SHALL为Markdown引用文本添加左侧竖线和灰色背景。

#### Scenario: 引用块样式
- **WHEN** 渲染blockquote
- **THEN** 左侧4px紫色竖线（#a891ff），背景#fafafa，padding 12px 16px，border-radius 0 8px 8px 0

#### Scenario: 引用文本样式
- **WHEN** 引用块内文本
- **THEN** 字体14px/400，颜色#4b5563，斜体可选

### Requirement: 数学公式渲染（可选）
系统SHALL支持可选的LaTeX数学公式渲染能力，使用KaTeX库。

#### Scenario: 行内公式
- **WHEN** 消息包含`$formula$`
- **THEN** 行内渲染数学公式，字体大小继承

#### Scenario: 块级公式
- **WHEN** 消息包含`$$formula$$`
- **THEN** 独立行渲染数学公式，居中对齐，上下margin 16px

### Requirement: 消息操作按钮
系统SHALL在消息底部显示操作按钮（复制、点赞、点踩等）。

#### Scenario: 操作按钮布局
- **WHEN** 消息渲染完成
- **THEN** 底部显示操作按钮行，左对齐，按钮间距8px

#### Scenario: 复制按钮
- **WHEN** 操作按钮区域
- **THEN** 显示Copy图标按钮，尺寸16px，颜色#8b93a3，hover变为#6e54ee

#### Scenario: 复制功能
- **WHEN** 用户点击复制按钮
- **THEN** 复制消息文本到剪贴板，显示"已复制"toast

#### Scenario: 点赞按钮
- **WHEN** 操作按钮区域
- **THEN** 显示ThumbsUp图标按钮，未点赞时灰色，已点赞时紫色

#### Scenario: 点踩按钮
- **WHEN** 操作按钮区域
- **THEN** 显示ThumbsDown图标按钮，未点踩时灰色，已点踩时红色

### Requirement: 消息时间戳显示
系统SHALL在消息底部或标题下方显示时间戳。

#### Scenario: 时间戳格式
- **WHEN** 渲染时间戳
- **THEN** 使用相对时间格式（"刚刚"、"5分钟前"、"今天 14:30"）

#### Scenario: 时间戳样式
- **WHEN** 显示时间戳
- **THEN** 字体12px/400，颜色#7b8494，mono字体用于数字

#### Scenario: 时间戳位置
- **WHEN** 消息正文底部
- **THEN** 显示在操作按钮左侧或独立一行

### Requirement: 消息加载骨架屏
系统SHALL在消息加载时显示骨架屏，提升用户体验。

#### Scenario: 骨架屏样式
- **WHEN** 消息数据加载中
- **THEN** 显示3条灰色矩形占位条，高度12px，宽度递减（100%/80%/60%）

#### Scenario: 骨架屏动画
- **WHEN** 骨架屏显示
- **THEN** 背景渐变从#f0f0f0到#e0e0e0循环流动（shimmer效果）

### Requirement: 消息错误状态
系统SHALL在消息加载失败时显示错误提示和重试按钮。

#### Scenario: 错误提示样式
- **WHEN** 消息加载失败
- **THEN** 显示红色边框卡片，背景#fef2f2，padding 12px

#### Scenario: 错误图标和文字
- **WHEN** 错误提示内
- **THEN** 显示AlertCircle图标（16px #ef4444）+ 错误文字"加载失败"

#### Scenario: 重试按钮
- **WHEN** 错误提示右侧
- **THEN** 显示"重试"按钮，紫色文字，点击后重新加载消息

### Requirement: 流式渲染优化
系统SHALL优化流式消息的渲染性能，避免频繁重排。

#### Scenario: 增量渲染
- **WHEN** 接收到text_delta事件
- **THEN** 只更新最后一条消息的content字段，不重渲染整个列表

#### Scenario: 防抖优化
- **WHEN** 高频接收delta事件（>60次/秒）
- **THEN** 使用requestAnimationFrame节流渲染，最多60fps

#### Scenario: 虚拟滚动（可选）
- **WHEN** 消息列表超过50条
- **THEN** 使用虚拟滚动技术，只渲染可见区域的消息

### Requirement: 消息动画效果
系统SHALL为新消息添加淡入动画。

#### Scenario: 新消息淡入
- **WHEN** 新消息添加到列表
- **THEN** 从opacity 0到1淡入，持续200ms ease-out

#### Scenario: 流式文字显示
- **WHEN** 流式消息内容更新
- **THEN** 新文字从左侧淡入，持续150ms

### Requirement: Markdown解析配置
系统SHALL使用react-markdown或similar库解析Markdown，支持GFM扩展。

#### Scenario: GFM支持
- **WHEN** 解析Markdown
- **THEN** 支持表格、任务列表、删除线、自动链接等GFM特性

#### Scenario: 安全过滤
- **WHEN** 解析用户输入的Markdown
- **THEN** 过滤危险的HTML标签（script、iframe等）

#### Scenario: 自定义组件映射
- **WHEN** 解析特定Markdown元素
- **THEN** 使用自定义React组件渲染（如code -> CustomCodeBlock）
