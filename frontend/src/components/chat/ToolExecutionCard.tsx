/**
 * ToolExecutionCard - 工具执行卡片组件（详细版）
 *
 * 用于消息流中显示工具执行的完整信息
 * 特点：淡绿色背景、14px圆角、双列布局、可折叠
 * 状态同步：通过 Zustand Store 的 toolExecutionState 实现双卡片同步
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Copy,
  Search,
  BarChart,
  Mail,
  Database,
  FileText,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { ToolCall } from '@/types/chat';
import { formatMilliseconds } from '@/utils/timeFormat';
import { useChatStore } from '@/stores/chatStore';

interface ToolExecutionCardProps {
  toolCall: ToolCall;
  isRunning?: boolean;
}

// 工具图标映射
const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  searchProducts: Search,
  analyzeData: BarChart,
  sendEmail: Mail,
  queryDatabase: Database,
  generateReport: FileText,
  updateSettings: Settings,
  search: Search,
  analyze: BarChart,
};

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({
  toolCall,
  isRunning = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedFunction, setCopiedFunction] = useState(false);

  // 从store获取工具执行状态（用于双卡片同步）
  const toolState = useChatStore((state) =>
    state.toolExecutionState[toolCall.id]
  );

  // 状态判断
  const hasResult = toolCall.result !== undefined;
  const isError = toolCall.isError || false;
  const isSuccess = hasResult && !isError;

  // 格式化 JSON
  const formatJson = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // 截断长文本
  const truncateText = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 格式化显示值 - 必须在使用前定义
  const formatValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">-</span>;

    if (typeof value === 'object') {
      return (
        <pre className="mt-1 p-2 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto border border-gray-200">
          {formatJson(value)}
        </pre>
      );
    }

    const strValue = String(value);
    return <span className="break-words">{truncateText(strValue, 150)}</span>;
  };

  const formattedErrorResult = toolCall.result ? formatValue(toolCall.result) : null;
  const formattedSuccessResult = toolCall.result ? formatValue(toolCall.result) : null;

  // 状态配置 - 按照 chat-style.md 规范
  const statusConfig = {
    running: {
      icon: Loader2,
      label: '运行中',
      chipBg: 'bg-[#f4f1ff]',
      chipText: 'text-[#6e54ee]',
      iconBg: 'bg-[#f4f1ff]',
      iconColor: 'text-[#6e54ee]',
      cardBorder: 'border-[#a891ff]',
      cardBg: 'bg-gradient-to-b from-[#f8f6ff] to-white',
    },
    success: {
      icon: CheckCircle2,
      label: '已完成',
      chipBg: 'bg-[#ecfdf3]',
      chipText: 'text-[#16a34a]',
      iconBg: 'bg-[#ecfdf3]',
      iconColor: 'text-[#22c55e]',
      cardBorder: 'border-[#86efac]',
      cardBg: 'bg-gradient-to-b from-[#f8fffb] to-white',
    },
    error: {
      icon: XCircle,
      label: '失败',
      chipBg: 'bg-[#fef2f2]',
      chipText: 'text-[#dc2626]',
      iconBg: 'bg-[#fef2f2]',
      iconColor: 'text-[#ef4444]',
      cardBorder: 'border-[#fca5a5]',
      cardBg: 'bg-gradient-to-b from-[#fef2f2] to-white',
    },
    pending: {
      icon: AlertCircle,
      label: '等待确认',
      chipBg: 'bg-[#fff7ed]',
      chipText: 'text-[#f59e0b]',
      iconBg: 'bg-[#fff7ed]',
      iconColor: 'text-[#f59e0b]',
      cardBorder: 'border-[#fcd34d]',
      cardBg: 'bg-gradient-to-b from-[#fffbeb] to-white',
    },
  };

  const status = toolState?.status || (isRunning ? 'running' : isSuccess ? 'success' : isError ? 'error' : 'running');
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // 获取工具图标
  const ToolIcon = toolIconMap[toolCall.name] || Settings;

  // 复制函数名
  const handleCopyFunction = async () => {
    await navigator.clipboard.writeText(toolCall.name);
    setCopiedFunction(true);
    setTimeout(() => setCopiedFunction(false), 2000);
  };

  return (
    <div
      id={`tool-${toolCall.id}`}
      className={`
        max-w-[820px] rounded-[14px] border ${config.cardBorder} ${config.cardBg}
        shadow-[0_8px_22px_rgba(34,197,94,0.08)] p-[18px]
        transition-all duration-200
      `}
    >
      {/* 顶部信息行 */}
      <div className="flex items-center gap-3">
        {/* 工具图标 - 34x34px 圆角容器 */}
        <div
          className={`
            w-[34px] h-[34px] rounded-[10px] ${config.iconBg}
            flex items-center justify-center flex-shrink-0
          `}
        >
          <ToolIcon
            className={`
              w-5 h-5 ${config.iconColor}
              ${status === 'running' ? 'animate-spin' : ''}
            `}
          />
        </div>

        {/* 工具名称和函数名 */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#111827]">
            {toolCall.name}
          </h4>
          <button
            onClick={handleCopyFunction}
            className="text-xs text-[#7b8494] font-mono hover:text-[#6e54ee] transition-colors
              flex items-center gap-1 group"
            title="点击复制函数名"
          >
            <span className="truncate">{toolCall.name}</span>
            {copiedFunction ? (
              <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
            )}
          </button>
        </div>

        {/* 状态chip - 高度24px，圆角999px */}
        <div
          className={`
            flex items-center gap-1.5 h-6 px-[9px] rounded-full
            ${config.chipBg} ${config.chipText}
            text-xs font-semibold flex-shrink-0
          `}
        >
          <StatusIcon
            className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`}
          />
          <span>{config.label}</span>
        </div>

        {/* 折叠按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            hover:bg-white/50 transition-colors flex-shrink-0"
          aria-label={isExpanded ? '折叠' : '展开'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* 输入/结果两列布局 */}
      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-6 mt-[18px]">
            {/* 左列：输入 */}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#7b8494] mb-2">输入</div>
              <div className="space-y-2 text-[13px]">
                {Object.entries(toolCall.input || {}).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium text-[#111827]">{key}:</span>{' '}
                    <span className="text-[#111827]">
                      {formatValue(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(toolCall.input || {}).length === 0 && (
                  <div className="text-gray-500 italic text-sm">无输入参数</div>
                )}
              </div>
            </div>

            {/* 分割线 + 右列：结果 */}
            <div className="relative min-w-0 pl-6 border-l border-[#e7e8ee]">
              <div className="text-xs font-semibold text-[#7b8494] mb-2">结果</div>
              <div className="text-[13px]">
                {status === 'running' && !hasResult ? (
                  <div className="flex items-center gap-2 text-gray-500 italic">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>执行中...</span>
                  </div>
                ) : isError ? (
                  <div className="text-[#dc2626]">
                    <div className="flex items-center gap-1 mb-1 font-medium">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>执行失败</span>
                    </div>
                    {formattedErrorResult && (
                      <div className="text-xs mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        {formattedErrorResult}
                      </div>
                    )}
                  </div>
                ) : toolCall.result ? (
                  <div className="text-[#111827]">
                    {formattedSuccessResult}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">无返回结果</div>
                )}
              </div>
            </div>
          </div>

          {/* 底部耗时 */}
          {toolCall.durationMs !== undefined && (
            <div className="flex items-center gap-1 text-xs text-[#7b8494] pt-3 mt-3 border-t border-gray-100">
              <Clock className="w-3.5 h-3.5" />
              <span>耗时 {formatMilliseconds(toolCall.durationMs)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
