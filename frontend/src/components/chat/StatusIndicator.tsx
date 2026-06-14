import { Loader2, Wrench, PenLine } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  isReconnecting?: boolean;
}

/**
 * Visual feedback for agent states with smooth animations
 * States: thinking (pulsing dots), tool_calling (wrench), writing (pen), reconnecting (spinner)
 * Animations: ≤250ms per Agent Purple design system
 * Colors: Purple accent (primary-500) for active states
 */
export function StatusIndicator({ status, isReconnecting = false }: StatusIndicatorProps) {
  if (status === 'idle' && !isReconnecting) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm text-fg-muted transition-opacity duration-200 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      {isReconnecting ? (
        <>
          <Loader2 className="w-4 h-4 text-primary-500 animate-spin" aria-hidden="true" />
          <span>重新连接...</span>
        </>
      ) : status === 'thinking' ? (
        <>
          <div className="flex gap-1" aria-hidden="true">
            <div
              className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
              style={{ animationDelay: '0ms', animationDuration: '1.5s' }}
            />
            <div
              className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
              style={{ animationDelay: '150ms', animationDuration: '1.5s' }}
            />
            <div
              className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
              style={{ animationDelay: '300ms', animationDuration: '1.5s' }}
            />
          </div>
          <span>思考中...</span>
        </>
      ) : status === 'tool_calling' ? (
        <>
          <Wrench className="w-4 h-4 text-primary-500 animate-pulse" aria-hidden="true" />
          <span>调用工具中...</span>
        </>
      ) : status === 'writing' ? (
        <>
          <PenLine className="w-4 h-4 text-primary-500 animate-pulse" aria-hidden="true" />
          <span>写作中...</span>
        </>
      ) : null}
    </div>
  );
}
