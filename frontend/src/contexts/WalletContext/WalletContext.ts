import { createContext } from 'react';
import type { Account, Network as FuelsNetwork } from 'fuels';

export type WalletContextType = {
  establishConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  isUserConnected: () => boolean;

  getCurrentAccount: () => Promise<Account | null>;

  getCurrentNetwork: () => Promise<FuelsNetwork>;
  changeNetwork: (network: FuelsNetwork) => Promise<void>;

  registerNetworkChangeObserver: (listener: (network: FuelsNetwork) => void) => void;
  unregisterNetworkChangeObserver: (listener: (network: FuelsNetwork) => void) => void;
};

export const WalletContext = createContext<WalletContextType | null>(null);

WalletContext.displayName = 'WalletContext';
