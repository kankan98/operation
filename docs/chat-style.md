# 跨境运营助手 Agent 工作台样式设计系统

> 用途：给 AI 或前端实现者还原当前生成图的视觉风格与界面效果。  
> 参考图：`C:\Users\15528\.codex\generated_images\019ec4e1-14a3-7731-903d-08b1867f6711\ig_0dbf0099ccba6c35016a317fb0ae20819b8925bda8d13eef3a.png`  
> 画布尺寸：`1724 x 912`，桌面 Web App，浅色中文 SaaS Agent 工作台。

## 1. 风格总则

这是一个“轻量、克制、专业”的跨境运营 AI Agent 工作台。视觉关键词：

- 浅色 SaaS 后台
- 紫色主品牌
- 三栏 Agent 工作区
- 细线边框
- 柔和阴影
- 高信息密度但不拥挤
- 主流 AI Agent 对话体验

必须保持整体安静、干净、可读，不要做成营销页、暗色页、玻璃拟态页或强渐变视觉。

### 不可改变

- 主色必须是紫色系，核心色接近 `#6E54EE`。
- 背景必须保持白色/近白色。
- 桌面端必须保留四区结构：主导航、会话列表、对话区、右侧任务面板。
- 图标必须是统一线性图标风格，约 `1.5px` stroke。
- 卡片、气泡、工具调用块都必须使用细边框 + 轻阴影。
- 不使用大面积彩色背景，不使用暗黑模式，不使用装饰性光斑/气泡/复杂渐变。

## 2. 设计 Token

### 颜色

```css
:root {
  /* Brand */
  --color-primary: #6e54ee;
  --color-primary-hover: #5f46df;
  --color-primary-active: #523cc8;
  --color-primary-soft: #f4f1ff;
  --color-primary-softer: #f8f6ff;
  --color-primary-border: #a891ff;
  --color-primary-ring: rgba(110, 84, 238, 0.18);

  /* Base */
  --color-page: #fcfcfd;
  --color-surface: #ffffff;
  --color-surface-subtle: #fafafa;
  --color-surface-muted: #f7f7fb;
  --color-panel: #ffffff;

  /* Text */
  --color-text: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #7b8494;
  --color-text-faint: #a0a7b6;
  --color-on-primary: #ffffff;

  /* Border */
  --color-border: #e7e8ee;
  --color-border-soft: #eff0f4;
  --color-border-strong: #d8dbe5;

  /* Semantic */
  --color-success: #22c55e;
  --color-success-soft: #ecfdf3;
  --color-success-border: #86efac;
  --color-warning: #f59e0b;
  --color-warning-soft: #fff7ed;
  --color-danger: #ef4444;
  --color-danger-soft: #fef2f2;
  --color-info: #3b82f6;
  --color-info-soft: #eff6ff;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 4px 10px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 12px 28px rgba(15, 23, 42, 0.08);
  --shadow-primary: 0 8px 20px rgba(110, 84, 238, 0.24);
}
```

### 字体

```css
:root {
  --font-sans: "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;

  --text-2xs: 11px;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 15px;
  --text-lg: 16px;
  --text-xl: 18px;

  --leading-tight: 1.25;
  --leading-normal: 1.55;
  --leading-relaxed: 1.7;
}
```

文字规则：

- 页面标题：`16px / 600 / #111827`
- 区块标题：`14px / 600 / #111827`
- 正文：`14px / 400 / line-height 1.65`
- 辅助说明：`12px / 400 / #7b8494`
- 时间、状态、小标签：`11-12px`
- 数字、时间建议使用 `font-variant-numeric: tabular-nums`
- 不要使用负字距，`letter-spacing: 0`

