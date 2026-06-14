# 快速开始指南

> **TL;DR**: 30 分钟内完成开发环境搭建。需要 Node.js 18+、npm 和 Git。克隆仓库 → 安装依赖 → 配置 .env → 运行数据库迁移 → 启动服务。

---

## 前置要求

- Node.js >= 18
- npm >= 9 或 pnpm
- Git
- Windows 用户：Git Bash

---

## 安装步骤

### 1. 克隆仓库

```bash
git clone <repository-url>
cd AI运营
```

### 2. 后端设置

```bash
cd backend
npm install

# 复制环境配置
cp .env.example .env

# 编辑 .env 文件，配置必需项
# DATABASE_PATH=./data/ecommerce.db
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your-key-here

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

后端运行在 http://localhost:3001

### 3. 前端设置

打开新终端：

```bash
cd frontend
npm install

# 创建 .env 文件
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

# 启动开发服务器
npm run dev
```

前端运行在 http://localhost:3000

### 4. 验证安装

- 打开浏览器访问 http://localhost:3000
- 应该看到 Dashboard 页面
- 尝试创建一个产品或发送聊天消息

---

## 下一步

- 阅读 [本地开发环境](./local-development.md)
- 查看 [常见任务指南](./common-tasks.md)
- 了解 [架构概览](../architecture/overview.md)

---

## 常见问题

### 端口冲突？

修改 `.env` 中的端口配置。

### 数据库迁移失败？

删除 `backend/data/ecommerce.db` 重新运行 `npm run db:migrate`。

详见 [问题排查手册](./troubleshooting.md)
