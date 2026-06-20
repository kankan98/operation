# Chat UI 重构技术设计

## Context

### 现状
当前聊天界面采用简单的2栏布局（会话列表 + 对话区），使用基础的Agent Purple设计系统（#8B5CF6）。布局实现在 `ChatContainer.tsx` 中，使用响应式Flexbox布局。状态管理通过Zustand集中管理，SSE流式通信已完成v2升级。

### 目标状态
实现参考设计稿的完整4栏Agent工作台布局，采用新的专业purple色系（#6E54EE），提供产品级的导航体验和任务管理能力。

### 约束条件
1. **向后兼容**: 必须支持渐进式迁移，旧版Chat页面需继续可用
2. **设计系统影响**: purple色系全局替换会影响所有现有页面
3. **数据库限制**: SQLite，需要保守的Schema变更策略
4. **性能要求**: 4栏布局不能增加明显的渲染开销
5. **响应式支持**: Desktop优先，但需考虑Tablet和Mobile降级策略

### 技术栈
- 前端: React 18 + TypeScript + Tailwind CSS + Zustand
- 后端: Node.js + Express + Drizzle ORM + SQLite
- 通信: SSE (Server-Sent Events)
- 图标: Lucide React

## Goals / Non-Goals

**Goals:**
- 实现完整的4栏Grid布局，精确匹配设计稿比例 (208/272/flex/314)
- 建立可扩展的主导航架构，支持多模块产品扩展
- 实现会话分组和置顶功能，提升会话管理效率
- 提供任务概览和工具执行双卡片同步，增强Agent工作流可见性
- 升级设计系统到新purple色系，建立完整的设计token体系
- 保证渐进式迁移路径，降低上线风险

**Non-Goals:**
- 笔记功能 (session_notes) 不在MVP-2范围内
- 会话搜索功能的高级过滤（仅实现基础文本搜索）
- 工具执行的历史记录查询（仅显示当前会话的工具执行）
- 多用户协作和实时同步
- 国际化和多语言支持（本期只支持中文）
- 暗色模式（设计稿为浅色主题）

## Decisions

### 决策1: 布局架构 - CSS Grid vs Flexbox

**选择: CSS Grid**

```css
.agent-shell {
  display: grid;
  grid-template-columns: 208px 272px minmax(720px, 1fr) 314px;
  height: 100vh;
}
```

**原因:**
- Grid天然支持固定宽度 + 弹性宽度的混合布局
- 更简洁的响应式断点处理
- 性能优于嵌套Flexbox

**替代方案:**
- Flexbox嵌套: 代码复杂度高，难以维护精确比例
- 绝对定位: 响应式支持差，不推荐

**实施细节:**
```css
/* Desktop (≥1024px): 完整4栏 */
@media (min-width: 1024px) {
  grid-template-columns: 208px 272px minmax(720px, 1fr) 314px;
}

/* Tablet (768-1023px): 导航和任务面板可折叠 */
@media (min-width: 768px) and (max-width: 1023px) {
  grid-template-columns: auto 272px minmax(480px, 1fr) auto;
}

/* Mobile (<768px): 单栏切换 */
@media (max-width: 767px) {
  grid-template-columns: 1fr;
}
```

---

### 决策2: 设计系统融合 - 覆盖式 vs 作用域式

**选择: 覆盖式替换（用户确认的A选项）**

全局purple色系从 `#8B5CF6` 升级到 `#6E54EE`。

**原因:**
- 用户明确要求全局统一设计语言
- 新purple更符合专业商务定位
- 避免长期维护两套设计系统的成本

**风险与缓解:**
- **风险**: 影响所有现有页面（仪表盘、商品、预警、设置）的视觉样式
- **缓解1**: 创建临时CSS变量 `--color-legacy-purple: #8B5CF6` 作为过渡
- **缓解2**: 在上线前进行全面的视觉回归测试
- **缓解3**: 保留旧版purple定义30天，便于紧急回滚

