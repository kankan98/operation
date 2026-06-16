import React, { useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useChatStore } from '../../stores/chatStore';
import { chatApi } from '../../services/chatApi';
import { NewChatButton } from './NewChatButton';

interface ChatContainerProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * ChatContainer — Responsive layout shell with adaptive sidebar behavior
 *
 * Design Philosophy (style.md):
 * - Refined spatial composition with subtle depth layering
 * - Fluid responsive transitions with precise timing (≤250ms)
 * - Elegant overlay system with backdrop blur effects
 * - 8pt spacing system (16/24/32px)
 * - Soft geometry (20px card radius, 12px button radius)
 *
 * Breakpoints:
 * - Mobile (< 768px): Full-screen overlay sidebar
 * - Tablet (768px - 1023px): 320px overlay sidebar with shadow
 * - Desktop (≥ 1024px): Fixed 240px sidebar, always visible
 */
export function ChatContainer({
  children,
  sidebarOpen,
  onToggleSidebar,
}: ChatContainerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { sessions, currentSessionId, setSessions, setCurrentSession, setMessages } = useChatStore();

  // 加载会话列表
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await chatApi.getSessions();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };

    loadSessions();
  }, [setSessions]);

  // 切换到指定会话
  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) return;

    try {
      setCurrentSession(sessionId);
      const data = await chatApi.getMessages(sessionId);
      setMessages(data.messages || []);

      // 移动端关闭侧边栏
      if (isMobile || isTablet) {
        onToggleSidebar();
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // 创建新对话
  const handleNewChat = async () => {
    try {
      const session = await chatApi.createSession();
      setCurrentSession(session.id);
      setMessages([]); // 清空消息

      // 重新加载会话列表
      const data = await chatApi.getSessions();
      setSessions(data.sessions || []);

      // 移动端关闭侧边栏
      if (isMobile || isTablet) {
        onToggleSidebar();
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex overflow-hidden bg-canvas">
      {/* Sidebar — Adaptive Positioning */}
      {(isDesktop || sidebarOpen) && (
        <aside
          className={`
            ${isMobile ? 'fixed inset-0 z-50' : ''}
            ${isTablet ? 'fixed left-0 top-0 bottom-0 z-40 w-80' : ''}
            ${isDesktop ? 'relative w-60' : ''}
            ${isMobile || isTablet ? 'animate-slide-in-left' : ''}
            bg-surface border-r border-border-subtle
          `}
          style={{
            ...(isTablet && {
              boxShadow: 'var(--shadow-e3)',
            }),
          }}
        >
          {/* Sidebar Content Container */}
          <div className="h-full flex flex-col">
            {/* Header Section with Close Button (Mobile/Tablet Only) */}
            {!isDesktop && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                <h2 className="text-[20px] font-semibold tracking-tight text-fg-default">
                  对话历史
                </h2>

                {/* Elegant Close Button */}
                <button
                  onClick={onToggleSidebar}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-[12px]
                           bg-subtle hover:bg-surface-overlay transition-all duration-200 active:scale-95"
                  aria-label="关闭侧边栏"
                >
                  {/* Close Icon */}
                  <X className="w-5 h-5 text-fg-muted group-hover:text-fg-default transition-colors duration-200" />
                </button>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* New Chat Button */}
              <NewChatButton onClick={handleNewChat} />

              {/* Session List */}
              <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-fg-default">
                  最近对话
                </h3>

                {sessions.length === 0 ? (
                  <p className="text-[13px] text-fg-muted leading-relaxed">
                    暂无历史对话
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg transition-all duration-200
                          ${
                            session.id === currentSessionId
                              ? 'bg-accent-purple/10 border border-accent-purple/20'
                              : 'hover:bg-surface-overlay border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-fg-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-fg-default truncate">
                              {session.title || '新对话'}
                            </p>
                            <p className="text-[12px] text-fg-muted mt-0.5">
                              {formatTime(session.updatedAt || session.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area - Fixed height to prevent scrollbar issues */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>

      {/* Overlay Backdrop (Mobile/Tablet Only) */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onToggleSidebar}
          aria-label="关闭侧边栏"
        />
      )}
    </div>
  );
}
