import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TaskOverviewCard } from '@/components/chat/TaskOverviewCard';
import { TaskPanel } from '@/components/chat/TaskPanel';
import { ToolExecutionCard } from '@/components/chat/ToolExecutionCard';
import { ToolExecutionCardCompact } from '@/components/chat/ToolExecutionCardCompact';
import { useChatStore } from '@/stores/chatStore';
import type { TaskOverview, ToolCall } from '@/types/chat';

const NOW = new Date('2026-06-20T10:00:00+08:00');

function task(overrides: Partial<TaskOverview> = {}): TaskOverview {
  return {
    id: overrides.id ?? 'task-1',
    sessionId: overrides.sessionId ?? 'session-1',
    taskName: overrides.taskName ?? '分析竞品价格走势',
    status: overrides.status ?? 'in_progress',
    startTime: overrides.startTime ?? new Date('2026-06-20T09:55:00+08:00').toISOString(),
    endTime: overrides.endTime,
    relatedProducts: overrides.relatedProducts ?? ['B0TEST123'],
    platform: overrides.platform ?? 'amazon',
    metadata: overrides.metadata ?? { progress: 65, currentStep: '抓取价格历史' },
  };
}

function toolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: overrides.id ?? 'tool-1',
    name: overrides.name ?? 'searchProducts',
    input: overrides.input ?? { query: 'wireless earbuds' },
    result: overrides.result ?? { count: 2, products: ['A', 'B'] },
    isError: overrides.isError,
    durationMs: overrides.durationMs ?? 1250,
  };
}

