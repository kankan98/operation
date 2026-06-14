## 1. 项目初始化

- [x] 1.1 初始化 Node.js 项目，安装依赖（express, typescript, drizzle-orm, better-sqlite3, pino, dotenv, vitest）
- [x] 1.2 配置 TypeScript (tsconfig.json)
- [x] 1.3 创建项目目录结构（src/config, src/db, src/routes, src/services, src/middleware, src/utils, src/types）
- [x] 1.4 创建 .env.example 和 .gitignore
- [x] 1.5 配置 package.json scripts (dev, build, test, db:generate, db:migrate)

## 2. 配置管理和日志

- [x] 2.1 实现 config/index.ts - 加载环境变量并导出配置对象
- [x] 2.2 实现 config 验证函数 validateConfig()
- [x] 2.3 实现 utils/logger.ts - 配置 pino 日志器
- [x] 2.4 编写 config 单元测试
- [x] 2.5 验证配置加载和日志输出正常

## 3. 数据库 Schema

- [x] 3.1 定义 TypeScript 类型（types/index.ts）- Platform, Product, Alert 等接口
- [x] 3.2 实现 db/schema.ts - 定义 products 表
- [x] 3.3 实现 db/schema.ts - 定义 price_snapshots 表
- [x] 3.4 实现 db/schema.ts - 定义 alerts 表
- [x] 3.5 创建 drizzle.config.ts 配置文件
- [x] 3.6 实现 db/index.ts - 创建数据库连接
- [x] 3.7 实现 db/migrate.ts - 迁移脚本
- [x] 3.8 生成迁移文件（npm run db:generate）
- [x] 3.9 运行迁移创建数据库（npm run db:migrate）

## 4. Express 应用框架

- [x] 4.1 实现 middleware/errorHandler.ts - AppError 类和错误处理中间件
- [x] 4.2 实现 middleware/logger.ts - 请求日志中间件
- [x] 4.3 实现 app.ts - 创建 Express 应用，配置中间件
- [x] 4.4 实现 index.ts - 应用入口，启动服务器
- [x] 4.5 测试服务器启动和健康检查端点

## 5. 数据验证工具

- [x] 5.1 实现 utils/validation.ts - validateProductUrl 函数
- [x] 5.2 实现 utils/validation.ts - validateEmail 函数
- [x] 5.3 实现 utils/validation.ts - validatePlatform 函数
- [x] 5.4 实现 utils/validation.ts - sanitizeString 函数
- [x] 5.5 实现 utils/validation.ts - validatePositiveNumber 函数
- [x] 5.6 编写验证工具单元测试
- [x] 5.7 验证所有验证函数正常工作

## 6. 产品服务层

- [x] 6.1 编写 ProductService 单元测试（tests/productService.test.ts）
- [x] 6.2 实现 services/productService.ts - createProduct 方法
- [x] 6.3 实现 services/productService.ts - getProductById 方法
- [x] 6.4 实现 services/productService.ts - listProducts 方法（支持过滤和分页）
- [x] 6.5 实现 services/productService.ts - updateProduct 方法
- [x] 6.6 实现 services/productService.ts - deleteProduct 方法
- [x] 6.7 运行测试验证 ProductService 功能

## 7. 产品 API 路由

- [x] 7.1 编写产品 API 集成测试（tests/products.api.test.ts）
- [x] 7.2 实现 routes/products.ts - POST /api/products（创建产品）
- [x] 7.3 实现 routes/products.ts - GET /api/products（列表查询）
- [x] 7.4 实现 routes/products.ts - GET /api/products/:id（获取详情）
- [x] 7.5 实现 routes/products.ts - PATCH /api/products/:id（更新产品）
- [x] 7.6 实现 routes/products.ts - DELETE /api/products/:id（删除产品）
- [x] 7.7 创建 routes/index.ts 注册路由
- [x] 7.8 更新 app.ts 使用 API 路由
- [x] 7.9 运行集成测试验证 API 端点
- [x] 7.10 手动测试 API（使用 curl 或 Postman）

## 8. 报警服务层

- [x] 8.1 编写 AlertService 单元测试（tests/alertService.test.ts）
- [x] 8.2 实现 services/alertService.ts - createAlert 方法
- [x] 8.3 实现 services/alertService.ts - getAlertById 方法
- [x] 8.4 实现 services/alertService.ts - listAlerts 方法（支持过滤和分页）
- [x] 8.5 实现 services/alertService.ts - markAsRead 方法
- [x] 8.6 实现 services/alertService.ts - markAsArchived 方法
- [x] 8.7 实现 services/alertService.ts - deleteAlert 方法
- [x] 8.8 运行测试验证 AlertService 功能

## 9. 报警 API 路由

- [x] 9.1 实现 routes/alerts.ts - GET /api/alerts（列表查询）
- [x] 9.2 实现 routes/alerts.ts - GET /api/alerts/:id（获取详情）
- [x] 9.3 实现 routes/alerts.ts - PATCH /api/alerts/:id（更新状态）
- [x] 9.4 实现 routes/alerts.ts - DELETE /api/alerts/:id（删除报警）
- [x] 9.5 在 routes/index.ts 注册报警路由
- [x] 9.6 手动测试报警 API

## 10. 集成测试和文档

- [x] 10.1 编写端到端集成测试（tests/integration.test.ts）
- [x] 10.2 运行所有测试,确保通过率 100%
- [x] 10.3 创建 README.md - 项目说明和快速开始指南
- [x] 10.4 完善 .env.example - 添加所有配置项说明
- [x] 10.5 手动验收测试（启动服务器，测试完整流程）
- [x] 10.6 检查日志输出是否正常
- [x] 10.7 检查数据库数据是否正确存储
