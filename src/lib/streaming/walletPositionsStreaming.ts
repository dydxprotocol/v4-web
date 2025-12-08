import { timeUnits } from '@/constants/time';

import { SpotApiTokenInfoObject } from '@/clients/spotApi';

import { BaseSocketIOManager } from './BaseSocketIOManager';

export interface SpotApiWsWalletPositionObject {
  walletAddress: string;
  tokenMint: string;
  decimals: number;
  rawBalance: string;
  totalBought: number;
  totalSold: number;
  currentBalance: number;
  totalBoughtUsd: number;
  totalSoldUsd: number;
  averageCostBasis: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  firstTradeAt: string;
  lastTradeAt: string;
  tradeCount: number;
  tokenData?: SpotApiTokenInfoObject;
  unrealizedValueUsd: number;
}

export interface SpotApiWsWalletBalanceObject {
  mint: string;
  amount: number;
  decimals: number;
  rawAmount: string;
  priceUsd: number;
  usdValue: number;
}

export interface SpotApiWsWalletPositionsUpdate {
  walletAddress: string;
  positions: SpotApiWsWalletPositionObject[];
  tokenBalances: SpotApiWsWalletBalanceObject[];
  totalPnL: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalValueUsd: number;
  solBalance: number;
  solPriceUsd: number;
  solValueUsd: number;
  lastUpdated: string;
}

const HEARTBEAT_INTERVAL = timeUnits.minute * 5;

class WalletPositionsSocketManager extends BaseSocketIOManager {
  constructor(apiUrl: string) {
    super(apiUrl, {
      interval: HEARTBEAT_INTERVAL,
      event: 'wallet-ping',
    });
  }

  protected setupEventListeners(): void {
    this.socket!.on('wallet-positions-update', (data: SpotApiWsWalletPositionsUpdate) => {
      this.notifyHandlers(data.walletAddress, data);
    });
  }

  protected sendSubscription(walletAddress: string): void {
    this.socket!.emit('subscribe-positions', { channel: walletAddress });
  }

  protected sendUnsubscription(walletAddress: string): void {
    this.socket!.emit('unsubscribe-positions', { channel: walletAddress });
  }
}

let walletManager: WalletPositionsSocketManager | null = null;

export const subscribeToWalletPositions = (
  apiUrl: string,
  walletAddress: string,
  onUpdate: (data: SpotApiWsWalletPositionsUpdate) => void
): (() => void) => {
  if (!walletManager || walletManager.urlValue !== apiUrl) {
    walletManager?.disconnect();
    walletManager = new WalletPositionsSocketManager(apiUrl);
  }

  return walletManager.subscribe(walletAddress, onUpdate);
};

export const unsubscribeFromWalletPositions = (subscriberUID: string) => {
  if (walletManager) {
    walletManager.unsubscribe(subscriberUID);
  }
};

export const disconnectWalletPositionsStream = () => {
  if (walletManager) {
    walletManager.disconnect();
    walletManager = null;
  }
};
