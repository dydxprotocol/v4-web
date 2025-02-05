import { useEffect, useRef } from 'react';

import { StatusState } from '@skip-go/client';
import { formatUnits } from 'viem';

import { USDC_DECIMALS } from '@/constants/tokens';

import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch } from '@/state/appTypes';
import { isDeposit, isWithdraw, updateDeposit, updateWithdraw } from '@/state/transfers';
import { selectPendingTransfers } from '@/state/transfersSelectors';

import { useSkipClient } from './transfers/skipClient';
import { useAccounts } from './useAccounts';
import { useParameterizedSelector } from './useParameterizedSelector';

export function useUpdateTransfers() {
  const { dydxAddress } = useAccounts();
  const dispatch = useAppDispatch();
  const { skipClient } = useSkipClient();

  const pendingTransfers = useParameterizedSelector(selectPendingTransfers, dydxAddress);
  // keep track of the transactions for which we've already started querying for statuses
  const transactionToCallback = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!dydxAddress || !pendingTransfers.length) return;

    for (let i = 0; i < pendingTransfers.length; i += 1) {
      const transfer = pendingTransfers[i]!;
      const { chainId, txHash } = transfer;
      const transferKey = `${chainId}-${txHash}`;
      if (transactionToCallback.current[transferKey]) continue;

      transactionToCallback.current[transferKey] = true;

      skipClient.waitForTransaction({ chainID: chainId, txHash }).then((response) => {
        // Assume the final asset transfer is always USDC
        const finalAmount = response.transferAssetRelease?.amount
          ? formatUnits(BigInt(response.transferAssetRelease.amount), USDC_DECIMALS)
          : undefined;

        const status = handleResponseStatus(response.status);
        if (isDeposit(transfer)) {
          dispatch(
            updateDeposit({
              dydxAddress,
              deposit: {
                ...transfer,
                finalAmountUsd: finalAmount,
                status,
              },
            })
          );
        }

        if (isWithdraw(transfer)) {
          dispatch(
            updateWithdraw({
              dydxAddress,
              withdraw: {
                ...transfer,
                finalAmountUsd: finalAmount,
                status,
              },
            })
          );
        }

        if (status === 'success') {
          appQueryClient.invalidateQueries({
            queryKey: ['validator', 'accountBalances'],
            exact: false,
          });
        }
      });
    }
  }, [dydxAddress, pendingTransfers, skipClient, dispatch]);
}

function handleResponseStatus(status: StatusState) {
  switch (status) {
    case 'STATE_ABANDONED':
    case 'STATE_COMPLETED_ERROR':
    case 'STATE_PENDING_ERROR':
    case 'STATE_UNKNOWN':
      return 'error';
    case 'STATE_COMPLETED':
    case 'STATE_COMPLETED_SUCCESS':
      return 'success';
    default:
      return 'pending';
  }
}
