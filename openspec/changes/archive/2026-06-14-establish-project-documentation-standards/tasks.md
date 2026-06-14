## 1. Phase 1 - 质量保证基础（Priority: Highest）

- [x] 1.1 创建 docs/quality 目录
- [x] 1.2 编写 docs/quality/testing-standards.md（测试覆盖率标准、测试金字塔、测试命名规范）
- [x] 1.3 编写 docs/quality/code-review-checklist.md（Blocker/Major/Minor 分级清单）
- [x] 1.4 编写 docs/quality/quality-gates.md（CI 自动化检查标准、人工审查要求、合并标准）
- [x] 1.5 编写 docs/quality/performance-standards.md（API 响应时间目标、前端性能指标、数据库查询优化）
- [x] 1.6 编写 docs/quality/security-guidelines.md（环境变量管理、认证授权、数据验证、敏感信息处理）
- [x] 1.7 创建 docs/development 目录
- [x] 1.8 编写 docs/development/error-handling.md（后端错误处理模式、前端错误边界、错误消息规范）
- [x] 1.9 更新项目根 README.md，添加"开发规范"章节和 docs 链接
- [ ] 1.10 ⚠️ 待人工完成 - 配置 CI/CD 强制执行覆盖率标准（后端 ≥85%、前端 ≥80%）
- [ ] 1.11 ⚠️ 待人工完成 - 团队评审 Phase 1 文档并收集反馈
- [ ] 1.12 ⚠️ 待人工完成 - 根据反馈调整文档内容

## 2. Phase 2 - 架构文档（Priority: High）

- [x] 2.1 创建 docs/architecture 目录
- [x] 2.2 编写 docs/architecture/overview.md（系统架构全景图、数据流、技术栈总览）
- [x] 2.3 绘制系统架构 ASCII 图（前端 → 后端 → 数据库 → 外部服务）
- [x] 2.4 编写 docs/architecture/backend-architecture.md（三层架构、职责分离、新功能添加指南）
- [x] 2.5 绘制后端分层架构图（routes → services → database）
- [x] 2.6 编写 docs/architecture/frontend-architecture.md（组件结构、状态管理、数据获取模式）
- [x] 2.7 编写 docs/architecture/database-schema.md（ER 图、表关系、索引策略）
- [x] 2.8 绘制数据库 ER 图（products、price_snapshots、alerts、alert_rules、chat_sessions 等表关系）
- [x] 2.9 编写 docs/architecture/api-design-principles.md（RESTful 约定、命名规范、响应格式、错误处理）
- [x] 2.10 编写 docs/architecture/tech-stack-decisions.md（ADR 格式记录技术选型：SQLite、React、Express、Drizzle 等）
- [x] 2.11 提炼 backend/AI_PROVIDER_GUIDE.md 经验到架构文档
- [ ] 2.12 ⚠️ 待人工完成 - 团队评审 Phase 2 文档

## 3. Phase 3 - 代码规范（Priority: Medium）

- [x] 3.1 编写 docs/development/code-standards.md（总览：后端、前端、TypeScript、命名、文件组织）
- [x] 3.2 编写 docs/development/backend-conventions.md（代码格式、文件结构、服务层模式、异步编程）
- [x] 3.3 提炼 backend/STREAMING_FIX.md 经验（手动迭代 vs for-await-of）到后端规范
- [x] 3.4 提炼 backend/SSE_IMPLEMENTATION_REVIEW.md 经验（better-sse API 使用）到后端规范
- [x] 3.5 编写 docs/development/frontend-conventions.md（React 组件模式、Hooks 使用、状态管理）
- [x] 3.6 编写 docs/development/typescript-guidelines.md（类型定义、避免 any、strict 模式）
- [x] 3.7 编写 docs/development/naming-conventions.md（变量、函数、类、文件命名规则）
- [x] 3.8 编写 docs/development/file-organization.md（后端分层目录、前端功能目录、文件大小限制）
- [ ] 3.9 ⚠️ 待人工完成 - 配置 ESLint 规则与文档对齐（backend/.eslintrc.json 和 frontend/.eslintrc.json）
- [ ] 3.10 ⚠️ 待人工完成 - 配置 Prettier 规则（.prettierrc）
- [ ] 3.11 ⚠️ 待人工完成 - 团队评审 Phase 3 文档

