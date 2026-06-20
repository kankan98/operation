/**
 * TaskOverviewCard - 任务概览卡片组件
 *
 * 显示任务的关键信息：名称、状态、时间、关联产品、平台
 * 提供操作：查看详情、取消任务
 */

import React from 'react';
import {
  Clock,
  Package,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import { TaskOverview, TaskStatus } from '@/types/chat';
import { formatRelativeTime, formatDuration } from '@/utils/timeFormat';

interface TaskOverviewCardProps {
  task: TaskOverview;
  onViewDetail?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

// 状态配置
const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  pending: {
    label: '等待中',
    icon: Circle,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: 'text-gray-500',
  },
  in_progress: {
    label: '进行中',
    icon: Loader2,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
  },
  failed: {
    label: '失败',
    icon: XCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
  },
  cancelled: {
    label: '已取消',
    icon: AlertCircle,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: 'text-gray-500',
  },
};

// 平台图标映射
const platformIcons: Record<string, string> = {
  amazon: '🛒',
  shopify: '🛍️',
  ebay: '🏪',
  walmart: '🏬',
};

export const TaskOverviewCard: React.FC<TaskOverviewCardProps> = ({
  task,
  onViewDetail,
  onCancel,
}) => {
  const [currentTime] = React.useState(() => Date.now());
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  // 计算任务耗时
  const duration = task.endTime
    ? new Date(task.endTime).getTime() - new Date(task.startTime).getTime()
    : currentTime - new Date(task.startTime).getTime();

  const durationText = formatDuration(Math.floor(duration / 1000));

  // 进度百分比（如果有）
  const progress = task.metadata?.progress as number | undefined;

  return (
    <div
      id={`task-${task.id}`}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* 标题和状态 */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex-1 pr-2 line-clamp-2">
          {task.taskName}
        </h3>

        {/* 状态指示器 */}
        <div
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
            ${config.bgColor} ${config.textColor}
          `}
        >
          <StatusIcon
            className={`w-3.5 h-3.5 ${config.iconColor} ${
              task.status === 'in_progress' ? 'animate-spin' : ''
            }`}
          />
          <span>{config.label}</span>
        </div>
      </div>

      {/* 进度条（如果有进度信息） */}
      {progress !== undefined && task.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>进度</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {task.metadata?.currentStep !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {typeof task.metadata.currentStep === 'string'
                ? task.metadata.currentStep
                : String(task.metadata.currentStep)}
            </p>
          )}
        </div>
      )}

      {/* 详细信息 */}
      <div className="space-y-2 mb-3">
        {/* 开始时间 */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{formatRelativeTime(task.startTime)}</span>
          {task.status !== 'pending' && <span className="text-gray-400">·</span>}
          {task.status !== 'pending' && <span>{durationText}</span>}
        </div>

        {/* 关联产品 */}
        {task.relatedProducts && task.relatedProducts.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {task.relatedProducts.length === 1
                ? task.relatedProducts[0]
                : `${task.relatedProducts.length} 个产品`}
            </span>
          </div>
        )}

        {/* 平台标识 */}
        {task.platform && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-base">{platformIcons[task.platform.toLowerCase()] || '🌐'}</span>
            <span className="capitalize">{task.platform}</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {onViewDetail && (
          <button
            onClick={() => onViewDetail(task.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
              text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            查看详情
          </button>
        )}

        {onCancel && task.status === 'in_progress' && (
          <button
            onClick={() => {
              if (confirm('确定要取消这个任务吗？')) {
                onCancel(task.id);
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
              text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        )}
      </div>
    </div>
  );
};

// 骨架屏
export const TaskOverviewCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="h-8 bg-gray-200 rounded flex-1" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
};

// 空状态
export const TaskOverviewEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">暂无任务</p>
      <p className="text-xs text-gray-500">当前会话还没有创建任务</p>
    </div>
  );
};
