import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ScrollButton } from './ScrollButton';

interface ControlBarProps {
  isStreaming: boolean;
  canRegenerate: boolean;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  onAbort: () => void;
  onRegenerate: () => void;
  onScrollToBottom: () => void;
}

/**
 * ControlBar - Surgical precision control layer for chat interactions
 *
 * Design Philosophy: Refined minimalism with context-aware floating controls
 * - Glass morphism with subtle backdrop blur
 * - Controls appear/disappear based on chat state
 * - Smooth physics-based transitions (≤250ms)
 * - Semantic colors: red for abort, neutral for navigation
 * - Tactile micro-interactions with scale + shadow feedback
 *
 * Components:
 * 1. Abort button - Appears inline during streaming (top-right of input area)
 * 2. Scroll button - Floating bottom-right with new message indicator
 * 3. Regenerate button - Appears on message hover (implemented in parent)
 *
 * Animation Strategy:
 * - Entry: fade + slideDown for abort button
 * - Exit: fade + slideUp with stagger
 * - Hover: scale + shadow elevation
 * - Active: satisfying scale-down feedback
 */
export function ControlBar({
  isStreaming,
  canRegenerate,
  showScrollButton,
  hasNewMessage,
  onAbort,
  onRegenerate,
  onScrollToBottom,
}: ControlBarProps) {
  return (
    <>
      {/* Abort Button - Floating control during streaming */}
      {isStreaming && (
        <div
          className="absolute top-3 right-3 z-20 animate-fade-in-down"
          style={{
            animation: 'fadeInDown 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <button
            onClick={onAbort}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-surface/90 border border-border-subtle
                       backdrop-blur-sm
                       shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                       hover:bg-surface-raised
                       hover:border-border-danger/30
                       hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)]
                       active:scale-95
                       transition-all duration-200"
            aria-label="停止生成"
          >
            {/* Icon with rotation animation */}
            <X
              className="w-4 h-4 text-fg-danger
                         transition-transform duration-200
                         group-hover:rotate-90"
            />

            {/* Text label - hidden on mobile */}
            <span className="hidden sm:inline text-sm font-medium text-fg-danger">
              停止
            </span>

            {/* Subtle pulsing border during streaming */}
            <div
              className="absolute inset-0 rounded-xl
                         ring-1 ring-border-danger/20
                         animate-pulse"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {/* Scroll to Bottom Button - Delegated to ScrollButton component */}
      <ScrollButton
        onClick={onScrollToBottom}
        hasNewMessage={hasNewMessage}
        show={showScrollButton}
      />

      {/* Regenerate Button - Inline control (rendered by parent on message hover) */}
      {/* This is typically rendered in the message context, not here */}
      {/* Keeping the structure here for reference and future expansion */}
    </>
  );
}

/**
 * RegenerateButton - Separate export for use in message hover context
 *
 * Usage: Import and render this in MessageBubble or MessageList
 * when hovering over the last assistant message
 */
export function RegenerateButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg
                 bg-surface/90 border border-border-subtle
                 backdrop-blur-sm
                 shadow-[0_2px_6px_rgba(0,0,0,0.06)]
                 hover:bg-surface-raised
                 hover:border-border-accent/30
                 hover:shadow-[0_4px_10px_rgba(139,92,246,0.12)]
                 active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200
                 animate-fade-in"
      aria-label="重新生成"
    >
      {/* Icon with counter-clockwise rotation on hover */}
      <RotateCcw
        className="w-4 h-4 text-fg-muted
                   group-hover:text-fg-accent
                   transition-all duration-200
                   group-hover:-rotate-180"
      />

      {/* Text label */}
      <span className="text-sm font-medium text-fg-muted group-hover:text-fg-accent transition-colors duration-200">
        重新生成
      </span>
    </button>
  );
}
