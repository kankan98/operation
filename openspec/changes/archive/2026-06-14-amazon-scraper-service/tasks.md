## 1. 安装依赖

- [x] 1.1 安装 playwright 和 node-cron
- [x] 1.2 安装开发依赖 @playwright/test 和 @types/node-cron
- [x] 1.3 初始化 Playwright（安装 Chromium）
- [x] 1.4 提交依赖更新

## 2. 类型定义

- [x] 2.1 在 backend/src/types/index.ts 中添加 ScrapedProductData 接口
- [x] 2.2 在 backend/src/types/index.ts 中添加 ScrapeResult 接口
- [x] 2.3 提交类型定义

## 3. 爬虫基类实现

- [x] 3.1 创建 backend/src/scrapers/baseScraper.ts 文件
- [x] 3.2 实现 BaseScraper 类的 initialize 方法（启动浏览器）
- [x] 3.3 实现 BaseScraper 类的 close 方法（关闭浏览器）
- [x] 3.4 实现 BaseScraper 类的 safeExtractText 辅助方法
- [x] 3.5 实现 BaseScraper 类的 parsePrice 辅助方法
- [x] 3.6 提交爬虫基类

## 4. Amazon 爬虫测试

- [x] 4.1 创建 backend/tests/amazonScraper.test.ts 文件
- [x] 4.2 编写 AmazonScraper 提取价格的测试用例
- [x] 4.3 编写 AmazonScraper 处理无效 URL 的测试用例
- [x] 4.4 运行测试确认失败
- [x] 4.5 提交测试文件

## 5. Amazon 爬虫实现

- [x] 5.1 创建 backend/src/scrapers/amazonScraper.ts 文件
- [x] 5.2 实现 AmazonScraper 类继承 BaseScraper
- [x] 5.3 实现 scrape 方法（访问页面、提取价格、标题、评分等）
- [x] 5.4 运行测试验证通过
- [x] 5.5 提交 Amazon 爬虫实现

## 6. ScraperService 测试

- [x] 6.1 创建 backend/tests/scraperService.test.ts 文件
- [x] 6.2 编写 scrapeProduct 方法的测试用例（成功场景）
- [x] 6.3 编写 scrapeProduct 方法的测试用例（产品不存在）
- [x] 6.4 编写 scrapeAllMonitoringProducts 方法的测试用例
- [x] 6.5 运行测试确认失败
- [x] 6.6 提交测试文件

## 7. ScraperService 实现

- [x] 7.1 创建 backend/src/services/scraperService.ts 文件
- [x] 7.2 实现 scrapeProduct 方法（获取产品、初始化爬虫、爬取、创建快照、更新产品）
- [x] 7.3 实现 scrapeAllMonitoringProducts 方法（获取所有监控产品、串行爬取）
- [x] 7.4 运行测试验证通过
- [x] 7.5 提交 ScraperService 实现

## 8. SchedulerService 测试

- [x] 8.1 创建 backend/tests/schedulerService.test.ts 文件
- [x] 8.2 编写 start/stop/isRunning 方法的测试用例
- [x] 8.3 运行测试确认失败
- [x] 8.4 提交测试文件

## 9. SchedulerService 实现

- [x] 9.1 创建 backend/src/services/schedulerService.ts 文件
- [x] 9.2 实现 start 方法（创建 cron 任务，每小时执行）
- [x] 9.3 实现 stop 方法（停止 cron 任务）
- [x] 9.4 实现 isRunning 和 triggerNow 方法
- [x] 9.5 运行测试验证通过
- [x] 9.6 提交 SchedulerService 实现

## 10. API 路由实现

- [x] 10.1 创建 backend/src/routes/scraper.ts 文件
- [x] 10.2 实现 POST /api/scraper/product/:productId 端点（手动爬取单个产品）
- [x] 10.3 实现 POST /api/scraper/all 端点（手动爬取所有监控产品）
- [x] 10.4 在 backend/src/routes/index.ts 中注册 /scraper 路由
- [x] 10.5 提交 API 路由实现

## 11. API 集成测试

- [x] 11.1 创建 backend/tests/scraper.api.test.ts 文件
- [x] 11.2 编写 POST /api/scraper/product/:productId 的集成测试
- [x] 11.3 编写 POST /api/scraper/all 的集成测试
- [x] 11.4 运行测试验证通过
- [x] 11.5 提交 API 集成测试

## 12. 应用集成

- [x] 12.1 修改 backend/src/index.ts，在生产环境启动调度器
- [x] 12.2 添加 SIGTERM 和 SIGINT 信号处理（优雅关闭调度器）
- [x] 12.3 提交应用集成

## 13. 集成验证

- [x] 13.1 运行所有测试（npm test）确保 100% 通过
- [x] 13.2 启动服务器验证调度器日志
- [x] 13.3 手动测试 API 端点（POST /api/scraper/product/:id 和 POST /api/scraper/all）
- [x] 13.4 验证数据库 price_snapshots 表有新记录
- [x] 13.5 验证 products 表的 lastCheckedAt 字段更新
