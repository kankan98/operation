import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/services/api', () => ({
  snapshotsApi: { create: vi.fn().mockResolvedValue({ id: 'snap-1' }) },
  analysisApi: { priceStats: vi.fn() },
}));

import { useCreateSnapshot } from './usePriceStats';

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCreateSnapshot', () => {
  it('invalidates products and opportunities caches after a successful manual entry', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateSnapshot('product-1'), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      productId: 'product-1',
      price: 79.99,
      currency: 'USD',
      availability: 'in_stock',
    } as never);

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((call) =>
        JSON.stringify((call[0] as { queryKey?: unknown })?.queryKey)
      );
      // 既有：刷新该商品的快照与价格统计
      expect(keys).toContain(JSON.stringify(['snapshots', 'product-1']));
      expect(keys).toContain(JSON.stringify(['priceStats', 'product-1']));
      // 新增：录入后让列表卡片与机会工作台立即反映新价、清除误报的过时标记
      expect(keys).toContain(JSON.stringify(['products']));
      expect(keys).toContain(JSON.stringify(['opportunities']));
    });
  });
});
