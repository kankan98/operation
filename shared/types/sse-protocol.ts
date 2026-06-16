/**
 * SSE 流式协议类型定义
 *
 * 版本：2.0.0
 *
 * 设计原则：
 * 1. 所有事件类型使用统一后缀 (_start, _change, _delta, _complete, _occurred)
 * 2. 所有时间戳使用毫秒级 Unix timestamp
 * 3. 所有 ID 由后端生成（messageId, sessionId, streamId, toolId）
 * 4. 工具参数不流式传输，一次性发送完整参数
 */

// ============================================================
//                      基础类型
// ============================================================

/**
 * 代理状态类型
 */
export type AgentStatus = 'idle' | 'thinking' | 'tool_calling' | 'writing';

/**
 * 工具调用参数
 */
export interface ToolParams {
  [key: string]: unknown;
}

/**
 * 工具调用结果
 */
export interface ToolResult {
  output: unknown;      // 工具输出（可以是任意类型）
  isError: boolean;     // 是否为错误
}

/**
 * 工具时序信息
 */
export interface ToolTiming {
  startTime: number;    // 开始时间（Unix timestamp，毫秒）
  endTime: number;      // 结束时间（Unix timestamp，毫秒）
  durationMs: number;   // 执行耗时（毫秒）
}

/**
 * Token 使用统计
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  totalTokens: number;
}

/**
 * 错误信息
 */
export interface StreamError {
  code: string;         // 错误码（例如：RATE_LIMIT_EXCEEDED）
  message: string;      // 错误消息
  retryable: boolean;   // 是否可重试
  retryAfter?: number;  // 可选：建议重试等待时间（秒）
}

// ============================================================
//                      SSE 事件类型
// ============================================================

/**
 * 1. message_start - 消息开始（第一个事件）
 *
 * 触发时机：流式处理开始
 * 前端行为：创建空消息占位符，初始化状态
 */
export interface MessageStartEvent {
  type: 'message_start';
  messageId: string;     // 消息 ID（后端生成）
  sessionId: string;     // Session ID（可能是新创建的）
  timestamp: number;     // 事件时间戳
  model: string;         // 使用的模型
  streamId: string;      // Stream ID（用于追踪和调试）
}

/**
 * 2. status_change - 状态变更
 *
 * 触发时机：代理状态变化
 * 前端行为：更新状态指示器
 */
export interface StatusChangeEvent {
  type: 'status_change';
  status: AgentStatus;   // 新状态
  timestamp: number;     // 事件时间戳
  context?: string;      // 可选上下文（例如：工具名称）
}

/**
 * 3. content_delta - 内容增量
 *
 * 触发时机：生成文本内容
 * 前端行为：追加到当前消息
 */
export interface ContentDeltaEvent {
  type: 'content_delta';
  delta: string;         // 文本增量
  timestamp: number;     // 事件时间戳
}

/**
 * 4. tool_start - 工具开始
 *
 * 触发时机：开始执行工具（参数已完整）
 * 前端行为：创建工具卡片，状态为 "running"
 */
export interface ToolStartEvent {
  type: 'tool_start';
  tool: {
    id: string;          // 工具调用 ID
    name: string;        // 工具名称
    params: ToolParams;  // 完整参数
  };
  timestamp: number;     // 事件时间戳（即工具开始时间）
}

/**
 * 5. tool_complete - 工具完成
 *
 * 触发时机：工具执行完成（成功或失败）
 * 前端行为：更新工具卡片状态，显示耗时
 */
export interface ToolCompleteEvent {
  type: 'tool_complete';
  toolId: string;        // 工具调用 ID
  result: ToolResult;    // 工具结果
  timing: ToolTiming;    // 时序信息
  timestamp: number;     // 事件时间戳
}

/**
 * 6. usage_complete - Token 使用统计
 *
 * 触发时机：消息完成前
 * 前端行为：更新 token 显示
 */
export interface UsageCompleteEvent {
  type: 'usage_complete';
  usage: TokenUsage;     // Token 使用统计
  timestamp: number;     // 事件时间戳
}

/**
 * 7. message_complete - 消息完成（最后一个事件）
 *
 * 触发时机：流式处理完成
 * 前端行为：标记完成，关闭连接，状态回到 idle
 */
