import { ConnectorType, WalletType } from '@/constants/wallets';

import type { RootState } from './_store';
import { createAppSelector } from './appTypes';

/**
 * @returns saved wallet and account information
 */
export const getSourceAccount = (state: RootState) => state.wallet.sourceAccount;

export const selectIsKeplrConnected = createAppSelector(
  [getSourceAccount],
  (sourceAccount) => sourceAccount.walletInfo?.name === WalletType.Keplr
);

export const selectIsTurnkeyConnected = createAppSelector(
  [getSourceAccount],
  (sourceAccount) => sourceAccount.walletInfo?.name === WalletType.Turnkey
);

export const selectWalletInfo = createAppSelector(
  [getSourceAccount],
  (sourceAccount) => sourceAccount.walletInfo
);

export const selectTurnkeyWalletInfo = createAppSelector([selectWalletInfo], (walletInfo) => {
  if (walletInfo?.connectorType === ConnectorType.Turnkey) {
    return walletInfo;
  }

  return undefined;
});

export const getLocalWalletNonce = (state: RootState) => state.walletEphemeral.localWalletNonce;
export const getHdKeyNonce = (state: RootState) => state.walletEphemeral.hdKeyNonce;

export const getTurnkeyEmailOnboardingData = (state: RootState) =>
  state.wallet.turnkeyEmailOnboardingData;

export const getTurnkeyPrimaryWallet = (state: RootState) => state.wallet.turnkeyPrimaryWallet;
