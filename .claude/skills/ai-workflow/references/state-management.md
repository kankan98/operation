# 状态管理机制

> AI 工作流的状态持久化和跨会话恢复

---

## 状态文件规范

**文件位置**：`.claude/state/current-change.json`

### 标准格式

```json
{
  "changeName": "chat-scroll-optimization",
  "currentStage": "implementation",
  "startDate": "2026-06-15",
  "lastUpdate": "2026-06-15T14:30:00Z",
  "stageProgress": {
    "explore": { 
      "status": "completed", 
      "completedAt": "2026-06-15T10:00:00Z" 
    },
    "design": { 
      "status": "completed", 
      "selectedSolution": "react-window 虚拟滚动" 
    },
    "planning": { 
      "status": "completed" 
    },
    "implementation": {
      "status": "in-progress",
      "completedTasks": [1, 2, 3],
      "currentTask": 4,
      "lastAction": "Completed task 3: Update ScrollButton positioning",
      "nextSuggestedAction": "继续任务 4: Verify button centering"
    }
  },
  "keyDecisions": [
    {
      "decision": "选择 react-window 而非自研",
      "rationale": "成熟稳定，开发成本低",
      "timestamp": "2026-06-15T11:30:00Z"
    }
  ],
  "criticalContext": {
    "technicalConstraints": "必须兼容现有 MessageList",
    "performanceGoals": "初次渲染 < 100ms"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `changeName` | string | 变更名称（kebab-case） |
| `currentStage` | string | 当前阶段：explore/design/planning/implementation/verification/archive |
| `startDate` | string | 开始日期（YYYY-MM-DD） |
| `lastUpdate` | string | 最后更新时间（ISO 8601） |
| `stageProgress` | object | 各阶段进度详情 |
| `keyDecisions` | array | 关键决策记录（带时间戳） |
| `criticalContext` | object | 重要上下文信息 |

---

## 会话初始化协议

每次会话开始时，AI **必须**执行：

### 1. 检查状态文件

```javascript
if (exists('.claude/state/current-change.json')) {
  state = loadState();
  reportToUser(state);
  awaitConfirmation();
} else {
  waitForNewTask();
}
```

### 2. 向用户汇报

```markdown
🔄 检测到进行中的变更：{changeName}

📍 当前阶段：{currentStage}
📊 进度：{completedTasks}/{totalTasks} 任务已完成
📅 上次更新：{lastUpdate}

🎯 上次完成：
- {lastAction}

🔜 建议下一步：
- {nextSuggestedAction}

关键决策：
{keyDecisions.map(d => `- ${d.decision}`).join('\n')}

是否继续？[是/修改计划/查看详情]
```

### 3. 等待用户确认

- **"是"** → 继续执行
- **"修改计划"** → 进入计划调整流程
- **"查看详情"** → 显示完整状态信息
- **"重新开始"** → 备份当前状态，清除并开始新任务

---

## 状态更新时机

### 阶段完成时

```json
{
  "stageProgress": {
    "explore": {
      "status": "completed",
      "completedAt": "2026-06-15T10:00:00Z"
    }
  }
}
```

### 做出关键决策时

```json
{
  "keyDecisions": [
    {
      "decision": "选择方案 A：使用 Puppeteer",
      "rationale": "项目已安装，团队熟悉",
      "alternatives": ["Playwright", "Cypress"],
      "timestamp": "2026-06-15T11:30:00Z"
    }
  ]
}
```

### 任务完成时

```json
{
  "stageProgress": {
    "implementation": {
      "status": "in-progress",
      "completedTasks": [1, 2, 3, 4],
      "currentTask": 5,
      "lastAction": "Completed task 4: Implement auto-scroll logic",
      "lastActionTimestamp": "2026-06-15T14:30:00Z",
      "nextSuggestedAction": "任务 5: Add mobile keyboard adaptation"
    }
  }
}
```

---

## 跨会话恢复协议

### 恢复时的详细汇报

```markdown
🔄 检测到进行中的变更：chat-scroll-experience-optimization

📍 当前阶段：实现阶段（Implementation）
📊 进度：15/49 任务已完成（31%）
📅 上次操作：2026-06-16 10:30
⏱️  距今：2 小时 15 分钟

🎯 上次完成：
- 任务 15：更新 ScrollButton 定位样式
- 任务 14：实现新消息徽章优化逻辑
- 任务 13：添加移动端键盘适配

🔜 建议下一步：
- 任务 16：在桌面端验证按钮居中对齐

关键决策：
- 使用双阈值滞后滚动算法（200px/120px）
- 选择 Puppeteer 而非 Playwright

技术约束：
- 必须兼容现有 useScrollControl hook
- 性能目标：滚动事件处理 ≤16.67ms

是否继续？[是/修改计划/查看详情]
```

---

## 状态文件维护

### 清理时机

- **正常完成时**：阶段 6 完成后删除，归档前备份到 `openspec/changes/archive/{date}-{name}/state-snapshot.json`
- **手动清理时**：`rm .claude/state/current-change.json`

### 备份建议

在以下情况备份：
- 进入新阶段之前
- 做出重大决策之前
- 长时间中断之前

```bash
cp .claude/state/current-change.json \
   .claude/state/backup-$(date +%Y%m%d-%H%M%S).json
```

---

## 最佳实践

1. **频繁更新** - 每完成小里程碑就更新
2. **详细记录决策** - 包含决策内容、理由、被否决的方案、时间
3. **保持上下文新鲜** - 持续更新 criticalContext，删除过时信息
4. **问题跟踪** - 记录未解决的问题（问题描述、严重程度、影响、临时方案）
