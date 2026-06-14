## Context

当前项目已有一定规模（后端 115 个测试、前端 19 个测试、多个技术修复文档），但缺少系统化的开发规范。开发过程中遇到的实际问题包括：

- **环境变量管理混乱**：Claude Code 全局配置覆盖项目配置，导致 API 调用失败
- **代码风格不一致**：没有明确的格式和命名规范
- **架构理解成本高**：新功能不知道往哪添加，分层职责不清晰
- **质量标准模糊**：测试覆盖率目标不明确，代码审查没有统一清单

项目已有：
- 设计语言文档（`docs/style.md`）- 前端 UI 规范
- 技术修复记录（SSE、AI Provider 等）- 零散的问题解决经验
- 基础 README 文档 - 功能概览和快速开始

**利益相关者：**
- 当前开发者（个人项目，需要未来的自己能快速理解）
- 潜在协作者（小团队 2-5 人场景）
- 未来新人（需要快速上手指南）

**约束条件：**
- 文档必须实用，不能流于形式
- 优先级明确：质量保证 > 架构清晰 > 代码一致性 > 快速上手
- 文档需要易于维护，避免过度设计
- 必须基于实际痛点，不是生搬硬套理论

## Goals / Non-Goals

**Goals:**
1. 建立清晰的 `docs/` 目录结构，按职能分类（architecture、development、quality、workflow、guides、deployment、api）
2. 创建 15+ 个核心规范文档，覆盖测试标准、代码审查、架构设计、代码约定、Git 工作流等
3. 将现有技术修复经验（SSE、环境变量管理）提炼为可复用规范
4. 定义明确的质量门禁（覆盖率、审查清单、合并标准）
5. 提供清晰的架构图和新功能添加指南
6. 建立 ADR（架构决策记录）体系，记录技术选型理由
7. 所有文档使用 Markdown 格式，易于版本控制和阅读

**Non-Goals:**
- 不强制现有代码立即重构以符合规范（新代码遵循即可）
- 不引入过重的流程（如强制设计评审、多级审批）
- 不创建自动化工具（如 CLI 脚手架）- 专注于文档本身
- 不覆盖特定业务逻辑文档（如产品需求文档 PRD）
- 不替代代码注释（代码注释仍需在代码中）

## Decisions

### 决策 1：按职能分类的目录结构

**决策：** 采用 7 个顶层目录结构：architecture、development、quality、workflow、guides、deployment、api

**理由：**
- 按职能分类比按技术栈分类更清晰（不是 backend/ 和 frontend/ 各一套）
- 开发者可以快速定位："我要加新功能" → architecture；"我要审查代码" → quality
- 随着项目演进，可以独立扩展某个职能领域而不影响其他

**备选方案：**
- **平铺式结构**（所有文档在 docs/ 根目录）：文件过多时难以管理
- **按技术栈分类**（backend/、frontend/、shared/）：跨技术栈的规范（如 Git 工作流）难以归类
- **单一大文档**（如 CONTRIBUTING.md）：内容过长，难以维护和查找

### 决策 2：分阶段创建文档（4 个 Phase）

**决策：** 按优先级分 4 个 Phase 创建文档，不是一次性全部完成

**理由：**
- 符合用户优先级：质量保证（Phase 1）> 架构文档（Phase 2）> 代码规范（Phase 3）> 工作流程（Phase 4）
- 每个 Phase 完成后立即可用，有实际价值
- 避免"文档爆炸"，保持增量式、可持续的文档建设

**Phase 划分：**
- Phase 1（1 周）：quality/ 目录 - 4 个文档（testing-standards, code-review-checklist, quality-gates, performance-standards）+ error-handling.md
- Phase 2（2 周）：architecture/ 目录 - 6 个文档（overview, backend/frontend-architecture, database-schema, api-design-principles, tech-stack-decisions）
- Phase 3（3 周）：development/ 目录 - 6 个文档（backend/frontend-conventions, typescript-guidelines, naming-conventions, file-organization, error-handling）
- Phase 4（4 周）：workflow/ + guides/ + deployment/ + api/ - 剩余文档

### 决策 3：从实际痛点提炼规范

**决策：** 将现有技术修复文档（SSE_IMPLEMENTATION_REVIEW.md、AI_PROVIDER_GUIDE.md）的经验融入规范

**理由：**
- 这些是真实遇到的问题，规范化后可避免重复踩坑
- 示例代码和最佳实践已经验证可行
- 提高文档的实用性和可信度

