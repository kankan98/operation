import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToolCall, ToolResult, TokenUsage, ToolExecutionState, TaskOverview, MessagePart } from '../types/chat';
import { chatApi } from '../services/chatApi';
import { normalizeMessageParts } from '../utils/messageAdapter';

export interface ChatSession {
  id: string;
  title?: string | null;
  userId?: string | null;
  messageCount?: number;
  createdAt: number;
  updatedAt?: number | null;
  contextSummary?: string | null;  // 添加上下文摘要字段
  // Chat UI Redesign 新增字段
  isPinned?: boolean;
  tags?: string[];
  lastMessagePreview?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  parts?: MessagePart[];
  tokensUsed?: number | null;  // 支持 null 以匹配 API 响应
  timestamp: number;
}

interface ChatState {
  // State
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isReconnecting: boolean;
  loadingSessions: boolean;
  loadingMessages: boolean;
  error: string | null;
  agentStatus: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  toolExecutionState: ToolExecutionState;  // 统一的工具执行状态
  currentMessageId: string | null;
  cleanupRef: (() => void) | null;
  // Chat UI Redesign 新增状态
  taskOverviews: TaskOverview[];  // 任务概览列表
  // 批量更新缓冲
  _pendingTextDeltas: Map<string, string>;  // blockId -> accumulated delta
  _flushTimerId: number | null;

  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendMessageContent: (content: string) => void;
  appendToLastMessage: (content: string) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setStreaming: (streaming: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAgentStatus: (agentStatus: ChatState['agentStatus']) => void;
  getToolExecutionState: (toolCallId: string) => ToolExecutionState[string] | undefined;
  setCurrentMessageId: (currentMessageId: string | null) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  setCleanup: (cleanupRef: (() => void) | null) => void;
  reset: () => void;
  // Chat UI Redesign 新增 actions
  setTaskOverviews: (tasks: TaskOverview[]) => void;
  addTask: (task: TaskOverview) => void;
  updateTask: (taskId: string, updates: Partial<TaskOverview>) => void;
  updateToolExecution: (toolCallId: string, updates: Partial<ToolExecutionState[string]>) => void;
  updateToolExecutionState: (toolCallId: string, updates: Partial<ToolExecutionState[string]>) => void;
  loadSessions: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  // Chat 内容块（parts）actions —— 作用于最后一条 assistant 消息的 parts
  startTextBlock: (blockId: string) => void;
  appendTextBlock: (blockId: string, delta: string) => void;
  endTextBlock: () => void;
  appendToolPart: (part: Extract<MessagePart, { type: 'tool' }>) => void;
  completeToolPart: (toolId: string, patch: { result?: unknown; isError?: boolean; startTime?: number; endTime?: number; durationMs?: number }) => void;
  _flushTextDeltas: () => void;  // 内部方法：立即刷新所有待处理的文本增量
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: null,
      messages: [],
      isStreaming: false,
      isReconnecting: false,
      loadingSessions: false,
      loadingMessages: false,
      error: null,
      agentStatus: 'idle',
      toolExecutionState: {},
      currentMessageId: null,
      cleanupRef: null,
      taskOverviews: [],
      _pendingTextDeltas: new Map(),
      _flushTimerId: null,

      // Actions
      setSessions: (sessions) => set({ sessions }),

      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      appendMessageContent: (content) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIdx = messages.length - 1;

          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            // ✅ Create new object instead of mutating
            messages[lastIdx] = {
              ...messages[lastIdx],
              content: messages[lastIdx].content + content,
            };
          } else {
            // Create new assistant message
            messages.push({
              id: `temp-${Date.now()}`,
              sessionId: state.currentSessionId || '',
              role: 'assistant',
              content,
              timestamp: Date.now(),
            });
          }

