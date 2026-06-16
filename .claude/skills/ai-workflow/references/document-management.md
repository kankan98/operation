# 文档产物管理

> OpenSpec 文档组织规范和管理规则

---

## 目录结构

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

---

## 两层 specs 目录

### `openspec/specs/` - 全局功能规范库

**用途**：定义系统的长期能力和功能模块

**特点**：
- 长期维护，不随变更归档
- 描述系统"能做什么"
- 跨多个变更复用

**示例**：
```
openspec/specs/
├── user-authentication/
│   └── spec.md           # 用户认证能力规范
├── payment-processing/
│   └── spec.md           # 支付处理能力规范
└── data-export/
    └── spec.md           # 数据导出能力规范
```

### `openspec/changes/<name>/specs/` - 变更专属规范

**用途**：描述本次变更的增量需求和特定规范

**特点**：
- 随变更归档
- 描述"本次要做什么"
- 可以引用全局 specs

**示例**：
```
openspec/changes/add-oauth-login/specs/
├── oauth-providers/
│   └── spec.md           # 本次支持的 OAuth 提供商
└── user-profile-enhancement/
    └── spec.md           # 本次增强的用户资料字段
```

---

## AI 必须遵守的规则

### 规则 1：禁止在根目录创建开发文档

❌ **错误**：`./design.md`, `./tasks.md`, `./test-plan.md`

✅ **正确**：`openspec/changes/<name>/design.md`

### 规则 2：正确选择 specs 目录

**决策树**：

```
需要创建功能规范？
    ↓
这是长期的系统能力？
    ├─ 是 → openspec/specs/<capability>/spec.md
    └─ 否 → openspec/changes/<name>/specs/<feature>/spec.md
```

**判断标准**：

| 问题 | 是 → 全局 | 否 → 变更 |
|------|-----------|----------|
| 会在多个变更中使用？ | ✅ | ❌ |
| 会长期维护和更新？ | ✅ | ❌ |
| 是系统的核心能力定义？ | ✅ | ❌ |
| 是本次变更的临时性需求？ | ❌ | ✅ |

### 规则 3：所有文档使用中文编写

**中文内容**：标题、章节、正文、注释、Git commit

**英文内容**：代码标识符、文件名、技术术语（可选）、URL

---

## 标准文档模板

### proposal.md（需求分析）

```markdown
# {变更名称} - 需求分析

## 业务目标
[描述业务价值]

## 技术范围
### 涉及的模块/组件
### 相关文件清单

## 技术约束
## 风险识别
```

### design.md（设计文档）

```markdown
# {变更名称} - 设计文档

## 架构设计
### 系统架构图
### 组件结构
### 数据流

## 接口设计
### API 接口
### 组件 Props

## 关键实现细节
## 非功能性需求
```

### tasks.md（任务清单）

```markdown
# {变更名称} - 任务清单

## 任务概览
## 任务列表

### 任务 1：{标题}
- [ ] 子任务 1
- [ ] 子任务 2

**预估时间**：2 小时
**依赖**：无
**验收标准**：...
```

### testing/README.md（测试总览）

```markdown
# {变更名称} - 测试文档

## 测试策略
### 测试层次
### 测试优先级

## 测试文档索引
- [单元测试计划](./unit-tests.md)
- [集成测试计划](./integration-tests.md)
- [E2E 测试计划](./e2e-tests.md)

## 测试执行
## 验收标准
```

---

## 文档生命周期

### 创建阶段（Stage 1-3）

```
阶段 1: 需求分析 → 创建 proposal.md
阶段 2: 方案设计 → 创建 design.md（初稿）
阶段 3: 计划编写 → 创建 tasks.md, testing/*, specs/*
                   更新 design.md（完善）
```

### 实施阶段（Stage 4）

```
任务执行过程 → 更新 tasks.md（标记完成状态）
             创建实际测试文件（*.test.ts）
```

### 验收阶段（Stage 5）

```
测试和验收 → 创建 TESTING_REPORT.md
           更新 tasks.md（最终状态）
```

### 归档阶段（Stage 6）

```
归档变更 → 移动到 openspec/changes/archive/YYYY-MM-DD-<name>/
         创建 CHANGELOG.md 条目（项目根目录）
```

---

## 文档质量标准

### 完整性检查

**阶段 1 完成**：
- [ ] proposal.md 存在且非空
- [ ] 包含业务目标章节
- [ ] 包含技术范围章节
- [ ] 列出至少 3 个相关文件

**阶段 3 完成**：
- [ ] design.md 包含架构设计
- [ ] design.md 包含接口设计
- [ ] tasks.md 包含任务清单
- [ ] testing/ 目录存在
- [ ] 至少 3 个测试文档

**阶段 5 完成**：
- [ ] TESTING_REPORT.md 存在
- [ ] 包含测试结果统计
- [ ] 包含问题清单（如有）

### 可读性标准

- 清晰的标题层次（使用 Markdown 标题）
- 适当的格式（列表、表格、代码块）
- 中文为主
- 示例丰富

### 可追溯性标准

- 决策有依据
- 任务有编号
- 文件有链接

---

## 常见问题

**Q: API 文档放哪里？**

A: 
- 全局 API 规范（REST 风格指南）→ `openspec/specs/api-guidelines/`
- 本次新增的 API 端点 → `openspec/changes/<name>/design.md` 的"接口设计"章节

**Q: 测试文件（.test.ts）放哪里？**

A:
- 测试代码：`src/**/*.test.ts`（随源代码）
- 测试文档：`openspec/changes/<name>/testing/*.md`（测试计划）

**Q: 可以创建其他文件吗？**

A: 可以，标准结构 + 自定义文档（如 IMPLEMENTATION_NOTES.md, DECISIONS.md）

**Q: 归档后的文档还能修改吗？**

A: 可以，但应优先创建新变更。如必须修改，添加修改记录。
