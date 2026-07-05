import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DonutChart } from '@/components/ui/charts/DonutChart';

describe('DonutChart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an empty state without mounting a Recharts responsive container', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <DonutChart
        data={[
          { name: 'Active', value: 0, color: '#16a34a' },
          { name: 'Paused', value: 0, color: '#e5e7eb' },
        ]}
        centerValue={0}
        centerLabel="Products"
      />,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).not.toBeInTheDocument();
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('width(-1)'));
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('width(-1)'));
  });

  it('keeps using Recharts for non-empty data', () => {
    const { container } = render(
      <DonutChart
        data={[
          { name: 'Active', value: 2, color: '#16a34a' },
          { name: 'Paused', value: 1, color: '#e5e7eb' },
        ]}
        centerValue={3}
        centerLabel="Products"
      />,
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
