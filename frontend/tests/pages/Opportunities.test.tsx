import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Opportunities } from '@/pages/Opportunities';
import type { ProductOpportunity } from '@/types';
import { createMockProduct } from '../__utils__/fixtures';

const mutate = vi.fn();
const refreshMarketSignalsMutate = vi.fn();
const upsertResearchMutate = vi.fn();
const archiveResearchMutate = vi.fn();
const compareResearchMutate = vi.fn();
const exportResearchMutate = vi.fn();

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: vi.fn(),
  useProductOpportunity: vi.fn(),
  useUpsertOpportunityResearch: vi.fn(),
  useArchiveOpportunityResearch: vi.fn(),
  useCompareOpportunityResearch: vi.fn(),
  useExportOpportunityResearch: vi.fn(),
}));

vi.mock('@/hooks/useProducts', () => ({
  useCheckProductNow: vi.fn(),
  useRefreshProductMarketSignals: vi.fn(),
}));

const opportunities = [
  createOpportunity({
    id: 'product-1',
    title: 'Alpha Headphones',
    score: 82.4,
    recommendation: 'check_data',
  }),
  createOpportunity({
    id: 'product-2',
    title: 'Beta Keyboard',
    score: 61.2,
    recommendation: 'watch',
  }),
];

async function loadMocks() {
  const opportunityHooks = await import('@/hooks/useOpportunities');
  const productHooks = await import('@/hooks/useProducts');
  return {
    useOpportunities: vi.mocked(opportunityHooks.useOpportunities),
    useProductOpportunity: vi.mocked(opportunityHooks.useProductOpportunity),
    useUpsertOpportunityResearch: vi.mocked(
      opportunityHooks.useUpsertOpportunityResearch
    ),
    useArchiveOpportunityResearch: vi.mocked(
      opportunityHooks.useArchiveOpportunityResearch
    ),
    useCompareOpportunityResearch: vi.mocked(
      opportunityHooks.useCompareOpportunityResearch
    ),
    useExportOpportunityResearch: vi.mocked(
      opportunityHooks.useExportOpportunityResearch
    ),
    useCheckProductNow: vi.mocked(productHooks.useCheckProductNow),
    useRefreshProductMarketSignals: vi.mocked(
      productHooks.useRefreshProductMarketSignals
    ),
  };
}

