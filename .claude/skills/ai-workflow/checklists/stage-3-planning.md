# 阶段 3：计划编写（Planning）

## 执行步骤

1. 使用 `/openspec-propose <change-name>` 生成提案
2. 使用 `/superpowers:writing-plans` 辅助计划编写
3. 编写设计文档（design.md）
4. 创建任务清单（tasks.md）
5. 创建测试文档（testing/ 目录）

## design.md 必须包含

- 架构设计（组件结构、数据流）
- 接口设计（API、Props 定义）
- 关键实现细节
- 非功能性需求（性能指标、兼容性）

## tasks.md 格式

- 任务编号、描述、子任务清单
- 明确依赖关系
- 预估工作量（每个任务 1-4 小时最佳）
- 验收标准

## testing/ 目录结构

- README.md（测试总览）
- unit-tests.md（单元测试计划）
- integration-tests.md（集成测试计划）
- e2e-tests.md（E2E 测试计划）

## 自我验证清单

- [ ] design.md 已创建，包含架构和接口设计
- [ ] tasks.md 已创建，任务清晰可执行
- [ ] testing/ 目录已创建
- [ ] 测试文档已创建（至少 3 个 .md 文件）
- [ ] 所有文档使用中文编写

## 门禁 3

向用户展示计划，确认后进入阶段 4。

展示格式：设计概览、任务概览（总数、工时、分组）、测试策略

---

📚 详细指南：主 skill 阶段 3
📄 文档规范：[文档产物管理](../references/document-management.md)
