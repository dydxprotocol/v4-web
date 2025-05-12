import { CompositeClient, LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { TransactionMemo } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { selectReclaimableChildSubaccountFunds } from '@/state/accountSelectors';
import { createAppSelector } from '@/state/appTypes';

import { runFn } from '@/lib/do';
import { stringifyTransactionError } from '@/lib/errors';
import { parseToPrimitives } from '@/lib/parseToPrimitives';
import { TimeEjectingSet } from '@/lib/timeEjectingSet';

import { wrapOperationFailure, wrapOperationSuccess } from '../lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import {
  selectTxAuthorizedCloseOnlyAccount,
  selectUserHasUsdcGasForTransaction,
} from '../selectors/accountTransaction';

const SLEEP_TIME = timeUnits.second * 10;

export function setUpReclaimChildSubaccountBalancesLifecycle(store: RootStore) {
  const selector = createAppSelector(
    [
      selectTxAuthorizedCloseOnlyAccount,
      selectReclaimableChildSubaccountFunds,
      selectUserHasUsdcGasForTransaction,
    ],
    (authorizedAccount, reclaimableChildSubaccounts, userHasUsdcGasForTransaction) => {
      if (!authorizedAccount || reclaimableChildSubaccounts == null) {
        return undefined;
      }

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

          // context: Cosmos wallets do not support our lifecycle methods and are instead handled within useNotificationTypes
          if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
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
