import { describe, expect, it } from 'vitest';
import { BusinessMetricsService } from '../src/services/businessMetricsService';
import { Product } from '../src/types';

describe('BusinessMetricsService', () => {
  const service = new BusinessMetricsService();
  const product = {
    currentPrice: 100,
    currency: 'USD',
  } as Product;

  it('computes complete assumption-based financial metrics', () => {
    const metrics = service.calculate(product, {
      currency: 'USD',
      costBasis: 40,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.15,
      advertisingCost: 8,
      taxCustomsBuffer: 3,
      targetSellPrice: 120,
      targetUnits: 10,
    });

    expect(metrics.priceSource).toBe('target');
    expect(metrics.completeness).toBe('complete');
    expect(metrics.inputs.referralFee).toBe(18);
    expect(metrics.totalVariableCost).toBe(86);
    expect(metrics.contributionProfitPerUnit).toBe(34);
    expect(metrics.netMargin).toBe(0.2833);
    expect(metrics.roi).toBe(0.85);
    expect(metrics.breakevenSellPrice).toBe(80);
    expect(metrics.projectedContributionProfit).toBe(340);
  });

  it('falls back to current product price when target sell price is absent', () => {
    const metrics = service.calculate(product, {
      currency: 'USD',
      costBasis: 40,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.1,
      advertisingCost: 8,
      taxCustomsBuffer: 3,
    });

    expect(metrics.priceSource).toBe('current_price');
    expect(metrics.inputs.sellPrice).toBe(100);
    expect(metrics.inputs.referralFee).toBe(10);
  });

  it('reports missing assumptions without treating them as zero', () => {
    const metrics = service.calculate(product, {
      currency: 'USD',
      costBasis: 40,
      referralFeeRate: 0.15,
    });

    expect(metrics.completeness).toBe('partial');
    expect(metrics.missingSignals).toEqual(
      expect.arrayContaining([
        'inboundShipping',
        'outboundShipping',
        'fulfillmentFee',
        'platformFee',
        'advertisingCost',
        'taxCustomsBuffer',
      ])
    );
    expect(metrics.totalVariableCost).toBeNull();
    expect(metrics.netMargin).toBeNull();
    expect(metrics.roi).toBeNull();
  });

  it('guards zero sell price and one-hundred-percent referral fee', () => {
    const zeroPriceMetrics = service.calculate(
      { currentPrice: 0, currency: 'USD' } as Product,
      {
        currency: 'USD',
        costBasis: 0,
        inboundShipping: 0,
        outboundShipping: 0,
        fulfillmentFee: 0,
        platformFee: 0,
        referralFeeRate: 0,
        advertisingCost: 0,
        taxCustomsBuffer: 0,
      }
    );

    expect(zeroPriceMetrics.completeness).toBe('partial');
    expect(zeroPriceMetrics.missingSignals).toContain('sellPrice');

    const fullReferralMetrics = service.calculate(product, {
      currency: 'USD',
      costBasis: 40,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 1,
      advertisingCost: 8,
      taxCustomsBuffer: 3,
    });

    expect(fullReferralMetrics.completeness).toBe('complete');
    expect(fullReferralMetrics.breakevenSellPrice).toBeNull();
  });
});
