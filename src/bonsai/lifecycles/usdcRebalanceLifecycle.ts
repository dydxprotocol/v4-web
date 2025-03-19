import { SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { TransactionMemo } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { WalletNetworkType } from '@/constants/wallets';

import type { RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { appQueryClient } from '@/state/appQueryClient';
import { createAppSelector } from '@/state/appTypes';
import { selectHasNonExpiredPendingWithdraws } from '@/state/transfersSelectors';
import { getLocalWalletNonce, getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { localWalletManager } from '@/lib/hdKeyManager';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { sleep } from '@/lib/timeUtils';

import { createSemaphore, SupersededError } from '../lib/semaphore';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { BonsaiCore } from '../ontology';
import { createValidatorStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectChildSubaccountSummaries } from '../selectors/account';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { ComplianceStatus } from '../types/summaryTypes';

const selectTxAuthorizedAccount = createAppSelector(
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

    const localDydxWallet = localWalletManager.getLocalWallet(localWalletNonce);
    const isCorrectWallet = localDydxWallet?.address === parentSubaccountInfo.wallet;
    const canWalletTransact = Boolean(localDydxWallet && isCorrectWallet);

    if (!canWalletTransact) return undefined;

    return {
      localDydxWallet,
      sourceAccount,
      parentSubaccountInfo,
    };
  }
);

// Sleep time between rebalances to ensure that the subaccount has time to process the previous transaction
const SLEEP_TIME = timeUnits.second * 10;
const INVALIDATION_SLEEP_TIME = timeUnits.second * 10;

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const balanceAndTransfersSelector = createAppSelector(
    [
      selectTxAuthorizedAccount,
      BonsaiCore.account.balances.data,
      selectChildSubaccountSummaries,
      selectHasNonExpiredPendingWithdraws,
    ],
    (txAuthorizedAccount, balances, childSubaccountSummaries, hasNonExpiredPendingWithdraws) => {
      if (!txAuthorizedAccount || childSubaccountSummaries == null) {
        return undefined;
      }

      const { localDydxWallet, sourceAccount, parentSubaccountInfo } = txAuthorizedAccount;

      return {
        localDydxWallet,
        parentSubaccountInfo,
        sourceAccount,
        balances,
        childSubaccountSummaries,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  const activeRebalance = createSemaphore();

  const noopCleanupEffect = createValidatorStoreEffect(store, {
    selector: balanceAndTransfersSelector,
    handle: (_clientId, compositeClient, data) => {
      if (data == null) {
        return undefined;
      }

      async function rebalanceWalletFunds() {
        const {
          localDydxWallet,
          balances,
          childSubaccountSummaries,
          hasNonExpiredPendingWithdraws,
          parentSubaccountInfo,
        } = data!;
        const usdcBalance = balances.usdcAmount;
        const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

        if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
          const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
          const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

          if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
            const amountToDeposit = usdcBalanceBN
              .minus(AMOUNT_RESERVED_FOR_GAS_USDC)
              .toFixed(USDC_DECIMALS);

            logBonsaiInfo('usdcRebalanceLifecycle', 'depositing excess USDC into subaccount 0', {
              balance: usdcBalance,
              amountToDeposit,
              targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
            });

            const subaccountClient = new SubaccountClient(
              localDydxWallet!,
              parentSubaccountInfo.subaccount
            );

            await compositeClient.depositToSubaccount(
              subaccountClient,
              amountToDeposit,
              TransactionMemo.depositToSubaccount
            );

            await sleep(SLEEP_TIME);

            appQueryClient.invalidateQueries({
              queryKey: ['validator', 'accountBalances'],
              exact: false,
            });

            await sleep(INVALIDATION_SLEEP_TIME);
          } else if (shouldWithdraw) {
            const amountToWithdraw = MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
              .minus(usdcBalanceBN)
              .toFixed(USDC_DECIMALS);

            const maybeSubaccountNumber = objectEntries(childSubaccountSummaries).find(
              ([_, summary]) => {
                if (summary.freeCollateral.gt(amountToWithdraw)) {
                  return true;
                }

                return false;
              }
            )?.[0];

            if (maybeSubaccountNumber == null) {
              return;
            }

            const subaccountNumber = Number(maybeSubaccountNumber);
            const subaccountClient = new SubaccountClient(localDydxWallet!, subaccountNumber);

            logBonsaiInfo('usdcRebalanceLifecycle', 'withdrawing funds for gas', {
              balance: usdcBalance,
              amountToWithdraw,
              targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
              subaccountNumber,
            });

            await compositeClient.withdrawFromSubaccount(
              subaccountClient,
              amountToWithdraw,
              undefined,
              TransactionMemo.withdrawFromSubaccount
            );

            await sleep(SLEEP_TIME);

            appQueryClient.invalidateQueries({
              queryKey: ['validator', 'accountBalances'],
              exact: false,
            });

            await sleep(INVALIDATION_SLEEP_TIME);
          }
        }
      }

      // Don't auto-rebalance on Cosmos
      // TODO: Add notification to prompt user to rebalance manually
      if (data.sourceAccount.chain === WalletNetworkType.Cosmos) {
        return undefined;
      }

      activeRebalance
        .run(() => rebalanceWalletFunds())
        .catch((error) => {
          if (error instanceof SupersededError) {
            return;
          }

          logBonsaiError('usdcRebalanceLifecycle', 'error trying to rebalanceWalletFunds', {
            error,
          });
        });

      return undefined;
    },
    handleNoClient: undefined,
  });

  return () => {
    noopCleanupEffect();
    activeRebalance.clear();
  };
}
