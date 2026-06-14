import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  AIProvider,
  SendMessageParams,
  MessageResponse,
  StreamChunk,
  Message,
} from './aiProvider';
import { ClaudeToolDefinition, ToolCall, ToolResult } from '../types/chat';

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

  async sendMessage(params: SendMessageParams): Promise<MessageResponse> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const anthropicMessages = this.convertMessages(messages);

    const response = await this.client.messages.create({
      model: config.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: tools as any,
    });

    return this.parseResponse(response);
  }

  async *streamMessage(params: SendMessageParams): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const anthropicMessages = this.convertMessages(messages);

    const stream = await this.client.messages.create({
      model: config.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: tools as any,
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
            const input = JSON.parse(tool.inputJson);
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

  private convertMessages(messages: Message[]): any[] {
    return messages.map(msg => {
      const content: any[] = [{ type: 'text', text: msg.content }];

      // Add tool results if present
      if (msg.toolResults && msg.toolResults.length > 0) {
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

  private parseResponse(response: any): MessageResponse {
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
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
