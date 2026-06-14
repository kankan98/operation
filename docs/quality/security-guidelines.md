# 安全规范

> **TL;DR**: 敏感信息存储在 .env（不提交）。API keys 在日志中掩码。所有输入用 Zod 验证。SQL 注入用参数化查询防护。XSS 用输出转义防护。密码必须哈希（bcrypt/argon2）。生产环境使用 HTTPS 和环境变量管理服务。

---

## 环境变量管理

### ✅ 正确做法

**1. 使用 .env 文件存储敏感信息**

```bash
# .env（不提交到 Git）
DATABASE_URL=./data/production.db
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
JWT_SECRET=your-secret-key-here
```

**2. .env 文件必须在 .gitignore 中**

```bash
# .gitignore
.env
.env.local
.env.production
*.env
```

**3. 提供 .env.example 模板**

```bash
# .env.example（可以提交）
DATABASE_URL=./data/ecommerce.db
ANTHROPIC_API_KEY=your-api-key-here
OPENAI_API_KEY=your-api-key-here
JWT_SECRET=your-secret-key-here
```

### ❌ 错误做法

**永远不要硬编码敏感信息**:

```typescript
// ❌ 绝对不要这样做
const apiKey = 'sk-ant-1234567890abcdef';
const dbPassword = 'MyPassword123';
const jwtSecret = 'super-secret-key';
```

**不要在代码注释中留下敏感信息**:

```typescript
// ❌ 不要这样
// 临时 API key: sk-ant-1234567890abcdef
// 生产数据库密码: ProductionPass2024
```

### 环境变量验证

在应用启动时验证必需的环境变量：

```typescript
// config/index.ts
export function validateConfig() {
  const required = [
    'DATABASE_PATH',
    'AI_PROVIDER',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    );
  }

  // 验证 AI Provider 配置
  if (process.env.AI_PROVIDER === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
  }
}
```

### 生产环境密钥管理

**不要在生产环境使用 .env 文件**。使用专业的密钥管理服务：

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Google Secret Manager**
- **Azure Key Vault**

---

## 认证和授权

### 当前状态

**注意**: 本项目当前**没有实现认证系统**。以下是未来添加认证时的指南。

### API Token 认证（推荐用于 API）

```typescript
// middleware/auth.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

// 使用
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
```

### 密码存储

**永远不要存储明文密码**:

```typescript
import bcrypt from 'bcryptjs';

// ✅ 注册时哈希密码
async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10); // 10 是 salt rounds
  
  await db.insert(users).values({
    email,
    password: hashedPassword, // 存储哈希值
  });
}

// ✅ 登录时验证密码
async function login(email: string, password: string) {
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return generateToken(user);
}
```

### Token 过期时间

```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' } // 7 天后过期
);
```

### 失败登录记录

记录失败的认证尝试，防止暴力破解：

```typescript
async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // 记录失败尝试
    logger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    
    throw new Error('Invalid credentials');
  }

  // 成功登录
  return generateToken(user);
}
```

---

## 输入验证

### 使用 Zod 验证所有输入

```typescript
import { z } from 'zod';

// 定义 schema
const CreateProductSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'ebay', 'aliexpress']),
  productUrl: z.string().url(),
  asin: z.string().min(10).max(10),
  title: z.string().min(1).max(500),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CNY']),
  isMonitoring: z.boolean().default(true),
  checkInterval: z.number().int().min(60).max(86400), // 1分钟 - 24小时
});

// 在路由中验证
app.post('/api/products', async (req, res) => {
  try {
    // 验证输入
    const validatedData = CreateProductSchema.parse(req.body);
    
    // 使用验证后的数据
    const product = await productService.create(validatedData);
    
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 400,
        error: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors,
      });
    }
    // 其他错误
    throw error;
  }
});
```

### 验证最佳实践

**1. 服务器端验证是必须的**

即使前端已经验证，后端仍然必须验证（前端验证可以被绕过）。

**2. 白名单验证**

```typescript
// ✅ 好 - 使用枚举限制可选值
const platform = z.enum(['amazon', 'walmart', 'ebay']);

// ❌ 差 - 允许任意字符串
const platform = z.string();
```

**3. 限制字符串长度**

```typescript
// ✅ 防止超长输入
const title = z.string().min(1).max(500);
const email = z.string().email().max(255);
```

**4. 数值范围验证**

```typescript
// ✅ 防止负数、超大数值
const price = z.number().positive().max(999999);
const quantity = z.number().int().min(0).max(10000);
```

---

## SQL 注入防护

### ✅ 使用参数化查询（ORM）

Drizzle ORM 自动处理 SQL 注入防护：

```typescript
// ✅ 安全 - 参数化查询
const product = await db.select()
  .from(products)
  .where(eq(products.id, productId)) // productId 会被正确转义
  .get();

// ✅ 安全 - 动态条件
const products = await db.select()
  .from(products)
  .where(
    and(
      eq(products.platform, platform),
      gte(products.price, minPrice)
    )
  )
  .all();
```

### ❌ 永远不要拼接 SQL

```typescript
// ❌ 危险 - SQL 注入漏洞
const query = `SELECT * FROM products WHERE id = '${productId}'`;
const result = await db.execute(query); // 如果 productId = "1' OR '1'='1"

// ❌ 危险 - 字符串拼接
const query = `SELECT * FROM products WHERE platform = '${req.query.platform}'`;
```

