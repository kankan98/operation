# Chat Messages Specification

## MODIFIED Requirements

### Requirement: 消息数据模型扩展
系统SHALL扩展ChatMessage类型，新增taskSummary和toolExecutionDetails字段。

#### Scenario: taskSummary字段
- **WHEN** 消息包含任务摘要信息
- **THEN** taskSummary字段存储JSON格式的任务摘要数据{title, description, questions}

#### Scenario: toolExecutionDetails字段
- **WHEN** 消息包含工具执行详情
- **THEN** toolExecutionDetails字段存储扩展的工具执行信息{toolCallId, status, startTime, endTime, durationMs, inputSummary, outputSummary}

#### Scenario: 向后兼容
- **WHEN** 读取旧版消息数据
- **THEN** taskSummary和toolExecutionDetails为null或undefined，正常处理

#### Scenario: 数据库Schema
- **WHEN** 存储消息到数据库
- **THEN** taskSummary和toolExecutionDetails作为TEXT类型存储JSON字符串

### Requirement: 工具调用渲染增强
系统SHALL使用新的ToolExecutionCard组件替代原有的ToolCallCard。

#### Scenario: 组件替换
- **WHEN** 渲染包含toolCalls的消息
- **THEN** 使用ToolExecutionCard组件，而非旧的ToolCallCard

#### Scenario: 样式升级
- **WHEN** 渲染工具执行卡
- **THEN** 使用淡绿色背景渐变，14px圆角，增强的阴影效果

#### Scenario: 双卡片数据源
- **WHEN** 工具执行状态变化
- **THEN** 从store.toolExecutionState获取状态，而非message.toolCalls直接取值

### Requirement: 消息气泡样式升级
系统SHALL升级assistant消息卡片的样式，使用新的设计系统token。

#### Scenario: 卡片背景
- **WHEN** 渲染assistant消息
- **THEN** 背景色保持#ffffff，边框颜色改为#e7e8ee

#### Scenario: 卡片圆角
- **WHEN** 渲染消息卡片
- **THEN** border-radius从原来的值改为12px

#### Scenario: 卡片阴影
- **WHEN** 渲染消息卡片
- **THEN** 使用新的shadow-sm: 0 4px 10px rgba(15, 23, 42, 0.05)

#### Scenario: 卡片padding
- **WHEN** 渲染消息卡片
- **THEN** padding改为18px 18px 16px

### Requirement: 消息文字排版优化
系统SHALL优化消息正文的排版，提升可读性。

#### Scenario: 正文行高
- **WHEN** 渲染消息正文
- **THEN** line-height从原来的值改为1.65

#### Scenario: 段落间距
- **WHEN** 段落之间
- **THEN** margin改为10-12px

#### Scenario: 首段间距
- **WHEN** 标题下的首段
- **THEN** margin-top为8px（紧凑）

#### Scenario: 分割线样式
- **WHEN** 渲染分割线
- **THEN** 1px solid #edf0f5，上下margin 14px

### Requirement: 消息时间戳显示调整
系统SHALL调整消息时间戳的显示位置和样式。

#### Scenario: 时间戳位置
- **WHEN** 渲染消息时间
- **THEN** 显示在消息正文底部或标题下方

#### Scenario: 时间戳样式
- **WHEN** 渲染时间戳
- **THEN** 字体12px/400，颜色从原来的值改为#7b8494

#### Scenario: 时间格式
- **WHEN** 显示时间
- **THEN** 使用相对时间格式（"刚刚"、"5分钟前"、"今天 14:30"）

### Requirement: 消息操作按钮样式统一
系统SHALL统一消息操作按钮（复制、点赞、点踩）的样式。

#### Scenario: 按钮图标尺寸
- **WHEN** 渲染操作按钮
- **THEN** 图标尺寸统一为16px

#### Scenario: 按钮颜色
- **WHEN** 操作按钮默认状态
- **THEN** 颜色从原来的值改为#8b93a3

#### Scenario: 按钮hover颜色
- **WHEN** 鼠标悬停在操作按钮
- **THEN** 颜色改为#6e54ee

#### Scenario: 按钮间距
- **WHEN** 操作按钮之间
- **THEN** 间距为8px

## ADDED Requirements

### Requirement: 任务摘要引用块渲染
系统SHALL支持渲染任务摘要引用块，使用浅紫色渐变背景。

#### Scenario: 识别任务摘要
- **WHEN** 消息的taskSummary字段非空
- **THEN** 渲染TaskSummaryBlock组件

