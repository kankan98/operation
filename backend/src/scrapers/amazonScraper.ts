import { BaseScraper } from './baseScraper';
import { ScrapeResult, ScrapedProductData } from '../types';
import { logger } from '../utils/logger';

export class AmazonScraper extends BaseScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const startTime = Date.now();

    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      logger.info({ url }, 'Starting Amazon scrape');

      // 访问页面
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.page.waitForTimeout(2000);

      // 提取价格
      const priceText = await this.safeExtractText(
        '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice'
      );
      const price = this.parsePrice(priceText);

      if (!price) {
        throw new Error('Price not found');
      }

      // 提取其他信息
      const title = await this.safeExtractText('#productTitle');
      const availability = await this.safeExtractText('#availability span');

      // 提取评分
      const ratingText = await this.safeExtractText('.a-icon-star .a-icon-alt');
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      // 提取评论数
      const reviewText = await this.safeExtractText('#acrCustomerReviewText');
      const reviewMatch = reviewText.match(/(\d+)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : undefined;

      // 提取图片
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const imageUrl: string | undefined = await this.page
        .$eval('#landingImage, #imgBlkFront', (img) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const element = img as HTMLImageElement;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          return element.src;
        })
        .catch(() => undefined);

      const data: ScrapedProductData = {
        price,
        currency: 'USD',
        availability: availability || 'unknown',
        title: title || undefined,
        rating,
        reviewCount,
        imageUrl,
      };

      logger.info(
        { url, duration: Date.now() - startTime },
        'Amazon scrape successful'
      );

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { url, error: message, duration: Date.now() - startTime },
        'Amazon scrape failed'
      );

      return {
        success: false,
        error: message,
        timestamp: Date.now(),
      };
    }
  }
}
