import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StreamChunk } from '../src/services/aiProvider';

const {
  mockMessagesCreate,
  loggerDebug,
  loggerError,
  loggerInfo,
  loggerWarn,
} = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
  loggerDebug: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock('../src/config', () => ({
  config: {
    anthropic: {
      apiKey: 'sk-test-secret-1234',
      baseURL: 'https://anthropic.example.test',
      model: 'test-model',
    },
  },
}));

vi.mock('../src/utils/logger', () => ({
  logger: {
    debug: loggerDebug,
    error: loggerError,
    info: loggerInfo,
    warn: loggerWarn,
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: function MockAnthropic(options: { apiKey: string; baseURL?: string }) {
    return {
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      messages: {
        create: mockMessagesCreate,
      },
    };
  },
}));

import { AnthropicProvider } from '../src/services/anthropicProvider';

function streamOf(events: unknown[]) {
  return (async function* () {
    for (const event of events) {
      yield event;
    }
  })();
}

describe('AnthropicProvider', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    loggerDebug.mockReset();
    loggerError.mockReset();
    loggerInfo.mockReset();
    loggerWarn.mockReset();
  });

  it('does not log API key values or fragments', async () => {
    mockMessagesCreate.mockResolvedValueOnce(streamOf([
      { type: 'message_stop' },
    ]));

    const provider = new AnthropicProvider();
    const chunks: StreamChunk[] = [];
    for await (const chunk of provider.streamMessage({
      messages: [{ role: 'user', content: 'hello' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([{ type: 'done' }]);
    const serializedLogs = JSON.stringify(loggerInfo.mock.calls);
    expect(serializedLogs).not.toContain('sk-test-secret-1234');
    expect(serializedLogs).not.toContain('1234');
    expect(serializedLogs).not.toContain('apiKeyLast4');
  });

  it('splits stored assistant tool history into Anthropic-adjacent tool use and result messages', async () => {
    mockMessagesCreate.mockResolvedValueOnce(streamOf([
      { type: 'message_stop' },
    ]));

    const provider = new AnthropicProvider();
    const toolCall = {
      id: 'call_search',
      name: 'searchProducts',
      input: { query: 'wireless' },
    };
    const toolResult = {
      toolCallId: 'call_search',
      output: { count: 0, products: [] },
      isError: false,
    };

    for await (const _chunk of provider.streamMessage({
      messages: [
        { role: 'user', content: 'Find wireless products' },
        {
          role: 'assistant',
          content: 'I found no matching products.',
          toolCalls: [toolCall],
          toolResults: [toolResult],
        },
      ],
    })) {
      // Drain stream so the mocked request is made.
    }

    const request = mockMessagesCreate.mock.calls[0][0];
    expect(request.messages).toEqual([
      {
        role: 'user',
        content: [{ type: 'text', text: 'Find wireless products' }],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'call_search',
            name: 'searchProducts',
            input: { query: 'wireless' },
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'call_search',
            content: JSON.stringify({ count: 0, products: [] }),
            is_error: false,
          },
        ],
      },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'I found no matching products.' }],
      },
    ]);
  });

  it('omits orphaned historical tool use blocks from Anthropic requests', async () => {
    mockMessagesCreate.mockResolvedValueOnce(streamOf([
      { type: 'message_stop' },
    ]));

    const provider = new AnthropicProvider();

    for await (const _chunk of provider.streamMessage({
      messages: [
        { role: 'user', content: 'Continue' },
        {
          role: 'assistant',
          content: 'Partial answer before interruption.',
          toolCalls: [
            {
              id: 'call_orphaned',
              name: 'searchProducts',
              input: { query: 'orphaned' },
            },
          ],
        },
      ],
    })) {
      // Drain stream so the mocked request is made.
    }

    const request = mockMessagesCreate.mock.calls[0][0];
    expect(JSON.stringify(request.messages)).not.toContain('call_orphaned');
    expect(request.messages).toContainEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'Partial answer before interruption.' }],
    });
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        orphanedToolUseIds: ['call_orphaned'],
      }),
      expect.stringContaining('without corresponding tool_result')
    );
  });
});
