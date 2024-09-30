import { PersistedState } from 'redux-persist';

import { EvmDerivedAddresses, SolDerivedAddresses } from '@/constants/account';
import { ConnectorType, EvmAddress, WalletInfo } from '@/constants/wallets';

import { parseStorageItem } from './utils';

/**
 * Move over wallet data into redux
 *
 */
export function migration1(state: PersistedState) {
  if (!state) {
    throw new Error('state must be defined');
  }

  const evmAddress = localStorage.getItem('dydx.EvmAddress') as EvmAddress;
  const evmDerivedAddresses = parseStorageItem(
    localStorage.getItem('dydx.EvmDerivedAddresses')
  ) as EvmDerivedAddresses;

  const solAddress = localStorage.getItem('dydx.SolAddress');
  const solDerivedAddresses = parseStorageItem(
    localStorage.getItem('dydx.SolDerivedAddresses')
  ) as SolDerivedAddresses;

  const dydxAddress = localStorage.getItem('dydx.DydxAddress');
  const selectedWallet = parseStorageItem(localStorage.getItem('dydx.OnboardingSelectedWallet')) as
    | WalletInfo
    | undefined;

  if (!selectedWallet) {
    return {
      ...state,
      wallet: {
        sourceAccount: undefined,
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.PhantomSolana && solAddress) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: solAddress,
          chain: 'solana',
          encryptedSignature: solDerivedAddresses[solAddress]?.encryptedSignature,
          walletInfo: selectedWallet,
        },
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.Cosmos && dydxAddress) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: dydxAddress,
          chain: 'cosmos',
          walletInfo: selectedWallet,
        },
      },
    };
  }

  return {
    ...state,
  };
}
