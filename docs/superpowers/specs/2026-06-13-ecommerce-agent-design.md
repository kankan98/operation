# 跨境电商运营 Agent 系统设计文档

**日期**: 2026-06-13  
**版本**: 1.0  
**状态**: 待审核

---

## 1. 项目概述

### 1.1 项目目标

构建一个基于 AI 的跨境电商运营助手，帮助个人卖家自动化监控竞品、分析市场数据，并提供智能决策建议。

### 1.2 核心功能优先级

1. **竞品监控** - 定时追踪竞品价格、销量、评分变化
2. **自动化执行** - 自动抓取数据、检测异常、生成报警
3. **投流优化** - 广告数据分析和优化建议（第二阶段）
4. **选品分析** - 市场调研和产品潜力评估

### 1.3 用户画像

- **角色**: 个人卖家
- **技术水平**: 会写代码、看配置文件
- **使用场景**: 个人使用，未来可能扩展至团队

### 1.4 技术约束

- **数据来源**: 仅公开网页信息（无 API 授权）
- **AI 能力**: Level 1（数据助手）+ Level 2（分析顾问）
- **部署方式**: Docker 单机部署

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                   跨境电商 Agent 系统                             │
└─────────────────────────────────────────────────────────────────┘

前端层 (Frontend)                后端层 (Backend)
┌─────────────────┐              ┌─────────────────────────────┐
│   Dashboard UI  │◄─── HTTP ────│   Express REST API          │
│   (React/Vue)   │              │   (Node.js + TypeScript)    │
│                 │              │                             │
│ • 监控列表      │              │ • Agent Engine              │
│ • 数据可视化    │              │ • Scraper Service           │
│ • 报警中心      │              │ • Monitoring Scheduler      │
│ • 选品工具      │              │ • Notification Service      │
│ • 聊天对话      │              │                             │
└─────────────────┘              └──────────┬──────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │   SQLite Database    │
                                 │   (data/ecommerce.db)│
                                 └──────────────────────┘
```

### 2.2 技术栈

**后端 (Backend)**
- 运行时: Node.js 18+ + TypeScript
- 框架: Express.js
- AI: @anthropic-ai/sdk (Claude API)
- 数据库: SQLite + Drizzle ORM
- 爬虫: axios + cheerio
- 定时任务: node-cron
- 邮件: nodemailer
- 日志: pino

**前端 (Frontend)**
- 框架: React 18 + TypeScript (Vite)
- UI 组件: Shadcn/ui + Radix UI
- 样式: Tailwind CSS
- 表单: React Hook Form + Zod
- 图表: Recharts
- 状态管理: Zustand
- HTTP: axios

**部署**
- 容器化: Docker + Docker Compose
- 反向代理: Nginx
- 进程管理: 内置于 Docker

---

## 3. 数据库设计

### 3.1 核心表结构

**products (产品表)**
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  product_url TEXT UNIQUE NOT NULL,
  asin TEXT,
  title TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  current_price REAL,
  currency TEXT DEFAULT 'USD',
  is_monitoring BOOLEAN DEFAULT 0,
  monitor_type TEXT,
  check_interval INTEGER DEFAULT 24,
  user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  last_checked_at INTEGER,
  metadata TEXT
);
```

**price_snapshots (价格快照表)**
```sql
CREATE TABLE price_snapshots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  price REAL NOT NULL,
  original_price REAL,
  discount_rate REAL,
  rating REAL,
  reviews_count INTEGER,
  sales_rank INTEGER,
  sales_category TEXT,
  availability TEXT,
  seller_count INTEGER,
  timestamp INTEGER NOT NULL,
  snapshot_source TEXT DEFAULT 'scheduled',
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**alerts (报警表)**
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT,
  product_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data_snapshot TEXT,
  is_read BOOLEAN DEFAULT 0,
  is_archived BOOLEAN DEFAULT 0,
  notified_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**alert_rules (报警规则表)**
```sql
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  conditions TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  notification TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
```

**chat_sessions (会话表)**
```sql
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT,
  user_id TEXT,
  context_summary TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
