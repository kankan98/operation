import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api base URL resolution', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
    'http://[::1]:3001/api',
  ])(
    'falls back to same-origin /api for %s when the page origin is public',
    async (configuredBaseUrl) => {
      const { resolveApiBaseUrl } = await import('@/services/apiBaseUrl');

      expect(
        resolveApiBaseUrl(configuredBaseUrl, { hostname: '203.195.161.93' }),
      ).toBe('/api');
    },
  );

  it.each([
    ['localhost', 'http://localhost:3001/api'],
    ['127.0.0.1', 'http://127.0.0.1:3001/api'],
    ['[::1]', 'http://[::1]:3001/api'],
  ])(
    'keeps loopback API config %s for local page origin %s',
    async (pageHostname, configuredBaseUrl) => {
      const { resolveApiBaseUrl } = await import('@/services/apiBaseUrl');

      expect(
        resolveApiBaseUrl(configuredBaseUrl, { hostname: pageHostname }),
      ).toBe(configuredBaseUrl);
    },
  );

  it('preserves explicit public API origins', async () => {
    const { resolveApiBaseUrl } = await import('@/services/apiBaseUrl');

    expect(
      resolveApiBaseUrl('https://api.example.com/api', {
        hostname: '203.195.161.93',
      }),
    ).toBe('https://api.example.com/api');
  });

  it('builds chat SSE URLs from the resolved same-origin base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001/api');
    vi.stubGlobal('location', { hostname: '203.195.161.93' });

    class MockEventSource {
      static urls: string[] = [];
      onerror: (() => void) | null = null;

      constructor(url: string) {
        MockEventSource.urls.push(url);
      }

      addEventListener = vi.fn();
      close = vi.fn();
    }

    vi.stubGlobal('EventSource', MockEventSource);

    const { chatApi } = await import('@/services/chatApi');
    const controller = new AbortController();
    const cleanup = await chatApi.streamMessage(
      'hello world',
      [],
      controller.signal,
      {},
      'session-1',
    );

    expect(MockEventSource.urls).toEqual([
      '/api/chat/sessions/session-1/stream?content=hello%20world',
    ]);

    cleanup();
  });
});
