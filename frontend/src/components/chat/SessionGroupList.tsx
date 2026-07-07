/**
 * SessionGroupList - 会话分组列表组件
 *
 * 实现会话列表的分组显示、搜索、置顶等功能
 * 分组：置顶 / 今天 / 昨天 / 更早
 */

import React, { useState, useMemo } from 'react';
import { Search, Pin, MoreVertical, Trash2, Edit2, Plus } from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { groupSessions, filterSessions, getGroupLabel, SessionGroup } from '@/utils/sessionGrouping';
import { formatSmartTime } from '@/utils/timeFormat';
import { Modal } from '@/components/ui/Modal';

interface SessionGroupListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionPin: (sessionId: string, isPinned: boolean) => void | Promise<void>;
  onSessionDelete: (sessionId: string) => void | Promise<void>;
  onSessionRename: (sessionId: string, newTitle: string) => void | Promise<void>;
  /** 新建对话：清空当前会话进入空状态，发首条消息时由后端创建会话 */
  onNewSession?: () => void;
  searchLabel?: string;
}

interface SessionCardProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
  onRename: () => void;
}

function getSessionDisplayTitle(title: string | null | undefined): string {
  return title?.trim() || '新对话';
}

function getSessionActionMenuLabel(title: string | null | undefined): string {
  return `会话操作菜单：${title?.trim() || '未命名对话'}`;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isActive,
  onSelect,
  onPin,
  onDelete,
  onRename,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      data-testid={`session-card-${session.id}`}
      className={`
        relative group px-3 py-3 rounded-lg cursor-pointer
        transition-all duration-150
        ${
          isActive
            ? 'bg-purple-50 shadow-sm ring-1 ring-purple-100'
            : 'hover:bg-gray-50 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
    >
      {/* 会话内容 */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-1">
            {session.isPinned && (
              <Pin className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            )}
            <h3
              className={`
                text-sm font-medium truncate
                ${isActive ? 'text-purple-900' : 'text-gray-900'}
              `}
            >
              {getSessionDisplayTitle(session.title)}
            </h3>
          </div>

          {/* 预览文本 */}
          {(session.previewText || session.lastMessagePreview) && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-1">
              {session.previewText || session.lastMessagePreview}
            </p>
          )}

          {/* 时间和标签 */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatSmartTime(session.updatedAt || session.createdAt)}</span>
            {session.tags && session.tags.length > 0 && (
              <>
                <span>·</span>
                <span className="truncate">{session.tags[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* 操作菜单 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label={getSessionActionMenuLabel(session.title)}
            className={`
              p-1 rounded hover:bg-white/80 transition-colors
              ${showMenu || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  {session.isPinned ? '取消置顶' : '置顶'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  重命名
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 未读指示器（如果需要） */}
      {(session.hasUnread || (session.unreadCount && session.unreadCount > 0)) && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-purple-600 rounded-full" />
      )}
    </div>
  );
};

export const SessionGroupList: React.FC<SessionGroupListProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionPin,
  onSessionDelete,
  onSessionRename,
  onNewSession,
  searchLabel = '搜索对话',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  // 过滤和分组会话
  const { groupedSessions, hasResults } = useMemo(() => {
    const filtered = filterSessions(sessions, searchQuery);
    const grouped = groupSessions(filtered);
    const hasResults = Object.values(grouped).some((group) => group.length > 0);
    return { groupedSessions: grouped, hasResults };
  }, [sessions, searchQuery]);

  // 渲染分组
  const renderGroup = (group: SessionGroup, sessions: ChatSession[]) => {
    if (sessions.length === 0) return null;

    return (
      <div key={group} className="mb-6">
        {/* 分组标题 */}
        <h2 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {getGroupLabel(group)}
        </h2>

        {/* 会话列表 */}
        <div className="space-y-1">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSessionSelect(session.id)}
              onPin={() => onSessionPin(session.id, !session.isPinned)}
              onDelete={() => {
                setDialogError(null);
                setDeleteTarget(session);
              }}
              onRename={() => {
                setDialogError(null);
                setRenameTarget(session);
                setDraftTitle(session.title || '');
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* 新对话按钮 */}
      {onNewSession && (
        <div className="px-4 pt-4">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5
              rounded-lg text-sm font-medium text-white
              bg-gradient-to-br from-[#7c5cff] to-[#6e54ee]
              shadow-[0_8px_20px_rgba(110,84,238,0.24)]
              hover:from-[#6d4dee] hover:to-[#5f46df]
              transition-all duration-200"
            aria-label="新对话"
          >
            <Plus className="w-4 h-4" />
            新对话
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索对话..."
            aria-label={searchLabel}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {hasResults ? (
          <>
            {renderGroup('pinned', groupedSessions.pinned)}
            {renderGroup('today', groupedSessions.today)}
            {renderGroup('yesterday', groupedSessions.yesterday)}
            {renderGroup('earlier', groupedSessions.earlier)}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery ? '未找到匹配的对话' : '还没有对话'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? '试试其他关键词' : '开始新对话吧'}
            </p>
          </div>
        )}
      </div>

      {renameTarget && (
        <Modal
          title="重命名会话"
          onClose={() => {
            if (dialogSubmitting) return;
            setRenameTarget(null);
            setDialogError(null);
          }}
        >
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const title = draftTitle.trim();
              if (!title || dialogSubmitting) return;
              setDialogSubmitting(true);
              setDialogError(null);
              try {
                await onSessionRename(renameTarget.id, title);
                setRenameTarget(null);
              } catch (error) {
                setDialogError(error instanceof Error ? error.message : '重命名失败');
              } finally {
                setDialogSubmitting(false);
              }
            }}
          >
            <label className="block text-sm font-medium text-gray-700" htmlFor="session-title-input">
              会话标题
            </label>
            <input
              id="session-title-input"
              aria-label="会话标题"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              autoFocus
            />
            {dialogError && <p className="text-sm text-red-600">{dialogError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRenameTarget(null);
                  setDialogError(null);
                }}
                disabled={dialogSubmitting}
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!draftTitle.trim() || dialogSubmitting}
                className="rounded-lg bg-[#6e54ee] px-3 py-2 text-sm font-medium text-white hover:bg-[#5f46df] disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="删除会话"
          onClose={() => {
            if (dialogSubmitting) return;
            setDeleteTarget(null);
            setDialogError(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              确定要删除“{deleteTarget.title || '新对话'}”吗？此操作不可撤销。
            </p>
            {dialogError && <p className="text-sm text-red-600">{dialogError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDialogError(null);
                }}
                disabled={dialogSubmitting}
                className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (dialogSubmitting) return;
                  setDialogSubmitting(true);
                  setDialogError(null);
                  try {
                    await onSessionDelete(deleteTarget.id);
                    setDeleteTarget(null);
                  } catch (error) {
                    setDialogError(error instanceof Error ? error.message : '删除失败');
                  } finally {
                    setDialogSubmitting(false);
                  }
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={dialogSubmitting}
              >
                删除会话
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
