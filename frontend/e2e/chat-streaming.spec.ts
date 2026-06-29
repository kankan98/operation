/**
 * Task 10.1: E2E 测试 - 发送消息并验证流式完成
 *
 * 测试基本的消息发送和接收流程
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

test.describe('Chat SSE Streaming', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到聊天页面
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState('networkidle');
  });

  test('should send message and receive streaming response', async ({ page }) => {
    // 查找输入框
    const textarea = page.locator('textarea[name="message"]');
    await expect(textarea).toBeVisible();

    // 输入测试消息
    const testMessage = '你好，请介绍一下自己';
    await textarea.fill(testMessage);

    // 点击发送按钮
    const sendButton = page.locator('button[type="submit"][aria-label="发送消息"]');
    await sendButton.click();

    // 验证用户消息出现
    await expect(page.locator('text=' + testMessage).first()).toBeVisible({ timeout: 2000 });

    // 验证发送按钮被禁用（正在流式传输）
    await expect(sendButton).toBeDisabled();

    // 等待 AI 响应开始出现
    await page.waitForSelector('[role="assistant"]', { timeout: 10000 });

    // 等待流式传输完成（按钮重新启用）
    await expect(sendButton).toBeEnabled({ timeout: 30000 });

    // 验证 AI 消息存在
    const assistantMessages = page.locator('[role="assistant"]');
    await expect(assistantMessages).toHaveCount(1, { timeout: 2000 });

    // 验证消息有内容
    const messageContent = await assistantMessages.first().textContent();
    expect(messageContent).toBeTruthy();
    expect(messageContent!.length).toBeGreaterThan(10);
  });

  test('should display message_start event', async ({ page }) => {
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('测试消息');

    // 监听网络事件
    const ssePromise = page.waitForResponse(
      response => response.url().includes('/api/chat/sessions') && response.url().includes('/stream'),
      { timeout: 5000 }
    );

    await page.locator('button[type="submit"]').click();

    // 验证 SSE 连接建立
    const sseResponse = await ssePromise;
    expect(sseResponse.status()).toBe(200);
    expect(sseResponse.headers()['content-type']).toContain('text/event-stream');
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const sendButton = page.locator('button[type="submit"]');

    // 空输入时点击发送按钮
    await sendButton.click();

    // 等待一小段时间
    await page.waitForTimeout(1000);

    // 验证没有消息被发送
    const messages = page.locator('[role="user"], [role="assistant"]');
    await expect(messages).toHaveCount(0);
  });
});
