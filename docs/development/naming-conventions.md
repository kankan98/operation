# 命名约定

> **TL;DR**: 变量/函数 camelCase、类/接口 PascalCase、常量 UPPER_SNAKE_CASE、文件 kebab-case。布尔值用 is/has/can 前缀。

## 变量和函数

```typescript
// camelCase
const userName = 'John';
function getUserData() {}

// 布尔值用 is/has/can
const isActive = true;
const hasPermission = false;
const canEdit = true;
```

## 类和接口

```typescript
// PascalCase
class ProductService {}
interface IProduct {}
type UserRole = 'admin' | 'user';
```

## 常量

```typescript
// UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
```

## 文件名

```typescript
// kebab-case (utilities)
product-service.ts
error-handler.ts

// PascalCase (React components)
ProductCard.tsx
UserProfile.tsx
```
