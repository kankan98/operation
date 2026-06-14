# 功能开发流程

> **TL;DR**: TDD 流程 - 先写测试 → 实现功能 → 重构。每个 PR 聚焦单一功能，通过所有检查和审查才能合并。

## 开发流程

1. **需求明确** - 理解要做什么
2. **创建分支** - `git checkout -b feature/xxx`
3. **编写测试** - 先写失败的测试
4. **实现功能** - 让测试通过
5. **重构代码** - 保持测试通过
6. **提交 PR** - 通过 CI 和 Code Review
7. **合并部署** - 删除分支

详见 [TDD 规范](https://github.com/testdouble/contributing-tests/wiki/Test-Driven-Development)