```

**chat_messages (消息表)**
```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls TEXT,
  tool_results TEXT,
  tokens_used INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);
```

**monitor_tasks (监控任务表)**
```sql
CREATE TABLE monitor_tasks (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  task_name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  config TEXT,
  enabled BOOLEAN DEFAULT 1,
  last_run_at INTEGER,
  last_status TEXT,
  next_run_at INTEGER,
  created_at INTEGER NOT NULL
);
```

**其他支持表**: product_relations, product_tags, product_tags_mapping, analysis_reports, market_trends, task_logs, users, platform_configs, system_settings, api_usage_logs

### 3.2 索引策略

```sql
CREATE INDEX idx_products_monitoring ON products(is_monitoring, user_id);
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_price_snapshots_product_time ON price_snapshots(product_id, timestamp DESC);
CREATE INDEX idx_alerts_unread ON alerts(is_read, created_at DESC);
CREATE INDEX idx_alerts_product ON alerts(product_id, created_at DESC);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, timestamp);
CREATE INDEX idx_task_logs_task_time ON task_logs(task_id, started_at DESC);
```

---

## 4. API 设计

### 4.1 端点规划

**基础路径**: `http://localhost:3001/api`

**产品监控**
- `GET /products` - 获取产品列表
- `POST /products` - 添加产品
- `GET /products/:id` - 获取产品详情
- `PATCH /products/:id` - 更新产品
- `DELETE /products/:id` - 删除产品
- `GET /products/:id/history` - 获取历史数据
- `POST /products/:id/check` - 手动检查
- `GET /products/:id/competitors` - 获取竞品

**报警**
- `GET /alerts` - 获取报警列表
- `GET /alerts/:id` - 获取报警详情
- `PATCH /alerts/:id` - 标记已读/归档
- `DELETE /alerts/:id` - 删除报警
- `GET /alert-rules` - 获取规则列表
- `POST /alert-rules` - 创建规则

**分析**
- `GET /analysis/price-trends` - 价格趋势分析
- `GET /analysis/competitor-compare` - 竞品对比
- `POST /analysis/market-research` - 市场调研

**AI Agent**
- `GET /chat/sessions` - 获取会话列表
- `POST /chat/sessions` - 创建会话
- `GET /chat/sessions/:id/messages` - 获取消息
- `POST /chat/sessions/:id/messages` - 发送消息

**任务调度**
- `GET /tasks` - 获取任务列表
- `POST /tasks` - 创建任务
- `PATCH /tasks/:id` - 更新任务
- `POST /tasks/:id/run` - 手动触发

**系统**
- `GET /settings` - 获取系统设置
- `PATCH /settings` - 更新设置
- `GET /stats/dashboard` - Dashboard 统计

### 4.2 响应格式

**成功响应**
```json
{
  "data": { /* 返回数据 */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**错误响应**
```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "产品不存在",
    "details": { /* 可选的错误详情 */ }
  }
}
```

---

## 5. Agent 设计

### 5.1 工作流程

```
用户输入
   │
   ▼
对话管理器
   │
   ▼
Claude API (Tool Use)
   │
   ├─ 需要工具? ──> 工具执行器 ──> 继续对话
   │                   │
   │                   ▼
   │              返回工具结果
   │
   ▼
返回文本回复
```

### 5.2 工具定义

1. **searchProducts** - 搜索产品
2. **getProductDetails** - 获取产品详情
3. **addProductMonitoring** - 添加监控
4. **getCompetitorAnalysis** - 竞品分析
5. **analyzePriceTrend** - 价格趋势分析
6. **getMarketInsights** - 市场调研
7. **createAlert** - 创建报警规则
8. **generateReport** - 生成报告
9. **getAlertsList** - 获取报警列表
10. **queryDatabase** - 数据库查询

### 5.3 System Prompt

```
你是一个专业的跨境电商运营 AI Agent，帮助卖家进行产品监控、竞品分析和市场调研。

核心能力:
1. 竞品监控 - 持续追踪竞品变化，识别异常，主动推送报警
2. 数据分析 - 价格趋势预测、竞争格局分析、市场机会识别
3. 选品建议 - 基于数据评估新品潜力、分析竞争强度和利润空间

