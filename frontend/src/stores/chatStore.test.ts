import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import type { ChatMessage } from './chatStore';

function seedAssistant() {
  const msg: ChatMessage = { id: 'm1', role: 'assistant', content: '', parts: [], timestamp: 1 };
  useChatStore.getState().setMessages([msg]);
}

describe('chatStore parts actions', () => {
  beforeEach(() => useChatStore.getState().reset());

  it('文本→工具→文本 构建有序 parts', () => {
    seedAssistant();
    const s = useChatStore.getState();
    s.startTextBlock('b1');
    s.appendTextBlock('b1', '先说');
    s.appendTextBlock('b1', '一段');
    s.endTextBlock('b1');
    s.appendToolPart({ type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' } });
    s.completeToolPart('t1', { result: { ok: 1 }, isError: false, durationMs: 9 });
    s.startTextBlock('b2');
    s.appendTextBlock('b2', '再说一段');
    s.endTextBlock('b2');

    const parts = useChatStore.getState().messages[0].parts!;
    expect(parts.map((p) => p.type)).toEqual(['text', 'tool', 'text']);
    expect(parts[0]).toMatchObject({ type: 'text', content: '先说一段' });
    expect(parts[1]).toMatchObject({ type: 'tool', id: 't1', result: { ok: 1 }, durationMs: 9 });
    expect(parts[2]).toMatchObject({ type: 'text', content: '再说一段' });
    // content 兼容字段同步为文本拼接
    expect(useChatStore.getState().messages[0].content).toBe('先说一段再说一段');
  });

  it('appendTextBlock 对未知 blockId 容错创建', () => {
    seedAssistant();
    const s = useChatStore.getState();
    s.appendTextBlock('bx', 'hi');
    // 文本增量经 requestAnimationFrame 批处理，测试中手动刷新以断言结果
    s._flushTextDeltas();
    const parts = useChatStore.getState().messages[0].parts!;
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ type: 'text', id: 'bx', content: 'hi' });
  });
});
