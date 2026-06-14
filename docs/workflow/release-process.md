# 发布流程

> **TL;DR**: 语义化版本（MAJOR.MINOR.PATCH）。更新 CHANGELOG → 创建 Git Tag → 部署生产。

## 版本号规则

- **MAJOR**: 破坏性变更
- **MINOR**: 新功能（向后兼容）
- **PATCH**: Bug 修复

## 发布步骤

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 更新 CHANGELOG.md

# 3. 提交并打标签
git add .
git commit -m "chore: release v1.2.3"
git tag v1.2.3

# 4. 推送
git push origin main --tags
```
