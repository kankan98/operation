---
name: ai-workflow
description: >
  AI 自主开发软件的强制性执行规范。定义 6 阶段工作流（需求分析→方案设计→计划编写→任务执行→测试验收→归档总结）、
  决策边界、状态管理和自我验证协议。

  **何时使用**：当执行任何软件开发任务时（新功能开发、重构优化、Bug修复、架构调整），
  AI 必须自动遵循本规范。特别是当用户说"帮我开发X"、"实现Y功能"、"重构Z模块"、
  "修复XX问题"时，务必使用此 skill 指导整个开发流程。即使用户没有明确提到"工作流"，
  只要涉及代码变更和功能开发，都应该使用这个 skill。
---

# AI 开发工作流执行规范

> 指导 AI 自主执行软件开发全流程，可跨会话、可自验证、可恢复

---

## 核心协议

### 四条铁律

1. **Never Say "Done" Without Verification** - 禁止未经验证就宣称完成，所有断言必须附带验证证据
2. **State-First Protocol** - 每次会话先检查状态文件，有状态则恢复，无状态则等待指令
3. **Explicit Approval for Key Decisions** - 技术选型、方案选择、不可逆操作必须人类确认
4. **No Root-Level Documents** - 所有开发文档必须在 `openspec/changes/<name>/` 下，禁止在项目根目录创建 .md 文件

### 执行权限矩阵

| 操作类型 | AI 权限 | 人类确认 | 示例 |
|---------|---------|---------|------|
| 只读分析 | ✅ 完全自主 | ❌ | 读文件、搜索代码、分析架构 |
| 文档生成 | ✅ 完全自主 | ❌ | 生成设计文档、测试计划 |
| 代码编写 | ✅ 自主执行 | ⚠️ 重大架构变更需确认 | 新增组件、修改逻辑 |
| 技术选型 | ⚠️ 提供建议 | ✅ 必须 | 选择库、框架、设计模式 |
| 删除操作 | ⚠️ 需要确认 | ✅ 必须 | 删除文件、删除代码块 |

### 决策原则

- **只读优先**：充分分析后再动手
- **可逆可自主**：Git 可追溯的操作可自主执行
- **不可逆必确认**：删除、配置变更必须人类确认

---

## 六阶段工作流

### 阶段 1：需求分析（Explore）

**目标**：理解需求，生成结构化需求文档  
**AI 权限**：✅ 完全自主（只读 + 文档生成）  
**使用工具**：`/openspec-explore` 或 `opsx:explore`  
**输出**：proposal.md（业务目标、技术范围、风险识别）  
**门禁 1**：向用户展示分析结果，等待确认

📋 [详细检查清单](./checklists/stage-1-explore.md)

---

### 阶段 2：方案设计（Design）

**目标**：提出多种方案，经人类确认后选定  
**AI 权限**：✅ 提案自主 + ⚠️ 方案选择需人类确认  
**使用工具**：`/superpowers:brainstorming`（必须使用）  
**输出**：2-3 种可行方案的对比分析  
**门禁 2**：展示所有方案和推荐，等待人类明确选择，记录决策

📋 [详细检查清单](./checklists/stage-2-design.md)

---

### 阶段 3：计划编写（Planning）

