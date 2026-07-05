// Platform types
export type Platform = 'amazon' | 'walmart' | 'aliexpress' | 'ebay' | 'lazada' | 'other';

// Monitor types
export type MonitorType = 'own' | 'competitor';

// Product availability
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock';

// Alert types
export type AlertType =
  | 'price_drop'
  | 'price_surge'
  | 'out_of_stock'
  | 'rank_improvement'
  | 'rank_decline';

// Alert severity
export type Severity = 'info' | 'warning' | 'critical';

// Task types
export type TaskType =
  | 'product_check'
  | 'batch_check'
  | 'report_generation'
  | 'data_cleanup';

// Product data acquisition types
export type AcquisitionProvider =
  | 'amazon-browser'
  | 'amazon-pa-api'
  | 'amazon-sp-api'
  | 'ebay-browse'
  | 'keepa'
  | 'rainforest'
  | 'serpapi'
  | 'cache'
  | 'mock';

export type AcquisitionSource =
  | 'api'
  | 'third_party'
  | 'official_api'
  | 'browser'
  | 'cache'
  | 'mock';

export type AcquisitionFailureReason =
  | 'network_timeout'
  | 'blocked'
  | 'captcha'
  | 'geo_restricted'
  | 'not_found'
  | 'price_missing'
  | 'selector_drift'
  | 'provider_unavailable'
  | 'unsupported_platform'
  | 'unsupported_product'
  | 'unsupported_url'
  | 'unknown';

export type AcquisitionRootCause =
  | 'missing_api_key'
  | 'missing_credentials'
  | 'invalid_key'
  | 'auth_failed'
  | 'quota_exhausted'
  | 'rate_limited'
  | 'marketplace_mismatch'
  | 'captcha_or_blocked'
  | 'selector_drift'
  | 'cache_only'
  | 'insufficient_history'
  | 'network_timeout'
  | 'not_found'
  | 'price_missing'
  | 'unsupported_platform'
  | 'unsupported_product'
  | 'unsupported_url'
  | 'unknown'
  | 'insufficient_diagnostics';

export type AcquisitionFallbackType =
  | 'primary_live'
  | 'browser_fallback'
  | 'cache_fallback'
  | 'all_failed';

export type ScrapeJobStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retry_scheduled'
  | 'cancelled';

export type ScrapeAttemptStatus = 'success' | 'failed';

// Product interface
export interface Product {
  id: string;
  platform: Platform;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  monitorType?: MonitorType;
  checkInterval: number;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
  lastCheckedAt?: number;
  metadata?: string;
}

// Price snapshot interface
export type PriceSnapshotSource =
  | 'manual'
  | 'browser'
  | 'cache'
  | 'keepa'
  | 'rainforest'
  | 'ebay-browse'
  | 'unknown';

export interface PriceSnapshot {
  id: string;
  productId: string;
  price: number;
  currency: string;
  availability: string;
  source: PriceSnapshotSource;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  timestamp: number;
  metadata?: string;
}

// Create price snapshot data
export interface CreatePriceSnapshotData {
  productId: string;
  price: number;
  currency: string;
  availability: string;
  source?: PriceSnapshotSource;
  recordedAt?: number;
  rating?: number;
  reviewCount?: number;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
  metadata?: string;
}

// Alert interface
export interface Alert {
  id: string;
  ruleId?: string;
  productId: string;
  alertType: AlertType;
  severity: Severity;
  title: string;
  message?: string;
  dataSnapshot?: string;
  isRead: boolean;
  isArchived: boolean;
  notifiedAt?: number;
  createdAt: number;
}

// Alert rule interface
export interface AlertRule {
  id: string;
  productId: string;
  ruleType: 'price_threshold' | 'price_change_percent' | 'stock_change';
  condition: 'below' | 'above' | 'increase' | 'decrease';
  threshold: number;
  enabled: boolean;
  severity: Severity;
  createdAt: number;
  updatedAt?: number;
}

