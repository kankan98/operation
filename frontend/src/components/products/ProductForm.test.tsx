import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProductForm } from '@/components/products/ProductForm';

const ProductFormWithSubmissionError = ProductForm as React.ComponentType<
  React.ComponentProps<typeof ProductForm> & { submissionError?: string }
>;

describe('ProductForm', () => {
  it('shows validation errors without overlapping actions', async () => {
    render(<ProductForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /add product/i }));

    expect(await screen.findByText('Must be a valid URL')).toBeInTheDocument();
    expect(screen.getByText('ASIN / Product ID is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();

    const actionRow = screen.getByRole('button', { name: /add product/i }).parentElement;
    expect(actionRow).not.toHaveClass('sticky');
  });

  it('renders submission errors while preserving entered values', async () => {
    render(
      <ProductFormWithSubmissionError
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submissionError="Product was not saved. Product URL already exists."
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /product url/i }), {
      target: { value: 'https://www.amazon.com/dp/B0AUDIT123' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /asin/i }), {
      target: { value: 'B0AUDIT123' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /product title/i }), {
      target: { value: 'Audit product' },
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Product was not saved. Product URL already exists.',
      );
    });

    expect(screen.getByRole('textbox', { name: /product url/i })).toHaveValue(
      'https://www.amazon.com/dp/B0AUDIT123',
    );
    expect(screen.getByRole('textbox', { name: /asin/i })).toHaveValue('B0AUDIT123');
    expect(screen.getByRole('textbox', { name: /product title/i })).toHaveValue(
      'Audit product',
    );
  });
});
