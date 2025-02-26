import { BECH32_PREFIX, LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { TransactionMemo } from '@/constants/analytics';
import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';
import { DydxAddress } from '@/constants/wallets';

import { type RootStore } from '@/state/_store';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { isWithdraw } from '@/state/transfers';
import { getTransfersByAddress } from '@/state/transfersSelectors';
import { getHasOfflineSigner } from '@/state/walletSelectors';

import { hdKeyManager, isBlockedGeo } from '@/lib/compliance';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { createStoreEffect } from '../lib/createStoreEffect';
import { logBonsaiError } from '../logs';
import { BonsaiCore } from '../ontology';
import { CompositeClientManager } from '../rest/lib/compositeClientManager';
import { selectCompositeClientReady, selectParentSubaccountInfo } from '../socketSelectors';
import { ComplianceStatus } from '../types/summaryTypes';

const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;

/**
 * @description Lifecycle for rebalancing USDC across chains. This will handle auto-deposits from dYdX Wallet as well as auto-withdrawals to dYdX Wallet.
 */
export function setUpUsdcRebalanceLifecycle(store: RootStore) {
  const selectAccountForRebalance = createAppSelector(
    [
      selectParentSubaccountInfo,
      calculateIsAccountViewOnly,
      BonsaiCore.compliance.data,
      BonsaiCore.account.balances.data,
      getTransfersByAddress,
      getHasOfflineSigner,
    ],
    (
      parentSubaccountInfo,
      isAccountViewOnly,
      compliance,
      balances,
      transfersByAddress,
      hasOfflineSigner
    ) => {
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
        hasOfflineSigner,
      };
    }
  );

  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectCompositeClientReady, selectAccountForRebalance],
    (network, compositeClientReady, selectorResult) => ({
      infrastructure: { network, compositeClientReady },
      data: selectorResult,
    })
  );

  let transferInProgress = false;

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
      hasOfflineSigner,
    } = data;

    const isAccountRestrictionFree =
      !isAccountViewOnly &&
      ![
        ComplianceStatus.BLOCKED,
        ComplianceStatus.CLOSE_ONLY,
        ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
      ].includes(compliance.status) &&
      compliance.geo &&
      !isBlockedGeo(compliance.geo);

    const canWalletCompleteAction = Boolean(
      parentSubaccountInfo.wallet != null &&
        hasOfflineSigner &&
        hdKeyManager.getHdkey(parentSubaccountInfo.wallet)
    );

    if (!canWalletCompleteAction || !isAccountRestrictionFree) {
      return undefined;
    }

    const usdcBalance = balances.usdcAmount;
    const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

    let isDead = false;

    async function rebalanceWalletFunds() {
      if (
        !isDead &&
        !transferInProgress &&
        usdcBalance &&
        usdcBalanceBN != null &&
        usdcBalanceBN.gt(0)
      ) {
        // Check if we need to rebalance the wallet/subaccount
        const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
        const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

        const mnemonic = hdKeyManager.getHdkey(parentSubaccountInfo.wallet!)?.mnemonic;
        const localWallet = mnemonic
          ? await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX)
          : undefined;

        if (!localWallet)
          return () => {
            isDead = false;
            transferInProgress = false;
          };

        const subaccountClient = new SubaccountClient(localWallet, parentSubaccountInfo.subaccount);

        if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
          // Deposit
          compositeClient.depositToSubaccount(
            subaccountClient,
            usdcBalanceBN.minus(AMOUNT_RESERVED_FOR_GAS_USDC).toFixed(USDC_DECIMALS),
            TransactionMemo.depositToSubaccount
          );
          transferInProgress = true;
        } else if (shouldWithdraw) {
          // Withdraw
          compositeClient.withdrawFromSubaccount(
            subaccountClient,
            MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC).minus(usdcBalanceBN).toFixed(USDC_DECIMALS),
            undefined,
            TransactionMemo.withdrawFromSubaccount
          );
          transferInProgress = true;
        }
      }

      return () => {
        isDead = true;
        transferInProgress = false;
      };
    }

    try {
      rebalanceWalletFunds();
    } catch (error) {
      logBonsaiError('usdcRebalanceLifecycle', 'Errr trying to rebalanceWalletFunds', error);
    }

    return () => {
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
