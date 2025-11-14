import { logBonsaiError } from '@/bonsai/logs';

import { DEFAULT_PRIORITY_FEE_LAMPORTS, DEFAULT_SLIPPAGE_BPS } from '@/constants/spot';

import { simpleFetch } from '@/lib/simpleFetch';

export enum SpotApiLandingMethod {
  JITO = 'jito',
  NORMAL = 'normal',
  HELIUS = 'helius',
  ZERO_SLOT = '0slot',
}

export enum SpotApiSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum SpotApiTradeRoute {
  RAYDIUM = 'raydium',
  METEORA = 'meteora',
  PUMP_SWAP = 'pump-swap',
  ORCA = 'orca',
  PUMP = 'pump',
  BONK = 'bonk',
  LAUNCHLAB = 'launchlab',
  BELIEVE = 'believe',
  JUPITER = 'jupiter',
}

export type SpotApiCreateTransactionRequest = {
  account: string;
  tokenMint: string;
  side: SpotApiSide;
  inAmount: string;
  maxSlippageBps?: number;
  pool: string;
  tradeRoute: SpotApiTradeRoute;
  priorityFeeLamports?: number;
};

export type SpotApiTransactionMetadataObject = {
  timestamp: string;
  pool: string;
  route: string;
  requestedRoute?: SpotApiTradeRoute;
  side: SpotApiSide;
  interfaceId?: string;
  implementation?: string;
  subRoute?: string;
  fallbackUsed?: boolean;
  latency?: number;
};

export type SpotApiCreateTransactionResponse = {
  transaction: string;
  metadata: SpotApiTransactionMetadataObject;
};

export type SpotApiLandTransactionRequest = {
  signedTransaction: string;
  expectedTokenMint: string;
  walletAddress?: string;
  landingMethod?: SpotApiLandingMethod;
};

export type SpotApiLandTransactionResponse = {
  txHash: string;
  landedAt: string;
  confirmationMethod: string;
  landingMethod: string;
  side: SpotApiSide;
  tokenMint: string;
  walletAddress: string;
  solChange: number;
  tokenChange: number;
  metrics: {
    boughtUsd: number;
    boughtAmount: number;
    soldUsd: number;
    soldAmount: number;
    pnlUsd: number;
    pnlPercent: number;
  };
};

export type SpotApiTokenPriceResponse = {
  price: number;
};

export interface SpotApiTokenSocialLinksObject {
  bitcointalk: string | null;
  blog: string | null;
  coingecko: string | null;
  coinmarketcap: string | null;
  discord: string | null;
  email: string | null;
  facebook: string | null;
  github: string | null;
  instagram: string | null;
  linkedin: string | null;
  reddit: string | null;
  slack: string | null;
  telegram: string | null;
  twitch: string | null;
  twitter: string | null;
  website: string | null;
  wechat: string | null;
  whitepaper: string | null;
  youtube: string | null;
}

export interface SpotApiTokenInfoObject {
  tokenMint: string;
  pairAddress: string;
  tradeRoute: string;
  symbol: string;
  tokenNameFull: string;
  image: string;
  tokenTimestamp: string;
  createdAt: number;
  socialLinks: SpotApiTokenSocialLinksObject;
  otherLinks: string;
  decimals: number;
  totalSupply: string;
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
}

export type SpotApiTokenMetadataResponse = {
  tokenInfo: SpotApiTokenInfoObject;
};

export interface SpotApiSearchTokenInfoObject {
  mint: string;
  symbol: string;
  name: string;
  volumeUsd: number;
  priceUsd: number;
  priceChangePercent24h: number;
  priceChangeAmount24h: number;
  marketCapUSD: number;
  imageSm: string | null;
  imageLg: string | null;
}

export type SpotApiTokenSearchResponse = {
  tokens: SpotApiSearchTokenInfoObject[];
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

  _post<T>(endpoint: string, body: unknown) {
    return simpleFetch<T>(`${this.host}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async getTokenPrice(mint: string) {
    return this._get<SpotApiTokenPriceResponse>(`tokens/price?mint=${mint}`);
  }

  async getTokenMetadata(mint: string) {
    return this._get<SpotApiTokenMetadataResponse>(`tokens/info?mint=${mint}`);
  }

  async searchTokens(query?: string, limit = 20) {
    return this._get<SpotApiTokenSearchResponse>(
      `tokens/search?phrase=${encodeURIComponent(query ?? '')}&limit=${limit}`
    );
  }

  async createTransaction(request: SpotApiCreateTransactionRequest) {
    return this._post<SpotApiCreateTransactionResponse>('transactions/create', request);
  }

  async landTransaction(request: SpotApiLandTransactionRequest) {
    return this._post<SpotApiLandTransactionResponse>('transactions/land', request);
  }

  get url() {
    return this.host;
  }
}

let spotApiClient: SpotApiClient | null = null;

const getOrCreateSpotApiClient = (apiUrl: string): SpotApiClient => {
  if (!spotApiClient || spotApiClient.url !== apiUrl) {
    spotApiClient = new SpotApiClient(apiUrl);
  }
  return spotApiClient;
};

export const getSpotTokenUsdPrice = async (apiUrl: string, mint: string) => {
  const client = getOrCreateSpotApiClient(apiUrl);
  return client.getTokenPrice(mint);
};

export const getSpotTokenMetadata = async (apiUrl: string, mint: string) => {
  const client = getOrCreateSpotApiClient(apiUrl);
  return client.getTokenMetadata(mint);
};

export const searchSpotTokens = async (apiUrl: string, query?: string) => {
  const client = getOrCreateSpotApiClient(apiUrl);
  return client.searchTokens(query);
};

export const createSpotTransaction = async (
  apiUrl: string,
  request: SpotApiCreateTransactionRequest
) => {
  const client = getOrCreateSpotApiClient(apiUrl);

  const requestWithDefaults: Required<SpotApiCreateTransactionRequest> = {
    ...request,
    maxSlippageBps: request.maxSlippageBps ?? DEFAULT_SLIPPAGE_BPS,
    priorityFeeLamports: request.priorityFeeLamports ?? DEFAULT_PRIORITY_FEE_LAMPORTS,
  };

  return client.createTransaction(requestWithDefaults);
};

export const landSpotTransaction = async (
  apiUrl: string,
  request: SpotApiLandTransactionRequest
) => {
  const client = getOrCreateSpotApiClient(apiUrl);
  return client.landTransaction(request);
};
