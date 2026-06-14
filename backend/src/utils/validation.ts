const SUPPORTED_PLATFORMS = ['amazon', 'walmart', 'aliexpress', 'ebay', 'lazada', 'other'] as const;

const PLATFORM_URL_PATTERNS: Record<string, RegExp> = {
  amazon: /^https?:\/\/(www\.)?amazon\.(com|co\.uk|de|fr|jp|ca|cn|in|com\.mx|com\.br|com\.au)\/(.*\/)?(dp|gp\/product)\/[A-Z0-9]+/i,
  walmart: /^https?:\/\/(www\.)?walmart\.com\/ip\/.*/i,
  aliexpress: /^https?:\/\/(www\.)?aliexpress\.(com|ru)\/item\/.+\.html/i,
  ebay: /^https?:\/\/(www\.)?ebay\.(com|co\.uk|de|fr|com\.au|ca)\/itm\/.+/i,
  lazada: /^https?:\/\/(www\.)?lazada\.(com\.my|sg|co\.th|com\.ph|vn|co\.id)\/.+/i,
  other: /^https?:\/\/.+/i,
};

export function validateProductUrl(url: string, platform: string): boolean {
  if (!url || !platform) return false;

  const pattern = PLATFORM_URL_PATTERNS[platform];
  if (!pattern) return false;

  return pattern.test(url);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function validatePlatform(platform: string): boolean {
  return SUPPORTED_PLATFORMS.includes(platform as any);
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';

  // 移除危险字符
  const sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // 限制长度
  return sanitized.substring(0, maxLength);
}

export function validatePositiveNumber(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}
