/**
 * 自动化滚动测试 - 使用 Puppeteer
 * 测试聊天滚动体验优化功能
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3002';

// 辅助函数：延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('🚀 启动自动化测试...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();

  try {
    // 访问聊天页面
    console.log('📄 访问聊天页面...');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle0' });
    await delay(2000);

    // 测试 8.3: 空聊天时滚动按钮应隐藏
    console.log('\n✓ 测试 8.3: 空聊天时滚动按钮隐藏');
    const buttonHiddenInitially = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      return !btn || window.getComputedStyle(btn).display === 'none' || !btn.offsetParent;
    });
    console.log(buttonHiddenInitially ? '  ✅ 通过 - 按钮已隐藏' : '  ❌ 失败 - 按钮不应该显示');

    // 发送多条消息以创建可滚动内容
    console.log('\n📝 发送测试消息创建可滚动内容...');
    const input = await page.waitForSelector('textarea[placeholder*="输入消息"]');

    for (let i = 1; i <= 15; i++) {
      await input.type(`测试消息 ${i} - 这是一条用于测试滚动功能的消息内容`);
      await page.keyboard.press('Enter');
      await delay(500);
      await input.click(); // 重新聚焦输入框
    }

    console.log('  ✅ 已发送 15 条测试消息');
    await delay(2000);

    // 向上滚动以触发滚动按钮显示
    console.log('\n📜 向上滚动以显示滚动按钮...');
    await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (messageList) {
        messageList.scrollTop = 0;
      }
    });
    await delay(1000);

    // 测试 3.2: 桌面端按钮居中
    console.log('\n✓ 测试 3.2: 桌面端按钮居中 (1400px)');
    const centeringResult = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn) return { visible: false };

      const rect = btn.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const viewportCenterX = window.innerWidth / 2;
      const offset = Math.abs(buttonCenterX - viewportCenterX);

      return {
        visible: true,
        offset: offset,
        buttonCenterX: buttonCenterX,
        viewportCenterX: viewportCenterX,
        centered: offset < 20
      };
    });

    if (centeringResult.visible) {
      console.log(`  按钮中心 X: ${centeringResult.buttonCenterX.toFixed(2)}px`);
      console.log(`  视口中心 X: ${centeringResult.viewportCenterX.toFixed(2)}px`);
      console.log(`  偏移量: ${centeringResult.offset.toFixed(2)}px`);
      console.log(centeringResult.centered ? '  ✅ 通过 - 按钮已居中' : '  ❌ 失败 - 按钮未居中');
    } else {
      console.log('  ⚠️  按钮不可见');
    }

    // 测试 3.3: 平板端按钮居中
    console.log('\n✓ 测试 3.3: 平板端按钮居中 (768px)');
    await page.setViewport({ width: 768, height: 1024 });
    await delay(500);

    const tabletCentering = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn) return { visible: false };

      const rect = btn.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const viewportCenterX = window.innerWidth / 2;
      const offset = Math.abs(buttonCenterX - viewportCenterX);

      return {
        visible: true,
        offset: offset,
        centered: offset < 20
      };
    });

    if (tabletCentering.visible) {
      console.log(`  偏移量: ${tabletCentering.offset.toFixed(2)}px`);
      console.log(tabletCentering.centered ? '  ✅ 通过 - 按钮已居中' : '  ❌ 失败 - 按钮未居中');
    } else {
      console.log('  ⚠️  按钮不可见');
    }

    // 测试 3.4 & 6.4: 移动端按钮居中和尺寸
    console.log('\n✓ 测试 3.4: 移动端按钮居中 (375px)');
    console.log('✓ 测试 6.4: 移动端触摸目标 ≥48px');
    await page.setViewport({ width: 375, height: 667 });
    await delay(500);

    const mobileResult = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn) return { visible: false };

      const rect = btn.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const viewportCenterX = window.innerWidth / 2;
      const offset = Math.abs(buttonCenterX - viewportCenterX);

      return {
        visible: true,
        offset: offset,
        centered: offset < 20,
        width: rect.width,
        height: rect.height,
        sizeOk: rect.width >= 48 && rect.height >= 48
      };
    });

    if (mobileResult.visible) {
      console.log(`  偏移量: ${mobileResult.offset.toFixed(2)}px`);
      console.log(mobileResult.centered ? '  ✅ 通过 - 按钮已居中' : '  ❌ 失败 - 按钮未居中');
      console.log(`  按钮尺寸: ${mobileResult.width.toFixed(0)}x${mobileResult.height.toFixed(0)}px`);
      console.log(mobileResult.sizeOk ? '  ✅ 通过 - 触摸目标尺寸达标' : '  ❌ 失败 - 触摸目标尺寸不足');
    } else {
      console.log('  ⚠️  按钮不可见');
    }

    // 测试 6.5: 可访问性
    console.log('\n✓ 测试 6.5: 可访问性（aria-label 和键盘导航）');
    await page.setViewport({ width: 1400, height: 900 });
    await delay(500);

    const a11yResult = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn) return { visible: false };

      const ariaLabel = btn.getAttribute('aria-label');

      return {
        visible: true,
        hasAriaLabel: !!ariaLabel,
        ariaLabelValue: ariaLabel
      };
    });

    if (a11yResult.visible) {
      console.log(`  aria-label: "${a11yResult.ariaLabelValue}"`);
      console.log(a11yResult.hasAriaLabel ? '  ✅ 通过 - aria-label 已设置' : '  ❌ 失败 - 缺少 aria-label');

      // 测试键盘导航
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focused = await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label*="滚动到底部"]');
        return document.activeElement === btn;
      });

      console.log(focused ? '  ✅ 通过 - 按钮可通过 Tab 聚焦' : '  ℹ️  按钮未聚焦（可能需要更多 Tab）');
    } else {
      console.log('  ⚠️  按钮不可见');
    }

    // 测试滚动按钮点击功能
    console.log('\n✓ 测试: 点击滚动按钮滚动到底部');
    await page.click('button[aria-label*="滚动到底部"]');
    await delay(1000);

    const scrolledToBottom = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (!messageList) return false;

      const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
      return distanceFromBottom < 50; // 允许一些误差
    });

    console.log(scrolledToBottom ? '  ✅ 通过 - 已滚动到底部' : '  ❌ 失败 - 未滚动到底部');

    // 测试按钮在底部时隐藏
    await delay(1000);
    const buttonHiddenAtBottom = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      return !btn || window.getComputedStyle(btn).display === 'none' || !btn.offsetParent;
    });

    console.log(buttonHiddenAtBottom ? '  ✅ 通过 - 按钮在底部时已隐藏' : '  ❌ 失败 - 按钮应该隐藏');

    console.log('\n\n🎉 测试完成！\n');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  } finally {
    console.log('等待 5 秒后关闭浏览器...');
    await delay(5000);
    await browser.close();
  }
}

// 运行测试
runTests().catch(console.error);
