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
 * Design Philosophy:
 * - Refined spatial composition with subtle depth layering
 * - Fluid responsive transitions with precise timing (≤250ms)
 * - Elegant overlay system with backdrop blur effects
 * - Haptic-style interactions for mobile touch devices
 *
 * Breakpoints:
 * - Mobile (< 768px): Full-screen overlay sidebar
 * - Tablet (768px - 1023px): 320px overlay sidebar with shadow
 * - Desktop (≥ 1024px): Fixed 256px sidebar, always visible
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
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--canvas)' }}>
      {/* Sidebar — Adaptive Positioning */}
      {(isDesktop || sidebarOpen) && (
        <aside
          className={`
            ${isMobile ? 'fixed inset-0 z-50' : ''}
            ${isTablet ? 'fixed left-0 top-0 bottom-0 z-40 w-80' : ''}
            ${isDesktop ? 'relative w-64' : ''}
            ${isMobile || isTablet ? 'animate-slide-in-left' : ''}
          `}
          style={{
            background: 'var(--surface)',
            ...(isTablet && {
              boxShadow: '20px 0 40px rgba(16, 24, 40, 0.12), 0 0 0 1px rgba(139, 92, 246, 0.04)',
            }),
          }}
        >
          {/* Sidebar Content Container */}
          <div className="h-full flex flex-col">
            {/* Header Section with Close Button (Mobile/Tablet Only) */}
            {!isDesktop && (
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <h2
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: 'var(--fg)', letterSpacing: '-0.01em' }}
                >
                  对话历史
                </h2>

                {/* Elegant Close Button */}
                <button
                  onClick={onToggleSidebar}
                  className="group relative flex items-center justify-center w-10 h-10 rounded-[12px] transition-all duration-200 active:scale-95"
                  style={{ background: 'var(--subtle)' }}
                  aria-label="关闭侧边栏"
                >
                  {/* Subtle hover glow */}
                  <div
                    className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.04))',
                    }}
                  />

                  {/* Close Icon */}
                  <X
                    className="relative w-5 h-5 transition-colors duration-200"
                    style={{ color: 'var(--fg-muted)' }}
                  />
                </button>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Placeholder — Will be replaced with SessionSidebar content */}
              <div className="space-y-3">
                <h3
                  className="text-sm font-medium tracking-tight"
                  style={{ color: 'var(--fg)', letterSpacing: '-0.01em' }}
                >
                  最近对话
                </h3>
                <p className="text-sm" style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  暂无历史对话
                </p>
              </div>
            </div>

            {/* Desktop Border (Right Edge) */}
            {isDesktop && (
              <div
                className="absolute top-0 right-0 bottom-0 w-px"
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, var(--border-subtle) 10%, var(--border-subtle) 90%, transparent 100%)',
                }}
              />
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      {/* Overlay Backdrop (Mobile/Tablet Only) */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 animate-fade-in"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onToggleSidebar}
          aria-label="关闭侧边栏"
        />
      )}
    </div>
  );
}
