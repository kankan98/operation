import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../stores/chatStore';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isReconnecting: boolean;
  onScroll: (event: React.UIEvent) => void;
}

export function MessageList({
  messages,
  isStreaming,
  isReconnecting,
  onScroll,
}: MessageListProps) {
  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="text-center space-y-3 animate-[fadeIn_250ms_ease-out]"
          style={{
            animation: 'fadeIn 250ms ease-out'
          }}
        >
          <p className="text-[20px] font-medium tracking-tight text-fg-default/90">
            开始对话吧
          </p>
          <p className="text-[15px] text-fg-muted/70 tracking-wide">
            输入消息或选择建议开始
          </p>
        </div>
      </div>
    );
  }

  // Loading skeleton state
  if (messages.length === 0 && isStreaming) {
    return (
      <div className="flex-1 overflow-y-auto" onScroll={onScroll}>
        <div className="max-w-[800px] mx-auto space-y-6 px-4 py-8">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="animate-pulse"
              style={{
                animationDelay: `${index * 80}ms`,
                animationDuration: '1200ms',
                animationTimingFunction: 'ease-in-out'
              }}
            >
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-raised/60" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-surface-raised/60 rounded-lg w-3/4" />
                  <div className="h-4 bg-surface-raised/60 rounded-lg w-5/6" />
                  <div className="h-4 bg-surface-raised/60 rounded-lg w-2/3" />
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
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,0.2) transparent'
      }}
    >
      <div className="max-w-[800px] mx-auto space-y-6 px-4 py-8">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className="animate-[slideUp_200ms_ease-out]"
            style={{
              animation: 'slideUp 200ms ease-out',
              animationFillMode: 'both',
              animationDelay: `${Math.min(index * 40, 160)}ms`
            }}
          >
            <MessageBubble message={msg} />
          </div>
        ))}

        {isStreaming && (
          <div
            className="flex items-center gap-2 text-[14px] text-fg-muted/70 animate-[fadeIn_200ms_ease-out] pl-2"
            style={{
              animation: 'fadeIn 200ms ease-out'
            }}
          >
            <span className="inline-flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-fg-muted/50 animate-pulse"
                style={{ animationDelay: '0ms', animationDuration: '1400ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-fg-muted/50 animate-pulse"
                style={{ animationDelay: '200ms', animationDuration: '1400ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-fg-muted/50 animate-pulse"
                style={{ animationDelay: '400ms', animationDuration: '1400ms' }}
              />
            </span>
            <span className="tracking-wide">AI 正在思考...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Webkit scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