**实施策略:**
```css
/* index.css - 新purple系统 */
:root {
  /* 新主色 */
  --color-primary: #6e54ee;
  --color-primary-hover: #5f46df;
  --color-primary-soft: #f4f1ff;
  --color-primary-softer: #f8f6ff;
  --color-primary-border: #a891ff;
  
  /* 临时: 兼容性变量 (30天后移除) */
  --color-legacy-purple: #8B5CF6;
}

/* Tailwind配置同步更新 */
colors: {
  'accent-purple': '#6E54EE', // 替换旧值
  'legacy-purple': '#8B5CF6', // 临时保留
}
```

**替代方案:**
- 作用域式隔离 `.chat-page {...}`: 更安全但导致设计系统碎片化

---

### 决策3: 会话分组实现 - 前端计算 vs 数据库分组

**选择: 前端计算分组 + 最小数据库扩展**

只在数据库添加 `isPinned` 字段，置顶/今天/昨日/更早的分组逻辑在前端计算。

**原因:**
- 时间分组逻辑变化频繁（今天、昨天的定义依赖客户端时区）
- 前端计算灵活性高，易于调整分组规则
- 最小化数据库迁移风险

**实现:**
```typescript
// frontend/src/utils/sessionGrouping.ts
export function groupSessions(sessions: ChatSession[]) {
  const now = Date.now();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(now - 86400000);
  
  return {
    pinned: sessions.filter(s => s.isPinned),
    today: sessions.filter(s => !s.isPinned && s.updatedAt >= todayStart),
    yesterday: sessions.filter(s => !s.isPinned && s.updatedAt >= yesterdayStart && s.updatedAt < todayStart),
    older: sessions.filter(s => !s.isPinned && s.updatedAt < yesterdayStart)
  };
}
```

**数据库Schema:**
```sql
ALTER TABLE chat_sessions ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE chat_sessions ADD COLUMN last_message_preview TEXT;
ALTER TABLE chat_sessions ADD COLUMN unread_count INTEGER DEFAULT 0;

CREATE INDEX idx_sessions_pinned_updated ON chat_sessions(is_pinned DESC, updated_at DESC);
```

**替代方案:**
- 数据库存储 `groupLabel`: 需要定时任务更新，复杂度高

---

### 决策4: 任务面板数据源 - 独立表 vs 消息内嵌

**选择: 独立 task_overviews 表**

**原因:**
- 任务和消息是不同的业务实体，应分离存储
- 独立表支持高效的任务查询和过滤
- 易于扩展任务相关功能（任务统计、任务搜索）

**Schema设计:**
```sql
CREATE TABLE task_overviews (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  related_products TEXT, -- JSON array
  platform TEXT,
  metadata TEXT, -- JSON for extensibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX idx_tasks_session ON task_overviews(session_id, created_at DESC);
CREATE INDEX idx_tasks_status ON task_overviews(status, created_at DESC);
```

**API设计:**
```typescript
GET    /api/tasks/:sessionId       // 获取会话任务列表
POST   /api/tasks                  // 创建新任务
PATCH  /api/tasks/:id              // 更新任务状态
```

**替代方案:**
- 消息内嵌 `message.metadata.taskInfo`: 查询性能差，难以索引

---

### 决策5: 工具执行卡双卡片同步 - Zustand Store

**选择: 通过 Zustand Store 的 `toolExecutionState` 实现双向绑定**

**架构:**
```
SSE Event Stream
      │
      ▼
┌──────────────────┐
│  useChatSSE      │ ← SSE事件处理
│  (hook)          │
└────────┬─────────┘
         │ updates
         ▼
┌──────────────────────────┐
│  chatStore               │
│  .toolExecutionState     │ ← 单一数据源
│  [toolCallId]: {         │
│    status, startTime,    │
│    endTime, durationMs   │
│  }                       │
└────┬───────────────┬─────┘
     │               │
     │ subscribe     │ subscribe
     ▼               ▼
┌─────────────┐  ┌──────────────┐
│ToolExecCard │  │RightToolCard │
│ (消息流)    │  │ (任务面板)   │
└─────────────┘  └──────────────┘
```

