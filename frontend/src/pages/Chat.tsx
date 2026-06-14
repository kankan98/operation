import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles, Menu, RefreshCw, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import chatApi from '@/services/chatApi';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { StreamingIndicator } from '@/components/chat/StreamingIndicator';
import { SessionSidebar } from '@/components/chat/SessionSidebar';
import { VirtualizedMessageList } from '@/components/chat/VirtualizedMessageList';
import { useVirtualization } from '@/hooks/useVirtualization';
import { cn } from '@/lib/utils';

const SUGGESTION_KEYS = [
  'analyzeSales',
  'findWinning',
  'summarizeAlerts',
  'optimizeAds',
  'forecastInventory',
] as const;

export function Chat() {
  const { t } = useTranslation('chat');
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  // Tracks whether the user is scrolled near the bottom; only then do we
  // auto-scroll on new content (so we don't yank them away from reading history).
  const nearBottomRef = useRef(true);
  // rAF handle used to throttle scroll handling to one update per frame (~60fps).
  const scrollRafRef = useRef<number | null>(null);

  const {
    sessions,
    currentSessionId,
    messages,
    isStreaming,
    isReconnecting,
    loadingSessions,
    loadingMessages,
    error,
    setSessions,
    setCurrentSession,
    setMessages,
    addMessage,
    appendMessageContent,
    setStreaming,
    setReconnecting,
    setLoadingSessions,
    setLoadingMessages,
    setError,
  } = useChatStore();

  // Determine if virtualization should be used
  const { shouldVirtualize } = useVirtualization(messages.length);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await chatApi.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(t('errors.loadSessions'));
    } finally {
      setLoadingSessions(false);
    }
  }, [setLoadingSessions, setSessions, setError, t]);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setLoadingMessages(true);
      try {
        const data = await chatApi.getMessages(sessionId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError(t('errors.loadMessages'));
      } finally {
        setLoadingMessages(false);
      }
    },
    [setLoadingMessages, setMessages, setError, t],
  );

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, loadMessages]);

  // Measure container size for virtualization
  useEffect(() => {
    const updateSize = () => {
      if (messageContainerRef.current) {
        const rect = messageContainerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-scroll to bottom (only if the user is already near the bottom)
  useEffect(() => {
    if (nearBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const createNewSession = useCallback(async () => {
    try {
      const session = await chatApi.createSession();
      setSessions([session, ...sessions]);
      setCurrentSession(session.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(t('errors.createSession'));
    }
  }, [sessions, setSessions, setCurrentSession, setMessages, setError, t]);

  const deleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);

      if (currentSessionId === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError(t('errors.deleteSession'));
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setLastFailedText(null);

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = await chatApi.createSession();
      setSessions([session, ...sessions]);
      setCurrentSession(session.id);
      sessionId = session.id;
    }
    // sessionId is guaranteed to be a string from here on.
    const activeSessionId: string = sessionId as string;

    // Add user message
    const userMsg = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId,
      role: 'user' as const,
      content: trimmed,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    nearBottomRef.current = true; // sending implies intent to follow the thread
    setInput('');
    setStreaming(true);

    try {
      const cleanup = await chatApi.streamMessage(
        activeSessionId,
        trimmed,
        (chunk) => {
          if (chunk.type === 'text' && chunk.text) {
            appendMessageContent(chunk.text);
          }
        },
        (streamError) => {
          setError(streamError);
          setLastFailedText(trimmed);
          setStreaming(false);
          setReconnecting(false);
        },
        () => {
          setStreaming(false);
          setReconnecting(false);
          // Reload sessions to get updated title
          loadSessions();
        },
        (reconnecting) => {
          setReconnecting(reconnecting);
        },
      );

      return cleanup;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(t('errors.sendMessage'));
      setLastFailedText(trimmed);
      setStreaming(false);
      setReconnecting(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedText) {
      sendMessage(lastFailedText);
    }
  };

  // Global keyboard shortcuts: Ctrl/Cmd+N (new chat), "/" (focus input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewSession();
        return;
      }

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createNewSession]);

  // Throttle scroll handling to one update per animation frame to keep
  // scrolling at ~60fps even with long threads.
  const handleScroll = () => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      nearBottomRef.current = distanceFromBottom < 120;
    });
  };

  const showEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="relative flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-canvas">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
        loading={loadingSessions}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header with hamburger (hidden from md up) */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label={t('openSidebar')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-subtle"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-medium text-fg">{t('title')}</span>
        </div>

        {/* Messages */}
        <div
          ref={(el) => {
            scrollRef.current = el;
            messageContainerRef.current = el;
          }}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {loadingMessages ? (
            <div className="mx-auto max-w-3xl space-y-6" data-testid="messages-skeleton">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                  <div className="w-2/3 space-y-2 rounded-xl border border-border bg-surface px-6 py-4">
                    <div className="h-3 w-full animate-pulse rounded bg-subtle" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-subtle" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-subtle" />
                  </div>
                </div>
              ))}
            </div>
          ) : showEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-fg">{t('title')}</h2>
              <p className="mt-1 max-w-md text-sm text-fg-muted">{t('greeting')}</p>
            </div>
          ) : shouldVirtualize && containerSize.height > 0 ? (
            // Use virtualization for large message lists (>50 messages)
            <VirtualizedMessageList
              messages={messages}
              isStreaming={isStreaming}
              isReconnecting={isReconnecting}
              streamingIndicator={
                isReconnecting ? (
                  <div className="flex items-center gap-2 text-sm text-fg-muted">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t('reconnecting')}
                  </div>
                ) : (
                  <StreamingIndicator />
                )
              }
              height={containerSize.height}
              width={containerSize.width}
            />
          ) : (
            // Standard rendering for smaller message lists
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  toolCalls={msg.toolCalls}
                  toolResults={msg.toolResults}
                />
              ))}
              {(isStreaming || isReconnecting) && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-border bg-surface px-6 py-4 shadow-sm">
                    {isReconnecting ? (
                      <div className="flex items-center gap-2 text-sm text-fg-muted">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {t('reconnecting')}
                      </div>
                    ) : (
                      <StreamingIndicator />
                    )}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-surface px-6 py-4">
          <div className="mx-auto max-w-3xl">
            {/* Error with retry */}
            {error && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {lastFailedText && (
                  <button
                    onClick={handleRetry}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t('retry')}
                  </button>
                )}
              </div>
            )}

            {/* Suggested actions */}
            {showEmpty && (
              <div className="mb-3 flex flex-wrap gap-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => sendMessage(t(`suggestions.${key}`))}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {t(`suggestions.${key}`)}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-200"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={1}
                placeholder={t('placeholder')}
                disabled={isStreaming}
                className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                aria-label={t('send')}
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                  input.trim() && !isStreaming
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
