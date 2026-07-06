import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../src/components/ui/Modal';

describe('Modal', () => {
  it('uses a fixed dialog shell with a scrollable body', () => {
    render(
      <Modal title="Add product" onClose={vi.fn()}>
        <div>Long form content</div>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: /add product/i })).toHaveClass(
      'flex',
      'flex-col',
      'overflow-hidden',
    );
    expect(screen.getByText('Long form content').parentElement).toHaveClass('overflow-y-auto');
  });
});
