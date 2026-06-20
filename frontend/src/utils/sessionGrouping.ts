/**
 * 会话分组工具函数
 * 根据时间和置顶状态对会话进行分组
 */

import { ChatSession } from '../types/chat';

export type SessionGroup = 'pinned' | 'today' | 'yesterday' | 'earlier';

export interface GroupedSessions {
  pinned: ChatSession[];
  today: ChatSession[];
  yesterday: ChatSession[];
  earlier: ChatSession[];
}

/**
 * 判断日期是否为今天
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * 判断日期是否为昨天
 */
function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * 获取会话所属的分组
 */
export function getSessionGroup(session: ChatSession): SessionGroup {
  // 置顶会话优先
  if (session.isPinned) {
    return 'pinned';
  }

  // 确保 updatedAt 存在，否则使用 createdAt
  const timestamp = session.updatedAt || session.createdAt;
  const updatedAt = new Date(timestamp);

  if (isToday(updatedAt)) {
    return 'today';
  }

  if (isYesterday(updatedAt)) {
    return 'yesterday';
  }

  return 'earlier';
}

/**
 * 对会话列表进行分组
 * @param sessions - 会话列表
 * @returns 分组后的会话对象
 */
export function groupSessions(sessions: ChatSession[]): GroupedSessions {
  const grouped: GroupedSessions = {
    pinned: [],
    today: [],
    yesterday: [],
    earlier: [],
  };

  // 按更新时间降序排序
  const sorted = [...sessions].sort((a, b) => {
    const timeA = a.updatedAt || a.createdAt;
    const timeB = b.updatedAt || b.createdAt;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  // 分组
  sorted.forEach((session) => {
    const group = getSessionGroup(session);
    grouped[group].push(session);
  });

  return grouped;
}

/**
 * 获取分组的显示名称
 */
export function getGroupLabel(group: SessionGroup): string {
  const labels: Record<SessionGroup, string> = {
    pinned: '置顶',
    today: '今天',
    yesterday: '昨日',
    earlier: '更早',
  };
  return labels[group];
}

/**
 * 过滤会话（搜索功能）
 * @param sessions - 会话列表
 * @param query - 搜索关键词
 * @returns 过滤后的会话列表
 */
export function filterSessions(
  sessions: ChatSession[],
  query: string
): ChatSession[] {
  if (!query.trim()) {
    return sessions;
  }

  const lowerQuery = query.toLowerCase().trim();

  return sessions.filter((session) => {
    // 搜索会话标题
    if (session.title?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜索预览文本
    const previewText = session.previewText || session.lastMessagePreview;
    if (previewText?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // 搜索标签
    if (session.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });
}
