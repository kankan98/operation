import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('uses a shrinkable internal scroll region for long content', () => {
    render(
      <Modal title="Long form" onClose={vi.fn()}>
        <div data-testid="long-modal-content" className="h-[1200px]">
          Long modal content
        </div>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Long form' });
    const body = screen.getByTestId('long-modal-content').parentElement;

    expect(dialog).toHaveClass('max-h-[90vh]', 'flex-col');
    expect(body).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
  });
});