**实现细节:**
```typescript
// SSE事件处理
case 'tool_call_start':
  useChatStore.getState().setToolExecutionState(data.toolCallId, {
    status: 'running',
    startTime: Date.now()
  });
  break;

case 'tool_result':
  useChatStore.getState().setToolExecutionState(data.toolCallId, {
    status: data.isError ? 'error' : 'success',
    endTime: Date.now(),
    durationMs: Date.now() - startTime
  });
  break;
```

**组件订阅:**
```typescript
// 两个组件都订阅相同的store
const toolState = useChatStore(state => 
  state.toolExecutionState[toolCallId]
);
```

**替代方案:**
- React Context: 性能不如Zustand，重渲染次数多
- 自定义EventEmitter: 增加复杂度，Zustand已足够

---

### 决策6: 渐进式迁移策略

**选择: 并行双版本 (Chat.tsx)**

创建新文件 `Chat.tsx` 实现新版UI，保留 `Chat.tsx` 作为旧版。

**路由配置:**
```typescript
// frontend/src/App.tsx
<Routes>
  <Route path="/chat" element={<Chat />} />      {/* 旧版 */}
  <Route path="/chat" element={<Chat />} /> {/* 新版 */}
</Routes>

// 测试稳定后，交换路由
<Route path="/chat" element={<Chat />} />     {/* 新版设为默认 */}
<Route path="/chat-legacy" element={<Chat />} /> {/* 旧版重命名 */}
```

**原因:**
- 降低风险: 新版出现问题可立即回退
- 并行测试: 可以A/B对比新旧版本
- 无缝切换: 用户无感知升级

**清理计划:**
- 新版稳定运行2周后，移除旧版代码
- 保留旧版相关组件作为参考30天

---

### 决策7: 组件命名和文件组织

**选择: 新组件独立命名空间**

```
frontend/src/components/
├── chat/                    # 旧版组件
│   ├── ChatContainer.tsx
│   ├── MessageBubble.tsx
│   └── ...
└── chat/                 # 新版组件
    ├── MainNavigation.tsx
    ├── SessionGroupList.tsx
    ├── TaskOverviewCard.tsx
    ├── ToolExecutionCard.tsx
    ├── EnhancedMessageCard.tsx
    └── ...
```

**原因:**
- 避免组件名冲突
- 清晰的新旧版本边界
- 便于后续清理旧版代码

**命名规范:**
- 新组件使用完整描述性名称
- 避免使用"New"、"V2"后缀（文件夹已表明版本）

---

### 决策8: Chat 响应式架构修正 + 新对话入口（补充）

> 背景：实现落地后发现两个缺陷——① 低分辨率下右侧任务面板/会话列表被裁切看不见；② 会话列表没有"新对话"按钮，无会话时发消息被静默吞掉。本决策修正 **决策1** 中关于 Chat 自身响应式的实现方式（决策1 描述的 `208px` 侧边栏其实已落在外层 `AppLayout`，Chat 内部只有 3 栏）。

#### 问题根因：嵌套布局横向空间被重复计算

Chat 是 `AppLayout` 的子组件，但它用 `window.innerWidth` 判断断点，**没有扣掉外层侧边栏宽度**：

```
window=1280  →  AppLayout 侧边栏(208) + Chat 三栏Grid(272 + min720 + 314 = 1306)
内层可用 = 1280 - 208 = 1072  <  1306  →  溢出 234px 被 overflow-hidden 裁掉
断点 isDesktop = innerWidth >= 1280  →  误判为桌面，强渲三栏 → 任务面板被切
真实可放下三栏的窗口宽：侧栏展开需 ≥1514，收起需 ≥1378（断点 1280 错得离谱）
```

