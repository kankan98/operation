# 阶段 4：任务执行（Implementation）

## 执行步骤

1. 使用 `/openspec-apply-change <change-name>` 开始执行
2. 使用 `/superpowers:executing-plans` 按计划执行
3. 按 tasks.md 顺序执行任务（一次一个）
4. 采用 TDD：先写测试，再写实现（建议使用 `/superpowers:test-driven-development`）
5. 每完成一个任务：
   - 运行相关测试
   - 运行 lint 检查
   - 提交 Git commit（有意义的 commit message，使用中文）
   - 更新 tasks.md 标记完成
   - 更新状态文件 completedTasks

## 代码质量要求

- 遵循项目代码规范（ESLint/Prettier）
- 添加中文注释（函数、类、复杂逻辑）
- 处理边界情况和错误

## 持续验证

每次提交前运行：
- `npm run lint`
- `npm test`（相关单元测试）
- `npm run type-check`（如适用）

## Git Commit 格式

```
<type>(<scope>): <subject>

<body>

任务：#<task-id>
```

type: feat/fix/refactor/test/docs/style/perf

## 门禁 4

重大架构变更需人类确认：
- 修改核心接口
- 重构关键模块
- 改变数据流
- 引入新依赖（未在设计阶段确定）

---

📚 详细指南：主 skill 阶段 4
🚀 实施策略：[实施策略模块](../modules/implementation-strategies.md)
