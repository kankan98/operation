import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ProductsList } from '@/pages/ProductsList';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  createSnapshot: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: [], isLoading: false }),
  useCreateProduct: () => ({
    mutateAsync: mocks.createProduct,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateProduct: () => ({
    mutateAsync: mocks.updateProduct,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteProduct: () => ({
    mutateAsync: mocks.deleteProduct,
    isPending: false,
  }),
}));

vi.mock('@/hooks/usePriceStats', () => ({
  useCreateSnapshot: () => ({
    mutate: mocks.createSnapshot,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

describe('ProductsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the add dialog open and shows create failures without clearing values', async () => {
    mocks.createProduct.mockRejectedValueOnce({
      response: { data: { message: 'Product URL already exists' } },
    });

    render(<ProductsList />);

    fireEvent.click(screen.getAllByRole('button', { name: /add product/i })[1]);

    const dialog = screen.getByRole('dialog', { name: /add new product/i });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /product url/i }), {
      target: { value: 'https://www.amazon.com/dp/B0AUDIT123' },
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /asin/i }), {
      target: { value: 'B0AUDIT123' },
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /product title/i }), {
      target: { value: 'Audit product' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /add product/i }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Product was not saved. Product URL already exists.',
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('textbox', { name: /product url/i })).toHaveValue(
      'https://www.amazon.com/dp/B0AUDIT123',
    );

    await waitFor(() => expect(mocks.createProduct).toHaveBeenCalledTimes(1));
  });
});
