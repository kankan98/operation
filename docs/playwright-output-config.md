# Playwright 配置 - 输出目录管理

## 问题

之前 Playwright 的截图、视频等文件可能直接保存在项目根目录，导致：
- 根目录混乱
- 难以管理测试产物
- 容易误提交到 Git

---

## 解决方案

创建 `playwright.config.ts`，将所有输出文件统一放到 `frontend/` 目录下的专门文件夹。

---

## 配置文件

**位置**: `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // ✅ 输出目录配置 - 不放在根目录
  outputDir: './test-results',

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    baseURL: 'http://localhost:3002',
  },

  // ✅ Reporter 输出配置
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 目录结构

```
D:\学习\AI运营\
├── frontend/
│   ├── e2e/                    # 测试文件目录
│   │   └── chat.spec.ts
│   ├── test-results/           # 测试结果（截图、视频、追踪）
│   │   ├── chromium/
│   │   └── results.json
│   ├── playwright-report/      # HTML 报告
│   │   └── index.html
│   ├── .playwright-cli/        # Playwright CLI 临时文件
│   └── playwright.config.ts    # 配置文件
└── .gitignore
```

---

## .gitignore 配置

```gitignore
# Playwright
.playwright-cli/
frontend/.playwright-cli/
frontend/test-results/
frontend/playwright-report/
```

**忽略的目录：**
- `.playwright-cli/` - CLI 工具的临时文件
- `test-results/` - 测试结果（截图、视频、追踪文件）
- `playwright-report/` - HTML 测试报告

---

## 输出说明

### 1. test-results/

**包含内容：**
- 失败测试的截图 (`.png`)
- 失败测试的视频 (`.webm`)
- 失败测试的追踪文件 (`.zip`)
- JSON 测试结果 (`results.json`)

**触发条件：**
```typescript
screenshot: 'only-on-failure',  // 只在失败时截图
video: 'retain-on-failure',     // 只保留失败的视频
trace: 'retain-on-failure',     // 只保留失败的追踪
```

---

### 2. playwright-report/

**包含内容：**
- HTML 测试报告 (`index.html`)
- 报告资源文件（CSS、JS）

**查看报告：**
```bash
cd frontend
npx playwright show-report
```

自动在浏览器打开 HTML 报告。

---

### 3. .playwright-cli/

**包含内容：**
- Playwright CLI 的临时文件
- 浏览器缓存
- 会话数据

**用途：**
内部工具文件，用户不需要关心。

---

## 使用示例

### 运行测试

```bash
cd frontend
npx playwright test
```

**输出：**
```
Running 3 tests using 1 worker

  ✓ chat.spec.ts:5:1 › should display empty state (2s)
  ✓ chat.spec.ts:10:1 › should send message (3s)
  ✗ chat.spec.ts:15:1 › should show loading state (1s)

  1 failed
    chat.spec.ts:15:1 › should show loading state

  2 passed (6s)

📸 Screenshot: test-results/chat-should-show-loading-state-chromium/screenshot.png
🎥 Video: test-results/chat-should-show-loading-state-chromium/video.webm
```

---

### 查看失败的测试

```bash
# 查看 HTML 报告
npx playwright show-report

# 查看截图
open frontend/test-results/chromium/screenshot.png

# 查看视频
open frontend/test-results/chromium/video.webm

# 查看追踪文件（详细调试）
npx playwright show-trace frontend/test-results/chromium/trace.zip
```

---

## 清理测试产物

### 手动清理

```bash
cd frontend
rm -rf test-results playwright-report
```

### 自动清理（添加到 package.json）

```json
{
  "scripts": {
    "test:clean": "rm -rf test-results playwright-report",
    "test:e2e": "npm run test:clean && playwright test"
  }
}
```

---

## CI/CD 配置

在 CI pipeline 中：

```yaml
- name: Run Playwright tests
  run: |
    cd frontend
    npx playwright install --with-deps
    npx playwright test

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-results
    path: frontend/test-results/

- name: Upload HTML report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

---

## 配置选项说明

### outputDir

```typescript
outputDir: './test-results'
```

测试执行时的临时文件和结果输出目录。

---

### screenshot

```typescript
screenshot: 'only-on-failure'  // 只在失败时
screenshot: 'on'               // 每次测试都截图
screenshot: 'off'              // 不截图
```

---

### video

```typescript
video: 'retain-on-failure'  // 只保留失败的
video: 'on'                 // 全部保留
video: 'off'                // 不录制
```

---

### trace

```typescript
trace: 'retain-on-failure'  // 只保留失败的
trace: 'on'                 // 全部记录
trace: 'off'                // 不记录
```

**Trace 文件特别有用：**
- 包含完整的执行过程
- 可以时间旅行调试
- 查看网络请求
- 查看控制台日志

---

## 最佳实践

### 1. 开发环境

```typescript
// 开发时：快速反馈，不保存太多文件
screenshot: 'only-on-failure',
video: 'off',
trace: 'on-first-retry',
```

### 2. CI 环境

```typescript
// CI 中：保存所有失败信息用于调试
screenshot: 'only-on-failure',
video: 'retain-on-failure',
trace: 'retain-on-failure',
retries: 2,  // 失败重试
```

### 3. 调试模式

```typescript
// 本地调试：记录所有信息
screenshot: 'on',
video: 'on',
trace: 'on',
```

---

## 存储空间管理

### 典型文件大小

| 文件类型 | 大小 | 说明 |
|---------|------|------|
| 截图 (.png) | 50-200 KB | 单个页面 |
| 视频 (.webm) | 1-5 MB | 10-30 秒测试 |
| 追踪 (.zip) | 500 KB - 2 MB | 完整执行记录 |
| HTML 报告 | 100-500 KB | 含样式和脚本 |

### 估算

100 个失败测试：
- 截图: 100 × 100 KB = 10 MB
- 视频: 100 × 2 MB = 200 MB
- 追踪: 100 × 1 MB = 100 MB
- **总计: ~310 MB**

**建议：**
- 定期清理 `test-results/`
- CI 中设置产物保留时间（如 7 天）

---

## 总结

✅ **已配置**
- Playwright 配置文件创建
- 输出目录统一到 `frontend/`
- .gitignore 忽略测试产物

✅ **效果**
- 根目录保持整洁
- 测试产物集中管理
- 不会误提交大文件到 Git

✅ **目录结构**
```
frontend/
├── test-results/       # 测试结果（Git 忽略）
├── playwright-report/  # HTML 报告（Git 忽略）
└── .playwright-cli/    # CLI 临时文件（Git 忽略）
```

现在所有 Playwright 相关文件都在 `frontend/` 目录下，根目录保持整洁！🎉
