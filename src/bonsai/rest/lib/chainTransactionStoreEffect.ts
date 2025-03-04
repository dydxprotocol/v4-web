import { BonsaiCore } from '@/bonsai/ontology';
import { selectCompositeClientReady, selectParentSubaccountInfo } from '@/bonsai/socketSelectors';
import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { CompositeClient, SubaccountClient } from '@dydxprotocol/v4-client-js';

import type { RootState, RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { SourceAccount } from '@/state/wallet';
import { getLocalWalletNonce, getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { localWalletManager } from '@/lib/hdKeyManager';

import { createStoreEffect } from '../../lib/createStoreEffect';
import { CompositeClientManager } from './compositeClientManager';

type ChainTransactionConfig<T> = {
  selector: (state: RootState) => T;
  onResultUpdate: (
    client: CompositeClient,
    wallet: {
      subaccountClient: SubaccountClient;
      sourceAccount: SourceAccount;
    },
    selectorResult: NoInfer<T>
  ) => void | (() => void);
};

export function createChainTransactionStoreEffect<T>(
  store: RootStore,
  config: ChainTransactionConfig<T>
) {
  const fullSelector = createAppSelector(
    [
      getSelectedNetwork,
      selectCompositeClientReady,
      selectParentSubaccountInfo,
      calculateIsAccountViewOnly,
      BonsaiCore.compliance.data,
      getLocalWalletNonce,
      getSourceAccount,
      config.selector,
    ],
    (
      network,
      compositeClientReady,
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
          compositeClientReady,
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
      !infrastructure.compositeClientReady ||
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

    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient!;
    const localDydxWallet = localWalletManager.getLocalWallet(account.localWalletNonce); // Will be undefined if disconnected or connected w/ Keplr
    const isCorrectWallet = localDydxWallet?.address === account.parentSubaccountInfo.wallet;

    const canWalletTransact = Boolean(localDydxWallet && isCorrectWallet);

    if (!canWalletTransact) {
      return undefined;
    }

    const subaccountClient = new SubaccountClient(
      localDydxWallet!,
      account.parentSubaccountInfo.subaccount
    );

    const wallet = {
      subaccountClient,
      sourceAccount: account.sourceAccount,
    };

    const cleanup = config.onResultUpdate(compositeClient, wallet, data);

    return () => {
      cleanup?.();
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
