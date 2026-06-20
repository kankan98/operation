import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TaskSummaryBlock } from '@/components/chat/TaskSummaryBlock';
import { NumberedQuestionList } from '@/components/chat/NumberedQuestionList';
import { CheckList, InteractiveCheckList } from '@/components/chat/CheckList';
import { EnhancedMessageCard } from '@/components/chat/EnhancedMessageCard';
import type { ChatMessage } from '@/types/chat';

function assistantMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: overrides.id ?? 'message-1',
    sessionId: overrides.sessionId ?? 'session-1',
    role: overrides.role ?? 'assistant',
    content: overrides.content ?? '这是回答内容',
    timestamp: overrides.timestamp ?? Date.now(),
    taskSummary: overrides.taskSummary,
    toolCalls: overrides.toolCalls,
  };
}

describe('message enhancement components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T10:00:00+08:00'));
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders task summary and numbered question components', () => {
    render(
      <>
        <TaskSummaryBlock title="任务摘要" content="完成竞品价格分析" />
        <NumberedQuestionList
          questions={[
            { question: '价格是否异常？', description: '检查近7天波动' },
            { question: '是否需要预警？' },
          ]}
        />
      </>
    );

    expect(screen.getByText('任务摘要')).toBeInTheDocument();
    expect(screen.getByText('完成竞品价格分析')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('价格是否异常？')).toBeInTheDocument();
    expect(screen.getByText('检查近7天波动')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('是否需要预警？')).toBeInTheDocument();
  });

  it('renders checked and unchecked list states and supports interaction', () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <CheckList
        items={[
          { text: '已完成采集', checked: true },
          { text: '等待复核', checked: false },
        ]}
      />
    );

    const completed = screen.getByText('已完成采集');
    expect(completed).toHaveClass('line-through');
    expect(screen.getByText('等待复核')).not.toHaveClass('line-through');

    rerender(
      <InteractiveCheckList
        items={[{ text: '点击切换', checked: false }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '点击切换' }));
    expect(onChange).toHaveBeenCalledWith(0, true);
  });

  it('renders EnhancedMessageCard task summary, questions, markdown link, and table', () => {
    render(
      <EnhancedMessageCard
        message={assistantMessage({
          content:
            '请查看 [Amazon](https://amazon.com)\n\n| 指标 | 值 |\n| --- | --- |\n| 价格 | 99 |',
          taskSummary: {
            title: '调研摘要',
            description: '已经完成核心指标整理',
            questions: ['下一步是否创建预警？', '是否扩展到Shopify？'],
          },
        })}
      />
    );

    expect(screen.getByText('调研摘要')).toBeInTheDocument();
    expect(screen.getByText('已经完成核心指标整理')).toBeInTheDocument();
    expect(screen.getByText('下一步是否创建预警？')).toBeInTheDocument();
    expect(screen.getByText('是否扩展到Shopify？')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Amazon/ })).toHaveAttribute(
      'href',
      'https://amazon.com'
    );
    expect(screen.getByText('指标')).toBeInTheDocument();
    expect(screen.getByText('价格')).toBeInTheDocument();
  });

  it('copies assistant message text from the action row', async () => {
    render(
      <EnhancedMessageCard
        message={assistantMessage({ content: '需要复制的内容' })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '复制消息' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('需要复制的内容');
  });
});
