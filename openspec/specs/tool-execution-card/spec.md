# Tool Execution Card Specification

## Purpose

This capability captures the accepted Chat redesign requirements synced from the chat-ui-redesign-v2 change.

## Requirements

### Requirement: 双卡片架构
系统SHALL为每个工具调用渲染两个版本的卡片：消息流中的详细卡片和右侧面板的紧凑卡片，两者通过Zustand Store实时同步。

#### Scenario: 详细卡片渲染位置
- **WHEN** AI助手执行工具调用
- **THEN** 在消息流中渲染详细版工具执行卡，max-width 820px

#### Scenario: 紧凑卡片渲染位置
- **WHEN** 存在工具调用
- **THEN** 在右侧任务面板"工具执行"区域渲染紧凑版卡片，宽度自适应面板

#### Scenario: 双卡片数据同步
- **WHEN** 工具执行状态变化（running→success）
- **THEN** 两个卡片同时更新状态显示，无延迟

### Requirement: 详细卡片布局结构
系统SHALL在消息流中的工具执行卡包含顶部信息行、输入/结果两列区域和底部操作行。

#### Scenario: 卡片整体样式
- **WHEN** 渲染详细工具卡
- **THEN** padding 18px，border 1px solid #86efac，border-radius 14px，背景渐变从#f8fffb到#ffffff，shadow 0 8px 22px rgba(34,197,94,0.08)

#### Scenario: 顶部信息行布局
- **WHEN** 卡片顶部渲染
- **THEN** 从左到右显示：工具图标（34px）+ 工具名称 + 函数名 + 状态chip + 折叠按钮

#### Scenario: 中部两列布局
- **WHEN** 卡片展开状态
- **THEN** 使用grid两列布局，左列显示输入，右列显示结果，中间1px分割线

#### Scenario: 底部操作行
- **WHEN** 卡片底部渲染
- **THEN** 显示执行耗时和"查看详情"链接（可选）

### Requirement: 工具图标显示
系统SHALL根据工具类型显示对应的图标和颜色主题。

#### Scenario: 成功工具图标
- **WHEN** 工具执行成功
- **THEN** 显示34x34px圆角容器（radius 10px），背景#ecfdf3，图标颜色#22c55e

#### Scenario: 运行中工具图标
- **WHEN** 工具正在执行
- **THEN** 显示34x34px圆角容器，背景#f4f1ff，图标颜色#6e54ee，带旋转动画

#### Scenario: 失败工具图标
- **WHEN** 工具执行失败
- **THEN** 显示34x34px圆角容器，背景#fef2f2，图标颜色#ef4444

#### Scenario: 工具类型图标映射
- **WHEN** 识别工具类型
- **THEN** searchProducts使用Search图标，analyzeData使用BarChart图标，sendEmail使用Mail图标

### Requirement: 工具名称和函数名显示
系统SHALL显示用户友好的工具名称和技术性的函数名。

#### Scenario: 工具名称显示
- **WHEN** 工具图标右侧
- **THEN** 显示工具名称（如"搜索产品"），字体14px/600，颜色#111827

#### Scenario: 函数名显示
- **WHEN** 工具名称下方
- **THEN** 显示函数名（如"searchProducts"），字体12px/400，颜色#7b8494，mono字体

#### Scenario: 函数名可复制
- **WHEN** 用户点击函数名
- **THEN** 复制函数名到剪贴板，显示"已复制"toast

### Requirement: 状态Chip显示
系统SHALL使用圆角chip显示工具的执行状态，颜色跟随状态变化。

#### Scenario: 运行中chip
- **WHEN** 工具状态为running
- **THEN** 显示"运行中"chip，背景#f4f1ff，文字#6e54ee，高度24px，圆角999px

#### Scenario: 已完成chip
- **WHEN** 工具状态为success
- **THEN** 显示"已完成"chip，背景#ecfdf3，文字#16a34a

#### Scenario: 失败chip
- **WHEN** 工具状态为error
- **THEN** 显示"失败"chip，背景#fef2f2，文字#dc2626

