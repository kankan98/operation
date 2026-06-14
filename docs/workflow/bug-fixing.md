# Bug 修复流程

> **TL;DR**: 重现 Bug → 写回归测试 → 修复代码 → 验证测试通过 → 提交 PR。提交消息用 fix(scope): description。

## 修复流程

1. **重现 Bug** - 确认复现步骤
2. **编写回归测试** - 先写失败的测试
3. **修复代码** - 让测试通过
4. **验证测试** - npm test
5. **提交 PR** - fix(scope): description

## Bug 报告模板

```markdown
**描述**: 问题描述

**重现步骤**:
1. 步骤 1
2. 步骤 2

**预期**: 预期行为
**实际**: 实际行为
```

详见 [测试标准](../quality/testing-standards.md)
