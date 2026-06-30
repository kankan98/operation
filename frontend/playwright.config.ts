import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // 输出目录配置 - 不放在根目录
  outputDir: './test-results',

  // 测试超时
  timeout: 60 * 1000, // 60 秒
  expect: {
    timeout: 10 * 1000, // 10 秒
  },

  // 截图配置
  use: {
    // 基础 URL - Task 10: 使用正确的端口配置
    baseURL: 'http://localhost:3000',

    // 截图保存路径
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'retain-on-failure',

    // 追踪
    trace: 'retain-on-failure',

    // 浏览器视口
    viewport: { width: 1280, height: 720 },

    // 超时配置
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // 失败重试
  retries: process.env.CI ? 2 : 0,

  // 并行执行
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
    ['list'],
  ],

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server 配置：自动启动后端 (3001) 与前端 (3000)
  // 后端就绪以 /health 探测，前端以根路径探测。
  // 本地默认复用已在运行的服务（reuseExistingServer），CI 中强制全新启动。
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
