import { BonsaiCore } from '@/bonsai/ontology';
import { selectParentSubaccountInfo } from '@/bonsai/socketSelectors';
import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { LocalWallet, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';

import { DydxChainId, ENVIRONMENT_CONFIG_MAP, TOKEN_CONFIG_MAP } from '@/constants/networks';

import type { RootState, RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { SourceAccount } from '@/state/wallet';
import { getLocalWalletNonce, getSourceAccount } from '@/state/walletSelectors';

import { convertBech32Address } from '@/lib/addressUtils';
import { isBlockedGeo } from '@/lib/compliance';
import { localWalletManager } from '@/lib/hdKeyManager';

import { createStoreEffect } from '../../lib/createStoreEffect';

type NobleChainTransactionConfig<T> = {
  selector: (state: RootState) => T;
  handle: (
    environment: {
      nobleClientRpcUrl: string;
      tokenConfig: (typeof TOKEN_CONFIG_MAP)[DydxChainId];
      chainId: DydxChainId;
    },
    wallet: {
      dydxAddress: string | undefined;
      sourceAccount: SourceAccount;
      nobleLocalWallet: LocalWallet;
    },
    selectorResult: NoInfer<T>
  ) => void | (() => void);
};

const selectNobleTxAuthorizedAccount = createAppSelector(
  [
    selectParentSubaccountInfo,
    getSourceAccount,
    calculateIsAccountViewOnly,
    BonsaiCore.compliance.data,
    getLocalWalletNonce,
  ],
  (parentSubaccountInfo, sourceAccount, isAccountViewOnly, complianceData, localWalletNonce) => {
    const isAccountRestrictionFree =
      !isAccountViewOnly &&
      ![
        ComplianceStatus.BLOCKED,
        ComplianceStatus.CLOSE_ONLY,
        ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
      ].includes(complianceData.status) &&
      complianceData.geo &&
      !isBlockedGeo(complianceData.geo);

    if (!parentSubaccountInfo.wallet || !isAccountRestrictionFree || localWalletNonce == null) {
      return undefined;
    }

    const localNobleWallet = localWalletManager.getLocalNobleWallet(localWalletNonce);
    const nobleAddress = convertBech32Address({
      address: parentSubaccountInfo.wallet,
      bech32Prefix: NOBLE_BECH32_PREFIX,
    });
    const isCorrectWallet = localNobleWallet?.address === nobleAddress;

    if (!isCorrectWallet || localNobleWallet == null) return undefined;

    return {
      localNobleWallet,
      sourceAccount,
      parentSubaccountInfo,
    };
  }
);

export function createNobleTransactionStoreEffect<T>(
  store: RootStore,
  config: NobleChainTransactionConfig<T>
) {
  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectNobleTxAuthorizedAccount, config.selector],
    (network, nobleTxAuthorizedAccount, selectorResult) => {
      if (!nobleTxAuthorizedAccount) return undefined;
      const { localNobleWallet, sourceAccount, parentSubaccountInfo } = nobleTxAuthorizedAccount;

      return {
        network,
        localNobleWallet,
        parentSubaccountInfo,
        sourceAccount,
        data: selectorResult,
      };
    }
  );

  return createStoreEffect(store, fullSelector, (selectorResults) => {
    if (selectorResults == null) {
      return undefined;
    }

    const { network, localNobleWallet, parentSubaccountInfo, sourceAccount, data } =
      selectorResults;
    const environmentInfo = ENVIRONMENT_CONFIG_MAP[network];
    const chainId = environmentInfo.dydxChainId as DydxChainId;
    const nobleClientRpcUrl = environmentInfo.endpoints.nobleValidator;
    const tokenConfig = TOKEN_CONFIG_MAP[chainId];

    const wallet = {
      sourceAccount,
      dydxAddress: parentSubaccountInfo.wallet,
      nobleLocalWallet: localNobleWallet,
    };

    const environment = {
      nobleClientRpcUrl,
      tokenConfig,
      chainId,
    };

    const cleanup = config.handle(environment, wallet, data);

    return () => {
      cleanup?.();
    };
  });
}
