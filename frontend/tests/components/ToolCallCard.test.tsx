import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCallCard } from '@/components/chat/ToolCallCard';

describe('ToolCallCard', () => {
  it('renders collapsed by default, hiding parameters and results', () => {
    render(
      <ToolCallCard
        toolName="analyzePriceTrend"
        parameters={{ productId: 'p1' }}
        result={{ trend: 'falling' }}
        status="success"
      />,
    );
    expect(screen.getByText(/analyzePriceTrend/)).toBeInTheDocument();
    expect(screen.queryByText(/Parameters:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Result:/)).not.toBeInTheDocument();
  });

  it('expands to reveal parameters and results on click', () => {
    render(
      <ToolCallCard
        toolName="analyzePriceTrend"
        parameters={{ productId: 'p1' }}
        result={{ trend: 'falling' }}
        status="success"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Parameters:/)).toBeInTheDocument();
    expect(screen.getByText(/Result:/)).toBeInTheDocument();
    expect(screen.getByText(/"productId": "p1"/)).toBeInTheDocument();
    expect(screen.getByText(/"trend": "falling"/)).toBeInTheDocument();
  });

  it('applies status-based styling (running=blue, success=green, error=red)', () => {
    const { container: running } = render(
      <ToolCallCard toolName="t" status="running" />,
    );
    expect(running.querySelector('.bg-blue-50')).toBeTruthy();
    expect(screen.getByText('Executing...')).toBeInTheDocument();

    const { container: ok } = render(<ToolCallCard toolName="t" status="success" />);
    expect(ok.querySelector('.bg-green-50')).toBeTruthy();

    const { container: err } = render(<ToolCallCard toolName="t" status="error" />);
    expect(err.querySelector('.bg-red-50')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
