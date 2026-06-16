# Chat UI 全栈重构提案

## Why

当前的聊天界面采用简单的2栏布局，缺少产品级的主导航和任务管理面板，无法满足专业AI Agent工作台的体验需求。参考设计稿显示，用户需要一个完整的4栏布局，包含主导航、分组会话列表、增强的对话区和右侧任务面板，同时需要升级设计系统以支持更专业的商务紫色主题。此次重构将提升产品的专业度和用户工作效率，建立可扩展的UI架构基础。

## What Changes

- **布局架构**: 从2栏布局升级到4栏Grid布局 (主导航208px + 会话列表272px + 对话区弹性 + 任务面板314px)
- **主导航栏**: 新增产品级主导航，包含仪表盘、商品、预警、智能助手、设置等模块入口
- **会话列表**: 重构会话列表，支持分组显示（置顶/今天/昨日/更早），新增搜索和置顶功能
- **对话区增强**: 新增任务摘要引用块、编号问题列表、独立工具执行卡等专业组件
- **任务面板**: 新增右侧任务面板，包含任务概览卡和工具执行卡，实现与对话区的实时同步
- **设计系统升级**: **BREAKING** 全局purple色系从 #8B5CF6 升级到 #6E54EE，更新完整的设计token体系
- **数据模型扩展**: 扩展 chatSessions 表支持分组功能，新增 task_overviews 表支持任务管理
- **API扩展**: 新增会话分组API、任务管理API，支持任务概览和工具执行的CRUD操作
- **渐进式迁移**: 创建 ChatV2.tsx 作为新版实现，保留旧版以支持平滑过渡和回退

## Capabilities

### New Capabilities

- `main-navigation`: 产品级主导航栏，支持多模块切换和用户管理
- `session-grouping`: 会话分组和置顶功能，包含前端分组逻辑和后端isPinned支持
- `task-overview-panel`: 右侧任务概览面板，展示当前任务状态、关联产品和平台信息
- `tool-execution-card`: 工具执行卡片组件，支持双卡片同步（消息流中的详细卡片 + 右侧面板的紧凑卡片）
- `message-enhancement`: 增强的消息渲染，包含任务摘要引用块、编号问题列表、勾选清单等
- `design-system-v2`: 新版设计系统，包含完整的颜色token、阴影分级、圆角规范和动画系统
- `task-management-api`: 任务管理后端API，支持任务的创建、查询和状态更新

### Modified Capabilities

- `chat-layout`: 从2栏响应式布局改为4栏Grid布局，重构ChatContainer组件
- `chat-session-list`: 会话列表UI和交互逻辑升级，支持分组、搜索和多状态显示
- `chat-messages`: 消息数据模型扩展，支持taskSummary和toolExecutionDetails字段

## Impact

### 前端影响
- **新增组件**: MainNavigation, SessionGroupList, TaskOverviewCard, ToolExecutionCardCompact, TaskSummaryBlock, EnhancedMessageCard
- **重构组件**: ChatContainer (布局), ChatInput (样式), MessageBubble (增强渲染)
- **新增页面**: ChatV2.tsx (新版聊天页面)
- **路由变更**: 新增 /chat-v2 路由，保留 /chat 作为旧版

### 后端影响
- **数据库**: 
  - ALTER TABLE chat_sessions ADD COLUMN (isPinned, tags, lastMessagePreview, unreadCount)
  - CREATE TABLE task_overviews (id, sessionId, taskName, status, startTime, relatedProducts, platform, metadata)
- **API新增**:
  - PATCH /api/chat/sessions/:id (更新会话置顶、标签状态)
  - GET /api/tasks/:sessionId (获取会话任务列表)
  - POST /api/tasks (创建新任务)
  - PATCH /api/tasks/:id (更新任务状态)
- **类型定义**: 扩展 backend/src/types/chat.ts 和 frontend/src/types/chat.ts

### 设计系统影响
- **全局样式**: **BREAKING** 主色调从 #8B5CF6 改为 #6E54EE，影响所有使用 accent-purple 的组件
- **Tailwind配置**: 扩展 tailwind.config.js，新增完整的chat-style.md设计token
- **CSS变量**: 在 index.css 新增约50+个设计token变量
- **受影响页面**: 仪表盘、商品、预警、设置等所有使用purple主题的页面需要回归测试

### 状态管理影响
- **Zustand Store扩展**: 
  - 新增 taskOverviews state
  - 新增 sessionGrouping 计算逻辑
  - 扩展 toolExecutionState 支持双卡片同步

### 依赖影响
- 无新增外部依赖
- 使用现有的 Tailwind CSS, Zustand, Lucide React

### 测试影响
- 需要新增E2E测试覆盖4栏布局和任务面板交互
- 需要跨页面回归测试验证设计系统升级的影响
- 需要API集成测试覆盖新增的任务管理接口
