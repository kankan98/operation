import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductDetail } from '@/pages/ProductDetail';
import {
  createMockPriceSnapshots,
  createMockPriceStats,
  createMockProduct,
} from '../__utils__/fixtures';
import type {
  MarketSignalProviderHealth,
  MarketSignalRefreshResult,
  MarketSignalSnapshot,
  ProviderHealthResponse,
  ScrapeAttempt,
} from '@/types';

const mutate = vi.fn();
const upsertMutate = vi.fn();
const refreshMarketSignalsMutate = vi.fn();
const upsertResearchMutate = vi.fn();

vi.mock('@/components/products/PriceTrendChart', () => ({
  PriceTrendChart: () => <div data-testid="price-trend-chart" />,
}));

vi.mock('@/hooks/useProducts', () => ({
  useProduct: vi.fn(),
  useProductAcquisitionAttempts: vi.fn(),
  useProductBusinessSignals: vi.fn(),
  useProductMarketSignalLatest: vi.fn(),
  useProductMarketSignalHistory: vi.fn(),
  useKeepaMarketSignalHealth: vi.fn(),
  useRefreshProductMarketSignals: vi.fn(),
  useUpsertProductBusinessSignals: vi.fn(),
  useProviderHealth: vi.fn(),
  useCheckProductNow: vi.fn(),
  useProductJobDiagnostics: vi.fn(),
  useAcquisitionQueueHealth: vi.fn(),
  useRetryAcquisitionJob: vi.fn(),
  useCancelAcquisitionJob: vi.fn(),
}));

vi.mock('@/hooks/useOpportunities', () => ({
  useProductOpportunity: vi.fn(),
  useUpsertOpportunityResearch: vi.fn(),
}));

vi.mock('@/hooks/usePriceStats', () => ({
  usePriceStats: vi.fn(),
  usePriceSnapshots: vi.fn(),
  useCreateSnapshot: vi.fn(),
}));

const product = createMockProduct({
  id: 'test-product-1',
  title: 'Test Product Detail',
  currentPrice: 299.99,
});

async function loadHookMocks() {
  const products = await import('@/hooks/useProducts');
  const opportunities = await import('@/hooks/useOpportunities');
  const priceStats = await import('@/hooks/usePriceStats');
  return {
    useProduct: vi.mocked(products.useProduct),
    useProductAcquisitionAttempts: vi.mocked(
      products.useProductAcquisitionAttempts
    ),
    useProductBusinessSignals: vi.mocked(products.useProductBusinessSignals),
    useProductMarketSignalLatest: vi.mocked(products.useProductMarketSignalLatest),
    useProductMarketSignalHistory: vi.mocked(products.useProductMarketSignalHistory),
    useKeepaMarketSignalHealth: vi.mocked(products.useKeepaMarketSignalHealth),
    useRefreshProductMarketSignals: vi.mocked(products.useRefreshProductMarketSignals),
    useUpsertProductBusinessSignals: vi.mocked(
      products.useUpsertProductBusinessSignals
    ),
    useProviderHealth: vi.mocked(products.useProviderHealth),
    useCheckProductNow: vi.mocked(products.useCheckProductNow),
    useProductJobDiagnostics: vi.mocked(products.useProductJobDiagnostics),
    useAcquisitionQueueHealth: vi.mocked(products.useAcquisitionQueueHealth),
    useRetryAcquisitionJob: vi.mocked(products.useRetryAcquisitionJob),
    useCancelAcquisitionJob: vi.mocked(products.useCancelAcquisitionJob),
    useProductOpportunity: vi.mocked(opportunities.useProductOpportunity),
    useUpsertOpportunityResearch: vi.mocked(
      opportunities.useUpsertOpportunityResearch
    ),
    usePriceStats: vi.mocked(priceStats.usePriceStats),
    usePriceSnapshots: vi.mocked(priceStats.usePriceSnapshots),
    useCreateSnapshot: vi.mocked(priceStats.useCreateSnapshot),
  };
}

function renderProductDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/test-product-1']}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductDetail', () => {
  beforeEach(async () => {
    mutate.mockReset();
    upsertMutate.mockReset();
    refreshMarketSignalsMutate.mockReset();
    upsertResearchMutate.mockReset();
    const hooks = await loadHookMocks();
    hooks.useProduct.mockReturnValue({ data: product, isLoading: false } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: {
        product,
        score: 78.2,
        recommendation: 'watch',
        research: null,
        keyReasons: [],
        factors: [],
        missingSignals: [],
      },
      isLoading: false,
    } as unknown);
    hooks.useUpsertOpportunityResearch.mockReturnValue({
      mutate: upsertResearchMutate,
      isPending: false,
    } as unknown);
    hooks.usePriceStats.mockReturnValue({
      data: createMockPriceStats({ currentPrice: 299.99 }),
      isLoading: false,
    } as unknown);
    hooks.usePriceSnapshots.mockReturnValue({
      data: createMockPriceSnapshots(3, product.id),
      isLoading: false,
    } as unknown);
    hooks.useCreateSnapshot.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    } as unknown);
    hooks.useProductAcquisitionAttempts.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown);
    hooks.useProductJobDiagnostics.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown);
    hooks.useAcquisitionQueueHealth.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown);
    hooks.useRetryAcquisitionJob.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown);
    hooks.useCancelAcquisitionJob.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown);
    hooks.useProductBusinessSignals.mockReturnValue({
      data: {
        assumptions: null,
        metrics: {
          completeness: 'none',
          missingSignals: ['costBasis'],
          netMargin: null,
          grossMargin: null,
          roi: null,
          breakevenSellPrice: null,
          contributionProfitPerUnit: null,
          totalVariableCost: null,
          priceSource: 'current_price',
          caveat: 'Business metrics are calculated from merchant-provided assumptions.',
        },
      },
      isLoading: false,
    } as unknown);
    hooks.useUpsertProductBusinessSignals.mockReturnValue({
      mutate: upsertMutate,
      isPending: false,
      isError: false,
    } as unknown);
    hooks.useProviderHealth.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown);
    hooks.useProductMarketSignalLatest.mockReturnValue({
      data: {
        data: null,
        status: 'missing',
        missingSignals: ['market_history'],
        caveat:
          'Keepa market signals are trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      },
      isLoading: false,
    } as unknown);
    hooks.useProductMarketSignalHistory.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown);
    hooks.useKeepaMarketSignalHealth.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown);
    hooks.useRefreshProductMarketSignals.mockReturnValue({
      mutate: refreshMarketSignalsMutate,
      isPending: false,
      data: undefined,
      error: null,
    } as unknown);
    hooks.useCheckProductNow.mockReturnValue({
      mutate,
      isPending: false,
      data: undefined,
      error: null,
    } as unknown);
  });

  it('renders product information and acquisition empty state', () => {
    renderProductDetail();

    expect(screen.getByText('Test Product Detail')).toBeInTheDocument();
    expect(screen.getByText('采集状态')).toBeInTheDocument();
    expect(screen.getByText('暂无采集尝试记录。')).toBeInTheDocument();
  });

  it('offers adding a product to the research workspace from detail', () => {
    renderProductDetail();

    expect(screen.getByText('机会研究状态')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('加入研究工作台'));

    expect(upsertResearchMutate).toHaveBeenCalledWith({
      productId: 'test-product-1',
      data: {
        status: 'researching',
        priority: 'medium',
        tags: [],
        notes: null,
        archived: false,
      },
    });
  });

  it('renders product research metadata when present', async () => {
    const hooks = await loadHookMocks();
    hooks.useProductOpportunity.mockReturnValue({
      data: {
        product,
        score: 91.4,
        recommendation: 'investigate',
        research: {
          productId: product.id,
          status: 'ready',
          priority: 'high',
          tags: ['launch', 'margin'],
          notes: 'Ready for supplier call.',
          notesSummary: 'Ready for supplier call.',
          archived: false,
          decision: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        keyReasons: [],
        factors: [],
        missingSignals: [],
      },
      isLoading: false,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText('准备推进')).toBeInTheDocument();
    // 评分 91.4 与 recommendation 现同时出现在机会研究卡片和透明评分构成卡片
    expect(screen.getAllByText('91.4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('investigate').length).toBeGreaterThan(0);
    expect(screen.getByText('#launch')).toBeInTheDocument();
    expect(screen.getByText('#margin')).toBeInTheDocument();
    expect(screen.getByText('Ready for supplier call.')).toBeInTheDocument();
  });

  it('renders missing market signals with refresh action', () => {
    renderProductDetail();

    expect(screen.getByText('市场趋势信号')).toBeInTheDocument();
    expect(screen.getByText(/暂无 Keepa 市场趋势快照/)).toBeInTheDocument();
    expect(screen.getByText('market_history')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('刷新市场趋势信号'));

    expect(refreshMarketSignalsMutate).toHaveBeenCalledWith('test-product-1');
  });

  it('renders fresh market signal snapshot summaries and caveat', async () => {
    const hooks = await loadHookMocks();
    const snapshot = createMarketSignalSnapshot(product.id);
    hooks.useProductMarketSignalLatest.mockReturnValue({
      data: {
        data: snapshot,
        status: 'fresh',
        missingSignals: [],
        caveat:
          'Keepa market signals are trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      },
      isLoading: false,
    } as unknown);
    hooks.useProductMarketSignalHistory.mockReturnValue({
      data: [snapshot],
      isLoading: false,
    } as unknown);
    hooks.useKeepaMarketSignalHealth.mockReturnValue({
      data: createMarketSignalHealth(),
      isLoading: false,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText('keepa healthy')).toBeInTheDocument();
    expect(screen.getAllByText('88%').length).toBeGreaterThan(0);
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getAllByText(/1,820 -8.4%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/not verified sales, demand, margin, ROI, or profitability facts/)).toBeInTheDocument();
  });

  it('renders failed market signal refresh diagnostics safely', async () => {
    const hooks = await loadHookMocks();
    const failure: MarketSignalRefreshResult = {
      success: false,
      productId: product.id,
      provider: 'keepa',
      source: 'third_party',
      timestamp: Date.now(),
      durationMs: 18,
      failureReason: 'provider_unavailable',
      rootCause: 'missing_credentials',
      error: 'Keepa credentials are not configured.',
    };
    hooks.useRefreshProductMarketSignals.mockReturnValue({
      mutate: refreshMarketSignalsMutate,
      isPending: false,
      data: failure,
      error: null,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText(/刷新失败：provider_unavailable · missing_credentials/)).toBeInTheDocument();
    expect(screen.getByText('Keepa credentials are not configured.')).toBeInTheDocument();
  });

  it('calls scraper acquisition when check now is clicked', () => {
    renderProductDetail();

    fireEvent.click(screen.getByRole('button', { name: /check|检查|checkNow/i }));

    expect(mutate).toHaveBeenCalledWith('test-product-1');
  });

  it('saves product business assumptions from the detail page', () => {
    renderProductDetail();

    fireEvent.change(screen.getByLabelText('Cost basis'), {
      target: { value: '120' },
    });
    fireEvent.change(screen.getByLabelText('Referral rate'), {
      target: { value: '0.15' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存业务假设' }));

    expect(upsertMutate).toHaveBeenCalledWith({
      productId: 'test-product-1',
      data: expect.objectContaining({
        costBasis: 120,
        referralFeeRate: 0.15,
      }),
    });
  });

  it('renders recent acquisition attempts and latest failure result', async () => {
    const hooks = await loadHookMocks();
    const attempt: ScrapeAttempt = {
      id: 'attempt-1',
      jobId: 'job-1',
      productId: product.id,
      provider: 'rainforest',
      source: 'third_party',
      status: 'failed',
      failureReason: 'provider_unavailable',
      errorMessage: 'Missing API key',
      durationMs: 12,
      confidence: null,
      httpStatus: 401,
      pageTitle: null,
      finalUrl: null,
      diagnostics: JSON.stringify({ providerErrorCode: 'missing_api_key' }),
      timestamp: Date.now(),
    };
    hooks.useProductAcquisitionAttempts.mockReturnValue({
      data: [attempt],
      isLoading: false,
    } as unknown);
    hooks.useCheckProductNow.mockReturnValue({
      mutate,
      isPending: false,
      data: {
        success: false,
        productId: product.id,
        jobId: 'job-1',
        attemptId: 'attempt-1',
        provider: 'rainforest',
        source: 'third_party',
        failureReason: 'provider_unavailable',
      },
      error: null,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText('rainforest')).toBeInTheDocument();
    expect(screen.getByText('third_party')).toBeInTheDocument();
    expect(screen.getAllByText('provider_unavailable').length).toBeGreaterThan(0);
    expect(screen.getByText(/HTTP 401/)).toBeInTheDocument();
    expect(screen.getByText(/Attempt attempt-/)).toBeInTheDocument();
  });

  it('renders Amazon provider health root causes and degraded paths', async () => {
    const hooks = await loadHookMocks();
    const providerHealth: ProviderHealthResponse = {
      platform: 'amazon',
      status: 'degraded',
      window: { windowHours: 24, since: 1000, until: 2000 },
      providerSummaries: [
        {
          provider: 'rainforest',
          source: 'third_party',
          attemptCount: 2,
          successCount: 0,
          failureCount: 2,
          successRate: 0,
          averageDurationMs: 400,
          latestSuccessTimestamp: null,
          latestFailureReason: 'provider_unavailable',
          latestConfidence: null,
          fallbackCount: 0,
          cacheCount: 0,
          failureReasons: { provider_unavailable: 2 },
          rootCauses: { quota_exhausted: 1, rate_limited: 1 },
        },
      ],
      chainSummary: {
        totalAttempts: 3,
        liveSuccessCount: 0,
        liveFailureCount: 2,
        browserFallbackCount: 1,
        cacheFallbackCount: 1,
        primaryFailureCount: 2,
        degradedPathCounts: { browser_fallback: 1, cache_fallback: 1 },
        rootCauses: { quota_exhausted: 1, cache_only: 1 },
      },
      latestAttempts: [],
      recommendations: [
        {
          code: 'check_quota',
          severity: 'warning',
          message:
            'Rainforest returned quota failures. Check provider quota before retrying.',
        },
      ],
    };
    hooks.useProviderHealth.mockReturnValue({
      data: providerHealth,
      isLoading: false,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText('Amazon provider health')).toBeInTheDocument();
    expect(screen.getByText('degraded fallback')).toBeInTheDocument();
    expect(screen.getByText(/Root causes:/)).toBeInTheDocument();
    expect(screen.getByText(/quota exhausted 1/)).toBeInTheDocument();
    expect(screen.getByText(/cache only 1/)).toBeInTheDocument();
    expect(screen.getByText(/browser fallback 1/)).toBeInTheDocument();
  });

  it('renders eBay provider health and safe root causes', async () => {
    const hooks = await loadHookMocks();
    const ebayProduct = createMockProduct({
      id: 'ebay-product-1',
      title: 'eBay Listing',
      platform: 'ebay',
      productUrl: 'https://www.ebay.com/itm/123456789012',
      asin: '',
    });
    const attempt: ScrapeAttempt = {
      id: 'attempt-ebay-1',
      jobId: 'job-ebay-1',
      productId: ebayProduct.id,
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'failed',
      failureReason: 'unsupported_url',
      errorMessage: 'Unsupported eBay URL',
      durationMs: 25,
      confidence: null,
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: JSON.stringify({
        rootCause: 'unsupported_url',
        marketplace: 'EBAY_US',
      }),
      timestamp: Date.now(),
    };
    const providerHealth: ProviderHealthResponse = {
      platform: 'ebay',
      status: 'degraded',
      window: { windowHours: 24, since: 1000, until: 2000 },
      providerSummaries: [
        {
          provider: 'ebay-browse',
          source: 'official_api',
          attemptCount: 1,
          successCount: 0,
          failureCount: 1,
          successRate: 0,
          averageDurationMs: 25,
          latestSuccessTimestamp: null,
          latestFailureReason: 'unsupported_url',
          latestConfidence: null,
          fallbackCount: 0,
          cacheCount: 0,
          failureReasons: { unsupported_url: 1 },
          rootCauses: { unsupported_url: 1 },
        },
      ],
      chainSummary: {
        totalAttempts: 1,
        liveSuccessCount: 0,
        liveFailureCount: 1,
        browserFallbackCount: 0,
        cacheFallbackCount: 0,
        primaryFailureCount: 0,
        degradedPathCounts: {},
        rootCauses: { unsupported_url: 1 },
      },
      latestAttempts: [],
      recommendations: [
        {
          code: 'check_ebay_item_id',
          severity: 'warning',
          message: 'Use a supported /itm/<id> URL or store ebayItemId metadata.',
        },
      ],
    };

    hooks.useProduct.mockReturnValue({ data: ebayProduct, isLoading: false } as unknown);
    hooks.useProductAcquisitionAttempts.mockReturnValue({
      data: [attempt],
      isLoading: false,
    } as unknown);
    hooks.useProviderHealth.mockReturnValue({
      data: providerHealth,
      isLoading: false,
    } as unknown);

    renderProductDetail();

    expect(screen.getByText('eBay provider health')).toBeInTheDocument();
    expect(screen.getByText('ebay-browse')).toBeInTheDocument();
    expect(screen.getByText('official_api')).toBeInTheDocument();
    expect(screen.getByText(/root cause: unsupported_url/)).toBeInTheDocument();
    expect(screen.getByText(/marketplace: EBAY_US/)).toBeInTheDocument();
    expect(screen.getByText(/supported \/itm\/<id>/)).toBeInTheDocument();
  });
});

function createMarketSignalSnapshot(productId: string): MarketSignalSnapshot {
  return {
    id: 'market-signal-1',
    productId,
    platform: 'amazon',
    provider: 'keepa',
    source: 'third_party',
    asin: 'B000TEST01',
    marketplace: 'US',
    windowDays: 90,
    confidence: 0.88,
    freshnessMs: 3_600_000,
    priceTrend: {
      current: 99.99,
      average: 104.12,
      lowest: 88,
      highest: 120,
      changePercent: 2.5,
      volatility: 0.08,
      direction: 'up',
      dataPoints: 42,
      firstObservedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastObservedAt: Date.now(),
    },
    salesRankTrend: {
      current: 1820,
      average: 2100,
      lowest: 1500,
      highest: 2600,
      changePercent: -8.4,
      volatility: 0.12,
      direction: 'down',
      dataPoints: 36,
      firstObservedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastObservedAt: Date.now(),
    },
    reviewVelocity: 2.5,
    ratingMovement: 0.1,
    missingSignals: [],
    metadata: { category: 'Electronics' },
    createdAt: Date.now(),
  };
}

function createMarketSignalHealth(): MarketSignalProviderHealth {
  return {
    provider: 'keepa',
    source: 'third_party',
    platform: 'amazon',
    status: 'healthy',
    window: { windowHours: 24, since: 1000, until: 2000 },
    attemptCount: 4,
    successCount: 4,
    failureCount: 0,
    successRate: 1,
    averageDurationMs: 250,
    latestSuccessTimestamp: 2000,
    latestFailureReason: null,
    failureReasons: {},
    rootCauses: {},
    recommendations: [],
  };
}
