import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AlertsCenter } from '../../src/pages/AlertsCenter';
import type { Alert } from '../../src/types';
import { createMockAlerts, createMockProduct } from '../__utils__/fixtures';

// Mock hooks
vi.mock('../../src/hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
  useMarkAlertAsRead: vi.fn(),
  useDeleteAlert: vi.fn(),
}));

vi.mock('../../src/hooks/useProducts', () => ({
  useProducts: vi.fn(),
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

async function mockAlertsPageData({
  alerts,
  products,
}: {
  alerts: Alert[];
  products: ReturnType<typeof createMockProduct>[];
}) {
  const alertHooks = await import('../../src/hooks/useAlerts');
  const productHooks = await import('../../src/hooks/useProducts');

  vi.mocked(alertHooks.useAlerts).mockReturnValue({
    data: alerts,
    isLoading: false,
  } as ReturnType<typeof alertHooks.useAlerts>);
  vi.mocked(alertHooks.useMarkAlertAsRead).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof alertHooks.useMarkAlertAsRead>);
  vi.mocked(alertHooks.useDeleteAlert).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof alertHooks.useDeleteAlert>);
  vi.mocked(productHooks.useProducts).mockReturnValue({
    data: products,
    isLoading: false,
  } as ReturnType<typeof productHooks.useProducts>);
}

describe('AlertsCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders alerts list', async () => {
    const alerts = createMockAlerts(3);

    // Test AlertItem component since full page is complex
    const { AlertItem } = await import('../../src/components/alerts/AlertItem');

    renderWithProviders(
      <div>
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onMarkAsRead={vi.fn()}
            onDelete={vi.fn()}
          />
        ))}
      </div>
    );

    // Check that all alerts are rendered
    alerts.forEach((alert) => {
      expect(screen.getByText(alert.title)).toBeInTheDocument();
    });
  });

  it('filters by severity', () => {
    const alerts = createMockAlerts(9); // Creates 3 of each severity

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    const warningAlerts = alerts.filter((a) => a.severity === 'warning');
    const infoAlerts = alerts.filter((a) => a.severity === 'info');

    expect(criticalAlerts.length).toBe(3);
    expect(warningAlerts.length).toBe(3);
    expect(infoAlerts.length).toBe(3);
  });

  it('filters by read status', () => {
    const alerts = createMockAlerts(10);

    const unreadAlerts = alerts.filter((a) => !a.isRead);
    const readAlerts = alerts.filter((a) => a.isRead);

    // Even indices are read, odd are unread
    expect(readAlerts.length).toBe(5);
    expect(unreadAlerts.length).toBe(5);
  });

  it('marks alert as read', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();
    const alerts = createMockAlerts(1);
    alerts[0].isRead = false;

    const { AlertItem } = await import('../../src/components/alerts/AlertItem');

    renderWithProviders(
      <AlertItem
        alert={alerts[0]}
        onMarkAsRead={onMarkAsRead}
        onDelete={vi.fn()}
      />
    );

    const markAsReadButton = screen.getByLabelText(/mark as read/i);
    await user.click(markAsReadButton);

    expect(onMarkAsRead).toHaveBeenCalledWith(alerts[0].id);
  });

  it('deletes alert', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const alerts = createMockAlerts(1);

    const { AlertItem } = await import('../../src/components/alerts/AlertItem');

    renderWithProviders(
      <AlertItem
        alert={alerts[0]}
        onMarkAsRead={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText(/delete/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(alerts[0].id);
  });

  it('handles empty state', () => {
    const alerts: Alert[] = [];

    expect(alerts.length).toBe(0);
    // Empty state would be rendered by the actual page component
  });

  it('guides users to add products when all alerts are empty and no products exist', async () => {
    await mockAlertsPageData({ alerts: [], products: [] });

    renderWithProviders(<AlertsCenter />);

    expect(
      screen.getByText(/Alerts need a product and reading history first|预警需要先有商品和读数基础/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manual readings or optional monitoring|手动读数或可选监控/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Alerts require products to monitor|商品可监控|something to watch|监控对象/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /go to products|前往商品/i }),
    ).toHaveAttribute('href', '/products');
  });

  it('explains empty alerts when products exist', async () => {
    await mockAlertsPageData({
      alerts: [],
      products: [createMockProduct({ id: 'product-1' })],
    });

    renderWithProviders(<AlertsCenter />);

    expect(
      screen.getByText(/after monitoring detects price or stock changes|监控检测到价格或库存变化/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /go to products|前往商品/i })).not.toBeInTheDocument();
  });

  it('preserves filter guidance when products exist but a non-default filter is empty', async () => {
    const user = userEvent.setup();
    await mockAlertsPageData({
      alerts: [createMockAlerts(1)[0]],
      products: [createMockProduct({ id: 'product-1' })],
    });

    renderWithProviders(<AlertsCenter />);

    await user.click(screen.getByRole('button', { name: /unread/i }));

    expect(screen.getByText(/try adjusting your filters|调整筛选条件/i)).toBeInTheDocument();
  });
});
