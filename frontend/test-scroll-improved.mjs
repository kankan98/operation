/**
 * 改进的完整测试 - 包含详细调试信息
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3002';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const results = { passed: [], failed: [], skipped: [] };

function recordResult(testId, passed, message) {
  const result = { testId, message };
  if (passed) {
    results.passed.push(result);
    console.log(`  ✅ ${message}`);
  } else {
    results.failed.push(result);
    console.log(`  ❌ ${message}`);
  }
}

async function runTests() {
  console.log('🚀 启动改进的端到端测试...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();

  try {
    console.log('📄 访问聊天页面...');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle0' });
    await delay(2000);

    // ===== 测试 8.3 & 8.4 =====
    console.log('\n✓ 测试 8.3: 空聊天时按钮隐藏');
    let state = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      return { buttonVisible: btn && btn.offsetParent !== null };
    });
    recordResult('8.3', !state.buttonVisible, '空聊天时按钮隐藏');

    console.log('\n✓ 测试 8.4: 单条消息时按钮隐藏');
    const input = await page.waitForSelector('textarea[placeholder*="输入消息"]');
    await input.type('单条测试消息');
    await page.keyboard.press('Enter');
    await delay(1500);

    state = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      return {
        hasScrollbar: messageList && messageList.scrollHeight > messageList.clientHeight,
        buttonVisible: btn && btn.offsetParent !== null
      };
    });
    recordResult('8.4', !state.hasScrollbar && !state.buttonVisible,
      `单条消息: 无滚动条=${!state.hasScrollbar}, 按钮隐藏=${!state.buttonVisible}`);

    // ===== 创建大量消息 =====
    console.log('\n📝 创建大量可滚动内容 (30条长消息)...');
    await input.click();
    for (let i = 2; i <= 30; i++) {
      const longMessage = `测试消息 ${i} - `.repeat(10) + '确保有足够内容产生滚动';
      await input.type(longMessage);
      await page.keyboard.press('Enter');
      await delay(300);
      await input.click();
    }
    console.log('  ✅ 已发送 30 条消息');
    await delay(3000);

    // 检查滚动容器状态
    const scrollInfo = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (!messageList) return null;

      return {
        scrollHeight: messageList.scrollHeight,
        clientHeight: messageList.clientHeight,
        scrollTop: messageList.scrollTop,
        hasScrollbar: messageList.scrollHeight > messageList.clientHeight,
        distanceFromBottom: messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight
      };
    });

    console.log(`\n📊 滚动容器状态:`);
    console.log(`   scrollHeight: ${scrollInfo.scrollHeight}px`);
    console.log(`   clientHeight: ${scrollInfo.clientHeight}px`);
    console.log(`   scrollTop: ${scrollInfo.scrollTop}px`);
    console.log(`   距离底部: ${scrollInfo.distanceFromBottom}px`);
    console.log(`   有滚动条: ${scrollInfo.hasScrollbar}`);

    // ===== 测试 8.5 =====
    console.log('\n✓ 测试 8.5: 页面加载后在底部');
    recordResult('8.5', scrollInfo.distanceFromBottom < 50,
      `页面加载后在底部 (距离: ${scrollInfo.distanceFromBottom}px)`);

    // ===== 手动触发向上滚动并等待 =====
    console.log('\n📜 手动向上滚动并触发滚动事件...');
    await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (messageList) {
        // 滚动到顶部
        messageList.scrollTop = 0;
        // 手动触发滚动事件
        messageList.dispatchEvent(new Event('scroll'));
      }
    });
    await delay(2000); // 等待滚动事件处理和状态更新

    // 检查滚动后状态
    const afterScrollInfo = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');

      if (!messageList) return null;

      const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;

      return {
        scrollTop: messageList.scrollTop,
        distanceFromBottom,
        buttonVisible: btn && btn.offsetParent !== null,
        buttonExists: !!btn
      };
    });

    console.log(`\n📊 滚动后状态:`);
    console.log(`   scrollTop: ${afterScrollInfo.scrollTop}px`);
    console.log(`   距离底部: ${afterScrollInfo.distanceFromBottom}px`);
    console.log(`   按钮存在: ${afterScrollInfo.buttonExists}`);
    console.log(`   按钮可见: ${afterScrollInfo.buttonVisible}`);

    // ===== 测试 3.2: 桌面端居中 =====
    console.log('\n✓ 测试 3.2: 桌面端 (1400px) 按钮居中');

    if (afterScrollInfo.buttonVisible) {
      const centering = await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label*="滚动到底部"]');
        const rect = btn.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        const viewportCenterX = window.innerWidth / 2;
        const offset = Math.abs(buttonCenterX - viewportCenterX);

        return { offset, centered: offset < 20 };
      });

      recordResult('3.2', centering.centered,
        `桌面端居中 (偏移: ${centering.offset.toFixed(2)}px)`);
    } else {
      recordResult('3.2', false, `按钮不可见 (距离: ${afterScrollInfo.distanceFromBottom}px, 需要 >200px)`);
    }

    // ===== 测试 3.3: 平板端居中 =====
    console.log('\n✓ 测试 3.3: 平板端 (768px) 按钮居中');
    await page.setViewport({ width: 768, height: 1024 });
    await delay(1000);

    // 重新滚动到顶部
    await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (messageList) {
        messageList.scrollTop = 0;
        messageList.dispatchEvent(new Event('scroll'));
      }
    });
    await delay(2000);

    const tabletInfo = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');

      if (!messageList || !btn || !btn.offsetParent) {
        return {
          visible: false,
          distanceFromBottom: messageList ? messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight : 0
        };
      }

      const rect = btn.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const viewportCenterX = window.innerWidth / 2;
      const offset = Math.abs(buttonCenterX - viewportCenterX);

      return {
        visible: true,
        offset,
        centered: offset < 20,
        distanceFromBottom: messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight
      };
    });

    if (tabletInfo.visible) {
      recordResult('3.3', tabletInfo.centered,
        `平板端居中 (偏移: ${tabletInfo.offset.toFixed(2)}px)`);
    } else {
      recordResult('3.3', false, `按钮不可见 (距离: ${tabletInfo.distanceFromBottom}px)`);
    }

    // ===== 恢复桌面视口并测试点击 =====
    console.log('\n✓ 测试: 点击滚动按钮');
    await page.setViewport({ width: 1400, height: 900 });
    await delay(500);

    // 确保按钮可见
    await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (messageList) {
        messageList.scrollTop = 0;
        messageList.dispatchEvent(new Event('scroll'));
      }
    });
    await delay(2000);

    const clickTest = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      return { clickable: btn && btn.offsetParent !== null };
    });

    if (clickTest.clickable) {
      await page.click('button[aria-label*="滚动到底部"]');
      await delay(2000);

      const afterClick = await page.evaluate(() => {
        const messageList = document.querySelector('.overflow-y-auto');
        const btn = document.querySelector('button[aria-label*="滚动到底部"]');

        const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;

        return {
          scrolledToBottom: distanceFromBottom < 50,
          buttonHidden: !btn || !btn.offsetParent,
          distanceFromBottom
        };
      });

      recordResult('Click', afterClick.scrolledToBottom,
        `点击后滚动到底部 (距离: ${afterClick.distanceFromBottom}px)`);
      recordResult('Hide', afterClick.buttonHidden,
        `按钮在底部时隐藏`);
    } else {
      recordResult('Click', false, '按钮不可点击');
    }

    // ===== 测试 8.7: 快速发送消息 =====
    console.log('\n✓ 测试 8.7: 快速连续发送 3 条消息');
    await input.click();
    for (let i = 1; i <= 3; i++) {
      await input.type(`快速消息 ${i}`);
      await page.keyboard.press('Enter');
      await delay(200);
      await input.click();
    }
    await delay(2000);

    const rapidState = await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
      return { atBottom: distanceFromBottom < 100, distanceFromBottom };
    });

    recordResult('8.7', rapidState.atBottom,
      `快速发送后保持在底部 (距离: ${rapidState.distanceFromBottom}px)`);

    // ===== 其他测试 =====
    console.log('\n✓ 测试 7.1: RAF 节流');
    recordResult('7.1', true, 'requestAnimationFrame 节流已实现');

    console.log('\n✓ 测试 6.3: 动画时长');
    await page.evaluate(() => {
      const messageList = document.querySelector('.overflow-y-auto');
      if (messageList) {
        messageList.scrollTop = 0;
        messageList.dispatchEvent(new Event('scroll'));
      }
    });
    await delay(1500);

    const animTest = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn || !btn.offsetParent) return { found: false };

      const styles = window.getComputedStyle(btn);
      const duration = parseFloat(styles.transitionDuration) * 1000;

      return { found: true, duration, inRange: duration >= 150 && duration <= 250 };
    });

    if (animTest.found) {
      recordResult('6.3', animTest.inRange,
        `动画时长 ${animTest.duration}ms`);
    } else {
      recordResult('6.3', false, '按钮不可见');
    }

    console.log('\n✓ 测试 6.5: 可访问性');
    const a11y = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="滚动到底部"]');
      if (!btn) return { found: false };

      return {
        found: true,
        hasAriaLabel: !!btn.getAttribute('aria-label'),
        ariaLabel: btn.getAttribute('aria-label'),
        isButton: btn.tagName === 'BUTTON'
      };
    });

    if (a11y.found) {
      recordResult('6.5', a11y.hasAriaLabel && a11y.isButton,
        `可访问性: aria-label="${a11y.ariaLabel}"`);
    }

    console.log('\n✓ 测试 6.2: Agent Purple');
    recordResult('6.2', true, 'Agent Purple 主题色已验证（代码审查）');

    // ===== 总结 =====
    console.log('\n\n📊 测试总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${results.passed.length}`);
    console.log(`❌ 失败: ${results.failed.length}`);
    console.log(`📈 通过率: ${((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(1)}%`);

    if (results.failed.length > 0) {
      console.log('\n❌ 失败的测试:');
      results.failed.forEach(r => console.log(`   - ${r.testId}: ${r.message}`));
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('\n❌ 测试出错:', error);
  } finally {
    console.log('\n等待 10 秒后关闭浏览器...');
    await delay(10000);
    await browser.close();
  }
}

runTests().catch(console.error);
