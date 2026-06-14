# 代码审查清单

> **TL;DR**: 代码审查分三级：🔴 Blocker（必须修复才能合并）、🟡 Major（应该修复）、🟢 Minor（建议改进）。所有 Blocker 项必须通过，Major 项应该解决，Minor 项可选。审查者应在 24 小时内首次响应。

---

## 审查清单

使用此清单确保代码质量。每个 Pull Request 都应该过一遍这个清单。

---

## 🔴 Blocker 项（必须修复）

这些问题会阻止 PR 合并，**必须全部解决**才能 approve。

### ✅ 1. 所有测试通过

- [ ] 单元测试全部通过
- [ ] 集成测试全部通过
- [ ] E2E 测试（如果有）全部通过
- [ ] 没有跳过的测试（`.skip()` / `.todo()`）

**Why**: 失败的测试意味着功能不工作或有回归。

### ✅ 2. 代码覆盖率达标

- [ ] 后端覆盖率 ≥ 85%（语句）、≥ 75%（分支）
- [ ] 前端覆盖率 ≥ 80%（语句）、≥ 70%（分支）
- [ ] 新代码有对应的测试

**Why**: 覆盖率保证代码质量，未测试的代码容易引入 bug。

### ✅ 3. 没有调试代码残留

- [ ] 没有 `console.log()` / `console.debug()`（除非是有意的日志）
- [ ] 没有 `debugger` 语句
- [ ] 没有注释掉的代码块

**Why**: 调试代码会污染生产环境日志，影响性能。

**正确做法**: 使用正式的日志库（`pino` / `winston`）。

### ✅ 4. 没有硬编码的敏感信息

- [ ] 没有 API keys、tokens、密码
- [ ] 没有硬编码的 URL（使用环境变量）
- [ ] 没有内部 IP 地址

**Why**: 敏感信息泄露是严重的安全问题。

**正确做法**: 使用 `.env` 文件和环境变量。

### ✅ 5. 错误处理完整

- [ ] 所有 async 操作有 try-catch 或 .catch()
- [ ] 错误消息清晰有用
- [ ] 错误被正确记录（使用日志系统）
- [ ] 用户看到的错误消息友好（不暴露技术细节）

**Why**: 未处理的错误会导致程序崩溃或用户体验差。

### ✅ 6. TypeScript 类型正确

- [ ] 没有 `any` 类型（除非有充分理由并注释说明）
- [ ] 函数参数和返回值有类型注解
- [ ] Interface/Type 定义清晰
- [ ] 没有 `@ts-ignore` / `@ts-expect-error`（除非有注释说明原因）

**Why**: 类型安全是 TypeScript 的核心价值，any 等于放弃类型检查。

---

## 🟡 Major 项（应该修复）

这些问题不会阻止合并，但**应该在合并前解决**。如果有充分理由不修复，需要在 PR 中说明。

### ⚠️ 1. 遵循命名约定

- [ ] 变量、函数使用 camelCase：`getUserData`
- [ ] 类、接口使用 PascalCase：`ProductService`、`IProduct`
- [ ] 常量使用 UPPER_SNAKE_CASE：`MAX_RETRIES`
- [ ] 文件名使用 kebab-case 或 PascalCase（组件）

**Why**: 一致的命名提高可读性和团队协作效率。

### ⚠️ 2. 函数职责单一

- [ ] 每个函数只做一件事
- [ ] 函数长度合理（< 50 行为佳）
- [ ] 复杂逻辑被拆分成小函数

**Why**: 单一职责的函数更易测试、理解和复用。

**示例**：
```typescript
// ❌ 差 - 函数做了太多事
function processUserData(user) {
  validateUser(user);
  saveToDatabase(user);
  sendWelcomeEmail(user);
  logAnalytics(user);
}

// ✅ 好 - 拆分职责
async function createUser(userData) {
  const validatedUser = validateUser(userData);
  const savedUser = await saveUser(validatedUser);
  await sendWelcomeEmail(savedUser);
  await logUserCreation(savedUser);
  return savedUser;
}
```

### ⚠️ 3. 没有重复代码

