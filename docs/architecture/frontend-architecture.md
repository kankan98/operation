# 前端架构

> **TL;DR**: React 18 + TypeScript + Vite。状态管理：Zustand（全局）+ React Query（服务器）。路由：React Router。样式：Tailwind CSS v4。组件：pages/（页面）、components/（复用）。数据流：用户交互 → 组件 → API 请求 → React Query 缓存 → 更新 UI。

---

## 技术栈总览

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18 | UI 框架 |
| **TypeScript** | 5.x | 类型系统 |
| **Vite** | 5.x | 构建工具（快速 HMR） |
| **React Router** | 6.x | 客户端路由 |
| **Tailwind CSS** | v4 | 样式框架 |

### 状态管理

| 类型 | 工具 | 用途 |
|------|------|------|
| **全局状态** | Zustand | UI 状态（主题、侧边栏展开等） |
| **服务器状态** | React Query (TanStack Query) | API 数据缓存、同步、重试 |
| **表单状态** | React Hook Form + Zod | 表单验证和状态管理 |
| **本地状态** | useState/useReducer | 组件内部状态 |

### UI 和工具

- **UI 组件**: 自定义组件 + Tailwind
- **图表**: Recharts
- **HTTP 客户端**: Axios
- **日期处理**: date-fns
- **Toast 通知**: sonner

---

## 目录结构详解

```
frontend/src/
├── pages/              页面组件（路由级别）
│   ├── Dashboard.tsx   仪表板
│   ├── Products.tsx    产品列表
│   ├── Alerts.tsx      警报管理
│   └── Chat.tsx        AI 聊天
├── components/         可复用组件
│   ├── ProductCard.tsx        产品卡片
│   ├── AlertCard.tsx          警报卡片
│   ├── LoadingSpinner.tsx     加载动画
│   └── ui/                    基础 UI 组件
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Input.tsx
├── hooks/              自定义 Hooks
│   ├── useProducts.ts         产品数据获取
│   ├── useAlerts.ts           警报数据获取
│   └── useDebounce.ts         防抖 Hook
├── services/           API 客户端
│   ├── api.ts                 Axios 实例配置
│   ├── productApi.ts          产品 API
│   ├── alertApi.ts            警报 API
│   └── chatApi.ts             聊天 API（含 SSE）
├── stores/             Zustand 状态管理
│   ├── chatStore.ts           聊天状态（会话、消息）
│   └── uiStore.ts             UI 状态（主题、侧边栏）
├── types/              TypeScript 类型定义
│   ├── product.ts
│   ├── alert.ts
│   └── chat.ts
├── lib/                工具函数
│   ├── utils.ts               通用工具
│   └── formatters.ts          格式化函数
├── App.tsx             根组件
├── main.tsx            入口文件
└── index.css           全局样式
```

---

## 数据流架构

### 整体数据流

```
┌──────────────┐
│ 用户交互      │
│ (点击/输入)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ React 组件                                │
│ - useState (本地状态)                     │
│ - useStore (Zustand 全局状态)            │
│ - useQuery (React Query 服务器状态)      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ API 服务层 (services/)                   │
│ - Axios 配置                             │
│ - 请求/响应拦截器                        │
│ - 错误处理                               │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ HTTP 请求 → 后端 API                     │
│ - GET/POST/PUT/DELETE                    │
│ - SSE (Server-Sent Events)               │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ React Query 缓存层                       │
│ - 自动缓存                               │
│ - 后台重新验证                           │
│ - 乐观更新                               │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ UI 更新                                  │
│ - 组件重新渲染                           │
│ - 展示新数据                             │
└──────────────────────────────────────────┘
```

---

## 状态管理策略

### 1. 全局 UI 状态（Zustand）

用于**不需要服务器同步**的 UI 状态。

**示例**：聊天界面状态

```typescript
// stores/chatStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  
  // Actions
  addSession: (session: ChatSession) => void;
  setCurrentSession: (id: string) => void;
  setStreaming: (isStreaming: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
      
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session],
      })),
      
      setCurrentSession: (id) => set({ currentSessionId: id }),
      
      setStreaming: (isStreaming) => set({ isStreaming }),
    }),
    { name: 'ChatStore' }
  )
);
```

**使用**：

```typescript
function ChatPage() {
  const { sessions, currentSessionId, setCurrentSession } = useChatStore();
  
  return (
    <div>
      {sessions.map(session => (
        <button key={session.id} onClick={() => setCurrentSession(session.id)}>
          {session.title}
        </button>
      ))}
    </div>
  );
}
```

### 2. 服务器状态（React Query）

用于**需要与后端同步**的数据。