describe('Opportunities page', () => {
  beforeEach(async () => {
    mutate.mockReset();
    refreshMarketSignalsMutate.mockReset();
    upsertResearchMutate.mockReset();
    archiveResearchMutate.mockReset();
    compareResearchMutate.mockReset();
    exportResearchMutate.mockReset();
    const hooks = await loadMocks();
    hooks.useOpportunities.mockReturnValue({
      data: { data: opportunities, total: 2, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockImplementation((productId?: string) => ({
      data: opportunities.find((item) => item.product.id === productId),
      isLoading: false,
    }) as unknown);
    hooks.useUpsertOpportunityResearch.mockReturnValue({
      mutate: upsertResearchMutate,
      isPending: false,
    } as unknown);
    hooks.useArchiveOpportunityResearch.mockReturnValue({
      mutate: archiveResearchMutate,
      isPending: false,
    } as unknown);
    hooks.useCompareOpportunityResearch.mockReturnValue({
      mutate: compareResearchMutate,
      isPending: false,
      data: undefined,
    } as unknown);
    hooks.useExportOpportunityResearch.mockReturnValue({
      mutate: exportResearchMutate,
      isPending: false,
      data: undefined,
    } as unknown);
    hooks.useCheckProductNow.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown);
    hooks.useRefreshProductMarketSignals.mockReturnValue({
      mutate: refreshMarketSignalsMutate,
      isPending: false,
    } as unknown);
  });

  it('renders loading state', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunities.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('计算中')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunities.mockReturnValue({
      data: { data: [], total: 0, pagination: { page: 1, limit: 30, totalPages: 0 } },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('暂无候选商品')).toBeInTheDocument();
  });

  it('renders ranked results and explanation panel', async () => {
    render(<Opportunities />);

    expect(screen.getAllByText('Alpha Headphones').length).toBeGreaterThan(0);
    expect(screen.getByText('Beta Keyboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('因子拆解')).toBeInTheDocument();
    });
    expect(screen.getByText('profit_margin')).toBeInTheDocument();
    expect(screen.getByText('市场趋势信号')).toBeInTheDocument();
    expect(screen.getByText('Sales rank trend')).toBeInTheDocument();
    expect(screen.getByText(/rank trend evidence/)).toBeInTheDocument();
    expect(screen.getByText(/不验证利润率、销量或真实需求/)).toBeInTheDocument();
  });

  it('updates filters when controls change', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    fireEvent.change(screen.getByLabelText('推荐动作筛选'), {
      target: { value: 'watch' },
    });
    fireEvent.change(screen.getByLabelText('平台筛选'), {
      target: { value: 'amazon' },
    });
    fireEvent.change(screen.getByLabelText('最低分'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('业务完整度筛选'), {
      target: { value: 'complete' },
    });
    fireEvent.change(screen.getByLabelText('最低 ROI'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByLabelText('研究状态筛选'), {
      target: { value: 'ready' },
    });
    fireEvent.change(screen.getByLabelText('研究标签筛选'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByLabelText('只看研究工作台'));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          recommendation: 'watch',
          platform: 'amazon',
          minScore: 70,
          businessReadiness: 'complete',
          minRoi: 0.5,
          shortlisted: true,
          researchStatus: 'ready',
          researchTag: 'launch',
        })
      );
    });
  });

  it('adds an opportunity to the research workspace', async () => {
    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('加入 Alpha Headphones 到研究工作台'));

    expect(upsertResearchMutate).toHaveBeenCalledWith({
      productId: 'product-1',
      data: {
        status: 'researching',
        priority: 'medium',
        tags: [],
        notes: null,
        archived: false,
      },
    });
  });

  it('edits research status tags priority and notes', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'research-product',
      title: 'Research Product',
      score: 84,
      recommendation: 'investigate',
      research: {
        status: 'watching',
        priority: 'medium',
        tags: ['launch'],
        notes: 'Initial note',
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [researched], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: researched,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    fireEvent.change(screen.getByLabelText('编辑研究状态'), {
      target: { value: 'ready' },
    });
    fireEvent.change(screen.getByLabelText('编辑研究优先级'), {
      target: { value: 'high' },
    });
    fireEvent.change(screen.getByLabelText('编辑研究标签'), {
      target: { value: 'Launch, Margin' },
    });
    fireEvent.change(screen.getByLabelText('编辑研究备注'), {
      target: { value: 'Ready for supplier call.' },
    });
    fireEvent.click(screen.getByLabelText('保存研究元数据'));

    expect(upsertResearchMutate).toHaveBeenCalledWith({
      productId: 'research-product',
      data: {
        status: 'ready',
        priority: 'high',
        tags: ['launch', 'margin'],
        notes: 'Ready for supplier call.',
        archived: false,
      },
    });
  });

  it('selects candidates for comparison and export', async () => {
    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('选择 Alpha Headphones 比较'));
    fireEvent.click(screen.getByLabelText('选择 Beta Keyboard 比较'));
    fireEvent.click(screen.getByLabelText('比较选中候选'));

    expect(compareResearchMutate).toHaveBeenCalledWith({
      productIds: ['product-1', 'product-2'],
    });

    fireEvent.click(screen.getByLabelText('导出研究候选'));

    expect(exportResearchMutate).toHaveBeenCalledWith(
      { format: 'csv', productIds: ['product-1', 'product-2'], limit: 100 },
      expect.any(Object),
    );
  });

  it('disables comparison selection beyond the supported limit', async () => {
    const hooks = await loadMocks();
    const many = Array.from({ length: 7 }, (_, index) =>
      createOpportunity({
        id: `compare-${index + 1}`,
        title: `Compare ${index + 1}`,
        score: 70 + index,
        recommendation: 'watch',
      })
    );
    hooks.useOpportunities.mockReturnValue({
      data: { data: many, total: 7, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockImplementation((productId?: string) => ({
      data: many.find((item) => item.product.id === productId),
      isLoading: false,
    }) as unknown);

    render(<Opportunities />);

    for (let index = 1; index <= 6; index += 1) {
      fireEvent.click(screen.getByLabelText(`选择 Compare ${index} 比较`));
    }

    expect(screen.getByLabelText('选择 Compare 7 比较')).toBeDisabled();
  });

  it('switches explanation selection', async () => {
    render(<Opportunities />);

    fireEvent.click(screen.getByText('Beta Keyboard'));

    await waitFor(() => {
      expect(screen.queryByLabelText('立即检查商品数据')).not.toBeInTheDocument();
    });
  });

  it('triggers manual check for check_data recommendations', async () => {
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByLabelText('立即检查商品数据')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('立即检查商品数据'));

    expect(mutate).toHaveBeenCalledWith('product-1');
  });

  it('triggers market signal refresh for missing Amazon trend signals', async () => {
    const hooks = await loadMocks();
    const missingMarketOpportunity = createOpportunity({
      id: 'missing-market-product',
      title: 'Missing Market Product',
      score: 68,
      recommendation: 'check_data',
      marketStatus: 'missing',
    });
    hooks.useOpportunities.mockReturnValue({
      data: {
        data: [missingMarketOpportunity],
        total: 1,
        pagination: { page: 1, limit: 30, totalPages: 1 },
      },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: missingMarketOpportunity,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByLabelText('刷新市场趋势信号')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('刷新市场趋势信号'));

    expect(refreshMarketSignalsMutate).toHaveBeenCalledWith('missing-market-product');
    expect(screen.getAllByText('market_trend').length).toBeGreaterThan(0);
  });

  it('shows eBay provider/source and listing-data caveat', async () => {
    const hooks = await loadMocks();
    const ebayOpportunity = createOpportunity({
      id: 'ebay-product',
      title: 'eBay Listing',
      score: 74,
      recommendation: 'check_data',
      platform: 'ebay',
      provider: 'ebay-browse',
      source: 'official_api',
      failureReason: 'unsupported_url',
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [ebayOpportunity], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: ebayOpportunity,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getAllByText(/ebay-browse\/official_api/).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText(/eBay Browse 只提供当前 listing 数据/)).toBeInTheDocument();
    });
    expect(screen.getByLabelText('立即检查商品数据')).toBeInTheDocument();
  });
});

