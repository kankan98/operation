import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  showSuggestions: boolean;
  suggestions: string[];
  error: string | null;
  onRetry?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  showSuggestions,
  suggestions,
  error,
  onRetry,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (min 44px, max 128px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 128);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value.trim());
      }
    }
  };

  // Handle send button click
  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (!disabled) {
      onSend(suggestion);
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="relative flex flex-col gap-3 p-4 bg-canvas border-t border-border-subtle">
      {/* Suggestion Chips */}
      {showSuggestions && value.length === 0 && suggestions.length > 0 && (
        <div
          className="flex flex-wrap gap-2 animate-[fadeIn_200ms_var(--ease-out-soft)]"
          style={{
            animationFillMode: 'both',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              className="group relative px-4 py-2 rounded-full bg-surface-raised border border-border-subtle
                       text-text-body-size text-fg-default
                       hover:border-fg-accent hover:bg-surface-overlay
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
              style={{
                animationDelay: `${index * 40}ms`,
                animation: 'fadeInUp 200ms var(--ease-out-soft) both',
              }}
            >
              <span className="relative z-10">{suggestion}</span>
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-fg-accent/0 via-fg-accent/5 to-fg-accent/0
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-fg-danger/5 border border-fg-danger/20
                   animate-[fadeIn_200ms_var(--ease-out-soft)]"
        >
          <div className="flex-1 text-text-caption-size text-fg-danger">
            {error}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md
                       bg-fg-danger/10 hover:bg-fg-danger/20
                       text-text-caption-size text-fg-danger font-medium
                       transition-colors duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重试
            </button>
          )}
        </div>
      )}

      {/* Input Container */}
      <div
        className={`
          relative flex items-end gap-2 p-3 rounded-xl
          bg-surface-raised border-2 transition-all duration-200
          ${error ? 'border-fg-danger/40' : isFocused ? 'border-fg-accent/40 shadow-[0_0_0_3px_var(--color-fg-accent)]/10' : 'border-border-subtle'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          rows={1}
          className="flex-1 resize-none bg-transparent text-text-body-size text-fg-default
                   placeholder:text-fg-muted
                   focus:outline-none
                   disabled:cursor-not-allowed
                   leading-relaxed"
          style={{
            minHeight: '44px',
            maxHeight: '128px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-border-subtle) transparent',
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className={`
            relative flex items-center justify-center
            w-10 h-10 rounded-lg flex-shrink-0
            transition-all duration-200
            ${canSend
              ? 'bg-fg-accent text-white hover:bg-fg-accent/90 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
              : 'bg-surface-overlay text-fg-muted cursor-not-allowed'
            }
          `}
          aria-label="发送消息"
        >
          <Send
            className={`
              w-5 h-5 transition-transform duration-200
              ${canSend ? 'translate-x-0' : ''}
            `}
          />

          {/* Send button glow effect on hover */}
          {canSend && (
            <div
              className="absolute inset-0 rounded-lg bg-fg-accent/20 blur-md opacity-0
                       group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            />
          )}
        </button>
      </div>

      {/* Character count hint (optional, shows when approaching limit) */}
      {value.length > 800 && (
        <div
          className="text-text-caption-size text-fg-muted text-right
                   animate-[fadeIn_200ms_var(--ease-out-soft)]"
        >
          {value.length} 字符
        </div>
      )}
    </div>
  );
}

// Keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
