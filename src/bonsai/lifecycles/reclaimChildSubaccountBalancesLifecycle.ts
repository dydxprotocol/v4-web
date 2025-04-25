import { CompositeClient, LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';
import { groupBy } from 'lodash';

import { TransactionMemo } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { PlaceOrderStatuses } from '@/constants/trade';
import { WalletNetworkType } from '@/constants/wallets';
import { IndexerPerpetualPositionStatus } from '@/types/indexer/indexerApiGen';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { getLocalPlaceOrders } from '@/state/localOrdersSelectors';

import { runFn } from '@/lib/do';
import { stringifyTransactionError } from '@/lib/errors';
import { BIG_NUMBERS } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { parseToPrimitives } from '@/lib/parseToPrimitives';
import { TimeEjectingSet } from '@/lib/timeEjectingSet';
import { isPresent } from '@/lib/typeUtils';

import { isParentSubaccount } from '../calculators/subaccount';
import { wrapOperationFailure, wrapOperationSuccess } from '../lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import {
  selectTxAuthorizedAccount,
  selectUserHasUsdcGasForTransaction,
} from '../selectors/accountTransaction';

const SLEEP_TIME = timeUnits.second * 10;

export function setUpReclaimChildSubaccountBalancesLifecycle(store: RootStore) {
  const selector = createAppSelector(
    [
      selectTxAuthorizedAccount,
      BonsaiCore.account.openOrders.data,
      getLocalPlaceOrders,
      BonsaiCore.account.childSubaccountSummaries.data,
      BonsaiCore.account.parentSubaccountPositions.data,
      selectUserHasUsdcGasForTransaction,
    ],
    (
      authorizedAccount,
      openOrders,
      localPlaceOrders,
      childSubaccountSummaries,
      parentSubaccountPositions,
      userHasUsdcGasForTransaction
    ) => {
      if (
        !authorizedAccount ||
        childSubaccountSummaries == null ||
        parentSubaccountPositions == null
      ) {
        return undefined;
      }

      const openPositions = parentSubaccountPositions.filter(
        (position) =>
          !isParentSubaccount(position.subaccountNumber) &&
          position.status === IndexerPerpetualPositionStatus.OPEN
      );

      const groupedPositions = groupBy(openPositions, (p) => p.subaccountNumber);
      const groupedOrders = groupBy(openOrders, (o) => o.subaccountNumber);

      const summaries = objectEntries(childSubaccountSummaries)
        .map(([subaccountNumberStr, summary]) => {
          const subaccountNumber = parseInt(subaccountNumberStr, 10);
          if (isParentSubaccount(subaccountNumber) || groupedPositions[subaccountNumber] != null) {
            return undefined;
          }

          return {
            subaccountNumber,
            equity: summary?.equity ?? BIG_NUMBERS.ZERO,
          };
        })
        .filter(isPresent);

      const reclaimableChildSubaccounts: Array<{
        subaccountNumber: number;
        usdcBalance: BigNumber;
      }> = summaries
        .map(({ subaccountNumber, equity }) => {
          const hasUsdc = equity.gt(0);
          const hasNoOrders = (groupedOrders[subaccountNumber]?.length ?? 0) === 0;

          const hasLocalPlaceOrders = Object.values(localPlaceOrders).some(
            ({ cachedData, submissionStatus }) =>
              cachedData.subaccountNumber === subaccountNumber &&
              submissionStatus === PlaceOrderStatuses.Submitted
          );

          if (!hasUsdc || !hasNoOrders || hasLocalPlaceOrders) {
            return undefined;
          }

          return {
            subaccountNumber,
            usdcBalance: equity,
          };
        })
        .filter(isPresent);

      return {
        ...authorizedAccount,
        reclaimableChildSubaccounts,
        userHasUsdcGasForTransaction,
      };
    }
  );

  const activeReclaims = new TimeEjectingSet(timeUnits.minute);

  async function doUsdcTransfer(
    client: CompositeClient,
    localDydxWallet: LocalWallet,
    parentSubaccountInfo: {
      wallet: string | undefined;
      subaccount: number;
    },
    childSubaccountFunds: {
      subaccountNumber: number;
      usdcBalance: BigNumber;
    }
  ) {
    try {
      if (!parentSubaccountInfo.wallet) {
        throw new Error('Parent subaccount wallet is not set');
      }

      const subaccountClient = new SubaccountClient(
        localDydxWallet!,
        childSubaccountFunds.subaccountNumber
      );

      logBonsaiInfo(
        'reclaimChildSubaccountBalancesLifecycle',
        `attempting to reclaim funds from child subaccount (${childSubaccountFunds.subaccountNumber})`,
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
        `successfully reclaimed child subaccount (${childSubaccountFunds.subaccountNumber}) funds`,
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
        `Failed to reclaim child subaccount (${childSubaccountFunds.subaccountNumber}) funds`,
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
      if (
        data == null ||
        !data.localDydxWallet ||
        !data.parentSubaccountInfo.wallet ||
        !data.userHasUsdcGasForTransaction
      ) {
        return undefined;
      }

      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      runFn(async () => {
        try {
          const {
            reclaimableChildSubaccounts: reclaimableRaw,
            localDydxWallet,
            parentSubaccountInfo,
          } = data!;

          const reclaimableChildSubaccounts = reclaimableRaw.filter(
            (r) => !activeReclaims.has(r.subaccountNumber.toFixed(0))
          );
          if (reclaimableChildSubaccounts.length === 0) {
            return;
          }

          Promise.all(
            reclaimableChildSubaccounts.map(async (childSubaccountFunds) => {
              const subaccountString = childSubaccountFunds.subaccountNumber.toFixed(0);
              activeReclaims.add(subaccountString);
              await doUsdcTransfer(
                compositeClient,
                localDydxWallet!,
                parentSubaccountInfo,
                childSubaccountFunds
              );
              activeReclaims.add(subaccountString, SLEEP_TIME);
            })
          );
        } catch (error) {
          logBonsaiError(
            'reclaimChildSubaccountBalancesLifecycle',
            'Failed to reclaim child subaccount funds',
            {
              error,
            }
          );
        }
      });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    noopCleanupEffect();
  };
}
