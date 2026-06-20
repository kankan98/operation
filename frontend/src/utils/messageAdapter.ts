import type { MessagePart, ToolCall } from '../types/chat';

/**
 * 消息格式适配器 - 将旧格式消息（content + toolCalls）转换为新格式（parts）
 * 集中处理向后兼容逻辑，避免在多个组件中重复检查
 */

export interface LegacyMessage {
  id: string;
  content?: string;
  toolCalls?: ToolCall[];
  parts?: MessagePart[];
}

/**
 * 标准化消息格式，确保所有消息都有 parts 数组
 *
 * @param msg - 原始消息（可能是旧格式或新格式）
 * @returns 标准化后的 parts 数组
 */
export function normalizeMessageParts(msg: LegacyMessage): MessagePart[] {
  // 如果已有 parts 且非空，直接使用
  if (msg.parts && msg.parts.length > 0) {
    return msg.parts;
  }

  // 向后兼容：从旧格式（content + toolCalls）构建 parts
  const parts: MessagePart[] = [];

  // 添加文本部分
  if (msg.content) {
    parts.push({
      type: 'text',
      id: `${msg.id}-text`,
      content: msg.content,
    });
  }

  // 添加工具调用部分
  if (msg.toolCalls && msg.toolCalls.length > 0) {
    msg.toolCalls.forEach((tc) => {
      parts.push({
        type: 'tool',
        id: tc.id,
        name: tc.name,
        input: (tc.input ?? {}) as Record<string, unknown>,
        result: tc.result,
        isError: tc.isError,
        durationMs: tc.durationMs,
      });
    });
  }

  return parts;
}

/**
 * 从消息中提取工具执行信息
 *
 * @param msg - 消息对象
 * @returns 工具调用数组
 */
export function extractToolExecutions(msg: LegacyMessage) {
  const parts = normalizeMessageParts(msg);
  return parts.filter((part) => part.type === 'tool');
}
