import { createContext } from 'react';
import type { Address, AssetId } from 'fuel-ts-sdk';
import type { Account, Network as FuelsNetwork } from 'fuels';

export type WalletContextType = {
  establishConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  isUserConnected: () => boolean;

  getUserAddress: () => Promise<Address | undefined>;
  getUserBalances: () => Promise<Record<AssetId, bigint>>;

  getCurrentNetwork: () => Promise<FuelsNetwork>;
  changeNetwork: (network: FuelsNetwork) => Promise<void>;
  registerNetworkChangeObserver: (listener: (network: FuelsNetwork) => void) => void;
  unregisterNetworkChangeObserver: (listener: (network: FuelsNetwork) => void) => void;

  getUserWalletReference: () => Promise<Account | undefined>;
};

export const WalletContext = createContext<WalletContextType | null>(null);

WalletContext.displayName = 'WalletContext';
