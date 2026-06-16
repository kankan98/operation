import { AmazonScraper } from '../scrapers/amazonScraper';
import { ProductService } from './productService';
import { PriceSnapshotService } from './priceSnapshotService';
import { AlertTriggerService } from './alertTriggerService';
import { logger } from '../utils/logger';

interface ScrapeProductResult {
  success: boolean;
  productId: string;
  snapshotId?: string;
  error?: string;
}

export class ScraperService {
  private productService = new ProductService();
  private snapshotService = new PriceSnapshotService();
  private alertTriggerService = new AlertTriggerService();

  async scrapeProduct(productId: string): Promise<ScrapeProductResult> {
    try {
      // 获取产品信息
      const product = await this.productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          productId,
          error: 'Product not found',
        };
      }

      // 初始化爬虫
      let scraper;
      if (product.platform === 'amazon') {
        scraper = new AmazonScraper();
      } else {
        return {
          success: false,
          productId,
          error: `Unsupported platform: ${product.platform}`,
        };
      }

      await scraper.initialize();

      try {
        // 爬取数据
        const scrapeResult = await scraper.scrape(product.productUrl);

        if (!scrapeResult.success || !scrapeResult.data) {
          return {
            success: false,
            productId,
            error: scrapeResult.error || 'Scrape failed',
          };
        }

        // 创建价格快照
        const snapshot = await this.snapshotService.createSnapshot({
          productId: product.id,
          price: scrapeResult.data.price,
          currency: scrapeResult.data.currency,
          availability: scrapeResult.data.availability,
          rating: scrapeResult.data.rating,
          reviewCount: scrapeResult.data.reviewCount,
        });

        // 更新产品信息
        await this.productService.updateProduct(product.id, {
          currentPrice: scrapeResult.data.price,
          lastCheckedAt: Date.now(),
          ...(scrapeResult.data.title && { title: scrapeResult.data.title }),
          ...(scrapeResult.data.imageUrl && {
            imageUrl: scrapeResult.data.imageUrl,
          }),
        });

        logger.info(
          { productId, snapshotId: snapshot.id },
          'Product scraped successfully'
        );

        // Trigger alert evaluation
        try {
          await this.alertTriggerService.evaluateRules(productId);
        } catch (alertError) {
          const message = alertError instanceof Error ? alertError.message : 'Unknown error';
          logger.error(
            { productId, error: message },
            'Alert trigger failed but scrape succeeded'
          );
          // Don't fail the entire scrape if alert trigger fails
        }

        return {
          success: true,
          productId,
          snapshotId: snapshot.id,
        };
      } finally {
        await scraper.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { productId, error: message },
        'Scrape product failed'
      );
      return {
        success: false,
        productId,
        error: message,
      };
    }
  }

  async scrapeAllMonitoringProducts(): Promise<ScrapeProductResult[]> {
    logger.info('Starting scrape all monitoring products');

    // 获取所有监控中的产品
    const result = await this.productService.listProducts({
      monitoring: true,
      limit: 100, // 设置足够大的限制
    });

    logger.info({ count: result.data.length }, 'Found monitoring products');

    // 串行爬取（避免并发过多）
    const results: ScrapeProductResult[] = [];
    for (const product of result.data) {
      const scrapeResult = await this.scrapeProduct(product.id);
      results.push(scrapeResult);

      // 添加延迟避免被封
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      { total: results.length, success: successCount },
      'Scrape all completed'
    );

    return results;
  }
}
