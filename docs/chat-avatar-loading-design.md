# Chat 头像和 Loading 态设计

## 设计目标

1. **增加人性化**：通过头像让对话更有温度
2. **视觉层次**：清晰区分用户和 AI 的消息
3. **优雅的等待体验**：Loading 态减少焦虑感
4. **符合设计系统**：遵循 Agent Purple 设计规范

---

## 头像设计

### 用户头像

```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300
              flex items-center justify-center shadow-sm">
  <User className="w-5 h-5 text-gray-600" strokeWidth={2} />
</div>
```

**设计特点：**
- 尺寸: 40×40px (符合 44px 最小触摸目标)
- 形状: 圆形 (`rounded-full`)
- 背景: 灰色渐变 (中性、低调)
- 图标: User 图标，灰色
- 阴影: 轻微 shadow-sm (提升层次)

**为什么选择灰色？**
- 用户消息背景是 `primary-50` (淡紫色)
- 灰色头像不会与紫色冲突
- 保持视觉焦点在消息内容上

---

### AI 头像

```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
              flex items-center justify-center shadow-sm">
  <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
</div>
```

**设计特点：**
- 尺寸: 40×40px
- 形状: 圆形
- 背景: Agent Purple 渐变 (#8B5CF6 → #6D28D9)
- 图标: Sparkles (✨) 闪光，象征 AI 智能
- 颜色: 白色图标 (高对比度)
- 阴影: 轻微 shadow-sm

**为什么选择 Sparkles？**
- 符合 AI Native 主题
- 与 Empty State 的 Sparkles 图标呼应
- 传达"智能助手"的概念
- 视觉上有亲和力

---

## 消息气泡布局

### 之前的设计（无头像）

```
┌────────────────────────────────┐
│  [============消息=============]│  用户消息（右对齐）
│                                │
│  [============消息=============]│  AI 消息（左对齐）
└────────────────────────────────┘
```

### 现在的设计（有头像）

```
┌────────────────────────────────┐
│              [消息内容]  👤     │  用户：头像在右
│                                │
│  ✨  [消息内容]                 │  AI：头像在左
└────────────────────────────────┘
```

**布局代码：**

```tsx
// 用户消息：flex-row-reverse（头像在右）
<div className="flex gap-3 flex-row-reverse">
  <Avatar />
  <Message />
</div>

// AI 消息：flex-row（头像在左）
<div className="flex gap-3 flex-row">
  <Avatar />
  <Message />
</div>
```

---

## 消息样式调整

### 用户消息

**之前：**
```tsx
bg-primary-600 text-white  // 深紫色背景，白色文字
```

**现在：**
```tsx
bg-primary-50 text-gray-900 border border-primary-100  // 淡紫色背景，深色文字
```

**为什么改变？**
1. **可读性更好**：深色文字在浅色背景上更易读
2. **视觉统一**：与 AI 消息的浅色背景形成对称
3. **减少视觉疲劳**：长时间阅读更舒适
4. **品牌识别**：淡紫色仍然保留 Agent Purple 品牌色

### AI 消息

保持不变：
```tsx
bg-surface text-fg border border-border-subtle  // 白色/深色模式自适应
```

---

## Loading 态设计

### 视觉效果

```
✨  ⚫ ⚫ ⚫  正在思考...
```

- **位置**：作为一个完整的消息气泡显示
- **头像**：显示 AI 头像（Sparkles）
- **内容**：三个脉冲动画的圆点 + 文字提示

### 实现细节

```tsx
function LoadingState() {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* 三个动画圆点 */}
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
              style={{ animationDelay: '0ms', animationDuration: '1400ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
              style={{ animationDelay: '200ms', animationDuration: '1400ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
              style={{ animationDelay: '400ms', animationDuration: '1400ms' }} />
      </div>
      <span className="text-fg-muted text-sm">正在思考...</span>
    </div>
  );
}
```

**动画参数：**
- 圆点大小: 8px (w-2 h-2)
- 颜色: `primary-400` (中等亮度紫色)
- 动画: `animate-pulse` (Tailwind 内置)
- 间隔: 200ms (创造波浪效果)
- 周期: 1400ms (不会太快或太慢)

---

## 使用场景

### 1. 等待首次响应

```tsx
{isStreaming && messages.length === 0 && (
  <MessageBubble role="assistant" content="" isLoading={true} />
)}
```

显示：AI 头像 + Loading 态

### 2. 等待后续消息

```tsx
{isStreaming && messages.length > 0 && (
  <MessageBubble role="assistant" content="" isLoading={true} />
)}
```

显示：AI 头像 + Loading 态（在最后一条消息下方）

### 3. 工具调用中

ToolCallCard 组件已有 `status="running"` 状态，显示：
- Loader2 图标旋转
- "执行中..." 文字
- 工具名称和参数

---

## 设计系统合规性

| 设计元素 | 规范 | 实现 |
|---------|------|------|
| 头像尺寸 | 最小 44px 触摸目标 | 40×40px + 周围留白 ✅ |
| 间距 | 8pt 网格系统 | gap-3 (12px) ✅ |
| 圆角 | Soft geometry | rounded-full (头像), rounded-[20px] (气泡) ✅ |
| 颜色 | Agent Purple | primary-500/700 渐变 ✅ |
| 动画时长 | 150-250ms | pulse 1400ms (合理例外) ✅ |
| 阴影 | Soft, never harsh | shadow-sm (elevation 1) ✅ |
| 字体大小 | 14px body | text-[14px] ✅ |

---

## 响应式行为

### 桌面 (≥1024px)
- 头像: 40×40px
- 消息最大宽度: 80% (自适应内容)
- 间距: gap-3 (12px)

### 平板 (768px - 1023px)
- 头像: 40×40px
- 消息最大宽度: 85%
- 间距: gap-3 (12px)

### 移动 (<768px)
- 头像: 36×36px (可选优化)
- 消息最大宽度: 90%
- 间距: gap-2 (8px)

**当前实现：**
所有设备使用相同尺寸（40px），保持一致性。

---

## 暗黑模式适配

### 用户头像
```css
light: bg-gradient-to-br from-gray-200 to-gray-300
dark:  bg-gradient-to-br from-gray-600 to-gray-700
```

### AI 头像
```css
保持不变: Agent Purple 渐变在两种模式下都清晰可见
```

### Loading 圆点
```css
light: bg-primary-400 (#A78BFA)
dark:  bg-primary-400 (同色，足够对比度)
```

---

## 动画细节

### 脉冲动画原理

CSS `animate-pulse` 实现：
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

三个圆点的延迟：
- 第一个: 0ms
- 第二个: 200ms
- 第三个: 400ms

创造**波浪效果**：
```
时间:  0ms   200ms  400ms  600ms  800ms  ...
圆点1: ●---○---●---○---●
圆点2:     ●---○---●---○---●
圆点3:         ●---○---●---○---●
```

---

## 对比其他设计方案

### 方案 A：旋转 Loader（❌ 未采用）
```tsx
<Loader2 className="w-5 h-5 animate-spin" />
```
**问题：**
- 过于机械，缺乏亲和力
- 与工具调用的 Loader 冲突（视觉混淆）

### 方案 B：打字效果（❌ 未采用）
```tsx
<span className="animate-typing">|</span>
```
**问题：**
- 暗示正在"打字"，但 AI 不是逐字输出
- 动画过于单调

### 方案 C：脉冲圆点（✅ 采用）
```tsx
<div className="flex gap-1.5">
  {/* 三个 pulse 圆点 */}
</div>
```
**优势：**
- 视觉轻盈，不抢眼
- 暗示"思考中"，符合心理预期
- 动画优雅，有节奏感
- 行业标准（ChatGPT、Perplexity 同款）

---

## 可访问性

### ARIA 标签
```tsx
<div role="status" aria-live="polite" aria-label="AI 正在思考">
  <LoadingState />
</div>
```

### 屏幕阅读器
- Loading 态会被读出："AI 正在思考"
- 头像有语义图标（User, Sparkles）

### 键盘导航
- 消息气泡不可聚焦（只读内容）
- 头像为装饰性，不需要交互

---

## 性能考虑

### 动画性能
- 使用 CSS `animate-pulse`（GPU 加速）
- 避免 JS 驱动的动画
- 不影响主线程

### 头像渲染
- SVG 图标（Lucide）轻量级
- 渐变背景用 CSS（无额外请求）
- 无图片加载延迟

---

## 未来增强

### 1. 自定义用户头像
```tsx
{user.avatar ? (
  <img src={user.avatar} className="w-10 h-10 rounded-full" />
) : (
  <DefaultUserAvatar />
)}
```

### 2. AI 状态变化
根据不同状态显示不同动画：
- 思考中: 脉冲圆点
- 工具调用: 扳手图标 + 旋转
- 写作中: 笔图标 + 书写动画

### 3. 消息反馈
在消息气泡旁添加：
- 👍 / 👎 反馈按钮
- 复制按钮
- 重新生成按钮

---

## 实现文件

| 文件 | 修改内容 |
|------|---------|
| `MessageBubble.tsx` | 添加头像、调整布局、Loading 态 |
| `MessageList.tsx` | 流式传输时显示 Loading 消息 |

---

## 设计原则总结

1. **一致性** - 头像尺寸、间距、圆角统一
2. **层次感** - 通过头像和气泡建立清晰对话结构
3. **品牌化** - Agent Purple 贯穿始终
4. **人性化** - Loading 态减少等待焦虑
5. **可读性** - 浅色背景 + 深色文字
6. **优雅** - 动画柔和，不抢眼

> "好的 Loading 态不是为了填补空白，而是为了建立信任。"
