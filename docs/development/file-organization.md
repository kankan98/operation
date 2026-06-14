# 文件组织规范

> **TL;DR**: 后端按功能分层（routes/services/db），前端按功能模块（components/pages/hooks）。单文件 <300 行。按功能分组，相关文件放一起。测试文件镜像源码结构。

---

## 后端目录结构

### 标准结构

```
backend/
├── src/
│   ├── routes/              路由层（HTTP 端点）
│   │   ├── products.ts
│   │   ├── alerts.ts
│   │   ├── chat.ts
│   │   └── analytics.ts
│   ├── services/            服务层（业务逻辑）
│   │   ├── productService.ts
│   │   ├── alertService.ts
│   │   ├── chatService.ts
│   │   └── scraperService.ts
│   ├── db/                  数据库层
│   │   ├── schema.ts        Drizzle schema 定义
│   │   ├── index.ts         数据库连接
│   │   └── migrations/      迁移文件
│   ├── middleware/          中间件
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── auth.ts
│   ├── utils/               工具函数
│   │   ├── errors.ts        自定义错误类
│   │   ├── logger.ts        日志工具
│   │   └── validators.ts    验证函数
│   ├── types/               类型定义
│   │   ├── product.ts
│   │   ├── alert.ts
│   │   └── chat.ts
│   ├── config/              配置
│   │   └── index.ts         环境变量配置
│   ├── app.ts               Express 应用配置
│   └── index.ts             入口文件
├── tests/                   测试文件
│   ├── unit/                单元测试
│   │   └── services/
│   │       └── productService.test.ts
│   └── integration/         集成测试
│       └── routes/
│           └── products.test.ts
├── data/                    SQLite 数据库文件
│   └── ecommerce.db
├── package.json
├── tsconfig.json
└── .env
```

### 文件命名规则

- **Routes**: `products.ts`, `alerts.ts` (复数、kebab-case)
- **Services**: `productService.ts` (camelCase + Service 后缀)
- **Utils**: `errorHandler.ts` (camelCase 或 kebab-case)

---

## 前端目录结构

### 标准结构

```
frontend/
├── src/
│   ├── pages/               页面组件（路由级别）
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Alerts.tsx
│   │   └── Chat.tsx
│   ├── components/          可复用组件
│   │   ├── ProductCard.tsx
│   │   ├── AlertCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ui/              基础 UI 组件
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Input.tsx
│   ├── hooks/               自定义 Hooks
│   │   ├── useProducts.ts
│   │   ├── useAlerts.ts
│   │   └── useDebounce.ts
│   ├── services/            API 客户端
│   │   ├── api.ts           Axios 实例
│   │   ├── productApi.ts
│   │   ├── alertApi.ts
│   │   └── chatApi.ts
│   ├── stores/              Zustand 状态管理
│   │   ├── chatStore.ts
│   │   └── uiStore.ts
│   ├── types/               TypeScript 类型
│   │   ├── product.ts
│   │   ├── alert.ts
│   │   └── chat.ts
│   ├── lib/                 工具库
│   │   ├── utils.ts
│   │   └── formatters.ts
│   ├── App.tsx              根组件
│   ├── main.tsx             入口文件
│   └── index.css            全局样式
├── public/                  静态资源
│   └── favicon.ico
├── tests/                   测试文件
│   └── components/
│       └── ProductCard.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env
```

### 文件命名规则

- **组件**: `ProductCard.tsx` (PascalCase)
- **Hooks**: `useProducts.ts` (camelCase + use 前缀)
- **Utils**: `formatters.ts` (camelCase)
- **Stores**: `chatStore.ts` (camelCase + Store 后缀)

---

## 文件大小限制

### 建议限制

| 文件类型 | 最大行数 | 理由 |
|---------|---------|------|
| 组件 | 300 行 | 超过应拆分 |
| Service | 500 行 | 单一职责原则 |
| Utils | 200 行 | 保持聚焦 |
| 配置 | 100 行 | 简单明了 |

### 何时拆分

当文件超过限制时：

```typescript
// ❌ 过大的 Service（800 行）
// services/productService.ts
export const productService = {
  getAll() {},
  getById() {},
  create() {},
  update() {},
  delete() {},
  // ... 20 个方法
};

// ✅ 拆分为多个文件
// services/product/index.ts
export { getAll, getById } from './queries';
export { create, update, delete as deleteProduct } from './mutations';
export { calculateStats } from './analytics';
```

---

## 按功能分组（可选）

对于大型应用，可以按功能模块组织：

```
backend/src/
├── products/
│   ├── products.routes.ts
│   ├── products.service.ts
│   └── products.types.ts
├── alerts/
│   ├── alerts.routes.ts
│   ├── alerts.service.ts
│   └── alerts.types.ts
└── chat/
    ├── chat.routes.ts
    ├── chat.service.ts
    └── chat.types.ts
```

**何时使用**：
- 团队 > 5 人
- 模块 > 10 个
- 代码库 > 50,000 行

---

## 测试文件组织

### 镜像源码结构

```
src/services/productService.ts
  → tests/unit/services/productService.test.ts

src/routes/products.ts
  → tests/integration/routes/products.test.ts

src/components/ProductCard.tsx
  → tests/components/ProductCard.test.tsx
```

### 测试文件命名

- **单元测试**: `*.test.ts`
- **集成测试**: `*.test.ts` (放在 `integration/` 目录)
- **E2E 测试**: `*.e2e.ts`

---

## 导入顺序

### 标准顺序

```typescript
// 1. 外部依赖
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 内部模块（绝对路径）
import { Product } from '@/types/product';
import { fetchProducts } from '@/services/productApi';

// 3. 相对路径
import { ProductCard } from '../components/ProductCard';
import { formatPrice } from './utils';

// 4. 样式
import './styles.css';

// 5. 类型导入（分开）
import type { User } from '@/types/user';
```

---

## 路径别名

### 配置 tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"]
    }
  }
}
```

### 使用

```typescript
// ✅ 使用别名（清晰）
import { ProductCard } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';

// ❌ 相对路径（混乱）
import { ProductCard } from '../../../components/ProductCard';
```

---

## 配置文件位置

```
项目根目录/
├── .env                 环境变量
├── .gitignore           Git 忽略
├── .prettierrc          Prettier 配置
├── .editorconfig        编辑器配置
├── tsconfig.json        TypeScript 配置
├── package.json         依赖管理
└── README.md            项目说明
```

---

## 最佳实践

### 1. 一个文件一个主要导出

```typescript
// ✅ 好
// Button.tsx
export default function Button() {}

// ❌ 差 - 多个组件在一个文件
// Components.tsx
export function Button() {}
export function Input() {}
export function Select() {}
```

### 2. 相关文件放一起

```
components/
├── ProductCard/
│   ├── ProductCard.tsx
│   ├── ProductCard.test.tsx
│   └── ProductCard.css
```

### 3. 使用 index.ts 简化导入

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// 使用
import { Button, Input, Modal } from '@/components/ui';
```

---

## 参考资源

- [后端架构](../architecture/backend-architecture.md)
- [前端架构](../architecture/frontend-architecture.md)
- [命名约定](./naming-conventions.md)
