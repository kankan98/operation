import { expect, test, type Page, type Route } from '@playwright/test';

declare global {
  interface Window {
    __lastScrolledId: string | null;
  }
}

type MockSession = {
  id: string;
  title: string;
  userId: string | null;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  tags?: string[];
  lastMessagePreview?: string;
  unreadCount?: number;
};

type MockTask = {
  id: string;
  sessionId: string;
  taskName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  relatedProducts?: string[];
  platform?: string;
  metadata?: Record<string, unknown>;
};

const now = Date.now();
const today = now - 10 * 60 * 1000;
const yesterday = now - 24 * 60 * 60 * 1000;

const baseSessions: MockSession[] = [
  {
    id: 's-amazon',
    title: 'Amazon 价格分析',
    userId: null,
    messageCount: 2,
    createdAt: today - 120_000,
    updatedAt: today,
    isPinned: false,
    tags: ['amazon'],
    lastMessagePreview: '分析耳机竞品价格',
    unreadCount: 0,
  },
  {
    id: 's-shopify',
    title: 'Shopify 库存同步',
    userId: null,
    messageCount: 1,
    createdAt: yesterday,
    updatedAt: yesterday,
    isPinned: false,
    tags: ['shopify'],
    lastMessagePreview: '同步库存任务',
    unreadCount: 0,
  },
];

const baseTasks: Record<string, MockTask[]> = {
  's-amazon': [
    {
      id: 'task-amazon',
      sessionId: 's-amazon',
      taskName: '分析 Amazon 价格',
      status: 'in_progress',
      startTime: new Date(today).toISOString(),
      relatedProducts: ['B0TEST001'],
      platform: 'amazon',
      metadata: { progress: 65, currentStep: '抓取竞品价格', messageId: 'assistant-amazon' },
    },
  ],
  's-shopify': [
    {
      id: 'task-shopify',
      sessionId: 's-shopify',
      taskName: '同步 Shopify 库存',
      status: 'completed',
      startTime: new Date(yesterday).toISOString(),
      endTime: new Date(yesterday + 30_000).toISOString(),
      relatedProducts: ['SKU-001', 'SKU-002'],
      platform: 'shopify',
      metadata: { messageId: 'assistant-shopify' },
    },
  ],
};

const messagesBySession = {
  's-amazon': [
    {
      id: 'user-amazon',
      sessionId: 's-amazon',
      role: 'user',
      content: '分析耳机竞品价格',
      tokensUsed: null,
      timestamp: today - 60_000,
    },
    {
      id: 'assistant-amazon',
      sessionId: 's-amazon',
      role: 'assistant',
      content: '正在分析 Amazon 价格。',
      toolCalls: [
        {
          id: 'tool-amazon',
          name: 'searchProducts',
          input: { query: 'wireless earbuds' },
          result: [{ asin: 'B0TEST001', price: 39.99 }],
          isError: false,
          durationMs: 640,
        },
      ],
      tokensUsed: 42,
      timestamp: today,
    },
  ],
  's-shopify': [
    {
      id: 'assistant-shopify',
      sessionId: 's-shopify',
      role: 'assistant',
      content: 'Shopify 库存已同步。',
      toolCalls: [],
      tokensUsed: 18,
      timestamp: yesterday,
    },
  ],
};

