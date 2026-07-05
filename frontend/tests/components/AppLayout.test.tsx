import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { AppLayout } from '@/components/layout/AppLayout';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderLayout(initialPath = '/products') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <>
                <LocationProbe />
                <div>Dashboard route</div>
              </>
            }
          />
          <Route
            path="/products"
            element={
              <>
                <LocationProbe />
                <div>Products route</div>
              </>
            }
          />
          <Route
            path="/opportunities"
            element={
              <>
                <LocationProbe />
                <div>Opportunities route</div>
              </>
            }
          />
          <Route
            path="/alerts"
            element={
              <>
                <LocationProbe />
                <div>Alerts route</div>
              </>
            }
          />
          <Route
            path="/chat"
            element={
              <>
                <LocationProbe />
                <div>Chat route</div>
              </>
            }
          />
          <Route
            path="/chat/:sessionId"
            element={
              <>
                <LocationProbe />
                <div>Chat session route</div>
              </>
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <LocationProbe />
                <div>Settings route</div>
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout mobile navigation', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('opens and closes the non-Chat mobile navigation drawer', async () => {
    const user = userEvent.setup();
    renderLayout('/products');

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);

    const drawer = screen.getByRole('dialog', { name: 'Main navigation' });
    expect(within(drawer).getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(drawer).getByRole('button', { name: 'Close navigation menu' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Main navigation' })).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('supports Escape and backdrop dismissal for the mobile navigation drawer', async () => {
    const user = userEvent.setup();
    renderLayout('/alerts');

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Main navigation' })).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Main navigation' })).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close navigation menu backdrop'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Main navigation' })).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('closes the drawer after route navigation', async () => {
    const user = userEvent.setup();
    renderLayout('/products');

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Main navigation' });

    await user.click(within(drawer).getByRole('link', { name: 'Settings' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/settings');
      expect(screen.queryByRole('dialog', { name: 'Main navigation' })).not.toBeInTheDocument();
    });
  });

  it('does not show the non-Chat mobile navigation trigger on Chat pages', () => {
    renderLayout('/chat/session-1');

    expect(screen.getByText('Chat session route')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
  });
});