工作原则:
- 数据驱动: 所有建议基于真实数据和历史趋势
- 主动洞察: 不只被动回答，要主动发现值得关注的变化
- 务实可行: 提供具体、可执行的建议
- 风险提示: 标注不确定因素和潜在风险

输出格式:
**现状**: 描述当前情况
**洞察**: 数据背后的含义
**建议**: 具体行动建议
**风险**: 需要注意的不确定因素
```

### 5.4 RAG 策略

**MVP 阶段**: 不实现 RAG，依赖 Claude 内置知识 + System Prompt 注入基础知识

**未来扩展**: 如果需要注入大量领域知识或用户特定 SOP，可加入轻量级知识库（SQLite + sqlite-vss）

---

## 6. 数据采集 (Scraper) 设计

### 6.1 平台优先级

1. Amazon
2. Walmart
3. AliExpress
4. eBay
5. Lazada

### 6.2 架构

```
ScraperService
    │
    ├─ AmazonScraper
    ├─ WalmartScraper
    └─ AliExpressScraper
        │
        └─ Anti-Bot Strategies
            • 请求限流
            • User-Agent 轮换
            • 代理池(可选)
            • 错误重试
```

### 6.3 反爬策略

**MVP 必需**:
1. 请求限流 (RateLimiter) - 每分钟 10 个请求
2. User-Agent 轮换
3. 错误重试 (指数退避)
4. 数据质量验证
5. 并发控制
6. 监控和日志

**第二阶段**:
7. 代理池支持
8. 缓存机制 (TTL: 1小时)
9. 配置化选择器

### 6.4 数据标准化

所有平台的数据统一为 `ProductDetail` 接口:

```typescript
interface ProductDetail {
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  currency: string;
  rating?: number;
  reviewsCount?: number;
  salesRank?: number;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  images: string[];
  // ...
}
```

---

## 7. 定时监控与通知

### 7.1 默认任务

```typescript
[
  {
    name: '每日产品检查',
    cron: '0 9 * * *',        // 每天早上 9 点
    type: 'batch_check',
  },
  {
    name: '重点产品每小时检查',
    cron: '0 * * * *',        // 每小时
    type: 'batch_check',
    config: { tags: ['priority'] },
  },
  {
    name: '每周分析报告',
    cron: '0 18 * * 5',       // 每周五下午 6 点
    type: 'report_generation',
  },
  {
    name: '每月数据清理',
    cron: '0 2 1 * *',        // 每月 1 号凌晨 2 点
    type: 'data_cleanup',
  },
]
```

### 7.2 异常检测逻辑

**价格变化**:
- 下降 ≥ 10% → 警告级报警
- 上涨 ≥ 20% → 信息级报警

**库存状态**:
- 从有货变为断货 → 严重级报警

**销量排名**:
- 上升 > 100 位 → 信息级报警
- 下降 > 100 位 → 警告级报警

### 7.3 通知方式

1. **Dashboard 实时推送** (WebSocket)
2. **邮件通知**:
   - 严重级报警 → 立即发送
   - 警告级报警 → 加入队列，批量发送
   - 每日汇总邮件

---

## 8. 前端设计

### 8.1 页面结构

```
/dashboard              仪表盘总览
/products               产品监控列表
/products/:id           产品详情
/alerts                 报警中心
/analysis/market        市场调研(选品)
/analysis/competitor    竞品分析
/reports                分析报告
/chat                   AI 对话
/settings               系统设置
```

### 8.2 核心组件

- **AppLayout** - 主布局（侧边栏+顶栏）
- **PriceTrendChart** - 价格趋势图
- **ProductCard** - 产品卡片
- **AlertCard** - 报警卡片
- **ChatWindow** - 聊天窗口

### 8.3 Shadcn/ui 集成

使用 Shadcn/ui 组件库 + Tailwind CSS:
- Button, Card, Dialog, Table, Badge, Select
- Form (React Hook Form + Zod)
- Charts (Recharts)

---

## 9. Docker 部署

### 9.1 项目结构

```
ecommerce-agent/
├── backend/
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── README.md
```

### 9.2 Docker Compose 配置

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs
    env_file:
      - ./backend/.env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 9.3 启动流程

```bash
# 1. 克隆项目
git clone <repo>
cd ecommerce-agent