Chat 是**全项目唯一**用 `window.innerWidth` 做布局判断的页面；其他页面（Dashboard 等）一律用 Tailwind 响应式类 + 弹性栅格，内容自然回流、从不裁切。

#### 选择：Chat 改用容器查询自适应，侧边栏宽度全站统一

**A. 外层 `AppLayout`（固定统一）**
- 删除 `isChatPage` 的侧边栏宽度特判，全站统一一套宽度（展开 `w-60` / 收起 `w-[72px]`）。
- 在内容区 `<main>` 上加 `@container`（Tailwind v4.3 原生支持容器查询，零新依赖），作为子页面响应式的容器上下文。

**B. 内层 `Chat`（对自己容器自适应）**
- 删除 `viewportWidth / isDesktop / isTablet / isMobile` 等全部 JS 测量逻辑。
- 改用容器查询变体（`@5xl: / @lg:` 等）+ **弹性列宽**（去掉 `minmax(720px,...)` 这种硬最小值），按 Chat 自己分到的宽度分档，侧边栏收起/展开能自动重排：

```
容器真实可用宽       布局              隐藏面板入口
─────────────────────────────────────────────────────
≥ ~1300px          会话 | 对话 | 任务   全显示
~980 ~ 1300px      会话 | 对话         任务 → 顶栏「任务」按钮抽屉
< ~980px           对话              会话+任务 → 两个抽屉按钮
```

- 复用已有的 `SessionDrawer` / `TaskPanelDrawer` 承载窄屏隐藏面板（基建已存在，原先触发条件用错了宽度）。

**关键陷阱（实现时务必注意）：容器断点刻度 ≠ 视口断点刻度。** Tailwind 容器变体 `@sm=384/@lg=512/@5xl=1024`（看容器），与视口 `lg=1024`（看窗口）完全不同；不能机械把 `lg:` 改成 `@lg:`，必须按"容器实际像素"重新映射阈值。

#### 新对话入口

- 在 `SessionGroupList` 顶部（搜索框上方）加整宽「＋ 新对话」按钮。
- `handleSendMessage` 中 `currentSessionId` 为空时的 `TODO` 改为：**发送首条消息时才调用 `chatApi.createSession()` 创建会话**（后端 `POST /api/chat/sessions` 已就绪），避免产生一堆空壳"新对话"（当前截图中昨天一长串空会话正是旧逻辑的症状）。

**替代方案（未采用）：** 从 store 读 `sidebarCollapsed` 用 `innerWidth − 208/72` 兜底——能修但让 Chat 硬编码 AppLayout 的魔数，耦合差，否决。

---

### 决策9: 全站迁移容器查询 — 列为 Backlog，不在本 change

**结论：暂不做，记入未来增强。**

评估过"把所有页面统一迁到容器查询"：技术 100% 可行（v4 原生、零依赖），迁移面也小（剔除 Button 的 CVA 误报后真实视口断点 ≈30 处 / 8 文件）。但：

- 其他页面**本来就没坏**（弹性栅格会回流，无 Chat 的硬最小值+overflow 裁切），迁移是"为一致性付重构成本 + 全量视觉回归"，功能上零修复。
- 容器断点刻度与视口不同（见上方陷阱），逐类重调阈值 + 逐页视觉回归，应作为**独立 change** 承载，不与本次"修 Chat + 新对话按钮"混做。

**采用路径：** 本 change 把 `@container` 能力铺到 `<main>`、Chat 先行用容器查询、并在 `docs/style.md` 定下"容器断点刻度"项目约定；其余页面碰到时机会性迁移或另开技术债 change。

## Risks / Trade-offs

### 风险1: 全局purple替换导致样式破坏
**风险:** 覆盖式替换 #8B5CF6 → #6E54EE 会影响所有页面，可能导致对比度、可读性问题

**缓解措施:**
1. 上线前进行全面视觉回归测试（仪表盘、商品、预警、设置页）
2. 保留 `--color-legacy-purple` 变量30天，便于紧急回滚
3. 使用色彩对比度工具验证WCAG AA标准（至少4.5:1）
4. 灰度发布: 先对内部用户开放新版，收集反馈

