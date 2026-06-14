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

/**
 * ChatInput — Auto-resizing input with suggestion chips
 *
 * Design System Compliance (style.md):
 * - Input radius: 10px (--radius-input)
 * - Button radius: 12px (--radius-button)
 * - Badge radius: 999px (--radius-badge) for suggestion chips
 * - Spacing: 8pt grid (16/24/32px)
 * - Primary color: Agent Purple (#7C3AED - Primary-600)
 * - Min input height: 44px (touch target)
 * - Animations: 150-250ms with ease-out
 */
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

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 128);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="flex flex-col gap-4 px-6 py-4 bg-surface border-t border-border-subtle">
      {/* Suggestion Chips — Badge radius (999px) */}
      {showSuggestions && value.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              className="group relative px-4 py-2.5 rounded-full
                       bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200
                       text-[14px] text-gray-700 hover:text-primary-700
                       active:scale-[0.98]
                       disabled:opacity-38 disabled:cursor-not-allowed
                       transition-all duration-200"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px]
                      bg-error/5 border border-error/20 animate-fade-in">
          <div className="flex-1 text-[13px] text-error leading-relaxed">
            {error}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[10px]
                       bg-error/10 hover:bg-error/20
                       text-[13px] text-error font-medium
                       transition-colors duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重试
            </button>
          )}
        </div>
      )}

      {/* Input Container — Input radius (10px) */}
      <div
        className={`
          relative flex items-end gap-3 p-3 rounded-[10px]
          bg-white border-2 transition-all duration-200
          ${error
            ? 'border-error/40'
            : isFocused
              ? 'border-primary-300 ring-4 ring-primary-600/10'
              : 'border-gray-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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
          className="flex-1 resize-none bg-transparent text-[14px] text-gray-900
                   placeholder:text-gray-400
                   focus:outline-none
                   disabled:cursor-not-allowed
                   leading-relaxed"
          style={{
            minHeight: '44px',
            maxHeight: '128px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-gray-300) transparent',
          }}
        />

        {/* Send Button — Button radius (12px) */}
        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className={`
            relative flex items-center justify-center
            w-11 h-11 rounded-[12px] flex-shrink-0
            transition-all duration-200
            ${canSend
              ? 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-label="发送消息"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Character count hint */}
      {value.length > 800 && (
        <div className="text-[12px] text-gray-500 text-right animate-fade-in">
          {value.length} 字符
        </div>
      )}
    </div>
  );
}
