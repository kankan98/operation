import { chatApi } from './services/chatApi';

// 简单的 SSE 测试
async function testSSE() {
  console.log('🧪 开始测试 SSE 流式消息');

  // 1. 创建会话
  console.log('1️⃣ 创建会话...');
  const session = await chatApi.createSession({ title: '测试会话' });
  console.log('✅ 会话创建成功:', session.id);

  // 2. 测试流式消息
  console.log('2️⃣ 发送流式消息...');

  const abortController = new AbortController();
  let receivedText = '';

  const cleanup = await chatApi.streamMessage(
    '你好，请简单介绍一下自己（不超过50字）',
    [],
    abortController.signal,
    {
      onMessageStart: (messageId, sessionId) => {
        console.log('📨 消息开始:', { messageId, sessionId });
      },
      onStatus: (status, context) => {
        console.log('🔄 状态变化:', status, context ? `(${context})` : '');
      },
      onTextDelta: (delta) => {
        receivedText += delta;
        console.log('✍️ 文本增量:', delta);
        console.log('📝 累计文本长度:', receivedText.length);
      },
      onToolCallStart: (toolCall) => {
        console.log('🔧 工具调用:', toolCall.name);
      },
      onToolResult: (result) => {
        console.log('✅ 工具结果:', result.toolCallId);
      },
      onUsage: (usage) => {
        console.log('💰 Token 使用:', usage);
      },
      onMessageDone: () => {
        console.log('🏁 消息完成');
        console.log('📊 最终文本:', receivedText);
        console.log('📊 文本长度:', receivedText.length);
      },
      onError: (error) => {
        console.error('❌ 错误:', error);
      },
    },
    session.id
  );

  console.log('✅ 流式连接已建立');

  // 返回清理函数
  return cleanup;
}

// 导出测试函数到全局
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).testSSE = testSSE;
  console.log('💡 在浏览器控制台运行: await testSSE()');
}

export { testSSE };
