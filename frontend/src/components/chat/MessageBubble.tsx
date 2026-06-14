import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { ToolCallCard } from './ToolCallCard';

interface ToolCall {
  id?: string;
  name: string;
  input?: Record<string, unknown>;
}

interface ToolResult {
  toolCallId?: string;
  output?: unknown;
  isError?: boolean;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isLoading?: boolean;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  toolCalls,
  toolResults,
  isLoading = false
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            {/* Soft gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50" />

            {/* Subtle ring */}
            <div className="absolute inset-0 ring-1 ring-inset ring-purple-200/40" />

            {/* Icon */}
            <div className="relative w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
            {/* Rich gradient background with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-600 to-primary-700" />

            {/* Shine effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/5 to-transparent" />

            {/* Subtle animated pulse ring */}
            <div
              className="absolute inset-0 ring-1 ring-inset ring-white/20 animate-pulse"
              style={{ animationDuration: '3s' }}
            />

            {/* Icon */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" strokeWidth={2} />
            </div>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex', isUser ? 'justify-end' : 'justify-start', 'flex-1 min-w-0')}>
        <div
          className={cn(
            'inline-block max-w-[85%] rounded-[20px] px-5 py-3 text-[14px] leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary-50 text-gray-900 border border-primary-100'
              : 'bg-surface text-fg border border-border-subtle'
          )}
        >
          {isLoading ? (
            <LoadingState />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Style code blocks with syntax highlighting
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';

                  // Block code with syntax highlighting
                  if (match && lang) {
                    return (
                      <div className="my-3 overflow-hidden rounded-lg shadow-sm">
                        <SyntaxHighlighter
                          language={lang}
                          style={oneDark as Record<string, React.CSSProperties>}
                          customStyle={{
                            margin: 0,
                            borderRadius: '8px',
                            padding: '1rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            background: '#282c34',
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
                            }
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  // Inline code with refined styling
                  return (
                    <code
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-primary-700 border border-gray-200"
                      style={{
                        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
                      }}
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

          {timestamp && !isLoading && (
            <div
              className={cn(
                'mt-2 text-xs',
                isUser ? 'text-gray-500' : 'text-fg-muted'
              )}
            >
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          )}

          {toolCalls && toolCalls.length > 0 && !isLoading && (
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
    </div>
  );
}

/**
 * Loading State Component - Elegant typing indicator
 * Design: Three animated dots with staggered timing
 */
function LoadingState() {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Animated dots */}
      <div className="flex gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
          style={{ animationDelay: '0ms', animationDuration: '1400ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
          style={{ animationDelay: '200ms', animationDuration: '1400ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"
          style={{ animationDelay: '400ms', animationDuration: '1400ms' }}
        />
      </div>
      <span className="text-fg-muted text-sm">正在思考...</span>
    </div>
  );
}
