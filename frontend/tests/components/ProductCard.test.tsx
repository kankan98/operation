import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/types';

const mockProduct: Product = {
  id: '1',
  platform: 'amazon',
  productUrl: 'https://amazon.com/test',
  asin: 'B0TEST123',
  title: 'Test Product',
  brand: 'TestBrand',
  currency: 'USD',
  currentPrice: 99.99,
  isMonitoring: true,
  checkInterval: 3600,
  lastCheckedAt: Date.now(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('ProductCard', () => {
  it('displays product information', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/99\.99/)).toBeInTheDocument(); // Flexible currency format
    expect(screen.getByText('amazon')).toBeInTheDocument(); // Platform is lowercase in badge
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('calls onView when View button is clicked', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);

    expect(onView).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when Edit button is clicked', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit product');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onDelete when Delete button is clicked', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete product');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows stale warning when last check was over 24 hours ago', () => {
    const staleProduct = {
      ...mockProduct,
      lastCheckedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };

    render(
      <ProductCard
        product={staleProduct}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/stale/i)).toBeInTheDocument();
  });

  it('does not show LIVE badge when monitoring is disabled', () => {
    const inactiveProduct = {
      ...mockProduct,
      isMonitoring: false,
    };

    render(
      <ProductCard
        product={inactiveProduct}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });
});