## 4. Phase 4 - 工作流程和指南（Priority: Medium-Low）

- [x] 4.1 创建 docs/workflow 目录
- [x] 4.2 编写 docs/workflow/git-workflow.md（分支策略、分支命名、main 保护）
- [x] 4.3 编写 docs/workflow/git-workflow.md - 提交消息规范（Conventional Commits、原子提交）
- [x] 4.4 编写 docs/workflow/feature-development.md（TDD 流程、实现步骤、验证标准）
- [x] 4.5 编写 docs/workflow/bug-fixing.md（Bug 文档化、回归测试、根因分析）
- [x] 4.6 编写 docs/workflow/pr-process.md（PR 描述模板、代码审查标准、合并策略）
- [x] 4.7 编写 docs/workflow/release-process.md（语义化版本、Changelog、Git 标签）
- [x] 4.8 创建 docs/guides 目录
- [x] 4.9 编写 docs/guides/getting-started.md（快速开始指南、30 分钟内完成设置）
- [x] 4.10 编写 docs/guides/local-development.md（开发服务器配置、环境变量、数据库设置）
- [x] 4.11 编写 docs/guides/debugging.md（后端/前端调试工具、常见场景）
- [x] 4.12 编写 docs/guides/troubleshooting.md（环境变量冲突、端口冲突、依赖安装、数据库迁移、测试失败）
- [x] 4.13 提炼 backend/SSE_IMPLEMENTATION_REVIEW.md 环境变量优先级问题到 troubleshooting.md
- [x] 4.14 编写 docs/guides/common-tasks.md（添加 API 端点、添加 React 组件、数据库 schema 变更、集成外部 API）
- [x] 4.15 创建 docs/deployment 目录
- [x] 4.16 编写 docs/deployment/deployment-guide.md（部署流程、回滚策略）
- [x] 4.17 编写 docs/deployment/environment-config.md（环境分离、配置验证、配置变更追踪）
- [x] 4.18 编写 docs/deployment/monitoring.md（日志级别、结构化日志、监控告警）
- [x] 4.19 编写 docs/deployment/backup-recovery.md（数据库备份、恢复流程）
- [x] 4.20 创建 docs/api 目录
- [x] 4.21 编写 docs/api/rest-api.md（所有 RESTful 端点文档、请求/响应格式、认证）
- [x] 4.22 编写 docs/api/sse-streaming.md（SSE 端点、事件类型、连接管理、错误处理）
- [x] 4.23 提炼 backend/STREAMING_FIX.md SSE 实现模式到 sse-streaming.md
- [x] 4.24 编写 docs/api/error-codes.md（HTTP 状态码、自定义错误码、错误响应格式）
- [ ] 4.25 ⚠️ 待人工完成 - 团队评审 Phase 4 文档

## 5. 文档导航和整合

- [x] 5.1 创建 docs/README.md（文档目录导航、学习路径、常见任务索引）
- [x] 5.2 在 docs/README.md 中添加快速导航（按优先级：质量 → 架构 → 代码 → 工作流）
- [x] 5.3 在 docs/README.md 中添加"我想做 X"任务索引
- [x] 5.4 更新项目根 README.md，添加完整的"开发规范"章节
- [x] 5.5 在项目根 README.md 中添加文档链接表格
- [x] 5.6 检查所有文档内部链接有效性
- [x] 5.7 确保所有文档都有 TL;DR 摘要（开头 3-5 句话）

## 6. 工具配置和集成

