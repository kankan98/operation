import { BaseScraper } from './baseScraper';
import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  ScrapeResult,
  ScrapedProductData,
} from '../types';
import { logger } from '../utils/logger';

type AmazonPageState =
  | 'valid_product'
  | 'captcha'
  | 'blocked'
  | 'geo_restricted'
  | 'not_found'
  | 'unknown';

const AMAZON_SELECTORS = {
  price: [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#corePrice_feature_div .a-offscreen',
    '#apex_desktop .a-offscreen',
    '[data-a-color="price"] .a-offscreen',
  ],
  title: ['#productTitle', '#title', 'span.product-title-word-break'],
  availability: ['#availability span', '#availability', '#outOfStock'],
  rating: ['.a-icon-star .a-icon-alt', '[data-hook="rating-out-of-text"]'],
  reviewCount: ['#acrCustomerReviewText', '[data-hook="total-review-count"]'],
  image: ['#landingImage', '#imgBlkFront', '#ebooksImgBlkFront'],
};

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

      const diagnostics = await this.collectDiagnostics();
      const pageState = this.classifyPageState(diagnostics);
      if (pageState !== 'valid_product' && pageState !== 'unknown') {
        return this.failureResult(
          url,
          startTime,
          this.failureReasonForPageState(pageState),
          `Amazon page state detected: ${pageState}`,
          {
            ...diagnostics,
            detectedState: pageState,
          }
        );
      }

      // 提取价格
      const priceText = await this.extractFirstText(AMAZON_SELECTORS.price);
      const price = this.parsePrice(priceText);

      if (!price) {
        const title = await this.extractFirstText(AMAZON_SELECTORS.title);
        return this.failureResult(
          url,
          startTime,
          title ? 'price_missing' : 'selector_drift',
          title ? 'Price not found' : 'Amazon product selectors not found',
          {
            ...diagnostics,
            detectedState: title ? 'price_missing' : 'selector_drift',
          }
        );
      }

      // 提取其他信息
      const title = await this.extractFirstText(AMAZON_SELECTORS.title);
      const availability = await this.extractFirstText(
        AMAZON_SELECTORS.availability
      );

      // 提取评分
      const ratingText = await this.extractFirstText(AMAZON_SELECTORS.rating);
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      // 提取评论数
      const reviewText = await this.extractFirstText(
        AMAZON_SELECTORS.reviewCount
      );
      const reviewMatch = reviewText.match(/(\d+)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : undefined;

      // 提取图片
      const imageUrl: string | undefined = await this.page
        .$eval(AMAZON_SELECTORS.image.join(', '), (img) => {
          const element = img as { src?: string };
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
        failureReason: this.classifyError(message),
        diagnostics: {
          message,
        },
        timestamp: Date.now(),
      };
    }
  }

  private async extractFirstText(selectors: string[]): Promise<string> {
    for (const selector of selectors) {
      const text = await this.safeExtractText(selector);
      if (text) {
        return text;
      }
    }
    return '';
  }

  private async collectDiagnostics(): Promise<AcquisitionDiagnostics & { html?: string }> {
    if (!this.page) {
      return {};
    }

    const pageWithOptionalMethods = this.page as {
      title?: () => Promise<string>;
      url?: () => string;
      content?: () => Promise<string>;
    };

    const pageTitle =
      typeof pageWithOptionalMethods.title === 'function'
        ? await pageWithOptionalMethods.title().catch(() => '')
        : '';
    const finalUrl =
      typeof pageWithOptionalMethods.url === 'function'
        ? pageWithOptionalMethods.url()
        : '';
    const html =
      typeof pageWithOptionalMethods.content === 'function'
        ? await pageWithOptionalMethods.content().catch(() => '')
        : '';

    return {
      pageTitle,
      finalUrl,
      html,
    };
  }

  private classifyPageState(
    diagnostics: AcquisitionDiagnostics & { html?: string }
  ): AmazonPageState {
    const haystack = `${diagnostics.pageTitle || ''} ${diagnostics.finalUrl || ''} ${
      diagnostics.html || ''
    }`.toLowerCase();

    if (
      haystack.includes('robot check') ||
      haystack.includes("not a robot") ||
      haystack.includes('captcha') ||
      haystack.includes('enter the characters you see below')
    ) {
      return 'captcha';
    }

    if (haystack.includes('access denied') || haystack.includes('blocked')) {
      return 'blocked';
    }

    if (
      haystack.includes('not available in your region') ||
      haystack.includes('cannot be shipped to your selected delivery location') ||
      haystack.includes('currently unavailable in your area')
    ) {
      return 'geo_restricted';
    }

    if (
      haystack.includes('sorry! something went wrong') ||
      haystack.includes('looking for something?') ||
      haystack.includes('page not found')
    ) {
      return 'not_found';
    }

    if (
      haystack.includes('producttitle') ||
      haystack.includes('add to cart') ||
      haystack.includes('availability')
    ) {
      return 'valid_product';
    }

    return 'unknown';
  }

  private failureReasonForPageState(
    state: AmazonPageState
  ): AcquisitionFailureReason {
    switch (state) {
      case 'captcha':
        return 'captcha';
      case 'blocked':
        return 'blocked';
      case 'geo_restricted':
        return 'geo_restricted';
      case 'not_found':
        return 'not_found';
      default:
        return 'unknown';
    }
  }

  private classifyError(message: string): AcquisitionFailureReason {
    const normalized = message.toLowerCase();
    if (normalized.includes('timeout')) {
      return 'network_timeout';
    }
    if (normalized.includes('price')) {
      return 'price_missing';
    }
    return 'unknown';
  }

  private failureResult(
    url: string,
    startTime: number,
    failureReason: AcquisitionFailureReason,
    error: string,
    diagnostics: AcquisitionDiagnostics
  ): ScrapeResult {
    logger.error(
      { url, error, failureReason, duration: Date.now() - startTime },
      'Amazon scrape failed'
    );

    const { html: _html, ...safeDiagnostics } = diagnostics as AcquisitionDiagnostics & {
      html?: string;
    };

    return {
      success: false,
      error,
      failureReason,
      diagnostics: safeDiagnostics,
      timestamp: Date.now(),
    };
  }
}