// Price statistics interface
export interface PriceStats {
  productId: string;
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataPoints: number;
  firstRecordedAt: number;
  lastRecordedAt: number;
  // 当前价的来源溯源（来源/新鲜度/可信度/中文说明），绝不让过时数据伪装成已验证事实
  provenance: {
    source: PriceSnapshotSource;
    ageMs: number;
    stale: boolean;
    trust: 'high' | 'medium' | 'low' | 'unknown';
    label: string;
  };
}

export type OpportunityRecommendation =
  | 'watch'
  | 'investigate'
  | 'check_data'
  | 'ignore';
export type OpportunityRecommendationGateStatus =
  | 'clear'
  | 'caution'
  | 'blocked';

export type OpportunityFactorDirection = 'positive' | 'negative' | 'neutral';

export interface OpportunityFactor {
  name: string;
  label: string;
  rawValue: number | string | boolean | null;
  normalizedScore: number;
  weight: number;
  contribution: number;
  direction: OpportunityFactorDirection;
  explanation: string;
}

export interface OpportunityAcquisitionHealth {
  provider: string | null;
  source: string | null;
  status: string | null;
  failureReason: string | null;
  confidence: number | null;
  durationMs: number | null;
  timestamp: number | null;
  freshnessMs: number | null;
}

export type BusinessMetricPriceSource = 'target' | 'current_price' | 'missing';
export type BusinessSignalCompleteness = 'none' | 'partial' | 'complete';
export type BusinessReadiness = 'any' | 'none' | 'partial' | 'complete';

export interface ProductBusinessSignal {
  productId: string;
  currency: string;
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
  createdAt: number;
  updatedAt: number;
}

export type ProductBusinessSignalUpsert = Omit<
  ProductBusinessSignal,
  'productId' | 'createdAt' | 'updatedAt'
>;

export interface BusinessMetricInputs {
  sellPrice: number | null;
  costBasis: number | null;
  inboundShipping: number | null;
  outboundShipping: number | null;
  fulfillmentFee: number | null;
  platformFee: number | null;
  referralFeeRate: number | null;
  referralFee: number | null;
  advertisingCost: number | null;
  taxCustomsBuffer: number | null;
}

export interface BusinessMetrics {
  currency: string;
  priceSource: BusinessMetricPriceSource;
  completeness: BusinessSignalCompleteness;
  missingSignals: string[];
  totalVariableCost: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  roi: number | null;
  breakevenSellPrice: number | null;
  contributionProfitPerUnit: number | null;
  targetUnits: number | null;
  projectedContributionProfit: number | null;
  inputs: BusinessMetricInputs;
  caveat: string;
}

export interface OpportunityBusinessSummary {
  completeness: BusinessSignalCompleteness;
  missingSignals: string[];
  metrics: BusinessMetrics | null;
  caveat: string;
}

export type OpportunityResearchStatus =
  | 'researching'
  | 'watching'
  | 'ready'
  | 'rejected';

export type OpportunityResearchPriority = 'low' | 'medium' | 'high';

export type OpportunityResearchExportFormat = 'csv' | 'json';

export type OpportunityResearchDecisionStatus = 'go' | 'hold' | 'no_go';

export interface OpportunityResearchDecisionSnapshot {
  capturedAt: number;
  score: number;
  confidence: number;
  recommendation: OpportunityRecommendation;
  recommendationGate: OpportunityRecommendationGate;
  keyReasons: string[];
  missingSignals: string[];
  businessSignals: OpportunityBusinessSummary;
  marketSignals: OpportunityMarketSignalSummary | null;
}

export interface OpportunityResearchDecision {
  status: OpportunityResearchDecisionStatus;
  reason: string;
  nextAction: string | null;
  decidedAt: number;
  updatedAt: number;
  snapshot: OpportunityResearchDecisionSnapshot;
}

export interface OpportunityResearchActionOutcome {
  actionId: OpportunityResearchDailyActionId;
  outcome: string;
  completedAt: number;
  updatedAt: number;
}

export interface OpportunityResearchDecisionRequest {
  status: OpportunityResearchDecisionStatus;
  reason: string;
  nextAction: string | null;
}

export interface OpportunityResearchActionOutcomeRequest {
  actionId: OpportunityResearchDailyActionId;
  outcome: string;
  completedAt?: number;
}

