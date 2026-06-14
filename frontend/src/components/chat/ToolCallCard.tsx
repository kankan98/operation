import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallCardProps {
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: 'running' | 'success' | 'error';
}

export function ToolCallCard({ toolName, parameters, result, status }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    running: {
      border: 'border-blue-300',
      bg: 'bg-blue-50',
      dot: 'bg-blue-500',
      text: 'Executing...',
      animate: true,
    },
    success: {
      border: 'border-green-300',
      bg: 'bg-green-50',
      dot: 'bg-green-500',
      text: 'Completed',
      animate: false,
    },
    error: {
      border: 'border-red-300',
      bg: 'bg-red-50',
      dot: 'bg-red-500',
      text: 'Failed',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-3 transition-all duration-200',
        config.border,
        config.bg
      )}
    >
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          {/* Status Dot with Pulse Animation */}
          <span className="relative flex h-2 w-2">
            {config.animate && (
              <span className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                config.dot
              )} />
            )}
            <span className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              config.dot
            )} />
          </span>

          <span className="text-sm font-medium">🔧 {toolName}</span>
          <span className="text-xs text-fg-muted">{config.text}</span>
        </div>

        {/* Rotating Chevron */}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            'group-hover:scale-110',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )}
          style={{
            transitionTimingFunction: 'var(--ease-out-soft, cubic-bezier(0.33, 1, 0.68, 1))'
          }}
        />
      </button>

      {/* Expandable Content with Smooth Animation */}
      <div
        style={{
          maxHeight: isExpanded ? '500px' : '0',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 200ms var(--ease-out-soft, cubic-bezier(0.33, 1, 0.68, 1)), opacity 200ms var(--ease-out-soft, cubic-bezier(0.33, 1, 0.68, 1))',
        }}
      >
        <div className="mt-3 space-y-2 text-xs">
          {parameters && (
            <div>
              <div className="font-semibold text-fg-muted mb-1">Parameters:</div>
              <pre className="overflow-x-auto rounded bg-surface p-2 text-xs leading-relaxed">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div>
              <div className="font-semibold text-fg-muted mb-1">Result:</div>
              <pre className="overflow-x-auto rounded bg-surface p-2 text-xs leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
