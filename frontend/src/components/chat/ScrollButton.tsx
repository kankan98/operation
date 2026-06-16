import { ArrowDown } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ScrollButtonProps {
  onClick: () => void;
  hasNewMessage: boolean;
  show: boolean;
}

/**
 * Floating scroll-to-bottom button with new message indicator
 *
 * Design Philosophy:
 * - Refined minimalism with intentional micro-interactions
 * - Soft shadows and gentle backdrop blur for depth
 * - Responsive sizing: 48px (mobile touch target), 40px (desktop precision)
 * - Magnetic hover effect with scale transform
 * - Pulsing notification dot with gradient glow
 *
 * Animations:
 * - Entry: slideUp 250ms with ease-out-soft
 * - Hover: scale + shadow elevation
 * - Active: satisfying scale-down feedback
 * - New message indicator: gentle pulse with purple glow
 *
 * Positioning:
 * - Absolute positioning within chat container (parent must be relative)
 * - Horizontally centered within chat area (left-1/2 -translate-x-1/2)
 * - Above chat input (z-10)
 * - Accounts for mobile keyboard scenarios
 * - Centered within chat container, adapts when sidebar opens/closes
 */
export function ScrollButton({ onClick, hasNewMessage, show }: ScrollButtonProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="group absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center rounded-full
                 bg-surface border border-border-subtle
                 shadow-[0_4px_12px_rgba(16,24,40,0.15)]
                 backdrop-blur-sm
                 hover:shadow-[0_8px_24px_rgba(16,24,40,0.2)]
                 hover:scale-105
                 active:scale-95
                 transition-all duration-200
                 animate-slide-up"
      style={{
        width: isMobile ? 'var(--scroll-button-size-mobile)' : 'var(--scroll-button-size)',
        height: isMobile ? 'var(--scroll-button-size-mobile)' : 'var(--scroll-button-size)',
      }}
      aria-label={hasNewMessage ? '滚动到底部 (有新消息)' : '滚动到底部'}
    >
      {/* Arrow icon with smooth rotation on hover */}
      <ArrowDown
        className="w-5 h-5 text-fg transition-transform duration-200 group-hover:translate-y-0.5"
      />

      {/* New message notification dot */}
      {hasNewMessage && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3
                     bg-gradient-to-br from-primary-500 to-primary-600
                     rounded-full
                     animate-pulse
                     shadow-[0_0_8px_rgba(139,92,246,0.5)]"
          aria-hidden="true"
        >
          {/* Inner glow effect */}
          <div
            className="absolute inset-0 rounded-full
                       bg-gradient-to-br from-white/40 to-transparent"
          />
        </div>
      )}

      {/* Subtle ring glow on hover (only when there's a new message) */}
      {hasNewMessage && (
        <div
          className="absolute inset-0 rounded-full
                     opacity-0 group-hover:opacity-100
                     transition-opacity duration-300
                     ring-2 ring-primary-500/20 ring-offset-2 ring-offset-surface"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
