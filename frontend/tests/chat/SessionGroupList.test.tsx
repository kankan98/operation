import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SessionGroupList } from '@/components/chat/SessionGroupList';
import type { ChatSession } from '@/types/chat';
import type { ComponentProps } from 'react';

const NOW = new Date('2026-06-20T10:00:00+08:00');

function session(overrides: Partial<ChatSession>): ChatSession {
  return {
    id: overrides.id ?? 'session-id',
    title: overrides.title,
    createdAt: overrides.createdAt ?? NOW.getTime(),
    updatedAt: overrides.updatedAt ?? NOW.getTime(),
    isPinned: overrides.isPinned,
    tags: overrides.tags,
    previewText: overrides.previewText,
    lastMessagePreview: overrides.lastMessagePreview,
    unreadCount: overrides.unreadCount,
    hasUnread: overrides.hasUnread,
  };
}

function renderList(overrides: Partial<ComponentProps<typeof SessionGroupList>> = {}) {
  const props: ComponentProps<typeof SessionGroupList> = {
    sessions: [
      session({
        id: 'pinned',
        title: 'Pinned research',
        isPinned: true,
        updatedAt: new Date('2026-06-18T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'today',
        title: 'Today pricing',
        lastMessagePreview: 'Amazon price moved',
        updatedAt: new Date('2026-06-20T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'yesterday',
        title: 'Yesterday alerts',
        updatedAt: new Date('2026-06-19T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'earlier',
        title: 'Earlier orders',
        updatedAt: new Date('2026-06-18T09:00:00+08:00').getTime(),
      }),
    ],
    activeSessionId: 'today',
    onSessionSelect: vi.fn(),
    onSessionPin: vi.fn(),
    onSessionDelete: vi.fn(),
    onSessionRename: vi.fn(),
    onNewSession: vi.fn(),
    ...overrides,
  };

  return {
    props,
    ...render(<SessionGroupList {...props} />),
  };
}

describe('SessionGroupList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders sessions in the required groups', () => {
    renderList();

    expect(screen.getByText('置顶')).toBeInTheDocument();
    expect(screen.getByText('今天')).toBeInTheDocument();
    expect(screen.getByText('昨日')).toBeInTheDocument();
    expect(screen.getByText('更早')).toBeInTheDocument();
    expect(screen.getByText('Pinned research')).toBeInTheDocument();
    expect(screen.getByText('Today pricing')).toBeInTheDocument();
    expect(screen.getByText('Yesterday alerts')).toBeInTheDocument();
    expect(screen.getByText('Earlier orders')).toBeInTheDocument();
  });

  it('filters sessions by title and preview text', () => {
    renderList();

    fireEvent.change(screen.getByPlaceholderText('搜索对话...'), {
      target: { value: 'amazon' },
    });

    expect(screen.getByText('Today pricing')).toBeInTheDocument();
    expect(screen.queryByText('Pinned research')).not.toBeInTheDocument();
    expect(screen.queryByText('Yesterday alerts')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('搜索对话...'), {
      target: { value: 'not found' },
    });

    expect(screen.getByText('未找到匹配的对话')).toBeInTheDocument();
  });

  it('calls selection and new-session callbacks', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();
    renderList({ onSessionSelect, onNewSession });

    fireEvent.click(screen.getByText('Pinned research'));
    fireEvent.click(screen.getByRole('button', { name: '新对话' }));

    expect(onSessionSelect).toHaveBeenCalledWith('pinned');
    expect(onNewSession).toHaveBeenCalledTimes(1);
  });

  it('calls pin and unpin callbacks from the operation menu', () => {
    const onSessionPin = vi.fn();
    renderList({ onSessionPin });

    fireEvent.click(screen.getByRole('button', { name: 'Today pricing 操作菜单' }));
    fireEvent.click(screen.getByRole('button', { name: '置顶' }));
    expect(onSessionPin).toHaveBeenCalledWith('today', true);

    fireEvent.click(screen.getByRole('button', { name: 'Pinned research 操作菜单' }));
    fireEvent.click(screen.getByRole('button', { name: '取消置顶' }));
    expect(onSessionPin).toHaveBeenCalledWith('pinned', false);
  });
});
