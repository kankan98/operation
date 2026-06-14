import { MessageSquarePlus, Trash2, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSessionPagination } from '@/hooks/useSessionPagination';
import { useScrollToBottom } from '@/hooks/useScrollToBottom';

interface Session {
  id: string;
  title?: string;
  messageCount?: number;
  updatedAt?: number;
}

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  /** Whether the session list is being (re)loaded — shows skeletons. */
  loading?: boolean;
  /** Mobile-only: whether the off-canvas sidebar is open. */
  mobileOpen?: boolean;
  /** Mobile-only: called to dismiss the off-canvas sidebar. */
  onClose?: () => void;
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  loading = false,
  mobileOpen = false,
  onClose,
}: SessionSidebarProps) {
  const { t } = useTranslation('chat');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lazy load sessions (first 20, then load more on scroll)
  const { visibleSessions, hasMore, isLoadingMore, loadMore, reset } = useSessionPagination({
    initialSessions: sessions,
    pageSize: 20,
  });

  // Reset pagination when sessions list changes
  useEffect(() => {
    reset();
  }, [sessions.length, reset]);

  // Load more sessions when scrolling to bottom
  useScrollToBottom({
    onScrollToBottom: loadMore,
    threshold: 100,
    enabled: hasMore && !isLoadingMore && !loading,
  });

  const handleSelect = (id: string) => {
    onSelectSession(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Off-canvas on mobile, static column from md up.
          'absolute inset-y-0 left-0 z-20 flex h-full w-[280px] flex-col border-r border-border bg-surface transition-transform duration-200 ease-out',
          'md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none lg:w-[280px]',
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
        )}
        aria-label={t('conversations')}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <button
            onClick={onNewSession}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {t('newChat')}
          </button>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            aria-label={t('closeSidebar')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-subtle md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Session List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-1" data-testid="sessions-skeleton">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg px-3 py-2.5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-subtle" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-subtle" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-fg-muted">
              {t('noConversations')}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {visibleSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer',
                      currentSessionId === session.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'hover:bg-subtle',
                    )}
                    onClick={() => handleSelect(session.id)}
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium">
                        {session.title || t('newChat')}
                      </div>
                      {session.messageCount !== undefined && (
                        <div className="text-xs text-fg-muted">
                          {t('messageCount', { count: session.messageCount })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('deleteConfirm'))) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="rounded p-1 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100"
                      aria-label={t('deleteSession')}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Load more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-fg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loadingMore')}
                </div>
              )}

              {/* Show total count if more sessions exist */}
              {hasMore && !isLoadingMore && (
                <div className="py-2 text-center text-xs text-fg-muted">
                  {t('showingCount', { shown: visibleSessions.length, total: sessions.length })}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
