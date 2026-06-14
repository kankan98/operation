## Why

Phase 1 和 Phase 2 建立了产品管理和价格快照记录的基础，但价格数据采集仍需手动操作。为了实现自动化监控，需要爬虫服务定期抓取产品页面，自动创建价格快照，形成完整的数据采集链路。

## What Changes

- 新增 Amazon 产品页面爬虫，支持提取价格、评分、库存等信息
- 新增 ScraperService 服务层，集成 ProductService 和 PriceSnapshotService
- 新增定时任务调度器，每小时自动爬取所有监控中的产品
- 新增手动触发爬取的 API 端点
- 完整的单元测试和集成测试覆盖

## Capabilities

### New Capabilities
- `amazon-scraper`: Amazon 产品页面爬虫，提取价格、评分、库存、评论数等信息
- `scraper-api`: 爬虫 API 端点，支持手动触发单个产品或所有产品的爬取
- `scheduler`: 定时任务调度器，自动执行周期性爬取任务

### Modified Capabilities
<!-- 无需修改现有规格，仅新增功能 -->

## Impact

**新增文件：**
- `backend/src/scrapers/baseScraper.ts` - 爬虫基类
- `backend/src/scrapers/amazonScraper.ts` - Amazon 爬虫实现
- `backend/src/services/scraperService.ts` - 爬虫服务层
- `backend/src/services/schedulerService.ts` - 调度服务层
- `backend/src/routes/scraper.ts` - 爬虫 API 路由
- `backend/tests/amazonScraper.test.ts` - 爬虫单元测试
- `backend/tests/scraperService.test.ts` - 服务层单元测试
- `backend/tests/schedulerService.test.ts` - 调度器单元测试
- `backend/tests/scraper.api.test.ts` - API 集成测试

**修改文件：**
- `backend/src/types/index.ts` - 添加 ScrapedProductData 和 ScrapeResult 类型
- `backend/src/routes/index.ts` - 注册爬虫路由
- `backend/src/index.ts` - 集成调度器到应用启动流程

**新增依赖：**
- `playwright` - 无头浏览器，用于网页抓取
- `node-cron` - 定时任务调度

**数据流：**
- Scheduler → ScraperService → AmazonScraper → ProductService/PriceSnapshotService
- 爬取的数据自动创建价格快照，更新产品信息

**风险：**
- 网站反爬虫机制可能导致爬取失败
- 页面结构变化需要更新选择器
- 爬取频率过高可能被封 IP
