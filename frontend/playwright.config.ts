import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // 输出目录配置 - 不放在根目录
  outputDir: './test-results',

  // 截图配置
  use: {
    // 截图保存路径
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'retain-on-failure',

    // 追踪
    trace: 'retain-on-failure',

    // 基础 URL
    baseURL: 'http://localhost:3002',
  },

  // 失败重试
  retries: process.env.CI ? 2 : 0,

  // 并行执行
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server 配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
});
