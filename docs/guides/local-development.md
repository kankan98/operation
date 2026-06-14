# 本地开发环境

> **TL;DR**: 后端 3001 端口（tsx watch 热重载），前端 3000 端口（Vite）。.env 配置环境变量。SQLite 数据库本地文件。

## 开发服务器

### 后端

```bash
cd backend
npm run dev  # http://localhost:3001
```

特性：
- tsx watch 热重载
- 自动重启
- 源码直接运行（无需编译）

### 前端

```bash
cd frontend
npm run dev  # http://localhost:3000
```

特性：
- Vite HMR（热模块替换）
- 快速刷新
- 自动打开浏览器

## 环境变量

### 后端 (.env)

```bash
DATABASE_PATH=./data/ecommerce.db
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
PORT=3001
```

### 前端 (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

## 数据库

SQLite 文件：`backend/data/ecommerce.db`

操作：
```bash
npm run db:migrate   # 运行迁移
npm run db:studio    # 打开可视化界面
```

详见 [快速开始](./getting-started.md)