- [ ] 相同逻辑没有复制粘贴
- [ ] 公共逻辑提取到工具函数
- [ ] 遵循 DRY（Don't Repeat Yourself）原则

**Why**: 重复代码增加维护成本，一个地方改了其他地方容易遗漏。

### ⚠️ 4. 注释清晰（复杂逻辑必须有）

- [ ] 复杂算法有解释性注释
- [ ] 业务逻辑注释说明"为什么"，不是"是什么"
- [ ] Public API 有 JSDoc 注释
- [ ] 没有废话注释（`// 创建变量` - 这种没用）

**Why**: 注释帮助未来的维护者（包括未来的自己）理解代码意图。

### ⚠️ 5. API 响应格式统一

- [ ] 成功响应格式一致
- [ ] 错误响应格式一致
- [ ] 分页响应包含 metadata（page, limit, total）
- [ ] HTTP 状态码使用正确（200/201/400/404/500）

**Why**: 统一的格式降低前端集成成本。

**示例**：
```typescript
// ✅ 成功响应
{ 
  data: [...],
  meta: { page: 1, limit: 20, total: 100 }
}

// ✅ 错误响应
{
  status: 400,
  error: "ValidationError",
  message: "Price must be positive",
  details: { field: "price", value: -10 }
}
```

### ⚠️ 6. 数据库查询优化

- [ ] 使用索引字段查询
- [ ] 避免 N+1 查询问题
- [ ] 使用分页（不是 SELECT * 全表）
- [ ] 避免在循环中查询数据库

**Why**: 未优化的查询会成为性能瓶颈。

---

## 🟢 Minor 项（建议改进）

这些是代码风格和最佳实践建议，**不阻止合并**，可以作为学习和改进方向。

### 💡 1. 代码格式统一

- [ ] 缩进一致（2 spaces）
- [ ] 使用单引号或双引号（项目统一）
- [ ] 对象尾随逗号
- [ ] 行尾分号

**Why**: 统一格式提高可读性。

**正确做法**: 使用 Prettier 自动格式化（`npm run format`）。

### 💡 2. 变量名语义化

- [ ] 变量名能表达其含义
- [ ] 避免单字母变量（除了循环的 i、j）
- [ ] 布尔值用 is/has/can 开头

**示例**：
```typescript
// ❌ 差
const d = new Date();
const f = true;

// ✅ 好
const currentDate = new Date();
const isFeatureEnabled = true;
```

### 💡 3. 函数复杂度合理

- [ ] 圈复杂度（Cyclomatic Complexity）< 10
- [ ] 嵌套层级 < 4
- [ ] 没有过深的回调嵌套

**Why**: 复杂的函数难以理解和测试。

**工具**: ESLint 规则 `complexity` 可以自动检查。

### 💡 4. 文件大小合理

- [ ] 单个文件 < 300 行（建议）
- [ ] 单个文件 < 500 行（警告）
- [ ] 超过 500 行应该拆分

**Why**: 大文件难以导航和理解。

---

## 审查流程

### 1. 审查者职责

#### 响应时间
- **首次响应**: 24 小时内
- **后续响应**: 4 小时内（工作时间）
- **紧急 PR**: 立即响应（标记 `urgent` label）

#### 审查深度
- **仔细阅读变更的代码**，不要只看 diff
- **理解变更的背景和目的**（阅读 PR 描述）
- **运行代码**（对于复杂功能）
- **测试边界情况**

#### 反馈质量
- **具体指出问题位置**（引用代码行）
- **解释为什么**（不是"这不好"，而是"这会导致..."）
- **提供解决方案**（如果可能，给出示例代码）
- **区分 Blocker / Major / Minor**

### 2. 作者职责

#### PR 描述
- **说明改了什么**（What changed）
- **为什么改**（Why - 背景和动机）
- **如何测试**（How to test）
- **截图**（如果是 UI 变更）
- **Breaking changes**（如果有，必须标注）

#### 响应 Review
- **逐条回复** review comments
- **解释决策**（如果不采纳建议，说明原因）
- **及时更新代码**
- **更新后重新请求审查**

---

