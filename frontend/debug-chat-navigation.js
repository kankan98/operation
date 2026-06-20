/**
 * 调试脚本：检查 Chat 页面的导航行为
 *
 * 使用方法：
 * 1. 打开 http://localhost:3003
 * 2. 打开浏览器控制台
 * 3. 粘贴并运行此脚本
 */

console.log('=== Chat Navigation Debug ===');

// 1. 检查 localStorage
console.log('\n1. LocalStorage 状态:');
const chatStorage = localStorage.getItem('chat-storage');
if (chatStorage) {
  const parsed = JSON.parse(chatStorage);
  console.log('  - chat-storage 内容:', parsed);
  console.log('  - currentSessionId:', parsed.state?.currentSessionId);
  console.log('  - sessions 数量:', parsed.state?.sessions?.length);
} else {
  console.log('  - chat-storage: 不存在');
}

// 2. 检查当前 URL
console.log('\n2. 当前 URL:');
console.log('  -', window.location.href);
console.log('  - pathname:', window.location.pathname);

// 3. 检查 Store 状态
console.log('\n3. Store 状态:');
console.log('  - 提示: 在 React DevTools 中查看 useChatStore 的状态');

// 4. 模拟点击"智能助手"菜单
console.log('\n4. 模拟导航行为:');
console.log('  - 执行: window.location.href = "http://localhost:3003/chat"');
console.log('  - 预期: URL 应该保持在 /chat (不带 sessionId)');
console.log('  - 预期: 页面应该显示空对话状态');

// 5. 清除缓存的辅助函数
console.log('\n5. 清除缓存 (如果需要):');
console.log('  - 执行: localStorage.removeItem("chat-storage")');
console.log('  - 执行: window.location.reload()');

// 6. 测试脚本
console.log('\n6. 测试导航到 /chat:');
const testNavigation = () => {
  console.log('  - 当前 URL:', window.location.pathname);

  // 导航到 /chat
  window.history.pushState({}, '', '/chat');
  console.log('  - 已导航到:', window.location.pathname);

  // 等待 React 路由处理
  setTimeout(() => {
    console.log('  - 1秒后 URL:', window.location.pathname);

    // 检查是否有重定向
    if (window.location.pathname !== '/chat') {
      console.error('  ❌ URL 被重定向到:', window.location.pathname);
      console.error('  ❌ 应该停留在 /chat');
    } else {
      console.log('  ✅ URL 正确保持在 /chat');
    }
  }, 1000);
};

console.log('  - 运行测试: testNavigation()');
window.testNavigation = testNavigation;

console.log('\n=== Debug Complete ===');
console.log('建议步骤:');
console.log('1. 检查上面的 localStorage 输出');
console.log('2. 运行 testNavigation() 测试导航行为');
console.log('3. 如果有问题，运行 localStorage.removeItem("chat-storage") 并刷新');