**提炼映射：**
```
现有文档 → 新规范
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SSE_IMPLEMENTATION_REVIEW.md
  ├─ 环境变量优先级问题 → guides/troubleshooting.md（常见问题）
  ├─ better-sse API 使用 → development/backend-conventions.md（第三方库使用）
  └─ SSE 实现模式 → api/sse-streaming.md（SSE 最佳实践）

AI_PROVIDER_GUIDE.md
  └─ Provider 抽象模式 → architecture/backend-architecture.md（服务层设计）

STREAMING_FIX.md
  └─ 手动迭代 vs for-await-of → development/backend-conventions.md（异步编程）
```

### 决策 4：使用 Markdown + ASCII 图表

**决策：** 所有文档使用 Markdown 格式，架构图使用 ASCII art

**理由：**
- Markdown 是行业标准，所有 IDE 和 Git 平台原生支持
- ASCII 图表可直接在代码中查看，无需额外工具
- 易于版本控制，diff 友好
- 无需维护图片资源（避免图片和文档不同步）

**备选方案：**
- **Mermaid 图表**：需要渲染支持，不是所有环境都友好
- **图片（PNG/SVG）**：难以维护，二进制文件 diff 不友好
- **专业建模工具**：引入额外依赖，门槛过高

### 决策 5：质量门禁标准量化

**决策：** 明确定义覆盖率数值目标（后端 85%、前端 80%）和审查清单分级（Blocker/Major/Minor）

**理由：**
- 避免主观判断，减少争议
- CI/CD 可以自动化检查覆盖率
- 审查清单分级让审查者明确哪些是必须修复的，哪些是建议

**数值依据：**
- 后端 85% 基于当前实际覆盖率（82.7%）+ 10% 提升空间
- 前端 80% 是行业标准中等水平，平衡成本和收益

### 决策 6：ADR（架构决策记录）轻量化

**决策：** ADR 集成到 `architecture/tech-stack-decisions.md` 中，不单独每个决策一个文件

**理由：**
- 项目规模较小，单文件更易于浏览和维护
- 避免过度形式化（传统 ADR 每个决策一个文件，适合大型项目）
- 仍保留 ADR 核心价值：记录 Context、Decision、Alternatives、Consequences

**格式示例：**
```markdown
### ADR-001: 选择 SQLite 作为数据库

**Context:** 需要轻量级、本地存储的数据库方案

**Decision:** 使用 SQLite + Drizzle ORM

**Alternatives Considered:**
- PostgreSQL：需要独立服务器，部署复杂
- MongoDB：无关系型，不适合本项目的关系数据

**Consequences:**
- ✅ 优点：零配置、单文件、快速开发
- ❌ 缺点：并发写入受限、不适合高并发场景
```

### 决策 7：文档导航和索引

**决策：** 创建 `docs/README.md` 作为文档入口，更新项目根 README.md 添加文档链接

**理由：**
- 新人可以快速找到所需文档
- 避免"文档孤岛"（文档存在但没人知道）
- 保持单一入口，便于维护

**导航结构：**
```
项目 README.md
  └─ 链接到 docs/README.md

docs/README.md
  ├─ 快速导航（按优先级）
  ├─ 各目录简介
  └─ 常见任务索引（"我想做 X" → 对应文档）
```

## Risks / Trade-offs

### 风险 1：文档维护负担

**风险：** 15+ 个文档可能导致维护困难，随着代码演进文档可能过时

**缓解措施：**
- 分阶段创建，Phase 1 完成后观察维护成本
- 文档审查纳入 PR 流程：代码变更影响架构时，必须同步更新文档
- 定期审查（每季度）检查文档准确性
- 优先维护高价值文档（质量门禁、架构图），低频访问的可以滞后更新

### 风险 2：团队遵守度不高

**风险：** 规范制定了但没人遵守，流于形式

**缓解措施：**
- 从实际痛点出发，规范解决真实问题（不是为了规范而规范）
- 工具辅助：ESLint/Prettier 自动化代码风格检查
- CI/CD 强制执行：覆盖率、lint、tests 不通过无法合并
- 代码审查清单明确分级，Blocker 项必须修复

### 风险 3：过度规范化

**风险：** 规范过于严格，限制灵活性，降低开发效率

**缓解措施：**
- 区分 MUST（强制）和 SHOULD（建议）
- 允许例外情况（如紧急 hotfix 降低覆盖率要求）
- 规范是指导，不是枷锁 - 合理情况下可以偏离并记录原因
- 定期回顾规范合理性，过时的及时修订

### 风险 4：新人学习曲线陡峭

**风险：** 15+ 个文档对新人来说信息量过大，可能不知道从哪开始

**缓解措施：**
- `docs/README.md` 提供明确的学习路径：
  - 第一天：getting-started.md + local-development.md
  - 第一周：architecture/overview.md + development/code-standards.md
  - 第一月：逐步熟悉其他规范
