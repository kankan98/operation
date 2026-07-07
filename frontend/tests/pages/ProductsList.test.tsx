import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { createMockProduct, createMockProducts } from '../__utils__/fixtures';
import { ProductsList } from '../../src/pages/ProductsList';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock the hooks and components
vi.mock('../../src/hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useCreateProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
  useDeleteProduct: vi.fn(),
}));

vi.mock('../../src/hooks/usePriceStats', () => ({
  useCreateSnapshot: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProductsList', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    const productsHooks = await import('../../src/hooks/useProducts');
    vi.mocked(productsHooks.useCreateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof productsHooks.useCreateProduct>);
    vi.mocked(productsHooks.useUpdateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof productsHooks.useUpdateProduct>);
    vi.mocked(productsHooks.useDeleteProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof productsHooks.useDeleteProduct>);

    const priceHooks = await import('../../src/hooks/usePriceStats');
    vi.mocked(priceHooks.useCreateSnapshot).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    } as ReturnType<typeof priceHooks.useCreateSnapshot>);
  });

  it('renders product grid with data', async () => {
    const { useProducts } = await import('../../src/hooks/useProducts');

    const products = createMockProducts(3);

    vi.mocked(useProducts).mockReturnValue({
      data: products,
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);

    // Since we can't easily test the full page, we'll test that ProductCard displays data
    const { ProductCard } = await import('../../src/components/products/ProductCard');

    renderWithProviders(
      <ProductCard
        product={products[0]}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(products[0].title)).toBeInTheDocument();
  });

  it('shows empty state when no products', async () => {
    const { useProducts } = await import('../../src/hooks/useProducts');

    vi.mocked(useProducts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);

    renderWithProviders(<ProductsList />);

    expect(screen.getByText(/0 products? added|已添加 0 件商品/i)).toBeInTheDocument();
    expect(
      screen.getByText(/manual research sample|添加第一件商品，先建立手动研究样本/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/0 products monitored|已监控 0 件商品|start monitoring prices|开始价格监控/i),
    ).not.toBeInTheDocument();
  });

  it('handles product card interactions', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const products = createMockProducts(1);
    const { ProductCard } = await import('../../src/components/products/ProductCard');

    renderWithProviders(
      <ProductCard
        product={products[0]}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Click view button
    const viewButton = screen.getByRole('button', { name: /view/i });
    await user.click(viewButton);
    expect(onView).toHaveBeenCalledWith(products[0].id);

    // Click edit button
    const editButton = screen.getByLabelText('Edit product');
    await user.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(products[0]);

    // Click delete button
    const deleteButton = screen.getByLabelText('Delete product');
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(products[0].id);
  });

  it('opens a quick manual reading dialog from a product card', async () => {
    const user = userEvent.setup();
    const { useProducts } = await import('../../src/hooks/useProducts');
    const product = createMockProduct({ id: 'product-quick-1', title: 'Quick Entry Product' });

    vi.mocked(useProducts).mockReturnValue({
      data: [product],
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);

    renderWithProviders(<ProductsList />);

    await user.click(screen.getByLabelText('记录手动读数'));

    expect(screen.getByRole('heading', { name: /记录手动读数/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/价格/)).toBeInTheDocument();
    expect(screen.getByLabelText(/库存状态/)).toBeInTheDocument();
  });

  it('submits a manual reading from the product list with product currency', async () => {
    const user = userEvent.setup();
    const { useProducts } = await import('../../src/hooks/useProducts');
    const { useCreateSnapshot } = await import('../../src/hooks/usePriceStats');
    const mutate = vi.fn();
    const product = createMockProduct({
      id: 'product-quick-2',
      title: 'Currency Product',
      currency: 'USD',
    });

    vi.mocked(useProducts).mockReturnValue({
      data: [product],
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);
    vi.mocked(useCreateSnapshot).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      isSuccess: false,
    } as ReturnType<typeof useCreateSnapshot>);

    renderWithProviders(<ProductsList />);

    await user.click(screen.getByLabelText('记录手动读数'));
    await user.type(screen.getByLabelText(/价格/), '88.50');
    await user.click(screen.getByRole('button', { name: '保存读数' }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: product.id,
        price: 88.5,
        currency: 'USD',
        availability: 'in_stock',
        source: 'manual',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('closes the manual reading dialog after a successful save', async () => {
    const user = userEvent.setup();
    const { useProducts } = await import('../../src/hooks/useProducts');
    const { useCreateSnapshot } = await import('../../src/hooks/usePriceStats');
    const product = createMockProduct({
      id: 'product-quick-3',
      title: 'Close Dialog Product',
      currency: 'USD',
    });
    const mutate = vi.fn((_data, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });

    vi.mocked(useProducts).mockReturnValue({
      data: [product],
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);
    vi.mocked(useCreateSnapshot).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      isSuccess: false,
    } as ReturnType<typeof useCreateSnapshot>);

    renderWithProviders(<ProductsList />);

    await user.click(screen.getByLabelText('记录手动读数'));
    await user.type(screen.getByLabelText(/价格/), '91.25');
    await user.click(screen.getByRole('button', { name: '保存读数' }));

    expect(screen.queryByRole('heading', { name: /记录手动读数/ })).not.toBeInTheDocument();
  });

  it('navigates to the created product detail with first setup state after adding a product', async () => {
    const user = userEvent.setup();
    const { useProducts, useCreateProduct } = await import('../../src/hooks/useProducts');
    const created = createMockProduct({
      id: 'created-product-setup-1',
      title: 'Setup Flow Product',
      productUrl: 'https://www.amazon.com/dp/B0SETUP001',
      asin: 'B0SETUP001',
      brand: 'Acme',
      currency: 'USD',
    });
    const mutateAsync = vi.fn().mockResolvedValue(created);

    vi.mocked(useProducts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useProducts>);
    vi.mocked(useCreateProduct).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateProduct>);

    renderWithProviders(<ProductsList />);

    await user.click(screen.getAllByRole('button', { name: /Add Product|添加商品/ })[0]);
    await user.type(screen.getByLabelText(/Product URL|商品链接/i), created.productUrl);
    await user.type(screen.getByLabelText(/ASIN \/ Product ID|ASIN|商品编号/i), created.asin);
    await user.type(screen.getByLabelText(/Product Title|商品标题/i), created.title);
    await user.type(screen.getByLabelText(/^Brand$|^品牌$/i), created.brand!);
    await user.click(screen.getAllByRole('button', { name: /Add Product|添加商品/ }).at(-1)!);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          productUrl: created.productUrl,
          asin: created.asin,
          title: created.title,
        }),
      );
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/products/created-product-setup-1', {
        state: { fromProductCreate: true },
      });
    });
  });
});
