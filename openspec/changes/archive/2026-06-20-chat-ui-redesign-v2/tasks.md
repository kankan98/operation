# Chat UI Redesign 实施任务清单

本文档将Chat UI重构工作分解为可追踪的任务。任务按依赖顺序组织，每个任务应在一个工作会话内完成。

---

## 1. 项目准备与设计系统

- [x] 1.1 备份当前代码，创建feature分支 `feature/chat-ui-redesign-v2`
- [x] 1.2 扩展 `tailwind.config.js`，添加新purple色系和设计token
- [x] 1.3 更新 `frontend/src/index.css`，注入完整的CSS变量（颜色、阴影、圆角、间距）
- [x] 1.4 创建 `--color-legacy-purple` 临时兼容变量
- [x] 1.5 使用色彩对比度工具验证新purple的WCAG AA合规性（2026-06-19 已验证核心组合：#FFF on #6E54EE=5.04:1、#FFF on #5F46DF=6.13:1、#6E54EE on #F4F1FF=4.53:1；结果记录于 `docs/style.md`）
- [x] 1.6 创建设计系统文档页面展示所有token（可选；token、对比度与容器断点记录于 `docs/style.md`）

---

## 2. 数据库Schema迁移

- [x] 2.1 编写迁移脚本 `migrations/001-chat-redesign.sql`，包含所有ALTER和CREATE语句
- [x] 2.2 编写回滚脚本 `migrations/001-chat-redesign-rollback.sql`
- [x] 2.3 在开发环境测试迁移脚本执行和回滚
- [x] 2.4 更新Drizzle ORM schema定义 (`backend/src/db/schema.ts`)，添加task_overviews表和chatSessions扩展字段
- [x] 2.5 生成Drizzle类型定义，验证类型安全
- [x] 2.6 备份开发数据库，执行迁移
- [x] 2.7 验证数据完整性，测试外键约束和级联删除

---

## 3. 后端类型定义扩展

- [x] 3.1 扩展 `backend/src/types/chat.ts`，添加TaskOverview, TaskStatus等类型
- [x] 3.2 创建 `backend/src/schemas/task.schema.ts`，定义Zod Schema（CreateTaskRequest, UpdateTaskRequest等）
- [x] 3.3 更新 `backend/src/schemas/chat.schema.ts`，添加UpdateSessionRequest Schema
- [x] 3.4 导出所有Schema到 `backend/src/schemas/index.ts`

---

## 4. 任务管理API实现

- [x] 4.1 创建 `backend/src/services/taskService.ts`，实现任务CRUD逻辑
- [x] 4.2 创建 `backend/src/routes/tasks.ts`，实现路由处理器（GET /tasks/:sessionId, POST /tasks, PATCH /tasks/:id）
- [x] 4.3 在路由中添加Zod Schema验证中间件
- [x] 4.4 实现任务查询的分页和过滤功能
- [x] 4.5 实现任务状态自动更新逻辑（completed/failed时设置endTime）
- [x] 4.6 添加任务操作的日志记录
- [x] 4.7 注册任务路由到 `backend/src/app.ts`

---

## 5. 会话管理API扩展

- [x] 5.1 在 `backend/src/services/chatService.ts` 添加updateSession方法
- [x] 5.2 在 `backend/src/routes/chat.ts` 添加PATCH /chat/sessions/:id路由
- [x] 5.3 实现会话置顶状态更新逻辑
- [x] 5.4 实现会话标签和预览文本更新逻辑
- [x] 5.5 添加权限验证（用户只能更新自己的会话）

---

## 6. SSE协议扩展

- [x] 6.1 在 `backend/src/services/streamManager.ts` 添加task_created事件类型
- [x] 6.2 添加task_update事件类型
- [x] 6.3 添加task_progress事件类型（可选）
- [x] 6.4 添加tool_execution_detail事件类型
- [x] 6.5 更新SSE事件类型定义文件
- [x] 6.6 测试SSE事件的向后兼容性

---

## 7. OpenAPI文档更新

