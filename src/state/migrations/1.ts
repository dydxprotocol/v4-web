import { PersistedState } from 'redux-persist';

import { EvmDerivedAddresses, SolDerivedAddresses } from '@/constants/account';
import { ConnectorType, EvmAddress, WalletInfo } from '@/constants/wallets';

import { parseStorageItem } from './utils';

/**
 * Move over wallet data from localStorage into redux
 * TODO (in future migration): Remove these localStorage items
 */
export function migration1(state: PersistedState) {
  if (!state) {
    throw new Error('state must be defined');
  }

  const evmAddress = localStorage.getItem('dydx.EvmAddress') as EvmAddress | undefined;
  const evmDerivedAddresses = parseStorageItem<EvmDerivedAddresses>(
    localStorage.getItem('dydx.EvmDerivedAddresses')
  );

  const solAddress = localStorage.getItem('dydx.SolAddress');
  const solDerivedAddresses = parseStorageItem<SolDerivedAddresses>(
    localStorage.getItem('dydx.SolDerivedAddresses')
  );

  const dydxAddress = localStorage.getItem('dydx.DydxAddress');
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
          chain: 'solana',
          encryptedSignature: solAddress && solDerivedAddresses?.[solAddress]?.encryptedSignature,
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
          chain: 'cosmos',
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
        chain: 'evm',
        encryptedSignature: shouldCopyOverEvmSignature
          ? evmDerivedAddresses?.[evmAddress]?.encryptedSignature
          : undefined,
        walletInfo: selectedWallet,
      },
    },
  };
}
