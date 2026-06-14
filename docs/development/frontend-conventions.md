# 前端代码约定

> **TL;DR**: React 18 + TypeScript + Tailwind。函数组件 + Hooks。状态管理：Zustand（全局）+ React Query（服务器）。文件名 PascalCase（组件）、camelCase（utils）。Props 解构、默认导出组件。

---

## 组件规范

### 函数组件标准结构

```tsx
// ✅ 正确：函数组件 + TypeScript
interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  className?: string;
}

export default function ProductCard({ product, onDelete, className }: ProductCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="font-semibold">{product.title}</h3>
      <p className="text-gray-600">{product.price}</p>
      {onDelete && (
        <button onClick={() => onDelete(product.id)}>删除</button>
      )}
    </div>
  );
}

// ❌ 错误：class 组件（不使用）
class ProductCard extends React.Component {}
```

### 组件文件结构

```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import type { Product } from '../types/product';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  items: Product[];
}

// 3. 组件定义
export default function ComponentName({ title, items }: ComponentProps) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false);
  
  // 3.2 Handlers
  const handleClick = () => setIsOpen(true);
  
  // 3.3 Effects
  useEffect(() => {
    // 副作用
  }, []);
  
  // 3.4 Return JSX
  return (
    <div>
      <h1>{title}</h1>
      {items.map(item => <div key={item.id}>{item.title}</div>)}
    </div>
  );
}
```

---

## Hooks 规范

### 自定义 Hooks

```tsx
// ✅ 正确：use 开头
function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    fetchProducts(filters)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, [filters]);
  
  return { products, isLoading };
}
```

### Hooks 规则

1. **只在顶层调用**
2. **依赖数组完整**
3. **自定义 Hook 以 use 开头**

---

## 状态管理

| 状态类型 | 工具 | 使用场景 |
|---------|------|---------|
| 本地状态 | useState | 组件内部状态 |
| 全局 UI 状态 | Zustand | 跨组件 UI 状态 |
| 服务器状态 | React Query | API 数据 |
| 表单状态 | React Hook Form | 复杂表单 |

---

## 样式规范

### Tailwind CSS

```tsx
// ✅ 使用 Tailwind classes
function Button({ variant = 'primary' }) {
  const classes = variant === 'primary' 
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  
  return <button className={`px-4 py-2 rounded ${classes}`}>Click</button>;
}

// ❌ 避免内联样式
function Button() {
  return <button style={{ padding: '8px' }}>Click</button>;
}
```

---

## 事件处理

```tsx
// ✅ 正确命名
const handleClick = () => {};
const handleSubmit = () => {};

// Props 中用 on + 动作
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
}
```

---

## 性能优化

```tsx
// React.memo - 避免不必要的重渲染
const ProductCard = React.memo(({ product }: { product: Product }) => {
  return <div>{product.title}</div>;
});

// useMemo - 计算密集型操作
const filteredProducts = useMemo(() => {
  return products.filter(p => p.title.includes(search));
}, [products, search]);

// useCallback - 传递给子组件的回调
const handleDelete = useCallback((id: string) => {
  deleteProduct(id);
}, []);
```

---

## 文件命名

- **组件**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase, use 开头 (`useProducts.ts`)
- **Utils**: camelCase (`formatters.ts`)

---

## 条件渲染

```tsx
// ✅ 提前返回
function ProductList({ products, isLoading, error }) {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!products.length) return <EmptyState />;
  
  return <div>{products.map(...)}</div>;
}

// ✅ 短路运算符
{user && <UserMenu user={user} />}

// ✅ 三元运算符
{isActive ? '在线' : '离线'}
```

---

## 参考资源

- [前端架构](../architecture/frontend-architecture.md)
- [React 官方文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
