import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
              // Style code blocks with syntax highlighting
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';

                // Block code with syntax highlighting
                if (match && lang) {
                  return (
                    <div className="my-3 overflow-hidden rounded-lg shadow-sm">
                      <SyntaxHighlighter
                        language={lang}
                        style={oneDark}
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
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                // Inline code with refined styling
                return (
                  <code
                    className="rounded bg-surface-raised px-1.5 py-0.5 text-xs font-mono text-fg-accent border border-border-subtle"
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
                    }}
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
