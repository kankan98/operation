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

// 手动录入一次读数；成功后刷新该商品的快照与价格统计，
// 并失效产品与机会工作台缓存——录入即更新规范价格/新鲜度，
// 让列表卡片与机会工作台立即反映新价、清除误报的"已过时"标记。
export function useCreateSnapshot(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePriceSnapshot) => snapshotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', productId] });
      queryClient.invalidateQueries({ queryKey: ['priceStats', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}