- [x] 7.1 将 `docs/api/openapi-extension-chat-redesign.md` 中的Schema合并到 `backend/tests/fixtures/openapi.json`
- [x] 7.2 添加新的API端点定义（PATCH /chat/sessions/:id, /tasks/\*）
- [x] 7.3 更新API版本号为2.0.0
- [x] 7.4 添加请求和响应示例
- [x] 7.5 更新Swagger UI，验证文档正确性

---

## 8. 后端单元测试

- [x] 8.1 编写taskService单元测试，覆盖创建、查询、更新任务（新增 `backend/tests/taskService.test.ts`，覆盖默认值、JSON字段、过滤/分页、终态endTime）
- [x] 8.2 编写chatService的updateSession单元测试（补充 `updateSessionAttributes` 置顶、标签、标题、预览和缺失会话）
- [x] 8.3 编写任务API路由的集成测试（新增 `backend/tests/tasks.api.test.ts`，覆盖POST/GET/PATCH）
- [x] 8.4 编写会话更新API的集成测试（补充PATCH会话isPinned/tags/lastMessagePreview）
- [x] 8.5 测试数据库级联删除（删除会话时任务自动删除；开启SQLite foreign_keys并验证task_overviews清理）
- [x] 8.6 测试并发更新场景（重复终态更新不产生冲突记录）
- [x] 8.7 测试错误处理和边界情况（覆盖任务验证失败、无效查询参数、缺失session/task 404）

---

## 9. 前端类型定义扩展

- [x] 9.1 扩展 `frontend/src/types/chat.ts`，添加TaskOverview, TaskStatus等类型
- [x] 9.2 添加SessionGrouping相关类型
- [x] 9.3 添加ToolExecutionState扩展字段
- [x] 9.4 添加TaskSummary和ToolExecutionDetails类型

---

## 10. Zustand Store扩展

- [x] 10.1 在 `frontend/src/stores/chatStore.ts` 添加taskOverviews state
- [x] 10.2 添加taskOverviews相关的actions（setTaskOverviews, addTask, updateTask）
- [x] 10.3 扩展toolExecutionState类型，支持双卡片同步
- [x] 10.4 添加会话分组相关的computed state或helper函数

---

## 11. API客户端扩展

- [x] 11.1 在 `frontend/src/services/chatApi.ts` 添加updateSession方法
- [x] 11.2 创建 `frontend/src/services/taskApi.ts`，实现getTasks, createTask, updateTask方法
- [x] 11.3 添加错误处理和重试逻辑
- [x] 11.4 添加请求/响应拦截器（可选）

---

## 12. 工具函数和Hooks

- [x] 12.1 创建 `frontend/src/utils/sessionGrouping.ts`，实现groupSessions函数
- [x] 12.2 创建 `frontend/src/utils/timeFormat.ts`，实现相对时间格式化（"刚刚"、"5分钟前"）
- [x] 12.3 创建 `frontend/src/hooks/useTaskManagement.ts`，封装任务管理逻辑
- [x] 12.4 扩展 `frontend/src/hooks/useChatSSE.ts`，处理新的SSE事件类型

---

## 13. 主导航组件开发

- [x] 13.1 创建 `frontend/src/components/chat/MainNavigation.tsx` 组件
- [x] 13.2 实现品牌区（Logo + 名称 + 副标题）
- [x] 13.3 实现导航项列表（仪表盘、商品、预警、智能助手、设置）
- [x] 13.4 实现导航项的active状态高亮
- [x] 13.5 实现hover交互效果
- [x] 13.6 实现底部用户区（头像 + 用户名）
- [x] 13.7 添加响应式适配（Tablet/Mobile的hamburger切换）
- [x] 13.8 添加路由跳转逻辑

---

## 14. 会话列表组件重构

