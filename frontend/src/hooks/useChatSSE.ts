import { useRef, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatApi } from '../services/chatApi';
import type { ChatMessage } from '../stores/chatStore';
import type { TaskOverview, ToolCall, ToolExecutionState, ToolResult } from '../types/chat';

interface UseChatSSEReturn {
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  error: string | null;
}

function toIsoString(value: unknown): string | undefined {
  if (typeof value === 'string') return new Date(value).toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

function hasToolStatus(status: unknown): status is ToolExecutionState[string]['status'] {
  return status === 'running' || status === 'success' || status === 'error';
}

/**
 * Custom hook for managing SSE chat streaming
 * SSE Protocol v2.0 - 简化版本，无需前端推断状态或计算时序
 */
export function useChatSSE(): UseChatSSEReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    messages,
    agentStatus,
    error,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
    addTask,
    updateTask,
    updateToolExecutionState,
  } = useChatStore();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Clean up any existing connection before starting a new one
    const oldCleanup = useChatStore.getState().cleanupRef;
    if (oldCleanup) {
      oldCleanup();
      setCleanup(null);
    }

    // Get session ID from store (may be undefined for new conversations)
    const sessionId = useChatStore.getState().currentSessionId;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      sessionId: sessionId || undefined,
    };
    addMessage(userMessage);

    // Start streaming
    setIsStreaming(true);
    setError(null);
    setAgentStatus('thinking');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const cleanup = await chatApi.streamMessage(
        text,
        messages,
        abortController.signal,
        {
          // Event: message_start
          onMessageStart: (messageId: string, sessionId?: string) => {
            // If sessionId is provided and we don't have one, store it
            if (sessionId && !useChatStore.getState().currentSessionId) {
              useChatStore.getState().setCurrentSession(sessionId);
            }

            // 幂等：POST /stream 响应与 SSE 的 message_start 事件会各触发一次本回调，
            // 且二者 messageId 相同。若已为该 messageId 建过占位消息则不再重复插入，
            // 否则消息列表会出现两条相同 key（React key 冲突 + 重复气泡）。
            if (useChatStore.getState().messages.some((m) => m.id === messageId)) {
              setCurrentMessageId(messageId);
              return;
            }

            // Create assistant message placeholder with backend-provided messageId
            const assistantMessage: ChatMessage = {
              id: messageId,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              toolCalls: [],
              sessionId: sessionId || undefined,
            };
            addMessage(assistantMessage);
            setCurrentMessageId(messageId);
          },

          // Event: status_change
          onStatus: (status: 'idle' | 'thinking' | 'tool_calling' | 'writing') => {
            setAgentStatus(status);
          },

          // Event: content_delta
          onTextDelta: (delta: string) => {
            appendToLastMessage(delta);
          },

          // Event: tool_start
          onToolCallStart: (toolCall: ToolCall) => {
            // Add tool call to the last message
            const currentMessages = useChatStore.getState().messages;
            const lastMsg = currentMessages[currentMessages.length - 1];

            updateLastMessage({
              toolCalls: [...(lastMsg?.toolCalls || []), toolCall],
            });
          },

          // Event: tool_complete
          onToolResult: (result: ToolResult) => {
            // Update tool call status in store (timing is already calculated by backend)
            const currentMessages = useChatStore.getState().messages;
            const lastMsg = currentMessages[currentMessages.length - 1];

            if (lastMsg?.toolCalls) {
              const updatedToolCalls = lastMsg.toolCalls.map((tc) =>
                tc.id === result.toolCallId
                  ? {
                      ...tc,
                      result: result.output,
                      isError: result.isError,
                      endTime: result.endTime,
                      durationMs: result.durationMs,
                    }
                  : tc
              );
              updateLastMessage({ toolCalls: updatedToolCalls });
            }
          },

          // Event: usage_complete
          onUsage: (usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number }) => {
            updateTokenUsage(usage);
          },

          // Event: message_complete
          onMessageDone: () => {
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },

          // Event: error_occurred
          onError: (errorMsg: string) => {
            setError(errorMsg);
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },

          // Chat UI Redesign - 新增事件处理
          // Event: task_created
          onTaskCreated: (task: TaskOverview) => {
            // 转换为 TaskOverview 类型并添加到 store
            const taskOverview: TaskOverview = {
              id: task.id,
              sessionId: task.sessionId,
              taskName: task.taskName,
              status: task.status,
              startTime: toIsoString(task.startTime) || new Date().toISOString(),
              relatedProducts: task.relatedProducts,
              platform: task.platform,
              metadata: task.metadata,
            };
            addTask(taskOverview);
          },

          // Event: task_update
          onTaskUpdate: (taskId: string, updates: Partial<TaskOverview>) => {
            // 转换更新数据并更新 store
            const taskUpdates: Partial<TaskOverview> = {
              ...updates,
              endTime: updates.endTime ? toIsoString(updates.endTime) : undefined,
            };
            updateTask(taskId, taskUpdates);
          },

          // Event: task_progress
          onTaskProgress: (taskId: string, progress: number, currentStep?: string) => {
            // 更新任务进度
            updateTask(taskId, {
              metadata: {
                progress,
                currentStep,
              },
            });
          },

          // Event: tool_execution_detail
          onToolExecutionDetail: (toolId: string, detail: Partial<ToolExecutionState[string]>) => {
            if (!hasToolStatus(detail.status)) return;

            // 更新工具执行状态，支持双卡片同步
            updateToolExecutionState(toolId, {
              toolName: detail.toolName || 'Unknown Tool',
              status: detail.status,
              durationMs: detail.durationMs,
              inputSummary: detail.inputSummary,
              outputSummary: detail.outputSummary,
            });
          },
        },
        sessionId || undefined
      );

      setCleanup(cleanup);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [
    messages,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
    addTask,
    updateTask,
    updateToolExecutionState,
  ]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [setIsStreaming, setAgentStatus, setCurrentMessageId]);

  return {
    sendMessage,
    abort,
    status: agentStatus,
    error,
  };
}
