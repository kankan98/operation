# 问题排查手册

> **TL;DR**: 环境变量冲突检查 .env 优先级、端口冲突用 netstat 查找进程、依赖问题清理 node_modules 重装、数据库问题重置迁移、测试失败检查环境差异。SSE 流式响应避免 for-await-of，使用手动迭代。

---

## 环境变量问题

### 问题：环境变量未生效

**症状**: 代码中读取的环境变量是 undefined 或旧值

**常见原因**:
1. .env 文件不在正确位置
2. 环境变量名拼写错误
3. Claude Code 全局配置覆盖项目配置
4. 系统环境变量优先级更高

**排查步骤**:

```bash
# 1. 检查 .env 文件是否存在
ls -la backend/.env

# 2. 查看环境变量加载情况
cd backend
node -e "require('dotenv').config(); console.log(process.env.AI_PROVIDER)"

# 3. 检查系统环境变量
echo $AI_PROVIDER  # Linux/Mac
echo %AI_PROVIDER%  # Windows CMD
$env:AI_PROVIDER   # Windows PowerShell
```

**解决方案**:

1. **确保 .env 文件位置正确**
   ```
   backend/.env  ← 必须在这里
   ```

2. **检查环境变量优先级**
   ```
   系统环境变量 > Claude Code 全局配置 > 项目 .env
   ```

3. **清除 Claude Code 全局配置**（如果冲突）
   - 检查 `~/.claude/settings.json`
   - 移除全局的 `ANTHROPIC_API_KEY` 等配置

4. **重启开发服务器**
   ```bash
   # 停止服务
   Ctrl+C
   
   # 重新启动
   npm run dev
   ```

---

## 端口冲突

### 问题：端口已被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案**:

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3001
# 记下 PID，然后杀掉进程
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9

# 或者修改端口
# backend/.env
PORT=3002
```

---

## 依赖安装问题

### 问题：npm install 失败

**常见错误**:
- `EACCES: permission denied`
- `integrity checksum failed`
- `ERR_SOCKET_TIMEOUT`

**解决方案**:

```bash
# 1. 清理缓存和 node_modules
rm -rf node_modules package-lock.json
npm cache clean --force

# 2. 重新安装
npm install

# 3. 如果还是失败，检查 Node 版本
node -v  # 需要 >= 18

# 4. 使用 npm ci（更可靠）
npm ci
```

---

## 数据库问题

### 问题：数据库 schema 不同步

**症状**:
```
SqliteError: no such table: categories
```

**解决方案**:

```bash
cd backend

# 方案 1: 运行迁移
npm run db:migrate

# 方案 2: 重置数据库（警告：会丢失数据）
rm data/ecommerce.db
npm run db:migrate

# 方案 3: 检查迁移状态
npm run db:studio  # 打开 Drizzle Studio
```

### 问题：迁移文件冲突

**症状**:
```
Error: Migration already exists
```

**解决方案**:

```bash
# 删除重复的迁移文件
rm db/migrations/0002_duplicate.sql

# 重新生成
npm run db:generate
npm run db:migrate
```

---

## 测试失败

### 问题：测试在 CI 失败但本地通过

**常见原因**:
1. 环境差异（时区、文件路径）
2. 并行测试竞态条件
3. 依赖版本不一致

**排查步骤**:

```bash
# 1. 查看 CI 日志，找到具体失败的测试

# 2. 本地用相同环境重现
# 使用 Docker（如果有）或设置相同的环境变量

# 3. 检查时区相关代码
# ❌ 不要使用本地时区
const now = new Date();  // 受本地时区影响

# ✅ 使用 UTC
const now = Date.now();  // Unix timestamp
```

### 问题：测试数据库污染

**症状**: 测试相互影响，顺序不同结果不同

**解决方案**:

```typescript
// 每个测试前清理数据库
beforeEach(async () => {
  await db.delete(products).run();
  await db.delete(alerts).run();
});

// 或使用事务回滚
describe('Products', () => {
  let tx;
  
  beforeEach(() => {
    tx = db.transaction();
  });
  
  afterEach(() => {
    tx.rollback();
  });
});
```

---

## SSE 流式响应问题

### 问题：SSE 只收到 start 和 done，没有中间内容

**根本原因** (来自 STREAMING_FIX.md):

1. **for-await-of 在 tsx watch 环境下无法工作**
   ```typescript
   // ❌ 不工作
   for await (const chunk of generator()) {
     res.write(`data: ${JSON.stringify(chunk)}\n\n`);
   }
   ```

2. **客户端超时断开**（第一个 yield 需要等待 AI API 响应，约 700-800ms）

**解决方案**:

```typescript
// ✅ 使用手动迭代
const generator = chatService.streamMessage(id, content);

// 发送初始事件
res.write('data: {"type":"start"}\n\n');

// 延迟让 event loop 处理
await new Promise(resolve => setTimeout(resolve, 50));

// 设置 keepalive
const keepaliveInterval = setInterval(() => {
  if (!clientDisconnected) {
    res.write('data: {"type":"ping"}\n\n');
  }
}, 500);

// 手动迭代
let result = await generator.next();
while (!result.done && !clientDisconnected) {
  const data = JSON.stringify(result.value);
  res.write(`data: ${data}\n\n`);
  result = await generator.next();
}

clearInterval(keepaliveInterval);
```

---

## AI Provider 问题

### 问题：API 调用失败

**症状**:
```
Error: 401 Unauthorized
```

**排查步骤**:

1. **检查 API Key**
   ```bash
   # 确认环境变量已设置
   echo $ANTHROPIC_API_KEY
   
   # 检查 key 格式
   # Anthropic: sk-ant-xxx
   # DeepSeek: sk-xxx
   ```

2. **检查 Base URL**
   ```bash
   # DeepSeek 使用 Anthropic 协议
   ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
   
   # 原生 Claude
   # ANTHROPIC_BASE_URL 留空或 https://api.anthropic.com
   ```

3. **检查模型名称**
   ```bash
   # DeepSeek
   ANTHROPIC_MODEL=deepseek-v4-pro
   
   # Claude
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```

---

## 前端问题

### 问题：API 请求 404

**症状**:
```
GET http://localhost:3000/api/products 404 (Not Found)
```

**原因**: 前端直接请求 3000 端口，但 API 在 3001

**解决方案**:

```bash
# 检查 frontend/.env
cat frontend/.env

# 应该是:
VITE_API_BASE_URL=http://localhost:3001/api

# 如果不对，修改后重启
npm run dev
```

### 问题：CORS 错误

**症状**:
```
Access to fetch at 'http://localhost:3001/api/products' has been blocked by CORS policy
```

**解决方案**:

```typescript
// backend/src/app.ts
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',  // 前端地址
  credentials: true,
}));
```

---

## 快速诊断清单

遇到问题时，按此顺序检查：

- [ ] 查看控制台错误消息（完整的堆栈跟踪）
- [ ] 检查环境变量是否正确加载
- [ ] 确认服务是否真的在运行（curl 测试）
- [ ] 查看日志文件（如果有）
- [ ] 尝试最小复现（隔离问题）
- [ ] 搜索项目中是否有类似问题的修复记录

---

## 获取帮助

1. **搜索已知问题**: 检查 `backend/` 下的 `*_FIX.md` 文件
2. **查看日志**: 后端日志通常包含详细错误信息
3. **简化问题**: 创建最小复现用例
4. **提供上下文**: 错误消息、环境信息、复现步骤