- [x] 14.1 创建 `frontend/src/components/chat/SessionGroupList.tsx` 组件
- [x] 14.2 实现会话分组渲染（置顶/今天/昨日/更早）
- [x] 14.3 实现分组标题样式
- [x] 14.4 重构会话卡片组件，使用新的样式（active状态、阴影、圆角）
- [x] 14.5 实现会话搜索框
- [x] 14.6 实现搜索过滤逻辑
- [x] 14.7 实现会话置顶图标显示
- [x] 14.8 实现未读指示器
- [x] 14.9 实现会话操作菜单（置顶/取消置顶、删除、重命名）
- [x] 14.10 实现会话右键菜单
- [x] 14.11 实现会话卡片的hover和active动画
- [x] 14.12 调用API实现置顶功能

---

## 15. 任务概览面板组件

- [x] 15.1 创建 `frontend/src/components/chat/TaskOverviewCard.tsx` 组件
- [x] 15.2 实现卡片布局（标题 + 字段列表 + 操作按钮）
- [x] 15.3 实现任务名称显示
- [x] 15.4 实现任务状态指示器（进行中/已完成/失败/等待）
- [x] 15.5 实现开始时间显示（相对时间格式）
- [x] 15.6 实现关联产品显示
- [x] 15.7 实现平台标识显示（Amazon/Shopify图标）
- [x] 15.8 实现任务进度条（可选）
- [x] 15.9 实现"查看详情"按钮，滚动到对话区对应位置
- [x] 15.10 实现"取消任务"按钮
- [x] 15.11 实现空状态显示
- [x] 15.12 实现加载骨架屏
- [x] 15.13 连接store，实时更新任务状态

---

## 16. 工具执行卡组件开发

- [x] 16.1 创建 `frontend/src/components/chat/ToolExecutionCard.tsx` 组件（详细版，用于消息流）
- [x] 16.2 实现卡片整体样式（淡绿色背景、14px圆角、阴影）
- [x] 16.3 实现顶部信息行（工具图标 + 名称 + 函数名 + 状态chip + 折叠按钮）
- [x] 16.4 实现输入/结果两列布局
- [x] 16.5 实现输入参数显示（支持JSON格式化）
- [x] 16.6 实现执行结果显示（根据类型智能渲染）
- [x] 16.7 实现执行耗时显示
- [x] 16.8 实现卡片折叠/展开功能
- [x] 16.9 实现工具图标的状态样式（成功/运行中/失败）
- [x] 16.10 实现状态chip样式
- [x] 16.11 实现运行中动画（图标旋转）
- [x] 16.12 实现完成/失败动画
- [x] 16.13 创建 `frontend/src/components/chat/ToolExecutionCardCompact.tsx` 组件（紧凑版，用于右侧面板）
- [x] 16.14 实现紧凑卡片布局（简化信息、"查看结果"按钮）
- [x] 16.15 连接store的toolExecutionState，实现双卡片同步
- [x] 16.16 实现"查看结果"按钮滚动功能

---

## 17. 消息增强组件开发

- [x] 17.1 创建 `frontend/src/components/chat/TaskSummaryBlock.tsx` 组件（任务摘要引用块）
- [x] 17.2 实现引用块样式（浅紫色渐变背景、Sparkle图标）
- [x] 17.3 创建 `frontend/src/components/chat/NumberedQuestionList.tsx` 组件（编号问题列表）
- [x] 17.4 实现序号方块样式（16x16px紫色方块）
- [x] 17.5 创建 `frontend/src/components/chat/CheckList.tsx` 组件（勾选清单）
- [x] 17.6 实现勾选/未勾选图标样式
- [x] 17.7 创建 `frontend/src/components/chat/EnhancedCodeBlock.tsx` 组件
- [x] 17.8 实现代码块增强（语法高亮、复制按钮、语言标签）
- [x] 17.9 升级消息卡片样式（新阴影、圆角、padding）
- [x] 17.10 实现消息操作按钮样式统一
- [x] 17.11 实现链接样式增强（紫色下划线、外部链接图标）
- [x] 17.12 实现表格渲染样式（细线边框、斑马纹）

---

## 18. 任务面板容器组件