**影响范围:**
- 高影响: 所有使用 `accent-purple` 的按钮、徽章、强调文本
- 中影响: hover/focus状态的交互反馈
- 低影响: 图标颜色

---

### 风险2: 4栏布局性能开销
**风险:** 同时渲染4个区域可能增加首屏渲染时间

**缓解措施:**
1. 主导航和任务面板使用静态内容，避免复杂计算
2. 会话列表使用虚拟滚动（如果会话数 > 100）
3. 对话区消息保持现有的优化策略（流式渲染、增量更新）
4. 使用 React.memo 优化不必要的重渲染

**性能目标:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

---

### 风险3: 数据库迁移失败
**风险:** ALTER TABLE 操作在SQLite中有限制，可能导致迁移失败

**缓解措施:**
1. 所有迁移脚本包含完整的回滚SQL
2. 迁移前自动备份数据库文件
3. 使用Drizzle ORM的migration工具确保原子性
4. 在测试环境完整验证迁移流程

**回滚策略:**
```typescript
// backend/src/db/migrations/rollback-xxx.ts
export async function down(db: Database) {
  await db.run('ALTER TABLE chat_sessions DROP COLUMN is_pinned');
  await db.run('ALTER TABLE chat_sessions DROP COLUMN tags');
  await db.run('DROP TABLE IF EXISTS task_overviews');
}
```

---

### 风险4: SSE协议向后兼容
**风险:** 新增的 `task_update` 事件可能导致旧客户端解析错误

**缓解措施:**
1. SSE事件向后兼容: 旧客户端忽略未知事件类型
2. 不修改现有事件的数据结构
3. 新事件使用独立的type标识: `task_update`, `tool_execution_detail`

**协议设计:**
```typescript
// 新增事件 (旧客户端会忽略)
type: 'task_update'
data: { taskId, status, ... }

// 现有事件保持不变
type: 'text_delta'
data: { content }
```

---

### 权衡1: MVP-2 范围 vs 完整实现
**权衡:** 暂缓笔记功能 (session_notes) 以加快上线速度

**代价:** 用户无法在聊天中记录笔记
**收益:** 开发周期缩短约3-5天，可更快验证核心价值

**后续计划:** 如果任务面板验证成功，在下一个迭代补充笔记功能

---

### 权衡2: 前端分组 vs 数据库分组
**权衡:** 选择前端计算分组，牺牲一定的服务端过滤能力

**代价:** 当会话数 > 1000 时，前端计算开销变大
**收益:** 实现简单，灵活性高，避免复杂的数据库逻辑

**后续优化:** 如果会话数超过500，引入服务端分页和过滤

---

### 权衡3: 渐进式迁移 vs 原地重构
**权衡:** 选择并行双版本，牺牲短期的代码重复

**代价:** 临时维护两套代码（Chat.tsx + Chat.tsx）
**收益:** 降低风险，支持快速回退，用户无感知升级

**清理计划:** 新版稳定2周后，移除旧版代码

## Migration Plan

### 阶段1: 设计系统准备 (1-2天)
1. 扩展 `tailwind.config.js` 添加新purple色系
2. 更新 `index.css` 注入完整设计token
3. 创建 `--color-legacy-purple` 兼容变量
4. 验证色彩对比度和WCAG合规性

### 阶段2: 数据库迁移 (1天)
1. 开发迁移脚本 `migrations/001-chat-redesign.sql`
2. 在开发环境测试迁移 + 回滚
3. 备份生产数据库
4. 执行迁移
5. 验证数据完整性

