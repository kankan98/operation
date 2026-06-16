import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  TrendingUp,
  Bell,
  Package,
  FileText,
  BarChart3,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCall, ToolResult } from '@/types/chat';

interface ToolCallCardProps {
  toolCall: ToolCall;
  toolResult?: ToolResult;
  executionState?: {
    status: 'running' | 'success' | 'error';
    startTime: number;
    endTime?: number;
    durationMs?: number;
  };
}

// 工具图标映射
const TOOL_ICONS: Record<string, typeof Search> = {
  searchProducts: Search,
  getProductDetails: Package,
  analyzePriceTrend: TrendingUp,
  createAlert: Bell,
  getAlertsList: Bell,
  addProductMonitoring: Package,
  getCompetitorAnalysis: BarChart3,
  getMarketInsights: BarChart3,
  queryDatabase: Database,
  generateReport: FileText,
};

// 工具描述映射
const TOOL_DESCRIPTIONS: Record<string, string> = {
  searchProducts: '搜索产品',
  getProductDetails: '获取产品详情',
  analyzePriceTrend: '分析价格趋势',
  createAlert: '创建价格提醒',
  getAlertsList: '获取提醒列表',
  addProductMonitoring: '添加产品监控',
  getCompetitorAnalysis: '竞品分析',
  getMarketInsights: '市场洞察',
  queryDatabase: '查询数据库',
  generateReport: '生成报告',
};

/**
 * ToolCallCard - 显示工具调用详情的卡片组件
 *
 * 功能：
 * - 显示工具图标、名称和状态
 * - 可折叠的参数和结果展示
 * - 实时执行时长显示
 * - 三种状态：running（运行中）、success（成功）、error（错误）
 * - 支持大型结果的截断和"加载更多"
 *
 * 设计规范：
 * - 卡片圆角：20px
 * - 内边距：24px
 * - 阴影：Elevation 1（静止）、Elevation 2（悬停）
 * - 状态颜色：蓝色（运行）、绿色（成功）、红色（错误）
 * - 动画：150-250ms ease-out
 */
export function ToolCallCard({ toolCall, toolResult, executionState }: ToolCallCardProps) {
  const [isParamsExpanded, setIsParamsExpanded] = useState(false);
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [showFullResult, setShowFullResult] = useState(false);

  const Icon = TOOL_ICONS[toolCall.name] || Package;
  const description = TOOL_DESCRIPTIONS[toolCall.name] || toolCall.name;

  // 确定当前状态
  const status = executionState?.status || (toolResult ? (toolResult.isError ? 'error' : 'success') : 'running');

  // 实时更新当前时间（仅在运行中）
  useEffect(() => {
    if (status === 'running' && executionState?.startTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status, executionState?.startTime]);

  // 计算执行时长（派生状态，不使用 effect）
  const elapsedTime = (() => {
    if (status === 'running' && executionState?.startTime) {
      return currentTime - executionState.startTime;
    } else if (executionState?.durationMs) {
      return executionState.durationMs;
    }
    return 0;
  })();

  // 状态配置
  const statusConfig = {
    running: {
      borderColor: 'border-blue-300',
      bgColor: 'bg-blue-50',
      icon: Loader2,
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      label: '运行中',
      animate: true,
    },
    success: {
      borderColor: 'border-green-300',
      bgColor: 'bg-green-50',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-700',
      label: '完成',
      animate: false,
    },
    error: {
      borderColor: 'border-red-300',
      bgColor: 'bg-red-50',
      icon: XCircle,
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      label: '失败',
      animate: false,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // 格式化时长
  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // 判断是否需要警告（执行超过10秒）
  const showWarning = status === 'running' && elapsedTime > 10000;

  // 格式化 JSON
  const formatJson = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // 截断大型结果
  const MAX_LINES = 50;
  const resultText = toolResult?.output ? formatJson(toolResult.output) : '';
  const resultLines = resultText.split('\n');
  const isTruncated = resultLines.length > MAX_LINES;
  const displayedResult = showFullResult
    ? resultText
    : resultLines.slice(0, MAX_LINES).join('\n');

  // 参数数量
  const paramCount = toolCall.input ? Object.keys(toolCall.input).length : 0;

  return (
    <div
      className={cn(
        'rounded-[20px] border-2 p-6 transition-all duration-200',
        config.borderColor,
        config.bgColor,
        'shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
        'hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* 工具图标 */}
          <div className={cn(
            'p-2 rounded-lg',
            config.badgeBg
          )}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>

          {/* 工具名称和描述 */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-fg">{description}</div>
            <div className="text-xs text-fg-muted mt-0.5">{toolCall.name}</div>
          </div>
        </div>

        {/* 状态徽章 */}
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
          config.badgeBg,
          config.badgeText
        )}>
          <StatusIcon
            className={cn(
              'h-3.5 w-3.5',
              config.animate && 'animate-spin'
            )}
          />
          {config.label}
        </div>
      </div>

      {/* 执行时长 */}
      <div className="flex items-center gap-2 mb-3">
        {status === 'running' && (
          <div className="text-xs text-fg-muted">
            运行中 {formatDuration(elapsedTime)}
            {showWarning && (
              <AlertTriangle className="inline-block ml-1 h-3 w-3 text-warning" />
            )}
          </div>
        )}
        {status === 'success' && executionState?.durationMs && (
          <div className="text-xs text-fg-muted">
            耗时 {formatDuration(executionState.durationMs)}
          </div>
        )}
        {status === 'error' && executionState?.durationMs && (
          <div className="text-xs text-fg-muted">
            失败前耗时 {formatDuration(executionState.durationMs)}
          </div>
        )}
      </div>

      {/* 参数展示 */}
      {toolCall.input && paramCount > 0 && (
        <details
          className="mb-3"
          open={isParamsExpanded}
          onToggle={(e) => setIsParamsExpanded((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-fg-muted mb-2 hover:text-fg transition-colors">
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isParamsExpanded && 'rotate-180'
              )}
            />
            展开参数 ({paramCount})
          </summary>
          <pre className="bg-surface rounded-lg p-3 text-xs overflow-x-auto border border-border">
            <code>{formatJson(toolCall.input)}</code>
          </pre>
        </details>
      )}

      {toolCall.input && paramCount === 0 && (
        <div className="text-xs text-fg-subtle mb-3">无参数</div>
      )}

      {/* 结果展示 */}
      {toolResult && (
        <details
          open={isResultExpanded}
          onToggle={(e) => setIsResultExpanded((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-fg-muted mb-2 hover:text-fg transition-colors">
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isResultExpanded && 'rotate-180'
              )}
            />
            {toolResult.isError ? '错误信息' : '查看详情'}
          </summary>

          <div className={cn(
            'rounded-lg p-3 text-xs border',
            toolResult.isError ? 'bg-red-50 border-red-200' : 'bg-surface border-border'
          )}>
            <pre className="overflow-x-auto">
              <code className={toolResult.isError ? 'text-red-700' : ''}>
                {displayedResult}
              </code>
            </pre>

            {isTruncated && !showFullResult && (
              <button
                onClick={() => setShowFullResult(true)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                加载更多 ({resultLines.length - MAX_LINES} 行)
              </button>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