function createOpportunity({
  id,
  title,
  score,
  recommendation,
  platform = 'amazon',
  provider = 'rainforest',
  source = 'third_party',
  failureReason = null,
  marketStatus = 'fresh',
  research,
}: {
  id: string;
  title: string;
  score: number;
  recommendation: ProductOpportunity['recommendation'];
  platform?: ProductOpportunity['product']['platform'];
  provider?: string;
  source?: string;
  failureReason?: string | null;
  marketStatus?: NonNullable<ProductOpportunity['marketSignals']>['status'];
  research?: {
    status: NonNullable<ProductOpportunity['research']>['status'];
    priority: NonNullable<ProductOpportunity['research']>['priority'];
    tags: string[];
    notes: string | null;
  };
}): ProductOpportunity {
  const hasMarketSignals = marketStatus === 'fresh' || marketStatus === 'stale';
  return {
    product: createMockProduct({
      id,
      title,
      category: 'electronics',
      currentPrice: 99,
      platform,
    }),
    score,
    confidence: 0.72,
    recommendation,
    keyReasons: ['Current price is below average.'],
    missingSignals: ['profit_margin', 'sales_volume', 'demand'],
    factors: [
      {
        name: 'price_position',
        label: 'Price position',
        rawValue: -12,
        normalizedScore: 74,
        weight: 0.2,
        contribution: 14.8,
        direction: 'positive',
        explanation: 'Current price is below average.',
      },
      {
        name: 'acquisition_health',
        label: 'Acquisition health',
        rawValue: 'success',
        normalizedScore: 82,
        weight: 0.18,
        contribution: 14.8,
        direction: 'positive',
        explanation: 'Latest acquisition succeeded via rainforest.',
      },
    ],
    acquisitionHealth: {
      provider,
      source,
      status: failureReason ? 'failed' : 'success',
      failureReason,
      confidence: 0.9,
      durationMs: 1200,
      timestamp: Date.now(),
      freshnessMs: 1000,
    },
    businessSignals: {
      completeness: 'none',
      missingSignals: ['costBasis', 'fees'],
      metrics: null,
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    },
    marketSignals: {
      status: marketStatus,
      provider: hasMarketSignals ? 'keepa' : null,
      source: hasMarketSignals ? 'third_party' : null,
      confidence: hasMarketSignals ? 0.84 : null,
      freshnessMs: marketStatus === 'stale' ? 96 * 60 * 60 * 1000 : hasMarketSignals ? 60 * 60 * 1000 : null,
      missingSignals: hasMarketSignals ? [] : ['market_trend'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: hasMarketSignals
        ? [
            {
              name: 'market_sales_rank_trend',
              label: 'Sales rank trend',
              rawValue: -8.4,
              normalizedScore: 70,
              weight: 0.07,
              contribution: 4.9,
              direction: 'positive',
              source: 'third_party',
              freshnessMs: 60 * 60 * 1000,
              confidenceImpact: 0.06,
              explanation:
                'Keepa sales rank movement is treated as rank trend evidence only; it is not converted into verified sales volume.',
            },
          ]
        : [],
    },
    research: research
      ? {
          productId: id,
          status: research.status,
          priority: research.priority,
          tags: research.tags,
          notes: research.notes,
          notesSummary: research.notes,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : undefined,
  };
}
