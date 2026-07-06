import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  AIProvider,
  SendMessageParams,
  MessageResponse,
  Message,
  StreamChunk,
} from './aiProvider';
import type { ToolCall } from '../types/chat';

/**
 * Anthropic Protocol Provider
 * Supports: Claude (official), DeepSeek (Anthropic endpoint)
 */
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    // 显式清除可能冲突的环境变量，防止 SDK 自动读取
    const apiKey = config.anthropic.apiKey;

    logger.info({
      provider: 'anthropic',
      baseURL: config.anthropic.baseURL || 'default',
      model: config.anthropic.model,
    }, 'Initializing Anthropic provider with config');

    if (!apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
      baseURL: config.anthropic.baseURL,
      // 显式禁用从环境变量读取
      dangerouslyAllowBrowser: false,
    });

    logger.info({
      provider: 'anthropic',
      model: config.anthropic.model,
      baseURL: config.anthropic.baseURL || 'default',
    }, 'Initialized Anthropic provider');
  }

  /**
   * Send a non-streaming message request to the Anthropic API.
   * @param params - Message parameters including messages, tools, and system prompt
   * @returns Complete message response with content and tool calls
   */
  async sendMessage(params: SendMessageParams): Promise<MessageResponse> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const anthropicMessages = this.convertMessages(messages);

    const response = await this.client.messages.create({
      model: config.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: tools,
    });

    return this.parseResponse(response);
  }

  /**
   * Stream a message request to the Anthropic API with real-time event emission.
   * Handles incremental text deltas and tool call parameter accumulation.
   *
   * @param params - Message parameters including messages, tools, and system prompt
   * @yields StreamChunk events including message_start, status, text_delta, tool_call_start/end, usage, message_done
   *
   * @remarks
   * Tool call parameters are accumulated from input_json_delta events across multiple
   * content_block_delta events. Complete tool calls are only emitted at content_block_stop.
   */
  async *streamMessage(params: SendMessageParams): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const anthropicMessages = this.convertMessages(messages);

    logger.info({
      baseURL: this.client.baseURL,
      model: config.anthropic.model,
    }, 'About to call Anthropic API stream');

    const stream = await this.client.messages.create({
      model: config.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: tools,
      stream: true,
    });

    // Track tool calls in progress by block index
    const toolCallsInProgress = new Map<number, {
      id: string;
      name: string;
      inputJson: string;
    }>();

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          // Initialize tool call tracking
          toolCallsInProgress.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: '',
          });
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield {
            type: 'text',
            text: event.delta.text,
          };
        } else if (event.delta.type === 'input_json_delta') {
          // Accumulate tool input JSON
          const tool = toolCallsInProgress.get(event.index);
          if (tool) {
            tool.inputJson += event.delta.partial_json;
          }
        }
      } else if (event.type === 'content_block_stop') {
        // Tool call completed - parse and yield
        const tool = toolCallsInProgress.get(event.index);
        if (tool) {
          try {
            const input = JSON.parse(tool.inputJson) as Record<string, unknown>;
            yield {
              type: 'tool_call',
              toolCall: {
                id: tool.id,
                name: tool.name,
                input,
              },
            };
          } catch (error) {
            logger.error({ error, inputJson: tool.inputJson }, 'Failed to parse tool input JSON');
            yield {
              type: 'error',
              error: 'Failed to parse tool parameters',
            };
          }
          toolCallsInProgress.delete(event.index);
        }
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          yield {
            type: 'usage',
            usage: {
              inputTokens: 0,
              outputTokens: event.usage.output_tokens || 0,
            },
          };
        }
      } else if (event.type === 'message_stop') {
        yield { type: 'done' };
      }
    }
  }

  /**
   * Convert internal Message format to Anthropic API message format.
   * Handles text content, tool_use blocks (assistant), and tool_result blocks (user).
   *
   * @param messages - Array of internal Message objects
   * @returns Array of Anthropic-formatted message objects
   *
   * @remarks
   * - Text content is only added if non-empty (Anthropic rejects empty text blocks)
   * - Assistant messages with toolCalls are converted to tool_use content blocks
   * - User messages with toolResults are converted to tool_result content blocks
   * - Validates that each tool_use has a corresponding tool_result in the next message
   */
  private convertMessages(messages: Message[]): MessageParam[] {
    // First pass: collect all tool_use IDs and their corresponding tool_result IDs
    const toolUseIds = new Set<string>();
    const toolResultIds = new Set<string>();

    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.toolCalls) {
        msg.toolCalls.forEach(tc => toolUseIds.add(tc.id));
      }
      if (msg.toolResults) {
        msg.toolResults.forEach(tr => toolResultIds.add(tr.toolCallId));
      }
    });

    // Find orphaned tool_use IDs (without results)
    const orphanedToolUseIds = new Set(
      Array.from(toolUseIds).filter(id => !toolResultIds.has(id))
    );

    // Task 7.2 & 7.3: 使过滤不那么激进，并添加警告级别日志
    if (orphanedToolUseIds.size > 0) {
      logger.warn({
        orphanedToolUseIds: Array.from(orphanedToolUseIds),
        totalToolUses: toolUseIds.size,
        totalToolResults: toolResultIds.size,
      }, 'Found tool_use blocks without corresponding tool_result blocks - this may be expected during partial streaming');
    }

    type AnthropicContentBlock =
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
      | { type: 'tool_result'; tool_use_id: string; content: string; is_error: boolean };

    const toolUseBlocks = (toolCalls: NonNullable<Message['toolCalls']>) =>
      toolCalls.flatMap((tc) => {
        if (orphanedToolUseIds.has(tc.id)) {
          logger.debug({ toolCallId: tc.id, toolName: tc.name }, 'Filtered orphaned tool_use block');
          return [];
        }

        return [{
          type: 'tool_use' as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        }];
      });

    const toolResultBlocks = (
      toolResults: NonNullable<Message['toolResults']>,
      allowedToolUseIds?: Set<string>
    ) =>
      toolResults.flatMap((result) => {
        if (allowedToolUseIds && !allowedToolUseIds.has(result.toolCallId)) {
          return [];
        }

        return [{
          type: 'tool_result' as const,
          tool_use_id: result.toolCallId,
          content: JSON.stringify(result.output),
          is_error: result.isError || false,
        }];
      });

    const pushIfContent = (
      output: MessageParam[],
      role: 'user' | 'assistant',
      content: AnthropicContentBlock[]
    ) => {
      if (content.length > 0) {
        output.push({ role, content });
      }
    };

    return messages.flatMap(msg => {
      const output: MessageParam[] = [];
      const hasToolCalls = Boolean(msg.toolCalls?.length);
      const hasToolResults = Boolean(msg.toolResults?.length);

      if (msg.role === 'assistant' && hasToolCalls && hasToolResults) {
        const assistantToolUseBlocks = toolUseBlocks(msg.toolCalls!);
        const includedToolUseIds = new Set(
          assistantToolUseBlocks.map((block) => block.id)
        );
        const userToolResultBlocks = toolResultBlocks(
          msg.toolResults!,
          includedToolUseIds
        );

        pushIfContent(output, 'assistant', assistantToolUseBlocks);
        pushIfContent(output, 'user', userToolResultBlocks);

        if (msg.content) {
          pushIfContent(output, 'assistant', [{ type: 'text', text: msg.content }]);
        }

        return output;
      }

      const content: AnthropicContentBlock[] = [];

      // Add text content if non-empty
      if (msg.content) {
        content.push({ type: 'text', text: msg.content });
      }

      // Assistant: add tool_use blocks (skip orphaned ones only if we should filter)
      if (msg.role === 'assistant' && msg.toolCalls) {
        content.push(...toolUseBlocks(msg.toolCalls));
      }

      // User: add tool_result blocks
      if (msg.role === 'user' && msg.toolResults) {
        content.push(...toolResultBlocks(msg.toolResults));
      }

      pushIfContent(output, msg.role, content);
      return output;
    });
  }

  private parseResponse(response: Anthropic.Message): MessageResponse {
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      stopReason: response.stop_reason === 'tool_use' ? 'tool_use' :
                  response.stop_reason === 'max_tokens' ? 'max_tokens' : 'end_turn',
    };
  }
}
