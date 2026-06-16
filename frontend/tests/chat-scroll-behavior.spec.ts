import { test, expect } from '@playwright/test';

/**
 * 聊天滚动行为测试
 * 验证智能自动滚动和用户意图检测功能
 */

test.describe('Chat Scroll Experience Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // 访问聊天页面
    await page.goto('http://localhost:3002/chat');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('8.3 - Empty chat: scroll button should be hidden', async ({ page }) => {
    // 空聊天状态，滚动按钮应该隐藏
    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).not.toBeVisible();
  });

  test('3.2 - Scroll button is horizontally centered on desktop', async ({ page }) => {
    // 设置桌面视口
    await page.setViewportSize({ width: 1400, height: 900 });

    // 发送多条消息以触发滚动
    const input = page.locator('textarea[placeholder*="输入消息"]');
    for (let i = 0; i < 10; i++) {
      await input.fill(`测试消息 ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(300);
    }

    // 向上滚动以显示滚动按钮
    const messageList = page.locator('.overflow-y-auto').first();
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    // 验证滚动按钮可见且居中
    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).toBeVisible();

    // 检查按钮位置是否居中
    const buttonBox = await scrollButton.boundingBox();
    const viewportWidth = 1400;
    if (buttonBox) {
      const buttonCenterX = buttonBox.x + buttonBox.width / 2;
      const viewportCenterX = viewportWidth / 2;
      // 允许 20px 的误差
      expect(Math.abs(buttonCenterX - viewportCenterX)).toBeLessThan(20);
    }
  });

  test('3.3 - Scroll button is horizontally centered on tablet', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    // 发送多条消息
    const input = page.locator('textarea[placeholder*="输入消息"]');
    for (let i = 0; i < 10; i++) {
      await input.fill(`测试消息 ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(300);
    }

    // 向上滚动
    const messageList = page.locator('.overflow-y-auto').first();
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    // 验证居中
    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).toBeVisible();

    const buttonBox = await scrollButton.boundingBox();
    const viewportWidth = 768;
    if (buttonBox) {
      const buttonCenterX = buttonBox.x + buttonBox.width / 2;
      const viewportCenterX = viewportWidth / 2;
      expect(Math.abs(buttonCenterX - viewportCenterX)).toBeLessThan(20);
    }
  });

  test('3.4 - Scroll button is horizontally centered on mobile', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 发送多条消息
    const input = page.locator('textarea[placeholder*="输入消息"]');
    for (let i = 0; i < 10; i++) {
      await input.fill(`测试消息 ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(300);
    }

    // 向上滚动
    const messageList = page.locator('.overflow-y-auto').first();
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    // 验证居中
    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).toBeVisible();

    const buttonBox = await scrollButton.boundingBox();
    const viewportWidth = 375;
    if (buttonBox) {
      const buttonCenterX = buttonBox.x + buttonBox.width / 2;
      const viewportCenterX = viewportWidth / 2;
      expect(Math.abs(buttonCenterX - viewportCenterX)).toBeLessThan(20);
    }
  });

  test('6.4 - Mobile touch target is ≥48px × 48px', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 发送消息并滚动
    const input = page.locator('textarea[placeholder*="输入消息"]');
    for (let i = 0; i < 5; i++) {
      await input.fill(`测试消息 ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(200);
    }

    const messageList = page.locator('.overflow-y-auto').first();
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    // 验证按钮尺寸
    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).toBeVisible();

    const buttonBox = await scrollButton.boundingBox();
    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(48);
      expect(buttonBox.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('6.5 - Accessibility: keyboard navigation and screen reader labels', async ({ page }) => {
    // 发送消息
    const input = page.locator('textarea[placeholder*="输入消息"]');
    for (let i = 0; i < 5; i++) {
      await input.fill(`测试消息 ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(200);
    }

    // 向上滚动显示按钮
    const messageList = page.locator('.overflow-y-auto').first();
    await messageList.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    const scrollButton = page.locator('button[aria-label*="滚动到底部"]');
    await expect(scrollButton).toBeVisible();

    // 验证 aria-label 存在
    const ariaLabel = await scrollButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('滚动到底部');

    // 验证可以通过键盘聚焦
    await scrollButton.focus();
    await expect(scrollButton).toBeFocused();

    // 验证可以通过键盘激活
    await scrollButton.press('Enter');
    await page.waitForTimeout(500);

    // 滚动后按钮应该消失
    await expect(scrollButton).not.toBeVisible();
  });
});
