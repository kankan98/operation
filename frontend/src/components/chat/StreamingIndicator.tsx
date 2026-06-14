import { useTranslation } from 'react-i18next';

/**
 * Typing indicator shown while the assistant is generating a response.
 *
 * Uses an opacity pulse (fade) rather than a bounce — the design system's
 * motion rules allow Fade/Skeleton and explicitly disallow Bounce, and cap
 * animation timing at 150–250ms.
 */
export function StreamingIndicator() {
  const { t } = useTranslation('chat');

  return (
    <div className="flex items-center gap-2 text-sm text-fg-muted">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500 [animation-duration:1000ms]" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500 [animation-duration:1000ms]" style={{ animationDelay: '200ms' }} />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500 [animation-duration:1000ms]" style={{ animationDelay: '400ms' }} />
      </div>
      <span>{t('thinking')}</span>
    </div>
  );
}
