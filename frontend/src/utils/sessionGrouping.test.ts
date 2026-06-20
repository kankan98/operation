import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatSession } from '@/types/chat';
import {
  filterSessions,
  getGroupLabel,
  getSessionGroup,
  groupSessions,
} from './sessionGrouping';

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

describe('sessionGrouping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies pinned, today, yesterday, and earlier sessions', () => {
    expect(getSessionGroup(session({ isPinned: true }))).toBe('pinned');
    expect(getSessionGroup(session({ updatedAt: NOW.getTime() }))).toBe('today');
    expect(
      getSessionGroup(session({ updatedAt: new Date('2026-06-19T12:00:00+08:00').getTime() }))
    ).toBe('yesterday');
    expect(
      getSessionGroup(session({ updatedAt: new Date('2026-06-18T23:59:59+08:00').getTime() }))
    ).toBe('earlier');
  });

  it('groups sessions and sorts each group by updatedAt descending', () => {
    const grouped = groupSessions([
      session({
        id: 'today-old',
        title: 'Today old',
        updatedAt: new Date('2026-06-20T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'today-new',
        title: 'Today new',
        updatedAt: new Date('2026-06-20T09:30:00+08:00').getTime(),
      }),
      session({
        id: 'pinned',
        title: 'Pinned',
        isPinned: true,
        updatedAt: new Date('2026-06-18T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'yesterday',
        title: 'Yesterday',
        updatedAt: new Date('2026-06-19T09:00:00+08:00').getTime(),
      }),
      session({
        id: 'earlier',
        title: 'Earlier',
        updatedAt: new Date('2026-06-18T09:00:00+08:00').getTime(),
      }),
    ]);

    expect(grouped.pinned.map((item) => item.id)).toEqual(['pinned']);
    expect(grouped.today.map((item) => item.id)).toEqual(['today-new', 'today-old']);
    expect(grouped.yesterday.map((item) => item.id)).toEqual(['yesterday']);
    expect(grouped.earlier.map((item) => item.id)).toEqual(['earlier']);
  });

  it('filters sessions by title, preview text, and tags', () => {
    const sessions = [
      session({ id: 'title', title: 'Amazon pricing research' }),
      session({ id: 'preview', title: 'Operations', lastMessagePreview: 'Shopify order issue' }),
      session({ id: 'tag', title: 'Alerts', tags: ['watchlist'] }),
      session({ id: 'none', title: 'Unrelated' }),
    ];

    expect(filterSessions(sessions, 'pricing').map((item) => item.id)).toEqual(['title']);
    expect(filterSessions(sessions, 'shopify').map((item) => item.id)).toEqual(['preview']);
    expect(filterSessions(sessions, 'watch').map((item) => item.id)).toEqual(['tag']);
    expect(filterSessions(sessions, 'missing')).toEqual([]);
  });

  it('uses the required group labels', () => {
    expect(getGroupLabel('pinned')).toBe('置顶');
    expect(getGroupLabel('today')).toBe('今天');
    expect(getGroupLabel('yesterday')).toBe('昨日');
    expect(getGroupLabel('earlier')).toBe('更早');
  });
});