export type OpportunityResearchDecisionReviewFilter =
  | 'all'
  | 'decided'
  | 'undecided'
  | 'needs_action'
  | 'stale';

export interface OpportunityResearchDecisionReview {
  hasDecision: boolean;
  status: OpportunityResearchDecisionStatus | null;
  decidedAt: number | null;
  daysSinceDecision: number | null;
  hasNextAction: boolean;
  needsNextAction: boolean;
  stale: boolean;
}

export interface OpportunityResearchEntry {
  productId: string;
  status: OpportunityResearchStatus;
  priority: OpportunityResearchPriority;
  tags: string[];
  notes: string | null;
  archived: boolean;
  decision: OpportunityResearchDecision | null;
  lastActionOutcome: OpportunityResearchActionOutcome | null;
  createdAt: number;
  updatedAt: number;
}

export interface OpportunityResearchMetadata extends OpportunityResearchEntry {
  notesSummary: string | null;
  decisionReview: OpportunityResearchDecisionReview;
}

export interface OpportunityResearchReviewSummary {
  totalActive: number;
  decided: number;
  undecided: number;
  needsNextAction: number;
  stale: number;
  byStatus: Record<OpportunityResearchStatus, number>;
  byPriority: Record<OpportunityResearchPriority, number>;
  generatedAt: number;
  caveat: string;
}

export type OpportunityResearchDailyActionId =
  | 'add_next_action'
  | 'review_stale_decisions'
  | 'decide_candidates'
  | 'continue_research';

export type OpportunityResearchActionOutcomeFilter = 'with' | 'without';

export interface OpportunityResearchDailyActionFilter {
  workspaceMode: 'discover' | 'review';
  shortlisted?: boolean;
  decisionReview?: OpportunityResearchDecisionReviewFilter;
  decisionStatus?: OpportunityResearchDecisionStatus;
  researchStatus?: OpportunityResearchStatus;
}

export interface OpportunityResearchDailyActionItem {
  id: OpportunityResearchDailyActionId;
  label: string;
  reason: string;
  learningGoal: string;
  steps: string[];
  completionCriteria: string[];
  priority: number;
  count: number;
  filters: OpportunityResearchDailyActionFilter;
}

export interface OpportunityResearchDailyActionPlan {
  items: OpportunityResearchDailyActionItem[];
  generatedAt: number;
  caveat: string;
}

export interface OpportunityResearchPracticeSummary {
  totalActive: number;
  withOutcome: number;
  withoutOutcome: number;
  byActionId: Record<OpportunityResearchDailyActionId, number>;
  latestCompletedAt: number | null;
  generatedAt: number;
  caveat: string;
}

export interface OpportunityResearchUpsert {
  status?: OpportunityResearchStatus;
  priority?: OpportunityResearchPriority;
  tags?: string[];
  notes?: string | null;
  archived?: boolean;
}

export interface OpportunityResearchUpdate {
  status?: OpportunityResearchStatus;
  priority?: OpportunityResearchPriority;
  tags?: string[];
  notes?: string | null;
  archived?: boolean;
}

export interface OpportunityResearchListFilters {
  status?: OpportunityResearchStatus;
  priority?: OpportunityResearchPriority;
  tag?: string;
  archived?: boolean;
  decisionStatus?: OpportunityResearchDecisionStatus;
  decisionReview?: OpportunityResearchDecisionReviewFilter;
  actionOutcome?: OpportunityResearchActionOutcomeFilter;
  actionId?: OpportunityResearchDailyActionId;
  page?: number;
  limit?: number;
}

export interface OpportunityResearchComparisonRequest {
  productIds: string[];
}

export interface OpportunityResearchExportFilters {
  platform?: Platform;
  category?: string;
  minScore?: number;
  minRoi?: number;
  businessReadiness?: BusinessReadiness;
  recommendation?: OpportunityRecommendation;
  shortlisted?: boolean;
  researchStatus?: OpportunityResearchStatus;
  researchTag?: string;
  decisionStatus?: OpportunityResearchDecisionStatus;
  decisionReview?: OpportunityResearchDecisionReviewFilter;
  actionOutcome?: OpportunityResearchActionOutcomeFilter;
  actionId?: OpportunityResearchDailyActionId;
}

