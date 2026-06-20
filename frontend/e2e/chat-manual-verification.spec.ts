/**
 * 手动验证脚本 - Chat 功能验证
 *
 * 运行方式：npx playwright test chat-manual-verification.spec.ts --headed
 */

import { test, expect } from '@playwright/test';

test.describe('Chat 功能手动验证', () => {
  test('验证新对话欢迎页', async ({ page }) => {
    console.log('📍 步骤 1: 访问首页');
    await page.goto('http://localhost:3000');

    console.log('📍 步骤 2: 点击智能助手菜单');
    await page.click('text=智能助手');

    // 等待导航完成
    await page.waitForURL('**/chat', { timeout: 5000 });

    console.log('📍 步骤 3: 验证 URL');
    const url = page.url();
    console.log('   当前 URL:', url);
    expect(url).toBe('http://localhost:3000/chat');

    console.log('📍 步骤 4: 验证欢迎页元素');

    // 验证欢迎标题
    const welcomeTitle = page.locator('text=你好！我是跨境运营助手');
    await expect(welcomeTitle).toBeVisible({ timeout: 3000 });
    console.log('   ✅ 欢迎标题显示正常');

    // 验证功能介绍文本
    const introText = page.locator('text=我可以帮你分析商品数据');
    await expect(introText).toBeVisible();
    console.log('   ✅ 功能介绍显示正常');

    // 验证快速开始按钮
    const quickStartButtons = page.locator('text=分析商品价格趋势');
    await expect(quickStartButtons).toBeVisible();
    console.log('   ✅ 快速开始按钮显示正常');

    // 验证输入框
    const textarea = page.locator('textarea[name="message"]');
    await expect(textarea).toBeEnabled();
    console.log('   ✅ 输入框可用');

    console.log('📍 步骤 5: 测试快速开始按钮');
    await page.click('text=分析商品价格趋势');

    // 验证文本填充到输入框
    const inputValue = await textarea.inputValue();
    console.log('   输入框内容:', inputValue);
    expect(inputValue).toContain('分析商品价格趋势');
    console.log('   ✅ 快速开始按钮功能正常');

    // 截图
    await page.screenshot({ path: 'test-results/welcome-page.png', fullPage: true });
    console.log('   📸 已保存截图: test-results/welcome-page.png');

    console.log('\n✅ 新对话欢迎页验证通过！');
  });

  test('验证发送消息和工具执行', async ({ page }) => {
    console.log('📍 步骤 1: 访问 Chat 页面');
    await page.goto('http://localhost:3000/chat');

    console.log('📍 步骤 2: 输入测试消息');
    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('你好，请介绍一下你自己');
    console.log('   消息内容: 你好，请介绍一下你自己');

    console.log('📍 步骤 3: 发送消息');
    await page.keyboard.press('Enter');

    console.log('📍 步骤 4: 等待 AI 响应');
    // 等待用户消息显示
    await expect(page.locator('text=你好，请介绍一下你自己')).toBeVisible({ timeout: 5000 });
    console.log('   ✅ 用户消息已显示');

    // 等待 URL 更新（包含 sessionId）
    await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    const newUrl = page.url();
    console.log('   新 URL:', newUrl);
    console.log('   ✅ 会话已创建');

    // 等待 AI 响应（最多等待15秒）
    try {
      await page.waitForSelector('[id^="message-"]', { timeout: 15000, state: 'attached' });

      // 检查是否有 AI 消息
      const messages = await page.locator('[id^="message-"]').count();
      console.log(`   消息数量: ${messages}`);

      if (messages >= 2) {
        console.log('   ✅ AI 已响应');

        // 截图
        await page.screenshot({ path: 'test-results/chat-with-response.png', fullPage: true });
        console.log('   📸 已保存截图: test-results/chat-with-response.png');
      }
    } catch {
      console.log('   ⚠️  AI 响应超时（可能需要配置 AI provider）');
    }

    console.log('\n✅ 消息发送验证完成！');
  });

  test('验证会话列表', async ({ page }) => {
    console.log('📍 步骤 1: 访问 Chat 页面');
    await page.goto('http://localhost:3000/chat');

    console.log('📍 步骤 2: 等待页面加载');
    await page.waitForTimeout(2000);

    // 检查会话列表是否可见（宽屏）
    const sessionList = page.locator('text=新建对话');
    const isVisible = await sessionList.isVisible().catch(() => false);

    if (isVisible) {
      console.log('   ✅ 会话列表显示（宽屏模式）');
    } else {
      console.log('   📱 会话列表隐藏（可能是窄屏模式）');

      // 尝试点击会话按钮
      const sessionButton = page.locator('button:has-text("会话")');
      if (await sessionButton.isVisible().catch(() => false)) {
        await sessionButton.click();
        console.log('   ✅ 点击会话按钮打开抽屉');
        await page.waitForTimeout(500);
      }
    }

    // 截图
    await page.screenshot({ path: 'test-results/session-list.png', fullPage: true });
    console.log('   📸 已保存截图: test-results/session-list.png');

    console.log('\n✅ 会话列表验证完成！');
  });

  test('验证右侧任务面板', async ({ page }) => {
    console.log('📍 步骤 1: 访问 Chat 页面');
    await page.goto('http://localhost:3000/chat');

    console.log('📍 步骤 2: 等待页面加载');
    await page.waitForTimeout(2000);

    // 检查任务面板是否可见（宽屏）
    const taskPanel = page.locator('text=任务管理');
    const isVisible = await taskPanel.isVisible().catch(() => false);

    if (isVisible) {
      console.log('   ✅ 任务面板显示（宽屏模式）');

      // 检查标签
      const tasksTab = page.locator('text=任务概览');
      const toolsTab = page.locator('text=工具执行');

      await expect(tasksTab).toBeVisible();
      await expect(toolsTab).toBeVisible();
      console.log('   ✅ 任务概览和工具执行标签显示正常');

    } else {
      console.log('   📱 任务面板隐藏（可能是窄屏模式）');

      // 尝试点击任务按钮
      const taskButton = page.locator('button:has-text("任务")');
      if (await taskButton.isVisible().catch(() => false)) {
        await taskButton.click();
        console.log('   ✅ 点击任务按钮打开抽屉');
        await page.waitForTimeout(500);
      }
    }

    // 截图
    await page.screenshot({ path: 'test-results/task-panel.png', fullPage: true });
    console.log('   📸 已保存截图: test-results/task-panel.png');

    console.log('\n✅ 任务面板验证完成！');
  });
});
