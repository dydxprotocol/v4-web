import { PersistedState } from 'redux-persist';

import { EvmDerivedAddresses, SolDerivedAddresses } from '@/constants/account';
import {
  ConnectorType,
  DydxAddress,
  EvmAddress,
  SolAddress,
  WalletInfo,
  WalletNetworkType,
} from '@/constants/wallets';

import { WalletState } from '../wallet';
import { parseStorageItem } from './utils';

export type V1State = PersistedState & { wallet: WalletState };
/**
 * Move over wallet data from localStorage into redux
 * TODO (in future migration): Remove these localStorage items
 */
export function migration1(state: PersistedState): V1State {
  if (!state) {
    throw new Error('state must be defined');
  }

  // We have to run parseStorageItem on these strings because they are stored with a extra quotations (from JSON.stringify)!
  const evmAddress = parseStorageItem<EvmAddress>(localStorage.getItem('dydx.EvmAddress'));
  const evmDerivedAddresses = parseStorageItem<EvmDerivedAddresses>(
    localStorage.getItem('dydx.EvmDerivedAddresses')
  );
  const solAddress = parseStorageItem<SolAddress>(localStorage.getItem('dydx.SolAddress'));
  const solDerivedAddresses = parseStorageItem<SolDerivedAddresses>(
    localStorage.getItem('dydx.SolDerivedAddresses')
  );

  const dydxAddress = parseStorageItem<DydxAddress>(localStorage.getItem('dydx.DydxAddress'));
  const selectedWallet = parseStorageItem<WalletInfo>(
    localStorage.getItem('dydx.OnboardingSelectedWallet')
  );

  if (!selectedWallet) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: undefined,
          chain: undefined,
          encryptedSignature: undefined,
          walletInfo: undefined,
        },
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.PhantomSolana) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: solAddress ?? undefined,
          chain: WalletNetworkType.Solana,
          encryptedSignature: solAddress
            ? solDerivedAddresses?.[solAddress]?.encryptedSignature
            : undefined,
          walletInfo: selectedWallet,
        },
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.Cosmos) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: dydxAddress ?? undefined,
          chain: WalletNetworkType.Cosmos,
          walletInfo: selectedWallet,
        },
      },
    };
  }

  const shouldCopyOverEvmSignature = evmAddress && evmDerivedAddresses?.version === 'v2';
  return {
    ...state,
    wallet: {
      sourceAccount: {
        address: evmAddress,
        chain: WalletNetworkType.Evm,
        encryptedSignature: shouldCopyOverEvmSignature
          ? evmDerivedAddresses?.[evmAddress]?.encryptedSignature
          : undefined,
        walletInfo: selectedWallet,
      },
    },
  };
}
