import {
  BusinessMetricPriceSource,
  BusinessMetrics,
  Product,
  ProductBusinessSignal,
  ProductBusinessSignalUpsert,
} from '../types';

const ASSUMPTION_CAVEAT =
  'Business metrics are calculated from merchant-provided assumptions and are not verified marketplace demand, sales volume, or fee facts.';

type BusinessAssumptions =
  | ProductBusinessSignal
  | ProductBusinessSignalUpsert
  | null
  | undefined;

export class BusinessMetricsService {
  calculate(
    product: Pick<Product, 'currentPrice' | 'currency'>,
    assumptions: BusinessAssumptions
  ): BusinessMetrics {
    const currency = assumptions?.currency ?? product.currency;
    const sellPrice = this.resolveSellPrice(product, assumptions);
    const priceSource = this.resolvePriceSource(product, assumptions);

    const inputs = {
      sellPrice,
      costBasis: this.valueOrNull(assumptions?.costBasis),
      inboundShipping: this.valueOrNull(assumptions?.inboundShipping),
      outboundShipping: this.valueOrNull(assumptions?.outboundShipping),
      fulfillmentFee: this.valueOrNull(assumptions?.fulfillmentFee),
      platformFee: this.valueOrNull(assumptions?.platformFee),
      referralFeeRate: this.valueOrNull(assumptions?.referralFeeRate),
      referralFee:
        sellPrice !== null && assumptions?.referralFeeRate !== null && assumptions?.referralFeeRate !== undefined
          ? this.round(sellPrice * assumptions.referralFeeRate)
          : null,
      advertisingCost: this.valueOrNull(assumptions?.advertisingCost),
      taxCustomsBuffer: this.valueOrNull(assumptions?.taxCustomsBuffer),
    };

    const requiredSignals: Array<keyof typeof inputs> = [
      'sellPrice',
      'costBasis',
      'inboundShipping',
      'outboundShipping',
      'fulfillmentFee',
      'platformFee',
      'referralFeeRate',
      'advertisingCost',
      'taxCustomsBuffer',
    ];
    const missingSignals = requiredSignals.filter((signal) => {
      const value = inputs[signal];
      if (value === null) return true;
      if (signal === 'sellPrice' && value <= 0) return true;
      return false;
    });
    const providedCount = requiredSignals.length - missingSignals.length;
    const completeness =
      providedCount === 0
        ? 'none'
        : missingSignals.length === 0
          ? 'complete'
          : 'partial';

    if (completeness !== 'complete') {
      return {
        currency,
        priceSource,
        completeness,
        missingSignals,
        totalVariableCost: null,
        grossMargin: null,
        netMargin: null,
        roi: null,
        breakevenSellPrice: null,
        contributionProfitPerUnit: null,
        targetUnits: this.valueOrNull(assumptions?.targetUnits),
        projectedContributionProfit: null,
        inputs,
        caveat: ASSUMPTION_CAVEAT,
      };
    }

    const fixedCosts =
      inputs.costBasis! +
      inputs.inboundShipping! +
      inputs.outboundShipping! +
      inputs.fulfillmentFee! +
      inputs.platformFee! +
      inputs.advertisingCost! +
      inputs.taxCustomsBuffer!;
    const totalVariableCost = this.round(fixedCosts + inputs.referralFee!);
    const contributionProfitPerUnit = this.round(inputs.sellPrice! - totalVariableCost);
    const grossMargin = this.round(
      (inputs.sellPrice! - inputs.costBasis!) / inputs.sellPrice!,
      4
    );
    const netMargin = this.round(contributionProfitPerUnit / inputs.sellPrice!, 4);
    const roi =
      inputs.costBasis! > 0
        ? this.round(contributionProfitPerUnit / inputs.costBasis!, 4)
        : null;
    const breakevenSellPrice =
      inputs.referralFeeRate! < 1
        ? this.round(fixedCosts / (1 - inputs.referralFeeRate!))
        : null;
    const targetUnits = this.valueOrNull(assumptions?.targetUnits);

    return {
      currency,
      priceSource,
      completeness,
      missingSignals,
      totalVariableCost,
      grossMargin,
      netMargin,
      roi,
      breakevenSellPrice,
      contributionProfitPerUnit,
      targetUnits,
      projectedContributionProfit:
        targetUnits !== null
          ? this.round(contributionProfitPerUnit * targetUnits)
          : null,
      inputs,
      caveat: ASSUMPTION_CAVEAT,
    };
  }

  createEmptySummary(product: Pick<Product, 'currentPrice' | 'currency'>) {
    const metrics = this.calculate(product, null);
    return {
      completeness: metrics.completeness,
      missingSignals: metrics.missingSignals,
      metrics,
      caveat: ASSUMPTION_CAVEAT,
    };
  }

  private resolveSellPrice(
    product: Pick<Product, 'currentPrice'>,
    assumptions: BusinessAssumptions
  ): number | null {
    return (
      this.valueOrNull(assumptions?.targetSellPrice) ??
      this.valueOrNull(product.currentPrice)
    );
  }

  private resolvePriceSource(
    product: Pick<Product, 'currentPrice'>,
    assumptions: BusinessAssumptions
  ): BusinessMetricPriceSource {
    if (this.valueOrNull(assumptions?.targetSellPrice) !== null) return 'target';
    if (this.valueOrNull(product.currentPrice) !== null) return 'current_price';
    return 'missing';
  }

  private valueOrNull(value: number | null | undefined): number | null {
    return value === undefined ? null : value;
  }

  private round(value: number, digits = 2): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }
}
