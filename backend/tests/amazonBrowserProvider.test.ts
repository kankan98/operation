import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmazonBrowserProvider } from '../src/providers/amazonBrowserProvider';
import { AmazonScraper } from '../src/scrapers/amazonScraper';
import { Product } from '../src/types';

function createProduct(): Product {
  return {
    id: 'product-1',
    platform: 'amazon',
    productUrl: 'https://www.amazon.com/dp/B000000001',
    asin: 'B000000001',
    title: 'Existing Product',
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: Date.now(),
  };
}

describe('AmazonBrowserProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should map captcha browser failures to safe root causes', async () => {
    vi.spyOn(AmazonScraper.prototype, 'initialize').mockResolvedValue();
    vi.spyOn(AmazonScraper.prototype, 'close').mockResolvedValue();
    vi.spyOn(AmazonScraper.prototype, 'scrape').mockResolvedValue({
      success: false,
      timestamp: Date.now(),
      failureReason: 'captcha',
      error: 'Captcha challenge detected',
      diagnostics: {
        finalUrl: 'https://www.amazon.com/dp/B000000001?session=SECRET123',
        pageTitle: '<html>Robot Check</html>',
      },
    });

    const result = await new AmazonBrowserProvider().fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('captcha');
    expect(result.diagnostics).toMatchObject({
      rootCause: 'captcha_or_blocked',
      failureCategory: 'browser_blocking',
      providerMessage: 'Captcha challenge detected',
    });
    expect(JSON.stringify(result.diagnostics)).not.toContain('?session=');
    expect(JSON.stringify(result.diagnostics)).not.toContain('<html>');
  });

  it('should map thrown timeouts to network timeout root cause', async () => {
    vi.spyOn(AmazonScraper.prototype, 'initialize').mockResolvedValue();
    vi.spyOn(AmazonScraper.prototype, 'close').mockResolvedValue();
    vi.spyOn(AmazonScraper.prototype, 'scrape').mockRejectedValue(
      new Error('Navigation timeout')
    );

    const result = await new AmazonBrowserProvider().fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('network_timeout');
    expect(result.diagnostics?.rootCause).toBe('network_timeout');
  });
});
