import { describe, it, expect } from 'vitest';
import {
  validateProductUrl,
  validateEmail,
  validatePlatform,
  sanitizeString,
  validatePositiveNumber,
} from '../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateProductUrl', () => {
    it('should validate Amazon URL', () => {
      const valid = validateProductUrl('https://www.amazon.com/dp/B08N5WRWNW', 'amazon');
      expect(valid).toBe(true);
    });

    it('should validate Walmart URL', () => {
      const valid = validateProductUrl('https://www.walmart.com/ip/123456789', 'walmart');
      expect(valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const valid = validateProductUrl('not-a-url', 'amazon');
      expect(valid).toBe(false);
    });

    it('should reject mismatched platform', () => {
      const valid = validateProductUrl('https://www.walmart.com/ip/123', 'amazon');
      expect(valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('missing@')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('validatePlatform', () => {
    it('should validate supported platforms', () => {
      expect(validatePlatform('amazon')).toBe(true);
      expect(validatePlatform('walmart')).toBe(true);
      expect(validatePlatform('aliexpress')).toBe(true);
    });

    it('should reject unsupported platforms', () => {
      expect(validatePlatform('unknown')).toBe(false);
      expect(validatePlatform('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeString(input);
      expect(result).toBe('Hello  World');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello</div>';
      const result = sanitizeString(input);
      expect(result).toBe('Hello');
    });

    it('should limit string length', () => {
      const input = 'a'.repeat(2000);
      const result = sanitizeString(input, 100);
      expect(result.length).toBe(100);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(1)).toBe(true);
      expect(validatePositiveNumber(0.5)).toBe(true);
      expect(validatePositiveNumber('10')).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(validatePositiveNumber(0)).toBe(false);
      expect(validatePositiveNumber(-1)).toBe(false);
      expect(validatePositiveNumber('abc')).toBe(false);
    });
  });
});