**迁移脚本:**
```sql
-- 001-chat-redesign.sql
BEGIN TRANSACTION;

-- 扩展 chat_sessions
ALTER TABLE chat_sessions ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN tags TEXT;
ALTER TABLE chat_sessions ADD COLUMN last_message_preview TEXT;
ALTER TABLE chat_sessions ADD COLUMN unread_count INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX idx_sessions_pinned_updated ON chat_sessions(is_pinned DESC, updated_at DESC);

-- 新建 task_overviews
CREATE TABLE task_overviews (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  related_products TEXT,
  platform TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX idx_tasks_session ON task_overviews(session_id, created_at DESC);

COMMIT;
```

### 阶段3: 后端API开发 (2-3天)
1. 实现会话API扩展 (PATCH /api/chat/sessions/:id)
2. 实现任务管理API (GET/POST/PATCH /api/tasks)
3. 添加Zod Schema验证
4. 编写单元测试
5. 更新OpenAPI文档

### 阶段4: 前端组件开发 (4-5天)
1. 创建 `components/chat/` 目录
2. 实现主导航 (MainNavigation.tsx)
3. 实现会话分组列表 (SessionGroupList.tsx)
4. 实现任务面板组件 (TaskOverviewCard, ToolExecutionCard)
5. 实现增强消息卡片 (EnhancedMessageCard)
6. 创建 Chat.tsx 页面组装所有组件

### 阶段5: 状态管理集成 (2天)
1. 扩展 Zustand Store (taskOverviews, sessionGrouping)
2. 更新 SSE hook 处理新事件
3. 实现双卡片同步逻辑

### 阶段6: 路由和导航 (1天)
1. 添加 /chat 路由
2. 在主导航中添加版本切换入口 (调试用)
3. 保留 /chat 路由指向旧版

### 阶段7: 测试和优化 (2-3天)
1. E2E测试覆盖核心流程
2. 跨页面视觉回归测试 (purple色系影响)
3. 性能测试 (LCP, FID, CLS)
4. 修复发现的问题

### 阶段8: 灰度发布 (1周)
1. 内部用户先使用 /chat
2. 收集反馈和bug报告
3. 修复问题，优化体验
4. 确认稳定后，交换路由

### 阶段9: 正式上线
1. 将 /chat 路由指向 Chat
2. 将旧版移至 /chat-legacy
3. 监控错误日志和用户反馈
4. 准备快速回滚方案

### 阶段10: 清理 (2周后)
1. 确认新版稳定运行
2. 移除 Chat.tsx 和 components/chat/ 旧组件
3. 移除 --color-legacy-purple 变量
4. 更新文档

## Rollback Strategy

### 回滚场景1: 设计系统问题
如果新purple导致严重的视觉问题:
1. 恢复 `tailwind.config.js` 到旧版
2. 恢复 `index.css` 中的purple定义
3. 重新构建前端
4. 部署 (约5分钟)

### 回滚场景2: 新版功能缺陷
如果 Chat 出现严重bug:
1. 修改路由配置，将 /chat 指回 Chat.tsx
2. 重新部署前端
3. 用户立即回到旧版 (约2分钟)

### 回滚场景3: 数据库迁移问题
如果迁移导致数据异常:
1. 停止服务
2. 恢复数据库备份
3. 回滚代码到迁移前版本
4. 重启服务 (约10分钟)

## Open Questions

1. **会话搜索的具体交互**
   - 搜索框是否支持高级过滤（按时间、标签、产品）？
   - 暂定: MVP只实现标题和内容的模糊搜索

2. **任务状态的自动更新机制**
   - 任务状态是否需要后端自动推断（基于工具调用结果）？
   - 暂定: 前端根据工具执行结果手动更新

3. **主导航的其他模块实现时间**
   - 仪表盘、商品、预警等模块何时实现？
   - 影响: 可能需要调整主导航的路由配置

4. **虚拟滚动的引入时机**
   - 会话列表何时需要虚拟滚动优化？
   - 暂定: 当会话数 > 100 时引入 react-window

5. **紫色系的最终视觉验证**
   - 需要设计师对新purple在所有页面的效果进行最终审查
   - 建议: 在阶段7完成视觉回归测试后邀请设计师review
