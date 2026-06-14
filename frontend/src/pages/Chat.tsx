import React, { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChatSSE } from '../hooks/useChatSSE';
import { useScrollControl } from '../hooks/useScrollControl';
import { ChatContainer } from '../components/chat/ChatContainer';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ControlBar } from '../components/chat/ControlBar';
import { StatusIndicator } from '../components/chat/StatusIndicator';

/**
 * Chat Page - Refactored with refined component composition
 *
 * Design Philosophy: Editorial minimalism with intentional micro-interactions
 * - Clean component separation for maintainability
 * - Smooth animations with physics-based easing (≤250ms)
 * - Responsive layout adapting to mobile/tablet/desktop
 * - Thoughtful error handling with inline recovery
 * - Refined typography and spatial hierarchy
 *
 * Architecture:
 * - ChatContainer: Responsive shell with adaptive sidebar
 * - MessageList: Virtualization-ready message display
 * - ChatInput: Auto-resizing input with suggestions
 * - ControlBar: Floating controls (abort, scroll, regenerate)
 * - StatusIndicator: Agent status with smooth transitions
 */
export function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  // Zustand store
  const { messages, agentStatus, error, isStreaming } = useChatStore();

  // Custom hooks
  const { sendMessage, abort, status } = useChatSSE();
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
    '介绍一下你自己',
    '帮我写一段代码',
    '解释一下 React Hooks',
    '如何优化网站性能',
    '推荐一些学习资源',
  ];

  return (
    <ChatContainer
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      <div className="relative flex-1 flex flex-col" ref={scrollRef}>
        {/* Status Indicator */}
        <StatusIndicator
          status={agentStatus}
          isReconnecting={status === 'reconnecting'}
        />

        {/* Message List */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          isReconnecting={status === 'reconnecting'}
          onScroll={handleScroll}
        />

        {/* Control Bar */}
        <ControlBar
          isStreaming={isStreaming}
          canRegenerate={messages.length > 0}
          showScrollButton={showScrollButton}
          hasNewMessage={hasNewMessage}
          onAbort={abort}
          onRegenerate={() => {
            // TODO: Implement regenerate logic
            console.log('Regenerate clicked');
          }}
          onScrollToBottom={scrollToBottom}
        />

        {/* Chat Input */}
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
    </ChatContainer>
  );
}