          return { messages };
        }),

      appendToLastMessage: (content) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIdx = messages.length - 1;

          if (lastIdx >= 0) {
            messages[lastIdx] = {
              ...messages[lastIdx],
              content: messages[lastIdx].content + content,
            };
          }

          return { messages };
        }),

      updateLastMessage: (updates) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIdx = messages.length - 1;

          if (lastIdx >= 0) {
            messages[lastIdx] = {
              ...messages[lastIdx],
              ...updates,
            };
          }

          return { messages };
        }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setIsStreaming: (streaming) => set({ isStreaming: streaming }),

      setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

      setLoadingSessions: (loading) => set({ loadingSessions: loading }),

      setLoadingMessages: (loading) => set({ loadingMessages: loading }),

      setError: (error) => set({ error }),

      setAgentStatus: (agentStatus) => set({ agentStatus }),

      getToolExecutionState: (toolCallId) => {
        return get().toolExecutionState[toolCallId];
      },

      setCurrentMessageId: (currentMessageId) => set({ currentMessageId }),

      updateTokenUsage: (usage) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIdx = messages.length - 1;

          if (lastIdx >= 0) {
            const totalTokens = usage.inputTokens + usage.outputTokens;
            messages[lastIdx] = {
              ...messages[lastIdx],
              tokensUsed: totalTokens,
            };
          }

          return { messages };
        }),

      setCleanup: (cleanupRef) => set({ cleanupRef }),

      reset: () => {
        // Task 5.2 & 5.3: 在重置前取消 RAF 定时器
        const state = get();
        if (state._flushTimerId !== null) {
          cancelAnimationFrame(state._flushTimerId);
        }

        set({
          sessions: [],
          currentSessionId: null,
          messages: [],
          isStreaming: false,
          isReconnecting: false,
          loadingSessions: false,
          loadingMessages: false,
          error: null,
          agentStatus: 'idle',
          toolExecutionState: {},
          currentMessageId: null,
          cleanupRef: null,
          taskOverviews: [],
          _flushTimerId: null,
          _pendingTextDeltas: new Map(),
        });
      },

      // Chat UI Redesign 新增 actions
      setTaskOverviews: (tasks) => set({ taskOverviews: tasks }),

      addTask: (task) =>
        set((state) => ({
          taskOverviews: [...state.taskOverviews, task],
        })),

      updateTask: (taskId, updates) =>
        set((state) => ({
          taskOverviews: state.taskOverviews.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),

      updateToolExecution: (toolCallId, updates) =>
        set((state) => ({
          toolExecutionState: {
            ...state.toolExecutionState,
            [toolCallId]: {
              ...state.toolExecutionState[toolCallId],
              ...updates,
            },
          },
        })),

      updateToolExecutionState: (toolCallId, updates) =>
        set((state) => ({
          toolExecutionState: {
            ...state.toolExecutionState,
            [toolCallId]: {
              ...state.toolExecutionState[toolCallId],
              ...updates,
            },
          },
        })),

      loadSessions: async () => {
        set({ loadingSessions: true, error: null });
        try {
          const response = await chatApi.getSessions();
          set({ sessions: response.sessions, loadingSessions: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load sessions',
            loadingSessions: false,
          });
        }
      },

      loadMessages: async (sessionId: string) => {
        set({ loadingMessages: true, error: null });
        try {
          const response = await chatApi.getMessages(sessionId);
          const messages = response.messages.map((msg) => {
            // 使用集中化的消息格式适配器
            const parts = normalizeMessageParts(msg);
            return {
              id: msg.id,
              sessionId: msg.sessionId,
              role: msg.role,
              content: msg.content,
              toolCalls: msg.toolCalls,
              toolResults: msg.toolResults,
              parts,
              tokensUsed: msg.tokensUsed,
              timestamp: msg.timestamp,
            };
          });
          set({ messages, loadingMessages: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load messages',
            loadingMessages: false,
          });
        }
      },

      // ===== 内容块（parts）actions：均对"最后一条消息"做不可变更新 =====
      startTextBlock: (blockId) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = [...(messages[i].parts || [])];
          if (!parts.some((p) => p.type === 'text' && p.id === blockId)) {
            parts.push({ type: 'text', id: blockId, content: '' });
          }
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),

      appendTextBlock: (blockId, delta) => {
        const state = get();

        // 创建新的 Map（不可变更新）
        const newPendingDeltas = new Map(state._pendingTextDeltas);
        const currentDelta = newPendingDeltas.get(blockId) || '';
        newPendingDeltas.set(blockId, currentDelta + delta);

        // 如果已有定时器，取消它
        if (state._flushTimerId !== null) {
          cancelAnimationFrame(state._flushTimerId);
        }

        // 使用 requestAnimationFrame 批量更新（约 16ms 一次）
        const timerId = requestAnimationFrame(() => {
          get()._flushTextDeltas();
        });

        set({ _pendingTextDeltas: newPendingDeltas, _flushTimerId: timerId });
      },

      _flushTextDeltas: () => {
        set((state) => {
          if (state._pendingTextDeltas.size === 0) {
            return { _flushTimerId: null };
          }

          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) {
            return { _pendingTextDeltas: new Map(), _flushTimerId: null };
          }

          const parts = [...(messages[i].parts || [])];
          let contentDelta = '';

          // 应用所有待处理的 delta
          state._pendingTextDeltas.forEach((delta, blockId) => {
            let idx = parts.findIndex((p) => p.type === 'text' && p.id === blockId);
            if (idx === -1) {
              parts.push({ type: 'text', id: blockId, content: '' });
              idx = parts.length - 1;
            }
            const part = parts[idx];
            if (part.type === 'text') {
              parts[idx] = { ...part, content: part.content + delta };
              contentDelta += delta;
            }
          });

          messages[i] = {
            ...messages[i],
            parts,
            content: (messages[i].content || '') + contentDelta,
          };

          return {
            messages,
            _pendingTextDeltas: new Map(),
            _flushTimerId: null,
          };
        });
      },

      endTextBlock: () => {
        // 文本块结束时立即刷新所有待处理的更新
        const state = get();
        if (state._flushTimerId !== null) {
          cancelAnimationFrame(state._flushTimerId);
          set({ _flushTimerId: null });
        }
        state._flushTextDeltas();
      },

      appendToolPart: (part) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = [...(messages[i].parts || []), part];
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),

      completeToolPart: (toolId, patch) =>
        set((state) => {
          const messages = [...state.messages];
          const i = messages.length - 1;
          if (i < 0) return {};
          const parts = (messages[i].parts || []).map((p) =>
            p.type === 'tool' && p.id === toolId ? { ...p, ...patch } : p
          );
          messages[i] = { ...messages[i], parts };
          return { messages };
        }),
    }),
    {
      name: 'chat-storage',
      version: 1,
      // 不再持久化 currentSessionId：URL 才是会话的唯一 source of truth。
      // 若持久化它，刷新或导航进入 /chat 时会被旧会话 ID 误重定向，导致无法新建对话。
      // 这里仅缓存会话列表用于首屏快速展示（loadSessions 会立即用后端数据覆盖）。
      partialize: (state) => ({
        sessions: state.sessions,
      }),
      // v0 旧数据可能已写入 currentSessionId，迁移时清除，根除历史残留导致的重定向。
      migrate: (persisted) => {
        if (persisted && typeof persisted === 'object') {
          delete (persisted as Record<string, unknown>).currentSessionId;
        }
        return persisted as ChatState;
      },
    }
  )
);