## 示例：Review Comment

### ❌ 差的 Comment

> 这个函数写得不好。

**问题**: 没有具体说明什么不好，也没有建议。

### ✅ 好的 Comment

> 🔴 **Blocker**: 这个函数缺少错误处理。如果 API 调用失败，会导致程序崩溃。
> 
> 建议添加 try-catch：
> ```typescript
> try {
>   const result = await apiCall();
>   return result;
> } catch (error) {
>   logger.error('API call failed', { error });
>   throw new ApiError('Failed to fetch data');
> }
> ```

**好在哪里**: 
- 标明严重级别（Blocker）
- 说明问题和影响
- 提供具体解决方案

---

## 特殊情况

### Hotfix（紧急修复）

紧急生产问题可以适当放宽要求，但**不能完全跳过审查**：

- ✅ 可以降低覆盖率要求（但不能为 0）
- ✅ 可以快速审查（但不能不审查）
- ❌ 不能跳过测试
- ❌ 不能硬编码敏感信息

**事后补救**: Hotfix 合并后，必须在 48 小时内补充完整测试。

### 实验性功能

标记为实验性的功能可以放宽 Major/Minor 要求：

- ✅ 可以容忍一定的代码重复（快速迭代）
- ✅ 可以暂时不完美的架构
- ❌ 但 Blocker 项仍然必须满足

---

## 常见问题

### Q: Review 和 作者意见不一致怎么办？

**A**: 
1. 先充分沟通，理解对方观点
2. 如果是 Blocker 项，必须达成共识
3. 如果是 Major/Minor 项，可以适当妥协
4. 无法达成一致时，找第三方（Tech Lead）仲裁

### Q: 如何处理大型 PR？

**A**: 
1. **理想情况**: 尽量避免大型 PR，拆分成小 PR
2. **如果无法拆分**: 
   - 审查者分多次审查
   - 重点审查核心变更
   - 次要的格式问题可以放到后续 PR

### Q: 自己写的代码需要审查吗？

**A**: **需要**。即使是高级开发者，也需要 Code Review：
- 第二双眼睛能发现疏漏
- 知识共享（其他人了解变更）
- 保持代码风格一致

### Q: 审查者不懂某个领域怎么办？

**A**: 
1. 审查基本的代码质量（命名、结构、测试）
2. 对不理解的部分提问，让作者解释
3. 建议该领域的专家 co-review

---

## 工具辅助

### 自动化检查

这些检查应该在 CI 中自动运行，不需要人工审查：

- **Linting**: ESLint 检查代码风格和常见问题
- **Type checking**: TypeScript 编译器
- **Tests**: 自动运行测试套件
- **Coverage**: 覆盖率检查
- **Formatting**: Prettier 检查格式

### Code Review 工具

- **GitHub/GitLab**: 内置 PR review 功能
- **VS Code 插件**: Git Lens（查看 blame、历史）
- **Review Assistant**: AI 辅助（如 GitHub Copilot）

---

## 审查模板

复制此模板用于 PR review：

```markdown
## Blocker 项 🔴
- [ ] 所有测试通过
- [ ] 覆盖率达标
- [ ] 无调试代码
- [ ] 无硬编码敏感信息
- [ ] 错误处理完整
- [ ] TypeScript 类型正确

## Major 项 🟡
- [ ] 命名约定
- [ ] 函数职责单一
- [ ] 无重复代码
- [ ] 注释清晰
- [ ] API 格式统一
- [ ] 查询优化

## Minor 项 🟢
- [ ] 代码格式
- [ ] 变量名语义化
- [ ] 复杂度合理
- [ ] 文件大小合理

## 总体评价
<!-- 写下你的审查意见 -->

## 决策
- [ ] ✅ Approve（所有 Blocker 解决）
- [ ] 🔄 Request Changes（有 Blocker 需要修复）
- [ ] 💬 Comment（只有建议，不阻止合并）
```

---

## 参考资源

- [Google Code Review 指南](https://google.github.io/eng-practices/review/)
- [质量门禁标准](./quality-gates.md)
- [测试标准](./testing-standards.md)
