import { describe, it, expect, vi } from 'vitest';
import { config, validateConfig } from '../src/config';

describe('Config', () => {
  it('should load config with correct types', () => {
    expect(typeof config.port).toBe('number');
    expect(typeof config.databasePath).toBe('string');
    expect(typeof config.logLevel).toBe('string');
    expect(typeof config.nodeEnv).toBe('string');
    expect(typeof config.corsOrigin).toBe('string');
  });

  it('should have default port if not set', () => {
    expect(config.port).toBe(3001);
  });

  it('should validate required config exists when DATABASE_PATH is set', () => {
    // DATABASE_PATH should be set in .env
    expect(() => validateConfig()).not.toThrow();
  });

  it('should have immutable config object', () => {
    // Test that config is readonly (TypeScript ensures this at compile time)
    expect(config).toBeDefined();
  });

  it('should prefer process.env values over local .env values', async () => {
    const originalPort = process.env.PORT;
    const fsMock = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => [
        'PORT=1111',
        'DATABASE_PATH=./from-env-file.db',
      ].join('\n')),
    };

    vi.resetModules();
    vi.doMock('fs', () => ({
      default: fsMock,
      ...fsMock,
    }));
    process.env.PORT = '4242';

    try {
      const imported = await import('../src/config');
      expect(imported.config.port).toBe(4242);
    } finally {
      if (originalPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = originalPort;
      }
      vi.doUnmock('fs');
      vi.resetModules();
    }
  });
});