- [x] 18.1 创建 `frontend/src/components/chat/TaskPanel.tsx` 容器组件
- [x] 18.2 组装TaskOverviewCard和ToolExecutionCardCompact
- [x] 18.3 实现面板滚动逻辑
- [x] 18.4 实现响应式适配（Tablet drawer模式）
- [x] 18.5 添加面板header（标题、折叠按钮）
- [x] 18.6 实现section分隔（任务概览 / 工具执行 / 笔记占位）

---

## 19. Chat页面组装

- [x] 19.1 创建 `frontend/src/pages/Chat.tsx` 页面组件
- [x] 19.2 实现4栏Grid布局（208px / 272px / minmax(720px,1fr) / 314px）
- [x] 19.3 组装MainNavigation、SessionGroupList、MessageList、TaskPanel四个区域
- [x] 19.4 复用现有的ChatInput、ControlBar组件
- [x] 19.5 实现响应式断点逻辑（Desktop/Tablet/Mobile）
- [x] 19.6 实现会话切换逻辑，加载任务数据
- [x] 19.7 实现SSE连接和事件处理
- [x] 19.8 实现布局动画过渡
- [x] 19.9 处理最小尺寸约束
- [x] 19.10 实现各列的独立滚动

---

## 20. 路由配置

- [x] 20.1 在 `frontend/src/App.tsx` 添加 `/chat` 路由，指向Chat组件
- [x] 20.2 保留 `/chat` 路由，指向旧版Chat组件
- [x] 20.3 在主导航中"智能助手"导航项链接到 `/chat`
- [x] 20.4 添加调试用的版本切换链接（可选）

---

## 21. 前端集成测试

- [x] 21.1 测试4栏布局在不同视口宽度下的响应式表现（见 28.4.1：900/1280/1440/1920 四档截图回归，单/两/三栏无裁切）
- [x] 21.2 测试会话分组功能（置顶、今天、昨日、更早；新增 `sessionGrouping.test.ts` + `SessionGroupList.test.tsx`）
- [x] 21.3 测试会话置顶/取消置顶功能（组件操作菜单回调覆盖置顶/取消置顶）
- [x] 21.4 测试会话搜索过滤功能（标题、预览、标签过滤 + 空结果状态）
- [x] 21.5 测试任务概览卡片的数据显示（新增 `TaskPanelAndCards.test.tsx` 覆盖状态、进度、产品、平台、操作回调、空/加载态）
- [x] 21.6 测试任务状态实时更新（通过SSE；新增 `useChatSSE.test.tsx` 覆盖 `task_created`/`task_progress`/`task_update` 更新 `taskOverviews`）
- [x] 21.7 测试工具执行卡的双卡片同步（详细卡 + 紧凑卡订阅同一 `toolExecutionState` 并同步 running/success）
- [x] 21.8 测试工具卡片的折叠/展开（详细卡默认展开，折叠隐藏输入/结果，再次展开恢复）
- [x] 21.9 测试消息增强组件的渲染（新增 `MessageEnhancements.test.tsx` 覆盖任务摘要块、编号列表、勾选清单、链接/表格/复制）
- [x] 21.10 测试主导航的路由跳转（新增 `NavigationAndDrawers.test.tsx` 覆盖仪表盘/商品/预警/智能助手/设置 pathname）
- [x] 21.11 测试Tablet/Mobile模式下的drawer切换（覆盖 Chat 顶栏会话/任务按钮打开与遮罩关闭）

---

## 22. 跨页面视觉回归测试

- [x] 22.1 测试仪表盘页面的purple色系变化（`PurpleRegression.test.ts` 覆盖 Dashboard/LineChart，修复旧 `#7c3aed`）
- [x] 22.2 测试商品页面的按钮和强调色（覆盖 ProductCard 使用共享 `Button` 的 `bg-primary-600`）
- [x] 22.3 测试预警页面的UI一致性（覆盖 AlertsCenter active count 使用 `bg-primary-50 text-primary-600`）
- [x] 22.4 测试设置页面的表单和按钮（覆盖 Settings nav active 使用 `bg-primary-50 text-primary-600`）
- [x] 22.5 验证所有页面的颜色对比度（测试白字/主紫、白字/hover紫、主紫/浅紫背景均 AA）
- [x] 22.6 记录发现的样式问题（新增 `docs/chat-purple-regression.md`）
- [x] 22.7 修复样式不一致问题（重映射 `primary-*`/`purple-*` token、`accent-purple`、Dashboard/LineChart 旧紫）

