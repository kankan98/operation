import i18n from '@/i18n';

function activeLang(lang?: string): 'zh' | 'en' {
  return (lang ?? i18n.language ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const LOCALE = { zh: 'zh-CN', en: 'en-US' } as const;

/** Locale-aware currency. Chinese uses ¥-style narrow symbols, English uses $. */
export function formatCurrency(amount: number, currency = 'USD', lang?: string): string {
  const l = activeLang(lang);
  try {
    return new Intl.NumberFormat(LOCALE[l], {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(LOCALE[l], { style: 'currency', currency }).format(amount);
  }
}

/**
 * Locale-aware number. Chinese abbreviates with 万 (1e4) and 亿 (1e8);
 * English uses thousand separators.
 */
export function formatNumber(value: number, lang?: string): string {
  const l = activeLang(lang);
  if (l === 'zh') {
    const abs = Math.abs(value);
    if (abs >= 1e8) return `${stripZero(value / 1e8)}亿`;
    if (abs >= 1e4) return `${stripZero(value / 1e4)}万`;
    return value.toLocaleString('zh-CN');
  }
  return value.toLocaleString('en-US');
}

function stripZero(n: number): string {
  return Number(n.toFixed(1)).toString();
}

/** Locale-aware date. Chinese: YYYY年MM月DD日. English: localized date. */
export function formatDate(timestamp: number, lang?: string): string {
  const l = activeLang(lang);
  const d = new Date(timestamp);
  if (l === 'zh') {
    return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`;
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Locale-aware date + time. */
export function formatDateTime(timestamp: number, lang?: string): string {
  const l = activeLang(lang);
  const d = new Date(timestamp);
  if (l === 'zh') {
    return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  }
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
