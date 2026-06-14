import React from 'react';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ChatContainerProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * ChatContainer — Responsive layout shell with adaptive sidebar behavior
 *
 * Design Philosophy (style.md):
 * - Refined spatial composition with subtle depth layering
 * - Fluid responsive transitions with precise timing (≤250ms)
 * - Elegant overlay system with backdrop blur effects
 * - 8pt spacing system (16/24/32px)
 * - Soft geometry (20px card radius, 12px button radius)
 *
 * Breakpoints:
 * - Mobile (< 768px): Full-screen overlay sidebar
 * - Tablet (768px - 1023px): 320px overlay sidebar with shadow
 * - Desktop (≥ 1024px): Fixed 240px sidebar, always visible
 */
export function ChatContainer({
  children,
  sidebarOpen,
  onToggleSidebar,
}: ChatContainerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="h-screen flex overflow-hidden bg-canvas">
      {/* Sidebar — Adaptive Positioning */}
      {(isDesktop || sidebarOpen) && (
        <aside
          className={`
            ${isMobile ? 'fixed inset-0 z-50' : ''}
            ${isTablet ? 'fixed left-0 top-0 bottom-0 z-40 w-80' : ''}
            ${isDesktop ? 'relative w-60' : ''}
            ${isMobile || isTablet ? 'animate-slide-in-left' : ''}
            bg-surface border-r border-border-subtle
          `}
          style={{
            ...(isTablet && {
              boxShadow: 'var(--shadow-e3)',
            }),
          }}
        >
          {/* Sidebar Content Container */}
          <div className="h-full flex flex-col">
            {/* Header Section with Close Button (Mobile/Tablet Only) */}
            {!isDesktop && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                <h2 className="text-[20px] font-semibold tracking-tight text-fg-default">
                  对话历史
                </h2>

                {/* Elegant Close Button */}
                <button
                  onClick={onToggleSidebar}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-[12px]
                           bg-subtle hover:bg-surface-overlay transition-all duration-200 active:scale-95"
                  aria-label="关闭侧边栏"
                >
                  {/* Close Icon */}
                  <X className="w-5 h-5 text-fg-muted group-hover:text-fg-default transition-colors duration-200" />
                </button>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Placeholder — Will be replaced with SessionSidebar content */}
              <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-fg-default">
                  最近对话
                </h3>
                <p className="text-[13px] text-fg-muted leading-relaxed">
                  暂无历史对话
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area - Fixed height to prevent scrollbar issues */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>

      {/* Overlay Backdrop (Mobile/Tablet Only) */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onToggleSidebar}
          aria-label="关闭侧边栏"
        />
      )}
    </div>
  );
}