---

## 23. E2E测试（可选）

- [x] 23.1 编写Playwright测试：创建会话 → 发送消息 → 验证工具执行卡显示（新增 `frontend/e2e/chat.spec.ts`，mock SSE 流式创建会话并验证工具卡）
- [x] 23.2 编写测试：置顶会话 → 验证分组变化（覆盖会话操作菜单 PATCH 后刷新到"置顶"分组）
- [x] 23.3 编写测试：搜索会话 → 验证过滤结果（覆盖搜索框实时过滤和隐藏非匹配会话）
- [x] 23.4 编写测试：点击任务面板的"查看详情" → 验证滚动到对应消息（补充消息/任务/工具卡滚动锚点并断言 `scrollIntoView` 目标）
- [x] 23.5 编写测试：切换会话 → 验证任务面板数据更新（覆盖 session 切换后任务数据替换）
- [x] 23.6 编写测试：响应式布局 → 验证Tablet/Mobile模式（覆盖桌面面板和窄屏会话/任务抽屉；`npm run test:e2e` 6/6 通过）

---

## 24. 文档更新

- [x] 24.1 更新 `README.md`，说明新版Chat UI的功能（补充 Chat 工作台、任务面板、E2E 与文档入口）
- [x] 24.2 更新API文档索引，链接到 `docs/api/chat-redesign-api.md`（更新 `docs/README.md` API 表）
- [x] 24.3 创建用户操作手册（如何使用会话分组、任务面板；新增 `docs/guides/chat-user-guide.md`）
- [x] 24.4 更新开发者文档，说明如何扩展任务管理功能（新增 `docs/development/task-management-extension.md`）
- [x] 24.5 记录已知问题和限制（新增 `docs/chat-known-limitations.md`）
- [x] 24.6 更新CHANGELOG.md（新增 2.1.0 Chat 变更记录）

---

## 25. 代码审查和优化

- [x] 25.1 代码格式化，运行ESLint和Prettier（`npm run lint` 通过；仓库未配置Prettier脚本）
- [x] 25.2 移除console.log和调试代码（运行时代码 `console/debugger` 扫描无残留）
- [x] 25.3 审查所有TODO和FIXME注释（移除token统计TODO，扫描无残留）
- [x] 25.4 审查错误处理的完整性（前后端构建/测试通过，SSE与任务API错误处理已复核）
- [x] 25.5 审查类型定义的准确性（前端 `tsc -b`、后端 `tsc` 通过）
- [x] 25.6 审查组件的可访问性（补充发送按钮ARIA，抽屉/按钮role与键盘路径由组件/E2E覆盖）
- [x] 25.7 审查代码注释的清晰度（移除临时TODO/调试注释，仅保留说明性注释）

---

## 26. 清理和归档

- [x] 26.1 监控新版运行2周，确认稳定
- [x] 26.2 移除旧版Chat组件和相关代码（已删 `pages/Chat.tsx`、`components/chat/` 14 文件、4 个旧测试 + scroll spec；/chat 直接切到 Chat，tsc/build/vitest 全过）
- [x] 26.3 移除 `--color-legacy-purple` 兼容变量（grep确认无引用）
- [x] 26.4 移除 `/chat-legacy` 路由（N/A：直接以 Chat 替换 /chat，未创建 legacy 别名路由）
- [x] 26.5 清理未使用的依赖（移除旧虚拟列表依赖 `react-window` / `@types/react-window`）
- [x] 26.6 归档设计稿和原型文件（正式设计记录保留于OpenSpec与 `docs/style.md`，临时截图/快照/测试报告已清理）
- [x] 26.7 更新团队知识库（更新 `README.md`、`docs/README.md`、用户手册与任务扩展开发文档）

