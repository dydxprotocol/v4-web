import { DEFAULT_TOAST_AUTO_CLOSE_MS } from '@/constants/notifications';
import { timeUnits } from '@/constants/time';

import { Icon, IconName } from '@/components/Icon';

import type { RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { addCustomNotification } from '@/state/notifications';

import { MaybeBigNumber } from '@/lib/numbers';

import { createStoreEffect } from '../lib/createStoreEffect';
import { selectParentSubaccountSummary } from '../selectors/account';
import { selectAccountBalances, selectAccountNobleUsdcBalance } from '../selectors/balances';

type DepositFlowState = {
  nobleBalance: string | undefined;
  walletBalance: string | undefined;
  subaccountBalance: string | undefined;
};

interface CleanupFn {
  (): void;
}

let previousState: DepositFlowState | null = null;
let lastNotificationTime = 0;
const NOTIFICATION_DEBOUNCE = timeUnits.second * 5; // Avoid spam

/**
 * Monitors QR deposit flow and shows toast notifications at each stage:
 * 1. Funds arrive on Noble (from QR code deposit)
 * 2. Funds arrive in dydx wallet (after Noble sweep)
 * 3. Funds arrive in subaccount (after auto-rebalance)
 */
export function setUpDepositNotificationLifecycle(store: RootStore) {
  const depositFlowSelector = createAppSelector(
    [selectAccountNobleUsdcBalance, selectAccountBalances, selectParentSubaccountSummary],
    (nobleBalance, walletBalances, subaccountSummary) => ({
      nobleBalance,
      walletBalance: walletBalances.usdcAmount,
      subaccountBalance: subaccountSummary?.equity.toString(),
    })
  );

  const SignalIconFn = Icon({ iconName: IconName.Signal, size: '1.5rem' });
  const CheckCircleIconFn = Icon({ iconName: IconName.CheckCircle, size: '1.5rem' });

  return createStoreEffect(
    store,
    depositFlowSelector,
    (currentState?: DepositFlowState): CleanupFn | undefined => {
      if (!currentState) return;

      const now = Date.now();

      // Skip if we just sent a notification (debounce)
      if (now - lastNotificationTime < NOTIFICATION_DEBOUNCE) {
        return;
      }

      // Initialize on first run
      if (!previousState) {
        previousState = currentState;
        return;
      }

      const prevNoble = MaybeBigNumber(previousState.nobleBalance);
      const currNoble = MaybeBigNumber(currentState.nobleBalance);
      const prevWallet = MaybeBigNumber(previousState.walletBalance);
      const currWallet = MaybeBigNumber(currentState.walletBalance);
      const prevSubaccount = MaybeBigNumber(previousState.subaccountBalance);
      const currSubaccount = MaybeBigNumber(currentState.subaccountBalance);

      // Stage 1: Noble balance increased (QR deposit received)
      if (prevNoble && currNoble && currNoble.gt(prevNoble)) {
        const diff = currNoble.minus(prevNoble);
        if (diff.gt(0.01)) {
          // More than 1 cent to avoid dust
          store.dispatch(
            addCustomNotification({
              id: `deposit-noble-${now}`,
              displayData: {
                toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                groupKey: `deposit-${now}`,
                slotTitleLeft: SignalIconFn,
                title: 'Deposit Detected',
                body: `${diff.toFixed(2)} USDC received on Noble. Bridging to dYdX...`,
              },
            })
          );
          lastNotificationTime = now;
        }
      }

      // Stage 2: Wallet balance increased (after Noble sweep or Turnkey bridge)
      if (prevWallet && currWallet && currWallet.gt(prevWallet)) {
        const diff = currWallet.minus(prevWallet);
        if (diff.gt(0.01)) {
          store.dispatch(
            addCustomNotification({
              id: `deposit-wallet-${now}`,
              displayData: {
                toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                groupKey: `deposit-${now}`,
                slotTitleLeft: SignalIconFn,
                title: 'Deposit Detected',
                body: `${diff.toFixed(2)} USDC arrived in wallet. Moving to trading account...`,
              },
            })
          );
          lastNotificationTime = now;
        }
      }

      // Stage 3: Subaccount balance increased (after auto-rebalance)
      if (prevSubaccount && currSubaccount && currSubaccount.gt(prevSubaccount)) {
        const diff = currSubaccount.minus(prevSubaccount);
        if (diff.gt(0.01)) {
          store.dispatch(
            addCustomNotification({
              id: `deposit-complete-${now}`,
              displayData: {
                toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS * 2, // Show longer for final notification
                groupKey: `deposit-${now}`,
                slotTitleLeft: CheckCircleIconFn, // This doesnt complain but also doesnt show the icon in browser...
                title: 'Deposit Confirmed',
                body: `${diff.toFixed(2)} USDC ready to trade!`,
              },
            })
          );
          lastNotificationTime = now;
        }
      }

      previousState = currentState;
    }
  );
}
