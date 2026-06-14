import { useEffect, useRef } from 'react';

interface UseScrollToBottomOptions {
  onScrollToBottom: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook to detect when user scrolls to the bottom of a container.
 * Debounced to fire at most once per animation frame (~60fps).
 */
export function useScrollToBottom({
  onScrollToBottom,
  threshold = 50,
  enabled = true,
}: UseScrollToBottomOptions) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Throttle to one check per animation frame
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const { scrollTop, scrollHeight, clientHeight } = target;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceFromBottom < threshold) {
          onScrollToBottom();
        }
      });
    };

    // Attach to document to catch scroll events from any scrollable element
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [onScrollToBottom, threshold, enabled]);
}
