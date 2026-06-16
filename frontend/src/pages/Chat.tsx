import { useState, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChatSSE } from '../hooks/useChatSSE';
import { useScrollControl } from '../hooks/useScrollControl';
import { ChatContainer } from '../components/chat/ChatContainer';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ControlBar } from '../components/chat/ControlBar';
import { chatApi } from '../services/chatApi';

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
 *
 * Auto-Scroll Behavior:
 * - Automatically scrolls to bottom during streaming when user is near bottom
 * - Respects user intent: pauses auto-scroll when user scrolls up >200px
 * - Resumes auto-scroll when user scrolls back <120px or clicks scroll button
 * - Shows new message badge when content arrives while user is scrolled up
 */
export function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  // Zustand store
  const { messages, agentStatus, error, isStreaming, currentSessionId, setMessages } = useChatStore();

  // Custom hooks
  const { sendMessage, abort } = useChatSSE();
  const {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    userScrolledUp,
    scrollToBottom,
    handleScroll,
    setNewMessageArrived,
    nearBottomRef,
  } = useScrollControl();

  /**
   * 会话初始化和切换
   * 当 currentSessionId 变化时加载对应会话的历史消息
   * 注意：ChatContainer 负责创建新会话，这里只负责加载消息
   */
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!currentSessionId) {
        // 没有会话 ID，清空消息列表
        setMessages([]);
        return;
      }

      try {
        // 加载历史消息
        const data = await chatApi.getMessages(currentSessionId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load session messages:', err);
      }
    };

    loadSessionMessages();
  }, [currentSessionId, setMessages]); // 依赖 currentSessionId，会话切换时重新加载

  /**
   * 自动滚动逻辑
   * 当以下条件同时满足时，自动滚动到底部：
   * 1. 正在流式输出 (isStreaming)
   * 2. 用户未主动向上滚动 (!userScrolledUp)
   * 3. 用户接近底部 (nearBottomRef.current)
   *
   * 依赖项：messages - 每次消息内容变化时触发检查
   */
  useEffect(() => {
    if (isStreaming && !userScrolledUp && nearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, isStreaming, userScrolledUp, scrollToBottom, nearBottomRef]);

  /**
   * 新消息通知
   * 当新消息到达且用户在查看历史时，显示新消息徽章
   */
  useEffect(() => {
    if (messages.length > 0 && !isStreaming) {
      // 消息完成时，如果用户向上滚动，显示徽章
      setNewMessageArrived();
    }
  }, [messages.length, isStreaming, setNewMessageArrived]);

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
        {/* Message List - This component handles ALL scrolling internally */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          isReconnecting={false}
          agentStatus={agentStatus}
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
