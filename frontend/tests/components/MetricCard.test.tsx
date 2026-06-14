import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Package } from 'lucide-react';

describe('MetricCard', () => {
  it('renders title, value, and description', () => {
    render(
      <MetricCard
        title="Total Products"
        value={42}
        icon={Package}
        description="All tracked products"
        trend="neutral"
      />
    );

    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('All tracked products')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(
      <MetricCard
        title="Status"
        value="Active"
        icon={Package}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays trend indicator when provided', () => {
    const { container } = render(
      <MetricCard
        title="Test"
        value={100}
        icon={Package}
        description="test desc"
        trend="up"
      />
    );

    // Check for trend indicator (colored dot)
    const trendIndicator = container.querySelector('.bg-success');
    expect(trendIndicator).toBeInTheDocument();
  });
});
