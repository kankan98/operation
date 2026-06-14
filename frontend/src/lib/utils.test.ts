import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(99.99, 'EUR')).toBe('€99.99');
  });

  it('formats GBP correctly', () => {
    expect(formatCurrency(99.99, 'GBP')).toBe('£99.99');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(99.999, 'USD')).toBe('$100.00');
    expect(formatCurrency(99.994, 'USD')).toBe('$99.99');
  });
});

describe('formatDate', () => {
  it('formats timestamp correctly', () => {
    const timestamp = new Date('2024-06-14T12:00:00Z').getTime();
    const formatted = formatDate(timestamp);

    // Should return format like "Jun 14, 2024"
    expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
  });

  it('handles current timestamp', () => {
    const now = Date.now();
    const formatted = formatDate(now);

    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});

describe('formatDateTime', () => {
  it('formats timestamp with time correctly', () => {
    const timestamp = new Date('2024-06-14T12:30:00Z').getTime();
    const formatted = formatDateTime(timestamp);

    // Should return format like "Jun 14, 2024, 12:30 PM"
    expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles midnight correctly', () => {
    const timestamp = new Date('2024-06-14T00:00:00Z').getTime();
    const formatted = formatDateTime(timestamp);

    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('handles noon correctly', () => {
    const timestamp = new Date('2024-06-14T12:00:00Z').getTime();
    const formatted = formatDateTime(timestamp);

    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});
