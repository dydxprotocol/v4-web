import { CompositeClient, LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';
import { groupBy } from 'lodash';

import { TransactionMemo } from '@/constants/analytics';
import { USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';
import { IndexerPerpetualPositionStatus, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { stringifyTransactionError } from '@/lib/errors';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { objectEntries, objectFromEntries } from '@/lib/objectHelpers';
import { isPresent } from '@/lib/typeUtils';

import { isParentSubaccount } from '../calculators/subaccount';
import { wrapOperationFailure, wrapOperationSuccess } from '../lib/operationResult';
import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore, BonsaiRaw } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectTxAuthorizedAccount } from '../selectors/accountTransaction';

export function setUpReclaimChildSubaccountBalancesLifecycle(store: RootStore) {
  const selector = createAppSelector(
    [selectTxAuthorizedAccount, BonsaiCore.account.openOrders.data, BonsaiRaw.parentSubaccountBase],
    (authorizedAccount, openOrders, parentSubaccountBase) => {
      if (!authorizedAccount || parentSubaccountBase == null) {
        return undefined;
      }
      const groupedPositions = objectFromEntries(
        objectEntries(parentSubaccountBase.childSubaccounts).map(
          ([childSubaccountNumber, childSubaccount]) => [
            childSubaccountNumber,
            {
              marketPositions: objectEntries(childSubaccount?.openPerpetualPositions ?? {})
                .map(([marketId, position]) =>
                  position.status === IndexerPerpetualPositionStatus.OPEN ? marketId : undefined
                )
                .filter(isPresent),
              usdcBalance:
                childSubaccount?.assetPositions.USDC?.side === IndexerPositionSide.LONG
                  ? MustBigNumber(childSubaccount.assetPositions.USDC.size)
                  : BIG_NUMBERS.ZERO,
            },
          ]
        )
      );

      const groupedOrders = groupBy(openOrders, (o) => o.subaccountNumber);

      const reclaimableChildSubaccounts: Array<{
        subaccountNumber: string;
        usdcBalance: BigNumber;
      }> = objectEntries(groupedPositions)
        .map(([subaccountNumber, subaccount]) => {
          const isChildSubaccount = !isParentSubaccount(subaccountNumber);
          const hasUsdc = subaccount.usdcBalance.gt(0);
          const hasNoPositions = subaccount.marketPositions.length === 0;
          const hasNoOrders = (groupedOrders[subaccountNumber]?.length ?? 0) === 0;

          // TODO: Add a check to block reclaiming if the childSubaccount has an outgoing Isolated Margin Order.

          if (!hasUsdc || !isChildSubaccount || !hasNoPositions || !hasNoOrders) {
            return undefined;
          }

          return {
            subaccountNumber,
            usdcBalance: subaccount.usdcBalance,
          };
        })
        .filter(isPresent);

      return {
        ...authorizedAccount,
        reclaimableChildSubaccounts,
      };
    }
  );

  const activeReclaims = createSemaphore();

  async function doUsdcTransfer(
    client: CompositeClient,
    localDydxWallet: LocalWallet,
    parentSubaccountInfo: {
      wallet: string | undefined;
      subaccount: number;
    },
    childSubaccountFunds: {
      subaccountNumber: string;
      usdcBalance: BigNumber;
    }
  ) {
    try {
      if (!parentSubaccountInfo.wallet) {
        throw new Error('Parent subaccount wallet is not set');
      }

      const subaccountClient = new SubaccountClient(
        localDydxWallet!,
        parseInt(childSubaccountFunds.subaccountNumber, 10)
      );

      logBonsaiInfo(
        'reclaimChildSubaccountBalancesLifecycle',
        'attempting to reclaim funds from child subaccount',
        {
          subaccountNumber: childSubaccountFunds.subaccountNumber,
          usdcBalance: childSubaccountFunds.usdcBalance.toString(),
        }
      );

      const tx = await client.transferToSubaccount(
        subaccountClient,
        parentSubaccountInfo.wallet,
        parentSubaccountInfo.subaccount,
        childSubaccountFunds.usdcBalance.toFixed(USDC_DECIMALS),
        TransactionMemo.reclaimIsolatedMarginFunds
      );

      const parsedTx = parseToPrimitives(tx);

      logBonsaiInfo(
        'reclaimChildSubaccountBalancesLifecycle',
        'successfully reclaimed child subaccount funds',
        {
          subaccountNumber: childSubaccountFunds.subaccountNumber,
          usdcBalance: childSubaccountFunds.usdcBalance.toString(),
          tx: parsedTx,
        }
      );

      return wrapOperationSuccess(parsedTx);
    } catch (error) {
      const parsed = stringifyTransactionError(error);

      logBonsaiError(
        'reclaimChildSubaccountBalancesLifecycle',
        'Failed to reclaim child subaccount funds',
        {
          error,
        }
      );

      return wrapOperationFailure(parsed);
    }
  }

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null || !data.localDydxWallet || !data.parentSubaccountInfo.wallet) {
        return undefined;
      }

      async function reclaimChildSubaccountBalances() {
        const { reclaimableChildSubaccounts, localDydxWallet, parentSubaccountInfo } = data!;

        await Promise.all(
          reclaimableChildSubaccounts.map((childSubaccountFunds) => {
            return doUsdcTransfer(
              compositeClient,
              localDydxWallet!,
              parentSubaccountInfo,
              childSubaccountFunds
            );
          })
        );
      }

      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      activeReclaims
        .run(async () => {
          reclaimChildSubaccountBalances();
        })
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          logBonsaiError(
            'reclaimChildSubaccountBalancesLifecycle',
            'Failed to reclaim child subaccount funds',
            {
              error,
            }
          );
        });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    activeReclaims.clear();
    noopCleanupEffect();
  };
}