export interface OpportunityResearchExportRequest {
  format: OpportunityResearchExportFormat;
  productIds?: string[];
  filters?: OpportunityResearchExportFilters;
  limit: number;
}

export interface OpportunityResearchExportRow {
  productId: string;
  title: string;
  platform: Platform;
  category: string | null;
  currentPrice: number | null;
  currency: string;
  score: number;
  confidence: number;
  recommendation: OpportunityRecommendation;
  researchStatus: OpportunityResearchStatus | null;
  researchPriority: OpportunityResearchPriority | null;
  researchTags: string[];
  researchNotesSummary: string | null;
  decisionStatus: OpportunityResearchDecisionStatus | null;
  decisionReason: string | null;
  decisionNextAction: string | null;
  decidedAt: number | null;
  decisionSnapshotScore: number | null;
  decisionSnapshotRecommendation: OpportunityRecommendation | null;
  lastActionId: OpportunityResearchDailyActionId | null;
  lastActionOutcome: string | null;
  lastActionCompletedAt: number | null;
  topReasons: string[];
  missingSignals: string[];
  marketSignalCaveat: string;
  businessSignalCaveat: string;
  scoreCaveat: string;
}

export interface OpportunityResearchExportResponse {
  format: OpportunityResearchExportFormat;
  filename: string;
  rows: OpportunityResearchExportRow[];
  csv?: string;
  caveat: string;
}

export interface OpportunityPriceSignal {
  productId: string;
  currentPrice?: number;
  averagePrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
  priceChangePercent?: number;
  volatility?: number;
  dataPoints: number;
  firstRecordedAt?: number;
  lastRecordedAt?: number;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  confidence: number;
  missingSignals: string[];
}

export interface MarketSignalTrendSummary {
  current?: number | null;
  average?: number | null;
  lowest?: number | null;
  highest?: number | null;
  changePercent?: number | null;
  volatility?: number | null;
  direction?: 'up' | 'down' | 'stable' | 'unknown';
  dataPoints: number;
  firstObservedAt?: number | null;
  lastObservedAt?: number | null;
}

export interface MarketSignalSnapshot {
  id: string;
  productId: string;
  platform: Platform;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  asin: string;
  marketplace: string;
  windowDays: number;
  confidence: number;
  freshnessMs: number | null;
  priceTrend: MarketSignalTrendSummary | null;
  salesRankTrend: MarketSignalTrendSummary | null;
  reviewVelocity: number | null;
  ratingMovement: number | null;
  missingSignals: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: number;
}

export interface CreateMarketSignalSnapshotData {
  productId: string;
  platform: Platform;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  asin: string;
  marketplace: string;
  windowDays: number;
  confidence: number;
  freshnessMs?: number | null;
  priceTrend?: MarketSignalTrendSummary | null;
  salesRankTrend?: MarketSignalTrendSummary | null;
  reviewVelocity?: number | null;
  ratingMovement?: number | null;
  missingSignals?: string[];
  metadata?: Record<string, unknown> | null;
}

export interface MarketSignalRefreshResult {
  success: boolean;
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  timestamp: number;
  durationMs: number;
  confidence?: number;
  snapshotId?: string;
  failureReason?: AcquisitionFailureReason;
  rootCause?: AcquisitionRootCause;
  diagnostics?: AcquisitionDiagnostics;
  error?: string;
}

export type MarketSignalAttemptStatus = 'success' | 'failed';

export interface MarketSignalAttempt {
  id: string;
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  platform: Platform;
  status: MarketSignalAttemptStatus;
  failureReason?: AcquisitionFailureReason | null;
  rootCause?: AcquisitionRootCause | null;
  errorMessage?: string | null;
  durationMs: number;
  confidence?: number | null;
  httpStatus?: number | null;
  diagnostics?: string | null;
  snapshotId?: string | null;
  timestamp: number;
}

