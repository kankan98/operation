import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisApi, snapshotsApi } from '@/services/api';
import type { CreatePriceSnapshot } from '@/types';

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

// 手动录入一次读数；成功后刷新该商品的快照与价格统计
export function useCreateSnapshot(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePriceSnapshot) => snapshotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', productId] });
      queryClient.invalidateQueries({ queryKey: ['priceStats', productId] });
    },
  });
}
