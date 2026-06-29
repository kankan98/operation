/**
 * Task 10.3, 10.4: E2E 测试 - 双击和快速 Enter 防护
 *
 * 验证防止重复提交的机制
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

test.describe('Request Deduplication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState('networkidle');
  });

  test('should prevent double-click on send button', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"][aria-label="发送消息"]');

    // 输入测试消息
    await textarea.fill('测试双击防护');

    // 监听网络请求
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/stream') && request.method() === 'GET') {
        requestCount++;
      }
    });

    // 快速双击发送按钮
    await sendButton.click();
    await sendButton.click(); // 第二次点击应该被阻止

    // 等待一小段时间
    await page.waitForTimeout(2000);

    // 验证只发送了一次请求
    expect(requestCount).toBe(1);

    // 验证只有一条用户消息
    const userMessages = page.locator('[role="user"]');
    await expect(userMessages).toHaveCount(1, { timeout: 3000 });
  });

  test('should prevent rapid Enter keypresses', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');

    // 输入测试消息
    await textarea.fill('测试快速 Enter');

    // 监听网络请求
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/stream') && request.method() === 'GET') {
        requestCount++;
      }
    });

    // 快速按两次 Enter
    await textarea.press('Enter');
    await page.waitForTimeout(50); // 50ms 间隔
    await textarea.press('Enter');

    // 等待
    await page.waitForTimeout(2000);

    // 验证只发送了一次请求
    expect(requestCount).toBe(1);

    // 验证只有一条用户消息
    const userMessages = page.locator('[role="user"]');
    await expect(userMessages).toHaveCount(1, { timeout: 3000 });
  });

  test('should disable input during streaming', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 发送消息
    await textarea.fill('第一条消息');
    await sendButton.click();

    // 等待流式传输开始
    await expect(sendButton).toBeDisabled({ timeout: 2000 });
    await expect(textarea).toBeDisabled({ timeout: 2000 });

    // 尝试在流式传输期间输入
    await textarea.fill('第二条消息'); // 应该不生效

    // 验证输入框仍然显示为禁用
    await expect(textarea).toBeDisabled();

    // 等待流式传输完成
    await expect(sendButton).toBeEnabled({ timeout: 30000 });
    await expect(textarea).toBeEnabled();

    // 现在应该可以输入新消息
    await textarea.fill('第二条消息');
    const value = await textarea.inputValue();
    expect(value).toBe('第二条消息');
  });

  test('should allow retry after 500ms window', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 第一次发送
    await textarea.fill('第一次发送');
    await sendButton.click();

    // 等待流式传输完成
    await expect(sendButton).toBeEnabled({ timeout: 30000 });

    // 等待 500ms 窗口过期
    await page.waitForTimeout(600);

    // 监听网络请求
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/stream')) {
        requestCount++;
      }
    });

    // 第二次发送相同内容（应该被允许）
    await textarea.fill('第一次发送');
    await sendButton.click();

    // 等待
    await page.waitForTimeout(2000);

    // 验证第二次请求成功发送
    expect(requestCount).toBeGreaterThan(0);
  });

  test('should show visual feedback when button is disabled', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    const sendButton = page.locator('button[type="submit"]');

    // 发送消息
    await textarea.fill('测试禁用状态');
    await sendButton.click();

    // 验证按钮样式变化（禁用状态）
    await expect(sendButton).toHaveClass(/disabled:opacity-50/);

    // 等待完成
    await expect(sendButton).toBeEnabled({ timeout: 30000 });
  });
});
