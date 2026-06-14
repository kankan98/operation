# 质量门禁

> **TL;DR**: 代码合并前必须通过：Lint 0 错误、TypeScript 编译成功、所有测试通过、覆盖率达标、至少 1 人 approve。紧急 hotfix 可降低覆盖率要求但不能跳过审查。

---

## 什么是质量门禁？

质量门禁是代码合并到主分支前必须满足的**最低质量标准**。这些标准确保：
- 代码质量稳定
- 不引入明显的 bug
- 符合团队规范
- 可以安全部署

**原则**: 主分支（main）必须始终处于可部署状态。

---

## 自动化检查（CI 强制执行）

以下检查由 CI/CD 自动运行，**必须全部通过**才能合并。

### ✅ 1. Lint 检查

```bash
# 后端
cd backend && npm run lint

# 前端
cd frontend && npm run lint
```

**要求**: 
- 0 errors
- 0 warnings

**Why**: Lint 错误通常是潜在 bug 或不符合规范的代码。

**如果失败**: 运行 `npm run lint:fix` 自动修复大部分问题。

---

### ✅ 2. TypeScript 编译

```bash
# 后端
cd backend && npm run build

# 前端
cd frontend && npm run build
```

**要求**:
- TypeScript 编译成功
- 0 type errors

**Why**: TypeScript 编译错误意味着类型不安全，可能在运行时崩溃。

**如果失败**: 修复类型错误，不要使用 `@ts-ignore` 绕过。

---

### ✅ 3. 单元测试

```bash
# 后端
cd backend && npm test

# 前端
cd frontend && npm test
```

**要求**:
- 所有测试通过（100%）
- 没有跳过的测试（`.skip()` / `.todo()`）

**Why**: 失败的测试表示功能损坏或有回归 bug。

**如果失败**: 
1. 修复代码使测试通过
2. 或者更新测试（如果是测试本身的问题）

---

### ✅ 4. 集成测试

```bash
# 后端
cd backend && npm run test:integration
```

**要求**:
- 所有集成测试通过

**Why**: 集成测试验证模块间协作，失败意味着接口不匹配或数据流问题。

---

### ✅ 5. 代码覆盖率

```bash
# 后端
cd backend && npm run test:coverage

# 前端
cd frontend && npm run test:coverage
```

**要求**:

| 项目 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|-----------|-----------|-----------|---------|
| 后端 | ≥ 85% | ≥ 75% | ≥ 85% | ≥ 85% |
| 前端 | ≥ 80% | ≥ 70% | ≥ 80% | ≥ 80% |

**Why**: 覆盖率保证代码有基本的测试保护。

**如果失败**: 为新代码添加测试。

---

### ✅ 6. 构建成功

```bash
# 后端
cd backend && npm run build

# 前端
cd frontend && npm run build
```

**要求**:
- 构建产物生成成功
- 没有构建警告（严重的）

**Why**: 构建失败意味着代码无法部署。

---

## 人工审查要求

自动化检查通过后，仍需**人工审查**。

### ✅ 1. 至少 1 人 Approve

**要求**:
- 至少 1 名团队成员 approve
- Reviewer 必须实际审查代码（不是橡皮图章）
- Reviewer 必须理解变更的影响

**例外**: 
- 微小的文档修正可以自行合并
- 紧急 hotfix 可以事后补充审查

---

### ✅ 2. 所有 Review Comments 已解决

**要求**:
- 所有 Blocker comments 必须修复
- Major comments 应该修复或有充分说明
- Minor comments 可以标记为 "Won't Fix"（需说明原因）

**如何判断"已解决"**:
- 代码已修改 + reviewer 确认
- 或者 reviewer 同意不修复

---

### ✅ 3. 代码审查清单通过

使用 [代码审查清单](./code-review-checklist.md) 检查：
- 🔴 Blocker 项：必须全部通过
- 🟡 Major 项：应该通过或有说明
- 🟢 Minor 项：建议通过

---

### ✅ 4. 架构变更已讨论

**如果 PR 包含以下变更，必须提前讨论**:
- 新增外部依赖
- 数据库 schema 变更
- API 接口变更（Breaking changes）
- 新的架构模式
- 性能敏感的变更

**讨论方式**:
- PR 描述中说明设计决策
- 或在 Issue/Discussion 中提前讨论
- 或同步会议讨论（记录在 PR 中）

---

## 合并标准总结

```
自动化检查 ✓
├─ Lint (0 errors, 0 warnings)
├─ TypeScript 编译 (0 errors)
├─ 单元测试 (100% pass)
├─ 集成测试 (100% pass)
├─ 覆盖率 (≥ 标准)
└─ 构建成功

         ↓

人工审查 ✓
├─ ≥ 1 人 Approve
├─ 所有 comments 解决
├─ 代码审查清单通过
└─ 架构变更已讨论

         ↓

     可以合并 ✅
```

**只有当以上所有条件满足时，PR 才能合并。**

---

## 紧急修复（Hotfix）例外

生产环境紧急问题可以适当放宽标准，但**不能完全跳过**。

