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
});
