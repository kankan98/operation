import { expect, test, type Page, type Route } from '@playwright/test';

type MockProduct = {
  id: string;
  platform: 'amazon' | 'walmart' | 'aliexpress' | 'ebay' | 'other';
  productUrl: string;
  asin: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  currentPrice?: number | null;
  currency: string;
  isMonitoring: boolean;
  monitorType?: string | null;
  checkInterval: number;
  userId: string | null;
  createdAt: number;
  updatedAt: number | null;
  lastCheckedAt: number | null;
  metadata: string | null;
};

const now = Date.now();

function productResponse(products: MockProduct[]) {
  return {
    data: products,
    total: products.length,
    pagination: { page: 1, limit: 20, totalPages: products.length ? 1 : 0 },
  };
}

async function installColdStartMocks(page: Page, products: MockProduct[] = []) {
  await page.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'en');
  });

  let currentProducts = [...products];

  await page.route('**/api/products', async (route: Route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await route.fulfill({ json: productResponse(currentProducts) });
      return;
    }

    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Partial<MockProduct>;
      const created: MockProduct = {
        id: 'product-e2e-1',
        platform: body.platform ?? 'amazon',
        productUrl: body.productUrl ?? 'https://www.amazon.com/dp/B0E2E00001',
        asin: body.asin ?? 'B0E2E00001',
        title: body.title ?? 'E2E Product',
        brand: body.brand ?? null,
        category: body.category ?? null,
        imageUrl: body.imageUrl ?? null,
        currentPrice: body.currentPrice ?? null,
        currency: body.currency ?? 'USD',
        isMonitoring: body.isMonitoring ?? true,
        monitorType: body.monitorType ?? 'automatic',
        checkInterval: body.checkInterval ?? 24,
        userId: null,
        createdAt: now,
        updatedAt: now,
        lastCheckedAt: null,
        metadata: null,
      };
      currentProducts = [created];
      await route.fulfill({ status: 201, json: created });
      return;
    }

    await route.fallback();
  });

  await page.route(/\/api\/products\/[^/]+$/, async (route: Route) => {
    const request = route.request();
    const id = request.url().match(/\/api\/products\/([^/?]+)/)?.[1] ?? '';
    const product = currentProducts.find((item) => item.id === id);

    if (request.method() === 'PATCH' && product) {
      const body = request.postDataJSON() as Partial<MockProduct>;
      const updated = { ...product, ...body, updatedAt: now + 1 };
      currentProducts = currentProducts.map((item) => (item.id === id ? updated : item));
      await route.fulfill({ json: updated });
      return;
    }

    if (request.method() === 'DELETE') {
      currentProducts = currentProducts.filter((item) => item.id !== id);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({ status: product ? 200 : 404, json: product ?? { error: 'not found' } });
  });

  await page.route('**/api/alerts', async (route: Route) => {
    await route.fulfill({ json: { data: [], total: 0, pagination: { page: 1, limit: 20, totalPages: 0 } } });
  });

  await page.route('**/api/price-snapshots', async (route: Route) => {
    const body = route.request().postDataJSON() as { productId: string; price: number; currency: string };
    currentProducts = currentProducts.map((item) =>
      item.id === body.productId
        ? { ...item, currentPrice: body.price, currency: body.currency, lastCheckedAt: now + 2 }
        : item,
    );
    await route.fulfill({
      status: 201,
      json: {
        id: 'snapshot-e2e-1',
        productId: body.productId,
        price: body.price,
        currency: body.currency,
        availability: 'in_stock',
        timestamp: now + 2,
      },
    });
  });

  await page.route('**/api/opportunities/products**', async (route: Route) => {
    await route.fulfill({
      json: { data: [], total: 0, pagination: { page: 1, limit: 30, totalPages: 0 } },
    });
  });
  await page.route('**/api/opportunities/research/summary', async (route: Route) => {
    await route.fulfill({ json: { data: null } });
  });
  await page.route('**/api/opportunities/research/practice-summary', async (route: Route) => {
    await route.fulfill({ json: { data: null } });
  });
  await page.route('**/api/opportunities/research/action-plan', async (route: Route) => {
    await route.fulfill({ json: { data: { items: [], generatedAt: now, caveat: '' } } });
  });
}

test('guides cold-start users from dashboard, alerts, and opportunities', async ({ page }) => {
  await installColdStartMocks(page);

  await page.goto('/');
  await expect(page.getByText(/Start by adding a product/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Add first product/i })).toHaveAttribute(
    'href',
    '/products',
  );

  await page.goto('/alerts');
  await expect(page.getByText(/Alerts require products to monitor/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Go to products/i })).toHaveAttribute(
    'href',
    '/products',
  );

  await page.goto('/opportunities');
  await expect(page.getByText(/机会分析需要先添加商品/)).toBeVisible();
  await expect(page.getByRole('link', { name: /前往商品/ })).toHaveAttribute('href', '/products');
});

test('adds, edits, records a manual reading, and deletes a product', async ({ page }) => {
  await installColdStartMocks(page);

  await page.goto('/products');
  await expect(page.getByText(/No products yet/i)).toBeVisible();

  await page.getByRole('button', { name: /Add Product/i }).first().click();
  await page.getByLabel(/Product URL/i).fill('https://www.amazon.com/dp/B0E2E00001');
  await page.getByLabel(/ASIN \/ Product ID/i).fill('B0E2E00001');
  await page.getByLabel(/Product Title/i).fill('E2E Test Product');
  await page.getByLabel(/^Brand$/i).fill('Acme');
  await page.getByRole('button', { name: /Add Product/i }).last().click();

  await expect(page.getByText('E2E Test Product')).toBeVisible();

  await page.getByRole('button', { name: /Edit product/i }).click();
  await page.getByLabel(/Product Title/i).fill('Updated E2E Test Product');
  await page.getByRole('button', { name: /Update Product/i }).click();
  await expect(page.getByText('Updated E2E Test Product')).toBeVisible();

  await page.getByRole('button', { name: '记录手动读数' }).click();
  await page.getByLabel(/价格/).fill('79.95');
  await page.getByRole('button', { name: '保存读数' }).click();
  await expect(page.getByRole('heading', { name: '记录手动读数' })).toBeHidden();
  await expect(page.getByText('$79.95')).toBeVisible();

  await page.getByRole('button', { name: /Delete product/i }).click();
  await page.getByRole('button', { name: /^Delete$/i }).click();
  await expect(page.getByText(/No products yet/i)).toBeVisible();
});
