import { chromium, Browser, Page } from 'playwright';
import { ScrapedProductData, ScrapeResult } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  abstract scrape(url: string): Promise<ScrapeResult>;

  protected async safeExtractText(
    selector: string,
    defaultValue: string = ''
  ): Promise<string> {
    try {
      if (!this.page) throw new Error('Page not initialized');
      const element = await this.page.$(selector);
      if (!element) return defaultValue;
      const text = await element.textContent();
      return text?.trim() || defaultValue;
    } catch (error) {
      logger.warn({ selector, error }, 'Failed to extract text');
      return defaultValue;
    }
  }

  protected parsePrice(priceText: string): number | null {
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (!match) return null;
    return parseFloat(match[0].replace(/,/g, ''));
  }
}