export interface CreateMarketSignalAttemptData {
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  platform: Platform;
  status: MarketSignalAttemptStatus;
  failureReason?: AcquisitionFailureReason;
  rootCause?: AcquisitionRootCause;
  errorMessage?: string;
  durationMs: number;
  confidence?: number;
  httpStatus?: number;
  diagnostics?: string;
  snapshotId?: string;
}

export interface MarketSignalProviderHealthResult {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  platform: Platform;
  status: ProviderHealthStatus;
  window: {
    windowHours: number;
    since: number;
    until: number;
  };
  attemptCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDurationMs: number | null;
  latestSuccessTimestamp: number | null;
  latestFailureReason: AcquisitionFailureReason | null;
  failureReasons: Partial<Record<AcquisitionFailureReason, number>>;
  rootCauses: Partial<Record<AcquisitionRootCause, number>>;
  recommendations: ProviderHealthRecommendation[];
}

export interface MarketSignalOpportunityFactor {
  name: string;
  label: string;
  rawValue: number | string | boolean | null;
  normalizedScore: number;
  weight: number;
  contribution: number;
  direction: OpportunityFactorDirection;
  source: AcquisitionSource;
  freshnessMs: number | null;
  confidenceImpact: number;
  explanation: string;
}

export interface OpportunityMarketSignalSummary {
  status: 'fresh' | 'stale' | 'missing' | 'failed';
  provider: AcquisitionProvider | null;
  source: AcquisitionSource | null;
  confidence: number | null;
  freshnessMs: number | null;
  missingSignals: string[];
  caveat: string;
  factors: MarketSignalOpportunityFactor[];
}

export interface OpportunityRecommendationGate {
  status: OpportunityRecommendationGateStatus;
  applied: boolean;
  originalRecommendation: OpportunityRecommendation;
  finalRecommendation: OpportunityRecommendation;
  reasons: string[];
  signals: string[];
  nextActions: string[];
}

export interface ProductOpportunity {
  product: Product;
  score: number;
  confidence: number;
  recommendation: OpportunityRecommendation;
  recommendationGate: OpportunityRecommendationGate;
  keyReasons: string[];
  missingSignals: string[];
  factors: OpportunityFactor[];
  acquisitionHealth: OpportunityAcquisitionHealth;
  businessSignals: OpportunityBusinessSummary;
  marketSignals: OpportunityMarketSignalSummary;
  research?: OpportunityResearchMetadata;
}

