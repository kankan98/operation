import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../stores/chatStore';
import { useChatStore } from '../../stores/chatStore';
import { Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isReconnecting?: boolean;
  onScroll: (event: React.UIEvent) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  agentStatus?: 'idle' | 'thinking' | 'tool_calling' | 'writing';
}

export function MessageList({
  messages,
  isStreaming,
  agentStatus = 'idle',
  // isReconnecting is kept in props for future use
  onScroll,
  scrollRef,
}: MessageListProps) {
  // 获取工具执行状态
  const toolExecutionState = useChatStore((state) => state.toolExecutionState);
  // Empty state - NO scrollbar, fixed height container
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div className="text-center space-y-6 max-w-md animate-fade-in">
          {/* Icon with subtle gradient background */}
          <div className="mx-auto w-20 h-20 rounded-[20px] bg-gradient-to-br from-primary-50 to-primary-100
                        flex items-center justify-center shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <Sparkles className="w-10 h-10 text-primary-600" strokeWidth={1.5} />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-[28px] font-bold tracking-tight text-fg-default">
              开始对话吧
            </h2>
            <p className="text-[14px] text-fg-muted leading-relaxed">
              输入消息或选择下方建议开始对话
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton state
  if (messages.length === 0 && isStreaming) {
    return (
      <div className="flex-1 overflow-y-auto" onScroll={onScroll} ref={scrollRef}>
        <div className="max-w-[1400px] mx-auto space-y-6 px-6 py-8">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="animate-skeleton"
              style={{
                animationDelay: `${index * 120}ms`,
              }}
            >
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-subtle" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-subtle rounded-[10px] w-3/4" />
                  <div className="h-4 bg-subtle rounded-[10px] w-5/6" />
                  <div className="h-4 bg-subtle rounded-[10px] w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto scroll-smooth"
      onScroll={onScroll}
      ref={scrollRef}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-gray-300) transparent'
      }}
    >
      <div className="max-w-[1400px] mx-auto space-y-6 px-6 py-8">
        {messages.map((msg, index) => {
          // 判断是否是正在流式输出的消息（最后一条消息且正在 streaming）
          const isLastMessage = index === messages.length - 1;
          const isStreamingThisMessage = isLastMessage && isStreaming;

          // 跳过渲染空的 assistant 消息，除非它正在流式输出
          const isEmptyAssistantMessage =
            msg.role === 'assistant' &&
            !msg.content &&
            (!msg.toolCalls || msg.toolCalls.length === 0);

          if (isEmptyAssistantMessage && !isStreamingThisMessage) {
            return null;
          }

          return (
            <div
              key={msg.id}
              className="animate-slide-up"
              style={{
                animationDelay: `${Math.min(index * 50, 200)}ms`
              }}
            >
              <MessageBubble
                role={msg.role}
                content={msg.content}
                // 只有在消息完成（不在流式输出中）时才显示时间戳
                timestamp={isStreamingThisMessage ? undefined : msg.timestamp}
                toolCalls={msg.toolCalls}
                toolResults={msg.toolResults}
                isStreaming={isStreamingThisMessage}
                agentStatus={isStreamingThisMessage ? agentStatus : 'idle'}
                toolExecutionState={toolExecutionState}
              />
            </div>
          );
        })}

        {/*
          只在以下情况显示气泡 loading：
          1. isStreaming = true（正在流式传输）
          2. agentStatus = 'thinking'（AI 正在思考，还没开始输出）
          3. 最后一条消息是空的（没有内容和工具调用）

          这样避免了：
          - 文本流式输出时显示 loading（文本本身就是进度指示）
          - 工具调用时显示 loading（工具卡片已有自己的 loading 状态）
          - 显示空的消息气泡（带时间戳但无内容）
        */}
        {(() => {
          const lastMessage = messages[messages.length - 1];
          const shouldShowLoading =
            isStreaming &&
            agentStatus === 'thinking' &&
            lastMessage?.role === 'assistant' &&
            !lastMessage.content &&
            (!lastMessage.toolCalls || lastMessage.toolCalls.length === 0);

          return shouldShowLoading ? (
            <div className="animate-fade-in">
              <MessageBubble
                role="assistant"
                content=""
                isLoading={true}
              />
            </div>
          ) : null;
        })()}
      </div>

      <style>{`
        /* Webkit scrollbar styling - matches design system */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: var(--color-gray-300);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-gray-400);
        }
      `}</style>
    </div>
  );
}
