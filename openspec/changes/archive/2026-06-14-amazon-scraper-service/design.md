## Context

当前项目处于 Phase 2 完成状态，已建立：
- ProductService 和 PriceSnapshotService 业务逻辑层
- 完整的 REST API 和测试框架
- 数据库 schema 包括 products 和 price_snapshots 表

**约束：**
- 延续现有技术栈（TypeScript, Express）
- 单用户场景，无需考虑多租户
- 爬取频率需控制，避免被封
- 开发环境下爬虫功能可能受网络限制

**利益相关方：**
- 开发者（需要可靠的爬虫架构）
- 后续 Phase 4 分析服务（依赖自动化数据采集）

## Goals / Non-Goals

**Goals:**
- 实现 Amazon 产品页面自动爬取
- 自动创建价格快照记录
- 提供定时调度和手动触发两种方式
- 错误处理和日志完善
- 100% 测试覆盖

**Non-Goals:**
- 多平台支持（Walmart, eBay 等）- 后续扩展
- 分布式爬虫和代理池 - 当前规模不需要
- 反爬虫对抗策略（验证码识别等）
- 爬取历史记录和统计
- 爬取速率自适应调整

## Decisions

### Decision 1: 使用 Playwright 而非 Puppeteer

**选择：** Playwright

**理由：**
- 官方支持更好，API 更现代
- 跨浏览器支持（虽然当前只用 Chromium）
- 更好的等待机制和选择器
- TypeScript 原生支持

**替代方案：**
- Puppeteer - 更成熟但 API 较老
- Cheerio - 轻量但无法处理 JS 渲染页面
- Axios + Cheerio - Amazon 页面需要 JS 渲染

### Decision 2: 爬虫基类设计

**选择：** 抽象 BaseScraper 基类

**理由：**
- 封装浏览器初始化和关闭逻辑
- 提供通用的文本提取和价格解析方法
- 便于后续扩展其他平台爬虫
- 统一错误处理和日志

**方法：**
- `initialize()` - 启动浏览器
- `close()` - 关闭浏览器
- `scrape(url)` - 抽象方法，由子类实现
- `safeExtractText(selector)` - 安全提取文本
- `parsePrice(text)` - 解析价格数字

### Decision 3: 调度策略

**选择：** node-cron 每小时执行一次

**理由：**
- 简单可靠，适合当前规模
- 避免过于频繁导致被封
- node-cron 轻量级，无需额外依赖

**配置：**
- 生产环境：每小时执行 `0 * * * *`
- 开发环境：默认不启动，手动触发
- 串行爬取，每个产品间隔 2 秒

**替代方案：**
- Bull Queue - 过度设计，需要 Redis
- 基于 Product.checkInterval 动态调度 - 复杂度高，后续优化

### Decision 4: 错误处理策略

**选择：** 优雅降级，不阻塞整体流程

**策略：**
- 单个产品爬取失败不影响其他产品
- 记录详细错误日志
- 返回结构化结果（success/error）
- 不重试（避免加剧封禁风险）

### Decision 5: 数据更新策略

**选择：** 爬取成功后同时更新 Product 和创建 PriceSnapshot

**操作：**
1. 爬取产品数据
2. 创建 price_snapshots 记录
3. 更新 products 表的 currentPrice, lastCheckedAt, title, imageUrl

**理由：**
- Product 表保持最新状态便于查询
- PriceSnapshot 保留历史记录
- 原子操作，保证数据一致性

## Risks / Trade-offs

**[风险] Amazon 反爬虫机制** → 使用 Playwright 模拟真实浏览器，设置合理的 User-Agent，控制爬取频率（每小时一次，产品间隔 2 秒）

**[风险] 页面结构变化** → 使用多个备选选择器（例如价格：`.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice`），第一个匹配即可

**[风险] 爬取失败导致数据中断** → 不删除旧数据，仅在成功时添加新快照。失败只记录日志，不影响现有数据

**[权衡] 串行 vs 并行爬取** → 选择串行以降低被封风险，虽然速度慢但更可靠。当前产品数量不大（预计 <100），可接受

**[权衡] 浏览器资源消耗** → Playwright 消耗内存较大（~100MB per instance），但每次爬取后立即关闭浏览器，峰值可控

**[权衡] 测试真实性** → 集成测试会访问真实 Amazon 页面，可能不稳定。但这是验证爬虫可用性的唯一方式

## Migration Plan

**部署步骤：**
1. 安装新依赖：`npm install playwright node-cron`
2. 初始化 Playwright：`npx playwright install chromium`
3. 部署代码
4. 重启服务
5. 调度器仅在生产环境自动启动

**回滚策略：**
- 调度器独立运行，可随时停止
- 新功能不影响现有 API
- 可安全回滚到 Phase 2 版本

**监控：**
- 检查日志中的爬取成功/失败次数
- 监控 price_snapshots 表增长
- 监控 products 表的 lastCheckedAt 更新
