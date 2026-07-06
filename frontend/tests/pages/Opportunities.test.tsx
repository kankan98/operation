import { describe, it, expect, vi, beforeEach } from 'vitest';
import { within } from '@testing-library/react';
import { fireEvent, render, screen, waitFor } from '../__utils__/renderWithProviders';
import { Opportunities } from '@/pages/Opportunities';
import type { ProductOpportunity } from '@/types';
import { createMockProduct } from '../__utils__/fixtures';
import {
  OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH,
} from '../../../shared/schemas';

const mutate = vi.fn();
const refreshMarketSignalsMutate = vi.fn();
const upsertResearchMutate = vi.fn();
const archiveResearchMutate = vi.fn();
const saveDecisionMutate = vi.fn();
const clearDecisionMutate = vi.fn();
const saveActionOutcomeMutate = vi.fn();
const clearActionOutcomeMutate = vi.fn();
const compareResearchMutate = vi.fn();
const exportResearchMutate = vi.fn();
const createSnapshotMutate = vi.fn();

function formatLocalDateInputValue(value: number = Date.now()): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateTimestamp(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: vi.fn(),
  useProductOpportunity: vi.fn(),
  useOpportunityResearchSummary: vi.fn(),
  useOpportunityPracticeSummary: vi.fn(),
  useOpportunityDailyActionPlan: vi.fn(),
  useUpsertOpportunityResearch: vi.fn(),
  useArchiveOpportunityResearch: vi.fn(),
  useSaveOpportunityResearchActionOutcome: vi.fn(),
  useClearOpportunityResearchActionOutcome: vi.fn(),
  useSaveOpportunityResearchDecision: vi.fn(),
  useClearOpportunityResearchDecision: vi.fn(),
  useCompareOpportunityResearch: vi.fn(),
  useExportOpportunityResearch: vi.fn(),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useCheckProductNow: vi.fn(),
  useRefreshProductMarketSignals: vi.fn(),
}));

vi.mock('@/hooks/usePriceStats', () => ({
  useCreateSnapshot: vi.fn(),
}));

// 组件直接用 useQueries 调用 scraperApi.productJobDiagnostics，
// 测试中桩掉该调用避免真实网络请求
vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    scraperApi: {
      ...actual.scraperApi,
      productJobDiagnostics: vi.fn().mockResolvedValue(null),
    },
  };
});

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
  const priceHooks = await import('@/hooks/usePriceStats');
  return {
    useOpportunities: vi.mocked(opportunityHooks.useOpportunities),
    useProductOpportunity: vi.mocked(opportunityHooks.useProductOpportunity),
    useOpportunityResearchSummary: vi.mocked(
      opportunityHooks.useOpportunityResearchSummary
    ),
    useOpportunityPracticeSummary: vi.mocked(
      opportunityHooks.useOpportunityPracticeSummary
    ),
    useOpportunityDailyActionPlan: vi.mocked(
      opportunityHooks.useOpportunityDailyActionPlan
    ),
    useUpsertOpportunityResearch: vi.mocked(
      opportunityHooks.useUpsertOpportunityResearch
    ),
    useArchiveOpportunityResearch: vi.mocked(
      opportunityHooks.useArchiveOpportunityResearch
    ),
    useSaveOpportunityResearchActionOutcome: vi.mocked(
      opportunityHooks.useSaveOpportunityResearchActionOutcome
    ),
    useClearOpportunityResearchActionOutcome: vi.mocked(
      opportunityHooks.useClearOpportunityResearchActionOutcome
    ),
    useSaveOpportunityResearchDecision: vi.mocked(
      opportunityHooks.useSaveOpportunityResearchDecision
    ),
    useClearOpportunityResearchDecision: vi.mocked(
      opportunityHooks.useClearOpportunityResearchDecision
    ),
    useCompareOpportunityResearch: vi.mocked(
      opportunityHooks.useCompareOpportunityResearch
    ),
    useExportOpportunityResearch: vi.mocked(
      opportunityHooks.useExportOpportunityResearch
    ),
    useProducts: vi.mocked(productHooks.useProducts),
    useCheckProductNow: vi.mocked(productHooks.useCheckProductNow),
    useRefreshProductMarketSignals: vi.mocked(
      productHooks.useRefreshProductMarketSignals
    ),
    useCreateSnapshot: vi.mocked(priceHooks.useCreateSnapshot),
  };
}

