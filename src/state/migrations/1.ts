import { EvmDerivedAddresses, SolDerivedAddresses } from '@/constants/account';
import { ConnectorType, EvmAddress, WalletInfo, WalletNetworkType } from '@/constants/wallets';

import { WalletState } from '../wallet';
import { V0State } from './0';
import { parseStorageItem } from './utils';

type V1State = V0State & { wallet: WalletState };
/**
 * Move over wallet data from localStorage into redux
 * TODO (in future migration): Remove these localStorage items
 */
export function migration1(state: V0State): V1State {
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
