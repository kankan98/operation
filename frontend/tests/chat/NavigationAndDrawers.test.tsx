import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MainNavigation } from '@/components/chat/MainNavigation';
import { Chat } from '@/pages/Chat';
import { chatApi } from '@/services/chatApi';
import { useChatStore } from '@/stores/chatStore';

const { mockSendMessage } = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
}));

vi.mock('@/hooks/useChatSSE', () => ({
  useChatSSE: () => ({
    sendMessage: mockSendMessage,
    abort: vi.fn(),
    status: 'idle',
    error: null,
  }),
}));

vi.mock('@/hooks/useTaskManagement', () => ({
  useTaskManagement: () => ({
    tasks: [],
    loading: false,
    cancelTask: vi.fn(),
  }),
}));

vi.mock('@/services/chatApi', () => ({
  chatApi: {
    getSessions: vi.fn(),
    getMessages: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const sessions = [
  {
    id: 'session-1',
    title: '抽屉会话',
    userId: null,
    messageCount: 1,
    createdAt: new Date('2026-06-20T09:00:00+08:00').getTime(),
    updatedAt: new Date('2026-06-20T09:30:00+08:00').getTime(),
    lastMessagePreview: '用于测试抽屉切换',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe('navigation and responsive drawers', () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.getState().reset();
    mockSendMessage.mockReset();
    vi.mocked(chatApi.getSessions).mockResolvedValue({
      sessions,
      page: 1,
      limit: 20,
    });
    vi.mocked(chatApi.getMessages).mockResolvedValue({
      messages: [],
    });
    vi.mocked(chatApi.updateSession).mockResolvedValue({
      id: 'session-1',
      title: '抽屉会话',
      userId: null,
      contextSummary: null,
      messageCount: 1,
      createdAt: sessions[0].createdAt,
      updatedAt: sessions[0].updatedAt,
    });
    vi.mocked(chatApi.deleteSession).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to primary app routes from the main navigation', () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <MainNavigation />
        <LocationProbe />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /商品/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/products');

    fireEvent.click(screen.getByRole('button', { name: /预警/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/alerts');

    fireEvent.click(screen.getByRole('button', { name: /智能助手/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/chat');

    fireEvent.click(screen.getByRole('button', { name: /设置/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/settings');

    fireEvent.click(screen.getByRole('button', { name: /仪表盘/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('opens and closes session and task drawers from the Chat toolbar', async () => {
    useChatStore.getState().setSessions(sessions);

    render(
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(chatApi.getSessions).toHaveBeenCalled();
    });

    expect(screen.queryByLabelText('关闭会话抽屉遮罩')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '会话' }));
    expect(screen.getByLabelText('关闭会话抽屉遮罩')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭会话抽屉' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('关闭会话抽屉遮罩')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '会话' }));
    expect(screen.getByLabelText('关闭会话抽屉遮罩')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('关闭会话抽屉遮罩'));
    expect(screen.queryByLabelText('关闭会话抽屉遮罩')).not.toBeInTheDocument();

    expect(screen.queryByLabelText('关闭任务抽屉遮罩')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '任务' }));
    expect(screen.getByLabelText('关闭任务抽屉遮罩')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭任务抽屉' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('关闭任务抽屉遮罩')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '任务' }));
    expect(screen.getByLabelText('关闭任务抽屉遮罩')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('关闭任务抽屉遮罩'));
    expect(screen.queryByLabelText('关闭任务抽屉遮罩')).not.toBeInTheDocument();
  });

  it('disables blank submissions and preserves keyboard send/newline behavior', async () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(chatApi.getSessions).toHaveBeenCalled();
    });

    const input = screen.getByPlaceholderText('输入消息...（Enter 发送，Shift+Enter 换行）');
    const send = screen.getByRole('button', { name: '发送消息' });

    expect(send).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendMessage).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '   \n ' } });
    expect(send).toBeDisabled();

    fireEvent.change(input, { target: { value: '第一行' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    fireEvent.change(input, { target: { value: '第一行\n第二行' } });
    expect(input).toHaveValue('第一行\n第二行');
    expect(mockSendMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendMessage).toHaveBeenCalledWith('第一行\n第二行');
    expect(input).toHaveValue('');
  });

  it('preserves in-flight new-session messages while syncing the generated session id into the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route path="/chat" element={<><Chat /><LocationProbe /></>} />
          <Route path="/chat/:sessionId" element={<><Chat /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(chatApi.getSessions).toHaveBeenCalled();
    });

    act(() => {
      useChatStore.getState().setMessages([
        {
          id: 'user-1',
          role: 'user',
          content: '你可以干什么？',
          timestamp: Date.now(),
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          parts: [],
          timestamp: Date.now(),
        },
      ]);
      useChatStore.getState().setIsStreaming(true);
      useChatStore.getState().setCurrentSession('generated-session');
    });

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/chat/generated-session');
    });

    expect(chatApi.getMessages).not.toHaveBeenCalledWith('generated-session', expect.anything());
    expect(useChatStore.getState().messages.map((message) => message.role)).toEqual([
      'user',
      'assistant',
    ]);
  });
});
