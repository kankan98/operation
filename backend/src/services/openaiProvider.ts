import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  AIProvider,
  SendMessageParams,
  MessageResponse,
  Message,
  StreamChunk,
} from './aiProvider';
import { ClaudeToolDefinition, ToolCall } from '../types/chat';

/**
 * OpenAI Protocol Provider
 * Supports: OpenAI (official), DeepSeek (OpenAI endpoint)
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL,
    });

    logger.info({
      provider: 'openai',
      model: config.openai.model,
      baseURL: config.openai.baseURL || 'default',
    }, 'Initialized OpenAI provider');
  }

  async sendMessage(params: SendMessageParams): Promise<MessageResponse> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const openaiMessages = this.convertMessages(messages, systemPrompt);
    const openaiTools = tools ? this.convertTools(tools) : undefined;

    const response = await this.client.chat.completions.create({
      model: config.openai.model,
      messages: openaiMessages,
      tools: openaiTools,
      max_tokens: maxTokens,
      temperature,
    });

    return this.parseResponse(response);
  }

  async *streamMessage(params: SendMessageParams): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, tools, systemPrompt, maxTokens = 4096, temperature = 0.7 } = params;

    const openaiMessages = this.convertMessages(messages, systemPrompt);
    const openaiTools = tools ? this.convertTools(tools) : undefined;

    const stream = await this.client.chat.completions.create({
      model: config.openai.model,
      messages: openaiMessages,
      tools: openaiTools,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    let currentToolCall: Partial<ToolCall> | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (!delta) continue;

      // Text content (regular response)
      if (delta.content) {
        yield {
          type: 'text',
          text: delta.content,
        };
      }

      // Reasoning content (DeepSeek v4 thinking mode)
      // Note: reasoning_content is the chain-of-thought before final answer
      const deltaWithReasoning = delta as typeof delta & { reasoning_content?: string };
      if (deltaWithReasoning.reasoning_content) {
        yield {
          type: 'text',
          text: deltaWithReasoning.reasoning_content,
        };
      }

      // Tool calls
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.function?.name) {
            // New tool call
            if (currentToolCall) {
              // Emit previous tool call
              yield {
                type: 'tool_call',
                toolCall: currentToolCall as ToolCall,
              };
            }

            currentToolCall = {
              id: toolCall.id || '',
              name: toolCall.function.name,
              input: {},
            };
          }

          if (toolCall.function?.arguments && currentToolCall) {
            // Accumulate arguments
            if (!currentToolCall.input) {
              currentToolCall.input = {};
            }
            try {
              const partialArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
              currentToolCall.input = { ...currentToolCall.input, ...partialArgs };
            } catch {
              // Partial JSON, wait for more chunks
            }
          }
        }
      }

      // End of stream
      if (chunk.choices[0]?.finish_reason) {
        if (currentToolCall) {
          yield {
            type: 'tool_call',
            toolCall: currentToolCall as ToolCall,
          };
          currentToolCall = null;
        }

        if (chunk.usage) {
          yield {
            type: 'usage',
            usage: {
              inputTokens: chunk.usage.prompt_tokens || 0,
              outputTokens: chunk.usage.completion_tokens || 0,
            },
          };
        }

        yield { type: 'done' };
      }
    }
  }

  private convertMessages(messages: Message[], systemPrompt?: string): OpenAI.Chat.ChatCompletionMessageParam[] {
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt
    if (systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Convert messages
    for (const msg of messages) {
      // Case 1: Message has BOTH toolCalls and toolResults (database format)
      // This happens when loading from DB - we need to split into separate messages
      if (msg.toolCalls && msg.toolCalls.length > 0 && msg.toolResults && msg.toolResults.length > 0) {
        // Step 1: Add assistant message with tool_calls (content should be empty/null)
        openaiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          })),
        });

        // Step 2: Add tool result messages
        for (const result of msg.toolResults) {
          openaiMessages.push({
            role: 'tool',
            tool_call_id: result.toolCallId,
            content: JSON.stringify(result.output),
          });
        }

        // Step 3: Add final assistant response with actual content
        openaiMessages.push({
          role: 'assistant',
          content: msg.content,
        });
      }
      // Case 2: Message has ONLY toolResults (streaming format)
      // This happens during streaming - tool results without tool_calls
      else if (msg.toolResults && msg.toolResults.length > 0) {
        for (const result of msg.toolResults) {
          openaiMessages.push({
            role: 'tool',
            tool_call_id: result.toolCallId,
            content: JSON.stringify(result.output),
          });
        }
      }
      // Case 3: Message has ONLY toolCalls (assistant message waiting for tool results)
      else if (msg.toolCalls && msg.toolCalls.length > 0) {
        openaiMessages.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          })),
        });
      }
      // Case 4: Regular message without tools
      else {
        openaiMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return openaiMessages;
  }

  private convertTools(tools: ClaudeToolDefinition[]): OpenAI.Chat.ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  private parseResponse(response: OpenAI.Chat.ChatCompletion): MessageResponse {
    const choice = response.choices[0];
    const message = choice.message;

    // Combine reasoning_content (thinking mode) with regular content
    let content = '';
    interface MessageWithReasoning {
      reasoning_content?: string;
    }
    const messageWithReasoning = message as MessageWithReasoning;
    if (messageWithReasoning.reasoning_content) {
      content += messageWithReasoning.reasoning_content;
    }
    if (message.content) {
      content += message.content;
    }

    const toolCalls: ToolCall[] = [];

    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        if (tc.type !== 'function') {
          continue;
        }

        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
      stopReason: choice.finish_reason === 'tool_calls' ? 'tool_use' :
                  choice.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
    };
  }
}