#### Scenario: 引用块样式
- **WHEN** 渲染任务摘要块
- **THEN** 使用linear-gradient(90deg, #f4f1ff, #faf9ff)背景，padding 14px 16px，border-radius 10px

#### Scenario: Sparkle图标
- **WHEN** 引用块左上角
- **THEN** 显示Sparkles图标（16px #6e54ee）

#### Scenario: 摘要标题
- **WHEN** 图标右侧
- **THEN** 显示标题，字体13px/700，颜色#6e54ee

#### Scenario: 摘要正文
- **WHEN** 标题下方
- **THEN** 显示正文，字体13px/400，line-height 1.6，颜色#37304f

### Requirement: 编号问题列表渲染
系统SHALL支持渲染编号问题列表，使用紫色方块序号。

#### Scenario: 识别问题列表
- **WHEN** 消息内容包含问题列表标记或taskSummary.questions
- **THEN** 渲染NumberedQuestionList组件

#### Scenario: 序号方块样式
- **WHEN** 渲染问题序号
- **THEN** 16x16px紫色方块，background #6e54ee，border-radius 4px，白色数字

#### Scenario: 问题内容
- **WHEN** 序号右侧
- **THEN** 显示问题文本，字体14px/400，line-height 1.55

#### Scenario: 问题间距
- **WHEN** 问题列表项之间
- **THEN** gap 8px

### Requirement: 勾选清单渲染
系统SHALL支持渲染勾选清单，使用绿色勾选图标。

#### Scenario: 识别勾选清单
- **WHEN** 消息内容包含GFM task list语法
- **THEN** 渲染CheckList组件

#### Scenario: 勾选图标
- **WHEN** 清单项已完成
- **THEN** 显示绿色Check图标（16px #22c55e）

#### Scenario: 未勾选图标
- **WHEN** 清单项未完成
- **THEN** 显示灰色Circle图标（16px #d1d5db）

#### Scenario: 清单文字
- **WHEN** 图标右侧
- **THEN** 显示文字，字体13px/400，颜色#374151

#### Scenario: 已完成样式
- **WHEN** 清单项已勾选
- **THEN** 文字添加删除线，颜色变为#9ca3af

### Requirement: 代码块增强渲染
系统SHALL增强代码块的渲染，添加语法高亮和复制按钮。

#### Scenario: 代码块背景
- **WHEN** 渲染代码块
- **THEN** 背景#f7f7fb，border 1px solid #e7e8ee，border-radius 10px，padding 16px

#### Scenario: 语言标签
- **WHEN** 代码块指定语言
- **THEN** 右上角显示语言标签，字体11px，颜色#7b8494

#### Scenario: 复制按钮
- **WHEN** 鼠标悬停在代码块
- **THEN** 右上角显示复制按钮，点击复制代码

#### Scenario: 语法高亮
- **WHEN** 渲染代码
- **THEN** 使用prism或highlight.js进行语法高亮

### Requirement: 链接样式增强
系统SHALL增强消息中链接的视觉效果。

#### Scenario: 链接颜色
- **WHEN** 渲染链接
- **THEN** 颜色#6e54ee，下划线1px solid #a891ff

#### Scenario: 链接hover
- **WHEN** 鼠标悬停在链接
- **THEN** 颜色#5f46df，下划线2px solid #6e54ee

#### Scenario: 外部链接图标
- **WHEN** 链接指向外部网站
- **THEN** 链接后显示ExternalLink图标（14px）

### Requirement: 表格渲染支持
系统SHALL支持渲染Markdown表格，使用细线边框。

#### Scenario: 表格边框
- **WHEN** 渲染表格
- **THEN** border 1px solid #e7e8ee，border-radius 10px

#### Scenario: 表头样式
- **WHEN** 渲染表头
- **THEN** 背景#fafafa，字体13px/600，颜色#111827

#### Scenario: 表格单元格
- **WHEN** 渲染单元格
- **THEN** padding 10px 12px，字体13px/400

#### Scenario: 斑马纹
- **WHEN** 表格有多行
- **THEN** 偶数行背景#fcfcfd，奇数行背景#ffffff

### Requirement: 流式消息优化
系统SHALL优化流式消息的渲染性能和用户体验。

#### Scenario: 增量更新
- **WHEN** 接收text_delta事件
- **THEN** 只更新最后一条消息的content，不重渲染整个列表

#### Scenario: 防抖渲染
- **WHEN** 高频接收delta（>60次/秒）
- **THEN** 使用requestAnimationFrame节流，最多60fps

#### Scenario: 流式指示器
- **WHEN** 消息正在流式输出
- **THEN** 光标处显示跳动的指示器

### Requirement: 消息加载状态
系统SHALL在消息加载时显示骨架屏，提升体验。

#### Scenario: 骨架屏样式
- **WHEN** 消息加载中
- **THEN** 显示3条灰色矩形，宽度递减，带shimmer动画

#### Scenario: 骨架屏动画
- **WHEN** 骨架屏显示
- **THEN** 背景渐变流动效果

### Requirement: 消息错误状态
系统SHALL在消息加载失败时显示错误提示。

#### Scenario: 错误提示样式
- **WHEN** 消息加载失败
- **THEN** 红色边框卡片，背景#fef2f2

#### Scenario: 重试按钮
- **WHEN** 错误提示中
- **THEN** 显示"重试"按钮，点击重新加载

### Requirement: 消息动画效果
系统SHALL为新消息添加淡入动画。

#### Scenario: 新消息淡入
- **WHEN** 新消息添加
- **THEN** 从opacity 0到1淡入，200ms ease-out

#### Scenario: 流式文字淡入
- **WHEN** 流式内容更新
- **THEN** 新文字从左侧淡入，150ms

### Requirement: 工具执行详情扩展
系统SHALL在消息中保存工具执行的扩展详情。

#### Scenario: 详情数据结构
- **WHEN** 工具执行完成
- **THEN** toolExecutionDetails包含完整的时序和摘要信息

#### Scenario: 输入摘要
- **WHEN** 工具输入参数复杂
- **THEN** inputSummary字段存储简化的输入描述

#### Scenario: 输出摘要
- **WHEN** 工具输出结果复杂
- **THEN** outputSummary字段存储简化的输出描述
