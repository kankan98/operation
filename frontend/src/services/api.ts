import axios from 'axios';
import type {
  Platform,
  Product,
  CreateProduct,
  UpdateProduct,
  Alert,
  AlertRule,
  CreateAlertRule,
  UpdateAlertRule,
  PriceSnapshot,
  PriceStats,
  OpportunityListQuery,
  OpportunityListResponse,
  ProductOpportunityResponse,
  ProductBusinessSignalResponse,
  ProductBusinessSignalUpsert,
  ScrapeResult,
  ScrapeAttempt,
  ScrapeJob,
  ProviderHealthResponse,
  AcquisitionQueueBackend,
  AcquisitionQueueHealth,
  AcquisitionWorkerHealth,
  AcquisitionWorkerStatus,
  AcquisitionProductJobDiagnostics,
  AcquisitionJobCancelRequest,
  AcquisitionJobControlResponse,
  AcquisitionJobRetryRequest,
  AcquisitionProviderQueueStatus,
  MarketSignalSnapshot,
  MarketSignalRefreshResult,
  MarketSignalProviderHealth,
  OpportunityResearchEntry,
  OpportunityResearchMetadata,
  OpportunityResearchUpsert,
  OpportunityResearchUpdate,
  OpportunityResearchListQuery,
  OpportunityResearchComparisonRequest,
  OpportunityResearchComparisonResponse,
  OpportunityResearchExportRequest,
  OpportunityResearchExportResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productsApi = {
  list: () => api.get<{ data: Product[] }>('/products').then(res => res.data.data),
  get: (id: string) => api.get<{ data: Product }>(`/products/${id}`).then(res => res.data.data),
  create: (data: CreateProduct) => api.post<{ data: Product }>('/products', data).then(res => res.data.data),
  update: (id: string, data: UpdateProduct) => api.patch<{ data: Product }>(`/products/${id}`, data).then(res => res.data.data),
  delete: (id: string) => api.delete(`/products/${id}`),
  businessSignals: (id: string) =>
    api
      .get<ProductBusinessSignalResponse>(`/products/${id}/business-signals`)
      .then(res => res.data.data),
  upsertBusinessSignals: (id: string, data: ProductBusinessSignalUpsert) =>
    api
      .put<ProductBusinessSignalResponse>(`/products/${id}/business-signals`, data)
      .then(res => res.data.data),
};

// Product data acquisition API
export const scraperApi = {
  checkProduct: (productId: string) =>
    api.post<ScrapeResult>(`/scraper/product/${productId}`).then(res => res.data),
  queueHealth: (
    params: { platform?: Platform; provider?: string } = {},
  ) =>
    api
      .get<AcquisitionQueueHealth>('/scraper/queue/health', { params })
      .then(res => res.data),
  workerHealth: (
    params: { backend?: AcquisitionQueueBackend; status?: AcquisitionWorkerStatus } = {},
  ) =>
    api
      .get<AcquisitionWorkerHealth>('/scraper/queue/workers', { params })
      .then(res => res.data),
  providerQueueStatus: (
    params: { platform?: Platform; provider?: string } = {},
  ) =>
    api
      .get<AcquisitionProviderQueueStatus>('/scraper/queue/providers/status', {
        params,
      })
      .then(res => res.data),
  productJobDiagnostics: (productId: string) =>
    api
      .get<AcquisitionProductJobDiagnostics>(
        `/scraper/product/${productId}/job-diagnostics`,
      )
      .then(res => res.data),
  attempts: (productId: string, limit?: number) => {
    const params = limit ? { limit } : {};
    return api
      .get<{ data: ScrapeAttempt[] }>(`/scraper/product/${productId}/attempts`, { params })
      .then(res => res.data.data);
  },
  job: (jobId: string) => api.get<ScrapeJob>(`/scraper/jobs/${jobId}`).then(res => res.data),
  retryJob: (
    jobId: string,
    data: Omit<AcquisitionJobRetryRequest, 'jobId'> = {},
  ) =>
    api
      .post<AcquisitionJobControlResponse>(`/scraper/jobs/${jobId}/retry`, data)
      .then(res => res.data),
  cancelJob: (
    jobId: string,
    data: Omit<AcquisitionJobCancelRequest, 'jobId'>,
  ) =>
    api
      .post<AcquisitionJobControlResponse>(`/scraper/jobs/${jobId}/cancel`, data)
      .then(res => res.data),
  amazonHealth: (params: { productId?: string; windowHours?: number; provider?: string } = {}) =>
    api
      .get<ProviderHealthResponse>('/scraper/providers/amazon/health', { params })
      .then(res => res.data),
  providerHealth: (
    platform: Platform,
    params: { productId?: string; windowHours?: number; provider?: string } = {},
  ) =>
    api
      .get<ProviderHealthResponse>(`/scraper/providers/${platform}/health`, { params })
      .then(res => res.data),
};

export interface MarketSignalLatestResponse {
  data: MarketSignalSnapshot | null;
  status: 'fresh' | 'missing';
  missingSignals: string[];
  caveat: string;
}

export const marketSignalsApi = {
  refresh: (productId: string) =>
    api
      .post<MarketSignalRefreshResult>(`/products/${productId}/market-signals/refresh`)
      .then(res => res.data),
  latest: (productId: string) =>
    api
      .get<MarketSignalLatestResponse>(`/products/${productId}/market-signals/latest`)
      .then(res => res.data),
  history: (productId: string, limit = 20) =>
    api
      .get<{ data: MarketSignalSnapshot[] }>(`/products/${productId}/market-signals/history`, {
        params: { limit },
      })
      .then(res => res.data.data),
  keepaHealth: (params: { productId?: string; windowHours?: number } = {}) =>
    api
      .get<MarketSignalProviderHealth>('/market-signals/providers/keepa/health', {
        params,
      })
      .then(res => res.data),
};

// Snapshots API
export const snapshotsApi = {
  list: (productId: string, limit?: number) => {
    const params = limit ? { limit } : {};
    return api.get<{ data: PriceSnapshot[] }>(`/snapshots`, { params: { productId, ...params } })
      .then(res => res.data.data);
  },
};

// Alerts API
export const alertsApi = {
  list: () => api.get<{ data: Alert[] }>('/alerts').then(res => res.data.data),
  get: (id: string) => api.get<{ data: Alert }>(`/alerts/${id}`).then(res => res.data.data),
  update: (id: string, data: Partial<Alert>) => api.patch<{ data: Alert }>(`/alerts/${id}`, data).then(res => res.data.data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
};

// Alert Rules API
export const alertRulesApi = {
  list: (productId?: string) => {
    const params = productId ? { productId } : {};
    return api.get<{ data: AlertRule[] }>('/alert-rules', { params }).then(res => res.data.data);
  },
  get: (id: string) => api.get<{ data: AlertRule }>(`/alert-rules/${id}`).then(res => res.data.data),
  create: (data: CreateAlertRule) => api.post<{ data: AlertRule }>('/alert-rules', data).then(res => res.data.data),
  update: (id: string, data: UpdateAlertRule) => api.patch<{ data: AlertRule }>(`/alert-rules/${id}`, data).then(res => res.data.data),
  delete: (id: string) => api.delete(`/alert-rules/${id}`),
};

// Analysis API
export const analysisApi = {
  priceStats: (productId: string) => api.get<{ data: PriceStats }>(`/analysis/price-stats/${productId}`).then(res => res.data.data),
};

// Opportunity scoring API
export type OpportunityFilters = Partial<OpportunityListQuery>;

export const opportunitiesApi = {
  list: (filters: OpportunityFilters = {}) =>
    api
      .get<OpportunityListResponse>('/opportunities/products', {
        params: filters,
      })
      .then(res => res.data),
  explain: (productId: string) =>
    api
      .get<ProductOpportunityResponse>(`/opportunities/products/${productId}`)
      .then(res => res.data.data),
  research: (productId: string) =>
    api
      .get<{ data: OpportunityResearchMetadata | null }>(
        `/opportunities/products/${productId}/research`,
      )
      .then(res => res.data.data),
  listResearch: (filters: Partial<OpportunityResearchListQuery> = {}) =>
    api
      .get<{
        data: OpportunityResearchMetadata[];
        total: number;
        pagination: { page: number; limit: number; totalPages: number };
      }>('/opportunities/research', { params: filters })
      .then(res => res.data),
  upsertResearch: (productId: string, data: OpportunityResearchUpsert) =>
    api
      .put<{ data: OpportunityResearchEntry }>(
        `/opportunities/products/${productId}/research`,
        data,
      )
      .then(res => res.data.data),
  updateResearch: (productId: string, data: OpportunityResearchUpdate) =>
    api
      .patch<{ data: OpportunityResearchEntry }>(
        `/opportunities/products/${productId}/research`,
        data,
      )
      .then(res => res.data.data),
  archiveResearch: (productId: string) =>
    api
      .post<{ data: OpportunityResearchEntry }>(
        `/opportunities/products/${productId}/research/archive`,
      )
      .then(res => res.data.data),
  deleteResearch: (productId: string) =>
    api.delete(`/opportunities/products/${productId}/research`),
  compareResearch: (data: OpportunityResearchComparisonRequest) =>
    api
      .post<OpportunityResearchComparisonResponse>(
        '/opportunities/research/compare',
        data,
      )
      .then(res => res.data),
  exportResearch: (data: OpportunityResearchExportRequest) =>
    api
      .post<OpportunityResearchExportResponse>(
        '/opportunities/research/export',
        data,
      )
      .then(res => res.data),
};

export default api;
