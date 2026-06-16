import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToolCall, ToolResult, TokenUsage, ToolExecutionState, TaskOverview } from '../types/chat';

export interface ChatSession {
  id: string;
  title?: string | null;
  userId?: string | null;
  messageCount?: number;
  createdAt: number;
  updatedAt?: number | null;
  contextSummary?: string | null;  // 添加上下文摘要字段
  // Chat UI Redesign v2 新增字段
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
  // Chat UI Redesign v2 新增状态
  taskOverviews: TaskOverview[];  // 任务概览列表

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
  // Chat UI Redesign v2 新增 actions
  setTaskOverviews: (tasks: TaskOverview[]) => void;
  addTask: (task: TaskOverview) => void;
  updateTask: (taskId: string, updates: Partial<TaskOverview>) => void;
  updateToolExecution: (toolCallId: string, updates: Partial<ToolExecutionState[string]>) => void;
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
          console.log('[chatStore] appendToLastMessage 被调用，内容:', content);
          console.log('[chatStore] 当前消息数量:', state.messages.length);
          const messages = [...state.messages];
          const lastIdx = messages.length - 1;

          if (lastIdx >= 0) {
            console.log('[chatStore] 更新最后一条消息，当前内容长度:', messages[lastIdx].content.length);
            messages[lastIdx] = {
              ...messages[lastIdx],
              content: messages[lastIdx].content + content,
            };
            console.log('[chatStore] 更新后内容长度:', messages[lastIdx].content.length);
          } else {
            console.warn('[chatStore] 没有消息可以追加内容');
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

      reset: () =>
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
        }),

      // Chat UI Redesign v2 新增 actions
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
    }),
    {
      name: 'chat-storage',
      // 只持久化这些字段
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
      }),
    }
  )
);