describe('Opportunities page', () => {
  beforeEach(async () => {
    mutate.mockReset();
    refreshMarketSignalsMutate.mockReset();
    upsertResearchMutate.mockReset();
    archiveResearchMutate.mockReset();
    saveDecisionMutate.mockReset();
    clearDecisionMutate.mockReset();
    saveActionOutcomeMutate.mockReset();
    clearActionOutcomeMutate.mockReset();
    compareResearchMutate.mockReset();
    exportResearchMutate.mockReset();
    createSnapshotMutate.mockReset();
    const hooks = await loadMocks();
    hooks.useOpportunities.mockReturnValue({
      data: { data: opportunities, total: 2, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProducts.mockReturnValue({
      data: opportunities.map((item) => item.product),
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockImplementation((productId?: string) => ({
      data: opportunities.find((item) => item.product.id === productId),
      isLoading: false,
    }) as unknown);
    hooks.useOpportunityResearchSummary.mockReturnValue({
      data: {
        totalActive: 4,
        decided: 2,
        undecided: 2,
        needsNextAction: 1,
        stale: 1,
        byStatus: {
          researching: 1,
          watching: 1,
          ready: 2,
          rejected: 0,
        },
        byPriority: {
          low: 1,
          medium: 1,
          high: 2,
        },
        generatedAt: Date.now(),
        caveat:
          'Review summary counts are workflow queue metadata and do not change opportunity score, confidence, recommendation, gates, or factor contributions.',
      },
      isLoading: false,
    } as unknown);
    hooks.useOpportunityPracticeSummary.mockReturnValue({
      data: {
        totalActive: 4,
        withOutcome: 2,
        withoutOutcome: 2,
        byActionId: {
          add_next_action: 1,
          review_stale_decisions: 0,
          decide_candidates: 1,
          continue_research: 0,
        },
        latestCompletedAt: localDateTimestamp(
          formatLocalDateInputValue(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ),
        generatedAt: Date.now(),
        caveat:
          'Practice summary counts are workflow practice coverage metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.',
      },
      isLoading: false,
    } as unknown);
    hooks.useOpportunityDailyActionPlan.mockReturnValue({
      data: {
        items: [
          {
            id: 'add_next_action',
            label: '补齐下一步行动',
            reason: '推进或暂缓的决策需要明确下一步。',
            learningGoal: '练习把判断转成可执行跟进。',
            steps: [
              '打开缺下一步的决策队列。',
              '为每个 go/hold 决策写下一条可执行动作。',
            ],
            completionCriteria: ['每个 go/hold 决策都有下一步行动。'],
            priority: 1,
            count: 2,
            filters: {
              workspaceMode: 'review',
              shortlisted: true,
              decisionReview: 'needs_action',
            },
          },
          {
            id: 'continue_research',
            label: '继续调研中候选',
            reason: '调研中的候选需要补证据。',
            learningGoal: '练习补齐能支持后续判断的最小证据。',
            steps: ['打开调研中候选。'],
            completionCriteria: ['至少补充一项缺失证据或备注。'],
            priority: 4,
            count: 1,
            filters: {
              workspaceMode: 'discover',
              shortlisted: true,
              researchStatus: 'researching',
            },
          },
        ],
        generatedAt: Date.now(),
        caveat:
          'Daily action plan items are workflow practice metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.',
      },
      isLoading: false,
    } as unknown);
    hooks.useUpsertOpportunityResearch.mockReturnValue({
      mutate: upsertResearchMutate,
      isPending: false,
    } as unknown);
    hooks.useArchiveOpportunityResearch.mockReturnValue({
      mutate: archiveResearchMutate,
      isPending: false,
    } as unknown);
    hooks.useSaveOpportunityResearchActionOutcome.mockReturnValue({
      mutate: saveActionOutcomeMutate,
      isPending: false,
    } as unknown);
    hooks.useClearOpportunityResearchActionOutcome.mockReturnValue({
      mutate: clearActionOutcomeMutate,
      isPending: false,
    } as unknown);
    hooks.useSaveOpportunityResearchDecision.mockReturnValue({
      mutate: saveDecisionMutate,
      isPending: false,
    } as unknown);
    hooks.useClearOpportunityResearchDecision.mockReturnValue({
      mutate: clearDecisionMutate,
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
    hooks.useCreateSnapshot.mockReturnValue({
      mutate: createSnapshotMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
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

  it('guides users to add products when opportunity analysis has no products', async () => {
    const hooks = await loadMocks();
    hooks.useProducts.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown);
    hooks.useOpportunities.mockReturnValue({
      data: { data: [], total: 0, pagination: { page: 1, limit: 30, totalPages: 0 } },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText(/机会分析需要先添加商品/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /前往商品/ })).toHaveAttribute(
      'href',
      '/products',
    );
  });

  it('explains insufficient opportunity data when products exist but no opportunities are available', async () => {
    const hooks = await loadMocks();
    hooks.useProducts.mockReturnValue({
      data: [createMockProduct({ id: 'product-without-signals' })],
      isLoading: false,
    } as unknown);
    hooks.useOpportunities.mockReturnValue({
      data: { data: [], total: 0, pagination: { page: 1, limit: 30, totalPages: 0 } },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText(/机会判断还缺少价格、市场或业务假设/)).toBeInTheDocument();
    expect(screen.getByText(/记录手动读数/)).toBeInTheDocument();
    expect(screen.getByText(/立即检查/)).toBeInTheDocument();
    expect(screen.getByText(/刷新市场趋势信号/)).toBeInTheDocument();
    expect(screen.getByText(/业务假设/)).toBeInTheDocument();
  });

  it('renders ranked results and explanation panel', async () => {
    render(<Opportunities />);

    expect(screen.getAllByText('Alpha Headphones').length).toBeGreaterThan(0);
    expect(screen.getByText('Beta Keyboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('因子拆解')).toBeInTheDocument();
    });
    expect(screen.getByText('利润率')).toBeInTheDocument();
    expect(screen.getByText('市场趋势信号')).toBeInTheDocument();
    expect(screen.getByText('Sales rank trend')).toBeInTheDocument();
    expect(screen.getByText(/rank trend evidence/)).toBeInTheDocument();
    expect(screen.getByText(/不验证利润率、销量或真实需求/)).toBeInTheDocument();
  });

  it('renders opportunity review summary cards as workflow counts', async () => {
    const hooks = await loadMocks();
    const generatedAt = Date.UTC(2026, 6, 5, 1, 2, 3);
    hooks.useOpportunityResearchSummary.mockReturnValue({
      data: {
        totalActive: 4,
        decided: 2,
        undecided: 2,
        needsNextAction: 1,
        stale: 1,
        byStatus: {
          researching: 1,
          watching: 1,
          ready: 2,
          rejected: 0,
        },
        byPriority: {
          low: 1,
          medium: 1,
          high: 2,
        },
        generatedAt,
        caveat:
          'Review summary counts are workflow queue metadata and do not change opportunity score, confidence, recommendation, gates, or factor contributions.',
      },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('活跃研究')).toBeInTheDocument();
    expect(screen.getAllByText('未决策').length).toBeGreaterThan(0);
    expect(screen.getByText('待下一步')).toBeInTheDocument();
    expect(screen.getByText('需复盘')).toBeInTheDocument();
    expect(screen.getByLabelText('筛选复盘汇总：活跃研究')).toBeInTheDocument();
    expect(screen.getByLabelText('筛选复盘汇总：未决策')).toBeInTheDocument();
    expect(screen.getByLabelText('筛选复盘汇总：待下一步')).toBeInTheDocument();
    expect(screen.getByLabelText('筛选复盘汇总：需复盘')).toBeInTheDocument();
    expect(
      screen.getByText(`汇总时间 · ${new Date(generatedAt).toLocaleString()}`),
    ).toBeInTheDocument();
    expect(screen.getByText(/workflow queue metadata/)).toBeInTheDocument();
    expect(screen.getAllByText('工作流').length).toBeGreaterThanOrEqual(4);
  });

  it('applies existing review filters from review summary cards', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    const activeCard = screen.getByLabelText('筛选复盘汇总：活跃研究');
    const undecidedCard = screen.getByLabelText('筛选复盘汇总：未决策');
    const needsActionCard = screen.getByLabelText('筛选复盘汇总：待下一步');
    const staleCard = screen.getByLabelText('筛选复盘汇总：需复盘');

    expect(activeCard).toHaveAttribute('aria-pressed', 'false');
    expect(undecidedCard).toHaveAttribute('aria-pressed', 'false');
    expect(needsActionCard).toHaveAttribute('aria-pressed', 'false');
    expect(staleCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(undecidedCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'undecided',
          decisionStatus: undefined,
          actionOutcome: undefined,
          actionId: undefined,
        }),
      );
    });
    expect(screen.getByLabelText('决策复盘筛选')).toHaveValue('undecided');
    expect(undecidedCard).toHaveAttribute('aria-pressed', 'true');
    expect(activeCard).toHaveAttribute('aria-pressed', 'false');
    expect(needsActionCard).toHaveAttribute('aria-pressed', 'false');
    expect(staleCard).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('当前队列')).toBeInTheDocument();

    fireEvent.click(needsActionCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'needs_action',
        }),
      );
    });
    expect(screen.getByLabelText('决策复盘筛选')).toHaveValue('needs_action');
    expect(needsActionCard).toHaveAttribute('aria-pressed', 'true');
    expect(undecidedCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(staleCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'stale',
        }),
      );
    });
    expect(screen.getByLabelText('决策复盘筛选')).toHaveValue('stale');
    expect(staleCard).toHaveAttribute('aria-pressed', 'true');
    expect(needsActionCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(activeCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'all',
        }),
      );
    });
    expect(screen.getByLabelText('决策复盘筛选')).toHaveValue('all');
    expect(activeCard).toHaveAttribute('aria-pressed', 'true');
    expect(staleCard).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not mark review summary cards active for narrowed views', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    const staleCard = screen.getByLabelText('筛选复盘汇总：需复盘');
    fireEvent.click(staleCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'stale',
        }),
      );
    });
    expect(staleCard).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByLabelText('研究状态筛选'), {
      target: { value: 'ready' },
    });

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          researchStatus: 'ready',
          decisionReview: 'stale',
        }),
      );
    });
    expect(staleCard).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('当前队列')).not.toBeInTheDocument();
  });

  it('clears practice action context when review summary cards apply filters', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('筛选行动分桶：补齐下一步行动'));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actionId: 'add_next_action',
          decisionReview: undefined,
        }),
      );
    });
    expect(screen.getByText('工作流练习筛选')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('筛选复盘汇总：需复盘'));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'stale',
          actionOutcome: undefined,
          actionId: undefined,
        }),
      );
    });
    expect(screen.queryByText('工作流练习筛选')).not.toBeInTheDocument();
  });

  it('does not infer review summary generated time when the summary time is missing', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunityResearchSummary.mockReturnValue({
      data: {
        totalActive: 4,
        decided: 2,
        undecided: 2,
        needsNextAction: 1,
        stale: 1,
        byStatus: {
          researching: 1,
          watching: 1,
          ready: 2,
          rejected: 0,
        },
        byPriority: {
          low: 1,
          medium: 1,
          high: 2,
        },
        generatedAt: undefined,
        caveat:
          'Review summary counts are workflow queue metadata and do not change opportunity score, confidence, recommendation, gates, or factor contributions.',
      },
      isLoading: false,
    } as unknown);
    hooks.useOpportunityPracticeSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText(/workflow queue metadata/)).toBeInTheDocument();
    expect(screen.queryByText(/汇总时间 ·/)).not.toBeInTheDocument();
  });

  it('renders practice summary strip as workflow practice coverage', async () => {
    const hooks = await loadMocks();
    const generatedAt = Date.UTC(2026, 6, 5, 3, 4, 5);
    hooks.useOpportunityPracticeSummary.mockReturnValue({
      data: {
        totalActive: 4,
        withOutcome: 2,
        withoutOutcome: 2,
        byActionId: {
          add_next_action: 1,
          review_stale_decisions: 0,
          decide_candidates: 1,
          continue_research: 0,
        },
        latestCompletedAt: localDateTimestamp(
          formatLocalDateInputValue(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ),
        generatedAt,
        caveat:
          'Practice summary counts are workflow practice coverage metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.',
      },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('行动练习覆盖')).toBeInTheDocument();
    expect(
      screen.getByText(`汇总时间 · ${new Date(generatedAt).toLocaleString()}`),
    ).toBeInTheDocument();
    expect(screen.getAllByText('练习覆盖').length).toBeGreaterThan(0);
    expect(screen.getByText('未记录结果')).toBeInTheDocument();
    expect(screen.getByText('最近完成')).toBeInTheDocument();
    expect(screen.getByText('4 个活跃研究')).toBeInTheDocument();
    expect(screen.getByText('等待执行证据')).toBeInTheDocument();
    expect(screen.getByText('2 天前完成')).toBeInTheDocument();
    expect(screen.getAllByText('补齐下一步行动').length).toBeGreaterThan(0);
    expect(screen.getAllByText('复盘过期决策').length).toBeGreaterThan(0);
    expect(screen.getAllByText('判断未决策候选').length).toBeGreaterThan(0);
    expect(screen.getAllByText('继续调研中候选').length).toBeGreaterThan(0);
    expect(screen.getByText(/workflow practice coverage metadata/)).toBeInTheDocument();
  });

  it('does not infer practice summary generated time while loading', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunityResearchSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown);
    hooks.useOpportunityPracticeSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('行动练习覆盖')).toBeInTheDocument();
    expect(screen.queryByText(/汇总时间 ·/)).not.toBeInTheDocument();
  });

  it('keeps the practice summary latest completion empty state', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunityPracticeSummary.mockReturnValue({
      data: {
        totalActive: 4,
        withOutcome: 0,
        withoutOutcome: 4,
        byActionId: {
          add_next_action: 0,
          review_stale_decisions: 0,
          decide_candidates: 0,
          continue_research: 0,
        },
        latestCompletedAt: null,
        generatedAt: Date.now(),
        caveat:
          'Practice summary counts are workflow practice coverage metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.',
      },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('最近完成')).toBeInTheDocument();
    expect(screen.getByText('暂无')).toBeInTheDocument();
    expect(screen.getByText('latest outcome')).toBeInTheDocument();
  });

  it('applies practice filters from the summary strip', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    const withOutcomeCard = screen.getByLabelText('筛选已记录行动结果');
    const withoutOutcomeCard = screen.getByLabelText('筛选未记录行动结果');
    const addNextActionBucket = screen.getByLabelText('筛选行动分桶：补齐下一步行动');

    expect(withOutcomeCard).toHaveAttribute('aria-pressed', 'false');
    expect(withoutOutcomeCard).toHaveAttribute('aria-pressed', 'false');
    expect(addNextActionBucket).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(withoutOutcomeCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actionOutcome: 'without',
          actionId: undefined,
          decisionReview: undefined,
        }),
      );
    });
    expect(screen.getByText('工作流练习筛选')).toBeInTheDocument();
    expect(screen.getByText('未记录行动结果')).toBeInTheDocument();
    expect(withoutOutcomeCard).toHaveAttribute('aria-pressed', 'true');
    expect(withOutcomeCard).toHaveAttribute('aria-pressed', 'false');
    expect(addNextActionBucket).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('当前练习筛选')).toBeInTheDocument();

    fireEvent.click(addNextActionBucket);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actionOutcome: undefined,
          actionId: 'add_next_action',
        }),
      );
    });
    expect(screen.getAllByText('补齐下一步行动').length).toBeGreaterThan(0);
    expect(addNextActionBucket).toHaveAttribute('aria-pressed', 'true');
    expect(withoutOutcomeCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByLabelText('清除练习筛选'));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actionOutcome: undefined,
          actionId: undefined,
        }),
      );
    });
    expect(addNextActionBucket).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('当前练习筛选')).not.toBeInTheDocument();
  });

  it('does not mark practice summary controls active for narrowed views', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    const withoutOutcomeCard = screen.getByLabelText('筛选未记录行动结果');
    fireEvent.click(withoutOutcomeCard);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actionOutcome: 'without',
          actionId: undefined,
        }),
      );
    });
    expect(withoutOutcomeCard).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByLabelText('只看研究工作台'));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          actionOutcome: 'without',
          actionId: undefined,
        }),
      );
    });
    expect(withoutOutcomeCard).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('当前练习筛选')).not.toBeInTheDocument();
  });

  it('renders daily action plan and applies suggested filters', async () => {
    const hooks = await loadMocks();
    const generatedAt = Date.UTC(2026, 6, 5, 2, 3, 4);
    hooks.useOpportunityDailyActionPlan.mockReturnValue({
      data: {
        items: [
          {
            id: 'add_next_action',
            label: '补齐下一步行动',
            reason: '推进或暂缓的决策需要明确下一步。',
            learningGoal: '练习把判断转成可执行跟进。',
            steps: [
              '打开缺下一步的决策队列。',
              '为每个 go/hold 决策写下一条可执行动作。',
            ],
            completionCriteria: ['每个 go/hold 决策都有下一步行动。'],
            priority: 1,
            count: 2,
            filters: {
              workspaceMode: 'review',
              shortlisted: true,
              decisionReview: 'needs_action',
            },
          },
          {
            id: 'continue_research',
            label: '继续调研中候选',
            reason: '调研中的候选需要补证据。',
            learningGoal: '练习补齐能支持后续判断的最小证据。',
            steps: ['打开调研中候选。'],
            completionCriteria: ['至少补充一项缺失证据或备注。'],
            priority: 4,
            count: 1,
            filters: {
              workspaceMode: 'discover',
              shortlisted: true,
              researchStatus: 'researching',
            },
          },
        ],
        generatedAt,
        caveat:
          'Daily action plan items are workflow practice metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.',
      },
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('今日行动计划')).toBeInTheDocument();
    expect(
      screen.getByText(`计划时间 · ${new Date(generatedAt).toLocaleString()}`),
    ).toBeInTheDocument();
    expect(screen.getAllByText('补齐下一步行动').length).toBeGreaterThan(0);
    expect(screen.getAllByText('继续调研中候选').length).toBeGreaterThan(0);
    expect(screen.getAllByText('练习目标').length).toBeGreaterThan(0);
    expect(screen.getByText('练习把判断转成可执行跟进。')).toBeInTheDocument();
    expect(screen.getByText('为每个 go/hold 决策写下一条可执行动作。')).toBeInTheDocument();
    expect(screen.getAllByText('完成定义').length).toBeGreaterThan(0);
    expect(screen.getByText('每个 go/hold 决策都有下一步行动。')).toBeInTheDocument();
    expect(screen.getByText(/workflow practice metadata/)).toBeInTheDocument();

    const addNextActionItem = screen.getByLabelText('应用行动：补齐下一步行动');
    const continueResearchItem = screen.getByLabelText('应用行动：继续调研中候选');

    expect(addNextActionItem).toHaveAttribute('aria-pressed', 'false');
    expect(continueResearchItem).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(addNextActionItem);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          shortlisted: true,
          decisionReview: 'needs_action',
          decisionStatus: undefined,
        }),
      );
    });
    expect(addNextActionItem).toHaveAttribute('aria-pressed', 'true');
    expect(continueResearchItem).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('当前行动')).toBeInTheDocument();
  });

  it('does not mark daily action plan items active for narrowed views', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    const addNextActionItem = screen.getByLabelText('应用行动：补齐下一步行动');
    expect(addNextActionItem).toHaveAttribute('aria-pressed', 'false');

    fireEvent.change(screen.getByLabelText('平台筛选'), {
      target: { value: 'amazon' },
    });
    fireEvent.click(addNextActionItem);

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          platform: 'amazon',
          shortlisted: true,
          decisionReview: 'needs_action',
          decisionStatus: undefined,
        }),
      );
    });
    expect(addNextActionItem).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('当前行动')).not.toBeInTheDocument();
  });

  it('does not infer daily action plan generated time while loading', async () => {
    const hooks = await loadMocks();
    hooks.useOpportunityDailyActionPlan.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('今日行动计划')).toBeInTheDocument();
    expect(screen.queryByText(/计划时间 ·/)).not.toBeInTheDocument();
  });

  it('shows neutral row and detail indicators when active research lacks action outcome evidence', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'missing-outcome-product',
      title: 'Missing Outcome Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['practice'],
        notes: null,
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

    expect(screen.getAllByText('待补行动结果').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText('工作流练习证据未记录').length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/行动结果 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/完成时间 ·/)).not.toBeInTheDocument();
  });

  it('does not show the active outcome gap in selected detail for archived research', async () => {
    const hooks = await loadMocks();
    const archived = createOpportunity({
      id: 'archived-missing-outcome-product',
      title: 'Archived Missing Outcome Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['practice'],
        notes: null,
        archived: true,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [archived], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: archived,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.queryByText('待补行动结果')).not.toBeInTheDocument();
    expect(screen.getByText('记录最近一次复盘执行结果')).toBeInTheDocument();
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

  it('adds an opportunity to the research workspace from the selected detail header', async () => {
    render(<Opportunities />);

    const detailPanel = screen.getByText('评分解释').closest('aside');
    expect(detailPanel).not.toBeNull();

    fireEvent.click(
      within(detailPanel as HTMLElement).getByLabelText('从详情面板加入研究工作台')
    );

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

  it('keeps opportunity workspace panels inside owned hit-test layout boxes', async () => {
    render(<Opportunities />);

    const detailPanel = screen.getByText('评分解释').closest('aside');
    expect(detailPanel).not.toBeNull();

    const workspaceGrid = detailPanel?.parentElement;
    const pageRoot = workspaceGrid?.parentElement;

    expect(pageRoot).toHaveClass('min-h-full');
    expect(pageRoot).not.toHaveClass('h-full');
    expect(workspaceGrid).toHaveClass('grid');
    expect(workspaceGrid).not.toHaveClass('flex-1');
    expect(workspaceGrid).not.toHaveClass('min-h-0');
    expect(detailPanel).toHaveClass('overflow-auto');
    expect(detailPanel).toHaveClass('xl:max-h-[calc(100vh-8rem)]');
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

  it('switches to review mode and applies decision review filters', async () => {
    const hooks = await loadMocks();

    render(<Opportunities />);

    fireEvent.click(screen.getByRole('button', { name: '复盘' }));

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          decisionReview: 'needs_action',
          decisionStatus: undefined,
        }),
      );
    });

    fireEvent.change(screen.getByLabelText('决策状态筛选'), {
      target: { value: 'go' },
    });
    fireEvent.change(screen.getByLabelText('决策复盘筛选'), {
      target: { value: 'stale' },
    });

    await waitFor(() => {
      expect(hooks.useOpportunities).toHaveBeenLastCalledWith(
        expect.objectContaining({
          decisionStatus: 'go',
          decisionReview: 'stale',
        }),
      );
    });
  });

  it('shows decision review badges in rows, summary, and detail context', async () => {
    const hooks = await loadMocks();
    const reviewCandidate = createOpportunity({
      id: 'review-product',
      title: 'Review Product',
      score: 86,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['review'],
        notes: 'Needs follow-up.',
        decision: createDecision({
          status: 'go',
          reason: 'Strong candidate but no follow-up action is assigned.',
          nextAction: null,
          score: 86,
          recommendation: 'investigate',
        }),
        decisionReview: {
          hasDecision: true,
          status: 'go',
          decidedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
          daysSinceDecision: 15,
          hasNextAction: false,
          needsNextAction: true,
          stale: true,
        },
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: {
        data: [reviewCandidate],
        total: 1,
        pagination: { page: 1, limit: 30, totalPages: 1 },
      },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: reviewCandidate,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getAllByText('待下一步').length).toBeGreaterThan(0);
    expect(screen.getAllByText('需复盘').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        '决策依据 · Strong candidate but no follow-up action is assigned.',
      ).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/下一步 ·/)).not.toBeInTheDocument();
    expect(screen.getByText('待补下一步')).toBeInTheDocument();
    expect(screen.getByText('工作流跟进动作未记录')).toBeInTheDocument();
    expect(screen.getByText('15 天前决策')).toBeInTheDocument();
    expect(screen.getByText(/不改变机会评分、建议、置信度或因子/)).toBeInTheDocument();
  });

  it('shows decision age summaries for current decisions in rows and selected detail', async () => {
    const hooks = await loadMocks();
    const candidates = [
      createDecisionAgeCandidate('decision-age-today', 'Today Decision', 0),
      createDecisionAgeCandidate('decision-age-yesterday', 'Yesterday Decision', 1),
      createDecisionAgeCandidate('decision-age-older', 'Older Decision', 6),
    ];
    hooks.useOpportunities.mockReturnValue({
      data: {
        data: candidates,
        total: candidates.length,
        pagination: { page: 1, limit: 30, totalPages: 1 },
      },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockImplementation((productId?: string) => ({
      data: candidates.find((item) => item.product.id === productId) ?? candidates[0],
      isLoading: false,
    }) as unknown);

    render(<Opportunities />);

    expect(screen.getByText('决策时间 · 今天决策')).toBeInTheDocument();
    expect(screen.getByText('决策时间 · 昨天决策')).toBeInTheDocument();
    expect(screen.getByText('决策时间 · 6 天前决策')).toBeInTheDocument();
    expect(screen.getByText('今天决策')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yesterday Decision'));
    await waitFor(() => {
      expect(screen.getByText('昨天决策')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Older Decision'));
    await waitFor(() => {
      expect(screen.getByText('6 天前决策')).toBeInTheDocument();
    });
  });

  it('does not infer decision age for undecided opportunities', async () => {
    const hooks = await loadMocks();
    const undecided = createOpportunity({
      id: 'undecided-age-product',
      title: 'Undecided Age Product',
      score: 72,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['undecided'],
        notes: null,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: {
        data: [undecided],
        total: 1,
        pagination: { page: 1, limit: 30, totalPages: 1 },
      },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: undecided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.queryByText(/决策时间 ·/)).not.toBeInTheDocument();
    expect(screen.getByText('暂无当前决策')).toBeInTheDocument();
  });

  it('does not infer selected detail decision age when age metadata is absent', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'go',
      reason: 'Manual evidence is saved.',
      nextAction: 'Review next supplier evidence.',
      score: 76,
      recommendation: 'watch',
    });
    const missingAge = createOpportunity({
      id: 'missing-age-product',
      title: 'Missing Age Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['missing-age'],
        notes: null,
        decision,
        decisionReview: {
          hasDecision: true,
          status: 'go',
          decidedAt: decision.decidedAt,
          daysSinceDecision: null,
          hasNextAction: true,
          needsNextAction: false,
          stale: false,
        },
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: {
        data: [missingAge],
        total: 1,
        pagination: { page: 1, limit: 30, totalPages: 1 },
      },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: missingAge,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.queryByText(/决策时间 ·/)).not.toBeInTheDocument();
    expect(screen.getByText('暂无当前决策')).toBeInTheDocument();
    expect(screen.queryByText(/天前决策|今天决策|昨天决策/)).not.toBeInTheDocument();
  });

  it('saves a selected opportunity decision', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'decision-product',
      title: 'Decision Product',
      score: 84,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'high',
        tags: ['decision'],
        notes: null,
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

    expect(screen.getByLabelText('机会决策保存提示')).toHaveTextContent(
      '填写判断依据后可保存决策。',
    );
    expect(screen.getByLabelText('决策依据字数')).toHaveTextContent(
      `已输入 0/${OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH} 字`,
    );
    expect(screen.getByLabelText('决策下一步字数')).toHaveTextContent(
      `已输入 0/${OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH} 字`,
    );
    fireEvent.click(screen.getByLabelText('选择推进决策'));
    const reasonText = 'Supplier quote and manual reading look viable.';
    const nextActionText = 'Schedule supplier call.';
    fireEvent.change(screen.getByLabelText('编辑机会决策依据'), {
      target: { value: reasonText },
    });
    fireEvent.change(screen.getByLabelText('编辑机会决策下一步'), {
      target: { value: nextActionText },
    });
    expect(screen.getByLabelText('决策依据字数')).toHaveTextContent(
      `已输入 ${reasonText.length}/${OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH} 字`,
    );
    expect(screen.getByLabelText('决策下一步字数')).toHaveTextContent(
      `已输入 ${nextActionText.length}/${OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH} 字`,
    );
    expect(screen.queryByLabelText('机会决策保存提示')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('保存机会决策'));

    expect(saveDecisionMutate).toHaveBeenCalledWith({
      productId: 'decision-product',
      data: {
        status: 'go',
        reason: reasonText,
        nextAction: nextActionText,
      },
    });
  });

  it('prevents saving over-limit decision evidence', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'decision-limit-product',
      title: 'Decision Limit Product',
      score: 84,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'high',
        tags: ['decision'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('选择推进决策'));
    fireEvent.change(screen.getByLabelText('编辑机会决策依据'), {
      target: { value: 'R'.repeat(OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH + 1) },
    });

    expect(screen.getByLabelText('决策依据字数')).toHaveTextContent(
      `已输入 ${OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH + 1}/${OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH} 字，超出 1 字`,
    );
    expect(screen.getByLabelText('机会决策保存提示')).toHaveTextContent(
      '判断依据超出上限，缩短后可保存决策。',
    );
    expect(screen.getByLabelText('保存机会决策')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('保存机会决策'));
    expect(saveDecisionMutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('编辑机会决策依据'), {
      target: { value: 'Supplier quote is viable.' },
    });
    fireEvent.change(screen.getByLabelText('编辑机会决策下一步'), {
      target: {
        value: 'N'.repeat(
          OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH + 1,
        ),
      },
    });

    expect(screen.getByLabelText('决策下一步字数')).toHaveTextContent(
      `已输入 ${OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH + 1}/${OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH} 字，超出 1 字`,
    );
    expect(screen.getByLabelText('机会决策保存提示')).toHaveTextContent(
      '下一步超出上限，缩短后可保存决策。',
    );
    expect(screen.getByLabelText('保存机会决策')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('保存机会决策'));
    expect(saveDecisionMutate).not.toHaveBeenCalled();
  });

  it('fills a selected decision evidence frame without saving', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'decision-frame-product',
      title: 'Decision Frame Product',
      score: 84,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'high',
        tags: ['decision'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('选择推进决策'));
    const fillButton = screen.getByLabelText('填入决策框架：推进');
    expect(fillButton).toBeEnabled();
    fireEvent.click(fillButton);

    const frame = '推进判断：\n关键证据：\n主要风险：\n确认缺口：';
    expect(screen.getByLabelText('编辑机会决策依据')).toHaveValue(frame);
    expect(screen.getByLabelText('决策依据字数')).toHaveTextContent(
      `已输入 ${frame.length}/${OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH} 字`,
    );
    expect(fillButton).toBeDisabled();
    expect(saveDecisionMutate).not.toHaveBeenCalled();
  });

  it('uses the switched decision status frame and preserves manual decision evidence', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'decision-frame-preserve-product',
      title: 'Decision Frame Preserve Product',
      score: 84,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'high',
        tags: ['decision'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('选择排除决策'));
    const noGoFillButton = screen.getByLabelText('填入决策框架：排除');
    fireEvent.click(noGoFillButton);
    expect(screen.getByLabelText('编辑机会决策依据')).toHaveValue(
      '排除判断：\n排除证据：\n关键风险：\n后续处理：',
    );
    expect(saveDecisionMutate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('编辑机会决策依据'), {
      target: { value: 'Manual decision evidence should stay.' },
    });
    fireEvent.click(screen.getByLabelText('选择暂缓决策'));
    const holdFillButton = screen.getByLabelText('填入决策框架：暂缓');
    expect(holdFillButton).toBeDisabled();
    fireEvent.click(holdFillButton);

    expect(screen.getByLabelText('编辑机会决策依据')).toHaveValue(
      'Manual decision evidence should stay.',
    );
    expect(saveDecisionMutate).not.toHaveBeenCalled();
  });

  it('renders and clears a selected opportunity decision snapshot', async () => {
    const hooks = await loadMocks();
    const decided = createOpportunity({
      id: 'decided-product',
      title: 'Decided Product',
      score: 89,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['decision'],
        notes: 'Ready for decision.',
        decision: createDecision({
          status: 'go',
          reason: 'Supplier quote confirmed target margin.',
          nextAction: 'Prepare first order checklist.',
          score: 89,
          recommendation: 'investigate',
        }),
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('机会决策')).toBeInTheDocument();
    expect(
      screen.getAllByText('决策依据 · Supplier quote confirmed target margin.')
        .length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText('下一步 · Prepare first order checklist.').length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('待补下一步')).not.toBeInTheDocument();
    expect(screen.getByText(/快照 89.0/)).toBeInTheDocument();
    expect(screen.getByText('快照置信度 72%')).toBeInTheDocument();
    expect(
      screen.getByText('快照依据 · Current price is below average.'),
    ).toBeInTheDocument();
    expect(screen.getByText('快照缺口 · 利润率')).toBeInTheDocument();
    expect(screen.getByText('快照业务完整度 · 未填写')).toBeInTheDocument();
    expect(screen.getByText('快照业务缺口 · 单件成本、费用')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('清除机会决策'));

    expect(clearDecisionMutate).toHaveBeenCalledWith('decided-product');
  });

  it('uses selected detail snapshot capture time instead of decision timestamps', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved after checking old evidence.',
      nextAction: 'Refresh evidence if still considering.',
      score: 80,
      recommendation: 'watch',
    });
    const snapshotCapturedAt = Date.UTC(2026, 0, 2, 3, 4, 5);
    const decidedAt = Date.UTC(2026, 1, 3, 4, 5, 6);
    const updatedAt = Date.UTC(2026, 2, 4, 5, 6, 7);
    decision.snapshot.capturedAt = snapshotCapturedAt;
    decision.decidedAt = decidedAt;
    decision.updatedAt = updatedAt;
    const decided = createOpportunity({
      id: 'snapshot-captured-at-product',
      title: 'Snapshot Captured At Product',
      score: 80,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Snapshot and decision timestamps differ.',
        decision,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    const snapshotTime = new Date(snapshotCapturedAt).toLocaleString();
    expect(screen.getByText(`快照时间 · ${snapshotTime}`)).toBeInTheDocument();
    expect(screen.getByText(`证据快照 ${snapshotTime}`)).toBeInTheDocument();
    expect(
      screen.queryByText(`快照时间 · ${new Date(decidedAt).toLocaleString()}`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(`快照时间 · ${new Date(updatedAt).toLocaleString()}`),
    ).not.toBeInTheDocument();
  });

  it('uses selected detail snapshot business summary instead of current opportunity business signals', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved before business assumptions were completed.',
      nextAction: 'Recheck cost assumptions.',
      score: 79,
      recommendation: 'watch',
    });
    const decided = createOpportunity({
      id: 'snapshot-business-product',
      title: 'Snapshot Business Product',
      score: 79,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Current business assumptions changed after decision.',
        decision,
      },
    });
    decided.businessSignals = {
      completeness: 'complete',
      missingSignals: [],
      metrics: null,
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    };
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('快照业务完整度 · 未填写')).toBeInTheDocument();
    expect(screen.getByText('快照业务缺口 · 单件成本、费用')).toBeInTheDocument();
    expect(screen.queryByText('快照业务完整度 · 完整')).not.toBeInTheDocument();
  });

  it('renders selected detail snapshot business metrics from the saved decision snapshot', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'go',
      reason: 'Saved when unit economics met the target.',
      nextAction: 'Confirm supplier payment terms.',
      score: 86,
      recommendation: 'investigate',
    });
    decision.snapshot.businessSignals = {
      completeness: 'complete',
      missingSignals: [],
      metrics: {
        currency: 'USD',
        priceSource: 'target',
        completeness: 'complete',
        missingSignals: [],
        totalVariableCost: 72.5,
        grossMargin: 0.36,
        netMargin: 0.225,
        roi: 0.48,
        breakevenSellPrice: 62.5,
        contributionProfitPerUnit: 18.75,
        targetUnits: 100,
        projectedContributionProfit: 1875,
        inputs: {
          sellPrice: 99,
          costBasis: 39,
          inboundShipping: 6,
          outboundShipping: 4,
          fulfillmentFee: 8,
          platformFee: 5,
          referralFeeRate: 0.15,
          referralFee: 14.85,
          advertisingCost: 3,
          taxCustomsBuffer: 2.65,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    };
    const decided = createOpportunity({
      id: 'snapshot-business-metrics-product',
      title: 'Snapshot Business Metrics Product',
      score: 86,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['decision'],
        notes: 'Current assumptions changed after decision.',
        decision,
      },
    });
    decided.businessSignals = {
      completeness: 'complete',
      missingSignals: [],
      metrics: {
        currency: 'USD',
        priceSource: 'current_price',
        completeness: 'complete',
        missingSignals: [],
        totalVariableCost: 50,
        grossMargin: 0.7,
        netMargin: 0.99,
        roi: 1.4,
        breakevenSellPrice: 40,
        contributionProfitPerUnit: 55,
        targetUnits: 25,
        projectedContributionProfit: 1375,
        inputs: {
          sellPrice: 99,
          costBasis: 20,
          inboundShipping: 2,
          outboundShipping: 2,
          fulfillmentFee: 4,
          platformFee: 3,
          referralFeeRate: 0.1,
          referralFee: 9.9,
          advertisingCost: 1,
          taxCustomsBuffer: 1,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    };
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    const snapshotMetrics = screen.getByLabelText('决策快照业务指标');
    expect(
      within(snapshotMetrics).getByText('快照业务指标 · 净利率 22.5%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMetrics).getByText('快照业务指标 · ROI 48.0%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMetrics).getByText('快照业务指标 · 盈亏平衡价 USD 62.5'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMetrics).getByText('快照业务指标 · 单件贡献 USD 18.75'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('快照业务指标 · 净利率 99.0%'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('快照业务指标 · 盈亏平衡价 USD 40'),
    ).not.toBeInTheDocument();
  });

  it('does not infer selected detail snapshot business metrics from current opportunity metrics', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved before business metrics were calculated.',
      nextAction: 'Review new cost assumptions separately.',
      score: 73,
      recommendation: 'watch',
    });
    const decided = createOpportunity({
      id: 'null-snapshot-business-metrics-product',
      title: 'Null Snapshot Business Metrics Product',
      score: 73,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Live business metrics exist but saved snapshot metrics are null.',
        decision,
      },
    });
    decided.businessSignals = {
      completeness: 'complete',
      missingSignals: [],
      metrics: {
        currency: 'USD',
        priceSource: 'current_price',
        completeness: 'complete',
        missingSignals: [],
        totalVariableCost: 48,
        grossMargin: 0.62,
        netMargin: 0.31,
        roi: 0.76,
        breakevenSellPrice: 58,
        contributionProfitPerUnit: 25,
        targetUnits: null,
        projectedContributionProfit: null,
        inputs: {
          sellPrice: 99,
          costBasis: 33,
          inboundShipping: 4,
          outboundShipping: 3,
          fulfillmentFee: 5,
          platformFee: 4,
          referralFeeRate: 0.12,
          referralFee: 11.88,
          advertisingCost: 2,
          taxCustomsBuffer: 1.12,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    };
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('业务信号')).toBeInTheDocument();
    expect(screen.queryByLabelText('决策快照业务指标')).not.toBeInTheDocument();
    expect(screen.queryByText(/快照业务指标 ·/)).not.toBeInTheDocument();
  });

  it('renders selected detail snapshot market summary from the saved decision snapshot', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved while market data was stale but useful.',
      nextAction: 'Refresh market evidence before ordering.',
      score: 77,
      recommendation: 'watch',
    });
    decision.snapshot.marketSignals = {
      status: 'stale',
      provider: 'keepa',
      source: 'third_party',
      confidence: 0.84,
      freshnessMs: 96 * 60 * 60 * 1000,
      missingSignals: ['market_signal_freshness', 'market_sales_rank'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [
        {
          name: 'market_sales_rank_trend',
          label: 'Sales rank trend',
          rawValue: -8.4,
          normalizedScore: 70,
          weight: 0.07,
          contribution: 4.9,
          direction: 'positive',
          source: 'third_party',
          freshnessMs: 96 * 60 * 60 * 1000,
          confidenceImpact: 0.06,
          explanation:
            'Saved Keepa sales rank movement improved before this decision.',
        },
      ],
    };
    const decided = createOpportunity({
      id: 'snapshot-market-product',
      title: 'Snapshot Market Product',
      score: 77,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Saved market context should remain visible.',
        decision,
      },
    });
    decided.marketSignals = {
      status: 'fresh',
      provider: 'keepa',
      source: 'third_party',
      confidence: 0.91,
      freshnessMs: 30 * 60 * 1000,
      missingSignals: [],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [
        {
          name: 'market_sales_rank_trend',
          label: 'Sales rank trend',
          rawValue: 42,
          normalizedScore: 12,
          weight: 0.07,
          contribution: 0.84,
          direction: 'negative',
          source: 'third_party',
          freshnessMs: 30 * 60 * 1000,
          confidenceImpact: -0.04,
          explanation:
            'Current Keepa sales rank movement worsened after the decision.',
        },
      ],
    };
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    const snapshotMarket = screen.getByLabelText('决策快照市场');
    expect(
      within(snapshotMarket).getByText('快照市场状态 · 过期'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMarket).getByText('快照市场来源 · keepa / third_party'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMarket).getByText('快照市场置信度 · 84%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMarket).getByText('快照市场新鲜度 · 4d'),
    ).toBeInTheDocument();
    expect(
      within(snapshotMarket).getByText(
        '快照市场缺口 · 市场信号新鲜度、销售排名',
      ),
    ).toBeInTheDocument();
    const snapshotFactors = screen.getByLabelText('决策快照市场因子');
    expect(
      within(snapshotFactors).getByText('快照市场因子 · Sales rank trend -8.40'),
    ).toBeInTheDocument();
    expect(
      within(snapshotFactors).getByText(
        'Saved Keepa sales rank movement improved before this decision.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotFactors).queryByText('快照市场因子 · Sales rank trend 42'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotFactors).queryByText(
        'Current Keepa sales rank movement worsened after the decision.',
      ),
    ).not.toBeInTheDocument();
  });

  it('does not infer selected detail snapshot market summary from current opportunity market signals', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved before market signals were refreshed.',
      nextAction: 'Review updated market trend separately.',
      score: 74,
      recommendation: 'watch',
    });
    const decided = createOpportunity({
      id: 'null-snapshot-market-product',
      title: 'Null Snapshot Market Product',
      score: 74,
      recommendation: 'watch',
      marketStatus: 'fresh',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Live market signals exist but saved snapshot market is null.',
        decision,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('市场趋势信号')).toBeInTheDocument();
    expect(screen.queryByLabelText('决策快照市场')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('决策快照市场因子')).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场状态 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场来源 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场置信度 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场新鲜度 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场缺口 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照市场因子 ·/)).not.toBeInTheDocument();
  });

  it('uses selected detail snapshot confidence instead of current opportunity confidence', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved while confidence was higher.',
      nextAction: 'Refresh evidence before changing decision.',
      score: 82,
      recommendation: 'investigate',
    });
    decision.snapshot.confidence = 0.9;
    const decided = createOpportunity({
      id: 'snapshot-confidence-product',
      title: 'Snapshot Confidence Product',
      score: 82,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Live confidence changed after the saved decision.',
        decision,
      },
    });
    decided.confidence = 0.12;
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('快照置信度 90%')).toBeInTheDocument();
    expect(screen.queryByText('快照置信度 12%')).not.toBeInTheDocument();
  });

  it('renders selected detail snapshot gate context from the saved decision snapshot', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Gate evidence blocked immediate purchase.',
      nextAction: 'Complete cost assumptions before ordering.',
      score: 76,
      recommendation: 'check_data',
    });
    decision.snapshot.recommendationGate = {
      status: 'blocked',
      applied: true,
      originalRecommendation: 'investigate',
      finalRecommendation: 'check_data',
      reasons: ['business assumptions are incomplete.'],
      signals: ['profit_margin', 'business_costBasis'],
      nextActions: ['Add landed cost and fee assumptions.'],
    };
    const decided = createOpportunity({
      id: 'snapshot-gate-product',
      title: 'Snapshot Gate Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Saved while gate was blocked.',
        decision,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    const snapshotGate = screen.getByLabelText('决策快照门控');
    expect(within(snapshotGate).getByText('快照门控')).toBeInTheDocument();
    expect(within(snapshotGate).getByText('blocked')).toBeInTheDocument();
    expect(
      within(snapshotGate).getByText('重点研究 → 补充数据'),
    ).toBeInTheDocument();
    expect(
      within(snapshotGate).getByText(
        '快照门控原因 · business assumptions are incomplete.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotGate).getByText(
        '快照门控信号 · 利润率、单件成本',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotGate).getByText(
        '快照门控下一步 · Add landed cost and fee assumptions.',
      ),
    ).toBeInTheDocument();
  });

  it('does not infer selected detail snapshot gate context from the current opportunity gate', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved before the current gate changed.',
      nextAction: 'Check whether current gate still applies.',
      score: 81,
      recommendation: 'investigate',
    });
    const decided = createOpportunity({
      id: 'clear-snapshot-gate-product',
      title: 'Clear Snapshot Gate Product',
      score: 81,
      recommendation: 'check_data',
      recommendationGate: {
        status: 'blocked',
        applied: true,
        originalRecommendation: 'investigate',
        finalRecommendation: 'check_data',
        reasons: ['current gate should not be copied into snapshot gate.'],
        signals: ['profit_margin'],
        nextActions: ['Update current assumptions.'],
      },
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Current gate differs from saved snapshot gate.',
        decision,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('推荐门控')).toBeInTheDocument();
    expect(
      screen.getByText('current gate should not be copied into snapshot gate.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('决策快照门控')).not.toBeInTheDocument();
    expect(screen.queryByText(/快照门控原因 ·/)).not.toBeInTheDocument();
  });

  it('does not infer selected detail snapshot evidence from current opportunity data', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Current evidence needs another supplier check.',
      nextAction: 'Ask supplier for total landed cost.',
      score: 78,
      recommendation: 'watch',
    });
    decision.snapshot.keyReasons = [];
    decision.snapshot.missingSignals = [];
    const decided = createOpportunity({
      id: 'empty-snapshot-evidence-product',
      title: 'Empty Snapshot Evidence Product',
      score: 78,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: 'Current opportunity still has key reasons and missing signals.',
        decision,
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [decided], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: decided,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText(/快照 78.0/)).toBeInTheDocument();
    expect(screen.queryByText(/快照依据 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/快照缺口 ·/)).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        '决策依据 · Current evidence needs another supplier check.',
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('does not infer selected detail next-action gaps for no-go or missing review metadata', async () => {
    const hooks = await loadMocks();
    const noGo = createOpportunity({
      id: 'no-go-gap-product',
      title: 'No Go Gap Product',
      score: 70,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: null,
        decision: createDecision({
          status: 'no_go',
          reason: 'Margin evidence is not strong enough.',
          nextAction: null,
          score: 70,
          recommendation: 'watch',
        }),
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [noGo], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: noGo,
      isLoading: false,
    } as unknown);

    const { unmount } = render(<Opportunities />);

    expect(screen.queryByText('待补下一步')).not.toBeInTheDocument();
    expect(screen.queryByText('工作流跟进动作未记录')).not.toBeInTheDocument();
    unmount();

    const missingReview = createOpportunity({
      id: 'missing-review-gap-product',
      title: 'Missing Review Gap Product',
      score: 75,
      recommendation: 'watch',
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['decision'],
        notes: null,
        decision: createDecision({
          status: 'hold',
          reason: 'Need another supplier quote before moving.',
          nextAction: null,
          score: 75,
          recommendation: 'watch',
        }),
      },
    });
    delete (missingReview.research as unknown as { decisionReview?: unknown })
      .decisionReview;
    hooks.useOpportunities.mockReturnValue({
      data: { data: [missingReview], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: missingReview,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.queryByText('待补下一步')).not.toBeInTheDocument();
    expect(screen.queryByText('工作流跟进动作未记录')).not.toBeInTheDocument();
  });

  it('saves a selected opportunity action outcome', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'outcome-product',
      title: 'Outcome Product',
      score: 78,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['outcome'],
        notes: null,
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

    expect(
      within(screen.getByLabelText('当前行动结果类型')).getByText(
        '当前将保存 · 继续调研中候选',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('选择行动完成日期') as HTMLInputElement,
    ).toHaveValue(formatLocalDateInputValue());
    expect(
      screen.getByLabelText('选择行动完成日期') as HTMLInputElement,
    ).toHaveAttribute('max', formatLocalDateInputValue());
    const criteria = within(screen.getByLabelText('行动结果完成定义'));
    expect(criteria.getByText('适用行动 · 继续调研中候选')).toBeInTheDocument();
    expect(criteria.getByText('至少补充一项缺失证据或备注。')).toBeInTheDocument();
    expect(criteria.getByText('研究状态反映当前处理阶段。')).toBeInTheDocument();
    expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
      'placeholder',
      '记录本次补充的读数、成本假设、备注或仍缺的证据。',
    );
    const outcomeField = screen.getByLabelText('编辑行动执行结果');
    const evidencePrompt = screen.getByLabelText('行动结果证据提示');
    const evidenceExample = screen.getByLabelText('行动结果证据样例');
    expect(evidencePrompt).toHaveAttribute('id', 'action-outcome-evidence-prompt');
    expect(evidenceExample).toHaveAttribute('id', 'action-outcome-evidence-example');
    expect(outcomeField).toHaveAttribute(
      'aria-describedby',
      `${evidencePrompt.id} ${evidenceExample.id}`,
    );
    expect(evidencePrompt).toHaveTextContent(
      '证据提示 · 记录本次补充的读数、成本假设、备注或仍缺的证据。',
    );
    expect(evidenceExample).toHaveTextContent(
      '证据样例 · 例：补录 7 月 5 日手动读数，仍缺近期销量代理信号。',
    );
    expect(screen.getByLabelText('行动执行结果字数')).toHaveTextContent(
      `已输入 0/${OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH} 字`,
    );
    const saveScope = screen.getByText(
      '行动结果只作为复盘练习证据，不改变评分或市场/业务信号。',
    );
    const saveHint = screen.getByLabelText('行动结果保存提示');
    const saveButton = screen.getByLabelText('保存行动结果');
    expect(saveScope).toHaveAttribute('id', 'action-outcome-save-scope');
    expect(saveHint).toHaveAttribute('id', 'action-outcome-save-hint');
    expect(saveButton).toHaveAttribute(
      'aria-describedby',
      `${saveScope.id} ${saveHint.id}`,
    );
    expect(saveHint).toHaveTextContent(
      '填写执行结果后可保存行动结果。',
    );
    fireEvent.change(screen.getByLabelText('选择行动结果类型'), {
      target: { value: 'add_next_action' },
    });
    expect(
      within(screen.getByLabelText('当前行动结果类型')).getByText(
        '当前将保存 · 补齐下一步行动',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '适用行动 · 补齐下一步行动',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '每个 go/hold 决策都有下一步行动。',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
      'placeholder',
      '记录你补上的下一步：对象、动作、证据或时间线。',
    );
    expect(outcomeField).toHaveAttribute(
      'aria-describedby',
      `${evidencePrompt.id} ${evidenceExample.id}`,
    );
    expect(evidencePrompt).toHaveTextContent(
      '证据提示 · 记录你补上的下一步：对象、动作、证据或时间线。',
    );
    expect(evidenceExample).toHaveTextContent(
      '证据样例 · 例：供应商报价待确认，明天补 MOQ 和运费截图。',
    );
    fireEvent.change(screen.getByLabelText('选择行动完成日期'), {
      target: { value: '2026-07-03' },
    });
    const outcomeText = 'Added supplier quote follow-up.';
    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: outcomeText },
    });
    expect(screen.getByLabelText('行动执行结果字数')).toHaveTextContent(
      `已输入 ${outcomeText.length}/${OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH} 字`,
    );
    expect(screen.queryByLabelText('行动结果保存提示')).not.toBeInTheDocument();
    expect(saveButton).toHaveAttribute('aria-describedby', saveScope.id);
    fireEvent.click(screen.getByLabelText('保存行动结果'));

    expect(saveActionOutcomeMutate).toHaveBeenCalledWith({
      productId: 'outcome-product',
      data: {
        actionId: 'add_next_action',
        outcome: outcomeText,
        completedAt: localDateTimestamp('2026-07-03'),
      },
    });
  });

  it('fills an action-specific outcome record frame without saving', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'outcome-frame-product',
      title: 'Outcome Frame Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['outcome'],
        notes: null,
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

    fireEvent.change(screen.getByLabelText('选择行动结果类型'), {
      target: { value: 'add_next_action' },
    });
    const fillButton = screen.getByLabelText('填入记录框架：补齐下一步行动');
    expect(fillButton).toBeEnabled();
    fireEvent.click(fillButton);

    expect(screen.getByLabelText('编辑行动执行结果')).toHaveValue(
      '补齐对象：\n下一步动作：\n所需证据：\n预计时间：',
    );
    expect(screen.getByLabelText('行动执行结果字数')).toHaveTextContent(
      `已输入 ${'补齐对象：\n下一步动作：\n所需证据：\n预计时间：'.length}/${OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH} 字`,
    );
    expect(fillButton).toBeDisabled();
    expect(saveActionOutcomeMutate).not.toHaveBeenCalled();
  });

  it('does not overwrite existing action outcome text with a record frame', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'outcome-frame-preserve-product',
      title: 'Outcome Frame Preserve Product',
      score: 76,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['outcome'],
        notes: null,
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

    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: 'Manual evidence should stay.' },
    });
    const fillButton = screen.getByLabelText('填入记录框架：继续调研中候选');
    expect(fillButton).toBeDisabled();
    fireEvent.click(fillButton);

    expect(screen.getByLabelText('编辑行动执行结果')).toHaveValue(
      'Manual evidence should stay.',
    );
    expect(saveActionOutcomeMutate).not.toHaveBeenCalled();
  });

  it('prevents saving over-limit action outcome evidence', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'outcome-limit-product',
      title: 'Outcome Limit Product',
      score: 78,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['outcome'],
        notes: null,
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

    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: 'O'.repeat(OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH + 1) },
    });

    expect(screen.getByLabelText('行动执行结果字数')).toHaveTextContent(
      `已输入 ${OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH + 1}/${OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH} 字，超出 1 字`,
    );
    expect(screen.getByLabelText('行动结果保存提示')).toHaveTextContent(
      '执行结果超出上限，缩短后可保存行动结果。',
    );
    expect(screen.getByLabelText('保存行动结果')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('保存行动结果'));
    expect(saveActionOutcomeMutate).not.toHaveBeenCalled();
  });

  it('prevents saving future-dated action outcomes', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'future-outcome-product',
      title: 'Future Outcome Product',
      score: 74,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['future'],
        notes: null,
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

    fireEvent.change(screen.getByLabelText('选择行动完成日期'), {
      target: { value: formatLocalDateInputValue(Date.now() + 24 * 60 * 60 * 1000) },
    });
    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: 'This future result should not be saved.' },
    });

    expect(screen.getByLabelText('保存行动结果')).toBeDisabled();
    expect(screen.getByLabelText('行动结果保存提示')).toHaveTextContent(
      '完成日期不能晚于今天。',
    );
    fireEvent.click(screen.getByLabelText('保存行动结果'));
    expect(saveActionOutcomeMutate).not.toHaveBeenCalled();
  });

  it('explains unavailable action outcome saves for missing research and invalid dates', async () => {
    const hooks = await loadMocks();
    const unresearched = createOpportunity({
      id: 'unresearched-outcome-product',
      title: 'Unresearched Outcome Product',
      score: 72,
      recommendation: 'watch',
      research: null,
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [unresearched], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: unresearched,
      isLoading: false,
    } as unknown);

    const { unmount } = render(<Opportunities />);

    expect(screen.getByLabelText('行动结果保存提示')).toHaveTextContent(
      '先加入研究工作台后可记录行动结果。',
    );
    expect(screen.getByLabelText('保存行动结果')).toBeDisabled();
    expect(screen.queryByText('待补行动结果')).not.toBeInTheDocument();
    unmount();

    const researched = createOpportunity({
      id: 'invalid-date-outcome-product',
      title: 'Invalid Date Outcome Product',
      score: 72,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['invalid-date'],
        notes: null,
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

    fireEvent.change(screen.getByLabelText('选择行动完成日期'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: 'Completed a manual evidence update.' },
    });

    expect(screen.getByLabelText('行动结果保存提示')).toHaveTextContent(
      '选择有效完成日期后可保存行动结果。',
    );
    expect(screen.getByLabelText('保存行动结果')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('保存行动结果'));
    expect(saveActionOutcomeMutate).not.toHaveBeenCalled();
  });

  it('prefills action outcome type from a selected daily action context', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'daily-context-product',
      title: 'Daily Context Product',
      score: 79,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['context'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('应用行动：补齐下一步行动'));

    await waitFor(() => {
      expect(screen.getByText('工作流行动上下文')).toBeInTheDocument();
      expect(screen.getByText('来自每日行动')).toBeInTheDocument();
      expect(
        screen.getByRole('status', {
          name: /工作流行动上下文：来自每日行动，预选 补齐下一步行动/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('add_next_action');
      expect(
        within(screen.getByLabelText('当前行动结果类型')).getByText(
          '当前将保存 · 补齐下一步行动',
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByLabelText('行动结果完成定义')).getByText(
          '适用行动 · 补齐下一步行动',
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByLabelText('行动结果完成定义')).getByText(
          '下一步不依赖系统自动推断。',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
        'placeholder',
        '记录你补上的下一步：对象、动作、证据或时间线。',
      );
      expect(screen.getByLabelText('行动结果证据提示')).toHaveTextContent(
        '证据提示 · 记录你补上的下一步：对象、动作、证据或时间线。',
      );
      expect(screen.getByLabelText('行动结果证据样例')).toHaveTextContent(
        '证据样例 · 例：供应商报价待确认，明天补 MOQ 和运费截图。',
      );
    });
  });

  it('shows manual override when a daily action context action type is changed', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'daily-context-override-product',
      title: 'Daily Context Override Product',
      score: 79,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['context'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('应用行动：补齐下一步行动'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('add_next_action');
    });

    fireEvent.change(screen.getByLabelText('选择行动结果类型'), {
      target: { value: 'review_stale_decisions' },
    });

    expect(screen.getByText('已手动改选')).toBeInTheDocument();
    expect(
      screen.getByRole('status', {
        name: /工作流行动上下文：来自每日行动，预选 补齐下一步行动，已手动改选，将保存 复盘过期决策/,
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('当前行动结果类型')).getByText(
        '当前将保存 · 复盘过期决策',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('预选 · 补齐下一步行动')).toBeInTheDocument();
    expect(screen.getByText('将保存 · 复盘过期决策')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '适用行动 · 复盘过期决策',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '每个 stale 决策都被重新确认或调整。',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
      'placeholder',
      '记录你复盘了哪些证据，以及保留、调整或清除的判断。',
    );
    expect(screen.getByLabelText('行动结果证据提示')).toHaveTextContent(
      '证据提示 · 记录你复盘了哪些证据，以及保留、调整或清除的判断。',
    );

    fireEvent.change(screen.getByLabelText('编辑行动执行结果'), {
      target: { value: 'Reviewed stale decision evidence manually.' },
    });
    fireEvent.click(screen.getByLabelText('保存行动结果'));

    expect(saveActionOutcomeMutate).toHaveBeenCalledWith({
      productId: 'daily-context-override-product',
      data: expect.objectContaining({
        actionId: 'review_stale_decisions',
        outcome: 'Reviewed stale decision evidence manually.',
      }),
    });
  });

  it('clears daily action context after a manual filter edit', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'manual-filter-context-product',
      title: 'Manual Filter Context Product',
      score: 79,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['context'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('应用行动：补齐下一步行动'));

    await waitFor(() => {
      expect(screen.getByText('工作流行动上下文')).toBeInTheDocument();
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('add_next_action');
    });

    fireEvent.change(screen.getByLabelText('推荐动作筛选'), {
      target: { value: 'watch' },
    });

    await waitFor(() => {
      expect(screen.queryByText('工作流行动上下文')).not.toBeInTheDocument();
      expect(screen.queryByText('来自每日行动')).not.toBeInTheDocument();
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('continue_research');
    });
    expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
      'placeholder',
      '记录本次补充的读数、成本假设、备注或仍缺的证据。',
    );
  });

  it('prefills action outcome type from a selected practice bucket', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'practice-context-product',
      title: 'Practice Context Product',
      score: 77,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['context'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('筛选行动分桶：判断未决策候选'));

    await waitFor(() => {
      expect(screen.getByText('工作流行动上下文')).toBeInTheDocument();
      expect(screen.getByText('来自练习分桶')).toBeInTheDocument();
      expect(
        screen.getByRole('status', {
          name: /工作流行动上下文：来自练习分桶，预选 判断未决策候选/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('decide_candidates');
      expect(
        within(screen.getByLabelText('行动结果完成定义')).getByText(
          '候选已记录当前决策。',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
        'placeholder',
        '记录最终 go/hold/no-go 判断，以及支撑它的关键证据或缺口。',
      );
      expect(screen.getByLabelText('行动结果证据样例')).toHaveTextContent(
        '证据样例 · 例：因评论数不足且利润缓冲偏低，当前排除并记录缺口。',
      );
    });
  });

  it('shows manual override when a practice bucket context action type is changed', async () => {
    const hooks = await loadMocks();
    const researched = createOpportunity({
      id: 'practice-context-override-product',
      title: 'Practice Context Override Product',
      score: 77,
      recommendation: 'watch',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['context'],
        notes: null,
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

    fireEvent.click(screen.getByLabelText('筛选行动分桶：判断未决策候选'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('decide_candidates');
    });

    fireEvent.change(screen.getByLabelText('选择行动结果类型'), {
      target: { value: 'continue_research' },
    });

    expect(screen.getByText('来自练习分桶')).toBeInTheDocument();
    expect(screen.getByText('已手动改选')).toBeInTheDocument();
    expect(
      screen.getByRole('status', {
        name: /工作流行动上下文：来自练习分桶，预选 判断未决策候选，已手动改选，将保存 继续调研中候选/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('预选 · 判断未决策候选')).toBeInTheDocument();
    expect(screen.getByText('将保存 · 继续调研中候选')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '至少补充一项缺失证据或备注。',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('编辑行动执行结果')).toHaveAttribute(
      'placeholder',
      '记录本次补充的读数、成本假设、备注或仍缺的证据。',
    );
  });

  it('renders and clears a latest action outcome as workflow evidence', async () => {
    const hooks = await loadMocks();
    const completedAt = localDateTimestamp(
      formatLocalDateInputValue(Date.now() - 2 * 24 * 60 * 60 * 1000),
    );
    const outcome = createOpportunity({
      id: 'outcome-existing-product',
      title: 'Outcome Existing Product',
      score: 80,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['review'],
        notes: 'Review candidate.',
        lastActionOutcome: {
          actionId: 'review_stale_decisions',
          outcome: 'Reviewed price trend and kept hold decision.',
          completedAt,
          updatedAt: Date.now(),
        },
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [outcome], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: outcome,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('行动结果')).toBeInTheDocument();
    expect(screen.queryByText(/决策依据 ·/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/复盘过期决策/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 天前完成/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/行动结果 · 复盘过期决策 · 2 天前完成：/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`完成时间 · ${new Date(completedAt).toLocaleString()}`),
    ).toBeInTheDocument();
    expect(screen.queryByText('待补行动结果')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Reviewed price trend/).length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('选择行动完成日期') as HTMLInputElement,
    ).toHaveValue(formatLocalDateInputValue(outcome.research!.lastActionOutcome!.completedAt));
    expect(
      within(screen.getByLabelText('行动结果完成定义')).getByText(
        '适用行动 · 复盘过期决策',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('行动结果证据提示')).toHaveTextContent(
      '证据提示 · 记录你复盘了哪些证据，以及保留、调整或清除的判断。',
    );
    expect(screen.getByLabelText('行动结果证据样例')).toHaveTextContent(
      '证据样例 · 例：复查 BSR 和毛利后维持 hold，下一步补竞品评论缺口。',
    );
    expect(screen.queryByLabelText('当前行动结果类型')).not.toBeInTheDocument();
    expect(screen.getByText(/不改变评分或市场\/业务信号/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('清除行动结果'));

    expect(clearActionOutcomeMutate).toHaveBeenCalledWith(
      'outcome-existing-product',
    );
  });

  it('keeps saved action outcome type when action context changes', async () => {
    const hooks = await loadMocks();
    const outcome = createOpportunity({
      id: 'outcome-context-product',
      title: 'Outcome Context Product',
      score: 80,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['review'],
        notes: 'Review candidate.',
        lastActionOutcome: {
          actionId: 'review_stale_decisions',
          outcome: 'Reviewed price trend and kept hold decision.',
          completedAt: Date.now() - 1000,
          updatedAt: Date.now(),
        },
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [outcome], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: outcome,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('筛选行动分桶：补齐下一步行动'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('review_stale_decisions');
    });
    expect(screen.queryByText('工作流行动上下文')).not.toBeInTheDocument();
    expect(screen.queryByText('来自每日行动')).not.toBeInTheDocument();
    expect(screen.queryByText('来自练习分桶')).not.toBeInTheDocument();
    expect(screen.queryByText('已手动改选')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /工作流行动上下文/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('当前行动结果类型')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Reviewed price trend/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('平台筛选'), {
      target: { value: 'amazon' },
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText('选择行动结果类型') as HTMLSelectElement,
      ).toHaveValue('review_stale_decisions');
    });
    expect(screen.queryByText('工作流行动上下文')).not.toBeInTheDocument();
    expect(screen.queryByText('来自每日行动')).not.toBeInTheDocument();
    expect(screen.queryByText('来自练习分桶')).not.toBeInTheDocument();
    expect(screen.queryByText('已手动改选')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /工作流行动上下文/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('当前行动结果类型')).not.toBeInTheDocument();
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

  it('shows saved decision next action in the comparison table only when present', async () => {
    const hooks = await loadMocks();
    const withNextAction = createOpportunity({
      id: 'comparison-next-action-product',
      title: 'Comparison Next Action Product',
      score: 86,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['compare'],
        notes: 'Compare the saved follow-up.',
        decision: createDecision({
          status: 'go',
          reason: 'Supplier MOQ and target margin are aligned.',
          nextAction: 'Ask supplier for landed cost confirmation.',
          score: 86,
          recommendation: 'investigate',
        }),
      },
    });
    const withoutNextAction = createOpportunity({
      id: 'comparison-no-next-action-product',
      title: 'Comparison No Next Action Product',
      score: 74,
      recommendation: 'watch',
      research: {
        status: 'watching',
        priority: 'medium',
        tags: ['compare'],
        notes: '下一步 · Do not copy notes into comparison next action.',
        decision: createDecision({
          status: 'hold',
          reason: 'Needs demand confirmation before ordering.',
          nextAction: null,
          score: 74,
          recommendation: 'watch',
        }),
        lastActionOutcome: {
          actionId: 'continue_research',
          outcome:
            '下一步 · Do not copy action outcome into comparison next action.',
          completedAt: Date.now() - 24 * 60 * 60 * 1000,
          updatedAt: Date.now(),
        },
      },
    });
    hooks.useCompareOpportunityResearch.mockReturnValue({
      mutate: compareResearchMutate,
      isPending: false,
      data: { data: [withNextAction, withoutNextAction] },
    } as unknown);

    render(<Opportunities />);

    const comparisonTable = screen.getByRole('table');
    const missingNextActionRow = within(comparisonTable)
      .getByText('Comparison No Next Action Product')
      .closest('tr') as HTMLTableRowElement;
    const missingNextActionDecisionCell =
      within(missingNextActionRow).getAllByRole('cell')[4];
    expect(
      within(comparisonTable).getByText(
        '下一步 · Ask supplier for landed cost confirmation.',
      ),
    ).toBeInTheDocument();
    expect(
      within(missingNextActionDecisionCell).queryByText(
        '下一步 · Do not copy notes into comparison next action.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(missingNextActionDecisionCell).queryByText(
        '下一步 · Do not copy action outcome into comparison next action.',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows saved decision snapshot summary in the comparison table instead of current score', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'go',
      reason: 'Saved when snapshot evidence supported a test order.',
      nextAction: 'Check whether the newer score changed the decision.',
      score: 62.4,
      recommendation: 'watch',
    });
    decision.snapshot.confidence = 0.44;
    const snapshotCapturedAt = Date.UTC(2026, 0, 2, 3, 4, 5);
    const decidedAt = Date.UTC(2026, 1, 3, 4, 5, 6);
    const updatedAt = Date.UTC(2026, 2, 4, 5, 6, 7);
    decision.snapshot.capturedAt = snapshotCapturedAt;
    decision.decidedAt = decidedAt;
    decision.updatedAt = updatedAt;
    decision.snapshot.keyReasons = [
      'Saved snapshot margin looked acceptable.',
      'Saved snapshot demand proxy was stable.',
    ];
    decision.snapshot.missingSignals = ['supplier_quote', 'ad_cost'];
    decision.snapshot.businessSignals = {
      completeness: 'partial',
      missingSignals: ['landed_cost', 'fba_fee'],
      metrics: {
        currency: 'USD',
        priceSource: 'target',
        completeness: 'complete',
        missingSignals: [],
        totalVariableCost: 72.5,
        grossMargin: 0.36,
        netMargin: 0.225,
        roi: 0.48,
        breakevenSellPrice: 62.5,
        contributionProfitPerUnit: 18.75,
        targetUnits: 100,
        projectedContributionProfit: 1875,
        inputs: {
          sellPrice: 99,
          costBasis: 39,
          inboundShipping: 6,
          outboundShipping: 4,
          fulfillmentFee: 8,
          platformFee: 5,
          referralFeeRate: 0.15,
          referralFee: 14.85,
          advertisingCost: 3,
          taxCustomsBuffer: 2.65,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Business assumptions are incomplete and must stay tied to the saved snapshot.',
    };
    decision.snapshot.marketSignals = {
      status: 'stale',
      provider: 'keepa',
      source: 'third_party',
      confidence: 0.84,
      freshnessMs: 96 * 60 * 60 * 1000,
      missingSignals: ['market_signal_freshness', 'market_sales_rank'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [
        {
          name: 'market_sales_rank_trend',
          label: 'Sales rank trend',
          rawValue: -8.4,
          normalizedScore: 70,
          weight: 0.07,
          contribution: 4.9,
          direction: 'positive',
          source: 'third_party',
          freshnessMs: 96 * 60 * 60 * 1000,
          confidenceImpact: 0.06,
          explanation:
            'Saved Keepa sales rank movement should stay tied to the snapshot.',
        },
      ],
    };
    decision.snapshot.recommendationGate = {
      status: 'blocked',
      applied: true,
      originalRecommendation: 'investigate',
      finalRecommendation: 'watch',
      reasons: ['saved snapshot gate blocked immediate ordering.'],
      signals: ['profit_margin'],
      nextActions: ['Add cost assumptions.'],
    };
    const withSnapshot = createOpportunity({
      id: 'comparison-snapshot-product',
      title: 'Comparison Snapshot Product',
      score: 91.8,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['compare'],
        notes: 'Current score differs from saved snapshot score.',
        decision,
        decisionReview: {
          hasDecision: true,
          status: 'go',
          decidedAt,
          daysSinceDecision: 16,
          hasNextAction: true,
          needsNextAction: false,
          stale: true,
        },
      },
    });
    withSnapshot.businessSignals = {
      completeness: 'complete',
      missingSignals: ['current_business_gap_should_not_appear'],
      metrics: {
        currency: 'USD',
        priceSource: 'current_price',
        completeness: 'complete',
        missingSignals: [],
        totalVariableCost: 50,
        grossMargin: 0.7,
        netMargin: 0.99,
        roi: 1.4,
        breakevenSellPrice: 40,
        contributionProfitPerUnit: 55,
        targetUnits: 25,
        projectedContributionProfit: 1375,
        inputs: {
          sellPrice: 99,
          costBasis: 20,
          inboundShipping: 2,
          outboundShipping: 2,
          fulfillmentFee: 4,
          platformFee: 3,
          referralFeeRate: 0.1,
          referralFee: 9.9,
          advertisingCost: 1,
          taxCustomsBuffer: 1,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Current business signals must not replace saved decision snapshot business signals.',
    };
    withSnapshot.marketSignals = {
      status: 'fresh',
      provider: 'rainforest',
      source: 'api',
      confidence: 0.99,
      freshnessMs: 60 * 60 * 1000,
      missingSignals: ['current_market_gap_should_not_appear'],
      caveat:
        'Current market signals must not replace saved decision snapshot market signals.',
      factors: [
        {
          name: 'market_sales_rank_trend',
          label: 'Sales rank trend',
          rawValue: 42,
          normalizedScore: 20,
          weight: 0.07,
          contribution: 1.4,
          direction: 'negative',
          source: 'api',
          freshnessMs: 60 * 60 * 1000,
          confidenceImpact: -0.02,
          explanation:
            'Current market factor should not appear as snapshot market summary.',
        },
      ],
    };
    const clearSnapshotGateDecision = createDecision({
      status: 'hold',
      reason: 'Saved before the current gate changed.',
      nextAction: 'Review whether current gate still applies.',
      score: 58.2,
      recommendation: 'check_data',
    });
    const withClearSnapshotGate = createOpportunity({
      id: 'comparison-clear-snapshot-gate-product',
      title: 'Comparison Clear Snapshot Gate Product',
      score: 78.9,
      recommendation: 'check_data',
      missingSignals: ['current_missing_signal_should_not_appear'],
      recommendationGate: {
        status: 'blocked',
        applied: true,
        originalRecommendation: 'investigate',
        finalRecommendation: 'check_data',
        reasons: ['current gate should not appear as snapshot gate.'],
        signals: ['profit_margin'],
        nextActions: ['Update current assumptions.'],
      },
      research: {
        status: 'ready',
        priority: 'medium',
        tags: ['compare'],
        notes: 'Current gate differs from saved clear snapshot gate.',
        decision: clearSnapshotGateDecision,
      },
    });
    withClearSnapshotGate.research!.decisionReview = null;
    clearSnapshotGateDecision.snapshot.keyReasons = [];
    clearSnapshotGateDecision.snapshot.missingSignals = [];
    clearSnapshotGateDecision.snapshot.marketSignals = null;
    delete (clearSnapshotGateDecision.snapshot as Partial<
      typeof clearSnapshotGateDecision.snapshot
    >).businessSignals;
    withClearSnapshotGate.businessSignals = {
      completeness: 'partial',
      missingSignals: ['current_business_gap_should_not_appear'],
      metrics: {
        currency: 'USD',
        priceSource: 'current_price',
        completeness: 'partial',
        missingSignals: ['shipping'],
        totalVariableCost: 50,
        grossMargin: 0.7,
        netMargin: 0.99,
        roi: 1.4,
        breakevenSellPrice: 40,
        contributionProfitPerUnit: 55,
        targetUnits: null,
        projectedContributionProfit: null,
        inputs: {
          sellPrice: 99,
          costBasis: 20,
          inboundShipping: 2,
          outboundShipping: 2,
          fulfillmentFee: 4,
          platformFee: 3,
          referralFeeRate: 0.1,
          referralFee: 9.9,
          advertisingCost: 1,
          taxCustomsBuffer: 1,
        },
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      caveat:
        'Current business signals must not be inferred as saved snapshot business signals.',
    };
    withClearSnapshotGate.marketSignals = {
      status: 'fresh',
      provider: 'keepa',
      source: 'third_party',
      confidence: 0.91,
      freshnessMs: 2 * 60 * 60 * 1000,
      missingSignals: [],
      caveat:
        'Current market signals must not be inferred as saved snapshot market signals.',
      factors: [
        {
          name: 'current_empty_snapshot_market_factor',
          label: 'Current empty snapshot trend',
          rawValue: 12,
          normalizedScore: 65,
          weight: 0.07,
          contribution: 4.55,
          direction: 'positive',
          source: 'third_party',
          freshnessMs: 2 * 60 * 60 * 1000,
          confidenceImpact: 0.04,
          explanation:
            'Current market factor should not backfill a null saved snapshot.',
        },
      ],
    };
    const withoutDecision = createOpportunity({
      id: 'comparison-no-decision-snapshot-product',
      title: 'Comparison No Decision Snapshot Product',
      score: 77.7,
      recommendation: 'check_data',
      research: {
        status: 'researching',
        priority: 'medium',
        tags: ['compare'],
        notes: 'Do not create snapshot summary from current score.',
      },
    });
    hooks.useCompareOpportunityResearch.mockReturnValue({
      mutate: compareResearchMutate,
      isPending: false,
      data: { data: [withSnapshot, withClearSnapshotGate, withoutDecision] },
    } as unknown);

    render(<Opportunities />);

    const comparisonTable = screen.getByRole('table');
    const snapshotRow = within(comparisonTable)
      .getByText('Comparison Snapshot Product')
      .closest('tr') as HTMLTableRowElement;
    const snapshotDecisionCell = within(snapshotRow).getAllByRole('cell')[4];
    expect(
      within(snapshotDecisionCell).getByText('快照 62.4 · 持续观察'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照置信度 44%'),
    ).toBeInTheDocument();
    expect(within(snapshotDecisionCell).getByText('需复盘')).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('决策时间 · 16 天前决策'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('待下一步'),
    ).not.toBeInTheDocument();
    const snapshotTime = new Date(snapshotCapturedAt).toLocaleString();
    expect(
      within(snapshotDecisionCell).getByText(`快照时间 · ${snapshotTime}`),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText(
        '快照依据 · Saved snapshot margin looked acceptable.；Saved snapshot demand proxy was stable.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照缺口 · supplier_quote、ad_cost'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务完整度 · 部分'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务缺口 · landed_cost、fba_fee'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务指标 · 净利率 22.5%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务指标 · ROI 48.0%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务指标 · 盈亏平衡价 USD 62.5'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照业务指标 · 单件贡献 USD 18.75'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照市场状态 · 过期'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照市场来源 · keepa / third_party'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照市场置信度 · 84%'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照市场新鲜度 · 4d'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText(
        '快照市场缺口 · 市场信号新鲜度、销售排名',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText(
        '快照市场因子 · Sales rank trend -8.40 · Saved Keepa sales rank movement should stay tied to the snapshot.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照门控 blocked'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照门控 · 重点研究 → 持续观察'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText(
        '快照门控原因 · saved snapshot gate blocked immediate ordering.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText('快照门控信号 · 利润率'),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).getByText(
        '快照门控下一步 · Add cost assumptions.',
      ),
    ).toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照 91.8 · 重点研究'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照置信度 72%'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        `快照时间 · ${new Date(decidedAt).toLocaleString()}`,
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        `快照时间 · ${new Date(updatedAt).toLocaleString()}`,
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照业务完整度 · 完整'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        '快照业务缺口 · current_business_gap_should_not_appear',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照业务指标 · 净利率 99.0%'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照业务指标 · ROI 140.0%'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照业务指标 · 盈亏平衡价 USD 40'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照业务指标 · 单件贡献 USD 55'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照市场状态 · 新鲜'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照市场来源 · rainforest / api'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照市场置信度 · 99%'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText('快照市场新鲜度 · 1h'),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        '快照市场缺口 · current_market_gap_should_not_appear',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        '快照市场因子 · Sales rank trend 42.00',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        'Current market factor should not appear as snapshot market summary.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        '快照门控原因 · current gate should not appear as snapshot gate.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(snapshotDecisionCell).queryByText(
        '快照门控下一步 · Update current assumptions.',
      ),
    ).not.toBeInTheDocument();

    const clearSnapshotGateRow = within(comparisonTable)
      .getByText('Comparison Clear Snapshot Gate Product')
      .closest('tr') as HTMLTableRowElement;
    const clearSnapshotGateDecisionCell = within(clearSnapshotGateRow).getAllByRole(
      'cell',
    )[4];
    expect(
      within(clearSnapshotGateDecisionCell).getByText('快照 58.2 · 补充数据'),
    ).toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照门控/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/决策时间/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/待下一步|需复盘/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照依据/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照缺口/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照业务完整度|快照业务缺口/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照业务指标/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        'current_missing_signal_should_not_appear',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        'current_business_gap_should_not_appear',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        '快照业务指标 · 净利率 99.0%',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(/快照市场/),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        '快照市场因子 · Current empty snapshot trend 12.00',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        'Current market factor should not backfill a null saved snapshot.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        'current gate should not appear as snapshot gate.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        '快照门控信号 · 利润率',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(clearSnapshotGateDecisionCell).queryByText(
        '快照门控下一步 · Update current assumptions.',
      ),
    ).not.toBeInTheDocument();

    const noDecisionRow = within(comparisonTable)
      .getByText('Comparison No Decision Snapshot Product')
      .closest('tr') as HTMLTableRowElement;
    const noDecisionCell = within(noDecisionRow).getAllByRole('cell')[4];
    expect(within(noDecisionCell).getByText('未决策')).toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText('快照 77.7 · 补充数据'),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照置信度/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照时间/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/决策时间/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/待下一步|需复盘/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照依据|快照缺口/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照业务完整度|快照业务缺口/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照业务指标/),
    ).not.toBeInTheDocument();
    expect(
      within(noDecisionCell).queryByText(/快照市场/),
    ).not.toBeInTheDocument();
  });

  it('shows saved latest action outcome in the comparison table only when present', async () => {
    const hooks = await loadMocks();
    const completedAt = localDateTimestamp(formatLocalDateInputValue());
    const withOutcome = createOpportunity({
      id: 'comparison-action-outcome-product',
      title: 'Comparison Action Outcome Product',
      score: 83,
      recommendation: 'investigate',
      research: {
        status: 'ready',
        priority: 'high',
        tags: ['compare'],
        notes: 'Compare execution evidence.',
        decision: createDecision({
          status: 'go',
          reason: 'Supplier quote supports a test order.',
          nextAction: 'Confirm packaging constraints.',
          score: 83,
          recommendation: 'investigate',
        }),
        lastActionOutcome: {
          actionId: 'continue_research',
          outcome: 'Supplier confirmed lead time and carton details.',
          completedAt,
          updatedAt: Date.now(),
        },
      },
    });
    const withoutOutcome = createOpportunity({
      id: 'comparison-missing-action-outcome-product',
      title: 'Comparison Missing Action Outcome Product',
      score: 67,
      recommendation: 'watch',
      research: {
        status: 'watching',
        priority: 'medium',
        tags: ['compare'],
        notes: 'Do not copy notes into comparison action outcome.',
        decision: createDecision({
          status: 'hold',
          reason: 'Do not copy decision reason into comparison action outcome.',
          nextAction: null,
          score: 67,
          recommendation: 'watch',
        }),
        decisionReview: {
          hasDecision: true,
          status: 'hold',
          decidedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
          daysSinceDecision: 3,
          hasNextAction: false,
          needsNextAction: true,
          stale: false,
        },
      },
    });
    hooks.useCompareOpportunityResearch.mockReturnValue({
      mutate: compareResearchMutate,
      isPending: false,
      data: { data: [withOutcome, withoutOutcome] },
    } as unknown);

    render(<Opportunities />);

    const comparisonTable = screen.getByRole('table');
    const outcomeRow = within(comparisonTable)
      .getByText('Comparison Action Outcome Product')
      .closest('tr') as HTMLTableRowElement;
    const outcomeCell = within(outcomeRow).getAllByRole('cell')[5];
    expect(
      within(outcomeCell).getByText('继续调研中候选 · 今天完成'),
    ).toBeInTheDocument();
    expect(
      within(outcomeCell).getByText(
        `完成时间 · ${new Date(completedAt).toLocaleString()}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(outcomeCell).getByText(
        'Supplier confirmed lead time and carton details.',
      ),
    ).toBeInTheDocument();

    const missingOutcomeRow = within(comparisonTable)
      .getByText('Comparison Missing Action Outcome Product')
      .closest('tr') as HTMLTableRowElement;
    const missingOutcomeCell = within(missingOutcomeRow).getAllByRole('cell')[5];
    expect(within(missingOutcomeCell).getByText('未记录')).toBeInTheDocument();
    expect(
      within(missingOutcomeCell).queryByText(/完成时间/),
    ).not.toBeInTheDocument();
    expect(
      within(missingOutcomeCell).queryByText(
        'Do not copy notes into comparison action outcome.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(missingOutcomeCell).queryByText(
        'Do not copy decision reason into comparison action outcome.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(missingOutcomeCell).queryByText('补齐下一步行动'),
    ).not.toBeInTheDocument();
  });

  it('includes active practice filters in filter-based exports', async () => {
    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('筛选未记录行动结果'));

    await waitFor(() => {
      expect(screen.getByText('工作流练习筛选')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('导出研究候选'));

    expect(exportResearchMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'csv',
        filters: expect.objectContaining({
          actionOutcome: 'without',
          actionId: undefined,
        }),
        limit: 100,
      }),
      expect.any(Object),
    );
  });

  it('keeps explicit selected-product exports ahead of active practice filters', async () => {
    render(<Opportunities />);

    fireEvent.click(screen.getByLabelText('筛选行动分桶：补齐下一步行动'));
    await waitFor(() => {
      expect(screen.getByText('工作流练习筛选')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('选择 Alpha Headphones 比较'));
    fireEvent.click(screen.getByLabelText('导出研究候选'));

    expect(exportResearchMutate).toHaveBeenCalledWith(
      { format: 'csv', productIds: ['product-1'], limit: 100 },
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

  it('opens manual reading dialog from the selected opportunity without triggering provider check', async () => {
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByLabelText('记录 Alpha Headphones 手动读数')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('记录 Alpha Headphones 手动读数'));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /记录手动读数/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/价格/)).toBeInTheDocument();
  });

  it('submits a manual reading from the selected opportunity with selected product currency', async () => {
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByLabelText('记录 Alpha Headphones 手动读数')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('记录 Alpha Headphones 手动读数'));
    fireEvent.change(screen.getByLabelText(/价格/), {
      target: { value: '77.25' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    expect(createSnapshotMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'product-1',
        price: 77.25,
        currency: 'USD',
        availability: 'in_stock',
        source: 'manual',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('closes the manual reading dialog after saving from the selected opportunity', async () => {
    createSnapshotMutate.mockImplementation(
      (_data, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByLabelText('记录 Alpha Headphones 手动读数')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('记录 Alpha Headphones 手动读数'));
    fireEvent.change(screen.getByLabelText(/价格/), {
      target: { value: '77.25' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /记录手动读数/ }),
      ).not.toBeInTheDocument();
    });
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
    expect(screen.getAllByText('市场趋势').length).toBeGreaterThan(0);
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

  it('shows recommendation gate reasons and next actions for blocked opportunities', async () => {
    const hooks = await loadMocks();
    const gated = createOpportunity({
      id: 'gated-product',
      title: 'Gated Product',
      score: 88,
      recommendation: 'check_data',
      recommendationGate: {
        status: 'blocked',
        applied: true,
        originalRecommendation: 'investigate',
        finalRecommendation: 'check_data',
        reasons: [
          'business assumptions are incomplete, so margin and ROI are not reliable enough for investigate.',
        ],
        signals: ['profit_margin', 'business_costBasis'],
        nextActions: ['Add cost, fee, shipping, advertising, and target sell price assumptions.'],
      },
    });
    hooks.useOpportunities.mockReturnValue({
      data: { data: [gated], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: gated,
      isLoading: false,
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('推荐门控')).toBeInTheDocument();
    expect(screen.getByText('blocked')).toBeInTheDocument();
    expect(screen.getByText(/business assumptions are incomplete/)).toBeInTheDocument();
    expect(screen.getByText(/Add cost, fee, shipping/)).toBeInTheDocument();
    expect(screen.getAllByText('利润率').length).toBeGreaterThan(0);
  });

  it('renders readable signal labels across opportunity workspace surfaces', async () => {
    const hooks = await loadMocks();
    const decision = createDecision({
      status: 'hold',
      reason: 'Saved while signal diagnostics were raw.',
      nextAction: '补齐业务和市场信号。',
      score: 64.2,
      recommendation: 'check_data',
    });
    decision.snapshot.keyReasons = [
      'Missing signals: price_history, business_costBasis, market_trend.',
    ];
    decision.snapshot.missingSignals = [
      'price_history',
      'business_costBasis',
      'profit_margin',
    ];
    decision.snapshot.businessSignals = {
      completeness: 'partial',
      missingSignals: ['costBasis', 'business_advertisingCost'],
      metrics: null,
      caveat:
        'Business assumptions are incomplete and must stay tied to the saved snapshot.',
    };
    decision.snapshot.marketSignals = {
      status: 'missing',
      provider: null,
      source: null,
      confidence: null,
      freshnessMs: null,
      missingSignals: ['market_trend'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [],
    };
    decision.snapshot.recommendationGate = {
      status: 'blocked',
      applied: true,
      originalRecommendation: 'investigate',
      finalRecommendation: 'check_data',
      reasons: ['Missing signals: profit_margin, business_costBasis.'],
      signals: ['profit_margin', 'business_costBasis'],
      nextActions: ['Add cost, fee, shipping, advertising, and target sell price assumptions.'],
    };
    const labeled = createOpportunity({
      id: 'localized-signal-product',
      title: 'Localized Signal Product',
      score: 67.5,
      recommendation: 'check_data',
      marketStatus: 'missing',
      recommendationGate: {
        status: 'blocked',
        applied: true,
        originalRecommendation: 'investigate',
        finalRecommendation: 'check_data',
        reasons: ['Missing signals: profit_margin, business_costBasis.'],
        signals: ['profit_margin', 'business_costBasis'],
        nextActions: [
          'Add cost, fee, shipping, advertising, and target sell price assumptions.',
        ],
      },
      research: {
        status: 'watching',
        priority: 'medium',
        tags: ['labels'],
        notes: 'Readable labels audit.',
        decision,
      },
    });
    labeled.keyReasons = [
      'Missing signals: price_history, business_costBasis, market_trend.',
    ];
    labeled.missingSignals = [
      'price_history',
      'business_costBasis',
      'business_advertisingCost',
      'profit_margin',
      'market_trend',
      'sales_volume',
    ];
    labeled.factors = [
      {
        name: 'business_margin',
        label: 'Business margin',
        rawValue: null,
        normalizedScore: 50,
        weight: 0.1,
        contribution: 5,
        direction: 'neutral',
        explanation: 'Missing signals: profit_margin, business_costBasis.',
      },
    ];
    labeled.businessSignals = {
      completeness: 'partial',
      missingSignals: ['costBasis', 'business_referralFeeRate', 'advertisingCost'],
      metrics: null,
      caveat:
        'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
    };
    labeled.marketSignals = {
      status: 'missing',
      provider: null,
      source: null,
      confidence: null,
      freshnessMs: null,
      missingSignals: ['market_trend'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [],
    };
    hooks.useOpportunities.mockReturnValue({
      data: { data: [labeled], total: 1, pagination: { page: 1, limit: 30, totalPages: 1 } },
      isLoading: false,
    } as unknown);
    hooks.useProductOpportunity.mockReturnValue({
      data: labeled,
      isLoading: false,
    } as unknown);
    hooks.useCompareOpportunityResearch.mockReturnValue({
      mutate: compareResearchMutate,
      isPending: false,
      data: { data: [labeled] },
    } as unknown);

    render(<Opportunities />);

    expect(screen.getByText('业务部分')).toBeInTheDocument();
    expect(screen.getByText('市场缺失')).toBeInTheDocument();
    expect(
      screen.getAllByText('缺失信号：价格历史、单件成本、市场趋势。').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('单件成本').length).toBeGreaterThan(0);
    expect(screen.getAllByText('广告成本').length).toBeGreaterThan(0);
    expect(screen.getAllByText('佣金比例').length).toBeGreaterThan(0);
    expect(screen.getAllByText('利润率').length).toBeGreaterThan(0);
    expect(screen.getAllByText('市场趋势').length).toBeGreaterThan(0);
    expect(screen.getAllByText('销量').length).toBeGreaterThan(0);
    expect(screen.getAllByText('快照业务完整度 · 部分').length).toBeGreaterThan(0);
    expect(screen.getAllByText('快照业务缺口 · 单件成本、广告成本').length).toBeGreaterThan(0);
    expect(screen.getAllByText('快照市场状态 · 缺失').length).toBeGreaterThan(0);
    expect(screen.getAllByText('快照市场缺口 · 市场趋势').length).toBeGreaterThan(0);
    expect(screen.getAllByText('快照门控信号 · 利润率、单件成本').length).toBeGreaterThan(
      0,
    );

    const visibleText = document.body.textContent ?? '';
    for (const rawSignal of [
      'business partial',
      'market missing',
      'costBasis',
      'business_costBasis',
      'business_advertisingCost',
      'business_referralFeeRate',
      'profit_margin',
      'market_trend',
      'sales_volume',
      'price_history',
    ]) {
      expect(visibleText).not.toContain(rawSignal);
    }
  });
});

function createDecisionAgeCandidate(
  id: string,
  title: string,
  daysSinceDecision: number,
): ProductOpportunity {
  const decision = createDecision({
    status: 'go',
    reason: `${title} evidence.`,
    nextAction: 'Review next supplier evidence.',
    score: 80,
    recommendation: 'watch',
  });

  return createOpportunity({
    id,
    title,
    score: 80,
    recommendation: 'watch',
    research: {
      status: 'ready',
      priority: 'medium',
      tags: ['decision-age'],
      notes: null,
      decision,
      decisionReview: {
        hasDecision: true,
        status: 'go',
        decidedAt: decision.decidedAt,
        daysSinceDecision,
        hasNextAction: true,
        needsNextAction: false,
        stale: daysSinceDecision >= 14,
      },
    },
  });
}

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
  recommendationGate,
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
    archived?: boolean;
    decision?: NonNullable<ProductOpportunity['research']>['decision'];
    decisionReview?: NonNullable<ProductOpportunity['research']>['decisionReview'];
    lastActionOutcome?: NonNullable<ProductOpportunity['research']>['lastActionOutcome'];
  };
  recommendationGate?: ProductOpportunity['recommendationGate'];
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
    recommendationGate: recommendationGate ?? {
      status: 'clear',
      applied: false,
      originalRecommendation: recommendation,
      finalRecommendation: recommendation,
      reasons: [],
      signals: [],
      nextActions: [],
    },
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
          decision: research.decision ?? null,
          lastActionOutcome: research.lastActionOutcome ?? null,
          decisionReview:
            research.decisionReview ??
            createDecisionReview(research.decision ?? null),
          archived: research.archived ?? false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : undefined,
  };
}

function createDecisionReview(
  decision: NonNullable<ProductOpportunity['research']>['decision'] | null,
): NonNullable<ProductOpportunity['research']>['decisionReview'] {
  if (!decision) {
    return {
      hasDecision: false,
      status: null,
      decidedAt: null,
      daysSinceDecision: null,
      hasNextAction: false,
      needsNextAction: false,
      stale: false,
    };
  }

  const daysSinceDecision = Math.max(
    0,
    Math.floor((Date.now() - decision.decidedAt) / (24 * 60 * 60 * 1000)),
  );
  const hasNextAction = Boolean(decision.nextAction);
  return {
    hasDecision: true,
    status: decision.status,
    decidedAt: decision.decidedAt,
    daysSinceDecision,
    hasNextAction,
    needsNextAction:
      (decision.status === 'go' || decision.status === 'hold') &&
      !hasNextAction,
    stale: daysSinceDecision >= 14,
  };
}

function createDecision({
  status,
  reason,
  nextAction,
  score,
  recommendation,
}: {
  status: NonNullable<NonNullable<ProductOpportunity['research']>['decision']>['status'];
  reason: string;
  nextAction: string | null;
  score: number;
  recommendation: ProductOpportunity['recommendation'];
}): NonNullable<NonNullable<ProductOpportunity['research']>['decision']> {
  const now = Date.now();
  return {
    status,
    reason,
    nextAction,
    decidedAt: now - 1000,
    updatedAt: now,
    snapshot: {
      capturedAt: now - 1000,
      score,
      confidence: 0.72,
      recommendation,
      recommendationGate: {
        status: 'clear',
        applied: false,
        originalRecommendation: recommendation,
        finalRecommendation: recommendation,
        reasons: [],
        signals: [],
        nextActions: [],
      },
      keyReasons: ['Current price is below average.'],
      missingSignals: ['profit_margin'],
      businessSignals: {
        completeness: 'none',
        missingSignals: ['costBasis', 'fees'],
        metrics: null,
        caveat:
          'Business metrics are calculated from merchant-provided assumptions and are not verified sales or demand facts.',
      },
      marketSignals: null,
    },
  };
}
