import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig "@shared/*" -> "../shared/*" path mapping so the
      // Vitest module graph can resolve the workspace package (which is not
      // linked into node_modules). Without this, any test importing routes
      // (-> src/schemas -> @shared/schemas) fails to load.
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // 所有测试在单个进程中运行
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    // 顺序执行测试文件
    fileParallelism: false,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        'drizzle/**',
        'drizzle.config.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
