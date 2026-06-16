# Claude Code 项目指南

## 文件扫描规则

### 避免扫描的目录和文件

在分析代码、搜索文件或执行任何扫描操作时，**不要扫描以下目录和文件**：

- `node_modules/` - 依赖包目录，包含大量第三方代码
- `dist/` - 构建输出目录
- `build/` - 构建输出目录
- `.next/` - Next.js 构建缓存
- `coverage/` - 测试覆盖率报告
- `*.log` - 日志文件
- `package-lock.json` - 依赖锁定文件（通常很大）
- `yarn.lock` - Yarn 依赖锁定文件
- `pnpm-lock.yaml` - pnpm 依赖锁定文件

### 原因

依赖包和构建产物包含大量自动生成的代码，扫描它们会：
- 浪费大量 token 和时间
- 产生无关的搜索结果
- 降低工作效率
- 可能触发 token 限制

### 正确做法

- 使用 `Grep` 工具时，通过 `glob` 参数限制搜索范围到源代码目录
- 使用 `Glob` 工具时，指定具体的源代码路径（如 `src/**/*.ts`）
- 优先搜索项目的核心代码目录：`frontend/src/`, `backend/src/` 等

## 项目结构

本项目包含前端和后端：

- `frontend/` - React + TypeScript 前端应用
- `backend/` - 后端 API 服务
- `openspec/` - OpenSpec 变更管理文档

## 语言使用规范

### 中文优先原则

在本项目的开发过程中，所有**面向开发者和用户的内容**应使用**中文**编写，以确保团队协作效率和用户体验质量。

### 应使用中文的内容

1. **文档类**
   - 需求文档、设计文档、架构文档
   - README.md、CHANGELOG.md 等项目文档
   - OpenSpec 变更提案、设计文档、任务列表
   - 代码审查报告、测试报告
   - API 文档中的描述性内容

2. **代码注释**
   - 函数和类的说明注释
   - 复杂逻辑的解释性注释
   - TODO、FIXME 等标记注释

3. **用户界面**
   - 所有 UI 文本（按钮、标签、提示信息等）
   - 错误提示和警告信息
   - 帮助文档和工具提示

4. **交互和沟通**
   - Git commit 消息
   - PR（Pull Request）标题和描述
   - Issue 标题和内容
   - 团队协作中的讨论和评论

### 应使用英文的内容

为保持代码规范和国际化兼容，以下内容应使用**英文**：

1. **代码标识符**
   - 变量名、函数名、类名
   - 文件名和目录名
   - API 路径和接口名称

2. **技术关键词**
   - 技术栈名称（React、TypeScript、Node.js 等）
   - 库和框架的 API 调用
   - 配置文件中的键名

### 示例

**正确示例：**

```typescript
// 获取用户信息并验证权限
async function getUserInfo(userId: string): Promise<UserInfo> {
  // 先检查缓存，避免重复请求
  const cached = await cache.get(`user:${userId}`);
  if (cached) return cached;
  
  // 从数据库获取最新数据
  const user = await db.users.findById(userId);
  return user;
}
```

```markdown
## 功能说明

这个功能用于实现用户认证和授权管理。

### 主要特性

- 支持多种登录方式
- 细粒度的权限控制
```

**Git commit 示例：**

```bash
feat: 添加用户权限管理功能

- 实现基于角色的访问控制（RBAC）
- 添加权限检查中间件
- 完善权限相关的单元测试
```

### 原因

- **提高协作效率**：团队成员主要使用中文沟通，中文文档降低理解成本
- **改善用户体验**：面向中文用户的产品，中文界面更友好
- **保持代码规范**：英文命名符合编程惯例，便于国际化和维护
- **文档易读性**：中文表达更准确、更易理解复杂的业务逻辑

## AI 开发工作流

本项目使用标准化的 AI 开发工作流规范，由 **`/ai-workflow`** skill 定义。

### 适用场景

- ✅ 新功能开发
- ✅ 重构和优化
- ✅ 中大型 Bug 修复
- ✅ 架构调整

### 工作流概览

```
需求分析 → 方案设计 → 计划编写 → 任务执行 → 测试验收 → 归档总结
   ↓          ↓          ↓          ↓          ↓          ↓
explore   brainstorm   propose     apply     verify    archive
```

### 核心原则

1. **Never Say "Done" Without Verification** - 所有断言必须附带验证证据
2. **State-First Protocol** - 支持跨会话开发，状态持久化
3. **Explicit Approval for Key Decisions** - 技术选型和方案选择需人类确认

### 使用方法

AI 在执行开发任务时会自动遵循此工作流。详细规范请参考：`/ai-workflow` skill

---

完整的工作流规范已从本文档移至独立的 skill，保持 CLAUDE.md 简洁清晰。

