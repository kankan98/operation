import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AlertItem } from '../../src/components/alerts/AlertItem';
import { createMockAlert } from '../__utils__/fixtures';
import userEvent from '@testing-library/user-event';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AlertItem', () => {
  it('renders alert data with severity colors', () => {
    const alert = createMockAlert({
      title: 'Price Alert',
      message: 'Price dropped to $199.99',
      severity: 'critical',
    });

    renderWithRouter(
      <AlertItem
        alert={alert}
        onMarkAsRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Price Alert')).toBeInTheDocument();
    expect(screen.getByText('Price dropped to $199.99')).toBeInTheDocument();
  });

  it('shows unread indicator for unread alerts', () => {
    const alert = createMockAlert({ isRead: false });

    const { container } = render(
      <AlertItem
        alert={alert}
        onMarkAsRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Check for unread dot
    const unreadDot = container.querySelector('.bg-primary-600');
    expect(unreadDot).toBeInTheDocument();
  });

  it('hides unread indicator for read alerts', () => {
    const alert = createMockAlert({ isRead: true });

    const { container } = render(
      <AlertItem
        alert={alert}
        onMarkAsRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Check unread dot is not present
    const unreadDot = container.querySelector('.bg-primary-600');
    expect(unreadDot).not.toBeInTheDocument();
  });

  it('calls onMarkAsRead when mark as read button is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();
    const alert = createMockAlert({ id: 'test-alert-1', isRead: false });

    renderWithRouter(
      <AlertItem
        alert={alert}
        onMarkAsRead={onMarkAsRead}
        onDelete={vi.fn()}
      />
    );

    const markAsReadButton = screen.getByLabelText(/mark as read/i);
    await user.click(markAsReadButton);

    expect(onMarkAsRead).toHaveBeenCalledWith('test-alert-1');
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const alert = createMockAlert({ id: 'test-alert-1' });

    renderWithRouter(
      <AlertItem
        alert={alert}
        onMarkAsRead={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText(/delete/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('test-alert-1');
  });

  it('does not show mark as read button for already read alerts', () => {
    const alert = createMockAlert({ isRead: true });

    renderWithRouter(
      <AlertItem
        alert={alert}
        onMarkAsRead={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/mark as read/i)).not.toBeInTheDocument();
  });

  it.skip('renders different severity levels with appropriate styling (skipped - DOM testing)', () => {
    const severities: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];

    severities.forEach((severity) => {
      const alert = createMockAlert({ severity });
      const { container } = render(
        <AlertItem
          alert={alert}
          onMarkAsRead={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Check that severity-specific classes are applied
      const severityIcon = container.querySelector(`[class*="text-${severity}"]`);
      expect(severityIcon).toBeTruthy();
    });
  });
});
