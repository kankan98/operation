# ESLint 开发流程集成

本项目已将 ESLint 检测集成到开发流程中，确保代码质量和一致性。

## 功能

### 1. **Pre-commit Hook**
- 使用 Husky + lint-staged 在每次 `git commit` 前自动运行 ESLint
- 只检查暂存的文件（staged files），提高检测速度
- 如果有 ESLint 错误，提交会被阻止，必须修复后才能提交

### 2. **自动修复**
- pre-commit hook 会自动运行 `eslint --fix` 尝试修复可自动修复的问题
- 无法自动修复的问题需要手动修复

### 3. **前端和后端分别配置**
- **Frontend**: `frontend/eslint.config.js` - 使用 React/TypeScript 规则
- **Backend**: `backend/eslint.config.mjs` - 使用 Node.js/TypeScript 规则

## 使用方法

### 手动运行 ESLint

```bash
# 检查 Frontend 代码
cd frontend
pnpm lint

# 检查 Backend 代码
cd backend
pnpm lint

# 自动修复问题
cd frontend
pnpm run lint:fix  # 如果配置了这个脚本

cd backend
pnpm run lint:fix
```

### Git Commit 流程

1. 正常提交代码：
```bash
git add .
git commit -m "feat: add new feature"
```

2. 如果有 ESLint 错误：
   - Hook 会显示错误信息
   - 修复代码中的问题
   - 重新执行 `git add` 和 `git commit`

### 跳过 Pre-commit Hook（不推荐）

在紧急情况下可以跳过 hook：
```bash
git commit --no-verify -m "message"
```

⚠️ **注意**: 仅在紧急情况下使用，这会绕过代码质量检查。

## 配置说明

### Husky
- 配置文件：`.husky/pre-commit`
- Git hooks 存储在 `.husky/` 目录

### lint-staged
- 配置在根目录 `package.json` 的 `lint-staged` 字段
- 当前配置：
  - `frontend/**/*.{ts,tsx}`: 运行 frontend ESLint
  - `backend/src/**/*.{js,ts}`: 运行 backend ESLint

### ESLint 规则

#### Backend 规则亮点
- 排除 `coverage`、`tests` 目录
- 只检查 `src/**/*.{js,ts}` 文件
- `@typescript-eslint/no-explicit-any`: 警告（允许但会提示）
- 允许以 `_` 开头的未使用变量和参数

#### Frontend 规则
- 使用 React Hooks 和 React Refresh 插件
- TypeScript 严格检查
- 浏览器环境全局变量

## 故障排除

### Hook 不执行
```bash
# 检查 Git hooks 路径
git config core.hooksPath

# 应该输出: .husky
# 如果不是，运行：
git config core.hooksPath .husky
```

### ESLint 找不到
确保在对应目录安装了依赖：
```bash
cd frontend && pnpm install
cd backend && pnpm install
```

### 大量 ESLint 错误
可以先运行自动修复：
```bash
cd backend
pnpm exec eslint src --fix
```

然后手动修复剩余问题。

## 项目结构

```
.
├── .husky/
│   └── pre-commit          # Git pre-commit hook
├── backend/
│   ├── eslint.config.mjs   # Backend ESLint 配置
│   └── package.json        # 包含 lint 脚本
├── frontend/
│   ├── eslint.config.js    # Frontend ESLint 配置
│   └── package.json        # 包含 lint 脚本
└── package.json            # 根配置（husky + lint-staged）
```

## 最佳实践

1. **提交前本地检查**: 养成在提交前运行 `pnpm lint` 的习惯
2. **渐进式修复**: 对于现有的 ESLint 错误，可以逐步修复，不必一次性全部解决
3. **理解规则**: 遇到 ESLint 错误时，理解为什么会报错，而不是简单地禁用规则
4. **团队一致性**: 团队成员都应该使用相同的 ESLint 配置