async function installBrowserMocks(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();

    window.__lastScrolledId = null;
    Element.prototype.scrollIntoView = function scrollIntoViewMock() {
      window.__lastScrolledId = (this as Element).id;
    };

    class MockEventSource {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSED = 2;

      url: string;
      readyState = MockEventSource.CONNECTING;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      private listeners: Record<string, Array<(event: Event) => void>> = {};

      constructor(url: string) {
        this.url = url;

        window.setTimeout(() => {
          this.readyState = MockEventSource.OPEN;
          this.dispatch('open', new Event('open'));

          const events = [
            { type: 'status_change', status: 'tool_calling', context: '搜索产品' },
            {
              type: 'tool_start',
              timestamp: Date.now(),
              tool: {
                id: 'tool-stream',
                name: 'searchProducts',
                params: { query: '无线耳机' },
              },
            },
            {
              type: 'tool_execution_detail',
              toolId: 'tool-stream',
              detail: { toolName: 'searchProducts', status: 'running', inputSummary: 'query: 无线耳机' },
            },
            {
              type: 'task_created',
              task: {
                id: 'task-stream',
                sessionId: 's-new',
                taskName: '搜索无线耳机',
                status: 'in_progress',
                startTime: new Date().toISOString(),
                relatedProducts: ['B0STREAM01'],
                platform: 'amazon',
                metadata: { progress: 40, currentStep: '搜索候选产品', messageId: 'assistant-new' },
              },
            },
            { type: 'task_progress', taskId: 'task-stream', progress: 80, currentStep: '整理结果' },
            {
              type: 'tool_complete',
              toolId: 'tool-stream',
              result: { output: [{ asin: 'B0STREAM01', title: '无线耳机' }], isError: false },
              timing: { endTime: Date.now(), durationMs: 520 },
            },
            {
              type: 'tool_execution_detail',
              toolId: 'tool-stream',
              detail: {
                toolName: 'searchProducts',
                status: 'success',
                durationMs: 520,
                outputSummary: '找到 1 个候选产品',
              },
            },
            { type: 'status_change', status: 'writing', context: '生成回复' },
            { type: 'content_delta', delta: '已找到 1 个候选产品。' },
            { type: 'message_complete' },
          ];

          events.forEach((event, index) => {
            window.setTimeout(() => {
              this.dispatch('message', new MessageEvent('message', { data: JSON.stringify(event) }));
            }, 20 + index * 20);
          });
        }, 0);
      }

      addEventListener(type: string, listener: (event: Event) => void) {
        this.listeners[type] = [...(this.listeners[type] || []), listener];
      }

      removeEventListener(type: string, listener: (event: Event) => void) {
        this.listeners[type] = (this.listeners[type] || []).filter((item) => item !== listener);
      }

      close() {
        this.readyState = MockEventSource.CLOSED;
      }

      private dispatch(type: string, event: Event) {
        (this.listeners[type] || []).forEach((listener) => listener(event));
        if (type === 'open') this.onopen?.(event);
        if (type === 'message') this.onmessage?.(event as MessageEvent);
        if (type === 'error') this.onerror?.(event);
      }
    }

    window.EventSource = MockEventSource as unknown as typeof EventSource;
  });
}

