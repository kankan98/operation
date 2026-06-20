import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AmazonScraper } from '../src/scrapers/amazonScraper';
import {
  createMockAmazonHtml,
  createMockAmazonHtmlNoPriceElement,
  createMockAmazonHtmlOutOfStock,
  createMockAmazonHtmlMinimal,
  createMockAmazonRobotCheck,
  createMockAmazonErrorPage,
} from './__utils__';

// Mock Playwright
vi.mock('playwright', () => {
  const mockPage = {
    goto: vi.fn(),
    waitForTimeout: vi.fn(),
    $: vi.fn(),
    $eval: vi.fn(),
    close: vi.fn(),
    setContent: vi.fn(),
    title: vi.fn().mockResolvedValue('Amazon Product'),
    url: vi.fn(() => 'https://www.amazon.com/dp/B08N5WRWNW'),
    content: vi.fn().mockResolvedValue(''),
  };

  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn(),
  };

  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

describe('AmazonScraper', () => {
  let scraper: AmazonScraper;
  let mockPage: any;

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    scraper = new AmazonScraper();
    await scraper.initialize();

    // Get the mock page instance
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch();
    mockPage = await browser.newPage();
    mockPage.title.mockResolvedValue('Amazon Product');
    mockPage.url.mockReturnValue('https://www.amazon.com/dp/B08N5WRWNW');
    mockPage.content.mockResolvedValue('');
  });

  afterEach(async () => {
    await scraper.close();
  });

  it('should scrape Amazon product successfully', async () => {
    // Setup mock HTML response
    const mockHtml = createMockAmazonHtml({
      price: '$249.99',
      title: 'Apple AirPods Pro (2nd Generation)',
      availability: 'In Stock',
      rating: '4.5',
      reviewCount: '12,345',
    });

    // Mock page methods to return parsed HTML elements
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector.includes('a-price') || selector.includes('priceblock')) {
        return {
          textContent: async () => '$249.99',
        };
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Apple AirPods Pro (2nd Generation)',
        };
      }
      if (selector === '#availability span') {
        return {
          textContent: async () => 'In Stock',
        };
      }
      if (selector === '.a-icon-star .a-icon-alt') {
        return {
          textContent: async () => '4.5 out of 5 stars',
        };
      }
      if (selector === '#acrCustomerReviewText') {
        return {
          textContent: async () => '12345 ratings',
        };
      }
      return null;
    });

    mockPage.$eval.mockResolvedValue('https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg');

    const result = await scraper.scrape('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.price).toBe(249.99);
      expect(result.data.currency).toBe('USD');
      expect(result.data.availability).toBe('In Stock');
      expect(result.data.title).toBe('Apple AirPods Pro (2nd Generation)');
      expect(result.data.rating).toBe(4.5);
      expect(result.data.reviewCount).toBe(12345);
      expect(result.data.imageUrl).toBeDefined();
    }
  });

  it('should handle price not found', async () => {
    // Mock no price element
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector.includes('a-price') || selector.includes('priceblock')) {
        return null; // No price element
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Product Without Price',
        };
      }
      return null;
    });

    const result = await scraper.scrape('https://www.amazon.com/dp/NOPRICE');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Price not found');
    expect(result.failureReason).toBe('price_missing');
  });

  it('should detect Amazon robot check pages', async () => {
    mockPage.title.mockResolvedValue('Robot Check');
    mockPage.content.mockResolvedValue(createMockAmazonRobotCheck());

    const result = await scraper.scrape('https://www.amazon.com/dp/ROBOTCHECK');

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('captcha');
    expect(result.diagnostics?.detectedState).toBe('captcha');
  });

  it('should detect geo restricted pages', async () => {
    mockPage.title.mockResolvedValue('Amazon.com');
    mockPage.content.mockResolvedValue(`
      <html>
        <body>
          <h1>This item cannot be shipped to your selected delivery location.</h1>
        </body>
      </html>
    `);

    const result = await scraper.scrape('https://www.amazon.com/dp/GEOLOCKED');

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('geo_restricted');
  });

  it('should detect unavailable product pages', async () => {
    mockPage.title.mockResolvedValue('Sorry! Something went wrong!');
    mockPage.content.mockResolvedValue(createMockAmazonErrorPage());

    const result = await scraper.scrape('https://www.amazon.com/dp/NOTFOUND');

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('not_found');
  });

  it('should report selector drift when product page selectors are missing', async () => {
    mockPage.content.mockResolvedValue(`
      <html>
        <body>
          <div>Add to Cart</div>
          <div id="availability">In Stock</div>
        </body>
      </html>
    `);
    mockPage.$.mockResolvedValue(null);

    const result = await scraper.scrape('https://www.amazon.com/dp/DRIFT');

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('selector_drift');
  });

  it('should extract price from fallback selector', async () => {
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector === '#corePrice_feature_div .a-offscreen') {
        return {
          textContent: async () => '$159.99',
        };
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Fallback Price Product',
        };
      }
      if (selector === '#availability span') {
        return {
          textContent: async () => 'In Stock',
        };
      }
      return null;
    });

    const result = await scraper.scrape('https://www.amazon.com/dp/FALLBACK');

    expect(result.success).toBe(true);
    expect(result.data?.price).toBe(159.99);
  });

  it('should handle out of stock', async () => {
    // Mock out of stock product
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector.includes('a-price') || selector.includes('priceblock')) {
        return {
          textContent: async () => '$249.99',
        };
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Out of Stock Product',
        };
      }
      if (selector === '#availability span') {
        return {
          textContent: async () => 'Currently unavailable',
        };
      }
      return null;
    });

    mockPage.$eval.mockResolvedValue(undefined);

    const result = await scraper.scrape('https://www.amazon.com/dp/OUTOFSTOCK');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.price).toBe(249.99);
      expect(result.data.availability).toBe('Currently unavailable');
    }
  });

  it('should extract optional fields', async () => {
    // Mock complete product with all optional fields
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector.includes('a-price') || selector.includes('priceblock')) {
        return {
          textContent: async () => '$199.99',
        };
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Complete Product',
        };
      }
      if (selector === '#availability span') {
        return {
          textContent: async () => 'In Stock',
        };
      }
      if (selector === '.a-icon-star .a-icon-alt') {
        return {
          textContent: async () => '4.8 out of 5 stars',
        };
      }
      if (selector === '#acrCustomerReviewText') {
        return {
          textContent: async () => '50000 ratings',
        };
      }
      return null;
    });

    mockPage.$eval.mockResolvedValue('https://example.com/image.jpg');

    const result = await scraper.scrape('https://www.amazon.com/dp/COMPLETE');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.title).toBe('Complete Product');
      expect(result.data.rating).toBe(4.8);
      expect(result.data.reviewCount).toBe(50000);
      expect(result.data.imageUrl).toBe('https://example.com/image.jpg');
    }
  });

  it('should handle missing optional fields', async () => {
    // Mock minimal product (only required fields)
    mockPage.$.mockImplementation(async (selector: string) => {
      if (selector.includes('a-price') || selector.includes('priceblock')) {
        return {
          textContent: async () => '$99.99',
        };
      }
      if (selector === '#productTitle') {
        return {
          textContent: async () => 'Minimal Product',
        };
      }
      if (selector === '#availability span') {
        return {
          textContent: async () => 'In Stock',
        };
      }
      // No rating, review count
      return null;
    });

    mockPage.$eval.mockRejectedValue(new Error('Image not found'));

    const result = await scraper.scrape('https://www.amazon.com/dp/MINIMAL');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.price).toBe(99.99);
      expect(result.data.availability).toBe('In Stock');
      expect(result.data.rating).toBeUndefined();
      expect(result.data.reviewCount).toBeUndefined();
      expect(result.data.imageUrl).toBeUndefined();
    }
  });

  it('should handle scraping errors', async () => {
    // Mock network error
    mockPage.goto.mockRejectedValue(new Error('Network timeout'));

    const result = await scraper.scrape('https://www.amazon.com/dp/ERROR');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should initialize and close browser properly', async () => {
    const newScraper = new AmazonScraper();
    await newScraper.initialize();

    // Verify chromium.launch was called
    const playwright = await import('playwright');
    expect(playwright.chromium.launch).toHaveBeenCalled();

    await newScraper.close();

    // Verify close methods were called
    expect(mockPage.close).toHaveBeenCalled();
  });
});
