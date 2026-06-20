import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatSSE } from '@/hooks/useChatSSE';
import { chatApi, type SSEEventHandlers } from '@/services/chatApi';
import { useChatStore } from '@/stores/chatStore';

vi.mock('@/services/chatApi', () => ({
  chatApi: {
    streamMessage: vi.fn(),
  },
}));

describe('useChatSSE task events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T10:00:00+08:00'));
    localStorage.clear();
    useChatStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('updates task overview state from task_created, task_progress, and task_update SSE callbacks', async () => {
    const startTime = new Date('2026-06-20T09:55:00+08:00');
    const endTime = new Date('2026-06-20T10:01:00+08:00');

    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_text, _messages, _signal, handlers: SSEEventHandlers) => {
        handlers.onMessageStart?.('assistant-1', 'session-1');
        handlers.onTaskCreated?.({
          id: 'task-1',
          sessionId: 'session-1',
          taskName: '同步竞品价格',
          status: 'in_progress',
          startTime: startTime.getTime(),
          relatedProducts: ['B0ABC123'],
          platform: 'amazon',
        });
        handlers.onTaskProgress?.('task-1', 72, '正在分析价格波动');
        handlers.onTaskUpdate?.('task-1', {
          status: 'completed',
          endTime: endTime.getTime(),
        });
        handlers.onMessageDone?.();
        return vi.fn();
      }
    );

    const { result } = renderHook(() => useChatSSE());

    await act(async () => {
      await result.current.sendMessage('开始同步竞品价格');
    });

    const task = useChatStore.getState().taskOverviews[0];

    expect(chatApi.streamMessage).toHaveBeenCalledWith(
      '开始同步竞品价格',
      [],
      expect.any(AbortSignal),
      expect.objectContaining({
        onTaskCreated: expect.any(Function),
        onTaskProgress: expect.any(Function),
        onTaskUpdate: expect.any(Function),
      }),
      undefined
    );
    expect(task).toMatchObject({
      id: 'task-1',
      sessionId: 'session-1',
      taskName: '同步竞品价格',
      status: 'completed',
      relatedProducts: ['B0ABC123'],
      platform: 'amazon',
      metadata: {
        progress: 72,
        currentStep: '正在分析价格波动',
      },
      endTime: endTime.toISOString(),
    });
    expect(task.startTime).toBe(startTime.toISOString());
    expect(useChatStore.getState().isStreaming).toBe(false);
  });
});
