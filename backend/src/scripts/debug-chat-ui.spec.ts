import { test } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3006';

test('调试：检查聊天页面元素', async ({ page }) => {
  await page.goto(`${FRONTEND_URL}/chat`);
  await page.waitForLoadState('networkidle');

  console.log('\n=== 页面结构调试 ===\n');

  // 1. 查找输入框
  const inputs = await page.locator('input, textarea').all();
  console.log(`找到 ${inputs.length} 个输入框:`);
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    console.log(`  ${i + 1}. type="${type}" placeholder="${placeholder}"`);
  }

  // 2. 查找发送按钮
  const buttons = await page.locator('button').all();
  console.log(`\n找到 ${buttons.length} 个按钮:`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    console.log(`  ${i + 1}. type="${type}" text="${text?.trim()}"`);
  }

  // 3. 发送测试消息
  const messageInput = page.locator('textarea').first();
  await messageInput.fill('测试消息');

  const sendButton = page.locator('button[type="submit"]').first();
  await sendButton.click();

  // 等待响应
  await page.waitForTimeout(3000);

  // 4. 查找消息容器
  console.log('\n=== 查找消息容器 ===\n');

  const possibleSelectors = [
    '[data-message]',
    '[class*="Message"]',
    '[class*="message"]',
    '[class*="chat"]',
    '[class*="Chat"]',
    '[role="log"]',
    'article',
    '.prose',
    'div[class*="content"]',
    'p',
  ];

  for (const selector of possibleSelectors) {
    const elements = await page.locator(selector).all();
    if (elements.length > 0) {
      console.log(`\n✓ 找到 ${elements.length} 个元素: ${selector}`);
      // 只查看最后3个元素（最新的消息）
      const startIdx = Math.max(0, elements.length - 3);
      for (let i = startIdx; i < elements.length; i++) {
        const text = await elements[i].textContent();
        const textPreview = text?.slice(0, 150).replace(/\n/g, ' ');
        console.log(`  ${i + 1}/${elements.length}. 长度:${text?.length} 内容:"${textPreview}${text && text.length > 150 ? '...' : ''}"`);
      }
    }
  }

  // 5. 获取整个页面的文本内容
  const bodyText = await page.locator('body').textContent();
  console.log(`\n=== 页面文本内容长度: ${bodyText?.length} ===`);
  console.log(`是否包含"测试消息": ${bodyText?.includes('测试消息')}`);
});
