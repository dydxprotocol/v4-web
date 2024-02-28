/**
 * Temporary Indexer types
 * remove when Indexer type lib is available through @dydxprotocol/v4-client-js
 */
export type PerpetualMarketResponse = {
  clobPairId: string;
  ticker: string;
  status: string;
  oraclePrice: string;
  priceChange24H: string;
  volume24H: string;
  trades24H: number;
  nextFundingRate: string;
  initialMarginFraction: string;
  maintenanceMarginFraction: string;
  openInterest: string;
  atomicResolution: number;
  quantumConversionExponent: number;
  tickSize: string;
  stepSize: string;
  stepBaseQuantums: number;
  subticksPerTick: number;
};

export type PerpetualMarketSparklineResponse = {
  [key: string]: number[];
};
