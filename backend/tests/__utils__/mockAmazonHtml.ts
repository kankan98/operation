/**
 * Mock Amazon HTML response builders for testing the scraper.
 * These mimic the actual Amazon product page structure with realistic selectors.
 */

/**
 * Generates a complete Amazon product page HTML with all fields present.
 */
export function createMockAmazonHtml(options: {
  price?: string;
  title?: string;
  availability?: string;
  rating?: string;
  reviewCount?: string;
  imageUrl?: string;
}): string {
  const {
    price = '$249.99',
    title = 'Apple AirPods Pro (2nd Generation)',
    availability = 'In Stock',
    rating = '4.5',
    reviewCount = '12,345',
    imageUrl = 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
  } = options;

  return `
    <!DOCTYPE html>
    <html>
      <head><title>Amazon.com: ${title}</title></head>
      <body>
        <div id="dp" class="a-container">
          <!-- Title -->
          <span id="productTitle" class="a-size-large product-title-word-break">
            ${title}
          </span>

          <!-- Price - Amazon uses multiple possible selectors -->
          <span id="priceblock_ourprice" class="a-price-whole">
            ${price}
          </span>
          <span class="a-price a-text-price a-size-medium apexPriceToPay">
            <span class="a-offscreen">${price}</span>
          </span>

          <!-- Availability -->
          <div id="availability" class="a-section">
            <span class="a-size-medium a-color-success">
              ${availability}
            </span>
          </div>

          <!-- Rating -->
          <span class="a-icon-alt">${rating} out of 5 stars</span>
          <i class="a-icon a-icon-star a-star-${rating.replace('.', '-')}">
            <span class="a-icon-alt">${rating} out of 5 stars</span>
          </i>

          <!-- Review count -->
          <span id="acrCustomerReviewText" class="a-size-base">
            ${reviewCount} ratings
          </span>

          <!-- Image -->
          <img id="landingImage"
               class="a-dynamic-image"
               src="${imageUrl}"
               alt="${title}">
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates Amazon HTML with missing price (for testing price-not-found scenario).
 */
export function createMockAmazonHtmlNoPriceElement(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Amazon.com Product</title></head>
      <body>
        <div id="dp" class="a-container">
          <span id="productTitle" class="a-size-large">
            Test Product Without Price
          </span>

          <!-- No price element at all -->

          <div id="availability" class="a-section">
            <span class="a-size-medium a-color-success">
              In Stock
            </span>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates Amazon HTML with out-of-stock status.
 */
export function createMockAmazonHtmlOutOfStock(): string {
  return createMockAmazonHtml({
    price: '$249.99',
    title: 'Out of Stock Product',
    availability: 'Currently unavailable',
  });
}

/**
 * Generates Amazon HTML with low stock status.
 */
export function createMockAmazonHtmlLowStock(): string {
  return createMockAmazonHtml({
    price: '$249.99',
    title: 'Low Stock Product',
    availability: 'Only 2 left in stock - order soon',
  });
}

/**
 * Generates Amazon HTML with minimal fields (only required fields present).
 */
export function createMockAmazonHtmlMinimal(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Amazon.com Product</title></head>
      <body>
        <div id="dp" class="a-container">
          <span id="productTitle" class="a-size-large">
            Minimal Product
          </span>

          <span id="priceblock_ourprice" class="a-price-whole">
            $99.99
          </span>

          <div id="availability" class="a-section">
            <span class="a-size-medium">
              In Stock
            </span>
          </div>

          <!-- No rating, review count, or image -->
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates completely invalid HTML (not an Amazon product page).
 */
export function createInvalidHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Not Amazon</title></head>
      <body>
        <h1>This is not an Amazon product page</h1>
        <p>No product information here.</p>
      </body>
    </html>
  `;
}

/**
 * Generates Amazon error page (404/access denied).
 */
export function createMockAmazonErrorPage(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Sorry! Something went wrong!</title></head>
      <body>
        <div class="a-container">
          <h1>Sorry! Something went wrong on our end.</h1>
          <p>Please try again later.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates Amazon robot check page (anti-bot detection).
 */
export function createMockAmazonRobotCheck(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Robot Check</title></head>
      <body>
        <div class="a-container">
          <h1>Enter the characters you see below</h1>
          <p>Sorry, we just need to make sure you're not a robot.</p>
          <form method="post">
            <input type="text" name="field-keywords" />
            <img src="/captcha.jpg" alt="captcha" />
          </form>
        </div>
      </body>
    </html>
  `;
}
