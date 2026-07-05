import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StreamChunk } from '../src/services/aiProvider';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: function MockOpenAI() {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  },
}));

import { OpenAIProvider } from '../src/services/openaiProvider';

async function collectStream(generator: AsyncGenerator<StreamChunk, void, unknown>) {
  const chunks: StreamChunk[] = [];
  for await (const chunk of generator) {
    chunks.push(chunk);
  }
  return chunks;
}

function streamOf(chunks: unknown[]) {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

describe('OpenAIProvider', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('accumulates streamed tool-call argument chunks before parsing', async () => {
    mockCreate.mockResolvedValueOnce(streamOf([
      {
        choices: [{
          delta: {
            tool_calls: [{
              index: 0,
              id: 'call_1',
              function: {
                name: 'searchProducts',
                arguments: '{"query":"wire',
              },
            }],
          },
        }],
      },
      {
        choices: [{
          delta: {
            tool_calls: [{
              index: 0,
              function: {
                arguments: 'less","limit":2}',
              },
            }],
          },
        }],
      },
      {
        choices: [{ delta: {}, finish_reason: 'tool_calls' }],
        usage: { prompt_tokens: 3, completion_tokens: 4 },
      },
    ]));

    const provider = new OpenAIProvider();
    const chunks = await collectStream(provider.streamMessage({
      messages: [{ role: 'user', content: 'Find wireless products' }],
    }));

    const toolCalls = chunks.filter((chunk) => chunk.type === 'tool_call');
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].toolCall).toEqual({
      id: 'call_1',
      name: 'searchProducts',
      input: { query: 'wireless', limit: 2 },
    });
  });

  it('tracks multiple streamed tool calls independently', async () => {
    mockCreate.mockResolvedValueOnce(streamOf([
      {
        choices: [{
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_search',
                function: {
                  name: 'searchProducts',
                  arguments: '{"query":"wire',
                },
              },
              {
                index: 1,
                id: 'call_analyze',
                function: {
                  name: 'analyzeData',
                  arguments: '{"metric":"mar',
                },
              },
            ],
          },
        }],
      },
      {
        choices: [{
          delta: {
            tool_calls: [
              {
                index: 0,
                function: {
                  arguments: 'less"}',
                },
              },
              {
                index: 1,
                function: {
                  arguments: 'gin"}',
                },
              },
            ],
          },
        }],
      },
      {
        choices: [{ delta: {}, finish_reason: 'tool_calls' }],
      },
    ]));

    const provider = new OpenAIProvider();
    const chunks = await collectStream(provider.streamMessage({
      messages: [{ role: 'user', content: 'Run tools' }],
    }));

    const toolCalls = chunks
      .filter((chunk) => chunk.type === 'tool_call')
      .map((chunk) => chunk.toolCall);

    expect(toolCalls).toEqual([
      {
        id: 'call_search',
        name: 'searchProducts',
        input: { query: 'wireless' },
      },
      {
        id: 'call_analyze',
        name: 'analyzeData',
        input: { metric: 'margin' },
      },
    ]);
  });

  it('does not expose streamed reasoning content as text', async () => {
    mockCreate.mockResolvedValueOnce(streamOf([
      {
        choices: [{
          delta: {
            reasoning_content: 'hidden chain of thought',
            content: 'visible answer',
          },
        }],
      },
      {
        choices: [{ delta: {}, finish_reason: 'stop' }],
      },
    ]));

    const provider = new OpenAIProvider();
    const chunks = await collectStream(provider.streamMessage({
      messages: [{ role: 'user', content: 'Think privately' }],
    }));

    const text = chunks
      .filter((chunk) => chunk.type === 'text')
      .map((chunk) => chunk.text)
      .join('');

    expect(text).toBe('visible answer');
    expect(text).not.toContain('hidden chain of thought');
  });

  it('does not include non-streaming reasoning content in message text', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          reasoning_content: 'hidden chain of thought',
          content: 'visible answer',
        },
      }],
      usage: { prompt_tokens: 5, completion_tokens: 6 },
    });

    const provider = new OpenAIProvider();
    const response = await provider.sendMessage({
      messages: [{ role: 'user', content: 'Think privately' }],
    });

    expect(response.content).toBe('visible answer');
    expect(response.content).not.toContain('hidden chain of thought');
  });
});
