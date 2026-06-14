import { Menu } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  title?: string;
}

/**
 * Mobile-only header with menu button and elegant title
 * Only visible on < md breakpoint (< 768px)
 *
 * Design Philosophy:
 * - Clean, refined minimalism with subtle depth
 * - Soft interactions with Agent Purple accent
 * - Smooth fade-in animation on mount
 * - Haptic-style active states for touch devices
 */
export function ChatHeader({ onOpenSidebar, title = '对话' }: ChatHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile) return null;

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-surface/95 backdrop-blur-xl border-b border-border-subtle animate-fade-in"
      style={{
        boxShadow: '0 1px 0 0 rgba(139, 92, 246, 0.03)',
      }}
    >
      {/* Menu Button with Refined Hover State */}
      <button
        onClick={onOpenSidebar}
        className="group relative flex items-center justify-center w-10 h-10 rounded-[12px] transition-all duration-200 active:scale-95"
        style={{
          background: 'var(--subtle)',
        }}
        aria-label="打开侧边栏"
      >
        {/* Subtle hover glow */}
        <div
          className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.04))',
          }}
        />

        {/* Icon with smooth color transition */}
        <Menu
          className="relative w-5 h-5 transition-colors duration-200"
          style={{
            color: 'var(--fg)',
          }}
        />
      </button>

      {/* Title with Elegant Typography */}
      <h1
        className="text-lg font-semibold tracking-tight"
        style={{
          color: 'var(--fg)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h1>

      {/* Decorative accent line (subtle Agent Purple) */}
      <div
        className="ml-auto w-1 h-6 rounded-full opacity-20"
        style={{
          background: 'linear-gradient(180deg, var(--color-primary-400), var(--color-primary-600))',
        }}
      />
    </header>
  );
}
