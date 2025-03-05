import { BonsaiCore } from '@/bonsai/ontology';
import { selectNobleClientReady, selectParentSubaccountInfo } from '@/bonsai/socketSelectors';
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
import { CompositeClientManager } from './compositeClientManager';

type NobleChainTransactionConfig<T> = {
  selector: (state: RootState) => T;
  onResultUpdate: (
    environment: {
      nobleClientRpcUrl: string;
      tokenConfig: (typeof TOKEN_CONFIG_MAP)[DydxChainId];
      chainId: DydxChainId;
    },
    wallet: {
      sourceAccount: SourceAccount;
      nobleLocalWallet: LocalWallet;
    },
    selectorResult: NoInfer<T>
  ) => void | (() => void);
};

export function createNobleTransactionStoreEffect<T>(
  store: RootStore,
  config: NobleChainTransactionConfig<T>
) {
  const fullSelector = createAppSelector(
    [
      getSelectedNetwork,
      selectNobleClientReady,
      selectParentSubaccountInfo,
      calculateIsAccountViewOnly,
      BonsaiCore.compliance.data,
      getLocalWalletNonce,
      getSourceAccount,
      config.selector,
    ],
    (
      network,
      nobleClientReady,
      parentSubaccountInfo,
      isAccountViewOnly,
      compliance,
      localWalletNonce,
      sourceAccount,
      selectorResult
    ) => {
      const isAccountRestrictionFree =
        !isAccountViewOnly &&
        ![
          ComplianceStatus.BLOCKED,
          ComplianceStatus.CLOSE_ONLY,
          ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
        ].includes(compliance.status) &&
        compliance.geo &&
        !isBlockedGeo(compliance.geo);

      return {
        infrastructure: {
          network,
          nobleClientReady,
        },
        account: {
          isAccountRestrictionFree,
          localWalletNonce,
          parentSubaccountInfo,
          sourceAccount,
        },
        data: selectorResult,
      };
    }
  );

  return createStoreEffect(store, fullSelector, ({ infrastructure, account, data }) => {
    if (
      !infrastructure.nobleClientReady ||
      !account.parentSubaccountInfo.wallet ||
      !account.isAccountRestrictionFree ||
      account.localWalletNonce == null
    ) {
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };
    const chainId = ENVIRONMENT_CONFIG_MAP[infrastructure.network].dydxChainId as DydxChainId;
    const nobleClientRpcUrl =
      ENVIRONMENT_CONFIG_MAP[infrastructure.network].endpoints.nobleValidator;

    const localNobleWallet = localWalletManager.getLocalNobleWallet(account.localWalletNonce); // Will be undefined if disconnected or connected w/ Keplr

    const convertedWalletAddress = convertBech32Address({
      address: account.parentSubaccountInfo.wallet,
      bech32Prefix: NOBLE_BECH32_PREFIX,
    });

    const isCorrectWallet = localNobleWallet?.address === convertedWalletAddress;

    const canWalletTransact = Boolean(localNobleWallet?.offlineSigner && isCorrectWallet);

    if (!canWalletTransact || localNobleWallet == null) {
      return undefined;
    }

    const tokenConfig = TOKEN_CONFIG_MAP[chainId];

    const wallet = {
      sourceAccount: account.sourceAccount,
      nobleLocalWallet: localNobleWallet,
    };

    const environment = {
      nobleClientRpcUrl,
      tokenConfig,
      chainId,
    };

    const cleanup = config.onResultUpdate(environment, wallet, data);

    return () => {
      cleanup?.();
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
