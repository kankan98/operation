import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallCardProps {
  toolName: string;
  parameters?: Record<string, any>;
  result?: any;
  status: 'running' | 'success' | 'error';
}

export function ToolCallCard({ toolName, parameters, result, status }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    running: 'border-blue-300 bg-blue-50',
    success: 'border-green-300 bg-green-50',
    error: 'border-red-300 bg-red-50',
  };

  const statusText = {
    running: 'Executing...',
    success: 'Completed',
    error: 'Failed',
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-3 transition-colors',
        statusColors[status]
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">🔧 {toolName}</span>
          <span className="text-xs text-fg-muted">{statusText[status]}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs">
          {parameters && (
            <div>
              <div className="font-semibold text-fg-muted">Parameters:</div>
              <pre className="mt-1 overflow-x-auto rounded bg-surface p-2">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div>
              <div className="font-semibold text-fg-muted">Result:</div>
              <pre className="mt-1 overflow-x-auto rounded bg-surface p-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
