import { desc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { productBusinessSignals, scrapeAttempts } from '../db/schema';
import { config } from '../config';
import {
  BusinessMetrics,
  OpportunityBusinessSummary,
  OpportunityAcquisitionHealth,
  OpportunityFactor,
  OpportunityMarketSignalSummary,
  OpportunityListFilters,
  OpportunityListResult,
  OpportunityPriceSignal,
  OpportunityRecommendation,
  OpportunityRecommendationGate,
  MarketSignalOpportunityFactor,
  MarketSignalSnapshot,
  MarketSignalTrendSummary,
  Product,
  ProductOpportunity,
  ProductBusinessSignal,
  ScrapeAttempt,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { ProductService } from './productService';
import { PriceAnalysisService } from './priceAnalysisService';
import { BusinessMetricsService } from './businessMetricsService';
import { MarketSignalSnapshotService } from './marketSignalSnapshotService';
import { OpportunityResearchService } from './opportunityResearchService';

interface FactorInput {
  name: string;
  label: string;
  rawValue: number | string | boolean | null;
  normalizedScore: number;
  weight: number;
  direction?: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

const DEFAULT_LIMIT = 20;
const PRODUCT_BATCH_SIZE = 100;
const MAX_SIGNAL_HISTORY = 30;
const ACQUISITION_FRESH_MS = 24 * 60 * 60 * 1000;
const MARKET_SIGNAL_CAVEAT =
  'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.';

// 评分模型诚实声明：
// 各 factor 的 normalizedScore 系数（如 50 + netMargin*120）和 weight 都是
// **人工拍定的启发式常量**，没有用真实选品结果回测校准过。因此 opportunity
// score 是“对已录入信息的透明加权汇总”，是决策辅助，不是经过验证的事实或预测。
// 每个 factor 都带 rawValue / contribution / explanation，前端会展示完整构成，
// 让使用者据此判断并可否决，而不是把分数当真值照搬。

export class OpportunityScoringService {
  constructor(
    private readonly productService = new ProductService(),
    private readonly priceAnalysisService = new PriceAnalysisService(),
    private readonly businessMetricsService = new BusinessMetricsService(),
    private readonly marketSignalSnapshotService = new MarketSignalSnapshotService(),
    private readonly researchService = new OpportunityResearchService()
  ) {}

  async listOpportunities(
    filters: OpportunityListFilters = {}
  ): Promise<OpportunityListResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_LIMIT;

    const scored: ProductOpportunity[] = [];

    for await (const productBatch of this.productService.iterateProductBatches(
      {
        platform: filters.platform,
        monitoring: filters.monitoring,
      },
      PRODUCT_BATCH_SIZE
    )) {
      const eligibleProducts = productBatch.filter((product) =>
        filters.category ? product.category === filters.category : true
      );
      const productIds = eligibleProducts.map((product) => product.id);

      if (productIds.length === 0) {
        continue;
      }

      const [
        priceSignals,
        attempts,
        businessSignals,
        marketSignals,
      ] = await Promise.all([
        this.priceAnalysisService.getOpportunityPriceSignals(productIds, {
          limit: MAX_SIGNAL_HISTORY,
        }),
        this.getLatestAttempts(productIds),
        this.getBusinessSignals(productIds),
        this.marketSignalSnapshotService.getLatestSnapshotsForProducts(
          productIds
        ),
      ]);

      const batchScored = eligibleProducts
        .map((product) =>
          this.scoreProduct(
            product,
            priceSignals.get(product.id) ??
              this.emptyPriceSignal(product.id),
            attempts.get(product.id),
            businessSignals.get(product.id) ?? null,
            marketSignals.get(product.id) ?? null
          )
        )
        .filter((opportunity) =>
          filters.minScore !== undefined
            ? opportunity.score >= filters.minScore
            : true
        )
        .filter((opportunity) =>
          filters.businessReadiness && filters.businessReadiness !== 'any'
            ? opportunity.businessSignals.completeness === filters.businessReadiness
            : true
        )
        .filter((opportunity) =>
          filters.minRoi !== undefined
            ? (opportunity.businessSignals.metrics?.roi ?? Number.NEGATIVE_INFINITY) >=
              filters.minRoi
            : true
        )
        .filter((opportunity) =>
          filters.recommendation
            ? opportunity.recommendation === filters.recommendation
            : true
        );

      scored.push(...batchScored);
    }

    const research = await this.researchService.getMetadataMap(
      scored.map((opportunity) => opportunity.product.id)
    );
    const withResearch = this.researchService.filterOpportunities(
      this.researchService.attachMetadata(scored, research),
      filters
    );

    this.sortOpportunities(
      withResearch,
      filters.sortBy ?? 'score',
      filters.sortOrder ?? 'desc'
    );

    const total = withResearch.length;
    const start = (page - 1) * limit;
    const data = withResearch.slice(start, start + limit);

    return {
      data,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async explainProduct(productId: string): Promise<ProductOpportunity> {
    const product = await this.productService.getProductById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    const priceSignal =
      await this.priceAnalysisService.getOpportunityPriceSignal(product.id, {
        limit: MAX_SIGNAL_HISTORY,
      });
    const attempts = await this.getLatestAttempts([product.id]);
    const businessSignals = await this.getBusinessSignals([product.id]);
    const marketSignal =
      await this.marketSignalSnapshotService.getLatestSnapshot(product.id);
    const opportunity = this.scoreProduct(
      product,
      priceSignal,
      attempts.get(product.id),
      businessSignals.get(product.id) ?? null,
      marketSignal
    );
    const research = await this.researchService.getMetadataMap([product.id]);
    return this.researchService.attachMetadata([opportunity], research)[0];
  }

  private scoreProduct(
    product: Product,
    priceSignal: OpportunityPriceSignal,
    latestAttempt?: ScrapeAttempt,
    businessAssumptions?: ProductBusinessSignal | null,
    marketSignal?: MarketSignalSnapshot | null
  ): ProductOpportunity {
    const acquisitionHealth = this.createAcquisitionHealth(latestAttempt);
    const businessSignals = this.createBusinessSummary(
      product,
      businessAssumptions ?? null
    );
    const marketSignals = this.createMarketSignalSummary(marketSignal ?? null);
    const factors = [
      this.pricePositionFactor(priceSignal),
      this.priceTrendFactor(priceSignal),
      this.priceStabilityFactor(priceSignal),
      this.acquisitionHealthFactor(acquisitionHealth),
      this.reviewProxyFactor(priceSignal),
      this.availabilityFactor(priceSignal),
      this.monitoringFactor(product),
      ...this.marketSignalScoreFactors(marketSignals),
      ...this.businessMetricFactors(businessSignals.metrics),
    ];

    const score = this.round(
      this.clamp(
        factors.reduce((sum, factor) => sum + factor.contribution, 0),
        0,
        100
      )
    );
    const missingSignals = this.unique([
      ...priceSignal.missingSignals,
      ...(latestAttempt ? [] : ['acquisition_history']),
      ...(priceSignal.rating || priceSignal.reviewCount
        ? []
        : ['review_proxy']),
      ...businessSignals.missingSignals.map(
        (signal) => `business_${signal}`
      ),
      ...(businessSignals.completeness === 'complete' ? [] : ['profit_margin']),
      ...marketSignals.missingSignals,
      'sales_volume',
      'demand',
    ]);
    const confidence = this.calculateConfidence(
      priceSignal,
      latestAttempt,
      businessSignals,
      marketSignals
    );
    const originalRecommendation = this.recommend(
      score,
      confidence,
      missingSignals,
      businessSignals.metrics
    );
    const recommendationGate = this.applyRecommendationGate({
      originalRecommendation,
      confidence,
      missingSignals,
      businessSignals,
      marketSignals,
    });
    const recommendation = recommendationGate.finalRecommendation;

    return {
      product,
      score,
      confidence,
      recommendation,
      recommendationGate,
      keyReasons: this.createKeyReasons(factors, missingSignals),
      missingSignals,
      factors,
      acquisitionHealth,
      businessSignals,
      marketSignals,
    };
  }

  private createBusinessSummary(
    product: Product,
    assumptions: ProductBusinessSignal | null
  ): OpportunityBusinessSummary {
    const metrics = this.businessMetricsService.calculate(product, assumptions);
    return {
      completeness: metrics.completeness,
      missingSignals: metrics.missingSignals,
      metrics,
      caveat: metrics.caveat,
    };
  }

  private businessMetricFactors(
    metrics: BusinessMetrics | null
  ): OpportunityFactor[] {
    if (!metrics || metrics.completeness !== 'complete') {
      return [];
    }

    const netMargin = metrics.netMargin ?? 0;
    const roi = metrics.roi ?? 0;
    const contribution = metrics.contributionProfitPerUnit ?? 0;
    const sellPrice = metrics.inputs.sellPrice ?? 0;
    const breakevenSellPrice = metrics.breakevenSellPrice ?? sellPrice;
    const breakevenDistance =
      sellPrice > 0 ? (sellPrice - breakevenSellPrice) / sellPrice : 0;

    return [
      this.factor({
        name: 'business_net_margin',
        label: 'Net margin',
        rawValue: netMargin,
        normalizedScore: this.clamp(50 + netMargin * 120, 0, 100),
        weight: 0.1,
        direction: netMargin > 0 ? 'positive' : 'negative',
        explanation: `Assumption-based net margin is ${this.round(netMargin * 100, 1)}%.`,
      }),
      this.factor({
        name: 'business_roi',
        label: 'ROI',
        rawValue: roi,
        normalizedScore: this.clamp(45 + roi * 70, 0, 100),
        weight: 0.1,
        direction: roi > 0 ? 'positive' : 'negative',
        explanation: metrics.roi === null
          ? 'ROI is unavailable because cost basis is zero.'
          : `Assumption-based ROI is ${this.round(roi * 100, 1)}%.`,
      }),
      this.factor({
        name: 'business_breakeven_distance',
        label: 'Breakeven distance',
        rawValue: breakevenDistance,
        normalizedScore: this.clamp(50 + breakevenDistance * 150, 0, 100),
        weight: 0.06,
        direction: breakevenDistance > 0 ? 'positive' : 'negative',
        explanation: `Breakeven sell price is ${metrics.currency} ${breakevenSellPrice}.`,
      }),
      this.factor({
        name: 'business_contribution_profit',
        label: 'Contribution profit',
        rawValue: contribution,
        normalizedScore: this.clamp(
          sellPrice > 0 ? 50 + (contribution / sellPrice) * 120 : 45,
          0,
          100
        ),
        weight: 0.06,
        direction: contribution > 0 ? 'positive' : 'negative',
        explanation: `Assumption-based contribution profit is ${metrics.currency} ${contribution} per unit.`,
      }),
    ];
  }

  private createMarketSignalSummary(
    snapshot: MarketSignalSnapshot | null
  ): OpportunityMarketSignalSummary {
    if (!snapshot) {
      return {
        status: 'missing',
        provider: null,
        source: null,
        confidence: null,
        freshnessMs: null,
        missingSignals: ['market_trend'],
        caveat: MARKET_SIGNAL_CAVEAT,
        factors: [],
      };
    }

    const freshnessMs = this.marketSignalFreshness(snapshot);
    const stale = freshnessMs > config.marketSignals.freshnessMs;
    const missingSignals = this.unique([
      ...snapshot.missingSignals.map((signal) => `market_${signal}`),
      ...(stale ? ['market_signal_freshness'] : []),
    ]);

    return {
      status: stale ? 'stale' : 'fresh',
      provider: snapshot.provider,
      source: snapshot.source,
      confidence: snapshot.confidence,
      freshnessMs,
      missingSignals,
      caveat: MARKET_SIGNAL_CAVEAT,
      factors: this.marketSignalOpportunityFactors(snapshot, freshnessMs, stale),
    };
  }

  private marketSignalScoreFactors(
    summary: OpportunityMarketSignalSummary
  ): OpportunityFactor[] {
    if (summary.status === 'missing') {
      return [
        this.factor({
          name: 'market_signal_freshness',
          label: 'Market signal freshness',
          rawValue: null,
          normalizedScore: 45,
          weight: 0.05,
          direction: 'neutral',
          explanation:
            'External market trend signals are missing; refresh Keepa before treating the score as high-confidence.',
        }),
      ];
    }

    return summary.factors.map((factor) =>
      this.factor({
        name: factor.name,
        label: factor.label,
        rawValue: factor.rawValue,
        normalizedScore: factor.normalizedScore,
        weight: factor.weight,
        direction: factor.direction,
        explanation: factor.explanation,
      })
    );
  }

  private marketSignalOpportunityFactors(
    snapshot: MarketSignalSnapshot,
    freshnessMs: number,
    stale: boolean
  ): MarketSignalOpportunityFactor[] {
    const factors: MarketSignalOpportunityFactor[] = [];

    if (snapshot.priceTrend) {
      const normalized = this.priceTrendStabilityScore(snapshot.priceTrend);
      factors.push(
        this.marketFactor(snapshot, {
          name: 'market_price_stability',
          label: 'Market price stability',
          rawValue: snapshot.priceTrend.volatility ?? null,
          normalizedScore: normalized,
          weight: 0.05,
          direction: normalized >= 60 ? 'positive' : 'negative',
          freshnessMs,
          confidenceImpact: stale ? -0.12 : 0.04,
          explanation:
            'Keepa price history suggests external market price stability; this is provider trend evidence, not margin or ROI proof.',
        })
      );
    }

    if (snapshot.salesRankTrend) {
      const changePercent = snapshot.salesRankTrend.changePercent ?? 0;
      const normalized = this.clamp(55 - changePercent * 1.1, 0, 100);
      factors.push(
        this.marketFactor(snapshot, {
          name: 'market_sales_rank_trend',
          label: 'Sales rank trend',
          rawValue: this.round(changePercent, 1),
          normalizedScore: normalized,
          weight: 0.07,
          direction:
            changePercent < -2
              ? 'positive'
              : changePercent > 2
                ? 'negative'
                : 'neutral',
          freshnessMs,
          confidenceImpact: stale ? -0.12 : 0.06,
          explanation:
            'Keepa sales rank movement is treated as rank trend evidence only; it is not converted into verified sales volume.',
        })
      );
    }

    if (snapshot.reviewVelocity != null) {
      const normalized = this.clamp(50 + snapshot.reviewVelocity * 12, 0, 100);
      factors.push(
        this.marketFactor(snapshot, {
          name: 'market_review_velocity',
          label: 'Review activity trend',
          rawValue: this.round(snapshot.reviewVelocity, 2),
          normalizedScore: normalized,
          weight: 0.05,
          direction: snapshot.reviewVelocity > 0 ? 'positive' : 'neutral',
          freshnessMs,
          confidenceImpact: stale ? -0.1 : 0.04,
          explanation:
            'Review count movement is review activity evidence only, not verified demand or sales velocity.',
        })
      );
    }

    if (snapshot.ratingMovement != null) {
      const normalized = this.clamp(50 + snapshot.ratingMovement * 35, 0, 100);
      factors.push(
        this.marketFactor(snapshot, {
          name: 'market_rating_movement',
          label: 'Rating movement',
          rawValue: this.round(snapshot.ratingMovement, 2),
          normalizedScore: normalized,
          weight: 0.04,
          direction:
            snapshot.ratingMovement > 0.05
              ? 'positive'
              : snapshot.ratingMovement < -0.05
                ? 'negative'
                : 'neutral',
          freshnessMs,
          confidenceImpact: stale ? -0.08 : 0.03,
          explanation:
            'Rating movement is external sentiment trend evidence and remains separate from profitability assumptions.',
        })
      );
    }

    factors.push(
      this.marketFactor(snapshot, {
        name: 'market_signal_freshness',
        label: 'Market signal freshness',
        rawValue: freshnessMs,
        normalizedScore: stale ? 40 : 80,
        weight: 0.05,
        direction: stale ? 'negative' : 'positive',
        freshnessMs,
        confidenceImpact: stale ? -0.18 : 0.06,
        explanation: stale
          ? 'Keepa market signals are stale; refresh before treating trend evidence as current.'
          : 'Keepa market signals are within the configured freshness window.',
      })
    );

    return factors;
  }

  private marketFactor(
    snapshot: MarketSignalSnapshot,
    input: {
      name: string;
      label: string;
      rawValue: number | string | boolean | null;
      normalizedScore: number;
      weight: number;
      direction: 'positive' | 'negative' | 'neutral';
      freshnessMs: number | null;
      confidenceImpact: number;
      explanation: string;
    }
  ): MarketSignalOpportunityFactor {
    const normalizedScore = this.round(this.clamp(input.normalizedScore, 0, 100));
    const contribution = this.round(normalizedScore * input.weight);
    return {
      name: input.name,
      label: input.label,
      rawValue: input.rawValue,
      normalizedScore,
      weight: input.weight,
      contribution,
      direction: input.direction,
      source: snapshot.source,
      freshnessMs: input.freshnessMs,
      confidenceImpact: input.confidenceImpact,
      explanation: input.explanation,
    };
  }

  private priceTrendStabilityScore(
    trend: MarketSignalTrendSummary
  ): number {
    if (trend.volatility == null) return 55;
    return this.clamp(100 - trend.volatility * 250, 0, 100);
  }

  private pricePositionFactor(signal: OpportunityPriceSignal): OpportunityFactor {
    if (!signal.currentPrice || !signal.averagePrice) {
      return this.factor({
        name: 'price_position',
        label: 'Price position',
        rawValue: null,
        normalizedScore: 45,
        weight: 0.2,
        direction: 'neutral',
        explanation: 'Price history is missing, so price position is neutral.',
      });
    }

    const discountFromAverage =
      ((signal.averagePrice - signal.currentPrice) / signal.averagePrice) * 100;
    const normalized = this.clamp(50 + discountFromAverage * 2, 0, 100);
    return this.factor({
      name: 'price_position',
      label: 'Price position',
      rawValue: this.round(discountFromAverage, 1),
      normalizedScore: normalized,
      weight: 0.2,
      direction: discountFromAverage >= 0 ? 'positive' : 'negative',
      explanation:
        discountFromAverage >= 0
          ? `Current price is ${this.round(discountFromAverage, 1)}% below average.`
          : `Current price is ${Math.abs(this.round(discountFromAverage, 1))}% above average.`,
    });
  }

  private priceTrendFactor(signal: OpportunityPriceSignal): OpportunityFactor {
    if (signal.priceChangePercent === undefined || signal.dataPoints < 2) {
      return this.factor({
        name: 'price_trend',
        label: 'Price trend',
        rawValue: null,
        normalizedScore: 45,
        weight: 0.18,
        direction: 'neutral',
        explanation: 'Not enough price history to evaluate trend.',
      });
    }

    const normalized = this.clamp(55 - signal.priceChangePercent * 1.5, 0, 100);
    return this.factor({
      name: 'price_trend',
      label: 'Price trend',
      rawValue: signal.priceChangePercent,
      normalizedScore: normalized,
      weight: 0.18,
      direction: signal.priceChangePercent <= 0 ? 'positive' : 'negative',
      explanation:
        signal.priceChangePercent <= 0
          ? `Price is down ${Math.abs(signal.priceChangePercent)}% over available history.`
          : `Price is up ${signal.priceChangePercent}% over available history.`,
    });
  }

  private priceStabilityFactor(signal: OpportunityPriceSignal): OpportunityFactor {
    if (signal.volatility === undefined || signal.dataPoints < 2) {
      return this.factor({
        name: 'price_stability',
        label: 'Price stability',
        rawValue: null,
        normalizedScore: 50,
        weight: 0.12,
        direction: 'neutral',
        explanation: 'Not enough history to evaluate price volatility.',
      });
    }

    const normalized = this.clamp(100 - signal.volatility * 250, 0, 100);
    return this.factor({
      name: 'price_stability',
      label: 'Price stability',
      rawValue: signal.volatility,
      normalizedScore: normalized,
      weight: 0.12,
      direction: normalized >= 60 ? 'positive' : 'negative',
      explanation:
        normalized >= 60
          ? 'Price movement is relatively stable.'
          : 'Price movement is volatile and needs closer review.',
    });
  }

  private acquisitionHealthFactor(
    health: OpportunityAcquisitionHealth
  ): OpportunityFactor {
    if (!health.status) {
      return this.factor({
        name: 'acquisition_health',
        label: 'Acquisition health',
        rawValue: null,
        normalizedScore: 35,
        weight: 0.18,
        direction: 'negative',
        explanation: 'No acquisition attempt history is available.',
      });
    }

    const freshBonus =
      health.freshnessMs !== null && health.freshnessMs <= ACQUISITION_FRESH_MS
        ? 15
        : 0;
    const normalized =
      health.status === 'success'
        ? this.clamp(70 + freshBonus + (health.confidence ?? 0) * 15, 0, 100)
        : 25;

    return this.factor({
      name: 'acquisition_health',
      label: 'Acquisition health',
      rawValue: health.status,
      normalizedScore: normalized,
      weight: 0.18,
      direction: health.status === 'success' ? 'positive' : 'negative',
      explanation:
        health.status === 'success'
          ? `Latest acquisition succeeded via ${health.provider ?? 'unknown provider'}.`
          : `Latest acquisition failed with ${health.failureReason ?? 'unknown reason'}.`,
    });
  }

  private reviewProxyFactor(signal: OpportunityPriceSignal): OpportunityFactor {
    if (!signal.rating && !signal.reviewCount) {
      return this.factor({
        name: 'review_proxy',
        label: 'Review proxy',
        rawValue: null,
        normalizedScore: 45,
        weight: 0.12,
        direction: 'neutral',
        explanation: 'Rating and review count are missing; demand cannot be verified.',
      });
    }

    const ratingScore = signal.rating ? (signal.rating / 5) * 70 : 35;
    const reviewScore = signal.reviewCount
      ? this.clamp(Math.log10(signal.reviewCount + 1) * 15, 0, 30)
      : 0;
    const normalized = this.clamp(ratingScore + reviewScore, 0, 100);

    return this.factor({
      name: 'review_proxy',
      label: 'Review proxy',
      rawValue: signal.reviewCount ?? signal.rating ?? null,
      normalizedScore: normalized,
      weight: 0.12,
      direction: normalized >= 65 ? 'positive' : 'neutral',
      explanation:
        'Rating/review count is used only as a proxy signal, not verified demand.',
    });
  }

  private availabilityFactor(signal: OpportunityPriceSignal): OpportunityFactor {
    const availability = signal.availability?.toLowerCase();
    const normalized =
      availability?.includes('out')
        ? 20
        : availability?.includes('stock') || availability?.includes('available')
          ? 80
          : 55;

    return this.factor({
      name: 'availability',
      label: 'Availability',
      rawValue: signal.availability ?? null,
      normalizedScore: normalized,
      weight: 0.1,
      direction: normalized >= 70 ? 'positive' : normalized < 40 ? 'negative' : 'neutral',
      explanation: signal.availability
        ? `Latest availability signal is ${signal.availability}.`
        : 'Availability signal is missing.',
    });
  }

  private monitoringFactor(product: Product): OpportunityFactor {
    return this.factor({
      name: 'monitoring_status',
      label: 'Monitoring status',
      rawValue: product.isMonitoring,
      normalizedScore: product.isMonitoring ? 75 : 45,
      weight: 0.1,
      direction: product.isMonitoring ? 'positive' : 'neutral',
      explanation: product.isMonitoring
        ? 'Product is actively monitored.'
        : 'Product is not actively monitored yet.',
    });
  }

  private factor(input: FactorInput): OpportunityFactor {
    const normalizedScore = this.round(this.clamp(input.normalizedScore, 0, 100));
    const contribution = this.round(normalizedScore * input.weight);
    return {
      name: input.name,
      label: input.label,
      rawValue: input.rawValue,
      normalizedScore,
      weight: input.weight,
      contribution,
      direction: input.direction ?? 'neutral',
      explanation: input.explanation,
    };
  }

  private calculateConfidence(
    signal: OpportunityPriceSignal,
    latestAttempt?: ScrapeAttempt,
    businessSignals?: OpportunityBusinessSummary,
    marketSignals?: OpportunityMarketSignalSummary
  ): number {
    const businessConfidence =
      businessSignals?.completeness === 'complete'
        ? 0.9
        : businessSignals?.completeness === 'partial'
          ? 0.45
          : 0.2;
    const marketConfidence =
      marketSignals?.status === 'fresh'
        ? marketSignals.confidence ?? 0.65
        : marketSignals?.status === 'stale'
          ? 0.35
          : 0.25;
    const signalScores = [
      signal.confidence,
      latestAttempt ? (latestAttempt.status === 'success' ? 1 : 0.35) : 0,
      signal.rating || signal.reviewCount ? 0.7 : 0.25,
      signal.availability ? 0.7 : 0.35,
      businessConfidence,
      marketConfidence,
    ];
    return this.round(
      signalScores.reduce((sum, value) => sum + value, 0) / signalScores.length,
      2
    );
  }

  private recommend(
    score: number,
    confidence: number,
    missingSignals: string[],
    metrics?: BusinessMetrics | null
  ): OpportunityRecommendation {
    if (
      confidence < 0.45 ||
      missingSignals.includes('price_history') ||
      missingSignals.includes('acquisition_history')
    ) {
      return 'check_data';
    }
    if (
      metrics?.completeness === 'complete' &&
      ((metrics.netMargin ?? 0) < 0 || (metrics.roi ?? 0) < 0)
    ) {
      return 'ignore';
    }
    if (
      metrics?.completeness === 'complete' &&
      (metrics.netMargin ?? 0) > 0.18 &&
      (metrics.roi ?? 0) > 0.35 &&
      confidence >= 0.65
    ) {
      return 'investigate';
    }
    if (score >= 72) return 'investigate';
    if (score >= 52) return 'watch';
    return 'ignore';
  }

  private applyRecommendationGate({
    originalRecommendation,
    confidence,
    missingSignals,
    businessSignals,
    marketSignals,
  }: {
    originalRecommendation: OpportunityRecommendation;
    confidence: number;
    missingSignals: string[];
    businessSignals: OpportunityBusinessSummary;
    marketSignals: OpportunityMarketSignalSummary;
  }): OpportunityRecommendationGate {
    const blockedReasons: string[] = [];
    const blockedSignals: string[] = [];
    const blockedActions: string[] = [];

    const addBlocked = (signal: string, reason: string, action: string) => {
      blockedSignals.push(signal);
      blockedReasons.push(reason);
      blockedActions.push(action);
    };

    if (missingSignals.includes('price_history')) {
      addBlocked(
        'price_history',
        'Price history is missing, so the opportunity cannot be treated as ready to investigate.',
        'Record at least one manual price reading.'
      );
    }

    if (missingSignals.includes('acquisition_history')) {
      addBlocked(
        'acquisition_history',
        'Acquisition history is missing, so the latest data path has not been verified.',
        'Run a manual check or record a manual reading before acting on the score.'
      );
    }

    if (confidence < 0.45) {
      addBlocked(
        'low_confidence',
        'Overall confidence is too low for a recommendation stronger than check_data.',
        'Fill the missing signals shown on this opportunity.'
      );
    }

    if (
      originalRecommendation === 'investigate' &&
      businessSignals.completeness !== 'complete'
    ) {
      addBlocked(
        'profit_margin',
        'business assumptions are incomplete, so margin and ROI are not reliable enough for investigate.',
        'Add cost, fee, shipping, advertising, and target sell price assumptions.'
      );
      for (const signal of businessSignals.missingSignals) {
        blockedSignals.push(`business_${signal}`);
      }
    }

    if (blockedSignals.length > 0) {
      return this.createRecommendationGate(
        'blocked',
        originalRecommendation,
        'check_data',
        blockedReasons,
        blockedSignals,
        blockedActions
      );
    }

    const cautionReasons: string[] = [];
    const cautionSignals: string[] = [];
    const cautionActions: string[] = [];

    const addCaution = (signal: string, reason: string, action: string) => {
      cautionSignals.push(signal);
      cautionReasons.push(reason);
      cautionActions.push(action);
    };

    if (originalRecommendation === 'investigate') {
      if (
        marketSignals.status === 'stale' ||
        missingSignals.includes('market_signal_freshness')
      ) {
        addCaution(
          'market_signal_freshness',
          'Market trend evidence is stale, so investigate is downgraded until trends are refreshed.',
          'Refresh market trend evidence before treating this as a high-confidence candidate.'
        );
      }

      if (missingSignals.includes('review_proxy')) {
        addCaution(
          'review_proxy',
          'Rating or review proxy signals are missing, reducing confidence in demand evidence.',
          'Record rating and review count from the product page.'
        );
      }

      if (confidence < 0.65) {
        addCaution(
          'moderate_confidence',
          'Overall confidence is below the investigation threshold.',
          'Fill missing signals until confidence reaches the investigation threshold.'
        );
      }
    }

    if (cautionSignals.length > 0) {
      return this.createRecommendationGate(
        'caution',
        originalRecommendation,
        'watch',
        cautionReasons,
        cautionSignals,
        cautionActions
      );
    }

    return this.createRecommendationGate(
      'clear',
      originalRecommendation,
      originalRecommendation,
      [],
      [],
      []
    );
  }

  private createRecommendationGate(
    status: OpportunityRecommendationGate['status'],
    originalRecommendation: OpportunityRecommendation,
    finalRecommendation: OpportunityRecommendation,
    reasons: string[],
    signals: string[],
    nextActions: string[]
  ): OpportunityRecommendationGate {
    return {
      status,
      applied: originalRecommendation !== finalRecommendation,
      originalRecommendation,
      finalRecommendation,
      reasons: this.unique(reasons),
      signals: this.unique(signals),
      nextActions: this.unique(nextActions),
    };
  }

  private createKeyReasons(
    factors: OpportunityFactor[],
    missingSignals: string[]
  ): string[] {
    const strongest = [...factors]
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3)
      .map((factor) => factor.explanation);

    if (missingSignals.length > 0) {
      strongest.push(
        `Missing signals: ${missingSignals.slice(0, 4).join(', ')}.`
      );
    }

    return strongest;
  }

  private async getLatestAttempts(
    productIds: string[]
  ): Promise<Map<string, ScrapeAttempt>> {
    const latest = new Map<string, ScrapeAttempt>();
    if (productIds.length === 0) return latest;

    const attempts = await db
      .select()
      .from(scrapeAttempts)
      .where(inArray(scrapeAttempts.productId, productIds))
      .orderBy(desc(scrapeAttempts.timestamp));

    for (const attempt of attempts as ScrapeAttempt[]) {
      if (!latest.has(attempt.productId)) {
        latest.set(attempt.productId, attempt);
      }
    }

    return latest;
  }

  private async getBusinessSignals(
    productIds: string[]
  ): Promise<Map<string, ProductBusinessSignal>> {
    const signals = new Map<string, ProductBusinessSignal>();
    if (productIds.length === 0) return signals;

    const records = await db
      .select()
      .from(productBusinessSignals)
      .where(inArray(productBusinessSignals.productId, productIds));

    for (const record of records as ProductBusinessSignal[]) {
      signals.set(record.productId, record);
    }

    return signals;
  }

  private createAcquisitionHealth(
    attempt?: ScrapeAttempt
  ): OpportunityAcquisitionHealth {
    if (!attempt) {
      return {
        provider: null,
        source: null,
        status: null,
        failureReason: null,
        confidence: null,
        durationMs: null,
        timestamp: null,
        freshnessMs: null,
      };
    }

    return {
      provider: attempt.provider,
      source: attempt.source,
      status: attempt.status,
      failureReason: attempt.failureReason ?? null,
      confidence: attempt.confidence ?? null,
      durationMs: attempt.durationMs,
      timestamp: attempt.timestamp,
      freshnessMs: Date.now() - attempt.timestamp,
    };
  }

  private sortOpportunities(
    opportunities: ProductOpportunity[],
    sortBy: 'score' | 'confidence',
    sortOrder: 'asc' | 'desc'
  ) {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    opportunities.sort((a, b) => {
      const primary = (a[sortBy] - b[sortBy]) * multiplier;
      if (primary !== 0) return primary;
      return (a.score - b.score) * -1;
    });
  }

  private emptyPriceSignal(productId: string): OpportunityPriceSignal {
    return {
      productId,
      dataPoints: 0,
      confidence: 0,
      missingSignals: ['price_history'],
    };
  }

  private marketSignalFreshness(snapshot: MarketSignalSnapshot): number {
    const snapshotAgeMs = Math.max(0, Date.now() - snapshot.createdAt);
    return Math.max(snapshot.freshnessMs ?? 0, snapshotAgeMs);
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private round(value: number, digits = 1): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }
}