### 如果必须使用原始 SQL

使用参数占位符：

```typescript
// ✅ 使用参数占位符
const result = await db.execute(
  'SELECT * FROM products WHERE id = ?',
  [productId]
);
```

---

## XSS（跨站脚本）防护

### 前端输出转义

React 默认会转义输出，防止 XSS：

```tsx
// ✅ 安全 - React 自动转义
function ProductCard({ product }) {
  return <div>{product.title}</div>; // <script> 标签会被转义
}
```

### ❌ 危险：dangerouslySetInnerHTML

```tsx
// ❌ 危险 - 直接插入 HTML
function ProductCard({ product }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: product.description }} />
  );
}
```

**如果必须使用**，先清理 HTML：

```tsx
import DOMPurify from 'dompurify';

// ✅ 使用 DOMPurify 清理
function ProductCard({ product }) {
  const cleanHTML = DOMPurify.sanitize(product.description);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
  );
}
```

### 后端响应头

设置安全响应头：

```typescript
import helmet from 'helmet';

// 使用 helmet 中间件
app.use(helmet());

// 或手动设置
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

---

## API Keys 在日志中掩码

### ✅ 日志中掩码敏感信息

```typescript
// utils/logger.ts
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = { ...data };
  const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'authorization'];

  for (const key in masked) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      const value = masked[key];
      if (typeof value === 'string' && value.length > 8) {
        // 只显示前 4 位和后 4 位
        masked[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      } else {
        masked[key] = '***';
      }
    }
  }

  return masked;
}

// 使用
logger.info('API call', maskSensitiveData({
  url: '/api/chat',
  apiKey: 'sk-ant-1234567890abcdef', // 将被掩码为 "sk-a...cdef"
}));
```

### ❌ 不要在日志中输出敏感信息

```typescript
// ❌ 危险
logger.info('User login', {
  email: user.email,
  password: user.password, // 永远不要记录密码
});

// ❌ 危险
logger.error('API call failed', {
  apiKey: process.env.ANTHROPIC_API_KEY, // 不要记录完整 API key
});
```

---

## HTTPS 和传输安全

### 生产环境必须使用 HTTPS

```typescript
// 强制 HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### CORS 配置

```typescript
import cors from 'cors';

// 生产环境严格限制
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com' // 只允许你的域名
    : '*', // 开发环境允许所有
  credentials: true,
};

app.use(cors(corsOptions));
```

---

## 敏感信息处理

### 错误消息不暴露内部细节

```typescript
// ❌ 差 - 暴露内部信息
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message, // 可能包含数据库结构、文件路径等
    stack: err.stack, // 暴露代码结构
  });
});

// ✅ 好 - 通用错误消息
app.use((err, req, res, next) => {
  logger.error('Request failed', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    status: 500,
    error: 'InternalServerError',
    message: 'An unexpected error occurred', // 通用消息
    // 开发环境可以包含详细信息
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
    }),
  });
});
```

### 文件上传限制

如果有文件上传功能：

```typescript
import multer from 'multer';

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许特定类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

---

## Rate Limiting（速率限制）

防止暴力破解和 DDoS 攻击：

```typescript
import rateLimit from 'express-rate-limit';

// 全局速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// 登录端点更严格的限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15 分钟内最多 5 次尝试
  message: 'Too many login attempts, please try again after 15 minutes.',
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

---

## 安全 Checklist

### 开发阶段 ✅

- [ ] 敏感信息存储在 .env 文件
- [ ] .env 文件在 .gitignore 中
- [ ] 提供 .env.example 模板
- [ ] 所有输入用 Zod 验证
- [ ] 使用参数化查询（ORM）
- [ ] 不使用 dangerouslySetInnerHTML（或使用 DOMPurify）
- [ ] 日志中掩码敏感信息
- [ ] 错误消息不暴露内部细节

### 部署前 ✅

- [ ] 生产环境使用密钥管理服务（不是 .env）
- [ ] 启用 HTTPS
- [ ] 配置 CORS 白名单
- [ ] 设置安全响应头（helmet）
- [ ] 启用 Rate Limiting
- [ ] TLS 证书有效且自动更新

### 持续维护 ✅

- [ ] 定期更新依赖（npm audit）
- [ ] 定期轮换 API keys 和密钥
- [ ] 监控安全日志（失败登录、异常请求）
- [ ] 定期安全审计

---

## 常见漏洞

### 1. 硬编码密钥

**风险**: ⚠️ 高  
**检测**: 搜索代码中的 `sk-`, `Bearer`, `password`  
**修复**: 移到环境变量

### 2. SQL 注入

**风险**: ⚠️ 高  
**检测**: 搜索字符串拼接 SQL  
**修复**: 使用 ORM 或参数化查询

### 3. XSS

**风险**: ⚠️ 中  
**检测**: 搜索 `dangerouslySetInnerHTML`  
**修复**: 使用 DOMPurify 清理

### 4. 明文密码存储

**风险**: ⚠️ 高  
**检测**: 检查用户表 schema  
**修复**: 使用 bcrypt/argon2 哈希

### 5. 敏感信息泄露

**风险**: ⚠️ 中  
**检测**: 检查日志和错误响应  
**修复**: 掩码敏感数据，通用错误消息

---

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js 文档](https://helmetjs.github.io/)
