import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedMessageCard } from './EnhancedMessageCard';
import type { ChatMessage } from '@/types/chat';

describe('EnhancedMessageCard parts 渲染', () => {
  it('按 parts 顺序渲染文本-工具-文本', () => {
    const message: ChatMessage = {
      id: 'm1',
      role: 'assistant',
      content: '段一段二',
      timestamp: 1,
      parts: [
        { type: 'text', id: 'b1', content: '段一' },
        { type: 'tool', id: 't1', name: 'searchProducts', input: {}, result: { ok: 1 }, isError: false },
        { type: 'text', id: 'b2', content: '段二' },
      ],
    };
    const { container } = render(<EnhancedMessageCard message={message} />);

    expect(screen.getByText('段一')).toBeInTheDocument();
    expect(screen.getByText('段二')).toBeInTheDocument();

    // 顺序：段一 在 工具卡(#tool-t1) 之前，段二 在其之后
    const html = container.innerHTML;
    expect(html.indexOf('段一')).toBeLessThan(html.indexOf('tool-t1'));
    expect(html.indexOf('tool-t1')).toBeLessThan(html.indexOf('段二'));
  });

  it('工具卡默认收起（不渲染"输入/结果"详情）', () => {
    const message: ChatMessage = {
      id: 'm2', role: 'assistant', content: '', timestamp: 1,
      parts: [{ type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: 1 }, isError: false }],
    };
    render(<EnhancedMessageCard message={message} />);
    expect(screen.queryByText('输入')).not.toBeInTheDocument();
  });
});
