import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/MessageBubble';

describe('MessageBubble', () => {
  it('renders a plain-text user message', () => {
    render(<MessageBubble role="user" content="Hello there" />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('renders assistant markdown: emphasis, lists, code, and tables', () => {
    const md = [
      '**Bold insight**',
      '',
      '- first item',
      '- second item',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
      '| Platform | Price |',
      '| --- | --- |',
      '| amazon | 99 |',
    ].join('\n');

    render(<MessageBubble role="assistant" content={md} />);

    // Emphasis
    expect(screen.getByText('Bold insight').tagName).toBe('STRONG');
    // Lists
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    // Code block
    expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
    // Table
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
  });

  it('styles user vs assistant bubbles differently', () => {
    const { container: userC } = render(<MessageBubble role="user" content="hi" />);
    expect(userC.querySelector('.bg-primary-600')).toBeTruthy();

    const { container: aiC } = render(<MessageBubble role="assistant" content="hi" />);
    // Assistant uses a bordered surface, not the brand fill
    expect(aiC.querySelector('.bg-primary-600')).toBeFalsy();
    expect(aiC.querySelector('.border-border')).toBeTruthy();
  });

  it('renders tool calls as collapsible tool cards', () => {
    render(
      <MessageBubble
        role="assistant"
        content="Done."
        toolCalls={[{ id: 't1', name: 'searchProducts', input: { query: 'widget' } }]}
        toolResults={[{ toolCallId: 't1', output: { count: 0 }, isError: false }]}
      />,
    );
    expect(screen.getByText(/searchProducts/)).toBeInTheDocument();
    // Collapsed by default: parameters hidden until expanded
    expect(screen.queryByText(/Parameters:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/searchProducts/));
    expect(screen.getByText(/Parameters:/)).toBeInTheDocument();
  });

  it('shows a timestamp when provided', () => {
    const ts = new Date('2026-01-01T12:00:00').getTime();
    render(<MessageBubble role="assistant" content="hi" timestamp={ts} />);
    // Rendered via toLocaleTimeString — just assert some time-like text exists
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});
