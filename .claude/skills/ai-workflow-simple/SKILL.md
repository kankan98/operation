---
name: ai-workflow-simple
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

### 三条铁律

1. **Never Say "Done" Without Verification**
   - 禁止未经验证就宣称完成
   - 所有断言必须附带验证证据
   - 示例：❌ "已修复" → ✅ "已修复并验证：测试 23/23 通过"

2. **State-First Protocol**
   - 每次会话必须先检查 `.claude/state/current-change.json`
   - 有状态则恢复，无状态则等待指令
   - 所有阶段切换必须更新状态文件

3. **Explicit Approval for Key Decisions**
   - 技术选型、方案选择必须人类确认
   - 不可逆操作（删除、配置变更）必须人类确认
   - 只读和可逆操作可自主执行

### 执行权限矩阵

| 操作类型 | AI 权限     | 人类确认              | 示例                       |
| -------- | ----------- | --------------------- | -------------------------- |
| 只读分析 | ✅ 完全自主 | ❌                    | 读文件、搜索代码、分析架构 |
| 文档生成 | ✅ 完全自主 | ❌                    | 生成设计文档、测试计划     |
| 代码编写 | ✅ 自主执行 | ⚠️ 重大架构变更需确认 | 新增组件、修改逻辑         |
| 测试运行 | ✅ 完全自主 | ❌                    | 运行单元/集成/E2E 测试     |
| 技术选型 | ⚠️ 提供建议 | ✅ 必须               | 选择库、框架、设计模式     |
| 方案选择 | ⚠️ 提供选项 | ✅ 必须               | 多个方案中选择一个         |
| 删除操作 | ⚠️ 需要确认 | ✅ 必须               | 删除文件、删除代码块       |
| 配置修改 | ⚠️ 需要确认 | ✅ 必须               | package.json、tsconfig     |

### 决策原则

- **只读优先**：充分分析后再动手
- **可逆可自主**：Git 可追溯的操作可自主执行
- **不可逆必确认**：删除、配置变更必须人类确认

---

## 文档产物管理

### 目录结构

所有开发过程文档必须按以下层级组织，**禁止散落在根目录**：

```
openspec/
├── changes/                           # 变更管理
│   ├── <change-name>/                 # 进行中的变更
│   │   ├── .openspec.yaml             # 变更元数据
│   │   ├── proposal.md                # 需求分析文档
│   │   ├── design.md                  # 设计文档
│   │   ├── tasks.md                   # 任务清单
│   │   ├── specs/                     # 变更专属规范（增量需求）
│   │   │   └── <feature>/
│   │   │       └── spec.md
│   │   ├── testing/                   # 测试文档
│   │   │   ├── README.md
│   │   │   ├── unit-tests.md
│   │   │   ├── integration-tests.md
│   │   │   └── e2e-tests.md
│   │   └── TESTING_REPORT.md
│   │
│   └── archive/                       # 已完成的变更归档
│       └── YYYY-MM-DD-<change-name>/  # 归档的变更（带日期）
│           └── [同上结构]
│
├── specs/                             # 全局功能规范库（长期维护）
│   ├── <capability-1>/                # 系统功能能力定义
│   │   └── spec.md
│   └── <capability-2>/
│       └── spec.md
│
└── templates/                         # 文档模板
    ├── proposal-template.md
    ├── design-template.md
    └── testing-template.md
```

### 两层 specs 目录

- `openspec/specs/` - 全局功能规范库（系统能力，长期维护）
- `openspec/changes/<name>/specs/` - 变更专属规范（增量需求，随变更归档）

### AI 必须遵守的规则

1. **禁止在根目录创建开发文档**
   - ❌ `./design.md`, `./tasks.md`
   - ✅ `openspec/changes/<name>/design.md`

2. **正确选择 specs 目录**
   - 新增系统能力 → `openspec/specs/`
   - 变更增量需求 → `openspec/changes/<name>/specs/`

3. **所有文档使用中文编写**（代码标识符除外）

---

## 状态管理机制

### 状态文件规范

文件位置：`.claude/state/current-change.json`

```json
{
  "changeName": "chat-scroll-optimization",
  "currentStage": "implementation",
  "startDate": "2026-06-15",
  "lastUpdate": "2026-06-15T14:30:00Z",
  "stageProgress": {
    "explore": { "status": "completed", "completedAt": "2026-06-15T10:00:00Z" },
    "design": { "status": "completed", "selectedSolution": "react-window 虚拟滚动" },
    "planning": { "status": "completed" },
    "implementation": {
      "status": "in-progress",
      "completedTasks": [1, 2, 3],
      "currentTask": 4
    }
  },
  "keyDecisions": [
    {
      "decision": "选择 react-window 而非自研",
      "rationale": "成熟稳定，开发成本低",
      "timestamp": "2026-06-15T11:30:00Z"
    }
  ],
  "criticalContext": {
    "technicalConstraints": "必须兼容现有 MessageList",
    "performanceGoals": "初次渲染 < 100ms"
  }
}
```

