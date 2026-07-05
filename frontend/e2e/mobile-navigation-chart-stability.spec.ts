import { expect, test, type Page, type Route } from '@playwright/test';

async function fulfillJson(route: Route, json: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(json),
  });
}

async function installStableEmptyStateApi(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('lang', 'en');
  });

  await page.route('**/api/products', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, {});
  });

  await page.route('**/api/alerts', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, {});
  });

  await page.route('**/api/opportunities/products**', async (route) => {
    await fulfillJson(route, {
      data: [],
      total: 0,
      pagination: { page: 1, limit: 30, totalPages: 0 },
    });
  });

  await page.route('**/api/opportunities/research/summary', async (route) => {
    await fulfillJson(route, {
      data: {
        totalActive: 0,
        decided: 0,
        undecided: 0,
        needsNextAction: 0,
        stale: 0,
        byStatus: { researching: 0, watching: 0, ready: 0, rejected: 0 },
        byPriority: { low: 0, medium: 0, high: 0 },
        generatedAt: Date.now(),
        caveat: 'Playwright empty-state summary.',
      },
    });
  });

  await page.route('**/api/opportunities/research/practice-summary', async (route) => {
    await fulfillJson(route, {
      data: {
        totalActive: 0,
        withOutcome: 0,
        withoutOutcome: 0,
        byActionId: {
          add_next_action: 0,
          review_stale_decisions: 0,
          decide_candidates: 0,
          continue_research: 0,
        },
        latestCompletedAt: null,
        generatedAt: Date.now(),
        caveat: 'Playwright empty-state practice summary.',
      },
    });
  });

  await page.route('**/api/opportunities/research/action-plan', async (route) => {
    await fulfillJson(route, {
      data: {
        items: [],
        generatedAt: Date.now(),
        caveat: 'Playwright empty-state action plan.',
      },
    });
  });

  await page.route('**/api/chat/sessions', async (route) => {
    await fulfillJson(route, { sessions: [], page: 1, limit: 20 });
  });

  await page.route('**/api/tasks/*', async (route) => {
    await fulfillJson(route, { tasks: [], total: 0, limit: 20, offset: 0 });
  });
}

test.beforeEach(async ({ page }) => {
  await installStableEmptyStateApi(page);
});

test('mobile non-Chat navigation opens, dismisses, and navigates between modules', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products');

  const trigger = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(trigger).toBeVisible();

  await trigger.click();
  const drawer = page.getByRole('dialog', { name: 'Main navigation' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Products' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(drawer).toBeVisible();
  await page.getByLabel('Close navigation menu backdrop').click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await drawer.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(drawer).toBeHidden();

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('dialog', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog', { name: 'Main navigation' })).toBeHidden();
});

test('Chat pages keep their specialized mobile controls instead of the global mobile drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/chat');

  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '会话' })).toBeVisible();
  await expect(page.getByRole('button', { name: '任务' })).toBeVisible();
});

test('Dashboard empty monitoring overview avoids Recharts sizing warnings', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleMessages.push(message.text());
    }
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  await expect(page.getByRole('main').getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Monitoring Overview')).toBeVisible();
  await expect(page.locator('.recharts-responsive-container')).toHaveCount(0);

  expect(consoleMessages.filter((text) => text.includes('width(-1)') || text.includes('height(-1)'))).toEqual([]);
});
