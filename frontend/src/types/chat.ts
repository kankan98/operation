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
    toolName?: string; // 添加工具名称
    status: 'running' | 'success' | 'error';
    startTime: number;
    endTime?: number;
    durationMs?: number;
    inputSummary?: string;
    outputSummary?: string;
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

// ============================================================================
// Chat UI Redesign - 任务管理类型
// ============================================================================

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * 平台标识
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
  startTime: string; // ISO 8601 字符串
  endTime?: string; // ISO 8601 字符串
  relatedProducts?: string[];
  platform?: string; // 改为 string 以支持更多平台
  metadata?: Record<string, unknown>;
}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  sessionId: string;
  taskName: string;
  status?: TaskStatus;
  startTime?: string;
  relatedProducts?: string[];
  platform?: string; // 改为 string 以支持更多平台
  metadata?: Record<string, unknown>;
}

/**
 * 更新任务请求
 */
export interface UpdateTaskRequest {
  status?: TaskStatus;
  endTime?: string;
  taskName?: string;
  relatedProducts?: string[];
  platform?: string; // 改为 string
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

// ============================================================================
// Chat UI Redesign - 会话分组类型
// ============================================================================

/**
 * 会话分组类型
 */
export type SessionGroup = 'pinned' | 'today' | 'yesterday' | 'older';

/**
 * 分组后的会话
 */
export interface GroupedSessions {
  pinned: ChatSession[];
  today: ChatSession[];
  yesterday: ChatSession[];
  older: ChatSession[];
}

/**
 * 会话（扩展版本，包含v2新字段）
 */
export interface ChatSession {
  id: string;
  title?: string;
  userId?: string;
  createdAt: number;
  updatedAt: number; // 改为必需字段
  // Chat UI Redesign 新增字段
  isPinned?: boolean;
  tags?: string[];
  previewText?: string; // 添加别名
  lastMessagePreview?: string;
  hasUnread?: boolean; // 添加字段
  unreadCount?: number;
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

// ============================================================================
// Chat UI Redesign - 消息增强类型
// ============================================================================

/**
 * 任务摘要（用于消息中的任务引用块）
 */
export interface TaskSummary {
  title: string;
  description: string;
  questions?: string[];
}

/**
 * 工具执行详情（用于消息中保存的工具执行扩展信息）
 */
export interface ToolExecutionDetails {
  toolCallId: string;
  status: 'success' | 'error';
  startTime: number;
  endTime: number;
  durationMs: number;
  inputSummary: string;
  outputSummary: string;
}

/**
 * 聊天消息（扩展版本，包含v2新字段）
 */
export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  parts?: MessagePart[];
  timestamp: number;
  // Chat UI Redesign 新增字段
  taskSummary?: TaskSummary;
  toolExecutionDetails?: ToolExecutionDetails[];
}

/**
 * 消息内容块（与后端 shared/types/sse-protocol 的 MessagePart 对齐）
 * 按时序排列的 text / tool 块
 */
export type MessagePart =
  | { type: 'text'; id: string; content: string }
  | {
      type: 'tool';
      id: string;
      name: string;
      input: Record<string, unknown>;
      result?: unknown;
      isError?: boolean;
      startTime?: number;
      endTime?: number;
      durationMs?: number;
    };

