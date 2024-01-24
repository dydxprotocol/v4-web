export type ExchangeConfigParsedCsv = Array<{
  base_asset: string;
  exchange: string;
  pair: string;

  adjust_by_market: string;
  min_2_depth: string;
  avg_30d_vol: string;
  reference_price: string;
  risk_assessment: string;
  num_oracles: string;
  liquidity_tier: string;
  asset_name: string;
}>;

export type ExchangeConfigItem = {
  exchangeName: string;
  ticker: string;
  adjustByMarket?: string;
};

export type PotentialMarketParsedCsv = Array<{
  base_asset: string;
  reference_price: string;
  num_oracles: string;
  liquidity_tier: string;
  asset_name: string;
  p: string;
  atomic_resolution: string;
  min_exchanges: string;
  min_price_change_ppm: string;
  price_exponent: string;
  step_base_quantum: string;
  ticksize_exponent: string;
  subticks_per_tick: string;
  min_order_size: string;
  quantum_conversion_exponent: string;
}>;

export type PotentialMarketItem = {
  baseAsset: string;
  referencePrice: string;
  numOracles: string;
  liquidityTier: string;
  assetName: string;
  p: string;
  atomicResolution: string;
  minExchanges: string;
  minPriceChangePpm: string;
  priceExponent: string;
  stepBaseQuantum: string;
  ticksizeExponent: string;
  subticksPerTick: string;
  minOrderSize: string;
  quantumConversionExponent: string;
};

export const NUM_ORACLES_TO_QUALIFY_AS_SAFE = 6;

export const LIQUIDITY_TIERS = {
  0: {
    label: 'Large-cap',
    initialMarginFraction: 0.05,
    maintenanceMarginFraction: 0.03,
    impactNotional: 10_000,
  },
  1: {
    label: 'Mid-cap',
    initialMarginFraction: 0.1,
    maintenanceMarginFraction: 0.05,
    impactNotional: 5_000,
  },
  2: {
    label: 'Long-tail',
    initialMarginFraction: 0.2,
    maintenanceMarginFraction: 0.1,
    impactNotional: 2_500,
  },
  3: {
    label: 'Safety',
    initialMarginFraction: 1,
    maintenanceMarginFraction: 0.2,
    impactNotional: 2_500,
  },
};
