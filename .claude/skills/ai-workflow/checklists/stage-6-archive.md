# 阶段 6：归档总结（Archive）

## 执行步骤

1. 确认所有任务完成
2. 使用 `/openspec-archive-change <change-name>` 归档
3. 更新 CHANGELOG.md（项目根目录）
4. 删除状态文件 `.claude/state/current-change.json`

## 归档清单

- [ ] 所有测试通过
- [ ] 代码已合并到主分支（或等待合并）
- [ ] CHANGELOG.md 已更新
- [ ] 变更已归档到 `openspec/changes/archive/YYYY-MM-DD-<name>/`
- [ ] 状态文件已清理

## 归档自动处理

`/openspec-archive-change` 会自动：
- 移动变更目录到 archive/ 并添加日期前缀
- 生成变更总结文档
- 备份状态文件到归档目录
- 清理工作状态

## CHANGELOG.md 更新格式

```markdown
## [YYYY-MM-DD] - <变更名称>

### Added
- 新功能 1
- 新功能 2

### Changed
- 修改 1

### Fixed
- Bug 修复 1
```

## 完成标志

当所有归档清单项都完成时，开发流程结束。

---

📚 详细指南：主 skill 阶段 6
📄 文档规范：[文档产物管理](../references/document-management.md)
