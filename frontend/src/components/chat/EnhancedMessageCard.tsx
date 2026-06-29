/**
 * EnhancedMessageCard - 增强的消息卡片组件
 *
 * 用于chat的消息显示，包含新的样式规范：
 * - 新阴影：shadow-sm (0 4px 10px rgba(15, 23, 42, 0.05))
 * - 圆角：12px
 * - padding：18px 18px 16px
 * - 支持嵌入工具执行卡、任务摘要、问题列表等
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ToolExecutionCard } from './ToolExecutionCard';
import { TaskSummaryBlock } from './TaskSummaryBlock';
import { NumberedQuestionList } from './NumberedQuestionList';
import { EnhancedCodeBlock, InlineCode } from './EnhancedCodeBlock';
import type { ChatMessage } from '@/types/chat';
import { normalizeMessageParts } from '@/utils/messageAdapter';

interface EnhancedMessageCardProps {
  message: ChatMessage;
  isStreaming?: boolean;
  agentStatus?: 'idle' | 'thinking' | 'tool_calling' | 'writing';
}

// Markdown 组件配置（提取为常量以便复用）
const markdownComponents = {
  // 代码块
  code({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode; className?: string }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (match) {
      return (
        <EnhancedCodeBlock
          code={codeString}
          language={match[1]}
        />
      );
    }

    return <InlineCode {...props}>{children}</InlineCode>;
  },

  // 链接样式增强
  a({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) {
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={href}
        className="
          text-[#6e54ee] font-medium
          underline decoration-[#a891ff] decoration-1
          hover:text-[#5f46df] hover:decoration-[#6e54ee] hover:decoration-2
          transition-colors inline-flex items-center gap-1
          break-all
        "
        style={{ wordBreak: 'break-all' }}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {isExternal && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
      </a>
    );
  },

  // 表格样式
  table({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { children?: React.ReactNode }) {
    return (
      <div className="my-4 overflow-hidden rounded-[10px] border border-[#e7e8ee]">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },

  thead({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { children?: React.ReactNode }) {
    return (
      <thead className="bg-[#fafafa]" {...props}>
        {children}
      </thead>
    );
  },

  th({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
    return (
      <th
        className="
          px-3 py-[12px] text-[13px] font-semibold text-[#111827]
          text-left border-b border-[#e7e8ee]
        "
        {...props}
      >
        {children}
      </th>
    );
  },

  td({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
    return (
      <td
        className="
          px-3 py-[10px] text-[13px] text-[#374151]
          border-b border-[#e7e8ee] last:border-b-0
        "
        {...props}
      >
        {children}
      </td>
    );
  },

  // 斑马纹效果
  tr({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { children?: React.ReactNode }) {
    return (
      <tr className="even:bg-[#fcfcfd] odd:bg-white" {...props}>
        {children}
      </tr>
    );
  },

  // 引用块样式
  blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement> & { children?: React.ReactNode }) {
    return (
      <blockquote
        className="
          my-4 pl-4 py-3 pr-4
          border-l-4 border-[#a891ff] rounded-r-lg
          bg-[#fafafa] text-[#4b5563] italic
        "
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  // 段落间距
  p({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) {
    return (
      <p
        className="my-[10px] first:mt-0 last:mb-0 leading-[1.65]"
        {...props}
      >
        {children}
      </p>
    );
  },

  // 分割线
  hr({ ...props }: React.HTMLAttributes<HTMLHRElement>) {
    return (
      <hr
        className="my-[14px] border-t border-[#edf0f5]"
        {...props}
      />
    );
  },
};

// 文本渲染子组件（集中维护 markdown 配置）
const MarkdownText: React.FC<{ children: string }> = ({ children }) => (
  <div className="prose prose-sm max-w-none break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  </div>
);

export const EnhancedMessageCard: React.FC<EnhancedMessageCardProps> = ({
  message,
  isStreaming = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);
  const structuredQuestions = message.taskSummary?.questions?.map((question) => ({
    question,
  }));

  // 复制消息内容
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id={`message-${message.id}`} className="flex gap-3 max-w-[820px]">
      {/* 头像 - 36px */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center ring-1 ring-purple-200/40">
            <User className="w-5 h-5 text-purple-600" strokeWidth={2} />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#6e54ee] flex items-center justify-center shadow-[0_2px_8px_rgba(110,84,238,0.3)]">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        )}
      </div>

      {/* 消息卡片 */}
      <div className="flex-1 min-w-0">
        {/* Assistant消息卡片样式 */}
        {!isUser && (
          <div
            className="
              bg-white rounded-[12px] border border-[#e7e8ee]
              shadow-[0_4px_10px_rgba(15,23,42,0.05)]
              p-[18px_18px_16px]
            "
          >
            {/* 正文：按内容块顺序渲染 */}
            <div className="space-y-3">
              {normalizeMessageParts(message).map((part) =>
                part.type === 'text' ? (
                  <MarkdownText key={part.id}>{part.content}</MarkdownText>
                ) : (
                  <ToolExecutionCard
                    key={part.id}
                    toolCall={{
                      id: part.id,
                      name: part.name,
                      input: part.input,
                      result: part.result,
                      isError: part.isError,
                      startTime: part.startTime,
                      endTime: part.endTime,
                      durationMs: part.durationMs,
                    }}
                    isRunning={isStreaming && part.result === undefined}
                  />
                )
              )}
            </div>

            {message.taskSummary && (
              <TaskSummaryBlock
                title={message.taskSummary.title}
                content={message.taskSummary.description}
              />
            )}

            {structuredQuestions && structuredQuestions.length > 0 && (
              <NumberedQuestionList questions={structuredQuestions} />
            )}

            {/* 时间戳和操作按钮 */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              {/* 时间戳 */}
              <span className="text-xs text-[#7b8494] font-mono">
                {formatTime(message.timestamp)}
              </span>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md text-[#8b93a3] hover:text-[#6e54ee] hover:bg-[#f4f1ff] transition-colors"
                  title="复制"
                  aria-label="复制消息"
                >
                  {copied ? (
                    <Copy className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  className="p-1.5 rounded-md text-[#8b93a3] hover:text-[#6e54ee] hover:bg-[#f4f1ff] transition-colors"
                  title="点赞"
                  aria-label="点赞"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>

                <button
                  className="p-1.5 rounded-md text-[#8b93a3] hover:text-[#6e54ee] hover:bg-[#f4f1ff] transition-colors"
                  title="点踩"
                  aria-label="点踩"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>

                <button
                  className="p-1.5 rounded-md text-[#8b93a3] hover:text-[#6e54ee] hover:bg-[#f4f1ff] transition-colors"
                  title="更多"
                  aria-label="更多操作"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 流式加载指示器 */}
            {isStreaming && (
              <div className="flex items-center gap-2 mt-3 text-xs text-[#7b8494]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#6e54ee] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#6e54ee] rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-1.5 bg-[#6e54ee] rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
                <span>正在生成...</span>
              </div>
            )}
          </div>
        )}

        {/* User消息简单样式 */}
        {isUser && (
          <div className="text-sm text-[#111827] leading-[1.65] break-words">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
};