export interface OpportunityListFilters {
  platform?: Platform;
  category?: string;
  monitoring?: boolean;
  minScore?: number;
  minRoi?: number;
  businessReadiness?: BusinessReadiness;
  recommendation?: OpportunityRecommendation;
  shortlisted?: boolean;
  researchStatus?: OpportunityResearchStatus;
  researchTag?: string;
  decisionStatus?: OpportunityResearchDecisionStatus;
  decisionReview?: OpportunityResearchDecisionReviewFilter;
  actionOutcome?: OpportunityResearchActionOutcomeFilter;
  actionId?: OpportunityResearchDailyActionId;
  sortBy?: 'score' | 'confidence';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OpportunityListResult {
  data: ProductOpportunity[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Scraper types
export interface ScrapedProductData {
  price: number;
  currency: string;
  availability: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  salesRank?: number;
  shippingCost?: number;
  seller?: string;
  condition?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedProductData;
  error?: string;
  failureReason?: AcquisitionFailureReason;
  diagnostics?: AcquisitionDiagnostics;
  timestamp: number;
}

export interface AcquisitionDiagnostics {
  pageTitle?: string;
  finalUrl?: string;
  detectedState?: string;
  httpStatus?: number;
  message?: string;
  providerErrorCode?: string;
  providerMessage?: string;
  rootCause?: AcquisitionRootCause;
  marketplace?: string;
  fallbackType?: AcquisitionFallbackType;
  sanitizedMessage?: string;
  failureCategory?: string;
  selectorVersion?: string;
  cacheFallback?: boolean;
  degraded?: boolean;
  degradedReason?: string;
  freshnessMs?: number;
  providerFailures?: ProviderFailureDiagnostic[];
  fallbackProviders?: AcquisitionProvider[];
  [key: string]: unknown;
}

export interface ProviderFailureDiagnostic {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  failureReason?: AcquisitionFailureReason;
  rootCause?: AcquisitionRootCause;
  error?: string;
  providerErrorCode?: string;
  marketplace?: string;
  durationMs?: number;
}

export interface ProductDataAcquisitionResult {
  success: boolean;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  timestamp: number;
  durationMs: number;
  confidence?: number;
  freshnessMs?: number;
  data?: ScrapedProductData;
  failureReason?: AcquisitionFailureReason;
  error?: string;
  diagnostics?: AcquisitionDiagnostics;
  attemptId?: string;
  jobId?: string;
}

export interface ScrapeJob {
  id: string;
  productId: string;
  status: ScrapeJobStatus;
  priority: number;
  nextRunAt: number;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptId?: string;
  lastFailureReason?: AcquisitionFailureReason;
  leaseOwner?: string;
  leaseExpiresAt?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: string;
}

export interface CreateScrapeJobData {
  productId: string;
  priority?: number;
  nextRunAt?: number;
  maxAttempts?: number;
  metadata?: string;
}

export interface ScrapeAttempt {
  id: string;
  jobId?: string;
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  status: ScrapeAttemptStatus;
  failureReason?: AcquisitionFailureReason;
  errorMessage?: string;
  durationMs: number;
  confidence?: number;
  httpStatus?: number;
  pageTitle?: string;
  finalUrl?: string;
  diagnostics?: string;
  timestamp: number;
}

export interface CreateScrapeAttemptData {
  jobId?: string;
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  status: ScrapeAttemptStatus;
  failureReason?: AcquisitionFailureReason;
  errorMessage?: string;
  durationMs: number;
  confidence?: number;
  httpStatus?: number;
  pageTitle?: string;
  finalUrl?: string;
  diagnostics?: string;
}

export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'insufficient_history';

export interface ProviderHealthSummary {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  attemptCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDurationMs: number | null;
  latestSuccessTimestamp: number | null;
  latestFailureReason: AcquisitionFailureReason | null;
  latestConfidence: number | null;
  fallbackCount: number;
  cacheCount: number;
  failureReasons: Partial<Record<AcquisitionFailureReason, number>>;
  rootCauses: Partial<Record<AcquisitionRootCause, number>>;
}

export interface ProviderHealthAttempt {
  id: string;
  productId: string;
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  status: ScrapeAttemptStatus;
  failureReason: AcquisitionFailureReason | null;
  durationMs: number;
  confidence: number | null;
  rootCause: AcquisitionRootCause | null;
  marketplace: string | null;
  httpStatus: number | null;
  fallbackType: AcquisitionFallbackType | null;
  sanitizedMessage: string | null;
  timestamp: number;
  diagnostics?: AcquisitionDiagnostics;
}

export interface ProviderHealthRecommendation {
  code:
    | 'configure_rainforest'
    | 'check_quota'
    | 'reduce_fallback_reliance'
    | 'refresh_stale_data'
    | 'investigate_browser_blocking'
    | 'configure_ebay'
    | 'check_ebay_credentials'
    | 'check_ebay_marketplace'
    | 'check_ebay_item_id'
    | 'configure_keepa'
    | 'check_keepa_credentials'
    | 'check_keepa_quota'
    | 'check_market_signal_identifier'
    | 'refresh_market_signals'
    | 'investigate_unknown_failures';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface ProviderHealthResult {
  platform: Platform;
  status: ProviderHealthStatus;
  window: {
    windowHours: number;
    since: number;
    until: number;
  };
  providerSummaries: ProviderHealthSummary[];
  chainSummary: {
    totalAttempts: number;
    liveSuccessCount: number;
    liveFailureCount: number;
    browserFallbackCount: number;
    cacheFallbackCount: number;
    primaryFailureCount: number;
    degradedPathCounts: Partial<Record<AcquisitionFallbackType, number>>;
    rootCauses: Partial<Record<AcquisitionRootCause, number>>;
  };
  latestAttempts: ProviderHealthAttempt[];
  recommendations: ProviderHealthRecommendation[];
}
