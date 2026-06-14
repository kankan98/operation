# 部署指南

> **TL;DR**: 生产部署步骤：构建前端 → 构建后端 → 配置环境变量 → 运行迁移 → 启动服务。使用 PM2 或 Docker。

## 前置准备

- Node.js 18+
- 生产数据库
- 环境变量配置

## 部署步骤

### 1. 构建前端

```bash
cd frontend
npm ci
npm run build
# 产物在 dist/
```

### 2. 构建后端

```bash
cd backend
npm ci
npm run build
# 产物在 dist/
```

### 3. 配置环境变量

生产环境不使用 .env 文件，使用环境变量或密钥管理服务。

### 4. 运行数据库迁移

```bash
npm run db:migrate
```

### 5. 启动服务

```bash
# 使用 PM2
pm2 start dist/index.js --name ecommerce-api

# 或 Docker
docker-compose up -d
```

## 回滚

```bash
pm2 stop ecommerce-api
git checkout v1.2.2
npm ci
npm run build
npm run db:migrate
pm2 restart ecommerce-api
```