#### Scenario: 等待确认chip
- **WHEN** 工具需要用户确认
- **THEN** 显示"等待确认"chip，背景#fff7ed，文字#f59e0b

### Requirement: 输入参数显示
系统SHALL在左列显示工具调用的输入参数，支持JSON格式化。

#### Scenario: 输入区域标题
- **WHEN** 左列顶部
- **THEN** 显示"输入"标签，字体12px/600，颜色#7b8494

#### Scenario: 简单参数显示
- **WHEN** 输入参数为简单键值对
- **THEN** 显示"参数名: 参数值"，字体13px/500，颜色#111827

#### Scenario: 复杂对象显示
- **WHEN** 输入参数为嵌套对象或数组
- **THEN** 使用JSON格式化显示，支持折叠/展开

#### Scenario: 参数过长截断
- **WHEN** 参数值超过200字符
- **THEN** 截断显示前100字符+"..."，点击"查看完整"展开

### Requirement: 执行结果显示
系统SHALL在右列显示工具执行的结果，根据结果类型智能渲染。

#### Scenario: 结果区域标题
- **WHEN** 右列顶部
- **THEN** 显示"结果"标签，字体12px/600，颜色#7b8494

#### Scenario: 文本结果显示
- **WHEN** 结果为纯文本
- **THEN** 显示文本内容，字体13px/500，颜色#111827，保留换行

#### Scenario: 对象结果显示
- **WHEN** 结果为JSON对象
- **THEN** 使用格式化的JSON显示，支持语法高亮

#### Scenario: 数组结果显示
- **WHEN** 结果为数组
- **THEN** 显示数组长度（如"找到3个结果"），点击展开查看列表

#### Scenario: 错误结果显示
- **WHEN** 工具执行失败
- **THEN** 显示错误信息，字体13px，颜色#dc2626，带错误图标

### Requirement: 执行耗时显示
系统SHALL在卡片底部显示工具的执行耗时。

#### Scenario: 耗时计算
- **WHEN** 工具执行完成
- **THEN** 计算durationMs = endTime - startTime

#### Scenario: 耗时显示格式
- **WHEN** 耗时<1秒
- **THEN** 显示"XXXms"（如"450ms"）

#### Scenario: 耗时显示格式（秒级）
- **WHEN** 耗时≥1秒
- **THEN** 显示"X.Xs"（如"2.3s"）

#### Scenario: 耗时位置
- **WHEN** 卡片底部左侧
- **THEN** 显示时钟图标（14px）+ 耗时文本，字体12px，颜色#7b8494

### Requirement: 卡片折叠/展开
系统SHALL支持用户折叠/展开工具执行卡片，隐藏输入和结果详情。

#### Scenario: 折叠按钮显示
- **WHEN** 卡片顶部右侧
- **THEN** 显示折叠/展开图标按钮（ChevronDown/ChevronUp），尺寸20px

#### Scenario: 点击折叠
- **WHEN** 用户点击折叠按钮且卡片当前展开
- **THEN** 隐藏输入/结果区域，只显示顶部信息行，图标旋转180度

#### Scenario: 点击展开
- **WHEN** 用户点击折叠按钮且卡片当前折叠
- **THEN** 显示输入/结果区域，图标旋转回0度

#### Scenario: 默认展开状态
- **WHEN** 工具卡片首次渲染
- **THEN** 默认展开状态，显示完整内容

### Requirement: 紧凑卡片布局
系统SHALL在右侧面板渲染紧凑版工具卡，信息密度更高，高度约246px。

#### Scenario: 紧凑卡片样式
- **WHEN** 右侧面板渲染工具卡
- **THEN** padding 14px，border 1px solid #e7e8ee，border-radius 10px，背景#ffffff

#### Scenario: 紧凑卡片标题行
- **WHEN** 紧凑卡片顶部
- **THEN** 显示工具图标（24px）+ 工具名称（13px/600）+ 状态chip