async function setupApi(page: Page) {
  let sessions = structuredClone(baseSessions);
  let tasksBySession = structuredClone(baseTasks);

  await page.route((url) => url.pathname.endsWith('/api/chat/sessions'), async (route: Route) => {
    if (route.request().method() === 'POST') {
      const created: MockSession = {
        id: 's-new',
        title: '搜索无线耳机',
        userId: null,
        messageCount: 1,
        createdAt: now,
        updatedAt: now,
        isPinned: false,
        tags: ['amazon'],
        lastMessagePreview: '已找到 1 个候选产品。',
        unreadCount: 0,
      };
      sessions = [created, ...sessions.filter((session) => session.id !== created.id)];
      await route.fulfill({ json: created });
      return;
    }

    await route.fulfill({ json: { sessions, page: 1, limit: 20 } });
  });

  await page.route((url) => /\/api\/chat\/sessions\/[^/]+\/messages$/.test(url.pathname), async (route: Route) => {
    const match = route.request().url().match(/\/chat\/sessions\/([^/]+)\/messages/);
    const sessionId = match?.[1] || '';
    await route.fulfill({ json: { messages: messagesBySession[sessionId as keyof typeof messagesBySession] || [] } });
  });

  await page.route((url) => /\/api\/chat\/sessions\/[^/]+$/.test(url.pathname), async (route: Route) => {
    const sessionId = route.request().url().match(/\/chat\/sessions\/([^/?]+)/)?.[1] || '';

    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as Partial<MockSession>;
      sessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, ...body, updatedAt: now + 1000 } : session
      );
      await route.fulfill({ json: sessions.find((session) => session.id === sessionId) });
      return;
    }

    await route.fulfill({ json: sessions.find((session) => session.id === sessionId) });
  });

  await page.route('**/api/tasks/*', async (route: Route) => {
    const sessionId = route.request().url().match(/\/tasks\/([^/?]+)/)?.[1] || '';
    await route.fulfill({
      json: {
        tasks: tasksBySession[sessionId] || [],
        total: tasksBySession[sessionId]?.length || 0,
        limit: 20,
        offset: 0,
      },
    });
  });

  await page.route('**/api/chat/stream', async (route: Route) => {
    const created: MockSession = {
      id: 's-new',
      title: '搜索无线耳机',
      userId: null,
      messageCount: 1,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      tags: ['amazon'],
      lastMessagePreview: '已找到 1 个候选产品。',
      unreadCount: 0,
    };
    sessions = [created, ...sessions.filter((session) => session.id !== created.id)];
    tasksBySession = { ...tasksBySession, 's-new': [] };

    await route.fulfill({
      json: {
        streamId: 'stream-new',
        messageId: 'assistant-new',
        sessionId: 's-new',
      },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await installBrowserMocks(page);
  await setupApi(page);
});

test('creates a conversation, streams a response, and shows the tool execution card', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat');

  await page.getByPlaceholder('输入消息...（Enter 发送，Shift+Enter 换行）').fill('帮我搜索无线耳机');
  await page.getByRole('button', { name: '发送消息' }).click();

  await expect(page).toHaveURL(/\/chat\/s-new$/);
  await expect(page.getByText('searchProducts').first()).toBeVisible();
  await expect(page.getByText('已完成').first()).toBeVisible();
  await expect(page.locator('#message-assistant-new').getByText('已找到 1 个候选产品。')).toBeVisible();
});

test('pins a session and moves it into the pinned group', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat/s-amazon');

  await page.getByTestId('session-card-s-amazon').hover();
  await page.getByRole('button', { name: 'Amazon 价格分析 操作菜单' }).click();
  await page.getByRole('button', { name: '置顶' }).click();

  await expect(page.getByText('置顶')).toBeVisible();
  await expect(page.getByTestId('session-card-s-amazon')).toBeVisible();
});

test('filters sessions from the session search box', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat/s-amazon');

  await page.getByPlaceholder('搜索对话...').fill('Shopify');

  await expect(page.getByTestId('session-card-s-shopify')).toBeVisible();
  await expect(page.getByTestId('session-card-s-amazon')).toBeHidden();
});

test('scrolls from task and compact tool cards to their message targets', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat/s-amazon');

  await page.getByRole('button', { name: '查看详情' }).click();
  await expect.poll(() => page.evaluate(() => window.__lastScrolledId)).toBe('message-assistant-amazon');

  await page.getByRole('button', { name: /工具执行/ }).click();
  await page.getByRole('button', { name: '查看结果' }).click();
  await expect.poll(() => page.evaluate(() => window.__lastScrolledId)).toBe('tool-tool-amazon');
});

test('updates task panel data when switching sessions', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat/s-amazon');

  await expect(page.getByRole('heading', { name: '分析 Amazon 价格' })).toBeVisible();
  await page.getByTestId('session-card-s-shopify').click();

  await expect(page).toHaveURL(/\/chat\/s-shopify$/);
  await expect(page.getByRole('heading', { name: '同步 Shopify 库存' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '分析 Amazon 价格' })).toBeHidden();
});

test('adapts between desktop panels and mobile drawers', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/chat/s-amazon');

  await expect(page.getByRole('heading', { name: '任务管理' })).toBeVisible();
  await expect(page.getByRole('button', { name: '任务', exact: true })).toBeHidden();

  await page.setViewportSize({ width: 900, height: 760 });
  await expect(page.getByRole('button', { name: '会话', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '任务', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '会话', exact: true }).click();
  await expect(page.getByPlaceholder('搜索对话...').last()).toBeVisible();
  await page.getByLabel('关闭会话抽屉遮罩').click();

  await page.getByRole('button', { name: '任务', exact: true }).click();
  await expect(page.getByRole('heading', { name: '任务管理' })).toBeVisible();
});
