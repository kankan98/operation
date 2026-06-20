import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  Target,
  Bell,
  MessageSquareText,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const navItems = [
  { path: '/', key: 'dashboard', icon: LayoutDashboard, end: true },
  { path: '/products', key: 'products', icon: Package, end: false },
  { path: '/opportunities', key: 'opportunities', icon: Target, end: false },
  { path: '/alerts', key: 'alerts', icon: Bell, end: false },
  { path: '/chat', key: 'chat', icon: MessageSquareText, end: false },
  { path: '/settings', key: 'settings', icon: SettingsIcon, end: false },
] as const;

function usePageTitle() {
  const { t } = useTranslation('navigation');
  const { pathname } = useLocation();
  if (pathname.startsWith('/products')) return t('products');
  if (pathname.startsWith('/opportunities')) return t('opportunities');
  if (pathname.startsWith('/alerts')) return t('alerts');
  if (pathname.startsWith('/chat')) return t('chat');
  if (pathname.startsWith('/settings')) return t('settings');
  return t('dashboard');
}

export function AppLayout() {
  const { t } = useTranslation(['navigation', 'common']);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const title = usePageTitle();
  const location = useLocation();

  // 聊天页（v2）全屏布局：隐藏 AppLayout 顶栏（页面有自己的标题栏），内容区用 h-full
  const isChatPage = location.pathname.startsWith('/chat');

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-fg">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-shrink-0 flex-col border-r border-border-subtle bg-surface transition-[width] duration-200 ease-out',
          // 全站统一一套侧边栏宽度（含 Chat）；Chat 内部改由容器查询自适应
          collapsed ? 'w-[72px]' : 'w-60',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-16 items-center gap-3 px-4', collapsed && 'justify-center px-0')}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary-500 to-primary-700 shadow-e1">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{t('common:appName')}</p>
              <p className="truncate text-xs text-fg-subtle">{t('common:appTagline')}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                title={collapsed ? t(`navigation:${item.key}`) : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-medium transition-colors duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-fg-muted hover:bg-subtle hover:text-fg',
                  )
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{t(`navigation:${item.key}`)}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border-subtle p-3">
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? t('navigation:expand') : t('navigation:collapse')}
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-subtle hover:text-fg',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>{t('navigation:collapse')}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header - 聊天页不显示（有自己的标题栏） */}
        {!isChatPage && (
          <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-border-subtle bg-surface/80 px-6 backdrop-blur">
            <h1 className="text-lg font-semibold tracking-tight text-fg">{title}</h1>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                aria-label={t('navigation:toggleTheme')}
                className="flex h-9 w-9 items-center justify-center rounded-button text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                A
              </div>
            </div>
          </header>
        )}

        {/* Content - @container 作为子页面（Chat）容器查询的上下文 */}
        <main className="@container flex-1 overflow-hidden">
          {isChatPage ? (
            // 聊天页需要 h-full 容器来正确计算高度
            <div className="h-full">
              <Outlet />
            </div>
          ) : (
            <div className="h-full overflow-auto p-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
