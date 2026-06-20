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
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      baseURL: config.anthropic.baseURL,
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
   */
  private convertMessages(messages: Message[]): MessageParam[] {
    return messages.map(msg => {
      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
        | { type: 'tool_result'; tool_use_id: string; content: string; is_error: boolean }
      > = [];

      // Add text content if non-empty
      if (msg.content) {
        content.push({ type: 'text', text: msg.content });
      }

      // Assistant: add tool_use blocks
      if (msg.role === 'assistant' && msg.toolCalls) {
        msg.toolCalls.forEach(tc => {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.input,
          });
        });
      }

      // User: add tool_result blocks
      if (msg.role === 'user' && msg.toolResults) {
        msg.toolResults.forEach(result => {
          content.push({
            type: 'tool_result',
            tool_use_id: result.toolCallId,
            content: JSON.stringify(result.output),
            is_error: result.isError || false,
          });
        });
      }

      return {
        role: msg.role,
        content,
      };
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