### 会话初始化协议

每次会话开始时，AI 必须：

1. 检查状态文件是否存在
2. 如存在，加载并向用户汇报
3. 如不存在，等待新任务

```markdown
## 汇报格式

🔄 检测到进行中的变更：chat-scroll-optimization
📍 当前阶段：实现阶段
📊 进度：3/10 任务已完成
📅 上次更新：2026-06-15 14:30

关键决策：

- 选择 react-window 虚拟滚动方案

下一步：实现 VirtualizedList 组件

是否继续？[是/否/查看详情]
```

### 状态更新时机

- 阶段完成时：更新 `stageProgress`
- 做出决策时：追加到 `keyDecisions`
- 任务完成时：更新 `completedTasks`
- 发现重要信息时：更新 `criticalContext`

---

## 六阶段工作流

### 阶段 1：需求分析（Explore）

**目标**：理解需求，生成结构化需求文档

**AI 权限**：✅ 完全自主（只读 + 文档生成）

**执行步骤**：

1. 使用 `/openspec-explore` 启动分析
2. 搜索相关代码（限定 `src/` 目录，避免 `node_modules/`）
3. 读取关键文件，记录所有相关文件路径
4. 生成需求文档（路径由 openspec-explore 自动处理）

**必须包含**：

- 业务目标
- 技术范围（涉及的模块/组件/文件）
- 相关代码清单
- 技术约束
- 风险识别

**自我验证清单**：

- [ ] 需求文档已创建且非空
- [ ] 包含"业务目标"章节
- [ ] 包含"技术范围"章节
- [ ] 列出至少 3 个相关文件
- [ ] 识别至少 1 个风险或约束

**门禁 1**：向用户展示分析结果，等待确认后进入下一阶段

---

### 阶段 2：方案设计（Design）

**目标**：提出多种方案，经人类确认后选定

**AI 权限**：✅ 提案自主 + ⚠️ 方案选择需人类确认

**使用工具**：

- `/superpowers:brainstorming` - 必须使用，用于探索方案和讨论技术路线
- 相关领域 skills（如 `frontend-design`、`ui-ux-pro-max` 等）

**执行步骤**：

1. 使用 `/superpowers:brainstorming` 探索方案
2. 提出 2-3 种可行方案
3. 每个方案包含：优缺点、技术复杂度、预估工时
4. 给出 AI 推荐方案及理由
5. **等待人类选择**（禁止自行决定）

**方案对比格式**：

```markdown
### 方案 A：<方案名>

**优点**：✅ ...
**缺点**：⚠️ ...
**复杂度**：⭐⭐⭐ (3/5)
**工时**：2-3 天
```

**门禁 2**：

- 向用户展示所有方案和推荐
- 等待人类明确选择
- 记录决策到 `keyDecisions`

---

### 阶段 3：计划编写（Planning）

**目标**：生成设计文档、任务清单、测试计划

**AI 权限**：✅ 完全自主（文档生成）

**使用工具**：

- `/openspec-propose` - 生成变更提案和文档
- `/superpowers:writing-plans` - 辅助计划编写

**执行步骤**：

1. 使用 `/openspec-propose` 生成提案
2. 创建设计文档、任务清单、测试计划（路径由 openspec-propose 自动处理）

**design.md 必须包含**：

- 架构设计（组件结构、数据流）
- 接口设计（API、Props 定义）
- 关键实现细节
- 非功能性需求（性能指标、兼容性）

**tasks.md 格式**：

- 任务编号、描述、子任务清单
- 明确依赖关系
- 预估工作量

**自我验证清单**：

- [ ] design.md 已创建，包含架构和接口设计
- [ ] tasks.md 已创建，任务清晰可执行
- [ ] testing/ 目录已创建
- [ ] 测试文档已创建（至少 3 个 .md 文件）
- [ ] 所有文档使用中文编写

**门禁 3**：向用户展示计划，确认后进入实现阶段

---

### 阶段 4：任务执行（Implementation）

**目标**：按计划实现代码

**AI 权限**：✅ 代码编写自主 + ⚠️ 重大架构变更需确认

**使用工具**：

- `/openspec-apply-change` - 开始执行任务
- `/superpowers:test-driven-development` - 采用 TDD 方法
- `/superpowers:executing-plans` - 按计划执行
- 相关领域 skills（如 `frontend-design`、`playwright-cli` 等）

**执行步骤**：

