import { BonsaiCore } from '@/bonsai/ontology';
import { selectCompositeClientReady, selectParentSubaccountInfo } from '@/bonsai/socketSelectors';
import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { CompositeClient, SubaccountClient } from '@dydxprotocol/v4-client-js';

import type { RootState, RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { getHasOfflineSigner } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { hdKeyManager } from '@/lib/hdKeyManager';

import { createStoreEffect } from '../../lib/createStoreEffect';
import { CompositeClientManager } from './compositeClientManager';

type ChainTransactionConfig<T> = {
  selector: (state: RootState) => T;
  onChainTransaction: (
    client: CompositeClient,
    subaccountClient: SubaccountClient,
    selectorResult: NoInfer<T>
  ) => void;
};

export function createChainTransactionStoreEffect<T>(
  store: RootStore,
  config: ChainTransactionConfig<T>
) {
  const fullSelector = createAppSelector(
    [
      getSelectedNetwork,
      selectCompositeClientReady,
      getHasOfflineSigner,
      selectParentSubaccountInfo,
      calculateIsAccountViewOnly,
      BonsaiCore.compliance.data,
      config.selector,
    ],
    (
      network,
      compositeClientReady,
      hasOfflineSigner,
      parentSubaccountInfo,
      isAccountViewOnly,
      compliance,
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
        infrastructure: { network, compositeClientReady, isAccountRestrictionFree },
        account: { parentSubaccountInfo, hasOfflineSigner },
        data: selectorResult,
      };
    }
  );

  return createStoreEffect(store, fullSelector, ({ infrastructure, account, data }) => {
    if (
      !infrastructure.compositeClientReady ||
      !account.parentSubaccountInfo.wallet ||
      !infrastructure.isAccountRestrictionFree
    ) {
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };

    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient!;
    const localDydxWallet = hdKeyManager.getLocalDydxWallet();
    const isCorrectWallet = localDydxWallet?.address === account.parentSubaccountInfo.wallet;

    const canWalletTransact = Boolean(
      account.hasOfflineSigner && localDydxWallet && isCorrectWallet
    );

    if (!canWalletTransact) {
      return undefined;
    }

    const subaccountClient = new SubaccountClient(
      localDydxWallet!,
      account.parentSubaccountInfo.subaccount
    );

    config.onChainTransaction(compositeClient, subaccountClient, data);

    return () => {
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
