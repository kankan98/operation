import { create } from 'zustand';

export interface ChatSession {
  id: string;
  title?: string;
  messageCount?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  tokensUsed?: number;
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
  toolCardStates: Map<string, any>;
  currentMessageId: string | null;
  cleanupRef: (() => void) | null;

  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendMessageContent: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAgentStatus: (agentStatus: ChatState['agentStatus']) => void;
  updateToolCardState: (id: string, state: any) => void;
  setCurrentMessageId: (currentMessageId: string | null) => void;
  setCleanup: (cleanupRef: (() => void) | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
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
  toolCardStates: new Map(),
  currentMessageId: null,
  cleanupRef: null,

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

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

  setLoadingSessions: (loading) => set({ loadingSessions: loading }),

  setLoadingMessages: (loading) => set({ loadingMessages: loading }),

  setError: (error) => set({ error }),

  setAgentStatus: (agentStatus) => set({ agentStatus }),

  updateToolCardState: (id, state) =>
    set((prev) => {
      const next = new Map(prev.toolCardStates);
      next.set(id, state);
      return { toolCardStates: next };
    }),

  setCurrentMessageId: (currentMessageId) => set({ currentMessageId }),

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
      toolCardStates: new Map(),
      currentMessageId: null,
      cleanupRef: null,
    }),
}));
