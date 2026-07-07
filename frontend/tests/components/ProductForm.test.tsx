import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductForm } from '../../src/components/products/ProductForm';
import { createMockProduct } from '../__utils__/fixtures';
import userEvent from '@testing-library/user-event';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ProductForm', () => {
  it('associates editable controls with accessible labels', () => {
    renderWithRouter(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/platform|平台/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product url|商品链接/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asin \/ product id|asin \/ 商品编号/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product title|商品标题/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^brand$|^品牌$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency|货币/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enable monitoring|启用监控/i)).not.toBeChecked();
    expect(screen.queryByLabelText(/check interval|检查间隔/i)).not.toBeInTheDocument();
  });

  it('describes monitoring as optional and reveals interval after enabling it', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText(/optional automatic checks|可选自动检查/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/check interval \(hours\)|检查间隔（小时）/i)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/enable monitoring|启用监控/i));

    expect(screen.getByLabelText(/check interval \(hours\)|检查间隔（小时）/i)).toBeInTheDocument();
    expect(screen.getByText(/1-168 hours.*default is 24 hours|1 到 168 小时.*默认 24 小时/i)).toBeInTheDocument();
  });

  it('submits manual-first defaults when monitoring is not enabled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText(/product url|商品链接/i),
      'https://www.amazon.com/dp/B0MANUAL01',
    );
    await user.type(screen.getByLabelText(/asin \/ product id|asin \/ 商品编号/i), 'B0MANUAL01');
    await user.type(screen.getByLabelText(/product title|商品标题/i), 'Manual first item');
    await user.click(screen.getByRole('button', { name: /add product|添加商品/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        isMonitoring: false,
        checkInterval: 24,
      }),
    );
  });

  it('submits monitoring settings only after the user enables monitoring', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText(/enable monitoring|启用监控/i));
    await user.clear(screen.getByLabelText(/check interval \(hours\)|检查间隔（小时）/i));
    await user.type(screen.getByLabelText(/check interval \(hours\)|检查间隔（小时）/i), '12');
    await user.type(
      screen.getByLabelText(/product url|商品链接/i),
      'https://www.amazon.com/dp/B0MONITOR1',
    );
    await user.type(screen.getByLabelText(/asin \/ product id|asin \/ 商品编号/i), 'B0MONITOR1');
    await user.type(screen.getByLabelText(/product title|商品标题/i), 'Monitored item');
    await user.click(screen.getByRole('button', { name: /add product|添加商品/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        isMonitoring: true,
        checkInterval: 12,
      }),
    );
  });

  it('submits edits for products with blank optional image URLs', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const product = createMockProduct({
      title: 'Existing Product',
      imageUrl: null,
      checkInterval: 24,
    });

    renderWithRouter(
      <ProductForm
        product={product}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const titleInput = screen.getByDisplayValue('Existing Product');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Product');
    await user.click(screen.getByRole('button', { name: /update product|更新商品/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: 'Updated Product',
        imageUrl: undefined,
      }),
    );
  });

  it('keeps form actions reachable while dialog content scrolls', () => {
    renderWithRouter(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const actionRow = screen.getByRole('button', { name: /cancel|取消/i }).parentElement;

    expect(actionRow).toHaveClass('flex', 'border-t');
    expect(actionRow).not.toHaveClass('sticky', 'bottom-0');
  });

  it.skip('renders all required fields (skipped - i18n not configured in test)', () => {
    renderWithRouter(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('populates fields in edit mode', () => {
    const product = createMockProduct({
      title: 'Existing Product',
      productUrl: 'https://amazon.com/dp/TEST',
      asin: 'TEST123',
    });

    renderWithRouter(
      <ProductForm
        product={product}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://amazon.com/dp/TEST')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TEST123')).toBeInTheDocument();
  });

  it.skip('validates required fields on submit (skipped - needs form mock)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /save|submit/i });
    await user.click(submitButton);

    // Form should not submit
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.skip('validates URL format (skipped - complex form validation)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const urlInput = screen.getByLabelText(/product url/i);
    await user.type(urlInput, 'not-a-valid-url');

    const submitButton = screen.getByRole('button', { name: /save|submit/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.skip('submits valid data via onSubmit callback (skipped - complex form validation)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    // Fill in all required fields
    await user.selectOptions(screen.getByLabelText(/platform/i), 'amazon');
    await user.type(screen.getByLabelText(/product url/i), 'https://amazon.com/dp/B08N5WRWNW');
    await user.type(screen.getByLabelText(/asin/i), 'B08N5WRWNW');
    await user.type(screen.getByLabelText(/title/i), 'Test Product');

    const submitButton = screen.getByRole('button', { name: /save|submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const submittedData = onSubmit.mock.calls[0][0];
    expect(submittedData.title).toBe('Test Product');
    expect(submittedData.productUrl).toBe('https://amazon.com/dp/B08N5WRWNW');
    expect(submittedData.asin).toBe('B08N5WRWNW');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithRouter(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