# 2. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 ANTHROPIC_API_KEY

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问
# http://localhost:3000
```

### 9.4 备份策略

```bash
# 每天凌晨 2 点自动备份数据库
0 2 * * * docker exec ecommerce-agent-backend-1 \
  tar -czf /app/data/backup-$(date +\%Y\%m\%d).tar.gz \
  /app/data/ecommerce.db
```

---

## 10. 环境配置

### 10.1 后端环境变量

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-opus-4-8

# 数据库
DATABASE_PATH=./data/ecommerce.db

# 邮件
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_TO=your-email@gmail.com

# 爬虫
SCRAPER_RATE_LIMIT=10
SCRAPER_CONCURRENT=5
SCRAPER_TIMEOUT=10000

# 代理 (可选)
PROXY_ENABLED=false
PROXY_LIST=http://proxy1:8080

# 日志
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 10.2 前端环境变量

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## 11. 开发路线图

### Phase 1 (Week 1-2): 后端核心
- 数据库设计和迁移
- Scraper 基础实现 (Amazon)
- Agent 核心 + 基础工具
- API 路由

### Phase 2 (Week 3-4): 监控自动化
- 定时任务调度器
- 批量监控逻辑
- 报警检测和通知
- 邮件服务

### Phase 3 (Week 4-5): 前端 Dashboard
- 用 frontend-design 生成页面
- Dashboard 总览
- 产品列表和详情
- 报警中心

### Phase 4 (Week 6): 联调和优化
- 前后端集成
- 数据质量验证
- 性能优化
- 测试和修复

---

## 12. 风险与限制

### 12.1 技术风险

**爬虫被封**
- 风险: Amazon 等平台反爬虫严格
- 缓解: 限流、User-Agent 轮换、代理池
- 监控: 失败率超过 50% 时报警

**数据质量**
- 风险: 页面改版导致解析失败
- 缓解: 数据验证、多选择器备用、监控日志
- 应急: 手动更新选择器配置

**API 成本**
- 风险: Claude API Token 消耗
- 缓解: 记录 API 使用量、设置预算提醒
- 优化: 缓存常见查询结果

### 12.2 业务限制

- **数据来源**: 仅公开数据，无法获取真实销量
- **平台覆盖**: 初期只支持 Amazon，其他平台逐步添加
- **用户规模**: 单用户设计，多用户需要架构调整

---

## 13. 后续扩展

### 13.1 第二阶段功能

1. **投流优化** - 手动上传广告数据，AI 分析
2. **更多平台** - Walmart, AliExpress, eBay
3. **代理池** - 提升爬虫稳定性
4. **移动端** - 响应式设计或原生 App

### 13.2 第三阶段功能

1. **多用户支持** - 用户认证、权限管理
2. **API 开放** - 提供 API 供第三方调用
3. **知识库 (RAG)** - 注入用户特定的运营经验
4. **广告平台集成** - 对接 Amazon Ads API

---

## 附录 A: 技术栈总览

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 组件 | Shadcn/ui + Radix UI |
| 样式 | Tailwind CSS |
| 表单 | React Hook Form + Zod |
| 图表 | Recharts |
| 状态 | Zustand |
| HTTP | Axios |
| 后端框架 | Node.js 18+ + Express + TypeScript |
| AI | @anthropic-ai/sdk (Claude Opus 4.8) |
| 数据库 | SQLite + Drizzle ORM |
| 爬虫 | Axios + Cheerio |
| 定时任务 | node-cron |
| 邮件 | nodemailer |
| 日志 | pino |
| 部署 | Docker + Docker Compose |

---

## 附录 B: 参考资料

- Claude API 文档: https://docs.anthropic.com/
- Shadcn/ui: https://ui.shadcn.com/
- Drizzle ORM: https://orm.drizzle.team/
- Recharts: https://recharts.org/

---

**设计文档完成**