export interface MessageCompleteEvent {
  type: 'message_complete';
  messageId: string;     // 消息 ID
  timestamp: number;     // 事件时间戳
  metadata: {
    totalTokens: number;
    toolCallsCount: number;
    durationMs: number;  // 总耗时（毫秒）
  };
}

/**
 * 8. error_occurred - 错误发生
 *
 * 触发时机：任何阶段发生错误
 * 前端行为：显示错误提示，根据 retryable 决定是否显示重试按钮
 */
export interface ErrorOccurredEvent {
  type: 'error_occurred';
  error: StreamError;    // 错误信息
  timestamp: number;     // 事件时间戳
}

// ============================================================
//          Chat UI Redesign v2 - 新增事件类型
// ============================================================

/**
 * 9. task_created - 任务创建
 *
 * 触发时机：创建新任务时
 * 前端行为：在任务面板中添加新任务卡片
 */
export interface TaskCreatedEvent {
  type: 'task_created';
  task: {
    id: string;
    sessionId: string;
    taskName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    startTime: number;
    relatedProducts?: string[];
    platform?: string;
  };
  timestamp: number;     // 事件时间戳
}

/**
 * 10. task_update - 任务更新
 *
 * 触发时机：任务状态或信息更新时
 * 前端行为：更新任务面板中的对应任务
 */
export interface TaskUpdateEvent {
  type: 'task_update';
  taskId: string;        // 任务 ID
  updates: {
    status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    endTime?: number;
    metadata?: Record<string, unknown>;
  };
  timestamp: number;     // 事件时间戳
}

/**
 * 11. task_progress - 任务进度更新（可选，高频事件）
 *
 * 触发时机：任务执行过程中进度变化时
 * 前端行为：更新任务进度条
 */
export interface TaskProgressEvent {
  type: 'task_progress';
  taskId: string;        // 任务 ID
  progress: number;      // 进度百分比 (0-100)
  currentStep?: string;  // 当前步骤描述
  timestamp: number;     // 事件时间戳
}

/**
 * 12. tool_execution_detail - 工具执行详情
 *
 * 触发时机：工具执行完成，提供额外的详细信息用于右侧面板同步
 * 前端行为：更新右侧任务面板的紧凑工具卡片
 */
export interface ToolExecutionDetailEvent {
  type: 'tool_execution_detail';
  toolId: string;        // 工具调用 ID
  detail: {
    status: 'success' | 'error';
    durationMs: number;
    inputSummary: string;   // 输入参数摘要
    outputSummary: string;  // 输出结果摘要
  };
  timestamp: number;     // 事件时间戳
}

/**
 * SSE 事件联合类型（包含 v2 新增事件）
 */
export type SSEEvent =
  | MessageStartEvent
  | StatusChangeEvent
  | ContentDeltaEvent
  | ToolStartEvent
  | ToolCompleteEvent
  | UsageCompleteEvent
  | MessageCompleteEvent
  | ErrorOccurredEvent
  | TaskCreatedEvent
  | TaskUpdateEvent
  | TaskProgressEvent
  | ToolExecutionDetailEvent;

// ============================================================
//                      API 请求/响应类型
// ============================================================

/**
 * 启动流式消息请求
 */
export interface StartStreamRequest {
  sessionId?: string;    // 可选：Session ID（不提供则自动创建）
  content: string;       // 用户消息内容
}

/**
 * 启动流式消息响应
 */
export interface StartStreamResponse {
  streamId: string;      // Stream ID（用于建立 SSE 连接）
  messageId: string;     // 消息 ID（后端预先生成）
  sessionId: string;     // Session ID（可能是新创建的）
}

// ============================================================
//                      错误码定义
// ============================================================

/**
 * 标准错误码
 */
export enum StreamErrorCode {
  // 客户端错误 (4xx)
  INVALID_REQUEST = 'INVALID_REQUEST',           // 请求参数无效
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',       // Session 不存在
  STREAM_NOT_FOUND = 'STREAM_NOT_FOUND',         // Stream 不存在
  STREAM_EXPIRED = 'STREAM_EXPIRED',             // Stream 已过期

  // 服务端错误 (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',             // 内部错误
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',       // AI 提供商错误
  TOOL_EXECUTION_ERROR = 'TOOL_EXECUTION_ERROR', // 工具执行错误

  // 限流错误
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',   // 超过速率限制

  // 超时错误
  STREAM_TIMEOUT = 'STREAM_TIMEOUT',             // 流式处理超时
}