#### Scenario: 紧凑卡片输入显示
- **WHEN** 紧凑卡片中部
- **THEN** 显示"输入"标签和简化的参数（单行显示，超出省略）

#### Scenario: 紧凑卡片结果显示
- **WHEN** 紧凑卡片下部
- **THEN** 显示"结果"标签和摘要文本（如"找到1个相关产品"）

#### Scenario: 紧凑卡片查看按钮
- **WHEN** 紧凑卡片底部
- **THEN** 显示"查看结果"按钮，紫色描边，高度32px

#### Scenario: 查看按钮点击
- **WHEN** 用户点击"查看结果"
- **THEN** 滚动到消息流中对应的详细工具卡位置

### Requirement: 工具执行动画
系统SHALL为工具执行过程添加视觉反馈动画。

#### Scenario: 运行中动画
- **WHEN** 工具状态为running
- **THEN** 工具图标旋转动画（360度，2s，无限循环）

#### Scenario: 完成动画
- **WHEN** 工具从running变为success
- **THEN** 状态chip淡入，带轻微的scale动画（1.0→1.05→1.0，300ms）

#### Scenario: 失败动画
- **WHEN** 工具从running变为error
- **THEN** 卡片边框闪烁红色一次，状态chip淡入

### Requirement: 工具执行状态同步
系统SHALL通过Zustand Store的toolExecutionState实现双卡片同步。

#### Scenario: SSE事件更新store
- **WHEN** 收到tool_call_start事件
- **THEN** 更新store.toolExecutionState[toolCallId] = {status: 'running', startTime}

#### Scenario: 工具完成更新store
- **WHEN** 收到tool_result事件
- **THEN** 更新store.toolExecutionState[toolCallId] = {status: 'success', endTime, durationMs}

#### Scenario: 组件订阅store
- **WHEN** 详细卡片和紧凑卡片渲染
- **THEN** 两者都订阅useChatStore(state => state.toolExecutionState[toolCallId])

#### Scenario: store变化触发重渲染
- **WHEN** toolExecutionState更新
- **THEN** 两个卡片组件同时重渲染，显示最新状态

### Requirement: 多工具并发显示
系统SHALL支持同时显示多个工具调用的执行卡片，按时间顺序排列。

#### Scenario: 消息流中多工具显示
- **WHEN** AI助手并发执行多个工具
- **THEN** 消息流按tool_call_start时间顺序显示多个详细卡片

#### Scenario: 右侧面板多工具显示
- **WHEN** 存在多个工具调用
- **THEN** 右侧面板显示"工具执行 (2/3)"标题，列表显示所有工具的紧凑卡片

#### Scenario: 工具列表滚动
- **WHEN** 工具数量超过3个
- **THEN** 右侧面板工具区域可滚动，最多显示前5个

### Requirement: 工具执行历史记录
系统SHALL保留当前会话的所有工具执行记录，支持回溯查看。

#### Scenario: 历史工具卡片样式
- **WHEN** 工具执行已完成且有新工具开始
- **THEN** 旧工具卡片透明度降低到80%，区分当前和历史

#### Scenario: 历史工具折叠
- **WHEN** 会话有超过5个工具调用
- **THEN** 只保留最近3个展开，其余自动折叠

#### Scenario: 清空历史按钮
- **WHEN** 工具执行历史超过10个
- **THEN** 显示"清空历史"按钮，点击后清除已完成的工具卡片

### Requirement: 工具卡片响应式适配
系统SHALL在不同屏幕尺寸下适配工具卡片的布局。

#### Scenario: Desktop布局（≥1024px）
- **WHEN** 视口宽度≥1024px
- **THEN** 详细卡片使用两列布局（输入|结果）

#### Scenario: Tablet布局（768-1023px）
- **WHEN** 视口宽度在768-1023px
- **THEN** 详细卡片改为单列布局（输入在上，结果在下）

#### Scenario: Mobile布局（<768px）
- **WHEN** 视口宽度<768px
- **THEN** 详细卡片单列布局，右侧面板工具卡片隐藏或移到底部drawer
