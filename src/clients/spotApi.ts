import { logBonsaiError } from '@/bonsai/logs';

import { simpleFetch } from '@/lib/simpleFetch';

export type SpotTokenPriceResponse = {
  price: number;
};

export type TokenInfo = {
  priceUSD: number;
  priceSOL: number;
  marketCapUSD: number;
  marketCapSOL: number;
  pricePercentChange1h: number;
  token1hPriceChange: string;
  pricePercentChange24h: number;
  token24hPriceChange: string;
  volumeUSD: number;
  tokenVolume: string;
  liquidityUSD: number;
  liquiditySOL: number;
  tokenLiquidity: string;
  token24hBuys: number;
  token24hSells: number;
  isPump: boolean;
  bondingCurveProgress: number;
  tokenFDV: string;
  isGraduating: boolean;
  tokenDexUrl: string;
};

export type SpotTokenMetadataResponse = {
  tokenInfo: TokenInfo;
};

export class SpotApiClient {
  private host: string;

  constructor(host: string) {
    if (!host) {
      logBonsaiError('SpotApiClient', 'SpotApiClient requires a host');
    }

    this.host = host;
  }

  _get<T>(endpoint: string) {
    return simpleFetch<T>(`${this.host}/${endpoint}`);
  }

  async getTokenPrice(mint: string) {
    return this._get<SpotTokenPriceResponse>(`tokens/price?mint=${mint}`);
  }

  async getTokenMetadata(mint: string) {
    return this._get<SpotTokenMetadataResponse>(`tokens/info?mint=${mint}`);
  }
}
