import { chatApi } from './services/chatApi';

// 简单的 SSE 测试
async function testSSE() {
  const session = await chatApi.createSession({ title: '测试会话' });

  const abortController = new AbortController();
  let receivedText = '';

  const cleanup = await chatApi.streamMessage(
    '你好，请简单介绍一下自己（不超过50字）',
    [],
    abortController.signal,
    {
      onTextDelta: (delta) => {
        receivedText += delta;
      },
    },
    session.id
  );

  return { cleanup, getReceivedText: () => receivedText };
}

export { testSSE };