- 常见任务索引（"我想添加 API" → 直接链接到相关章节）
- 每个文档开头有 TL;DR（Too Long; Didn't Read）摘要

### 权衡 1：全面性 vs 可维护性

**权衡：** 更多文档 = 更全面，但维护成本更高

**选择：** 分阶段创建（4 个 Phase），优先高价值文档，低频需求的文档可以延后或省略

**理由：** 项目当前阶段不需要完美的文档体系，80% 的价值来自 20% 的文档

### 权衡 2：灵活性 vs 一致性

**权衡：** 严格规范提高一致性，但可能限制创新和特殊场景处理

**选择：** 核心规范（质量门禁、架构分层）严格执行，细节规范（命名、格式）工具自动化 + code review 把关

**理由：** 质量和架构是基础，不能妥协；代码风格可以有一定灵活性

### 权衡 3：详细性 vs 可读性

**权衡：** 过于详细的文档难以阅读和查找，过于简略的文档不够实用

**选择：** 每个文档包含：
- 开头：TL;DR 摘要（3-5 句话）
- 正文：详细规范 + 示例代码
- 结尾：常见问题 FAQ

**理由：** 满足不同阅读场景：快速查阅看摘要，深入学习看正文

## Migration Plan

### 部署步骤

**Phase 1（第 1 周）- 质量保证基础：**
1. 创建 `docs/quality/` 目录
2. 编写 4 个核心文档：testing-standards.md, code-review-checklist.md, quality-gates.md, performance-standards.md
3. 编写 `development/error-handling.md`
4. 更新项目 README.md，添加"文档规范"章节链接
5. 团队评审和反馈
6. 调整 CI/CD 配置，强制执行覆盖率标准

**Phase 2（第 2 周）- 架构文档：**
1. 创建 `docs/architecture/` 目录
2. 编写架构文档（overview, backend/frontend-architecture, database-schema, api-design-principles, tech-stack-decisions）
3. 绘制系统架构图和数据流图
4. 提炼现有 AI_PROVIDER_GUIDE.md 经验到架构文档
5. 团队评审

**Phase 3（第 3 周）- 代码规范：**
1. 创建 `docs/development/` 目录
2. 编写代码约定文档（backend/frontend-conventions, typescript-guidelines, naming-conventions, file-organization）
3. 配置 ESLint/Prettier 规则与文档对齐
4. 团队评审

**Phase 4（第 4 周）- 工作流程和指南：**
1. 创建 `docs/workflow/`, `docs/guides/`, `docs/deployment/`, `docs/api/` 目录
2. 编写剩余文档
3. 提炼 SSE_IMPLEMENTATION_REVIEW.md 经验到 troubleshooting.md
4. 创建 `docs/README.md` 文档导航
5. 最终评审和发布

### 回滚策略

如果文档体系不适用或维护成本过高：
1. 保留高价值文档（quality-gates.md, architecture/overview.md）
2. 删除低频访问文档
3. 将核心规范合并到单一 CONTRIBUTING.md
4. 恢复项目 README.md 到之前版本

### 验收标准

Phase 1 完成后验收：
- [ ] 4 个 quality 文档已创建并评审
- [ ] CI/CD 强制执行覆盖率标准
- [ ] 至少 1 次 PR 使用了 code-review-checklist.md

Phase 2-4 完成后验收：
- [ ] 所有规划的文档已创建
- [ ] docs/README.md 导航完整
- [ ] 项目 README.md 已更新
- [ ] 新人可以通过文档独立完成本地开发环境搭建

## Open Questions

1. **是否需要中英双语文档？**
   - 当前所有文档均为中文
   - 如果未来有国际协作者，是否需要英文版本？
   - 建议：暂不需要，等实际需求出现再考虑

2. **文档版本控制策略？**
   - 文档更新是否需要版本号？
   - 建议：跟随项目版本，无需单独版本号；Git commit 历史即版本控制

3. **自动化文档生成？**
   - API 文档是否使用工具自动生成（如 Swagger/OpenAPI）？
   - 架构图是否使用代码生成（如 Mermaid、PlantUML）？
   - 建议：Phase 1-4 先手动编写，后续根据维护负担决定是否引入工具

4. **文档审查频率？**
   - 多久审查一次文档准确性？
   - 建议：每季度一次全面审查，每次重大架构变更时局部更新

5. **与 OpenSpec 集成？**
   - OpenSpec 已经有 specs/ 目录，是否与 docs/ 合并？
   - 建议：保持分离 - OpenSpec 管理变更规范，docs/ 管理项目通用规范
