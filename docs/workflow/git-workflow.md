# Git 工作流

> **TL;DR**: 使用 feature/bugfix/hotfix 分支开发，main 分支受保护。提交消息遵循 Conventional Commits（feat/fix/docs 等前缀）。PR 合并前必须通过 CI 和 Code Review。

---

## 分支策略

### 分支类型

| 分支类型 | 命名规则 | 用途 | 示例 |
|---------|---------|------|------|
| `main` | `main` | 主分支，始终可部署 | `main` |
| `feature/*` | `feature/描述` | 新功能开发 | `feature/add-categories` |
| `bugfix/*` | `bugfix/描述` | Bug 修复 | `bugfix/fix-price-display` |
| `hotfix/*` | `hotfix/描述` | 紧急生产修复 | `hotfix/critical-crash` |

### 分支保护

**main 分支规则**:
- ❌ 禁止直接 push
- ✅ 必须通过 PR 合并
- ✅ 必须通过所有 CI 检查
- ✅ 必须至少 1 人 approve

---

## 提交消息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(products): add category filter` |
| `fix` | Bug 修复 | `fix(alerts): resolve trigger condition bug` |
| `docs` | 文档变更 | `docs(readme): update installation steps` |
| `style` | 代码格式（不影响逻辑） | `style: format with prettier` |
| `refactor` | 重构（不是新功能也不是 bug 修复） | `refactor(services): simplify alert logic` |
| `test` | 添加或修改测试 | `test(products): add integration tests` |
| `chore` | 构建/工具变更 | `chore: update dependencies` |
| `perf` | 性能优化 | `perf(db): add index to products table` |

### 示例

```bash
feat(chat): add streaming response support

- Implement SSE endpoint for chat streaming
- Add better-sse library
- Handle client disconnection gracefully

Closes #123
```

### Breaking Changes

```bash
feat(api)!: change product response format

BREAKING CHANGE: The product API now returns `priceInCents` instead of `price`.
Migration: Multiply existing price values by 100.
```

---

## 工作流程

### 开发新功能

```bash
# 1. 确保 main 是最新的
git checkout main
git pull origin main

# 2. 创建 feature 分支
git checkout -b feature/add-categories

# 3. 开发和提交
git add .
git commit -m "feat(categories): add category management API"

# 4. 推送到远程
git push -u origin feature/add-categories

# 5. 创建 PR（使用 GitHub CLI）
gh pr create --title "feat(categories): add category management" \
  --body "Implements category CRUD operations"

# 6. 等待 Review 和 CI 通过

# 7. 合并后删除分支
git branch -d feature/add-categories
```

### 修复 Bug

```bash
git checkout -b bugfix/fix-price-calculation
# 修复代码
git commit -m "fix(products): correct price calculation for discounts"
git push -u origin bugfix/fix-price-calculation
gh pr create
```

### 紧急 Hotfix

```bash
git checkout -b hotfix/critical-crash
# 最小化修复
git commit -m "fix: prevent null pointer in price display"
git push -u origin hotfix/critical-crash
gh pr create --label urgent
```

---

## 常见操作

### 同步 main 到 feature 分支

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/main
# 如果有冲突，解决后：
git rebase --continue
git push --force-with-lease
```

### 修改最后一次提交

```bash
# 修改提交消息
git commit --amend -m "feat(products): add filtering (fix typo)"

# 添加遗漏的文件
git add forgotten-file.ts
git commit --amend --no-edit
```

### 撤销本地更改

```bash
# 撤销未 staged 的更改
git checkout -- file.ts

# 撤销已 staged 的更改
git reset HEAD file.ts

# 重置到远程状态
git fetch origin
git reset --hard origin/main
```

---

## PR 最佳实践

1. **小而聚焦**: 每个 PR 只做一件事
2. **清晰标题**: 使用 Conventional Commits 格式
3. **完整描述**: 说明改了什么、为什么改、如何测试
4. **自我审查**: 提交前自己先 review 一遍
5. **及时响应**: 24 小时内回复 review comments

详见 [PR 审查流程](./pr-process.md)
