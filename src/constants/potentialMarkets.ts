export type ExchangeConfigItem = {
  exchangeName: string;
  ticker: string;
  adjustByMarket?: string;
};

export type PotentialMarketItem = {
  baseAsset: string;
  referencePrice: string;
  numOracles: number;
  liquidityTier: number;
  assetName: string;
  p: number;
  atomicResolution: number;
  minExchanges: number;
  minPriceChangePpm: number;
  priceExponent: number;
  stepBaseQuantum: number;
  ticksizeExponent: number;
  subticksPerTick: number;
  minOrderSize: number;
  quantumConversionExponent: number;
};

export const NUM_ORACLES_TO_QUALIFY_AS_SAFE = 6;
