/**
 * Backend-specific chat types
 *
 * 注意：ToolCall, ToolResult 等通用类型已迁移到 shared/types/sse-protocol.ts
 * 这里只保留后端特有的类型定义
 */

export interface ChatSession {
  id: string;
  title?: string;
  userId?: string;
  contextSummary?: string;
  createdAt: number;
  updatedAt?: number;
  // Chat UI Redesign v2 新增字段
  isPinned?: boolean;
  tags?: string[];
  lastMessagePreview?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokensUsed?: number;
  timestamp: number;
}

/**
 * 工具调用（后端扩展版本，包含 startTime）
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  startTime?: number;  // 工具开始时间戳
}

/**
 * 工具结果（后端扩展版本，包含完整时序信息）
 */
export interface ToolResult {
  toolCallId: string;
  output: unknown;
  isError?: boolean;
  startTime?: number;    // 工具开始时间戳
  endTime?: number;      // 工具结束时间戳
  durationMs?: number;   // 工具执行耗时（毫秒）
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface StreamEvent {
  type: 'message_start' | 'text_delta' | 'tool_call' | 'tool_call_start' | 'tool_result' | 'status' | 'done' | 'error';
  data?: unknown;
  // message_start 事件字段
  messageId?: string;
  sessionId?: string;
  timestamp?: number;
  model?: string;
  // status 事件字段
  status?: 'thinking' | 'tool_calling' | 'writing';
  context?: string;  // 例如：工具名称
}

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// Chat UI Redesign v2 - Task Management Types
// ============================================================================

/**
 * 任务状态枚举
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * 平台标识枚举
 */
export type Platform = 'amazon' | 'shopify' | 'ebay' | 'walmart';

/**
 * 任务概览
 */
export interface TaskOverview {
  id: string;
  sessionId: string;
  taskName: string;
  status: TaskStatus;
  startTime: number;
  endTime?: number;
  relatedProducts?: string[];
  platform?: Platform;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  sessionId: string;
  taskName: string;
  status?: TaskStatus;
  startTime?: number;
  relatedProducts?: string[];
  platform?: Platform;
  metadata?: Record<string, unknown>;
}

/**
 * 更新任务请求
 */
export interface UpdateTaskRequest {
  status?: TaskStatus;
  endTime?: number;
  taskName?: string;
  relatedProducts?: string[];
  platform?: Platform;
  metadata?: Record<string, unknown>;
}

/**
 * 任务列表响应
 */
export interface TaskListResponse {
  tasks: TaskOverview[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 更新会话请求
 */
export interface UpdateSessionRequest {
  isPinned?: boolean;
  title?: string;
  tags?: string[];
  lastMessagePreview?: string;
}

/**
 * 任务列表查询参数
 */
export interface TaskListQuery {
  sessionId: string;
  limit?: number;
  offset?: number;
  status?: TaskStatus;
}

