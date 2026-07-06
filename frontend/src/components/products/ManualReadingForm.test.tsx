import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ManualReadingForm,
  type ManualReadingInput,
} from '@/components/products/ManualReadingForm';

describe('ManualReadingForm', () => {
  it('renders readable stock status options without raw enum labels', () => {
    renderManualReadingForm();

    const stockStatus = screen.getByRole('combobox', { name: '库存状态' });
    const options = screen.getAllByRole('option');

    expect(stockStatus).toHaveDisplayValue('有货');
    expect(options.map((option) => option.textContent)).toEqual([
      '有货',
      '库存偏低',
      '缺货',
    ]);
    expect(screen.queryByText('in_stock')).not.toBeInTheDocument();
    expect(screen.queryByText('low_stock')).not.toBeInTheDocument();
    expect(screen.queryByText('out_of_stock')).not.toBeInTheDocument();
  });

  it('submits the selected stock status enum value', () => {
    const onSubmit = vi.fn();

    renderManualReadingForm({ onSubmit });

    fireEvent.change(screen.getByRole('spinbutton', { name: '价格 (USD) *' }), {
      target: { value: '18.5' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '库存状态' }), {
      target: { value: 'low_stock' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    expect(screen.getByRole('combobox', { name: '库存状态' })).toHaveDisplayValue(
      '库存偏低',
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 18.5,
        availability: 'low_stock',
      }),
    );
  });

  it('keeps entered values visible when save fails', () => {
    const onSubmit = vi.fn();

    const { rerender } = renderManualReadingForm({ onSubmit });

    fireEvent.change(screen.getByRole('spinbutton', { name: '价格 (USD) *' }), {
      target: { value: '19.99' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '销量排名 (BSR)' }), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '评分' }), {
      target: { value: '4.4' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '评论数' }), {
      target: { value: '678' },
    });

    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    rerenderManualReadingForm(rerender, { onSubmit, isError: true });

    expect(screen.getByRole('alert')).toHaveTextContent(
      '保存失败，请检查价格等输入后重试。',
    );
    expect(screen.getByRole('spinbutton', { name: '价格 (USD) *' })).toHaveValue(19.99);
    expect(screen.getByRole('spinbutton', { name: '销量排名 (BSR)' })).toHaveValue(12345);
    expect(screen.getByRole('spinbutton', { name: '评分' })).toHaveValue(4.4);
    expect(screen.getByRole('spinbutton', { name: '评论数' })).toHaveValue(678);
  });

  it('clears entered reading fields after save succeeds', () => {
    const onSubmit = vi.fn();

    const { rerender } = renderManualReadingForm({ onSubmit });

    fireEvent.change(screen.getByRole('spinbutton', { name: '价格 (USD) *' }), {
      target: { value: '21.75' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '销量排名 (BSR)' }), {
      target: { value: '9876' },
    });

    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    expect(screen.getByRole('spinbutton', { name: '价格 (USD) *' })).toHaveValue(21.75);

    rerenderManualReadingForm(rerender, { onSubmit, isSuccess: true });

    expect(screen.getByRole('spinbutton', { name: '价格 (USD) *' })).toHaveValue(null);
    expect(screen.getByRole('spinbutton', { name: '销量排名 (BSR)' })).toHaveValue(null);
  });

  it('submits preserved values again after a failed save', () => {
    const onSubmit = vi.fn();

    const { rerender } = renderManualReadingForm({ onSubmit });

    fireEvent.change(screen.getByRole('spinbutton', { name: '价格 (USD) *' }), {
      target: { value: '19.99' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '销量排名 (BSR)' }), {
      target: { value: '12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    rerenderManualReadingForm(rerender, { onSubmit, isError: true });
    fireEvent.click(screen.getByRole('button', { name: '保存读数' }));

    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        price: 19.99,
        salesRank: 12345,
      }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});

function renderManualReadingForm({
  onSubmit = vi.fn(),
  isSaving = false,
  isError = false,
  isSuccess = false,
}: Partial<{
  onSubmit: (data: ManualReadingInput) => void;
  isSaving: boolean;
  isError: boolean;
  isSuccess: boolean;
}> = {}) {
  return render(
    <ManualReadingForm
      currency="USD"
      isSaving={isSaving}
      isError={isError}
      isSuccess={isSuccess}
      onSubmit={onSubmit}
    />,
  );
}

function rerenderManualReadingForm(
  rerender: ReturnType<typeof render>['rerender'],
  {
    onSubmit = vi.fn(),
    isSaving = false,
    isError = false,
    isSuccess = false,
  }: Partial<{
    onSubmit: (data: ManualReadingInput) => void;
    isSaving: boolean;
    isError: boolean;
    isSuccess: boolean;
  }> = {},
) {
  rerender(
    <ManualReadingForm
      currency="USD"
      isSaving={isSaving}
      isError={isError}
      isSuccess={isSuccess}
      onSubmit={onSubmit}
    />,
  );
}
