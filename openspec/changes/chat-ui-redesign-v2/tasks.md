# Chat UI Redesign 实施任务清单

本文档将Chat UI重构工作分解为可追踪的任务。任务按依赖顺序组织，每个任务应在一个工作会话内完成。

---

## 1. 项目准备与设计系统

- [x] 1.1 备份当前代码，创建feature分支 `feature/chat-ui-redesign-v2`
- [x] 1.2 扩展 `tailwind.config.js`，添加新purple色系和设计token
- [x] 1.3 更新 `frontend/src/index.css`，注入完整的CSS变量（颜色、阴影、圆角、间距）
- [x] 1.4 创建 `--color-legacy-purple` 临时兼容变量
- [ ] 1.5 使用色彩对比度工具验证新purple的WCAG AA合规性
- [ ] 1.6 创建设计系统文档页面展示所有token（可选）

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
- [x] 7.2 添加新的API端点定义（PATCH /chat/sessions/:id, /tasks/*）
- [x] 7.3 更新API版本号为2.0.0
- [x] 7.4 添加请求和响应示例
- [x] 7.5 更新Swagger UI，验证文档正确性

---

## 8. 后端单元测试

- [ ] 8.1 编写taskService单元测试，覆盖创建、查询、更新任务
- [ ] 8.2 编写chatService的updateSession单元测试
- [ ] 8.3 编写任务API路由的集成测试
- [ ] 8.4 编写会话更新API的集成测试
- [ ] 8.5 测试数据库级联删除（删除会话时任务自动删除）
- [ ] 8.6 测试并发更新场景
- [ ] 8.7 测试错误处理和边界情况

---

## 9. 前端类型定义扩展

- [x] 9.1 扩展 `frontend/src/types/chat.ts`，添加TaskOverview, TaskStatus等类型
- [x] 9.2 添加SessionGrouping相关类型
- [x] 9.3 添加ToolExecutionState扩展字段
- [x] 9.4 添加TaskSummary和ToolExecutionDetails类型

---

## 10. Zustand Store扩展

- [ ] 10.1 在 `frontend/src/stores/chatStore.ts` 添加taskOverviews state
- [ ] 10.2 添加taskOverviews相关的actions（setTaskOverviews, addTask, updateTask）
- [ ] 10.3 扩展toolExecutionState类型，支持双卡片同步
- [ ] 10.4 添加会话分组相关的computed state或helper函数

---

## 11. API客户端扩展

- [ ] 11.1 在 `frontend/src/services/chatApi.ts` 添加updateSession方法
- [ ] 11.2 创建 `frontend/src/services/taskApi.ts`，实现getTasks, createTask, updateTask方法
- [ ] 11.3 添加错误处理和重试逻辑
- [ ] 11.4 添加请求/响应拦截器（可选）

---

## 12. 工具函数和Hooks

- [ ] 12.1 创建 `frontend/src/utils/sessionGrouping.ts`，实现groupSessions函数
- [ ] 12.2 创建 `frontend/src/utils/timeFormat.ts`，实现相对时间格式化（"刚刚"、"5分钟前"）
- [ ] 12.3 创建 `frontend/src/hooks/useTaskManagement.ts`，封装任务管理逻辑
- [ ] 12.4 扩展 `frontend/src/hooks/useChatSSE.ts`，处理新的SSE事件类型

---

## 13. 主导航组件开发

- [ ] 13.1 创建 `frontend/src/components/chat-v2/MainNavigation.tsx` 组件
- [ ] 13.2 实现品牌区（Logo + 名称 + 副标题）
- [ ] 13.3 实现导航项列表（仪表盘、商品、预警、智能助手、设置）
- [ ] 13.4 实现导航项的active状态高亮
- [ ] 13.5 实现hover交互效果
- [ ] 13.6 实现底部用户区（头像 + 用户名）
- [ ] 13.7 添加响应式适配（Tablet/Mobile的hamburger切换）
- [ ] 13.8 添加路由跳转逻辑

---

## 14. 会话列表组件重构

- [ ] 14.1 创建 `frontend/src/components/chat-v2/SessionGroupList.tsx` 组件
- [ ] 14.2 实现会话分组渲染（置顶/今天/昨日/更早）
- [ ] 14.3 实现分组标题样式
- [ ] 14.4 重构会话卡片组件，使用新的样式（active状态、阴影、圆角）
- [ ] 14.5 实现会话搜索框
- [ ] 14.6 实现搜索过滤逻辑
- [ ] 14.7 实现会话置顶图标显示
- [ ] 14.8 实现未读指示器
- [ ] 14.9 实现会话操作菜单（置顶/取消置顶、删除、重命名）
- [ ] 14.10 实现会话右键菜单
- [ ] 14.11 实现会话卡片的hover和active动画
- [ ] 14.12 调用API实现置顶功能

---

## 15. 任务概览面板组件

- [ ] 15.1 创建 `frontend/src/components/chat-v2/TaskOverviewCard.tsx` 组件
- [ ] 15.2 实现卡片布局（标题 + 字段列表 + 操作按钮）
- [ ] 15.3 实现任务名称显示
- [ ] 15.4 实现任务状态指示器（进行中/已完成/失败/等待）
- [ ] 15.5 实现开始时间显示（相对时间格式）
- [ ] 15.6 实现关联产品显示
- [ ] 15.7 实现平台标识显示（Amazon/Shopify图标）
- [ ] 15.8 实现任务进度条（可选）
- [ ] 15.9 实现"查看详情"按钮，滚动到对话区对应位置
- [ ] 15.10 实现"取消任务"按钮
- [ ] 15.11 实现空状态显示
- [ ] 15.12 实现加载骨架屏
- [ ] 15.13 连接store，实时更新任务状态

---

## 16. 工具执行卡组件开发

- [ ] 16.1 创建 `frontend/src/components/chat-v2/ToolExecutionCard.tsx` 组件（详细版，用于消息流）
- [ ] 16.2 实现卡片整体样式（淡绿色背景、14px圆角、阴影）
- [ ] 16.3 实现顶部信息行（工具图标 + 名称 + 函数名 + 状态chip + 折叠按钮）
- [ ] 16.4 实现输入/结果两列布局
- [ ] 16.5 实现输入参数显示（支持JSON格式化）
- [ ] 16.6 实现执行结果显示（根据类型智能渲染）
- [ ] 16.7 实现执行耗时显示
- [ ] 16.8 实现卡片折叠/展开功能
- [ ] 16.9 实现工具图标的状态样式（成功/运行中/失败）
- [ ] 16.10 实现状态chip样式
- [ ] 16.11 实现运行中动画（图标旋转）
- [ ] 16.12 实现完成/失败动画
- [ ] 16.13 创建 `frontend/src/components/chat-v2/ToolExecutionCardCompact.tsx` 组件（紧凑版，用于右侧面板）
- [ ] 16.14 实现紧凑卡片布局（简化信息、"查看结果"按钮）
- [ ] 16.15 连接store的toolExecutionState，实现双卡片同步
- [ ] 16.16 实现"查看结果"按钮滚动功能

---

## 17. 消息增强组件开发

- [ ] 17.1 创建 `frontend/src/components/chat-v2/TaskSummaryBlock.tsx` 组件（任务摘要引用块）
- [ ] 17.2 实现引用块样式（浅紫色渐变背景、Sparkle图标）
- [ ] 17.3 创建 `frontend/src/components/chat-v2/NumberedQuestionList.tsx` 组件（编号问题列表）
- [ ] 17.4 实现序号方块样式（16x16px紫色方块）
- [ ] 17.5 创建 `frontend/src/components/chat-v2/CheckList.tsx` 组件（勾选清单）
- [ ] 17.6 实现勾选/未勾选图标样式
- [ ] 17.7 创建 `frontend/src/components/chat-v2/EnhancedCodeBlock.tsx` 组件
- [ ] 17.8 实现代码块增强（语法高亮、复制按钮、语言标签）
- [ ] 17.9 升级消息卡片样式（新阴影、圆角、padding）
- [ ] 17.10 实现消息操作按钮样式统一
- [ ] 17.11 实现链接样式增强（紫色下划线、外部链接图标）
- [ ] 17.12 实现表格渲染样式（细线边框、斑马纹）

---

## 18. 任务面板容器组件

- [ ] 18.1 创建 `frontend/src/components/chat-v2/TaskPanel.tsx` 容器组件
- [ ] 18.2 组装TaskOverviewCard和ToolExecutionCardCompact
- [ ] 18.3 实现面板滚动逻辑
- [ ] 18.4 实现响应式适配（Tablet drawer模式）
- [ ] 18.5 添加面板header（标题、折叠按钮）
- [ ] 18.6 实现section分隔（任务概览 / 工具执行 / 笔记占位）

---

## 19. ChatV2页面组装

- [ ] 19.1 创建 `frontend/src/pages/ChatV2.tsx` 页面组件
- [ ] 19.2 实现4栏Grid布局（208px / 272px / minmax(720px,1fr) / 314px）
- [ ] 19.3 组装MainNavigation、SessionGroupList、MessageList、TaskPanel四个区域
- [ ] 19.4 复用现有的ChatInput、ControlBar组件
- [ ] 19.5 实现响应式断点逻辑（Desktop/Tablet/Mobile）
- [ ] 19.6 实现会话切换逻辑，加载任务数据
- [ ] 19.7 实现SSE连接和事件处理
- [ ] 19.8 实现布局动画过渡
- [ ] 19.9 处理最小尺寸约束
- [ ] 19.10 实现各列的独立滚动

---

## 20. 路由配置

- [ ] 20.1 在 `frontend/src/App.tsx` 添加 `/chat-v2` 路由，指向ChatV2组件
- [ ] 20.2 保留 `/chat` 路由，指向旧版Chat组件
- [ ] 20.3 在主导航中"智能助手"导航项链接到 `/chat-v2`
- [ ] 20.4 添加调试用的版本切换链接（可选）

---

## 21. 前端集成测试

- [ ] 21.1 测试4栏布局在不同视口宽度下的响应式表现
- [ ] 21.2 测试会话分组功能（置顶、今天、昨日、更早）
- [ ] 21.3 测试会话置顶/取消置顶功能
- [ ] 21.4 测试会话搜索过滤功能
- [ ] 21.5 测试任务概览卡片的数据显示
- [ ] 21.6 测试任务状态实时更新（通过SSE）
- [ ] 21.7 测试工具执行卡的双卡片同步
- [ ] 21.8 测试工具卡片的折叠/展开
- [ ] 21.9 测试消息增强组件的渲染（任务摘要块、编号列表、勾选清单）
- [ ] 21.10 测试主导航的路由跳转
- [ ] 21.11 测试Tablet/Mobile模式下的drawer切换

---

## 22. 跨页面视觉回归测试

- [ ] 22.1 测试仪表盘页面的purple色系变化
- [ ] 22.2 测试商品页面的按钮和强调色
- [ ] 22.3 测试预警页面的UI一致性
- [ ] 22.4 测试设置页面的表单和按钮
- [ ] 22.5 验证所有页面的颜色对比度
- [ ] 22.6 记录发现的样式问题
- [ ] 22.7 修复样式不一致问题

---

## 23. 性能优化

- [ ] 23.1 测量ChatV2页面的LCP、FID、CLS指标
- [ ] 23.2 优化会话列表渲染（如果会话数>100，考虑虚拟滚动）
- [ ] 23.3 优化消息列表渲染性能
- [ ] 23.4 优化SSE事件处理的防抖/节流
- [ ] 23.5 使用React.memo优化不必要的重渲染
- [ ] 23.6 代码分割，懒加载ChatV2页面
- [ ] 23.7 优化图标和图片资源

---

## 24. E2E测试（可选）

- [ ] 24.1 编写Playwright测试：创建会话 → 发送消息 → 验证工具执行卡显示
- [ ] 24.2 编写测试：置顶会话 → 验证分组变化
- [ ] 24.3 编写测试：搜索会话 → 验证过滤结果
- [ ] 24.4 编写测试：点击任务面板的"查看详情" → 验证滚动到对应消息
- [ ] 24.5 编写测试：切换会话 → 验证任务面板数据更新
- [ ] 24.6 编写测试：响应式布局 → 验证Tablet/Mobile模式

---

## 25. 文档更新

- [ ] 25.1 更新 `README.md`，说明新版Chat UI的功能
- [ ] 25.2 更新API文档索引，链接到 `docs/api/chat-redesign-api.md`
- [ ] 25.3 创建用户操作手册（如何使用会话分组、任务面板）
- [ ] 25.4 更新开发者文档，说明如何扩展任务管理功能
- [ ] 25.5 记录已知问题和限制
- [ ] 25.6 更新CHANGELOG.md

---

## 26. 代码审查和优化

- [ ] 26.1 代码格式化，运行ESLint和Prettier
- [ ] 26.2 移除console.log和调试代码
- [ ] 26.3 审查所有TODO和FIXME注释
- [ ] 26.4 审查错误处理的完整性
- [ ] 26.5 审查类型定义的准确性
- [ ] 26.6 审查组件的可访问性（ARIA属性、键盘导航）
- [ ] 26.7 审查代码注释的清晰度

---

## 27. 灰度发布准备

- [ ] 27.1 确认所有测试通过
- [ ] 27.2 创建feature flag配置（控制新版UI显示）
- [ ] 27.3 准备回滚计划文档
- [ ] 27.4 配置错误监控和日志告警
- [ ] 27.5 准备数据库备份脚本
- [ ] 27.6 通知团队灰度发布计划

---

## 28. 灰度发布

- [ ] 28.1 合并feature分支到develop分支
- [ ] 28.2 部署到staging环境
- [ ] 28.3 在staging环境进行完整的功能验证
- [ ] 28.4 邀请内部用户测试新版UI
- [ ] 28.5 收集用户反馈
- [ ] 28.6 修复发现的bug
- [ ] 28.7 监控性能指标和错误日志

---

## 29. 正式上线

- [ ] 29.1 确认灰度期间无严重问题
- [ ] 29.2 将 `/chat` 路由指向ChatV2（交换路由配置）
- [ ] 29.3 将旧版Chat移至 `/chat-legacy` 路由
- [ ] 29.4 部署到生产环境
- [ ] 29.5 监控生产环境性能和错误
- [ ] 29.6 准备快速回滚方案（如有严重问题）

---

## 30. 清理和归档

- [ ] 30.1 监控新版运行2周，确认稳定
- [ ] 30.2 移除旧版Chat组件和相关代码（Chat.tsx, components/chat/目录）
- [ ] 30.3 移除 `--color-legacy-purple` 兼容变量
- [ ] 30.4 移除 `/chat-legacy` 路由
- [ ] 30.5 清理未使用的依赖
- [ ] 30.6 归档设计稿和原型文件
- [ ] 30.7 更新团队知识库

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