---

## 27. Chat 响应式修正与新对话入口（缺陷修复，见决策8）

### 27.1 外层布局统一（AppLayout）

- [x] 27.1.1 删除 `AppLayout.tsx` 中 `isChatPage` 的侧边栏宽度特判，全站统一宽度（展开 `w-60` / 收起 `w-[72px]`）
- [x] 27.1.2 在内容区 `<main>` 加 `@container`（容器查询上下文）；构建产物含 `container-type:inline-size`
- [x] 27.1.3 验证：截图确认 /chat 侧边栏统一 240px、收起按钮正常（宽度改为无条件，跨页一致由构造保证）

### 27.2 Chat 改容器查询自适应

- [x] 27.2.1 删除 `Chat.tsx` 中 `viewportWidth / isDesktop / isTablet / isMobile` 及 `resize` 监听等全部 JS 测量逻辑（grep 确认无残留）
- [x] 27.2.2 三栏 Grid 改用容器查询变体（`@3xl:/@6xl:`），去掉 `minmax(720px,...)` 硬最小值，改 `minmax(0,1fr)` 弹性列宽
- [x] 27.2.3 按真实容器宽分三档：≥@6xl(1152) 三栏 / ≥@3xl(768) 两栏(任务转抽屉) / <@3xl 单栏(双抽屉)
- [x] 27.2.4 复用 `SessionDrawer` / `TaskPanelDrawer` 承载窄屏隐藏面板，抽屉触发按钮 `@3xl:hidden`/`@6xl:hidden` 与列显隐互补；移除 Drawer 上错误的 `lg:hidden`
- [x] 27.2.5 在 `docs/style.md` 记录"容器断点刻度"项目约定（容器 px ≠ 视口 px，重映射规则）

### 27.3 新对话入口

- [x] 27.3.1 `SessionGroupList` 顶部（搜索框上方）加整宽「＋ 新对话」按钮（截图确认显示）
- [x] 27.3.2 `handleSendMessage` 移除阻塞 guard；无会话时由后端在首条消息 `message_start` 懒创建会话（优于原 `createSession()` 急切创建，避免空壳会话）
- [x] 27.3.3 新会话 id 落库后经 `useEffect` 同步到 URL（`/chat/:id`，replace）并 `loadSessions()` 刷新列表

### 27.4 验收

- [x] 27.4.1 截图回归：900/1280/1440/1920 四档 单栏/两栏/三栏/三栏 正确、无裁切（对比修复前 1280 任务面板贴边被切）
- [x] 27.4.2 侧边栏收起→容器变宽自动重排：容器查询基于 `<main>` 宽度，等价于宽度扫描已覆盖的阈值（窗口1440/侧栏240=容器1200 三栏 ≡ 窗口1280/侧栏72=容器1208 三栏）
- [x] 27.4.3 已联调验证：dev(:3000)+backend(:3001) 浏览器内发「请用一句话回复ok」→ 后端创建会话 7013dc72 → URL 同步 `/chat/7013dc72` → 助手串流回复"ok"，会话置顶刷新（测试会话已清理）
- [x] 27.4.4 已验证：点「新对话」URL/会话数不变（不 POST），仅发首条消息时懒创建；不再产生空壳会话

---

## 任务统计

- **总任务数**: 200+
- **预计工期**: 16-23天（约3-4.5周）
- **关键里程碑**:
  - 里程碑1（第5天）: 后端API和数据库迁移完成
  - 里程碑2（第12天）: 所有前端组件开发完成
  - 里程碑3（第16天）: 集成测试和视觉回归测试完成
  - 里程碑4（第20天）: 灰度发布
  - 里程碑5（第23天）: 正式上线

---

## 风险提示

1. **设计系统覆盖式替换风险高**: 需要全面的视觉回归测试
2. **SSE协议扩展需向后兼容**: 测试旧客户端不受影响
3. **4栏布局性能开销**: 持续监控LCP和CLS指标
4. **数据库迁移风险**: 确保备份和回滚脚本就绪
