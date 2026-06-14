# Git Hooks 配置 - ESLint 自动校验

## 配置完成

已成功配置 Git pre-commit hook，在提交代码前自动运行 ESLint 校验。

---

## 工具栈

| 工具 | 版本 | 作用 |
|------|------|------|
| **husky** | 9.1.7 | Git hooks 管理工具 |
| **lint-staged** | 17.0.7 | 只对 staged 文件运行 linter |

---

## 工作流程

```
1. git add <files>
   ↓
2. git commit -m "message"
   ↓
3. husky 触发 pre-commit hook
   ↓
4. lint-staged 检查 staged 文件
   ↓
5. ESLint 校验 .ts/.tsx 文件
   ↓
6. 自动修复可修复的问题
   ↓
7a. ✅ 通过 → 允许提交
7b. ❌ 失败 → 阻止提交，显示错误
```

---

## 配置文件

### 1. `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for frontend
cd frontend && npx lint-staged
```

**作用：**
- Git commit 前自动执行
- 切换到 frontend 目录
- 运行 lint-staged

---

### 2. `frontend/package.json`

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^17.0.7"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix"
    ]
  }
}
```

**配置说明：**

- **prepare script**: npm install 后自动运行，设置 husky
- **lint-staged**: 只对 staged 的 .ts/.tsx 文件运行 ESLint
- **eslint --fix**: 自动修复可修复的问题

---

## 使用示例

### 场景 1: 代码通过校验

```bash
$ git add frontend/src/components/chat/MessageBubble.tsx
$ git commit -m "feat: add avatar to messages"

✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...

[main abc1234] feat: add avatar to messages
 1 file changed, 10 insertions(+), 2 deletions(-)
```

---

### 场景 2: 代码有 ESLint 错误

```bash
$ git add frontend/src/components/chat/MessageBubble.tsx
$ git commit -m "fix: update styles"

✔ Preparing lint-staged...
❯ Running tasks for staged files...
  ❯ frontend/package.json — 1 file
    ✖ eslint --fix [FAILED]
↓ Skipped because of errors from tasks.
✔ Reverting to original state because of errors...
✔ Cleaning up temporary files...

✖ eslint --fix:

/d/学习/AI运营/frontend/src/components/chat/MessageBubble.tsx
  45:7  error  'unused' is defined but never used  @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)

husky - pre-commit script failed (code 1)
```

**提交被阻止，需要修复错误后重新提交。**

---

## 手动运行 Lint

### 检查所有文件
```bash
cd frontend
npm run lint
```

### 自动修复所有文件
```bash
cd frontend
npm run lint:fix
```

### 只检查 staged 文件
```bash
cd frontend
npx lint-staged
```

---

## 跳过 Hook（不推荐）

在特殊情况下可以跳过 pre-commit hook：

```bash
git commit -m "message" --no-verify
```

⚠️ **警告**: 只在紧急情况下使用，会跳过所有校验。

---

## ESLint 规则

当前配置的 ESLint 规则（`frontend/eslint.config.js`）：

```js
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
```

---

## 常见问题

### Q1: Hook 没有执行？

**解决方案：**
```bash
# 重新初始化 husky
cd frontend
npm run prepare
```

---

### Q2: lint-staged 找不到？

**解决方案：**
```bash
# 重新安装依赖
cd frontend
npm install
```

---

### Q3: ESLint 报错太多？

**解决方案：**
```bash
# 批量自动修复
cd frontend
npm run lint:fix

# 检查剩余问题
npm run lint
```

---

### Q4: 想临时禁用某个规则？

在文件顶部添加：
```tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
```

在代码行添加：
```tsx
const unused = 123; // eslint-disable-line @typescript-eslint/no-unused-vars
```

---

## 团队协作

### 新成员设置

克隆项目后：
```bash
cd frontend
npm install  # 自动运行 prepare 脚本，设置 husky
```

### CI/CD 集成

在 CI pipeline 中添加：
```yaml
- name: Lint Frontend
  run: |
    cd frontend
    npm run lint
```

---

## 性能优化

### lint-staged 优势

✅ **只检查 staged 文件**
- 不会检查整个项目
- 提交速度更快

✅ **自动修复**
- 自动格式化代码
- 减少手动修改

✅ **并行执行**
- 多个文件同时检查
- 提高效率

---

## 文件结构

```
D:\学习\AI运营\
├── .husky/
│   ├── _/              # husky 内部文件
│   └── pre-commit      # pre-commit hook
├── frontend/
│   ├── package.json    # lint-staged 配置
│   ├── eslint.config.js
│   └── src/
└── package.json        # husky 依赖（根目录）
```

---

## 后续增强

### 1. 添加 Prettier
```bash
cd frontend
npm install -D prettier eslint-config-prettier
```

`package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

### 2. 添加 TypeScript 类型检查
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "tsc --noEmit",
      "eslint --fix"
    ]
  }
}
```

### 3. 添加测试
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

---

## 总结

✅ **已配置**
- Git pre-commit hook
- 自动 ESLint 校验
- 自动修复可修复的问题
- 只检查 staged 文件

✅ **效果**
- 提高代码质量
- 统一代码风格
- 防止低级错误进入代码库
- 减少 code review 负担

现在每次 `git commit` 都会自动运行 ESLint 检查！🎉
