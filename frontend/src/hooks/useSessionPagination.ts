import { useState, useCallback } from 'react';

interface Session {
  id: string;
  title?: string;
  messageCount?: number;
  updatedAt?: number;
}

interface UseSessionPaginationOptions {
  initialSessions: Session[];
  pageSize?: number;
}

/**
 * Hook for lazy loading sessions with pagination.
 * Only loads first 20 sessions initially, then loads more on scroll.
 */
export function useSessionPagination({
  initialSessions,
  pageSize = 20,
}: UseSessionPaginationOptions) {
  const [displayCount, setDisplayCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleSessions = initialSessions.slice(0, displayCount);
  const hasMore = displayCount < initialSessions.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate async loading
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + pageSize, initialSessions.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, hasMore, pageSize, initialSessions.length]);

  const reset = useCallback(() => {
    setDisplayCount(pageSize);
  }, [pageSize]);

  return {
    visibleSessions,
    hasMore,
    isLoadingMore,
    loadMore,
    reset,
  };
}