describe('TaskPanel and tool cards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal('confirm', vi.fn(() => true));
    localStorage.clear();
    useChatStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders task overview data and action callbacks', () => {
    const onViewDetail = vi.fn();
    const onCancel = vi.fn();

    render(
      <TaskOverviewCard
        task={task()}
        onViewDetail={onViewDetail}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('分析竞品价格走势')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('抓取价格历史')).toBeInTheDocument();
    expect(screen.getByText('B0TEST123')).toBeInTheDocument();
    expect(screen.getByText('amazon')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /查看详情/ }));
    fireEvent.click(screen.getByRole('button', { name: /取消/ }));

    expect(onViewDetail).toHaveBeenCalledWith('task-1');
    expect(onCancel).toHaveBeenCalledWith('task-1');
  });

  it('switches TaskPanel tabs and renders tool execution summaries', () => {
    const onViewTaskDetail = vi.fn();
    const onViewToolDetail = vi.fn();
    const currentTool = toolCall();

    render(
      <TaskPanel
        tasks={[task()]}
        toolExecutions={[currentTool]}
        onViewTaskDetail={onViewTaskDetail}
        onViewToolDetail={onViewToolDetail}
      />
    );

    expect(screen.getByText('任务管理')).toBeInTheDocument();
    expect(screen.getByText('分析竞品价格走势')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /工具执行/ }));

    expect(screen.getByText('工具执行 (1)')).toBeInTheDocument();
    expect(screen.getByText('searchProducts')).toBeInTheDocument();
    expect(screen.getByText('query: wireless earbuds')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /查看结果/ }));
    expect(onViewToolDetail).toHaveBeenCalledWith('tool-1');
  });

  it('defaults to tool executions when there are tools but no tasks', () => {
    render(<TaskPanel tasks={[]} toolExecutions={[toolCall({ name: 'queryDatabase' })]} />);

    expect(screen.getByRole('heading', { name: '工具执行 (1)' })).toBeInTheDocument();
    expect(screen.getByText('queryDatabase')).toBeInTheDocument();
    expect(screen.queryByText('暂无任务')).not.toBeInTheDocument();
  });

  it('auto-switches to tool executions when tools arrive for an empty task panel', () => {
    const { rerender } = render(<TaskPanel tasks={[]} toolExecutions={[]} />);

    expect(screen.getByText('暂无任务')).toBeInTheDocument();

    rerender(<TaskPanel tasks={[]} toolExecutions={[toolCall({ id: 'late-tool' })]} />);

    expect(screen.getByRole('heading', { name: '工具执行 (1)' })).toBeInTheDocument();
    expect(screen.getByText('searchProducts')).toBeInTheDocument();
    expect(screen.queryByText('暂无任务')).not.toBeInTheDocument();
  });

  it('preserves manual tab selection when tool executions arrive later', () => {
    const { rerender } = render(<TaskPanel tasks={[]} toolExecutions={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /任务概览/ }));
    rerender(<TaskPanel tasks={[]} toolExecutions={[toolCall({ id: 'manual-tool' })]} />);

    expect(screen.getByText('暂无任务')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '工具执行 (1)' })).not.toBeInTheDocument();
  });

  it('recomputes the default tab after the chat session changes', () => {
    const firstSession = {
      sessionId: 'session-a',
      tasks: [] as TaskOverview[],
      toolExecutions: [] as ToolCall[],
    };
    const secondSession = {
      sessionId: 'session-b',
      tasks: [] as TaskOverview[],
      toolExecutions: [toolCall({ id: 'new-session-tool', name: 'queryDatabase' })],
    };
    const { rerender } = render(<TaskPanel {...firstSession} />);

    fireEvent.click(screen.getByRole('button', { name: /任务概览/ }));
    rerender(<TaskPanel {...secondSession} />);

    expect(screen.getByRole('heading', { name: '工具执行 (1)' })).toBeInTheDocument();
    expect(screen.getByText('queryDatabase')).toBeInTheDocument();
    expect(screen.queryByText('暂无任务')).not.toBeInTheDocument();
  });

  it('syncs detailed and compact tool card status through the chat store', () => {
    const currentTool = toolCall({ id: 'shared-tool' });

    useChatStore.getState().updateToolExecutionState('shared-tool', {
      status: 'running',
      startTime: NOW.getTime(),
    });

    const { rerender } = render(
      <div>
        <ToolExecutionCard toolCall={currentTool} />
        <ToolExecutionCardCompact toolCall={currentTool} onViewResult={vi.fn()} />
      </div>
    );

    expect(screen.getAllByText('运行中')).toHaveLength(2);

    useChatStore.getState().updateToolExecutionState('shared-tool', {
      status: 'success',
      endTime: NOW.getTime() + 900,
      durationMs: 900,
    });

    rerender(
      <div>
        <ToolExecutionCard toolCall={currentTool} />
        <ToolExecutionCardCompact toolCall={currentTool} onViewResult={vi.fn()} />
      </div>
    );

    expect(screen.getAllByText('已完成')).toHaveLength(2);
  });

  it('collapses and expands the detailed tool execution card', () => {
    render(<ToolExecutionCard toolCall={toolCall()} />);

    // 默认收起状态：看不到输入和结果
    expect(screen.queryByText('输入')).not.toBeInTheDocument();
    expect(screen.queryByText('结果')).not.toBeInTheDocument();

    // 点击展开
    fireEvent.click(screen.getByRole('button', { name: '展开' }));
    expect(screen.getByText('输入')).toBeInTheDocument();
    expect(screen.getByText('结果')).toBeInTheDocument();

    // 点击折叠
    fireEvent.click(screen.getByRole('button', { name: '折叠' }));
    expect(screen.queryByText('输入')).not.toBeInTheDocument();
    expect(screen.queryByText('结果')).not.toBeInTheDocument();
  });

  it('renders empty and loading states in the task panel', () => {
    const { rerender } = render(<TaskPanel tasks={[]} toolExecutions={[]} />);

    expect(screen.getByText('暂无任务')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /工具执行/ }));
    expect(screen.getByText('暂无工具执行')).toBeInTheDocument();

    rerender(<TaskPanel tasks={[]} toolExecutions={[]} loading />);
    fireEvent.click(screen.getByRole('button', { name: /任务概览/ }));
    const skeletonHost = screen.getByRole('heading', { name: '任务概览' }).closest('div');
    expect(skeletonHost).toBeInTheDocument();
    expect(within(skeletonHost as HTMLElement).queryByText('暂无任务')).not.toBeInTheDocument();
  });
});
