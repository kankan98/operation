/**
 * Chat - 新版聊天页面
 *
 * 实现 3 栏 Grid 布局（复用 AppLayout 的侧边栏）：
 * - 会话列表 (272px)
 * - 对话区 (minmax(720px, 1fr))
 * - 任务面板 (314px)
 *
 * 关键：所有列都必须 h-full，内部独立滚动
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionGroupList } from '@/components/chat/SessionGroupList';
import { TaskPanel, TaskPanelDrawer } from '@/components/chat/TaskPanel';
import { EnhancedMessageCard } from '@/components/chat/EnhancedMessageCard';
import { MessageErrorBoundary } from '@/components/chat/MessageErrorBoundary';
import { useChatStore } from '@/stores/chatStore';
import { useChatSSE } from '@/hooks/useChatSSE';
import { useTaskManagement } from '@/hooks/useTaskManagement';
import { chatApi } from '@/services/chatApi';
import type { ChatSession } from '@/types/chat';
import { extractToolExecutions } from '@/utils/messageAdapter';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 抽屉开关状态（窄屏时承载会话列表 / 任务面板）
  // 布局响应式完全交给 CSS 容器查询（@container 在 AppLayout 的 <main>），
  // 不再用 window.innerWidth 做 JS 测量——避免重复计算外层侧边栏占用的横向空间
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  // 输入框受控状态
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Task 2.1: 本地待处理状态防止双击
  const [isPending, setIsPending] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);

  // Store state
  const {
    currentSessionId,
    sessions,
    messages,
    isStreaming,
    agentStatus,
    setCurrentSession,
    setMessages,
    loadSessions,
    loadMessages,
  } = useChatStore();

  // Chat SSE hook
  const { sendMessage, error } = useChatSSE();

  // Task management hook
  const {
    tasks,
    loading: tasksLoading,
    cancelTask,
  } = useTaskManagement({
    sessionId: currentSessionId,
    autoLoad: true,
  });

  // 使用 ref 保存最新的 tasks，避免闭包陷阱
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // 从 messages 的 parts 中提取所有工具调用（使用 memoization 优化性能）
  const toolExecutions = useMemo(
    () => messages.flatMap((msg) => extractToolExecutions(msg)),
    [messages]
  );

  // 缓存活跃会话标题查找
  const activeSessionTitle = useMemo(
    () => sessions.find((s) => s.id === currentSessionId)?.title || '新对话',
    [sessions, currentSessionId]
  );

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // URL 是会话的唯一 source of truth：URL 单向驱动 store。
  // - 有 :sessionId → 同步到 store 并加载该会话消息
  // - 无 :sessionId（/chat）→ 进入新对话空状态，清空当前会话与消息
  // 仅依赖 sessionId，避免与下方"新建跳转"effect 双向触发形成循环/竞态。
  useEffect(() => {
    const abortController = new AbortController();

    if (sessionId) {
      if (sessionId !== currentSessionId) {
        setCurrentSession(sessionId);
        loadMessages(sessionId);
      }
    } else if (currentSessionId !== null) {
      setCurrentSession(null);
      setMessages([]);
    }

    return () => {
      abortController.abort();
    };
  }, [sessionId, currentSessionId, setCurrentSession, loadMessages, setMessages]);

  // 发首条消息后，后端创建新会话并由 onMessageStart 写入 currentSessionId；
  // 此处仅在"store 有新 ID 而 URL 尚无"时把它同步到 URL（store→URL 单向、仅新建触发）。
  // 因 currentSessionId 不再被持久化，进入页面时它必为 null，不会再被旧会话 ID 误重定向。
  useEffect(() => {
    if (currentSessionId && !sessionId) {
      navigate(`/chat/${currentSessionId}`, { replace: true });
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // 自动滚动到最新消息（仅在流式完成后）
  useEffect(() => {
    if (!isStreaming && messages.length > 0 && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming, messages.length]);

  // 处理会话选择
  const handleSessionSelect = useCallback(
    (selectedSessionId: string) => {
      navigate(`/chat/${selectedSessionId}`);
      setIsSessionDrawerOpen(false);
    },
    [navigate]
  );

  // 新建对话：清空当前会话与消息进入空状态（发首条消息时由后端创建会话）
  const handleNewSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
    navigate('/chat');
    setIsSessionDrawerOpen(false);
  }, [navigate, setCurrentSession, setMessages]);

  // 处理会话置顶
  const handleSessionPin = useCallback(
    async (sessionId: string, isPinned: boolean) => {
      try {
        await chatApi.updateSession(sessionId, {
          isPinned,
        });
        // 重新加载会话列表
        loadSessions();
      } catch {
        // 失败时保持当前列表状态，错误提示由全局请求层处理。
      }
    },
    [loadSessions]
  );

  // 处理会话删除
  const handleSessionDelete = useCallback(
    async (sessionId: string) => {
      if (!confirm('确定要删除这个对话吗？')) return;

      try {
        await chatApi.deleteSession(sessionId);
        loadSessions();

        // 如果删除的是当前会话，跳转到首页
        if (sessionId === currentSessionId) {
          navigate('/chat');
        }
      } catch {
        // 失败时保持当前会话，避免误清空用户上下文。
      }
    },
    [currentSessionId, loadSessions, navigate]
  );

  // 处理会话重命名
  const handleSessionRename = useCallback(
    async (sessionId: string, newTitle: string) => {
      try {
        await chatApi.updateSession(sessionId, { title: newTitle });
        loadSessions();
      } catch {
        // 失败时保留原标题。
      }
    },
    [loadSessions]
  );

  // 处理任务详情查看（滚动到对话区对应位置）
  const handleViewTaskDetail = useCallback((taskId: string) => {
    const task = tasksRef.current.find((item) => item.id === taskId);
    const messageId = typeof task?.metadata?.messageId === 'string'
      ? task.metadata.messageId
      : undefined;
    const targetElement = document.getElementById(
      messageId ? `message-${messageId}` : `task-${taskId}`
    );

    if (targetElement) {
      try {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (error) {
        console.warn('滚动到任务详情失败:', error);
      }
    }
  }, []);

  // 处理工具详情查看（滚动到对话区对应位置）
  const handleViewToolDetail = useCallback((toolCallId: string) => {
    // 找到工具调用卡片并滚动
    const toolElement = document.getElementById(`tool-${toolCallId}`);
    if (toolElement) {
      try {
        toolElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (error) {
        console.warn('滚动到工具详情失败:', error);
      }
    }
  }, []);

  // 处理消息发送
  const handleSendMessage = useCallback(
    (content: string) => {
      // Task 2.1: 防止快速双击（500ms 窗口）
      const now = Date.now();
      if (isPending || isStreaming || now - lastSubmitTimeRef.current < 500) {
        return;
      }

      lastSubmitTimeRef.current = now;
      setIsPending(true);

      // 无当前会话时，后端会在首条消息时自动创建会话，并通过 message_start 回传 sessionId
      sendMessage(content);

      // 延迟 500ms 后重置 pending 状态
      setTimeout(() => setIsPending(false), 500);
    },
    [sendMessage, isPending, isStreaming]
  );

  return (
    <div className="h-full w-full overflow-hidden bg-[#fcfcfd] font-sans">
      {/* 3栏布局 - 基于容器查询自适应（容器 = AppLayout 的 <main>，已扣除侧边栏）
          容器 ≥ @6xl(1152px): 会话 | 对话 | 任务   三栏
          容器 ≥ @3xl(768px) : 会话 | 对话          两栏（任务转抽屉）
          容器 < @3xl        : 对话                单栏（会话 + 任务转抽屉） */}
      <div className="h-full w-full grid grid-cols-1 @3xl:grid-cols-[272px_minmax(0,1fr)] @6xl:grid-cols-[272px_minmax(0,1fr)_314px]">
        {/* 1. 会话列表 - 容器 ≥ @3xl 显示，窄屏走抽屉 */}
        <div className="hidden @3xl:block h-full min-h-0">
          <SessionGroupList
            sessions={sessions as ChatSession[]}
            activeSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onSessionPin={handleSessionPin}
            onSessionDelete={handleSessionDelete}
            onSessionRename={handleSessionRename}
            onNewSession={handleNewSession}
          />
        </div>

        {/* 2. 对话主区 - h-full + flex布局 */}
        <div className="h-full min-h-0 flex flex-col bg-[#fcfcfd] overflow-hidden">
          {/* 顶部标题栏 - 60px */}
          <div className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-[#e7e8ee]">
            <h1 className="text-[15px] font-bold text-[#111827]">
              {currentSessionId ? activeSessionTitle : '跨境运营助手'}
            </h1>

            {/* 窄屏菜单按钮 - 由容器查询控制显隐，对应列隐藏时才出现 */}
            <div className="flex gap-2">
              {/* 会话：容器 < @3xl（会话列表列隐藏）时显示 */}
              <button
                onClick={() => setIsSessionDrawerOpen(true)}
                className="@3xl:hidden px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                会话
              </button>
              {/* 任务：容器 < @6xl（任务面板列隐藏）时显示 */}
              <button
                onClick={() => setIsTaskDrawerOpen(true)}
                className="@6xl:hidden px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                任务
              </button>
            </div>
          </div>

          {/* 消息流 - 独立滚动 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-7">
            <div className="max-w-[840px] mx-auto space-y-6">
              {/* 空状态欢迎页 - 仅在无消息且无当前会话时显示 */}
              {messages.length === 0 && !currentSessionId && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#6e54ee] flex items-center justify-center shadow-lg mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#111827] mb-3">
                    你好！我是跨境运营助手
                  </h2>
                  <p className="text-sm text-[#6b7077] mb-6 max-w-md">
                    我可以帮你分析商品数据、监控价格变化、管理预警规则，还能回答你的各种问题。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                    {[
                      { emoji: '📊', text: '分析商品价格趋势' },
                      { emoji: '🔍', text: '查询商品信息' },
                      { emoji: '⚡', text: '设置价格预警' },
                      { emoji: '💡', text: '运营策略建议' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(item.text);
                          inputRef.current?.focus();
                        }}
                        className="
                          flex items-center gap-3 px-4 py-3
                          bg-white border border-[#e7e8ee] rounded-lg
                          hover:border-[#6e54ee] hover:bg-[#fafafa]
                          transition-all duration-200
                          text-left
                        "
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="text-sm text-[#374151]">{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 消息列表 */}
              <MessageErrorBoundary>
                {messages.map((message) => (
                  <EnhancedMessageCard
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                    agentStatus={agentStatus}
                  />
                ))}
              </MessageErrorBoundary>

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* 滚动锚点 */}
              <div ref={messageEndRef} />
            </div>
          </div>

          {/* 底部输入 Composer - 固定底部 */}
          <div className="flex-shrink-0 px-[18px] py-[14px] bg-gradient-to-t from-[#fcfcfd] via-[#fcfcfd] to-transparent">
            <div className="max-w-[840px] mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputValue.trim()) {
                    handleSendMessage(inputValue.trim());
                    setInputValue('');
                  }
                }}
                className="
                  min-h-[86px] bg-white rounded-[12px]
                  border border-[#d8dbe5] shadow-[0_10px_30px_rgba(15,23,42,0.06)]
                  p-[14px] flex flex-col gap-3
                "
              >
                {/* 输入区 */}
                <textarea
                  ref={inputRef}
                  name="message"
                  placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isStreaming || isPending}
                  rows={2}
                  className="
                    flex-1 resize-none text-sm text-[#111827]
                    placeholder:text-[#9ca3af]
                    focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isStreaming && !isPending) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                />

                {/* 底部工具栏 */}
                <div className="flex items-center justify-between">
                  {/* 左侧工具按钮 */}
                  <div className="flex gap-2">
                    {/* Reserved slot for future composer tools. */}
                  </div>

                  {/* 发送按钮 */}
                  <button
                    type="submit"
                    aria-label="发送消息"
                    disabled={isStreaming || isPending}
                    className="
                      w-10 h-10 rounded-[10px] flex items-center justify-center
                      bg-gradient-to-br from-[#7c5cff] to-[#6e54ee]
                      text-white shadow-[0_8px_20px_rgba(110,84,238,0.24)]
                      hover:from-[#6d4dee] to-[#5f46df]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                    "
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 3. 任务面板 - 容器 ≥ @6xl 显示，窄屏走抽屉 */}
        <div className="hidden @6xl:block h-full min-h-0">
          <TaskPanel
            tasks={tasks}
            toolExecutions={toolExecutions}
            loading={tasksLoading}
            onViewTaskDetail={handleViewTaskDetail}
            onCancelTask={cancelTask}
            onViewToolDetail={handleViewToolDetail}
          />
        </div>
      </div>

      {/* 窄屏抽屉（关闭时组件内部返回 null，按钮显隐由容器查询控制） */}
      <SessionDrawer
        isOpen={isSessionDrawerOpen}
        onClose={() => setIsSessionDrawerOpen(false)}
        sessions={sessions as ChatSession[]}
        activeSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionPin={handleSessionPin}
        onSessionDelete={handleSessionDelete}
        onSessionRename={handleSessionRename}
        onNewSession={handleNewSession}
      />

      <TaskPanelDrawer
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        tasks={tasks}
        toolExecutions={toolExecutions}
        loading={tasksLoading}
        onViewTaskDetail={handleViewTaskDetail}
        onCancelTask={cancelTask}
        onViewToolDetail={handleViewToolDetail}
      />
    </div>
  );
};

// Session Drawer for Mobile
const SessionDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionPin: (id: string, isPinned: boolean) => void;
  onSessionDelete: (id: string) => void;
  onSessionRename: (id: string, title: string) => void;
  onNewSession?: () => void;
}> = ({ isOpen, onClose, ...sessionProps }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-label="关闭会话抽屉遮罩"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[272px] z-50 bg-white shadow-lg">
        <SessionGroupList {...sessionProps} />
      </div>
    </>
  );
};