- [x] 6.1 更新 .gitignore，确保文档文件被追踪
- [ ] 6.2 ⚠️ 待人工完成 - 在 backend/.eslintrc.json 中配置规则与 backend-conventions.md 对齐
- [ ] 6.3 ⚠️ 待人工完成 - 在 frontend/.eslintrc.json 中配置规则与 frontend-conventions.md 对齐
- [x] 6.4 创建 .prettierrc 配置文件（与 code-standards.md 对齐）
- [x] 6.5 创建 .editorconfig 文件（统一 IDE 设置）
- [ ] 6.6 ⚠️ 待人工完成 - 更新 backend/package.json 添加 lint 和 format 脚本
- [ ] 6.7 ⚠️ 待人工完成 - 更新 frontend/package.json 添加 lint 和 format 脚本
- [ ] 6.8 ⚠️ 待人工完成 - 配置 CI/CD（GitHub Actions 或其他）强制执行 lint、tests、coverage
- [ ] 6.9 ⚠️ 待人工完成 - 配置 Git hooks（pre-commit）运行 lint 和 format

## 7. 验证和发布

- [ ] 7.1 ⚠️ 待人工完成 - 运行 Phase 1 验收测试：CI/CD 执行覆盖率检查
- [ ] 7.2 ⚠️ 待人工完成 - 运行 Phase 1 验收测试：使用 code-review-checklist.md 审查一个真实 PR
- [ ] 7.3 ⚠️ 待人工完成 - 运行新人测试：模拟新人根据 getting-started.md 完成环境搭建
- [x] 7.4 检查所有 15+ 个核心文档是否已创建
- [x] 7.5 检查所有文档的 Markdown 格式正确性（标题层级、链接、代码块）
- [x] 7.6 检查所有 ASCII 图表显示正确
- [ ] 7.7 ⚠️ 待人工完成 - 最终团队评审会议：收集反馈和改进建议
- [ ] 7.8 ⚠️ 待人工完成 - 根据最终反馈调整文档
- [x] 7.9 创建 Git 提交：docs: establish project documentation standards
- [ ] 7.10 ⚠️ 待人工完成 - 在团队沟通渠道宣布文档规范正式生效
- [x] 7.4 ⚠️ 待人工完成 - 检查所有 15+ 个核心文档是否已创建
- [x] 7.5 ⚠️ 待人工完成 - 检查所有文档的 Markdown 格式正确性（标题层级、链接、代码块）
- [x] 7.6 ⚠️ 待人工完成 - 检查所有 ASCII 图表显示正确
- [ ] 7.7 ⚠️ 待人工完成 - 最终团队评审会议：收集反馈和改进建议
- [ ] 7.8 ⚠️ 待人工完成 - 根据最终反馈调整文档
- [ ] 7.9 ⚠️ 待人工完成 - 创建 Git 提交：docs: establish project documentation standards
- [ ] 7.10 ⚠️ 待人工完成 - 在团队沟通渠道宣布文档规范正式生效

## 8. 持续改进（Optional）

- [ ] 8.1 ⚠️ 待人工完成 - 设置季度文档审查提醒（每 3 个月检查一次文档准确性）
- [ ] 8.2 ⚠️ 待人工完成 - 创建文档反馈机制（如 GitHub Discussions 或内部 Wiki）
- [ ] 8.3 ⚠️ 待人工完成 - 监控文档使用情况（哪些文档被频繁访问，哪些被忽略）
- [ ] 8.4 ⚠️ 待人工完成 - 根据使用情况优化文档优先级和内容
- [ ] 8.5 ⚠️ 待人工完成 - 考虑是否引入自动化工具（Swagger for API docs、Mermaid for diagrams）
- [ ] 8.6 ⚠️ 待人工完成 - 评估是否需要英文文档（如有国际协作需求）
- [ ] 8.7 ⚠️ 待人工完成 - 将常见问题和解决方案持续补充到 troubleshooting.md
