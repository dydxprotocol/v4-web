export type SpotMarketToken = {
  tokenAddress: string;
  name: string;
  symbol: string;
  logoUrl?: string | null;
  volume24hUsd?: number;
  priceUsd?: number;
  marketCapUsd?: number;
  change24hPercent?: number;
  markPriceUsd?: number;
  fdvUsd?: number;
  liquidityUsd?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  percentChange24h?: number;
  buys24hUsd?: number;
  sells24hUsd?: number;
};
