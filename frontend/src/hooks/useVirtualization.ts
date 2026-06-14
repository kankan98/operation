/**
 * Hook to determine if message list should use virtualization.
 * Only virtualizes when message count exceeds threshold to maintain
 * 60fps scrolling performance.
 */
export function useVirtualization(messageCount: number) {
  // Threshold: virtualize when > 50 messages
  const VIRTUALIZATION_THRESHOLD = 50;
  const shouldVirtualize = messageCount > VIRTUALIZATION_THRESHOLD;

  return {
    shouldVirtualize,
    threshold: VIRTUALIZATION_THRESHOLD,
  };
}
