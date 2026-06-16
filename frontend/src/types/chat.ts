/**
 * Frontend-specific chat types
 *
 * 注意：ToolCall, ToolResult, AgentStatus, TokenUsage 等通用类型已迁移到 shared/types/sse-protocol.ts
 * 这里只保留前端特有的 UI 状态类型
 */

/**
 * 工具调用（前端扩展版本，用于 UI 显示）
 */
export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, unknown>;
  startTime?: number;
  result?: unknown;
  isError?: boolean;
  endTime?: number;
  durationMs?: number;
}

/**
 * 工具结果
 */
export interface ToolResult {
  toolCallId: string;
  output?: unknown;
  isError?: boolean;
  endTime?: number;
  durationMs?: number;
}

/**
 * 工具卡片状态（UI 组件使用）
 */
export interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}

/**
 * 工具执行状态（Zustand store 使用）
 */
export interface ToolExecutionState {
  [toolCallId: string]: {
    status: 'running' | 'success' | 'error';
    startTime: number;
    endTime?: number;
    durationMs?: number;
  };
}

/**
 * 代理状态类型
 */
export type AgentStatusType = 'idle' | 'thinking' | 'tool_calling' | 'writing';

/**
 * Token 使用统计
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

