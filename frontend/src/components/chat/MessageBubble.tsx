import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ToolCallCard } from './ToolCallCard';

interface ToolCall {
  id?: string;
  name: string;
  input?: Record<string, any>;
}

interface ToolResult {
  toolCallId?: string;
  output?: any;
  isError?: boolean;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export function MessageBubble({ role, content, timestamp, toolCalls, toolResults }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-6 py-4 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-surface border border-border text-fg'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Style code blocks. react-markdown v10 dropped the `inline`
              // prop, so detect block code via the language-* class instead.
              code: ({ className, children, ...props }) => {
                const isBlock = /language-(\w+)/.test(className || '');
                return isBlock ? (
                  <pre className="mt-2 mb-2 overflow-x-auto rounded-lg bg-subtle p-4">
                    <code className={cn('text-xs', className)} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code
                    className="rounded bg-subtle px-1.5 py-0.5 text-xs font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Style lists
              ul: ({ children }) => (
                <ul className="my-2 ml-6 list-disc space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 ml-6 list-decimal space-y-1">{children}</ol>
              ),
              // Style tables
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border bg-subtle px-4 py-2 text-left font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              // Style headings
              h1: ({ children }) => (
                <h1 className="mt-4 mb-2 text-lg font-bold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-3 mb-2 text-base font-bold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>
              ),
              // Style paragraphs
              p: ({ children }) => <p className="my-2">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}

        {timestamp && (
          <div
            className={cn(
              'mt-2 text-xs',
              isUser ? 'text-primary-100' : 'text-fg-muted'
            )}
          >
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}

        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {toolCalls.map((tool, idx) => {
              const result =
                toolResults?.find((r) => r.toolCallId && r.toolCallId === tool.id) ??
                toolResults?.[idx];
              const status = result ? (result.isError ? 'error' : 'success') : 'running';
              return (
                <ToolCallCard
                  key={tool.id ?? idx}
                  toolName={tool.name}
                  parameters={tool.input}
                  result={result?.output}
                  status={status}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