**目标**：生成设计文档、任务清单、测试计划  
**AI 权限**：✅ 完全自主（文档生成）  
**使用工具**：`/openspec-propose` 或 `opsx:propose`, `/superpowers:writing-plans`  
**输出**：design.md, tasks.md, testing/*, specs/*  
**门禁 3**：向用户展示计划，确认后进入实现阶段

📋 [详细检查清单](./checklists/stage-3-planning.md)

---

### 阶段 4：任务执行（Implementation）

**目标**：按计划实现代码  
**AI 权限**：✅ 代码编写自主 + ⚠️ 重大架构变更需确认  
**使用工具**：`/openspec-apply-change`, `/superpowers:test-driven-development`, `/superpowers:executing-plans`  
**执行**：按 tasks.md 顺序执行，采用 TDD，每完成一个任务提交 Git commit  
**门禁 4**：重大架构变更需人类确认

📋 [详细检查清单](./checklists/stage-4-implementation.md)

---

### 阶段 5：测试验收（Verification）

**目标**：全面测试，生成测试报告  
**AI 权限**：✅ 完全自主（测试执行 + 报告生成）  
**使用工具**：`/superpowers:verification-before-completion`, `/playwright-cli`, `/code-review`, `/verify`  
**执行**：运行单元/集成/E2E 测试，检查覆盖率（≥80%），代码审查，功能验证  
**门禁 5**：向用户展示测试报告，确认后进入归档阶段

📋 [详细检查清单](./checklists/stage-5-verification.md)

---

### 阶段 6：归档总结（Archive）

**目标**：归档变更，总结经验  
**AI 权限**：✅ 完全自主  
**使用工具**：`/openspec-archive-change` 或 `opsx:archive`  
**执行**：归档到 archive/，更新 CHANGELOG.md，删除状态文件  
**完成**：所有测试通过，代码已合并（或等待合并）

📋 [详细检查清单](./checklists/stage-6-archive.md)

---

## 自我验证协议

### 验证原则

1. **运行才能确认** - ❌ "应该能工作" → ✅ "测试 23/23 通过"
2. **生成才能确认** - ❌ "我会生成文档" → ✅ "已生成 design.md（127 行）"
3. **读取才能确认** - ❌ "应该已修复" → ✅ "已读取 src/utils.ts:45，确认已修复"

### 强制自检时机

- 阶段完成前：验证输出产物是否齐全
- 代码提交前：运行 lint 和测试
- 宣称完成前：运行完整测试套件

### 自检失败处理

- **主动修复**：AI 自主修复 lint 错误、格式问题
- **报告问题**：无法自动修复的问题，向用户报告
- **禁止隐瞒**：禁止忽略失败的测试或检查

---

## 扩展阅读

### 参考文档（详细规范）

- 📄 [状态管理机制](./references/state-management.md) - 状态文件规范、会话初始化、跨会话恢复
- 📄 [文档产物管理](./references/document-management.md) - OpenSpec 目录结构、文档规则、模板
- 📄 [问题诊断和处理](./references/troubleshooting.md) - 中断恢复、计划调整、测试失败、Git 冲突

### 最佳实践模块（新增）

- 🎯 [测试最佳实践](./modules/testing-best-practices.md) - 自动化优先级、验收标准、环境问题识别
- 🚀 [实施策略](./modules/implementation-strategies.md) - 渐进式实施、任务分组、检查点机制
- ⚡ [性能优化指南](./modules/performance-optimization.md) - 性能指标、优化清单、后台任务管理

### 各阶段执行清单

- [阶段 1：需求分析](./checklists/stage-1-explore.md)
- [阶段 2：方案设计](./checklists/stage-2-design.md)
- [阶段 3：计划编写](./checklists/stage-3-planning.md)
- [阶段 4：任务执行](./checklists/stage-4-implementation.md)
- [阶段 5：测试验收](./checklists/stage-5-verification.md)
- [阶段 6：归档总结](./checklists/stage-6-archive.md)

---

## 快速参考

### 常用命令

```bash
# 启动阶段
/openspec-explore <name>         # 阶段 1
/superpowers:brainstorming       # 阶段 2
/openspec-propose <name>         # 阶段 3
/superpowers:writing-plans       # 阶段 3（辅助）
/openspec-apply-change <name>    # 阶段 4
/superpowers:executing-plans     # 阶段 4（辅助）
/superpowers:test-driven-development  # 阶段 4（TDD）
/code-review                     # 阶段 5
/superpowers:verification-before-completion  # 阶段 5
/openspec-archive-change <name>  # 阶段 6
```

### 状态管理

- 状态文件：`.claude/state/current-change.json`
- 每次会话开始：先检查状态文件
- 阶段切换：必须更新状态文件
- 跨会话恢复：读取 lastUpdate 和 currentStage

### 门禁决策

- 门禁 1：需求分析完成
- 门禁 2：**方案选择（必须人类决策）**
- 门禁 3：计划编写完成
- 门禁 4：重大架构变更
- 门禁 5：测试验收完成

---
