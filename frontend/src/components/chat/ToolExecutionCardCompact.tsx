/**
 * ToolExecutionCardCompact - 工具执行卡片紧凑版
 *
 * 用于右侧任务面板显示工具执行摘要
 * 特点：简化信息、"查看结果"按钮、与详细版通过store同步
 * 高度约246px，紧凑布局
 */

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
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

interface ToolExecutionCardCompactProps {
  toolCall: ToolCall;
  onViewResult?: (toolCallId: string) => void;
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

// 状态配置 - 与详细卡片保持一致
const statusConfig = {
  running: {
    icon: Loader2,
    label: '运行中',
    chipBg: 'bg-[#f4f1ff]',
    chipText: 'text-[#6e54ee]',
    iconBg: 'bg-[#f4f1ff]',
    iconColor: 'text-[#6e54ee]',
  },
  success: {
    icon: CheckCircle2,
    label: '已完成',
    chipBg: 'bg-[#ecfdf3]',
    chipText: 'text-[#16a34a]',
    iconBg: 'bg-[#ecfdf3]',
    iconColor: 'text-[#22c55e]',
  },
  error: {
    icon: XCircle,
    label: '失败',
    chipBg: 'bg-[#fef2f2]',
    chipText: 'text-[#dc2626]',
    iconBg: 'bg-[#fef2f2]',
    iconColor: 'text-[#ef4444]',
  },
  pending: {
    icon: AlertCircle,
    label: '等待确认',
    chipBg: 'bg-[#fff7ed]',
    chipText: 'text-[#f59e0b]',
    iconBg: 'bg-[#fff7ed]',
    iconColor: 'text-[#f59e0b]',
  },
};

export const ToolExecutionCardCompact: React.FC<ToolExecutionCardCompactProps> = ({
  toolCall,
  onViewResult,
}) => {
  // 从store获取工具执行状态（用于双卡片同步）
  const toolState = useChatStore((state) =>
    state.toolExecutionState[toolCall.id]
  );

  // 状态判断
  const hasResult = toolCall.result !== undefined;
  const isError = toolCall.isError || false;
  const status = toolState?.status || (isError ? 'error' : hasResult ? 'success' : 'running');
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // 获取工具图标
  const ToolIcon = toolIconMap[toolCall.name] || Settings;

  // 生成结果摘要
  const getResultSummary = (): string => {
    if (status === 'running') return '执行中...';
    if (status === 'error') return '执行失败';

    const result = toolCall.result;
    if (!result) return '无返回结果';

    if (Array.isArray(result)) {
      return `找到 ${result.length} 个结果`;
    }
    if (typeof result === 'object') {
      const keys = Object.keys(result);
      return keys.length > 0 ? `返回 ${keys.length} 个字段` : '已完成';
    }

    const strResult = String(result);
    return strResult.length > 30 ? strResult.substring(0, 30) + '...' : strResult;
  };

  // 生成输入摘要
  const getInputSummary = (): string => {
    if (!toolCall.input || Object.keys(toolCall.input).length === 0) {
      return '无参数';
    }

    const firstEntry = Object.entries(toolCall.input)[0];
    if (!firstEntry) return '无参数';

    const [key, value] = firstEntry;
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const summary = `${key}: ${strValue}`;

    return summary.length > 40 ? summary.substring(0, 40) + '...' : summary;
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#e7e8ee] p-3.5 shadow-xs hover:shadow-sm transition-shadow">
      {/* 标题行：工具图标 + 名称 + 状态chip */}
      <div className="flex items-center gap-2 mb-3">
        {/* 工具图标 - 24x24px */}
        <div
          className={`
            w-6 h-6 rounded-lg ${config.iconBg}
            flex items-center justify-center flex-shrink-0
          `}
        >
          <ToolIcon
            className={`
              w-4 h-4 ${config.iconColor}
              ${status === 'running' ? 'animate-spin' : ''}
            `}
          />
        </div>

        {/* 工具名称 */}
        <h4 className="text-[13px] font-semibold text-[#111827] flex-1 truncate">
          {toolCall.name}
        </h4>

        {/* 状态chip - 更小版本 */}
        <div
          className={`
            flex items-center gap-1 h-5 px-2 rounded-full
            ${config.chipBg} ${config.chipText}
            text-[11px] font-semibold flex-shrink-0
          `}
        >
          <StatusIcon
            className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`}
          />
          <span>{config.label}</span>
        </div>
      </div>

      {/* 输入摘要 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-semibold text-[#8b93a3] mb-1">输入</div>
        <div className="text-[12px] text-[#111827] truncate">
          {getInputSummary()}
        </div>
      </div>

      {/* 结果摘要 */}
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-[#8b93a3] mb-1">结果</div>
        <div className={`text-[12px] ${status === 'error' ? 'text-[#dc2626]' : 'text-[#111827]'} truncate`}>
          {getResultSummary()}
        </div>
      </div>

      {/* 底部：耗时 + 查看按钮 */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        {/* 耗时 */}
        {toolCall.durationMs !== undefined ? (
          <div className="flex items-center gap-1 text-[11px] text-[#7b8494]">
            <Clock className="w-3 h-3" />
            <span>{formatMilliseconds(toolCall.durationMs)}</span>
          </div>
        ) : (
          <div></div>
        )}

        {/* 查看结果按钮 - 紫色描边，height 32px */}
        {onViewResult && hasResult && (
          <button
            onClick={() => onViewResult(toolCall.id)}
            className="flex items-center gap-1 h-8 px-3 text-[13px] font-semibold
              text-[#6e54ee] bg-white border border-[#a891ff] rounded-lg
              hover:bg-[#f8f6ff] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            查看结果
          </button>
        )}
      </div>
    </div>
  );
};

// 空状态
export const ToolExecutionCompactEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Settings className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-xs font-medium text-gray-700 mb-1">暂无工具执行</p>
      <p className="text-xs text-gray-500">工具调用结果将显示在这里</p>
    </div>
  );
};

// 骨架屏
export const ToolExecutionCardCompactSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[10px] border border-[#e7e8ee] p-3.5 shadow-xs animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded-lg" />
        <div className="h-4 bg-gray-200 rounded flex-1" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="mb-2.5">
        <div className="h-3 bg-gray-200 rounded w-12 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
      <div className="mb-3">
        <div className="h-3 bg-gray-200 rounded w-12 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="flex justify-between pt-2.5 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
};