### 间距与圆角

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;
}
```

规则：

- 所有布局使用 `4/8px` 节奏。
- 普通按钮和列表项圆角 `8px`。
- 输入框、会话卡片、消息卡片圆角 `10-12px`。
- 大型工具调用卡片圆角 `14-16px`。
- 不要超过 `16px` 的大圆角，除非是圆形头像/图标按钮。

## 3. 页面骨架

桌面画布宽高参考 `1724 x 912`。布局为固定侧栏 + 弹性主内容。

```css
.agent-shell {
  display: grid;
  grid-template-columns: 208px 272px minmax(720px, 1fr) 314px;
  height: 100vh;
  min-height: 820px;
  background: var(--color-page);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

### 区域尺寸

| 区域 | 宽度 | 背景 | 边框 |
| --- | ---: | --- | --- |
| 主导航 | `208px` | `#ffffff` | 右边 `1px #e7e8ee` |
| 会话列表 | `272px` | `#ffffff` | 右边 `1px #e7e8ee` |
| 对话主区 | 弹性，约 `920-960px` | `#fcfcfd` | 无强边框 |
| 右侧任务面板 | `314px` | `#ffffff` | 左边 `1px #e7e8ee` |

### 顶部栏

- 高度：`60px`
- 背景：`#ffffff`
- 底边：`1px solid #e7e8ee`
- 左右内边距：`24px`
- 标题左对齐，右侧放语言、主题、头像等 `32px` 图标按钮。

## 4. 主导航 Sidebar

```css
.app-sidebar {
  padding: 20px 16px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
```

### 品牌区

- Logo：`32 x 32px`，紫色圆角方块，圆角 `9px`。
- Logo 背景可用轻微线性渐变：`linear-gradient(135deg, #7c5cff, #6e54ee)`。
- 品牌名：`15px / 700 / #111827`
- 副标题：`12px / #8b93a3`
- 品牌区高度约 `44px`，下方留 `32px`。

### 导航项

```css
.nav-item {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 9px;
  color: #667085;
  font-size: 14px;
  font-weight: 500;
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}
```

细节：

- 图标 `18px`，stroke `1.5px`。
- active 状态必须是浅紫底 + 紫色文字/图标，不使用左侧粗条。
- item 间距 `8px`。
- 底部账户区固定在底部，包含计划卡和用户信息。

## 5. 会话列表

会话列表是本设计的核心之一，必须比普通列表更有组织感。

### 面板结构

```css
.conversation-panel {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.conversation-header {
  height: 60px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.conversation-search {
  height: 36px;
  margin: 0 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: #fff;
}
```

### 分组

必须使用分组标签：

- `置顶`
- `今天`
- `昨日`
- `更早`

分组标题样式：

```css
.conversation-group-title {
  margin: 18px 16px 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 600;
}
```

### 会话卡片

```css
.conversation-item {
  margin: 0 14px 8px;
  padding: 12px;
  min-height: 64px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
}

.conversation-item:hover {
  background: #fafafa;
  border-color: var(--color-border-soft);
}

.conversation-item.active {
  background: var(--color-primary-softer);
  border-color: var(--color-primary-border);
  box-shadow: 0 6px 16px rgba(110, 84, 238, 0.08);
}
```

卡片内容：

- 左侧图标 `18px`，灰色；active/pinned 时紫色。
- 标题 `13px / 600 / #111827`
- 摘要 `12px / #7b8494`，单行省略。
- 时间在右上角，`12px / #7b8494`
- 未读点：`6px` 紫色圆点。
- active 卡片内可显示“正在分析…”这类任务状态。

## 6. 对话主区

### 顶部对话标题栏

```css
.chat-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
```

- 标题：`15px / 700`
- 编辑图标：`16px`，灰色，hover 变紫。
- 主区左右 padding：`28px`
- 消息最大宽度：`840px`

### 消息流

```css
.message-stream {
  padding: 28px 28px 116px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

消息行规则：

- assistant 消息左对齐。
- user 消息也可在左侧显示任务请求，但短用户气泡可右对齐。
- 每条消息要有头像/agent 图标，尺寸 `36px`。
- 气泡与头像间距 `12px`。
- 时间放在消息正文底部或消息标题下方，`12px #7b8494`。

## 7. 对话气泡与文本流

### Assistant 消息卡

```css
.assistant-card {
  max-width: 820px;
  padding: 18px 18px 16px;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
```

文本排版：

- 首段与标题距离要紧凑，段落间距 `10-12px`。
- 正文 line-height `1.65`。
- 分割线：`1px solid #edf0f5`，上下 `14px`。
- 重点区域使用浅紫引用块。

### 任务摘要引用块

```css
.task-summary {
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f4f1ff, #faf9ff);
  color: #37304f;
}
```

引用块细节：

- 左上角使用 `quote` 或 Sparkle 小图标，紫色。
- 标题 `13px / 700 / #6e54ee`
- 正文 `13px / 1.6`

### 编号问题列表

```css
.question-list {
  display: grid;
  gap: 8px;
}

.question-index {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
```

规则：

- 编号小方块 `16 x 16px`。
- 行高 `20-22px`。
- 问题标题加粗，补充说明常规字重。

### 勾选清单

- 勾选图标使用绿色方块/圆角图标，`16px`。
- 清单行间距 `8px`。
- 文案 `13px / #374151`。

## 8. 工具调用卡片

工具调用是 Agent 风格的关键，必须做成现代执行轨迹卡，而不是普通提示框。

### 主工具卡

```css
.tool-call-card {
  max-width: 820px;
  padding: 18px 18px;
  border: 1px solid var(--color-success-border);
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fffb 0%, #ffffff 100%);
  box-shadow: 0 8px 22px rgba(34, 197, 94, 0.08);
}
```

结构：

1. 顶部行：图标 + 工具名称 + 函数名 + 状态 chip + 折叠箭头。
2. 中间：输入/结果两列。
3. 底部：可选的耗时或查看详情。

### 工具图标

```css
.tool-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-success-soft);
  color: var(--color-success);
}
```

### 状态 Chip

```css
.status-chip.success {
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
}

.status-chip.running {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
```

状态文案：

- 运行中
- 已完成
- 等待确认
- 失败

### 输入/结果区

```css
.tool-call-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 18px;
}

.tool-call-body > * + * {
  border-left: 1px solid var(--color-border);
  padding-left: 24px;
}
```

字段：

- 小标题：`12px / 600 / #7b8494`
- 值：`13px / 600 / #111827`
- 函数名：`12px / #7b8494`，可使用英文如 `searchProducts`

## 9. 右侧任务面板

右侧面板用于“任务概览 + 工具执行 + 笔记”，不是聊天内容的重复。

```css
.right-panel {
  padding: 22px 16px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
}

.side-section {
  margin-bottom: 28px;
}

.side-card {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--shadow-xs);
}
```

### 任务概览卡

- 标题：`任务概览`，`15px / 700`
- 卡片内分组字段使用小标签：`当前任务`、`开始时间`、`关联产品`、`平台`
- 字段 label：`12px #8b93a3`
- 字段 value：`13px #111827 / 500`
- 状态 `进行中`：紫色圆点 + 紫色文字。

### 右侧工具执行卡

- 标题：`工具执行 (1/1)`
- 卡片高度约 `246px`
- 顶部工具标题行与主工具卡一致但更紧凑。
- 输入框可用只读样式：`height 32px`，`border #e7e8ee`，`radius 6px`。
- 底部按钮为描边紫色按钮，height `32px`。

### 笔记卡

- 空状态居中。
- 文案颜色 `#9aa3b2`。
- 新建笔记按钮使用紫色文字，不做实体按钮。

## 10. 底部输入 Composer

输入区固定在主对话区底部，类似现代 Agent 工具。

```css
.composer-wrap {
  position: sticky;
  bottom: 0;
  padding: 14px 18px 18px;
  background: linear-gradient(180deg, rgba(252,252,253,0), #fcfcfd 24%);
}

.composer {
  min-height: 86px;
  padding: 14px;
  border: 1px solid var(--color-border-strong);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}
```

结构：

- 输入提示在上方：`输入消息...（Enter 发送，Shift+Enter 换行）`
- 下方左侧是工具按钮：附件、添加工具、提示词库。
- 下方右侧是发送按钮。

### 发送按钮

```css
.send-button {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #7c5cff, #6e54ee);
  box-shadow: var(--shadow-primary);
}
```

发送按钮图标必须居中，使用纸飞机线性图标。

## 11. 组件状态

### Hover

- 列表 hover：背景 `#fafafa`，边框变 `#eff0f4`。
- 图标按钮 hover：背景 `#f4f1ff`，图标变紫色。
- 紫色描边按钮 hover：背景 `#f8f6ff`。

### Focus

```css
:focus-visible {
  outline: 3px solid var(--color-primary-ring);
  outline-offset: 2px;
}
```

### Active / Selected

- 使用浅紫底 `#f4f1ff` 或 `#f8f6ff`。
- 边框可用 `#a891ff`。
- 文字/图标使用 `#6e54ee`。

### Disabled

- opacity `0.48`
- 禁止阴影增强。
- cursor `not-allowed`

## 12. 图标规则

- 使用 Lucide、Heroicons 或同类线性图标。
- stroke width `1.5px`。
- 主导航图标 `18px`。
- 工具/头像图标 `20px`。
- 图标按钮点击区域最小 `32 x 32px`，重要按钮 `40 x 40px`。
- 禁止使用 emoji 作为结构性图标。

## 13. AI 还原提示词

把下面这段给设计/生成类 AI，可最大程度还原本样式：

```text
请生成一个中文桌面 Web App 的高保真 UI，产品是“跨境运营助手 / AI 智能运营”的 Agent 工作台。

画布为 1724x912，浅色 SaaS 后台风格，白色和近白背景，核心品牌色为紫色 #6E54EE。整体要克制、专业、干净，不要暗黑模式，不要营销页，不要大面积渐变，不要装饰性光斑。

布局必须为四栏：
1. 左侧主导航 208px，白底，右边 1px 浅灰边框。顶部有 32px 紫色 logo、产品名“跨境运营助手”、副标题“AI 智能运营”。导航项包括仪表盘、商品、预警、智能助手、设置。当前选中“智能助手”，使用浅紫底 #F4F1FF、紫色文字和线性图标。
2. 会话列表 272px，白底，右边 1px 浅灰边框。顶部标题“对话”和一个 32px 新建按钮；下方 36px 搜索框。会话列表按“置顶 / 今天 / 昨日 / 更早”分组。每条会话是 10px 圆角卡片，active 会话使用 #F8F6FF 背景、#A891FF 边框和轻阴影，显示标题、摘要、时间、未读紫点。
3. 中央对话区为弹性宽度，顶部 60px 标题栏，标题为“广告ASIN监控系统优化方案”，旁边有编辑图标。消息流左右 padding 28px。使用 Agent 对话排版：用户消息、工具调用卡片、助手回复卡片。
4. 右侧任务面板 314px，白底，左边 1px 浅灰边框。包含“任务概览”、“工具执行 (1/1)”、“笔记”三个区块，每个区块使用 10px 圆角白色卡片、1px #E7E8EE 边框。

对话气泡与文本流：
- Assistant 消息是白色卡片，max-width 820px，padding 18px，border #E7E8EE，radius 12px，soft shadow。
- 正文中文排版 line-height 1.65，段落间距 10-12px。
- 消息内有浅紫色任务摘要引用块，背景从 #F4F1FF 到 #FAF9FF，标题紫色。
- 编号问题列表使用 16x16 紫色小方块数字标记。
- 勾选清单使用绿色 16px check 图标。
- 消息底部有复制、点赞、点踩等线性图标，颜色 #8B93A3。

工具调用：
- 工具调用卡是淡绿色执行卡，radius 14px，border #86EFAC，背景 #F8FFFB 到 #FFFFFF，阴影很轻。
- 顶部包含绿色搜索图标、工具名“搜索产品”、函数名“searchProducts”、状态 chip “已完成”。
- 卡片中部为输入/结果两列，中间 1px 分割线。输入为“ASIN或关键词：BOD1234567”，结果为“找到 1 个相关产品”。
- 右侧面板的工具执行卡使用同样信息，但更加紧凑，并带“查看结果”紫色描边按钮。

底部输入区：
- 固定在主对话区底部，外层有从透明到 #FCFCFD 的渐隐背景。
- 输入 composer 是白色大圆角卡片，min-height 86px，radius 12px，border #D8DBE5，轻阴影。
- 上方 placeholder 为“输入消息...（Enter 发送，Shift+Enter 换行）”。
- 下方左侧有“附件 / 添加工具 / 提示词库”小按钮，右侧是 40x40 紫色渐变发送按钮，纸飞机线性图标。

视觉 token：
- 主色 #6E54EE，hover #5F46DF，浅紫背景 #F4F1FF，极浅紫 #F8F6FF，紫色边框 #A891FF。
- 页面背景 #FCFCFD，卡片 #FFFFFF，边框 #E7E8EE，强边框 #D8DBE5。
- 主文字 #111827，次级文字 #4B5563，弱文字 #7B8494。
- 成功色 #22C55E，成功浅底 #ECFDF3，成功边框 #86EFAC。
- 所有图标使用 1.5px stroke 的线性图标，不使用 emoji。
- 所有间距遵循 4/8px 节奏，普通圆角 8-12px，大工具卡 14px。

整体效果必须像真实可上线的主流 AI Agent SaaS 产品截图，高信息密度但不拥挤，边框细、阴影轻、文字清晰、对齐精准。
```

## 14. CSS 基础片段

```css
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-width: 1280px;
  min-height: 820px;
  font-family: var(--font-sans);
  background: var(--color-page);
  color: var(--color-text);
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.surface {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.icon-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #667085;
  background: transparent;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.icon-button:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.primary-button {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(135deg, #7c5cff, var(--color-primary));
  box-shadow: var(--shadow-primary);
  font-size: 13px;
  font-weight: 600;
}

.outline-primary-button {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-primary-border);
  border-radius: 8px;
  color: var(--color-primary);
  background: #fff;
  font-size: 13px;
  font-weight: 600;
}
```

## 15. 还原验收清单

- 页面第一眼必须是“浅色紫色 AI Agent 后台”，不能偏蓝、偏绿或暗色。
- 四栏比例必须接近 `208 / 272 / flex / 314`。
- 主导航 active、会话 active、发送按钮三处必须使用同一紫色体系。
- 会话列表必须有分组和 active 卡片，不允许只是平铺文字列表。
- 工具调用必须是独立执行卡，有工具名、函数名、输入、结果、状态。
- Assistant 回复必须有任务摘要、编号问题、执行步骤，不允许整段纯文本。
- 右侧面板必须包含任务概览和工具执行，与中间工具卡形成呼应。
- 输入区必须像现代 agent composer，而不是普通单行 input。
- 边框必须细，阴影必须轻，整体不能有厚重卡片或强烈拟物。
- 所有中文文本必须清晰可读，不能出现糊字、重叠或截断。
