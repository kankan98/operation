# 阶段 5：测试验收（Verification）

## 执行步骤

1. 运行单元测试：`npm test`
2. 检查覆盖率：`npm run test:coverage`（目标 ≥ 80%）
3. 运行集成测试：`npm run test:integration`
4. 运行 E2E 测试：使用 `/playwright-cli` 或 `npm run test:e2e`
5. 代码审查：使用 `/code-review`
6. 功能验证：使用 `/verify`
7. 生成测试报告：TESTING_REPORT.md

## 自我验证清单（强制）

```markdown
✅ Linter: 通过（0 errors, 0 warnings）
✅ 类型检查: 通过
✅ 单元测试: X/X 通过
✅ 测试覆盖率: X% (目标: ≥80%)
✅ 集成测试: X/X 通过
✅ E2E 测试: X/X 通过
✅ 构建: 成功
```

## 验收标准

- 所有测试通过
- 覆盖率 ≥ 80%
- 代码审查无阻塞性问题
- 功能在实际环境验证通过

## 测试失败处理

分类处理：
- **代码错误**：修复代码，重新测试
- **测试问题**：修复测试脚本
- **环境限制**：标记为"手动验证"，记录到 TESTING_REPORT.md

## 门禁 5

向用户展示测试报告，确认后进入阶段 6。

展示格式：测试执行情况（单元/集成/E2E）、问题清单、测试结论

---

📚 详细指南：主 skill 阶段 5
🎯 测试策略：[测试最佳实践](../modules/testing-best-practices.md)
📄 问题处理：[问题诊断](../references/troubleshooting.md)