**示例**：产品列表

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, createProduct, deleteProduct } from '../services/productApi';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 分钟内认为数据新鲜
    cacheTime: 10 * 60 * 1000, // 10 分钟后从缓存移除
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // 创建成功后，使产品列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId) => {
      // 乐观更新：立即从 UI 移除
      await queryClient.cancelQueries({ queryKey: ['products'] });
      
      const previousProducts = queryClient.getQueryData(['products']);
      
      queryClient.setQueryData(['products'], (old: Product[]) =>
        old.filter(p => p.id !== productId)
      );
      
      return { previousProducts };
    },
    onError: (err, productId, context) => {
      // 失败时回滚
      queryClient.setQueryData(['products'], context?.previousProducts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

**使用**：

```typescript
function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const deleteMutation = useDeleteProduct();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products?.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={() => deleteMutation.mutate(product.id)}
        />
      ))}
    </div>
  );
}
```

### 3. 表单状态（React Hook Form）

用于**复杂表单验证**。

```typescript
// components/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'ebay', 'aliexpress']),
  productUrl: z.string().url('必须是有效的 URL'),
  asin: z.string().min(10, 'ASIN 至少 10 位').max(10, 'ASIN 最多 10 位'),
  title: z.string().min(1, '标题不能为空'),
  price: z.number().positive('价格必须为正数'),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  
  const createMutation = useCreateProduct();
  
  const onSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>平台</label>
        <select {...register('platform')}>
          <option value="amazon">Amazon</option>
          <option value="walmart">Walmart</option>
        </select>
        {errors.platform && <span className="text-red-500">{errors.platform.message}</span>}
      </div>
      
      <div>
        <label>产品 URL</label>
        <input {...register('productUrl')} />
        {errors.productUrl && <span className="text-red-500">{errors.productUrl.message}</span>}
      </div>
      
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? '创建中...' : '创建产品'}
      </button>
    </form>
  );
}
```

---

## 组件设计模式

### 页面组件（Smart Components）

负责数据获取和业务逻辑。

```typescript
// pages/Products.tsx
export default function Products() {
  const { data: products, isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProducts = products?.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">产品列表</h1>
      
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      
      <ProductGrid products={filteredProducts} />
    </div>
  );
}
```

### 展示组件（Dumb Components）

只负责展示，不包含业务逻辑。

```typescript
// components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
}

export default function ProductCard({ product, onDelete, onEdit }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-lg truncate">{product.title}</h3>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-2xl font-bold">
          {product.currency} {product.price}
        </span>
        <span className="text-sm text-gray-500">{product.platform}</span>
      </div>
      
      {product.isMonitoring && (
        <div className="mt-2 flex items-center text-green-600 text-sm">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
          监控中
        </div>
      )}
      
      <div className="mt-4 flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(product)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            编辑
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(product.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 路由设计

### 路由配置

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Alerts from './pages/Alerts';
import Chat from './pages/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="chat" element={<Chat />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Layout 组件

```typescript
// components/Layout.tsx
import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">价格监控</h1>
        </div>
        
        <nav className="mt-8">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
            }
          >
            仪表板
          </NavLink>
          <NavLink to="/products" className="block px-4 py-2 hover:bg-gray-700">
            产品
          </NavLink>
          <NavLink to="/alerts" className="block px-4 py-2 hover:bg-gray-700">
            警报
          </NavLink>
          <NavLink to="/chat" className="block px-4 py-2 hover:bg-gray-700">
            AI 助手
          </NavLink>
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 overflow-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## API 集成

### Axios 配置

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证 token（如果有）
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未认证，跳转登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API 服务

```typescript
// services/productApi.ts
import api from './api';

export interface Product {
  id: string;
  platform: string;
  asin: string;
  title: string;
  price: number;
  currency: string;
  isMonitoring: boolean;
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const createProduct = async (data: Omit<Product, 'id'>): Promise<Product> => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};
```

---

## SSE 流式响应

### 聊天流式实现

```typescript
// services/chatApi.ts
export async function* streamChatMessage(sessionId: string, content: string) {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 使用流式响应

```typescript
// pages/Chat.tsx
function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    
    try {
      let assistantMessage = '';
      
      for await (const chunk of streamChatMessage(sessionId, content)) {
        if (chunk.type === 'text') {
          assistantMessage += chunk.text;
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: assistantMessage },
          ]);
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
      </div>
      
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

---

## 性能优化

### 代码拆分

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Chat = lazy(() => import('./pages/Chat'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Suspense>
  );
}
```

### 虚拟化长列表

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function ProductList({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 参考资源

- [React 官方文档](https://react.dev/)
- [React Query 文档](https://tanstack.com/query/latest)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Vite 文档](https://vitejs.dev/)

