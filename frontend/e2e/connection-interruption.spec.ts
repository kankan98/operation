/**
 * Task 10.5, 10.6: E2E 测试 - 连接中断和组件卸载
 *
 * 验证 SSE 连接中断处理和资源清理
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

test.describe('Connection Interruption Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState('networkidle');
  });

  test('should handle page navigation during streaming', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 发送消息
    await textarea.fill('测试导航中断');
    await sendButton.click();

    // 等待流式传输开始
    await expect(sendButton).toBeDisabled({ timeout: 2000 });

    // 导航到其他页面
    await page.goto(`${FRONTEND_URL}/opportunities`);
    await page.waitForLoadState('networkidle');

    // 等待一小段时间确保清理完成
    await page.waitForTimeout(1000);

    // 返回聊天页面
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // 验证页面正常加载，没有内存泄漏
    const newTextarea = page.locator('textarea[name="message"]');
    await expect(newTextarea).toBeVisible();
    await expect(newTextarea).toBeEnabled();
  });

  test('should handle tab close during streaming', async ({ page, context }) => {
    const textarea = page.locator('textarea[name="message"]');

    // 发送消息
    await textarea.fill('测试标签页关闭');
    await page.locator('button[type="submit"]').click();

    // 等待流式传输开始
    await page.waitForTimeout(1000);

    // 关闭标签页
    await page.close();

    // 打开新标签页
    const newPage = await context.newPage();
    await newPage.goto(`${FRONTEND_URL}/chat`);
    await newPage.waitForLoadState('networkidle');

    // 验证新页面正常工作
    const newTextarea = newPage.locator('textarea[name="message"]');
    await expect(newTextarea).toBeVisible();
    await expect(newTextarea).toBeEnabled();

    await newPage.close();
  });

  test('should handle component unmount during active streaming', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 发送消息
    await textarea.fill('测试组件卸载');
    await sendButton.click();

    // 等待流式传输开始
    await expect(sendButton).toBeDisabled({ timeout: 2000 });

    // 快速导航离开并返回（模拟组件卸载/重新挂载）
    await page.goto(`${FRONTEND_URL}/opportunities`);
    await page.waitForTimeout(500);
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState('networkidle');

    // 验证没有崩溃
    const newTextarea = page.locator('textarea[name="message"]');
    await expect(newTextarea).toBeVisible();

    // 验证可以发送新消息
    await newTextarea.fill('新消息');
    await page.locator('button[type="submit"]').click();

    // 验证没有错误
    const errorMessages = page.locator('.error, [role="alert"]');
    await expect(errorMessages).toHaveCount(0, { timeout: 2000 });
  });

  test('should cleanup RAF timers on unmount', async ({ page }) => {
    // 使用 console 监听来检测内存泄漏警告
    const consoleWarnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 发送消息
    await textarea.fill('测试 RAF 清理');
    await sendButton.click();

    // 等待流式传输开始
    await page.waitForTimeout(500);

    // 卸载组件
    await page.goto(`${FRONTEND_URL}/opportunities`);
    await page.waitForTimeout(1000);

    // 验证没有 React 警告关于在卸载组件上更新状态
    const hasUnmountWarning = consoleWarnings.some(warning =>
      warning.includes('unmounted') || warning.includes('memory leak')
    );
    expect(hasUnmountWarning).toBe(false);
  });

  test('should abort SSE connection on navigation', async ({ page }) => {
    let connectionClosed = false;

    // 监听网络事件
    page.on('requestfinished', request => {
      if (request.url().includes('/stream')) {
        connectionClosed = true;
      }
    });

    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('测试连接中止');
    await page.locator('button[type="submit"]').click();

    // 等待连接建立
    await page.waitForTimeout(1000);

    // 导航离开
    await page.goto(`${FRONTEND_URL}/opportunities`);
    await page.waitForTimeout(500);

    // 验证连接被关闭（requestfinished 事件触发）
    // 注意：在某些情况下可能需要调整验证逻辑
    expect(connectionClosed).toBe(true);
  });

  test('should handle backend error gracefully', async ({ page }) => {
    // 拦截请求并模拟错误
    await page.route('**/api/chat/sessions/*/stream*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('测试错误处理');
    await page.locator('button[type="submit"]').click();

    // 等待错误显示
    await page.waitForTimeout(2000);

    // 验证发送按钮重新启用
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled({ timeout: 5000 });

    // 验证输入框重新启用
    await expect(textarea).toBeEnabled();
  });
});
