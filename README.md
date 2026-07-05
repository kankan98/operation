# E-commerce Price Monitoring System

一个完整的电商价格监控系统，支持自动爬取、价格分析、智能警报和可视化仪表板。

![Status](https://img.shields.io/badge/status-production--ready-success)
![Backend Tests](https://img.shields.io/badge/backend%20tests-128%20passing-success)
![Frontend Tests](https://img.shields.io/badge/frontend%20tests-71%20passing-success)
![Coverage](https://img.shields.io/badge/coverage-95%25-success)
![Chat Feature](https://img.shields.io/badge/chat%20feature-89%25%20complete-brightgreen)

---

## 📋 项目概览

### 核心功能

✅ **多平台产品监控**
- Amazon 为首个接入平台，架构预留 Walmart、eBay、AliExpress 等平台扩展
- 通过 provider chain 采集产品价格、库存、评分等信息
- 可配置的监控频率

✅ **价格分析引擎**
- 实时价格统计（最高/最低/平均/当前价格）
- 价格变化趋势分析
- 历史价格图表可视化

✅ **选品机会评分 MVP**
- 当前 OpenSpec change: `product-opportunity-scoring`
- 基于价格走势、采集健康、评分/评论代理信号和缺失信号生成可解释候选排行
- 提供 `/opportunities` 工作台、机会 API 和 Chat 工具解释
- 评分会区分 score 与 confidence，不把缺失的利润、销量或需求数据当成事实
- 评分细节见 [选品机会评分说明](./docs/product-opportunity-scoring.md)

✅ **智能警报系统**
- 灵活的警报规则引擎（价格阈值、价格变化率、库存变化）
- 多级别警报（critical, warning, info）
- 自动触发和重复警报防护

✅ **现代化 Dashboard**
- React 18 + TypeScript 前端
- 响应式设计（移动/平板/桌面）
- 实时数据可视化（Recharts 图表）
- 完整的产品和警报管理界面

✅ **AI 对话助手**
- 基于 Claude Opus 4.8 的智能问答
- 自然语言查询产品和价格数据
- 10+ 专业工具支持（搜索、分析、警报、报告）
- 实时流式响应和工具调用可视化
- Chat 工作台：会话分组、搜索、置顶、任务面板、工具执行双卡片同步
- 会话历史管理、懒创建新会话和自动标题生成

---

## 🏗️ 技术架构

### 后端技术栈

| 技术 | 用途 |
|------|------|
| **Node.js + Express** | RESTful API 服务器 |
| **TypeScript** | 类型安全 |
| **SQLite + Drizzle ORM** | 数据持久化 |
| **@anthropic-ai/sdk** | Claude AI 集成 |
| **Playwright** | 浏览器采集 fallback |
| **Provider Chain** | 合规数据源、缓存和浏览器 fallback 编排 |
| **Vitest** | 单元测试和集成测试 |
| **Winston** | 日志管理 |

### 前端技术栈

| 技术 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **React Router** | 路由管理 |
| **Zustand** | 状态管理 |
| **React Query** | 数据获取和缓存 |
| **Recharts** | 数据可视化 |
| **Tailwind CSS v4** | 样式框架 |
| **React Hook Form + Zod** | 表单管理和验证 |
| **react-markdown** | Markdown 渲染（AI 响应） |
| **Vitest + React Testing Library** | 组件测试 |

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- Git

### 安装步骤

#### 1. 克隆仓库

```bash
git clone <repository-url>
cd AI运营
```

#### 2. 安装后端

```bash
cd backend
npm install
```

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# AI 配置 (使用 Claude)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-opus-4-8
```

**获取 API Key**:
- **Claude**: 访问 https://console.anthropic.com/settings/keys 创建 API Key
- **DeepSeek (兼容 Anthropic 协议)**: 访问 https://platform.deepseek.com/api_keys

详细配置说明请查看 `backend/.env.example`。

运行数据库迁移：

```bash
npm run db:migrate
```

启动后端服务器：

```bash
npm run dev
```

后端运行在 http://localhost:3001

#### 3. 安装前端

打开新终端：

```bash
cd frontend
npm install
```

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

启动前端开发服务器：

```bash
npm run dev
```

前端运行在 http://localhost:3000

#### 4. 访问应用

打开浏览器访问 http://localhost:3000

---

## 📚 API 文档

### 产品管理

```bash
# 创建产品
POST /api/products
Content-Type: application/json

{
  "platform": "amazon",
  "productUrl": "https://www.amazon.com/dp/B08N5WRWNW",
  "asin": "B08N5WRWNW",
  "title": "Product Title",
  "currency": "USD",
  "isMonitoring": true,
  "checkInterval": 3600
}

# 获取产品列表
GET /api/products?page=1&limit=20&platform=amazon

# 获取单个产品
GET /api/products/:id

# 更新产品
PATCH /api/products/:id

# 删除产品
DELETE /api/products/:id
```

### 价格快照

```bash
# 创建价格快照
POST /api/price-snapshots

# 获取产品的价格历史
GET /api/price-snapshots?productId=xxx&limit=30
```

### 价格分析

```bash
# 获取价格统计
GET /api/analysis/price-stats/:productId
```

### 警报规则

```bash
# 创建警报规则
POST /api/alert-rules

{
  "productId": "xxx",
  "ruleType": "price_threshold",
  "condition": "below",
  "threshold": 100,
  "enabled": true,
  "severity": "info"
}

# 获取规则列表
GET /api/alert-rules?productId=xxx&enabled=true
```

### 警报

```bash
# 获取警报列表
GET /api/alerts?severity=critical&isRead=false

# 标记为已读
PATCH /api/alerts/:id
{
  "isRead": true
}

# 删除警报
DELETE /api/alerts/:id
```

### 商品数据采集

```bash
# 手动爬取单个产品
POST /api/scraper/product/:productId

# 批量采集默认禁用；显式设置 ACQUISITION_BULK_ENABLED=true 后才会入队
POST /api/scraper/all

# 查看单个产品最近采集尝试
GET /api/scraper/product/:productId/attempts

# 查看采集任务状态
GET /api/scraper/jobs/:jobId
```

### Chat API (AI 对话助手)

```bash
# 创建会话
POST /api/chat/sessions
{
  "title": "Product Analysis"  # 可选
}

# 获取会话列表
GET /api/chat/sessions?page=1&limit=20

# 更新会话置顶、标签、预览
PATCH /api/chat/sessions/:id
{
  "isPinned": true,
  "tags": ["amazon"],
  "lastMessagePreview": "分析完成"
}

# 创建流式响应（SSE v2.0）
POST /api/chat/stream
{
  "sessionId": "optional-session-id",
  "content": "Show me all Amazon products under $100"
}

# 建立 SSE 连接
GET /api/chat/streams/:streamId

# 获取消息历史
GET /api/chat/sessions/:id/messages

# 获取会话任务
GET /api/tasks/:sessionId

# 创建任务
POST /api/tasks

# 更新任务状态
PATCH /api/tasks/:id
```

**AI Agent 能力**:
- 🔍 搜索产品："帮我找所有 Amazon 上低于 $100 的 AirPods"
- 📊 分析趋势："分析一下这个产品的价格趋势"
- 🔔 创建警报："当价格低于 $200 时提醒我"
- 📈 生成报告："生成今天的价格变动报告"
- 🤖 自然对话：支持上下文理解和多轮对话

详细 API 文档请查看：
- [后端 README](./backend/README.md)
- [Chat Redesign API](./docs/api/chat-redesign-api.md)
- [SSE 流式协议](./docs/api/sse-streaming.md)
- [E2E 测试报告](./E2E_TEST_REPORT.md)

---

## 🧪 测试

### 后端测试

```bash
cd backend
npm test                 # 运行所有测试
npm run test:coverage    # 生成覆盖率报告
```

**测试覆盖率**: 
- 120 个测试（116 通过，4 跳过）
- 语句覆盖率: 82.7%
- 分支覆盖率: 71.4%
- 函数覆盖率: 80.5%
- 行覆盖率: 83.4%

详细测试指南: [backend/tests/README.md](./backend/tests/README.md)

### 前端测试

```bash
cd frontend
npm test                 # 运行所有测试
npm run test:e2e         # 运行 Chat Playwright E2E
npm run test:coverage    # 生成覆盖率报告
```

**测试覆盖率**: 
- 组件测试和集成测试覆盖核心功能
- 覆盖率目标: 80%+ (语句、函数、行), 70%+ (分支)

详细测试指南: [frontend/tests/README.md](./frontend/tests/README.md)

### 端到端测试

参考 [E2E_TEST_REPORT.md](./E2E_TEST_REPORT.md) 查看完整的端到端测试流程。

Chat E2E 测试位于 `frontend/e2e/chat.spec.ts`，覆盖创建会话、发送消息、工具执行卡、置顶分组、会话搜索、任务详情滚动、会话切换和响应式抽屉。

### Chat 文档

- [用户操作手册](./docs/guides/chat-user-guide.md)
- [任务管理扩展指南](./docs/development/task-management-extension.md)
- [已知问题和限制](./docs/chat-known-limitations.md)

---

## 📁 项目结构

```
AI运营/
├── backend/                 # 后端 Express API
│   ├── src/
│   │   ├── db/             # 数据库 schema 和迁移
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑层
│   │   ├── middleware/     # Express 中间件
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   └── data.db             # SQLite 数据库
│
├── frontend/               # 前端 React 应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── services/      # API 客户端
│   │   ├── stores/        # Zustand 状态管理
│   │   └── types/         # TypeScript 类型
│   └── dist/              # 生产构建输出
│
├── openspec/              # OpenSpec 规范和变更管理
│   ├── specs/            # 主规范文件
│   └── changes/          # 变更历史
│       └── archive/      # 已归档的变更
│
└── docs/                  # 项目文档
    └── superpowers/      # 开发计划和规范
```

---

## 🎨 界面截图

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

### 产品列表
![Products](./docs/screenshots/products.png)

### 产品详情和价格图表
![Product Detail](./docs/screenshots/product-detail.png)

### 警报中心
![Alerts](./docs/screenshots/alerts.png)

---

## 📦 生产部署

### 构建

```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### 环境变量

**环境变量**:
```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn
DATABASE_URL=./data.db

# AI 配置
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-prod-xxxxx
ANTHROPIC_MODEL=claude-opus-4-8
```

**前端 `.env.production`**:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Docker 部署（TODO）

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

---

## 🔧 配置选项

### 商品数据采集配置

在 `backend/src/config.ts` 中配置：

```typescript
export const acquisitionConfig = {
  providerOrder: ['rainforest', 'amazon-browser'],
  browserFallbackEnabled: true,
  maxAttempts: 3,
  cacheFreshnessMs: 6 * 60 * 60 * 1000,
  rainforest: {
    marketplace: 'amazon.com',
    timeoutMs: 30000,
    captureDiagnostics: true,
  },
};
```

采集层采用 provider chain：`rainforest` 优先获取 Amazon 当前商品数据，未配置 `RAINFOREST_API_KEY` 时返回 `provider_unavailable` 并让路给 `amazon-browser` fallback；缓存 fallback 兜底，Playwright 浏览器采集作为最后 fallback。更多路线说明见 [当前路线计划](./docs/roadmap.md)。

### 警报规则类型

| 规则类型 | 描述 |
|---------|------|
| `price_threshold` | 价格高于/低于阈值 |
| `price_change_percent` | 价格涨跌幅超过百分比 |
| `stock_change` | 库存状态变化 |

---

## 🐛 已知问题

### 商品数据采集限制

Amazon 等平台会出现验证码、Robot Check、地区限制、限流和页面结构变化。当前系统会把这些状态分类为结构化失败并记录 attempt 诊断，然后退避、切换 provider 或使用允许范围内的缓存 fallback。

推荐路线是优先接入合规数据源，例如 Keepa、Rainforest API、Amazon Product Advertising API、Amazon SP-API 或 eBay Browse API。浏览器采集只作为受控 fallback，不作为绕过验证码或反爬机制的主方案。

详见 [当前路线计划](./docs/roadmap.md#商品数据采集路线)。

---

## 🗺️ 开发路线图

### Phase 1-5: 已完成 ✅
- ✅ 后端基础设施
- ✅ 价格快照服务
- ✅ Amazon 浏览器采集 fallback
- ✅ Rainforest Amazon provider
- ✅ 价格分析和警报服务
- ✅ 前端 Dashboard UI
- ✅ AI 对话助手（Claude 集成）
- ✅ Chat 工作台重构
- ✅ 可靠商品数据采集基础架构
- ✅ 产品详情采集观测与 Chat 采集解释

### Phase 6: 选品机会评分 ✅
- [x] 计算 product opportunity score、confidence、factor breakdown 和 recommended action
- [x] 提供选品机会工作台
- [x] 在 Chat 工具中解释机会排行和单产品评分

### 方向调整（2026-06-30）🔄

本项目定位为**个人自用的选品研究工具（准确性 > 规模，无付费数据源预算）**，已转向**手动优先的研究助手**。当前主线：数据来源模型 → 手动录入一等流程 → 透明评分 → 砍掉自动采集/队列/调度等死重量。

下列原 Phase 7-9 多为面向规模化/多租户/运维的工程，对个人自用属于过度工程，**已降级/搁置**：

- ~~平台与数据源扩展（Walmart/AliExpress 等新 crawler）~~ — 不再新增爬虫；内置 Keepa provider 在愿意付费时可一键启用为主数据源
- ~~生产部署（Docker、CI/CD、监控聚合）~~ — 个人自用无需
- ~~多用户认证授权、多租户~~ — 单人使用无需

详细方向与设计见 [当前路线计划](./docs/roadmap.md) 和 [手动优先研究助手设计](./docs/superpowers/specs/2026-06-29-manual-first-research-assistant-design.md)。

---

## 📚 开发规范

本项目遵循完整的开发规范体系，确保代码质量和团队协作效率。

### 核心文档

| 分类 | 文档 | 说明 |
|------|------|------|
| **质量保证** | [测试标准](./docs/quality/testing-standards.md) | 覆盖率标准、测试金字塔、命名规范 |
| | [代码审查清单](./docs/quality/code-review-checklist.md) | Blocker/Major/Minor 分级审查 |
| | [质量门禁](./docs/quality/quality-gates.md) | CI 检查标准、合并要求 |
| | [性能标准](./docs/quality/performance-standards.md) | API 响应时间、前端性能指标 |
| | [安全规范](./docs/quality/security-guidelines.md) | 环境变量、认证授权、数据验证 |
| **开发规范** | [错误处理](./docs/development/error-handling.md) | 后端/前端错误处理模式 |

**完整文档目录**: 查看 [docs/README.md](./docs/README.md)

### 快速开始

1. **新人入职**: 阅读 [快速开始指南](./docs/guides/getting-started.md)
2. **添加功能**: 参考 [架构文档](./docs/architecture/overview.md) 和 [常见任务](./docs/guides/common-tasks.md)
3. **代码审查**: 使用 [代码审查清单](./docs/quality/code-review-checklist.md)
4. **问题排查**: 查看 [问题排查手册](./docs/guides/troubleshooting.md)

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. **阅读开发规范**（见上方"开发规范"章节）
4. 提交更改 (`git commit -m 'feat: add some amazing feature'` - 遵循 [Conventional Commits](./docs/workflow/git-workflow.md)）
5. 确保所有测试通过和覆盖率达标
6. 推送到分支 (`git push origin feature/AmazingFeature`)
7. 开启 Pull Request（使用 [PR 模板](./docs/workflow/pr-process.md)）

**质量要求**:
- ✅ 所有测试通过
- ✅ 代码覆盖率达标（后端 ≥85%、前端 ≥80%）
- ✅ 通过 Lint 和 TypeScript 检查
- ✅ 至少 1 人 Code Review Approve

详见 [质量门禁标准](./docs/quality/quality-gates.md)。

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

项目链接: [GitHub Repository](#)

---

## 🙏 致谢

- [React](https://react.dev/) - UI 框架
- [Express](https://expressjs.com/) - Web 框架
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库
- [Vitest](https://vitest.dev/) - 测试框架

---

**⚡ Built with Claude Code**
