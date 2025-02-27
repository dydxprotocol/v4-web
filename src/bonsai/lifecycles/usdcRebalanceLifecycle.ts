import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { TransactionMemo } from '@/constants/analytics';
import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { DydxAddress, WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { isWithdraw } from '@/state/transfers';
import { getTransfersByAddress } from '@/state/transfersSelectors';

import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { logBonsaiError } from '../logs';
import { BonsaiCore } from '../ontology';
import { createChainTransactionStoreEffect } from '../rest/lib/chainTransactionStoreEffect';
import { selectParentSubaccountInfo } from '../socketSelectors';

const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const balanceAndTransfersSelector = createAppSelector(
    [selectParentSubaccountInfo, BonsaiCore.account.balances.data, getTransfersByAddress],
    (parentSubaccountInfo, balances, transfersByAddress) => {
      const pendingWithdraws = parentSubaccountInfo.wallet
        ? transfersByAddress[parentSubaccountInfo.wallet as DydxAddress]?.filter(isWithdraw) ??
          EMPTY_ARR
        : EMPTY_ARR;

      const idleTimes = pendingWithdraws.reduce<number[]>((acc, w) => {
        if (w.transactions.some((t) => t.status === 'idle')) {
          if (w.updatedAt) {
            return [...acc, w.updatedAt];
          }
        }

        return acc;
      }, []);

      const hasNonExpiredPendingWithdraws = idleTimes.some(
        (t) => t > Date.now() - TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED
      );

      return {
        balances,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  let transferInProgress = false;

  function setTransferInProgress(value: boolean) {
    transferInProgress = value;
  }

  function getTransferInProgress() {
    return transferInProgress;
  }

  const cleanupEffect = createChainTransactionStoreEffect(store, {
    selector: balanceAndTransfersSelector,
    onChainTransaction: (compositeClient, { subaccountClient, sourceAccount }, data) => {
      const { balances, hasNonExpiredPendingWithdraws } = data;
      const usdcBalance = balances.usdcAmount;
      const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

      async function rebalanceWalletFunds() {
        if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
          const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
          const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);
          const isTransferInProgress = getTransferInProgress();

          if (isTransferInProgress) return;

          try {
            setTransferInProgress(true);
            if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
              await compositeClient.depositToSubaccount(
                subaccountClient,
                usdcBalanceBN.minus(AMOUNT_RESERVED_FOR_GAS_USDC).toFixed(USDC_DECIMALS),
                TransactionMemo.depositToSubaccount
              );
            } else if (shouldWithdraw) {
              await compositeClient.withdrawFromSubaccount(
                subaccountClient,
                MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
                  .minus(usdcBalanceBN)
                  .toFixed(USDC_DECIMALS),
                undefined,
                TransactionMemo.withdrawFromSubaccount
              );
            }
          } finally {
            setTransferInProgress(false);
          }
        }
      }

      try {
        // Don't auto-rebalance on Cosmos
        // TODO: Add notification to prompt user to rebalance manually
        if (sourceAccount.chain === WalletNetworkType.Cosmos) {
          return;
        }

        rebalanceWalletFunds();
      } catch (error) {
        logBonsaiError('usdcRebalanceLifecycle', 'Errr trying to rebalanceWalletFunds', error);
      }
    },
  });

  return () => {
    cleanupEffect();
    setTransferInProgress(false);
  };
}
