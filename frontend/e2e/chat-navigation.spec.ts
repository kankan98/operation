/**
 * Chat Navigation E2E Tests
 *
 * 测试聊天导航行为，包括：
 * 1. 点击主导航"智能助手"应显示新对话
 * 2. 工具执行状态应与当前对话一致
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003');
  });

  test('点击智能助手菜单应显示新对话（空状态）', async ({ page }) => {
    // 点击主导航的"智能助手"
    await page.click('text=智能助手');

    // 等待导航完成
    await page.waitForURL('**/chat');

    // 验证 URL 是 /chat（无 sessionId）
    expect(page.url()).toBe('http://localhost:3003/chat');

    // 验证显示空状态（无消息）
    const messageCards = page.locator('[id^="message-"]');
    await expect(messageCards).toHaveCount(0);

    // 验证顶部标题显示"跨境运营助手"（新对话标题）
    await expect(page.locator('h1:has-text("跨境运营助手")')).toBeVisible();

    // 验证输入框可用
    const textarea = page.locator('textarea[name="message"]');
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAttribute('placeholder', /输入消息/);
  });

  test('发送消息后应创建新会话并更新 URL', async ({ page }) => {
    // 导航到 /chat（新对话）
    await page.goto('http://localhost:3003/chat');

    // 验证当前 URL 是 /chat
    expect(page.url()).toBe('http://localhost:3003/chat');

    // 输入消息
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('你好');

    // 发送消息
    await page.keyboard.press('Enter');

    // 等待后端响应，URL 应该更新为 /chat/:sessionId
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/);

    // 验证 URL 包含 sessionId
    const url = page.url();
    expect(url).toMatch(/\/chat\/[a-zA-Z0-9-]+/);

    // 验证用户消息已显示
    await expect(page.locator('text=你好')).toBeVisible();
  });

  test('从会话列表选择会话应正确加载', async ({ page }) => {
    // 先创建一个会话（发送一条消息）
    await page.goto('http://localhost:3003/chat');
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('测试消息');
    await page.keyboard.press('Enter');

    // 等待会话创建
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/);
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/chat/')[1];

    // 点击"智能助手"返回新对话
    await page.click('text=智能助手');
    await page.waitForURL('**/chat');

    // 验证回到新对话状态
    expect(page.url()).toBe('http://localhost:3003/chat');

    // 从会话列表选择刚才的会话
    // 注意：需要根据实际的会话列表 UI 来定位
    await page.click(`[data-session-id="${sessionId}"]`);

    // 验证 URL 更新为选中的会话
    await page.waitForURL(`**/chat/${sessionId}`);
    expect(page.url()).toBe(sessionUrl);

    // 验证消息已加载
    await expect(page.locator('text=测试消息')).toBeVisible();
  });
});

test.describe('Tool Execution Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/chat');
  });

  test('工具执行状态应与当前对话一致', async ({ page }) => {
    // 发送一条会触发工具调用的消息
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('帮我读取 README.md 文件');
    await page.keyboard.press('Enter');

    // 等待消息发送
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/);

    // 等待 AI 响应（包含工具调用）
    await page.waitForSelector('[id^="tool-"]', { timeout: 10000 });

    // 点击右侧"工具执行"标签
    await page.click('text=工具执行');

    // 验证工具执行面板显示工具调用
    const toolCards = page.locator('.tool-execution-card-compact');
    await expect(toolCards).toHaveCount(1);

    // 验证工具名称
    await expect(page.locator('text=Read')).toBeVisible();
  });

  test('切换会话后工具执行面板应更新', async ({ page }) => {
    // 会话1：触发工具调用
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('读取 README.md');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/);
    const session1Url = page.url();

    // 等待工具调用完成
    await page.waitForSelector('[id^="tool-"]', { timeout: 10000 });

    // 创建会话2：纯文本消息（无工具调用）
    await page.click('text=智能助手');
    await page.waitForURL('**/chat');
    await textarea.fill('你好');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/);

    // 验证会话2的 URL 与会话1不同
    expect(page.url()).not.toBe(session1Url);

    // 点击工具执行标签
    await page.click('text=工具执行');

    // 验证工具执行面板为空（会话2无工具调用）
    const emptyState = page.locator('text=暂无工具执行记录');
    await expect(emptyState).toBeVisible();

    // 切换回会话1
    const sessionId1 = session1Url.split('/chat/')[1];
    await page.click(`[data-session-id="${sessionId1}"]`);
    await page.waitForURL(session1Url);

    // 验证工具执行面板显示会话1的工具调用
    await page.click('text=工具执行');
    const toolCards = page.locator('.tool-execution-card-compact');
    await expect(toolCards).toHaveCount(1);
  });
});
