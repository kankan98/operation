import axios from 'axios';
import type {
  Product,
  CreateProduct,
  UpdateProduct,
  Alert,
  AlertRule,
  CreateAlertRule,
  UpdateAlertRule,
  PriceSnapshot,
  PriceStats,
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
  checkNow: (id: string) => api.post(`/products/${id}/check`),
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

export default api;
