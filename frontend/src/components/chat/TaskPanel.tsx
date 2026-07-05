/**
 * TaskPanel - 右侧任务面板容器组件
 *
 * 组合任务概览和工具执行卡片，提供统一的面板布局
 * 包含：任务概览区、工具执行区、未来扩展的笔记区
 */

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TaskOverview, ToolCall } from '@/types/chat';
import {
  TaskOverviewCard,
  TaskOverviewCardSkeleton,
  TaskOverviewEmpty,
} from './TaskOverviewCard';
import {
  ToolExecutionCardCompact,
  ToolExecutionCompactEmpty,
} from './ToolExecutionCardCompact';

interface TaskPanelProps {
  tasks: TaskOverview[];
  toolExecutions: ToolCall[];
  loading?: boolean;
  onViewTaskDetail?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  onViewToolDetail?: (toolId: string) => void;
  onCollapse?: () => void;
  isCollapsed?: boolean;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  toolExecutions,
  loading = false,
  onViewTaskDetail,
  onCancelTask,
  onViewToolDetail,
  onCollapse,
  isCollapsed = false,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'tools'>('tasks');

  // 如果面板被折叠，只显示一个展开按钮
  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <button
          onClick={onCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="展开面板"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#ffffff] border-l border-[#e7e8ee]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-[22px] border-b border-[#e7e8ee]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#111827]">任务管理</h2>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="折叠面板"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${
                activeTab === 'tasks'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            任务概览
            {tasks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#f4f1ff] text-[#6e54ee] rounded text-[11px] font-semibold">
                {tasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${
                activeTab === 'tools'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            工具执行
            {toolExecutions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#ecfdf3] text-[#16a34a] rounded text-[11px] font-semibold">
                {toolExecutions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content - section分隔 */}
      <div className="flex-1 overflow-y-auto px-4 py-[22px]">
        {/* 任务概览 section */}
        {activeTab === 'tasks' && (
          <div className="mb-7">
            <h3 className="text-xs font-semibold text-[#7b8494] uppercase tracking-wide mb-3">
              任务概览
            </h3>
            <div className="space-y-3">
              {loading ? (
                <>
                  <TaskOverviewCardSkeleton />
                  <TaskOverviewCardSkeleton />
                </>
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskOverviewCard
                    key={task.id}
                    task={task}
                    onViewDetail={onViewTaskDetail}
                    onCancel={onCancelTask}
                  />
                ))
              ) : (
                <TaskOverviewEmpty />
              )}
            </div>
          </div>
        )}

        {/* 工具执行 section */}
        {activeTab === 'tools' && (
          <div className="mb-7">
            <h3 className="text-xs font-semibold text-[#7b8494] uppercase tracking-wide mb-3">
              工具执行 {toolExecutions.length > 0 && `(${toolExecutions.length})`}
            </h3>
            <div className="space-y-3">
              {toolExecutions.length > 0 ? (
                toolExecutions.map((toolCall) => (
                  <ToolExecutionCardCompact
                    key={toolCall.id}
                    toolCall={toolCall}
                    onViewResult={onViewToolDetail}
                  />
                ))
              ) : (
                <ToolExecutionCompactEmpty />
              )}
            </div>
          </div>
        )}

        {/* 笔记 section 占位（未来扩展） */}
        {/*
        <div className="mb-7">
          <h3 className="text-xs font-semibold text-[#7b8494] uppercase tracking-wide mb-3">
            笔记
          </h3>
          <div className="text-center py-8">
            <p className="text-xs text-[#9aa3b2] mb-2">暂无笔记</p>
            <button className="text-xs text-[#6e54ee] font-medium hover:underline">
              + 新建笔记
            </button>
          </div>
        </div>
        */}
      </div>
    </div>
  );
};

// 响应式 Drawer 版本（用于 Tablet/Mobile）
export const TaskPanelDrawer: React.FC<
  TaskPanelProps & {
    isOpen: boolean;
    onClose: () => void;
  }
> = ({ isOpen, onClose, ...props }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-y-0 left-0 right-[314px] bg-black/20 z-40"
        onClick={onClose}
        aria-label="关闭任务抽屉遮罩"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[314px] z-50">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭任务抽屉"
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        <TaskPanel {...props} onCollapse={onClose} />
      </div>
    </>
  );
};
