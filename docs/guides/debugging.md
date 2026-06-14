# 调试指南

> **TL;DR**: 后端用 VS Code debugger 或 console.log。前端用 React DevTools 和浏览器 DevTools。API 用 curl 或 Postman 测试。

## 后端调试

### VS Code Debugger

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "skipFiles": ["<node_internals>/**"]
}
```

### Console Logging

```typescript
import logger from './utils/logger';

logger.info('Processing request', { userId, productId });
logger.error('Failed to fetch', { error: error.message });
```

### 测试 API

```bash
# GET
curl http://localhost:3001/api/products

# POST
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"platform":"amazon","asin":"B08N5W"}'
```

## 前端调试

### React DevTools

浏览器扩展：检查组件、Props、State

### Chrome DevTools

- Network 面板：检查 API 请求
- Console：查看日志
- Sources：断点调试

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({ /* ... */ }))
);
```
