import { Brain, Wrench, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  status: 'thinking' | 'tool_calling' | 'writing';
  context?: string;  // 可选：额外的上下文信息（如工具名称）
}

/**
 * AgentStatusIndicator - 显示 AI 代理当前状态的徽章组件
 *
 * 支持三种状态：
 * - thinking: 正在思考（紫色主题，脑图标，脉冲动画）
 * - tool_calling: 正在调用工具（蓝色主题，扳手图标，旋转动画）
 * - writing: 正在撰写回复（绿色主题，笔图标）
 *
 * 遵循设计系统规范：
 * - 徽章圆角：999px（完全圆角）
 * - Agent Purple 主色：#7C3AED（Primary-600）
 * - 动画：150-250ms ease-out
 * - 响应式：移动端显示紧凑版本
 */
export function AgentStatusIndicator({ status, context }: AgentStatusIndicatorProps) {
  const statusConfig = {
    thinking: {
      icon: Brain,
      text: '正在思考...',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      animate: 'animate-pulse',
    },
    tool_calling: {
      icon: Wrench,
      text: context ? `正在调用工具：${context}` : '正在调用工具...',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      animate: 'animate-spin-slow',
    },
    writing: {
      icon: PenLine,
      text: '正在撰写回复...',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      animate: '',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200',
        config.bgColor,
        config.borderColor,
        'animate-fade-in'
      )}
      role="status"
      aria-live="polite"
      aria-label={config.text}
    >
      {/* 动画图标 */}
      <Icon
        className={cn(
          'h-4 w-4',
          config.iconColor,
          config.animate
        )}
        aria-hidden="true"
      />

      {/* 状态文本 - 桌面端显示 */}
      <span className={cn(
        'text-sm font-medium hidden sm:inline',
        config.textColor
      )}>
        {config.text}
      </span>

      {/* 状态文本 - 移动端紧凑版本 */}
      <span className={cn(
        'text-xs font-medium sm:hidden',
        config.textColor
      )}>
        {status === 'thinking' && '思考中'}
        {status === 'tool_calling' && '工具'}
        {status === 'writing' && '撰写中'}
      </span>
    </div>
  );
}
