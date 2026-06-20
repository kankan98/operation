import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

describe('purple design-system regression', () => {
  it('keeps primary and purple utilities on the v2 brand scale', () => {
    const css = source('../../src/index.css');
    const cssWithoutLegacy = css.replace('--color-legacy-purple: #8B5CF6;', '');
    const tailwindConfig = source('../../tailwind.config.js');

    expect(css).toContain('--color-primary-600: #6e54ee;');
    expect(css).toContain('--color-primary-700: #5f46df;');
    expect(css).toContain('--color-purple-600: var(--color-primary-600);');
    expect(css).toContain('--fg-accent: #6e54ee;');
    expect(cssWithoutLegacy).not.toMatch(/#7c3aed|#8b5cf6|rgba\(139, 92, 246/i);

    expect(tailwindConfig).toContain("'accent-purple': '#6E54EE'");
    expect(tailwindConfig).toContain("'legacy-purple': '#8B5CF6'");
  });

  it('uses the v2 purple across dashboard, product, alert, and settings surfaces', () => {
    const dashboard = source('../../src/pages/Dashboard.tsx');
    const lineChart = source('../../src/components/ui/charts/LineChart.tsx');
    const productCard = source('../../src/components/products/ProductCard.tsx');
    const button = source('../../src/components/ui/Button.tsx');
    const alerts = source('../../src/pages/AlertsCenter.tsx');
    const settings = source('../../src/pages/Settings.tsx');

    expect(dashboard).toContain("color: '#6e54ee'");
    expect(dashboard).not.toContain('#7c3aed');
    expect(lineChart).toContain("color = '#6e54ee'");
    expect(productCard).toContain('<Button size="sm" className="flex-1"');
    expect(button).toContain('bg-primary-600 text-white');
    expect(alerts).toContain('bg-primary-50 text-primary-600');
    expect(settings).toContain('bg-primary-50 text-primary-600');
  });

  it('keeps core purple combinations WCAG AA compliant', () => {
    expect(contrastRatio('#ffffff', '#6e54ee')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', '#5f46df')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#6e54ee', '#f4f1ff')).toBeGreaterThanOrEqual(4.5);
  });
});
