import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chat } from '@/pages/Chat';
import { useChatStore } from '@/stores/chatStore';

// Mock the API client (default export) so no real network calls happen.
vi.mock('@/services/chatApi', () => ({
  default: {
    getSessions: vi.fn(),
    getMessages: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    streamMessage: vi.fn(),
  },
}));

import chatApi from '@/services/chatApi';

const api = chatApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.getState().reset();
  api.getSessions.mockResolvedValue({ sessions: [] });
  api.getMessages.mockResolvedValue({ messages: [] });
  api.createSession.mockResolvedValue({ id: 's1', createdAt: Date.now() });
  api.deleteSession.mockResolvedValue(undefined);
  api.streamMessage.mockResolvedValue(() => {});
});

describe('Chat page', () => {
  it('renders the empty state with greeting and suggestion chips', async () => {
    render(<Chat />);
    expect(await screen.findByText(/Commerce Copilot/i)).toBeInTheDocument();
    // A suggested-prompt chip from the chat namespace
    expect(screen.getByText('Analyze sales trends')).toBeInTheDocument();
  });

  it('sends a message: adds the user bubble and starts streaming', async () => {
    // Pre-select a session so no inline session creation/reset interferes
    useChatStore.setState({
      currentSessionId: 's1',
      sessions: [{ id: 's1', title: 'Test', createdAt: Date.now() }],
    });
    render(<Chat />);

    const textarea = await screen.findByPlaceholderText(/Ask anything/i);
    fireEvent.change(textarea, { target: { value: 'How many products?' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(await screen.findByText('How many products?')).toBeInTheDocument();
    await waitFor(() =>
      expect(api.streamMessage).toHaveBeenCalledWith(
        's1',
        'How many products?',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ),
    );
  });

  it('shows an error with a retry button when streaming fails', async () => {
    useChatStore.setState({
      currentSessionId: 's1',
      sessions: [{ id: 's1', title: 'Test', createdAt: Date.now() }],
    });
    api.streamMessage.mockImplementation(
      (_sid: string, _content: string, _onChunk: (chunk: unknown) => void, onError: (error: string) => void) => {
        onError('Stream failed');
        return Promise.resolve(() => {});
      },
    );

    render(<Chat />);
    const textarea = await screen.findByPlaceholderText(/Ask anything/i);
    fireEvent.change(textarea, { target: { value: 'trigger error' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(await screen.findByText('Stream failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows session skeletons while sessions are loading', async () => {
    // Never-resolving promise keeps loadingSessions true
    api.getSessions.mockReturnValue(new Promise(() => {}));
    render(<Chat />);
    expect(await screen.findByTestId('sessions-skeleton')).toBeInTheDocument();
  });
});
