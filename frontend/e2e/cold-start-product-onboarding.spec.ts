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
  const priceSnapshots = new Map<string, Array<{
    id: string;
    productId: string;
    price: number;
    currency: string;
    availability: 'in_stock' | 'low_stock' | 'out_of_stock';
    timestamp: number;
    source: 'manual';
    salesRank: number | null;
    rating: number | null;
    reviewCount: number | null;
  }>>();
  const businessSignalsByProductId = new Map<string, {
    currency: string;
    costBasis: number | null;
    inboundShipping: number | null;
    outboundShipping: number | null;
    fulfillmentFee: number | null;
    platformFee: number | null;
    referralFeeRate: number | null;
    advertisingCost: number | null;
    taxCustomsBuffer: number | null;
    targetSellPrice: number | null;
    targetUnits: number | null;
    notes: string | null;
  }>();

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

  await page.route(/\/api\/analysis\/price-stats\/[^/?]+/, async (route: Route) => {
    const productId = route.request().url().match(/\/api\/analysis\/price-stats\/([^/?]+)/)?.[1] ?? '';
    const product = currentProducts.find((item) => item.id === productId);
    const snapshots = priceSnapshots.get(productId) ?? [];
    const prices = snapshots.map((item) => item.price);
    const currentPrice = prices.at(0) ?? product?.currentPrice ?? 0;

    await route.fulfill({
      json: {
        data: {
          productId,
          currentPrice,
          highestPrice: prices.length ? Math.max(...prices) : currentPrice,
          lowestPrice: prices.length ? Math.min(...prices) : currentPrice,
          averagePrice: prices.length
            ? prices.reduce((sum, value) => sum + value, 0) / prices.length
            : currentPrice,
          priceChange: 0,
          priceChangePercent: 0,
          dataPoints: snapshots.length,
          firstRecordedAt: snapshots.at(-1)?.timestamp ?? now,
          lastRecordedAt: snapshots.at(0)?.timestamp ?? now,
          provenance: {
            source: snapshots.length ? 'manual' : 'unknown',
            ageMs: 0,
            stale: snapshots.length === 0,
            trust: snapshots.length ? 'high' : 'unknown',
            label: snapshots.length ? '手动录入' : '暂无读数',
          },
        },
      },
    });
  });

  await page.route(/\/api\/price-snapshots\/product\/[^/?]+/, async (route: Route) => {
    const productId = route.request().url().match(/\/api\/price-snapshots\/product\/([^/?]+)/)?.[1] ?? '';
    await route.fulfill({ json: priceSnapshots.get(productId) ?? [] });
  });

  await page.route('**/api/alerts', async (route: Route) => {
    await route.fulfill({ json: { data: [], total: 0, pagination: { page: 1, limit: 20, totalPages: 0 } } });
  });

  await page.route('**/api/price-snapshots', async (route: Route) => {
    const body = route.request().postDataJSON() as {
      productId: string;
      price: number;
      currency: string;
      availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
      salesRank?: number | null;
      rating?: number | null;
      reviewCount?: number | null;
      recordedAt?: number | null;
    };
    const snapshot = {
      id: 'snapshot-e2e-1',
      productId: body.productId,
      price: body.price,
      currency: body.currency,
      availability: body.availability ?? 'in_stock',
      timestamp: body.recordedAt ?? now + 2,
      source: 'manual' as const,
      salesRank: body.salesRank ?? null,
      rating: body.rating ?? null,
      reviewCount: body.reviewCount ?? null,
    };
    priceSnapshots.set(body.productId, [snapshot, ...(priceSnapshots.get(body.productId) ?? [])]);
    currentProducts = currentProducts.map((item) =>
      item.id === body.productId
        ? { ...item, currentPrice: body.price, currency: body.currency, lastCheckedAt: now + 2 }
        : item,
    );
    await route.fulfill({
      status: 201,
      json: snapshot,
    });
  });

  await page.route('**/api/opportunities/products**', async (route: Route) => {
    const pathname = new URL(route.request().url()).pathname;
    const productId = pathname.match(/\/api\/opportunities\/products\/([^/]+)$/)?.[1];

    if (productId) {
      const product = currentProducts.find((item) => item.id === productId);
      await route.fulfill({
        status: product ? 200 : 404,
        json: product
          ? {
              data: {
                product,
                score: 0,
                confidence: 0.2,
                recommendation: 'check_data',
                recommendationGate: {
                  status: 'blocked',
                  applied: true,
                  originalRecommendation: 'watch',
                  finalRecommendation: 'check_data',
                  reasons: ['缺少手动读数和业务假设'],
                  signals: ['price_history', 'business_assumptions'],
                  nextActions: ['记录首条读数', '填写业务假设'],
                },
                keyReasons: [],
                missingSignals: ['price_history', 'business_assumptions'],
                factors: [],
                acquisitionHealth: {
                  provider: null,
                  source: null,
                  status: null,
                  failureReason: null,
                  confidence: null,
                  durationMs: null,
                  timestamp: null,
                  freshnessMs: null,
                },
                businessSignals: {
                  completeness: 'none',
                  missingSignals: ['costBasis', 'targetSellPrice'],
                  metrics: null,
                  caveat:
                    'Business metrics are calculated from merchant-provided assumptions and are not verified facts.',
                },
                marketSignals: {
                  status: 'missing',
                  missingSignals: ['market_history'],
                  caveat:
                    'Market signals are trend proxies, not verified sales or profitability facts.',
                },
                research: null,
              },
            }
          : { error: 'not found' },
      });
      return;
    }

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

  await page.route(/\/api\/products\/[^/]+\/business-signals$/, async (route: Route) => {
    const productId = route.request().url().match(/\/api\/products\/([^/]+)\/business-signals/)?.[1] ?? '';
    const stored = businessSignalsByProductId.get(productId) ?? null;
    const requiredSignals = [
      'costBasis',
      'inboundShipping',
      'outboundShipping',
      'fulfillmentFee',
      'platformFee',
      'referralFeeRate',
      'advertisingCost',
      'taxCustomsBuffer',
      'targetSellPrice',
    ] as const;
    const missingSignals = stored
      ? requiredSignals.filter((key) => stored[key] === null || stored[key] === undefined)
      : ['costBasis', 'targetSellPrice'];
    const sellPrice = stored?.targetSellPrice ?? null;
    const referralFee =
      sellPrice !== null && stored?.referralFeeRate !== null && stored?.referralFeeRate !== undefined
        ? Number((sellPrice * stored.referralFeeRate).toFixed(2))
        : null;
    const totalVariableCost =
      stored && missingSignals.length === 0 && sellPrice !== null
        ? Number(
            (
              stored.costBasis! +
              stored.inboundShipping! +
              stored.outboundShipping! +
              stored.fulfillmentFee! +
              stored.platformFee! +
              referralFee! +
              stored.advertisingCost! +
              stored.taxCustomsBuffer!
            ).toFixed(2),
          )
        : null;
    const response = {
      data: {
        assumptions: stored
          ? {
              productId,
              createdAt: now,
              updatedAt: now + 3,
              ...stored,
            }
          : null,
        metrics: {
          currency: stored?.currency ?? 'USD',
          priceSource: sellPrice !== null ? 'target' : 'missing',
          completeness: stored && missingSignals.length === 0 ? 'complete' : stored ? 'partial' : 'none',
          missingSignals,
          totalVariableCost,
          grossMargin: null,
          netMargin: null,
          roi: null,
          breakevenSellPrice: null,
          contributionProfitPerUnit: null,
          targetUnits: null,
          projectedContributionProfit: null,
          inputs: {
            sellPrice,
            costBasis: stored?.costBasis ?? null,
            inboundShipping: stored?.inboundShipping ?? null,
            outboundShipping: stored?.outboundShipping ?? null,
            fulfillmentFee: stored?.fulfillmentFee ?? null,
            platformFee: stored?.platformFee ?? null,
            referralFeeRate: stored?.referralFeeRate ?? null,
            referralFee,
            advertisingCost: stored?.advertisingCost ?? null,
            taxCustomsBuffer: stored?.taxCustomsBuffer ?? null,
          },
          caveat:
            'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
        },
      },
    };

    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as {
        currency?: string;
        costBasis?: number | null;
        inboundShipping?: number | null;
        outboundShipping?: number | null;
        fulfillmentFee?: number | null;
        platformFee?: number | null;
        referralFeeRate?: number | null;
        advertisingCost?: number | null;
        taxCustomsBuffer?: number | null;
        targetSellPrice?: number | null;
        targetUnits?: number | null;
        notes?: string | null;
      };
      businessSignalsByProductId.set(productId, {
        currency: body.currency ?? 'USD',
        costBasis: body.costBasis ?? null,
        inboundShipping: body.inboundShipping ?? null,
        outboundShipping: body.outboundShipping ?? null,
        fulfillmentFee: body.fulfillmentFee ?? null,
        platformFee: body.platformFee ?? null,
        referralFeeRate: body.referralFeeRate ?? null,
        advertisingCost: body.advertisingCost ?? null,
        taxCustomsBuffer: body.taxCustomsBuffer ?? null,
        targetSellPrice: body.targetSellPrice ?? null,
        targetUnits: body.targetUnits ?? null,
        notes: body.notes ?? null,
      });
      await route.fulfill({
        json: {
          ...response,
          data: {
            ...response.data,
            assumptions: {
              productId,
              createdAt: now,
              updatedAt: now + 3,
              ...businessSignalsByProductId.get(productId)!,
            },
          },
        },
      });
      return;
    }

    await route.fulfill({ status: productId ? 200 : 404, json: response });
  });

  await page.route(/\/api\/products\/[^/]+\/market-signals\/latest$/, async (route: Route) => {
    await route.fulfill({
      json: {
        data: null,
        status: 'missing',
        missingSignals: ['market_history'],
        caveat:
          'Keepa market signals are trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      },
    });
  });

  await page.route(/\/api\/products\/[^/]+\/market-signals\/history/, async (route: Route) => {
    await route.fulfill({ json: { data: [] } });
  });

  await page.route(/\/api\/products\/[^/]+\/market-signals\/refresh$/, async (route: Route) => {
    await route.fulfill({
      json: {
        success: false,
        productId: 'product-e2e-1',
        provider: 'keepa',
        source: 'third_party',
        timestamp: now,
        durationMs: 0,
        failureReason: 'provider_unavailable',
        rootCause: 'missing_credentials',
        error: 'Keepa credentials are not configured in this test.',
      },
    });
  });

  await page.route('**/api/market-signals/providers/keepa/health**', async (route: Route) => {
    await route.fulfill({
      json: {
        provider: 'keepa',
        source: 'third_party',
        platform: 'amazon',
        status: 'insufficient_history',
        window: { windowHours: 24, since: now - 86_400_000, until: now },
        attemptCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageDurationMs: null,
        latestSuccessTimestamp: null,
        latestFailureReason: null,
        failureReasons: {},
        rootCauses: {},
        recommendations: [],
      },
    });
  });

  await page.route(/\/api\/scraper\/product\/[^/]+\/attempts/, async (route: Route) => {
    await route.fulfill({ json: { data: [] } });
  });

  await page.route(/\/api\/scraper\/product\/[^/]+\/job-diagnostics/, async (route: Route) => {
    const productId = route.request().url().match(/\/api\/scraper\/product\/([^/]+)\/job-diagnostics/)?.[1] ?? '';
    await route.fulfill({
      json: {
        productId,
        job: null,
        latestAttempt: null,
        providerGate: null,
        recommendations: [],
        caveat:
          'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.',
        generatedAt: now,
      },
    });
  });

  await page.route('**/api/scraper/queue/health**', async (route: Route) => {
    await route.fulfill({
      json: {
        backend: 'sqlite',
        status: 'insufficient_history',
        operationsVisible: true,
        scope: {},
        counts: {
          backlog: 0,
          pending: 0,
          running: 0,
          retryScheduled: 0,
          failed: 0,
          cancelled: 0,
          staleLeases: 0,
        },
        workerSummary: {
          total: 0,
          healthy: 0,
          stale: 0,
          busy: 0,
          idle: 0,
          capacity: 0,
          activeJobCount: 0,
        },
        providerGates: [],
        recommendations: [],
        caveat:
          'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.',
        generatedAt: now,
      },
    });
  });

  await page.route('**/api/scraper/providers/*/health**', async (route: Route) => {
    const platform = route.request().url().match(/\/api\/scraper\/providers\/([^/]+)\/health/)?.[1] ?? 'amazon';
    await route.fulfill({
      json: {
        platform,
        status: 'insufficient_history',
        window: { windowHours: 24, since: now - 86_400_000, until: now },
        providerSummaries: [],
        chainSummary: {
          totalAttempts: 0,
          liveSuccessCount: 0,
          liveFailureCount: 0,
          browserFallbackCount: 0,
          cacheFallbackCount: 0,
          primaryFailureCount: 0,
          degradedPathCounts: {},
          rootCauses: {},
        },
        latestAttempts: [],
        recommendations: [],
      },
    });
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
  await page.getByRole('button', { name: /Add Product/i }).last().click();
  await expect(page.getByText(/Must be a valid URL/i)).toBeVisible();
  await expect(page.getByText(/ASIN \/ Product ID is required/i)).toBeVisible();
  await expect(page.getByText(/Title is required/i)).toBeVisible();

  await page.getByLabel(/Product URL/i).fill('https://www.amazon.com/dp/B0E2E00001');
  await page.getByLabel(/ASIN \/ Product ID/i).fill('B0E2E00001');
  await page.getByLabel(/Product Title/i).fill('E2E Test Product');
  await page.getByLabel(/^Brand$/i).fill('Acme');
  await page.getByRole('button', { name: /Add Product/i }).last().click();

  await expect(page).toHaveURL(/\/products\/product-e2e-1$/);
  await expect(page.getByRole('heading', { name: 'E2E Test Product' })).toBeVisible();
  await expect(page.getByText('下一步：补齐选品研究基础')).toBeVisible();
  await expect(page.getByRole('link', { name: '记录首条读数' })).toHaveAttribute(
    'href',
    '#manual-reading',
  );
  await expect(page.getByRole('link', { name: '填写业务假设' })).toHaveAttribute(
    'href',
    '#business-assumptions',
  );
  await expect(page.getByRole('link', { name: '查看机会工作台' })).toHaveAttribute(
    'href',
    '/opportunities',
  );
  await page.getByRole('link', { name: '记录首条读数' }).click();
  await expect(page.getByRole('heading', { name: '手动录入读数' })).toBeVisible();
  await expect(page.getByText('下一步：补齐选品研究基础')).toBeVisible();
  await expect(page.getByRole('link', { name: '填写业务假设' })).toBeVisible();
  await page.getByRole('link', { name: '填写业务假设' }).click();
  await expect(page.getByRole('heading', { name: '业务选品假设' })).toBeVisible();
  await expect(page.getByText(/可填 12 或 0.12/)).toBeVisible();
  await page.getByLabel('Cost basis').fill('18.5');
  await page.getByLabel('Inbound shipping').fill('2.2');
  await page.getByLabel('Outbound shipping').fill('3.4');
  await page.getByLabel('Fulfillment fee').fill('4.1');
  await page.getByLabel('Platform fee').fill('1.5');
  await page.getByLabel('Referral rate').fill('12');
  await page.getByLabel('Ad cost').fill('3.5');
  await page.getByLabel('Tax/customs').fill('1.1');
  await page.getByLabel('Target price').fill('59.99');
  await page.getByRole('button', { name: '保存业务假设' }).click();
  await expect(page.getByText('业务假设已保存。')).toBeVisible();
  await expect(page.getByLabel('Referral rate')).toHaveValue('0.12');

  await page.getByRole('button', { name: /Back to Products/i }).click();
  await expect(page).toHaveURL(/\/products$/);
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
