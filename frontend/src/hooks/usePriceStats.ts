import { useQuery } from '@tanstack/react-query';
import { analysisApi, snapshotsApi } from '@/services/api';

export function usePriceStats(productId: string) {
  return useQuery({
    queryKey: ['priceStats', productId],
    queryFn: () => analysisApi.priceStats(productId),
    enabled: !!productId,
  });
}

export function usePriceSnapshots(productId: string, limit?: number) {
  return useQuery({
    queryKey: ['snapshots', productId, limit],
    queryFn: () => snapshotsApi.list(productId, limit),
    enabled: !!productId,
  });
}
