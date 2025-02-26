import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';
import { DydxAddress } from '@/constants/wallets';

import { type RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { isWithdraw } from '@/state/transfers';
import { getTransfersByAddress } from '@/state/transfersSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { isTruthy } from '@/lib/isTruthy';
import { MaybeBigNumber } from '@/lib/numbers';

import { createStoreEffect } from '../lib/createStoreEffect';
import { BonsaiCore } from '../ontology';
import { CompositeClientManager } from '../rest/lib/compositeClientManager';
import { selectCompositeClientReady, selectParentSubaccountInfo } from '../socketSelectors';
import { ComplianceStatus } from '../types/summaryTypes';

const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function usdcRebalanceLifecycle(store: RootStore) {
  const selectAccountWalletAndBalances = createAppSelector(
    [
      selectParentSubaccountInfo,
      calculateIsAccountViewOnly,
      BonsaiCore.compliance.data,
      BonsaiCore.account.balances.data,
      getTransfersByAddress,
    ],
    (parentSubaccountInfo, isAccountViewOnly, compliance, balances, transfersByAddress) => {
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
        parentSubaccountInfo,
        balances,
        compliance,
        isAccountViewOnly,
        hasNonExpiredPendingWithdraws,
      };
    }
  );

  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectCompositeClientReady, selectAccountWalletAndBalances],
    (network, compositeClientReady, selectorResult) => ({
      infrastructure: { network, compositeClientReady },
      data: selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, ({ infrastructure, data }) => {
    // Set up CompositeClient
    if (!infrastructure.compositeClientReady) {
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };

    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient!;

    const {
      parentSubaccountInfo,
      balances,
      compliance,
      isAccountViewOnly,
      hasNonExpiredPendingWithdraws,
    } = data;

    const isAccountRestrictionFree =
      !isAccountViewOnly &&
      [
        ComplianceStatus.BLOCKED,
        ComplianceStatus.CLOSE_ONLY,
        ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
      ].includes(compliance.status) &&
      compliance.geo &&
      !isBlockedGeo(compliance.geo);

    if (!isTruthy(parentSubaccountInfo.wallet) || !isAccountRestrictionFree) {
      return undefined;
    }

    const usdcBalance = balances.usdcAmount;
    const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

    if (usdcBalanceBN != null && usdcBalanceBN.gt(0)) {
      // Check if we need to rebalance the wallet/subaccount
      const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
      const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

      if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
        // Deposit
      } else if (shouldWithdraw) {
        // Withdraw
      }
    }

    return () => {
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
