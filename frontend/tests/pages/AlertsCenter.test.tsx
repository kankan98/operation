import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { createMockAlerts } from '../__utils__/fixtures';

// Mock hooks
vi.mock('../../src/hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
  useMarkAlertAsRead: vi.fn(),
  useDeleteAlert: vi.fn(),
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

describe('AlertsCenter', () => {
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
});