### 允许的例外

✅ **可以放宽**:
- 覆盖率要求降低（但不能为 0，至少有基本测试）
- 快速审查（1 小时内，而不是 24 小时）
- 合并后补充完整测试（48 小时内）

❌ **不能跳过**:
- Lint 和 TypeScript 检查（必须通过）
- 基本的单元测试（核心修复逻辑必须有测试）
- Code review（至少 1 人审查，即使是快速审查）
- 记录和文档（在 PR 中说明为什么紧急、影响范围）

### Hotfix 流程

1. **创建 hotfix 分支**
   ```bash
   git checkout -b hotfix/critical-bug-fix
   ```

2. **最小化变更**
   - 只修复紧急问题
   - 不包含无关的优化或重构

3. **基本测试**
   - 至少添加一个测试验证修复
   - 手动测试验证问题已解决

4. **快速审查**
   - 标记 PR 为 `urgent`
   - 通知 reviewer 紧急审查
   - Reviewer 在 1 小时内响应

5. **合并后补救**
   - 48 小时内补充完整测试
   - 补充文档和 postmortem（如果需要）

---

## CI/CD 配置示例

### GitHub Actions

```yaml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

---

## 分支保护规则

在 GitHub/GitLab 中配置分支保护：

### main 分支保护

**必须启用**:
- [x] Require pull request reviews before merging（至少 1 人）
- [x] Require status checks to pass before merging
  - lint
  - typecheck
  - test
  - coverage
  - build
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

**可选启用**:
- [ ] Require conversation resolution before merging
- [ ] Require signed commits
- [ ] Require linear history

---

## 质量趋势监控

除了门禁检查，还应该监控质量趋势：

### 覆盖率趋势
- 每次 PR 显示覆盖率变化（+2.3% / -1.5%）
- 不允许显著降低覆盖率（> 5%）

### 测试套件健康度
- 测试运行时间趋势（> 10 分钟需要优化）
- 测试稳定性（flaky tests 需要修复）

### 技术债务
- TODO comments 数量
- `@ts-ignore` 数量
- 代码复杂度（Cyclomatic Complexity）

---

## 常见问题

### Q: 我的 PR 因为覆盖率差 0.1% 不能合并，合理吗？

**A**: 合理。原因：
1. 标准必须一致执行，否则形同虚设
2. 差 0.1% 意味着只需再加 1-2 个测试
3. 允许例外会导致标准逐渐降低

**解决方案**: 为未覆盖的代码添加测试。通常 5-10 分钟就能解决。

### Q: 测试在本地通过，CI 失败怎么办？

**A**: 常见原因：
1. **环境差异**: 本地是 Mac，CI 是 Linux
2. **时区差异**: 测试依赖本地时区
3. **并行执行**: CI 并行运行导致竞态条件
4. **依赖版本**: package-lock.json 不一致

**调试方法**:
1. 查看 CI 日志，找到具体失败的测试
2. 在本地用相同环境重现（Docker）
3. 修复环境相关问题（使用 UTC 时间、避免竞态）

### Q: Reviewer 太忙，PR 等了 3 天怎么办？

**A**: 
1. **礼貌提醒**: 在 PR 中 @ reviewer
2. **寻找替代**: 请其他人 review
3. **升级**: 如果确实紧急，找 Tech Lead

**长期方案**: 
- 团队建立 Code Review SLA（24 小时首次响应）
- 轮流担任 "Reviewer on Duty"

### Q: 我不同意 Reviewer 的意见，怎么办？

**A**: 
1. **充分沟通**: 解释你的观点和理由
2. **寻求第三方意见**: Tech Lead 或其他资深开发者
3. **区分重要性**:
   - Blocker 级别：必须达成共识
   - Major/Minor：可以适当妥协

**记住**: Code Review 的目的是提高代码质量，不是权力斗争。

### Q: 实验性功能可以降低标准吗？

**A**: **部分可以**:
- ✅ 可以容忍不完美的架构（快速迭代）
- ✅ 可以暂时降低覆盖率要求（但不能为 0）
- ❌ 仍然要通过 Lint、TypeScript、基本测试
- ❌ 仍然要经过 Code Review

**但是**: 明确标记实验性代码，并在稳定后补齐质量标准。

---

## 持续改进

质量门禁不是一成不变的，应该定期回顾和调整：

### 每季度回顾
- 门禁标准是否合理？过严或过松？
- 哪些检查最常失败？需要工具支持？
- 团队反馈如何？

### 指标驱动
- 监控 bug 率：门禁是否真的减少了 bug？
- 监控合并延迟：门禁是否影响了效率？
- 监控覆盖率趋势：是否在提升？

### 工具升级
- 引入新的 Linter 规则
- 升级 TypeScript 版本（strict 模式）
- 引入性能测试

---

## 参考资源

- [测试标准](./testing-standards.md)
- [代码审查清单](./code-review-checklist.md)
- [CI/CD 配置指南](../deployment/deployment-guide.md)
- [GitHub 分支保护文档](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
