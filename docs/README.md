# 项目文档

欢迎查阅本项目的开发规范文档。本文档体系涵盖质量保证、架构设计、开发规范、工作流程、部署运维等各个方面。

---

## 📖 快速导航

### 按角色导航

| 我是... | 应该先看... |
|---------|-------------|
| **新人开发者** | [快速开始](./guides/getting-started.md) → [本地开发](./guides/local-development.md) → [常见任务](./guides/common-tasks.md) |
| **功能开发者** | [架构概览](./architecture/overview.md) → [后端架构](./architecture/backend-architecture.md) / [前端架构](./architecture/frontend-architecture.md) |
| **代码审查者** | [代码审查清单](./quality/code-review-checklist.md) → [质量门禁](./quality/quality-gates.md) |
| **运维人员** | [部署指南](./deployment/deployment-guide.md) → [监控](./deployment/monitoring.md) |
| **路线规划者** | [当前路线计划](./roadmap.md) → [OpenSpec 规格](../openspec/specs/product-data-acquisition/spec.md) |

### 按优先级导航

**🔴 必读（所有开发者）**
1. [测试标准](./quality/testing-standards.md) - 覆盖率要求、测试规范
2. [代码审查清单](./quality/code-review-checklist.md) - PR 审查标准
3. [质量门禁](./quality/quality-gates.md) - 代码合并要求
4. [架构概览](./architecture/overview.md) - 系统整体架构
5. [当前路线计划](./roadmap.md) - Chat 和商品数据采集的当前进度、限制和下一阶段路线

**🟡 重要（日常开发）**
6. [后端架构](./architecture/backend-architecture.md) - 后端分层设计
7. [前端架构](./architecture/frontend-architecture.md) - 前端组件设计
8. [错误处理](./development/error-handling.md) - 错误处理规范
9. [Git 工作流](./workflow/git-workflow.md) - 分支和提交规范

**🟢 参考（按需查阅）**
10. [性能标准](./quality/performance-standards.md)
11. [安全规范](./quality/security-guidelines.md)
12. [问题排查](./guides/troubleshooting.md)
13. [API 文档](./api/rest-api.md)

---

## 🗂️ 文档目录

### 📊 质量保证（Quality）

确保代码质量和系统稳定性的标准。

| 文档 | 说明 |
|------|------|
| [测试标准](./quality/testing-standards.md) | 覆盖率标准、测试金字塔、测试命名规范 |
| [代码审查清单](./quality/code-review-checklist.md) | Blocker/Major/Minor 分级审查清单 |
| [质量门禁](./quality/quality-gates.md) | CI 自动化检查、人工审查要求、合并标准 |
| [性能标准](./quality/performance-standards.md) | API 响应时间、前端性能指标、数据库优化 |
| [安全规范](./quality/security-guidelines.md) | 环境变量管理、认证授权、数据验证 |

### 🏗️ 架构设计（Architecture）

系统架构和设计决策文档。

| 文档 | 说明 |
|------|------|
| [系统架构概览](./architecture/overview.md) | 系统全景图、数据流、技术栈总览 |
| [后端架构](./architecture/backend-architecture.md) | 三层架构、职责分离、新功能添加指南 |
| [前端架构](./architecture/frontend-architecture.md) | 组件结构、状态管理、数据获取模式 |
| [数据库设计](./architecture/database-schema.md) | ER 图、表关系、索引策略 |
| [API 设计原则](./architecture/api-design-principles.md) | RESTful 约定、命名规范、响应格式 |
| [技术选型决策](./architecture/tech-stack-decisions.md) | ADR 格式记录技术选型理由 |

### 🗺️ 路线规划（Roadmap）

当前项目路线、阶段状态和下一步优先级。

| 文档 | 说明 |
|------|------|
| [当前路线计划](./roadmap.md) | Chat 工作台和可靠商品数据采集的当前状态、限制、下一阶段计划和验证门禁 |

### 💻 开发规范（Development）

代码编写规范和最佳实践。

| 文档 | 说明 |
|------|------|
| [代码规范总览](./development/code-standards.md) | 后端、前端、TypeScript、命名、文件组织 |
| [后端代码约定](./development/backend-conventions.md) | 代码格式、文件结构、服务层模式、异步编程 |
| [前端代码约定](./development/frontend-conventions.md) | React 组件模式、Hooks 使用、状态管理 |
| [TypeScript 规范](./development/typescript-guidelines.md) | 类型定义、避免 any、strict 模式 |
| [命名约定](./development/naming-conventions.md) | 变量、函数、类、文件命名规则 |
| [文件组织](./development/file-organization.md) | 后端分层目录、前端功能目录、文件大小限制 |
| [错误处理](./development/error-handling.md) | 后端/前端错误处理模式、错误消息规范 |
| [Amazon Provider Observability](./development/amazon-provider-observability.md) | Amazon 数据采集健康、根因分类、诊断脱敏和排障流程 |
| [Keepa Market Signals](./development/keepa-market-signals.md) | Keepa 历史趋势信号配置、刷新、诊断脱敏、排障和代理信号语义 |

### 🔄 工作流程（Workflow）

开发协作流程和规范。

