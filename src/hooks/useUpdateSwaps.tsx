import { useCallback, useEffect, useMemo, useRef } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import { formatUnits, parseUnits } from 'viem';

import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { DYDX_CHAIN_DYDX_DENOM, USDC_DECIMALS } from '@/constants/tokens';

import { useSkipClient } from '@/hooks/transfers/skipClient';
import { useAccounts } from '@/hooks/useAccounts';

import { getUserAddressesForRoute } from '@/views/dialogs/TransferDialogs/utils';

import { getSubaccount, getSubaccountFreeCollateral } from '@/state/accountSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getPendingSwaps } from '@/state/swapSelectors';
import { Swap, updateSwap } from '@/state/swaps';

import { track } from '@/lib/analytics/analytics';

import { useSubaccount } from './useSubaccount';

const SWAP_SLIPPAGE_PERCENT = '0.50'; // 0.50% (50 bps)

export const useUpdateSwaps = () => {
  const { withdraw } = useSubaccount();
  const dispatch = useAppDispatch();
  const { nobleAddress, dydxAddress, osmosisAddress, neutronAddress } = useAccounts();
  const { skipClient } = useSkipClient();

  const pendingSwaps = useAppSelector(getPendingSwaps);
  const parentSubaccountSummary = useAppSelector(getSubaccount);
  const parentSubaccountBalance = useAppSelector(getSubaccountFreeCollateral);
  const accountUsdcBalance = useAppSelector(BonsaiCore.account.balances.data).usdcAmount;

  const swapToCallback = useRef<{ [key: string]: boolean }>({});
  const withdrawToCallback = useRef<{ [key: string]: boolean }>({});

  const reservedForGasBigInt = parseUnits(`${AMOUNT_RESERVED_FOR_GAS_USDC}`, USDC_DECIMALS);

  const availableBalanceBigInt = useMemo(() => {
    if (!accountUsdcBalance) return BigInt(0);
    return parseUnits(accountUsdcBalance, USDC_DECIMALS);
  }, [accountUsdcBalance]);

  const subaccountBalanceBigInt = useMemo(() => {
    if (!parentSubaccountBalance) return BigInt(0);
    return parseUnits(`${parentSubaccountBalance}`, USDC_DECIMALS) - reservedForGasBigInt;
  }, [parentSubaccountBalance, reservedForGasBigInt]);

  const withdrawUsdcFromSubaccount = useCallback(
    async (amountRequired: bigint) => {
      if (!parentSubaccountSummary) {
        throw new Error('Parent subaccount not found');
      }
      if (subaccountBalanceBigInt <= amountRequired) {
        throw new Error('Insufficeient USDC balance in subaccount');
      }
      const tx = await withdraw(Number(formatUnits(amountRequired, USDC_DECIMALS)), 0);
      logBonsaiInfo('useUpdateSwaps', 'Withdrawing from subaccount', {
        usdcAmount: formatUnits(amountRequired, USDC_DECIMALS),
        tx,
      });
    },
    [subaccountBalanceBigInt, parentSubaccountSummary, withdraw]
  );

  const executeSwap = useCallback(
    async (swap: Swap) => {
      const { route } = swap;
      const userAddresses = getUserAddressesForRoute(
        route,
        // Don't need source account for swaps
        undefined,
        nobleAddress,
        dydxAddress,
        osmosisAddress,
        neutronAddress
      );

      await skipClient.executeRoute({
        route,
        userAddresses,
        slippageTolerancePercent: SWAP_SLIPPAGE_PERCENT,
        onTransactionBroadcast: async ({ txHash, chainId }) => {
          track(AnalyticsEvents.SwapSubmitted({ id: swap.id, txHash, ...route, chainId }));
        },
        onTransactionCompleted: async ({ chainId, txHash, status }) => {
          const errorStates = ['STATE_COMPLETED_ERROR', 'STATE_ABANDONED', 'STATE_PENDING_ERROR'];
          if (status?.state && errorStates.includes(status.state)) {
            logBonsaiError('useUpdateSwaps', 'Error executing swap', {
              txHash,
              swapId: swap.id,
              error: status.error,
              state: status.state,
            });
            dispatch(updateSwap({ swap: { ...swap, txHash, status: 'error' } }));
          } else {
            logBonsaiInfo('useUpdateSwaps', 'Swap completed', {
              txHash,
              swapId: swap.id,
            });

            track(AnalyticsEvents.SwapFinalized({ id: swap.id, txHash, chainId, ...route }));
            dispatch(updateSwap({ swap: { id: swap.id, txHash, status: 'success' } }));
          }
        },
      });
    },
    [dispatch, dydxAddress, neutronAddress, nobleAddress, osmosisAddress, skipClient]
  );

  useEffect(() => {
    if (!pendingSwaps.length) return;

    for (let i = 0; i < pendingSwaps.length; i += 1) {
      const swap = pendingSwaps[i]!;
      const { route, status } = swap;
      const inputAmountBigInt = BigInt(route.amountIn);
      const inputIsDydx = route.sourceAssetDenom === DYDX_CHAIN_DYDX_DENOM;
      if (status === 'pending') {
        // If swapping USDC to DyDx, USDC has to be moved from the subaccount to the account before the swap
        if (!inputIsDydx && availableBalanceBigInt < inputAmountBigInt) {
          if (withdrawToCallback.current[swap.id]) continue;
          withdrawToCallback.current[swap.id] = true;
          withdrawUsdcFromSubaccount(inputAmountBigInt)
            .then(() => {
              dispatch(updateSwap({ swap: { ...swap, status: 'pending-transfer' } }));
            })
            .catch((error) => {
              logBonsaiError('useUpdateSwaps', 'Error withdrawing from subaccount', {
                error,
              });

              track(
                AnalyticsEvents.SwapError({
                  id: swap.id,
                  step: 'withdraw-subaccount',
                  error: error.message,
                  ...route,
                })
              );

              dispatch(updateSwap({ swap: { ...swap, status: 'error' } }));
            });
        } else {
          if (swapToCallback.current[swap.id]) continue;
          swapToCallback.current[swap.id] = true;
          executeSwap(swap)
            .then(() => {
              appQueryClient.invalidateQueries({
                queryKey: ['validator', 'accountBalances'],
                exact: false,
              });
            })
            .catch((error) => {
              logBonsaiError('useUpdateSwaps', 'Error executing swap', {
                error,
                swapId: swap.id,
              });

              track(
                AnalyticsEvents.SwapError({
                  id: swap.id,
                  step: 'execute-swap',
                  error: error.message,
                  ...route,
                })
              );

              dispatch(updateSwap({ swap: { ...swap, status: 'error' } }));
            });
        }
      } else if (status === 'pending-transfer' && availableBalanceBigInt > inputAmountBigInt) {
        logBonsaiInfo('useUpdateSwaps', 'Balance transfer from subaccount completed');
        dispatch(updateSwap({ swap: { ...swap, status: 'pending' } }));
      }
    }
  }, [
    availableBalanceBigInt,
    subaccountBalanceBigInt,
    dispatch,
    executeSwap,
    pendingSwaps,
    withdrawUsdcFromSubaccount,
  ]);
};
