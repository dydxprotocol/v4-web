export type ExchangeConfigItem = {
  exchangeName: string;
  ticker: string;
  adjustByMarket?: string;
};

export type NewMarketParams = {
  id: number;
  ticker: string;
  priceExponent: number;
  minExchanges: number;
  minPriceChange: number;
  exchangeConfigJson: ExchangeConfigItem[];
  liquidityTier: number;
  atomicResolution: number;
  quantumConversionExponent: number;
  defaultFundingPpm: number;
  stepBaseQuantums: number;
  subticksPerTick: number;
  delayBlocks: number;
};

export type NewMarketProposal = {
  title: string;
  summary: string;
  params: NewMarketParams;
  meta: {
    assetName: string;
    referencePrice: number;
  };
  initial_deposit: {
    denom: string;
    amount: string;
  };
  baseAsset: string;
};

export const NUM_ORACLES_TO_QUALIFY_AS_SAFE = 5;
