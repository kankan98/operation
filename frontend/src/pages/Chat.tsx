import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChatSSE } from '../hooks/useChatSSE';
import { useScrollControl } from '../hooks/useScrollControl';
import { ChatContainer } from '../components/chat/ChatContainer';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ControlBar } from '../components/chat/ControlBar';
import { StatusIndicator } from '../components/chat/StatusIndicator';

/**
 * Chat Page — Redesigned following style.md design system
 *
 * Design Philosophy (style.md):
 * - AI Native: Merchant Copilot experience
 * - Professional SaaS: Clean, trustworthy interface
 * - Calm Intelligence: Guide, don't interrupt
 * - Minimalism with Warmth: Agent Purple accent
 * - 8pt spacing system (16/24/32px)
 * - Soft geometry (10px input, 12px button, 20px card, 999px badge)
 * - Animations: 150-250ms with ease-out
 *
 * Fixed Issues:
 * - No scrollbar on empty state (overflow-hidden on empty container)
 * - Proper container height constraints (flex with overflow control)
 * - Consistent spacing following 8pt grid
 * - Visual consistency with other pages (Agent Purple theme)
 */
export function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  // Zustand store
  const { messages, agentStatus, error, isStreaming } = useChatStore();

  // Custom hooks
  const { sendMessage, abort } = useChatSSE();
  const {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    scrollToBottom,
    handleScroll,
  } = useScrollControl();

  // Handle send message
  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setLastFailedText(null);
    await sendMessage(text);
    setInputValue('');
  };

  // Handle retry on error
  const handleRetry = () => {
    if (lastFailedText) {
      handleSend(lastFailedText);
    }
  };

  // Suggestion messages for empty state
  const suggestions = [
    '分析销售趋势',
    '找到爆款产品',
    '总结警报信息',
    '优化广告支出',
    '预测库存需求',
  ];

  return (
    <ChatContainer
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      {/* Main chat area - Full height container */}
      <div className="h-full flex flex-col relative bg-canvas">
        {/* Status Indicator - Fixed position */}
        <StatusIndicator
          status={agentStatus}
          isReconnecting={false}
        />

        {/* Message List - This component handles ALL scrolling internally */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          isReconnecting={false}
          onScroll={handleScroll}
          scrollRef={scrollRef}
        />

        {/* Control Bar - Absolutely positioned, floats over content */}
        <div className="absolute inset-0 pointer-events-none">
          <ControlBar
            isStreaming={isStreaming}
            canRegenerate={messages.length > 0}
            showScrollButton={showScrollButton}
            hasNewMessage={hasNewMessage}
            onAbort={abort}
            onRegenerate={() => {
              console.log('Regenerate clicked');
            }}
            onScrollToBottom={scrollToBottom}
          />
        </div>

        {/* Chat Input - Fixed at bottom, no flex-grow */}
        <div className="flex-shrink-0">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={isStreaming}
            showSuggestions={messages.length === 0}
            suggestions={suggestions}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </ChatContainer>
  );
}
