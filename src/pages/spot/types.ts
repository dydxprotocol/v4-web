export interface SpotHeaderToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  logoUrl?: string | null;
  volume24hUsd?: number;
  priceUsd?: number;
  marketCapUsd?: number;
  change24hPercent?: number;
  fdvUsd?: number;
  liquidityUsd?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  buys24hUsd?: number;
  sells24hUsd?: number;
  holders?: number;
  top10HoldersPercent?: number;
  devHoldingPercent?: number;
  snipersPercent?: number;
  bundlersPercent?: number;
  insidersPercent?: number;
  createdAt?: Date;
}