| 文档 | 说明 |
|------|------|
| [Git 工作流](./workflow/git-workflow.md) | 分支策略、提交消息规范、main 保护 |
| [功能开发流程](./workflow/feature-development.md) | TDD 流程、实现步骤、验证标准 |
| [Bug 修复流程](./workflow/bug-fixing.md) | Bug 文档化、回归测试、根因分析 |
| [PR 审查流程](./workflow/pr-process.md) | PR 描述模板、代码审查标准、合并策略 |
| [发布流程](./workflow/release-process.md) | 语义化版本、Changelog、Git 标签 |

### 📘 开发指南（Guides）

实用的开发指南和教程。

| 文档 | 说明 |
|------|------|
| [快速开始](./guides/getting-started.md) | 新人入职指南，30 分钟内完成环境搭建 |
| [本地开发环境](./guides/local-development.md) | 开发服务器配置、环境变量、数据库设置 |
| [调试指南](./guides/debugging.md) | 后端/前端调试工具、常见调试场景 |
| [问题排查手册](./guides/troubleshooting.md) | 常见问题和解决方案 |
| [常见任务指南](./guides/common-tasks.md) | 添加 API、添加组件、数据库变更等 |

### 🚀 部署运维（Deployment）

生产部署和运维指南。

| 文档 | 说明 |
|------|------|
| [部署指南](./deployment/deployment-guide.md) | 部署流程、回滚策略 |
| [环境配置管理](./deployment/environment-config.md) | 环境分离、配置验证、配置变更追踪 |
| [监控和日志](./deployment/monitoring.md) | 日志级别、结构化日志、监控告警 |
| [备份恢复](./deployment/backup-recovery.md) | 数据库备份、恢复流程 |

### 📡 API 文档（API）

API 接口文档和规范。

| 文档 | 说明 |
|------|------|
| [RESTful API](./api/rest-api.md) | 所有端点文档、请求/响应格式、认证 |
| [SSE 流式 API](./api/sse-streaming.md) | SSE 端点、事件类型、连接管理、错误处理 |
| [Chat Redesign API](./api/chat-redesign-api.md) | Chat 会话扩展、任务管理 API、SSE 新事件 |
| [错误码定义](./api/error-codes.md) | HTTP 状态码、自定义错误码、错误响应格式 |

---

## 🎯 常见任务索引

### 我想...添加新功能

1. 阅读 [系统架构概览](./architecture/overview.md) 了解整体结构
2. 根据功能类型查看：
   - 后端功能：[后端架构](./architecture/backend-architecture.md) → [常见任务：添加 API 端点](./guides/common-tasks.md#添加-api-端点)
   - 前端功能：[前端架构](./architecture/frontend-architecture.md) → [常见任务：添加 React 组件](./guides/common-tasks.md#添加-react-组件)
3. 遵循 [功能开发流程](./workflow/feature-development.md)
4. 提交前检查 [质量门禁](./quality/quality-gates.md)

### 我想...修复 Bug

1. 阅读 [Bug 修复流程](./workflow/bug-fixing.md)
2. 添加回归测试（参考 [测试标准](./quality/testing-standards.md)）
3. 修复代码
4. 提交 PR（参考 [PR 审查流程](./workflow/pr-process.md)）

### 我想...审查 PR

1. 使用 [代码审查清单](./quality/code-review-checklist.md)
2. 检查 [质量门禁](./quality/quality-gates.md) 是否通过
3. 验证测试覆盖率（参考 [测试标准](./quality/testing-standards.md)）

### 我想...部署到生产

1. 阅读 [部署指南](./deployment/deployment-guide.md)
2. 检查 [环境配置](./deployment/environment-config.md)
3. 配置 [监控](./deployment/monitoring.md)
4. 准备 [备份方案](./deployment/backup-recovery.md)

### 我遇到了问题...

1. 查看 [问题排查手册](./guides/troubleshooting.md)
2. 检查 [调试指南](./guides/debugging.md)
3. 搜索相关的技术修复记录（如 `backend/SSE_IMPLEMENTATION_REVIEW.md`）

---

## 📝 文档维护

### 如何更新文档

1. **发现过时内容**：在相关 PR 中提出或直接修改
2. **添加新内容**：遵循现有文档结构和格式
3. **重大变更**：先讨论，再更新

### 文档格式规范

所有文档遵循以下格式：

```markdown
# 文档标题

> **TL;DR**: 3-5 句话的摘要，快速说明本文档的核心内容。

---

## 主要章节

内容...

---

## 参考资源

- 相关链接
```

### 反馈和建议

文档有问题？请：
1. 创建 Issue 描述问题
2. 或直接提交 PR 修复

---

## 🔄 文档更新日志

| 日期 | 变更 | 作者 |
|------|------|------|
| 2026-06-14 | 初始版本：建立完整文档体系 | System |
| 2026-06-20 | 添加 Chat 用户手册、任务扩展指南和 API 索引 | Codex |
| 2026-06-20 | 添加当前路线计划和商品数据采集路线入口 | Codex |
| 2026-06-20 | 添加 Keepa market signal 开发和排障说明 | Codex |

---

## 📚 外部参考资源

- [Google Engineering Practices](https://google.github.io/eng-practices/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**⚡ 持续更新中...**

如有疑问，请查阅对应文档或联系团队。
