import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketSignalsApi, productsApi, scraperApi } from '@/services/api';
import type {
  AcquisitionJobCancelRequest,
  AcquisitionJobRetryRequest,
  AcquisitionQueueBackend,
  AcquisitionWorkerStatus,
  Platform,
  ProductBusinessSignalUpsert,
  UpdateProduct,
} from '@/types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useProductAcquisitionAttempts(productId: string, limit = 10) {
  return useQuery({
    queryKey: ['productAcquisitionAttempts', productId, limit],
    queryFn: () => scraperApi.attempts(productId, limit),
    enabled: !!productId,
  });
}

export function useAcquisitionQueueHealth(
  params: { platform?: Platform; provider?: string } = {},
) {
  return useQuery({
    queryKey: ['acquisitionQueueHealth', params.platform ?? null, params.provider ?? null],
    queryFn: () => scraperApi.queueHealth(params),
  });
}

export function useAcquisitionWorkerHealth(
  params: { backend?: AcquisitionQueueBackend; status?: AcquisitionWorkerStatus } = {},
) {
  return useQuery({
    queryKey: ['acquisitionWorkerHealth', params.backend ?? null, params.status ?? null],
    queryFn: () => scraperApi.workerHealth(params),
  });
}

export function useProviderQueueStatus(
  params: { platform?: Platform; provider?: string } = {},
) {
  return useQuery({
    queryKey: ['providerQueueStatus', params.platform ?? null, params.provider ?? null],
    queryFn: () => scraperApi.providerQueueStatus(params),
  });
}

export function useProductJobDiagnostics(productId?: string) {
  return useQuery({
    queryKey: ['productJobDiagnostics', productId],
    queryFn: () => scraperApi.productJobDiagnostics(productId!),
    enabled: !!productId,
  });
}

export function useAmazonProviderHealth(productId?: string, windowHours = 24) {
  return useQuery({
    queryKey: ['amazonProviderHealth', productId, windowHours],
    queryFn: () => scraperApi.amazonHealth({ productId, windowHours }),
    enabled: !!productId,
  });
}

export function useProviderHealth(
  platform?: Platform,
  productId?: string,
  windowHours = 24,
) {
  return useQuery({
    queryKey: ['providerHealth', platform, productId, windowHours],
    queryFn: () => scraperApi.providerHealth(platform!, { productId, windowHours }),
    enabled: !!platform && !!productId,
  });
}

export function useProductMarketSignalLatest(productId?: string) {
  return useQuery({
    queryKey: ['productMarketSignalLatest', productId],
    queryFn: () => marketSignalsApi.latest(productId!),
    enabled: !!productId,
  });
}

export function useProductMarketSignalHistory(productId?: string, limit = 20) {
  return useQuery({
    queryKey: ['productMarketSignalHistory', productId, limit],
    queryFn: () => marketSignalsApi.history(productId!, limit),
    enabled: !!productId,
  });
}

export function useKeepaMarketSignalHealth(productId?: string, windowHours = 24) {
  return useQuery({
    queryKey: ['keepaMarketSignalHealth', productId, windowHours],
    queryFn: () => marketSignalsApi.keepaHealth({ productId, windowHours }),
    enabled: !!productId,
  });
}

export function useRefreshProductMarketSignals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketSignalsApi.refresh,
    onSuccess: (_result, productId) => {
      void queryClient.invalidateQueries({
        queryKey: ['productMarketSignalLatest', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['productMarketSignalHistory', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['keepaMarketSignalHealth', productId],
      });
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      void queryClient.invalidateQueries({
        queryKey: ['opportunities', productId],
      });
    },
  });
}

export function useProductBusinessSignals(productId?: string) {
  return useQuery({
    queryKey: ['productBusinessSignals', productId],
    queryFn: () => productsApi.businessSignals(productId!),
    enabled: !!productId,
  });
}

export function useUpsertProductBusinessSignals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: ProductBusinessSignalUpsert;
    }) => productsApi.upsertBusinessSignals(productId, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['productBusinessSignals', variables.productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['opportunities'],
      });
    },
  });
}

export function useScrapeJob(jobId?: string) {
  return useQuery({
    queryKey: ['scrapeJob', jobId],
    queryFn: () => scraperApi.job(jobId!),
    enabled: !!jobId,
  });
}

function invalidateAcquisitionOperations(
  queryClient: ReturnType<typeof useQueryClient>,
  productId?: string,
  jobId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['acquisitionQueueHealth'] });
  void queryClient.invalidateQueries({ queryKey: ['acquisitionWorkerHealth'] });
  void queryClient.invalidateQueries({ queryKey: ['providerQueueStatus'] });
  void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  void queryClient.invalidateQueries({ queryKey: ['providerHealth'] });

  if (productId) {
    void queryClient.invalidateQueries({
      queryKey: ['productJobDiagnostics', productId],
    });
    void queryClient.invalidateQueries({
      queryKey: ['productAcquisitionAttempts', productId],
    });
    void queryClient.invalidateQueries({ queryKey: ['products', productId] });
  }

  if (jobId) {
    void queryClient.invalidateQueries({ queryKey: ['scrapeJob', jobId] });
  }
}

export function useRetryAcquisitionJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      data = {},
    }: {
      jobId: string;
      productId?: string;
      data?: Omit<AcquisitionJobRetryRequest, 'jobId'>;
    }) => scraperApi.retryJob(jobId, data),
    onSuccess: (_result, variables) => {
      invalidateAcquisitionOperations(
        queryClient,
        variables.productId,
        variables.jobId,
      );
    },
  });
}

export function useCancelAcquisitionJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      productId?: string;
      data: Omit<AcquisitionJobCancelRequest, 'jobId'>;
    }) => scraperApi.cancelJob(jobId, data),
    onSuccess: (_result, variables) => {
      invalidateAcquisitionOperations(
        queryClient,
        variables.productId,
        variables.jobId,
      );
    },
  });
}

export function useCheckProductNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scraperApi.checkProduct,
    onSuccess: (_result, productId) => {
      void queryClient.invalidateQueries({ queryKey: ['products', productId] });
      void queryClient.invalidateQueries({ queryKey: ['priceStats', productId] });
      void queryClient.invalidateQueries({ queryKey: ['snapshots', productId] });
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      void queryClient.invalidateQueries({
        queryKey: ['productAcquisitionAttempts', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['amazonProviderHealth', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['providerHealth'],
      });
      invalidateAcquisitionOperations(queryClient, productId);
    },
  });
}