1. 使用 `/openspec-apply-change` 开始执行
2. 按 `tasks.md` 顺序执行任务
3. 采用 TDD：先写测试，再写实现（使用 `/superpowers:test-driven-development`）
4. 每完成一个任务：
   - 运行相关测试
   - 提交 Git commit（有意义的 commit message）
   - 更新状态文件的 `completedTasks`

**代码质量要求**：

- 遵循项目代码规范
- 添加中文注释
- 处理边界情况和错误

**持续验证**：

- 每次提交前运行 `npm run lint`
- 每次提交前运行相关单元测试

**门禁 4**：重大架构变更（如修改核心接口、重构关键模块）需人类确认

---

### 阶段 5：测试验收（Verification）

**目标**：全面测试，生成测试报告

**AI 权限**：✅ 完全自主（测试执行 + 报告生成）

**使用工具**：

- `/superpowers:verification-before-completion` - 验收前的完整性检查
- `/playwright-cli` - E2E 测试
- `/code-review` - 代码审查
- `/verify` - 功能验证

**执行步骤**：

1. 运行单元测试：`npm test`
2. 检查覆盖率：`npm run test:coverage`（目标 ≥ 80%）
3. 运行集成测试：`npm run test:integration`
4. 运行 E2E 测试：使用 `/playwright-cli`
5. 代码审查：使用 `/code-review`
6. 功能验证：使用 `/verify`
7. 生成测试报告（路径由相应 skill 处理）

**自我验证清单**（强制执行）：

```markdown
## 代码质量自检报告

✅ Linter: 通过（0 errors, 0 warnings）
✅ 类型检查: 通过
✅ 单元测试: 23/23 通过
✅ 测试覆盖率: 85% (目标: ≥80%)
✅ 集成测试: 5/5 通过
✅ E2E 测试: 3/3 通过
✅ 构建: 成功
```

**验收标准**：

- 所有测试通过
- 覆盖率 ≥ 80%
- 代码审查无阻塞性问题

**门禁 5**：向用户展示测试报告，确认后进入归档阶段

---

### 阶段 6：归档总结（Archive）

**目标**：归档变更，总结经验

**AI 权限**：✅ 完全自主

**执行步骤**：

1. 确认所有任务完成
2. 使用 `/openspec-archive-change` 归档（自动处理目录移动和文档生成）
3. 更新 `CHANGELOG.md`（项目根目录）
4. 删除状态文件 `.claude/state/current-change.json`

**归档清单**：

- [ ] 所有测试通过
- [ ] 代码已合并到主分支（或等待合并）
- [ ] CHANGELOG 已更新
- [ ] 变更已归档
- [ ] 状态文件已清理

---

## 自我验证协议

### 验证原则

**原则 1：运行才能确认**

- ❌ "代码应该能工作"
- ✅ "代码已运行测试，23/23 通过"

**原则 2：生成才能确认**

- ❌ "我会生成文档"
- ✅ "已生成 design.md（127 行）"

**原则 3：读取才能确认**

- ❌ "应该已经修复"
- ✅ "已读取 src/utils.ts:45，确认已修复"

### 强制自检时机

1. **阶段完成前**：验证输出产物是否齐全
2. **代码提交前**：运行 lint 和测试
3. **宣称完成前**：运行完整测试套件

### 自检失败处理

如果自检发现问题：

1. **主动修复**：AI 自主修复 lint 错误、格式问题
2. **报告问题**：无法自动修复的问题，向用户报告
3. **禁止隐瞒**：禁止忽略失败的测试或检查

---

## 异常处理

### 中断恢复

**场景**：会话意外中断

**恢复步骤**：

1. 新会话开始时，检查状态文件
2. 读取 `lastUpdate` 和 `currentStage`
3. 向用户汇报："上次中断于 {stage}，是否继续？"
4. 根据 `currentTask` 恢复到具体位置

### 计划调整

**场景**：执行中发现计划不合理

**处理流程**：

1. **停止执行**：不要硬着头皮继续
2. **向用户报告**：说明发现的问题
3. **提出调整方案**：回退到哪个阶段、如何调整
4. **等待确认**：人类批准后再继续

### 测试失败处理

**场景**：测试阶段发现失败

**处理流程**：

1. **分析失败原因**：读取测试输出
2. **评估影响**：是否阻塞发布
3. **修复或报告**：
   - 简单问题（如 lint 错误）：AI 自主修复
   - 复杂问题（如逻辑错误）：报告并提供修复建议
4. **重新验证**：修复后重新运行测试

### Git 冲突处理

**场景**：代码合并冲突

**处理流程**：

1. **识别冲突文件**：`git status`
2. **分析冲突原因**：读取冲突标记
3. **提供解决方案**：
   - 如果明确：AI 自主解决并测试
   - 如果不明确：向用户展示冲突，请求指导
4. **验证解决**：运行测试确保功能完整

---
