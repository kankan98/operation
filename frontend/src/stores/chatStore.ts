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
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += content;
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
    }),
}));
